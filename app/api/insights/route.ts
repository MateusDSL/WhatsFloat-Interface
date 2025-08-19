// app/api/insights/route.ts

import { NextResponse } from 'next/server';
import { supabase, Lead } from '@/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

// --- FERRAMENTAS DE ANÁLISE AVANÇADAS ---

// Análise de performance por campanha e conjunto
function getCampaignPerformance(leads: Lead[]) {
  // Análise por campanha formatada (nome_campanha_formatado) - EXCLUINDO "Não Rastreada"
  const leadsByFormattedCampaign = leads.reduce((acc, lead) => {
    const campaign = lead.nome_campanha_formatado;
    
    // Pular leads sem campanha formatada ou que não contêm formatação
    if (!campaign || !campaign.includes('[') || campaign === 'Não Rastreada') {
      return acc;
    }
    
    if (!acc[campaign]) {
      acc[campaign] = {
        count: 0,
        beaconCount: 0,
        sources: new Set(),
        utmCampaigns: new Set(),
        recentLeads: 0,
        oldLeads: 0
      };
    }
    
    acc[campaign].count++;
    if (lead.is_becon) acc[campaign].beaconCount++;
    if (lead.origem) acc[campaign].sources.add(lead.origem);
    if (lead.utm_campaign) acc[campaign].utmCampaigns.add(lead.utm_campaign);
    
    // Análise temporal (últimos 30 dias vs anteriores)
    const leadDate = new Date(lead.created_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    if (leadDate >= thirtyDaysAgo) {
      acc[campaign].recentLeads++;
    } else {
      acc[campaign].oldLeads++;
    }
    
    return acc;
  }, {} as any);

  // Análise por conjunto (utm_campaign) - EXCLUINDO "Não Rastreado"
  const leadsByUtmCampaign = leads.reduce((acc, lead) => {
    const utmCampaign = lead.utm_campaign;
    
    // Pular leads sem conjunto UTM ou que são "Não Rastreado"
    if (!utmCampaign || utmCampaign === 'N/A' || utmCampaign === 'Não Rastreado') {
      return acc;
    }
    
    if (!acc[utmCampaign]) {
      acc[utmCampaign] = {
        count: 0,
        beaconCount: 0,
        sources: new Set(),
        campaigns: new Set(),
        recentLeads: 0,
        oldLeads: 0
      };
    }
    
    acc[utmCampaign].count++;
    if (lead.is_becon) acc[utmCampaign].beaconCount++;
    if (lead.origem) acc[utmCampaign].sources.add(lead.origem);
    if (lead.nome_campanha_formatado) acc[utmCampaign].campaigns.add(lead.nome_campanha_formatado);
    
    // Análise temporal (últimos 30 dias vs anteriores)
    const leadDate = new Date(lead.created_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    if (leadDate >= thirtyDaysAgo) {
      acc[utmCampaign].recentLeads++;
    } else {
      acc[utmCampaign].oldLeads++;
    }
    
    return acc;
  }, {} as any);

  // Converter para formato mais limpo
  const formattedCampaignAnalysis = Object.entries(leadsByFormattedCampaign).map(([campaign, data]: [string, any]) => ({
    campaign,
    totalLeads: data.count,
    beaconRate: ((data.beaconCount / data.count) * 100).toFixed(1),
    uniqueSources: data.sources.size,
    uniqueUtmCampaigns: data.utmCampaigns.size,
    recentActivity: data.recentLeads,
    growthRate: data.oldLeads > 0 ? ((data.recentLeads - data.oldLeads) / data.oldLeads * 100).toFixed(1) : 'N/A'
  }));

  const utmCampaignAnalysis = Object.entries(leadsByUtmCampaign).map(([utmCampaign, data]: [string, any]) => ({
    utmCampaign,
    totalLeads: data.count,
    beaconRate: ((data.beaconCount / data.count) * 100).toFixed(1),
    uniqueSources: data.sources.size,
    uniqueCampaigns: data.campaigns.size,
    recentActivity: data.recentLeads,
    growthRate: data.oldLeads > 0 ? ((data.recentLeads - data.oldLeads) / data.oldLeads * 100).toFixed(1) : 'N/A'
  }));

  // Análise de leads não rastreados
  const untrackedLeads = leads.filter(lead => {
    const hasFormattedCampaign = lead.nome_campanha_formatado && lead.nome_campanha_formatado.includes('[');
    const hasUtmCampaign = lead.utm_campaign && lead.utm_campaign !== 'N/A' && lead.utm_campaign !== 'Não Rastreado';
    return !hasFormattedCampaign && !hasUtmCampaign;
  });

  const untrackedAnalysis = {
    count: untrackedLeads.length,
    beaconCount: untrackedLeads.filter(l => l.is_becon).length,
    beaconRate: untrackedLeads.length > 0 ? ((untrackedLeads.filter(l => l.is_becon).length / untrackedLeads.length) * 100).toFixed(1) : '0',
    percentage: ((untrackedLeads.length / leads.length) * 100).toFixed(1)
  };

  return {
    totalLeads: leads.length,
    trackedLeads: leads.length - untrackedLeads.length,
    untrackedLeads: untrackedAnalysis,
    topCampaigns: formattedCampaignAnalysis.sort((a, b) => b.totalLeads - a.totalLeads).slice(0, 5),
    bottomCampaigns: formattedCampaignAnalysis.sort((a, b) => a.totalLeads - b.totalLeads).slice(0, 5),
    topUtmCampaigns: utmCampaignAnalysis.sort((a, b) => b.totalLeads - a.totalLeads).slice(0, 5),
    bottomUtmCampaigns: utmCampaignAnalysis.sort((a, b) => a.totalLeads - b.totalLeads).slice(0, 5),
    formattedCampaignAnalysis,
    utmCampaignAnalysis
  };
}

// Análise temporal avançada
function getTemporalAnalysis(leads: Lead[]) {
  const now = new Date();
  const leadsWithDates = leads.map(lead => ({
    ...lead,
    date: new Date(lead.created_at),
    dayOfWeek: new Date(lead.created_at).getDay(),
    hour: new Date(lead.created_at).getHours(),
    isRecent: new Date(lead.created_at) >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 dias
  }));

  // Análise por dia da semana
  const dayOfWeekAnalysis = Array.from({ length: 7 }, (_, i) => {
    const dayLeads = leadsWithDates.filter(lead => lead.dayOfWeek === i);
    return {
      day: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][i],
      count: dayLeads.length,
      beaconRate: dayLeads.length > 0 ? ((dayLeads.filter(l => l.is_becon).length / dayLeads.length) * 100).toFixed(1) : '0'
    };
  });

  // Análise por hora do dia
  const hourAnalysis = Array.from({ length: 24 }, (_, i) => {
    const hourLeads = leadsWithDates.filter(lead => lead.hour === i);
    return {
      hour: i,
      count: hourLeads.length,
      beaconRate: hourLeads.length > 0 ? ((hourLeads.filter(l => l.is_becon).length / hourLeads.length) * 100).toFixed(1) : '0'
    };
  });

  // Tendência semanal
  const weeklyTrend = leadsWithDates.filter(lead => lead.isRecent).length;

  return {
    dayOfWeekAnalysis,
    hourAnalysis,
    weeklyTrend,
    totalLeads: leads.length
  };
}

// Análise geográfica
function getGeographicAnalysis(leads: Lead[]) {
  const stateCounts: { [key: string]: { count: number; beaconCount: number; sources: Set<string> } } = {};
  
  leads.forEach(lead => {
    // Extrair estado do telefone (assumindo formato brasileiro)
    const phone = lead.phone.replace(/\D/g, '');
    let state = 'Não Identificado';
    
    if (phone.length >= 10) {
      const ddd = phone.substring(0, 2);
      // Mapeamento básico de DDD para estado
      const dddToState: { [key: string]: string } = {
        '11': 'SP', '12': 'SP', '13': 'SP', '14': 'SP', '15': 'SP', '16': 'SP', '17': 'SP', '18': 'SP', '19': 'SP',
        '21': 'RJ', '22': 'RJ', '24': 'RJ',
        '27': 'ES', '28': 'ES',
        '31': 'MG', '32': 'MG', '33': 'MG', '34': 'MG', '35': 'MG', '37': 'MG', '38': 'MG',
        '41': 'PR', '42': 'PR', '43': 'PR', '44': 'PR', '45': 'PR', '46': 'PR',
        '47': 'SC', '48': 'SC', '49': 'SC',
        '51': 'RS', '53': 'RS', '54': 'RS', '55': 'RS'
      };
      state = dddToState[ddd] || 'Outros';
    }

    if (!stateCounts[state]) {
      stateCounts[state] = { count: 0, beaconCount: 0, sources: new Set() };
    }
    
    stateCounts[state].count++;
    if (lead.is_becon) stateCounts[state].beaconCount++;
    if (lead.origem) stateCounts[state].sources.add(lead.origem);
  });

  const stateAnalysis = Object.entries(stateCounts).map(([state, data]) => ({
    state,
    count: data.count,
    beaconRate: ((data.beaconCount / data.count) * 100).toFixed(1),
    uniqueSources: data.sources.size
  })).sort((a, b) => b.count - a.count);

  return {
    stateAnalysis,
    topStates: stateAnalysis.slice(0, 5),
    totalLeads: leads.length
  };
}

// Análise de qualidade de dados
function getDataQualityReport(leads: Lead[]) {
  const totalLeads = leads.length;
  
  // Análise de completude
  const missingSource = leads.filter(l => !l.origem || l.origem === 'nao-identificado').length;
  const missingPhone = leads.filter(l => !l.phone || l.phone.length < 10).length;
  const missingName = leads.filter(l => !l.name || l.name.trim().length < 2).length;
  
  // Análise de rastreamento (não é "missing", mas sim "não rastreado")
  const untrackedLeads = leads.filter(l => {
    const hasFormattedCampaign = l.nome_campanha_formatado && l.nome_campanha_formatado.includes('[');
    const hasUtmCampaign = l.utm_campaign && l.utm_campaign !== 'N/A' && l.utm_campaign !== 'Não Rastreado';
    return !hasFormattedCampaign && !hasUtmCampaign;
  }).length;

  // Análise de consistência
  const duplicatePhones = leads.reduce((acc, lead) => {
    if (lead.phone) {
      acc[lead.phone] = (acc[lead.phone] || 0) + 1;
    }
    return acc;
  }, {} as { [key: string]: number });
  
  const duplicateCount = Object.values(duplicatePhones).filter(count => count > 1).length;

  // Análise de beacon
  const beaconLeads = leads.filter(l => l.is_becon).length;
  const beaconRate = ((beaconLeads / totalLeads) * 100).toFixed(1);

  // Análise de rastreamento UTM
  const leadsWithUtmData = leads.filter(l => l.utm_campaign && l.utm_campaign !== 'N/A').length;
  const utmTrackingRate = ((leadsWithUtmData / totalLeads) * 100).toFixed(1);

  return {
    totalLeads,
    completeness: {
      missingSource: { count: missingSource, percentage: ((missingSource / totalLeads) * 100).toFixed(1) },
      missingPhone: { count: missingPhone, percentage: ((missingPhone / totalLeads) * 100).toFixed(1) },
      missingName: { count: missingName, percentage: ((missingName / totalLeads) * 100).toFixed(1) }
    },
    tracking: {
      untrackedLeads: { count: untrackedLeads, percentage: ((untrackedLeads / totalLeads) * 100).toFixed(1) },
      trackedLeads: { count: totalLeads - untrackedLeads, percentage: (((totalLeads - untrackedLeads) / totalLeads) * 100).toFixed(1) }
    },
    consistency: {
      duplicatePhones: duplicateCount,
      duplicatePercentage: ((duplicateCount / totalLeads) * 100).toFixed(1)
    },
    beacon: {
      count: beaconLeads,
      rate: beaconRate
    },
    utmTracking: {
      count: leadsWithUtmData,
      rate: utmTrackingRate
    }
  };
}

// Análise de fontes de tráfego
function getSourceAnalysis(leads: Lead[]) {
  const sourceCounts: { [key: string]: { count: number; beaconCount: number; formattedCampaigns: Set<string>; utmCampaigns: Set<string>; utmTerms: Set<string> } } = {};
  
  leads.forEach(lead => {
    const source = lead.origem || 'Não Rastreada';
    if (!sourceCounts[source]) {
      sourceCounts[source] = { count: 0, beaconCount: 0, formattedCampaigns: new Set(), utmCampaigns: new Set(), utmTerms: new Set() };
    }
    
    sourceCounts[source].count++;
    if (lead.is_becon) sourceCounts[source].beaconCount++;
    if (lead.nome_campanha_formatado) sourceCounts[source].formattedCampaigns.add(lead.nome_campanha_formatado);
    if (lead.utm_campaign) sourceCounts[source].utmCampaigns.add(lead.utm_campaign);
    if (lead.utm_term) sourceCounts[source].utmTerms.add(lead.utm_term);
  });

  const sourceAnalysis = Object.entries(sourceCounts).map(([source, data]) => ({
    source,
    count: data.count,
    beaconRate: ((data.beaconCount / data.count) * 100).toFixed(1),
    uniqueFormattedCampaigns: data.formattedCampaigns.size,
    uniqueUtmCampaigns: data.utmCampaigns.size,
    uniqueUtmTerms: data.utmTerms.size
  })).sort((a, b) => b.count - a.count);

  return {
    sourceAnalysis,
    topSources: sourceAnalysis.slice(0, 5),
    totalLeads: leads.length
  };
}

// Análise de tendências e insights estratégicos
function getStrategicInsights(leads: Lead[], campaignPerformance: any, temporalAnalysis: any, geographicAnalysis: any, dataQuality: any, sourceAnalysis: any) {
  const insights = [];

  // Insights de performance - Campanhas formatadas
  const topCampaign = campaignPerformance.topCampaigns[0];
  const bottomCampaign = campaignPerformance.bottomCampaigns[0];
  
  if (topCampaign) {
    insights.push({
      type: 'performance',
      title: 'Campanha Líder',
      description: `${topCampaign.campaign} é a campanha mais eficaz com ${topCampaign.totalLeads} leads`,
      recommendation: 'Considere aumentar o investimento nesta campanha'
    });
  }

  if (bottomCampaign && bottomCampaign.totalLeads < 5) {
    insights.push({
      type: 'performance',
      title: 'Campanha com Baixo Desempenho',
      description: `${bottomCampaign.campaign} tem apenas ${bottomCampaign.totalLeads} leads`,
      recommendation: 'Avalie se deve pausar ou otimizar esta campanha'
    });
  }

  // Insights de performance - Conjuntos UTM
  const topUtmCampaign = campaignPerformance.topUtmCampaigns[0];
  const bottomUtmCampaign = campaignPerformance.bottomUtmCampaigns[0];
  
  if (topUtmCampaign) {
    insights.push({
      type: 'utm_performance',
      title: 'Conjunto Líder',
      description: `${topUtmCampaign.utmCampaign} é o conjunto mais eficaz com ${topUtmCampaign.totalLeads} leads`,
      recommendation: 'Otimize este conjunto de anúncios'
    });
  }

  if (bottomUtmCampaign && bottomUtmCampaign.totalLeads < 5) {
    insights.push({
      type: 'utm_performance',
      title: 'Conjunto com Baixo Desempenho',
      description: `${bottomUtmCampaign.utmCampaign} tem apenas ${bottomUtmCampaign.totalLeads} leads`,
      recommendation: 'Considere pausar ou reestruturar este conjunto'
    });
  }

  // Insights temporais
  const bestDay = temporalAnalysis.dayOfWeekAnalysis.reduce((best: any, current: any) => 
    current.count > best.count ? current : best
  );
  
  if (bestDay.count > 0) {
    insights.push({
      type: 'temporal',
      title: 'Melhor Dia da Semana',
      description: `${bestDay.day} é o dia com mais leads (${bestDay.count})`,
      recommendation: 'Programe campanhas especiais para este dia'
    });
  }

  // Insights geográficos
  const topState = geographicAnalysis.topStates[0];
  if (topState) {
    insights.push({
      type: 'geographic',
      title: 'Estado Principal',
      description: `${topState.state} é o estado com mais leads (${topState.count})`,
      recommendation: 'Foque esforços de marketing neste estado'
    });
  }

  // Insights de qualidade
  if (parseFloat(dataQuality.completeness.missingSource.percentage) > 20) {
    insights.push({
      type: 'quality',
      title: 'Problema de Rastreamento',
      description: `${dataQuality.completeness.missingSource.percentage}% dos leads não têm origem rastreada`,
      recommendation: 'Implemente melhor rastreamento de UTM'
    });
  }

  // Insights sobre leads não rastreados
  if (parseFloat(campaignPerformance.untrackedLeads.percentage) > 30) {
    insights.push({
      type: 'tracking',
      title: 'Alto Volume de Leads Não Rastreados',
      description: `${campaignPerformance.untrackedLeads.percentage}% dos leads não vieram de campanhas rastreadas`,
      recommendation: 'Implemente rastreamento UTM em todas as campanhas e verifique configurações'
    });
  } else if (parseFloat(campaignPerformance.untrackedLeads.percentage) > 10) {
    insights.push({
      type: 'tracking',
      title: 'Leads Não Rastreados Detectados',
      description: `${campaignPerformance.untrackedLeads.percentage}% dos leads não vieram de campanhas rastreadas`,
      recommendation: 'Verifique se todas as campanhas têm UTM configurado corretamente'
    });
  }

  return insights;
}

// --- LÓGICA PRINCIPAL DO AGENTE ---

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// --- PERSONA ESPECIALISTA EM MARKETING E ANÁLISE DE DADOS ---
const systemPrompt = `Você é um especialista em marketing digital e análise de dados para a empresa WhatsFloat. Você tem acesso COMPLETO a todos os dados de leads e pode fornecer análises profundas e insights estratégicos.

**Suas capacidades:**
- Análise de performance de campanhas
- Análise temporal COMPLETA (dias da semana, horários, tendências)
- Análise geográfica por estado
- Análise de qualidade de dados
- Análise de fontes de tráfego
- Identificação de tendências e padrões
- Recomendações estratégicas

**DADOS TEMPORAIS DISPONÍVEIS:**
- Análise por dia da semana (Domingo a Sábado)
- Análise por hora do dia (0h a 23h)
- Tendências semanais
- Dados de criação de leads com timestamps completos

**Formato de resposta:**
- Use Markdown para formatação
- Seja específico e baseado nos dados
- Forneça insights acionáveis
- Seja conversacional mas profissional
- SEMPRE use os dados temporais quando disponíveis
- **NÃO use gráficos ASCII, tabelas ou elementos visuais**
- Foque no conteúdo textual e insights diretos

    **Tipos de análise que você pode fazer:**
    1. **Performance**: Qual campanha e conjunto estão performando melhor?
    2. **Temporal**: Quando os leads chegam mais? (dias/horas específicos)
    3. **Geográfica**: De onde vêm os leads?
    4. **Qualidade**: Como está a qualidade dos dados e rastreamento UTM?
    5. **Tendências**: Que padrões você identifica?
    6. **Estratégico**: Que recomendações você tem?
    7. **UTM**: Análise de conjuntos de anúncios e termos de busca

**IMPORTANTE:** Você tem acesso TOTAL a todos os dados, incluindo análises temporais detalhadas. Use SEMPRE os dados disponíveis para responder perguntas sobre tempo, dias da semana, horários, etc.`;

// Função para buscar todos os leads
async function getLeadsData() {
    const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw new Error("Falha ao buscar dados dos leads.");
    return leads as Lead[];
}

export async function POST(request: Request) {
  try {
    // RECEBER O HISTÓRICO DA CONVERSA
    const { message, history } = await request.json();
    if (!message) return NextResponse.json({ error: 'A mensagem é obrigatória' }, { status: 400 });

    const allLeads = await getLeadsData();
    
    // Log para debug
    console.log(`📊 Dados carregados: ${allLeads.length} leads`);
    console.log(`📅 Período: ${allLeads.length > 0 ? `${new Date(allLeads[allLeads.length - 1].created_at).toLocaleDateString('pt-BR')} até ${new Date(allLeads[0].created_at).toLocaleDateString('pt-BR')}` : 'N/A'}`);

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Executar todas as análises
    const campaignPerformance = getCampaignPerformance(allLeads);
    const temporalAnalysis = getTemporalAnalysis(allLeads);
    const geographicAnalysis = getGeographicAnalysis(allLeads);
    const dataQuality = getDataQualityReport(allLeads);
    const sourceAnalysis = getSourceAnalysis(allLeads);
    const strategicInsights = getStrategicInsights(
      allLeads, 
      campaignPerformance, 
      temporalAnalysis, 
      geographicAnalysis, 
      dataQuality, 
      sourceAnalysis
    );
    
    // Logs para debug das análises
    console.log(`⏰ Análise temporal: ${temporalAnalysis.dayOfWeekAnalysis.length} dias analisados`);
    console.log(`🗺️ Análise geográfica: ${geographicAnalysis.stateAnalysis.length} estados encontrados`);
    console.log(`📊 Performance: ${campaignPerformance.topCampaigns.length} campanhas top`);
    console.log(`🔍 Qualidade: ${dataQuality.beacon.rate}% taxa de beacon`);
    
    // Criar histórico de conversa para contexto
    const conversationHistory = history && history.length > 0 
      ? `\n\n**Histórico da Conversa:**\n${history.map((msg: any) => 
          `${msg.role === 'user' ? '👤 Usuário' : '🤖 IA'}: ${msg.parts[0].text}`
        ).join('\n')}\n`
      : '';

    const prompt = `
      ${systemPrompt}
      
      **DADOS COMPLETOS PARA ANÁLISE:**
      
      **📊 Performance das Campanhas e Conjuntos:**
      - Total de leads: ${campaignPerformance.totalLeads}
      - Leads rastreados: ${campaignPerformance.trackedLeads}
      - Leads não rastreados: ${campaignPerformance.untrackedLeads.count} (${campaignPerformance.untrackedLeads.percentage}%)
      - Top 5 campanhas formatadas: ${JSON.stringify(campaignPerformance.topCampaigns, null, 2)}
      - Piores 5 campanhas formatadas: ${JSON.stringify(campaignPerformance.bottomCampaigns, null, 2)}
      - Top 5 conjuntos (UTM Campaign): ${JSON.stringify(campaignPerformance.topUtmCampaigns, null, 2)}
      - Piores 5 conjuntos (UTM Campaign): ${JSON.stringify(campaignPerformance.bottomUtmCampaigns, null, 2)}
      
      **⏰ Análise Temporal COMPLETA:**
      - Análise por dia da semana: ${JSON.stringify(temporalAnalysis.dayOfWeekAnalysis, null, 2)}
      - Análise por hora (completa): ${JSON.stringify(temporalAnalysis.hourAnalysis, null, 2)}
      - Análise por hora (horário comercial 8h-20h): ${JSON.stringify(temporalAnalysis.hourAnalysis.slice(8, 20), null, 2)}
      - Tendência semanal: ${temporalAnalysis.weeklyTrend} leads nos últimos 7 dias
      
      **🗺️ Análise Geográfica:**
      - Top 5 estados: ${JSON.stringify(geographicAnalysis.topStates, null, 2)}
      - Todos os estados: ${JSON.stringify(geographicAnalysis.stateAnalysis, null, 2)}
      
      **🔍 Qualidade dos Dados:**
      - Leads sem origem: ${dataQuality.completeness.missingSource.percentage}%
      - Leads não rastreados: ${dataQuality.tracking.untrackedLeads.percentage}%
      - Leads rastreados: ${dataQuality.tracking.trackedLeads.percentage}%
      - Taxa de beacon: ${dataQuality.beacon.rate}%
      - Taxa de rastreamento UTM: ${dataQuality.utmTracking.rate}%
      - Telefones duplicados: ${dataQuality.consistency.duplicatePhones}
      - Detalhes completos: ${JSON.stringify(dataQuality, null, 2)}
      
      **📈 Análise de Fontes:**
      - Top 5 fontes: ${JSON.stringify(sourceAnalysis.topSources, null, 2)}
      - Todas as fontes: ${JSON.stringify(sourceAnalysis.sourceAnalysis, null, 2)}
      - Análise por campanhas formatadas e conjuntos UTM por fonte
      
      **💡 Insights Estratégicos:**
      ${strategicInsights.map(insight => 
        `- **${insight.title}**: ${insight.description}. ${insight.recommendation}`
      ).join('\n')}
      
      **📋 DADOS BRUTOS PARA ANÁLISE DETALHADA:**
      - Total de leads no sistema: ${allLeads.length}
      - Período dos dados: ${allLeads.length > 0 ? `de ${new Date(allLeads[allLeads.length - 1].created_at).toLocaleDateString('pt-BR')} até ${new Date(allLeads[0].created_at).toLocaleDateString('pt-BR')}` : 'N/A'}
      - Amostra de leads (primeiros 5): ${JSON.stringify(allLeads.slice(0, 5).map(lead => ({
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        origem: lead.origem,
        nome_campanha_formatado: lead.nome_campanha_formatado,
        utm_campaign: lead.utm_campaign,
        utm_term: lead.utm_term,
        utm_medium: lead.utm_medium,
        is_becon: lead.is_becon,
        created_at: lead.created_at
      })), null, 2)}
      
      ${conversationHistory}
      
      **Pergunta atual do usuário:** ${message}
      
      **IMPORTANTE:** Você tem acesso COMPLETO a todos os dados de leads, incluindo análises temporais detalhadas por dia da semana e hora. Use TODOS os dados disponíveis para responder de forma precisa e detalhada.
      
      **FORMATO DE RESPOSTA:** Responda de forma textual direta, sem usar gráficos ASCII, tabelas ou elementos visuais. Foque em insights claros e acionáveis.
      
      Analise os dados fornecidos e responda de forma detalhada e estratégica. Se a pergunta for sobre algo específico, foque nesse aspecto. Se for uma pergunta geral, forneça uma visão abrangente dos dados.
    `;
    
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    return NextResponse.json({ response });

  } catch (error) {
    console.error('❌ Erro no agente de insights:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}