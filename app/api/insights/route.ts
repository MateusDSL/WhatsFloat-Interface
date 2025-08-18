// app/api/insights/route.ts

import { NextResponse } from 'next/server';
import { supabase, Lead } from '@/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

// --- Ferramentas de Análise (código continua o mesmo) ---
function getCampaignPerformance(leads: Lead[]) {
  const leadsByCampaign = leads.reduce((acc, lead) => {
    const campaign = lead.utm_campaign || 'N/A';
    acc[campaign] = (acc[campaign] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });
  const sortedCampaigns = Object.entries(leadsByCampaign).sort(([, a], [, b]) => b - a);
  return { totalLeads: leads.length, topCampaigns: sortedCampaigns.slice(0, 5), bottomCampaigns: sortedCampaigns.slice(-5).reverse() };
}

function getDataQualityReport(leads: Lead[]) {
  const untrackedBySource = leads.filter(l => !l.origem || l.origem === 'nao-identificado').length;
  const untrackedByCampaign = leads.filter(l => !l.utm_campaign || l.utm_campaign === 'N/A').length;
  return { totalLeads: leads.length, untrackedBySourceCount: untrackedBySource, untrackedByCampaignCount: untrackedByCampaign, untrackedSourcePercentage: ((untrackedBySource / leads.length) * 100).toFixed(2), untrackedCampaignPercentage: ((untrackedByCampaign / leads.length) * 100).toFixed(2) };
}


// --- LÓGICA PRINCIPAL DO AGENTE ---

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// --- PERSONA MAIS FLEXÍVEL E CONVERSACIONAL ---
const systemPrompt = `Você é um assistente de IA especialista em marketing para a empresa WhatsFloat. Você pode conversar normalmente com o usuário ou, se ele pedir uma análise específica, você pode usar os dados fornecidos para obter insights.

- Se a pergunta for um cumprimento ou uma conversa geral (ex: "Olá", "Tudo bem?"), responda de forma amigável e natural.
- Se a pergunta pedir uma análise de dados (ex: "Qual campanha performou melhor?", "Verifique a qualidade dos dados"), use os dados fornecidos para obter insights e, em seguida, forneça uma análise estratégica como um especialista.
- Formate sempre as suas análises em Markdown, com títulos em negrito e listas.
- Seja sempre prestável e proativo.`;

// Função para buscar todos os leads
async function getLeadsData() {
    const { data: leads, error } = await supabase
        .from('leads')
        .select('origem, utm_campaign')
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

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Criar prompt com dados dos leads e histórico
    const campaignPerformance = getCampaignPerformance(allLeads);
    const dataQuality = getDataQualityReport(allLeads);
    
    // Criar histórico de conversa para contexto
    const conversationHistory = history && history.length > 0 
      ? `\n\n**Histórico da Conversa:**\n${history.map((msg: any) => 
          `${msg.role === 'user' ? '👤 Usuário' : '🤖 IA'}: ${msg.parts[0].text}`
        ).join('\n')}\n`
      : '';

    const prompt = `
      ${systemPrompt}
      
      **Dados de Performance das Campanhas:**
      - Total de leads: ${campaignPerformance.totalLeads}
      - Top 5 campanhas: ${JSON.stringify(campaignPerformance.topCampaigns)}
      - Piores 5 campanhas: ${JSON.stringify(campaignPerformance.bottomCampaigns)}
      
      **Qualidade dos Dados:**
      - Leads sem origem rastreada: ${dataQuality.untrackedSourcePercentage}%
      - Leads sem campanha rastreada: ${dataQuality.untrackedCampaignPercentage}%
      ${conversationHistory}
      **Pergunta atual do usuário:** ${message}
      
      Responda de forma apropriada baseada no tipo de pergunta e nos dados fornecidos.
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