import { NextResponse } from 'next/server';
import { GoogleAdsApi } from 'google-ads-api';
import { timezoneUtils } from '../../../../lib/utils';

// Cache para evitar múltiplas inicializações do cliente
let googleAdsClient: GoogleAdsApi | null = null;

// Função para inicializar o cliente Google Ads
function initializeGoogleAdsClient() {
  if (!googleAdsClient) {
    // Validação das variáveis de ambiente
    const requiredEnvVars = {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      GOOGLE_DEVELOPER_TOKEN: process.env.GOOGLE_DEVELOPER_TOKEN,
      GOOGLE_REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN,
      GOOGLE_LOGIN_CUSTOMER_ID: process.env.GOOGLE_LOGIN_CUSTOMER_ID,
    };

    // Verifica se todas as variáveis estão presentes
    const missingVars = Object.entries(requiredEnvVars)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      throw new Error(`Variáveis de ambiente ausentes: ${missingVars.join(', ')}`);
    }

    googleAdsClient = new GoogleAdsApi({
      client_id: requiredEnvVars.GOOGLE_CLIENT_ID!,
      client_secret: requiredEnvVars.GOOGLE_CLIENT_SECRET!,
      developer_token: requiredEnvVars.GOOGLE_DEVELOPER_TOKEN!,
    });
  }

     return googleAdsClient;
 }

 // Função para agregar dados de campanhas por período
 function aggregateCampaignData(campaigns: any[]) {
   const campaignMap = new Map();

   campaigns.forEach(campaign => {
     const campaignId = campaign.campaign.id;
     
     if (!campaignMap.has(campaignId)) {
       // Primeira ocorrência da campanha
       campaignMap.set(campaignId, {
         ...campaign,
         metrics: {
           impressions: campaign.metrics?.impressions || 0,
           clicks: campaign.metrics?.clicks || 0,
           cost_micros: campaign.metrics?.cost_micros || 0,
           conversions: campaign.metrics?.conversions || 0,
           average_cpc: campaign.metrics?.average_cpc || 0
         },
         cpc_sum: campaign.metrics?.average_cpc || 0,
         cpc_count: 1
       });
     } else {
       // Agregar dados à campanha existente
       const existing = campaignMap.get(campaignId);
       existing.metrics.impressions += campaign.metrics?.impressions || 0;
       existing.metrics.clicks += campaign.metrics?.clicks || 0;
       existing.metrics.cost_micros += campaign.metrics?.cost_micros || 0;
       existing.metrics.conversions += campaign.metrics?.conversions || 0;
       existing.cpc_sum += campaign.metrics?.average_cpc || 0;
       existing.cpc_count += 1;
     }
   });

   // Calcular CPC médio e retornar array
   return Array.from(campaignMap.values()).map(campaign => ({
     ...campaign,
     metrics: {
       ...campaign.metrics,
       average_cpc: campaign.cpc_count > 0 ? campaign.cpc_sum / campaign.cpc_count : 0
     }
   }));
 }

 // Função para obter dados das campanhas
async function getCampaignsData(customerId?: string, dateFrom?: string, dateTo?: string) {
  const client = initializeGoogleAdsClient();
  
  const customer = client.Customer({
    customer_id: customerId || process.env.GOOGLE_CUSTOMER_ID || 'ID_DA_CONTA_ALVO',
    login_customer_id: process.env.GOOGLE_LOGIN_CUSTOMER_ID!,
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN!,
  });

  try {
    let campaigns;
    
    if (dateFrom && dateTo) {
      // Se há filtro de data, usar query com segments.date
      // Converter para timezone Brasil (UTC-3) antes de enviar para API
      const fromDate = timezoneUtils.toBrazilTimezone(new Date(dateFrom));
      const toDate = timezoneUtils.toBrazilTimezone(new Date(dateTo));
      
      console.log('🔍 Aplicando filtro de data:', { fromDate, toDate });
      
      const query = `
        SELECT
          campaign.id,
          campaign.name,
          campaign.status,
          campaign.advertising_channel_type,
          campaign.start_date,
          campaign.end_date,
          campaign_budget.amount_micros,
          segments.date,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.average_cpc
        FROM campaign
        WHERE campaign.status = 'ENABLED'
          AND segments.date BETWEEN '${fromDate}' AND '${toDate}'
        ORDER BY campaign.name, segments.date
      `;
      
      console.log('🔍 Executando query GAQL com filtro de data:', query);
      campaigns = await customer.query(query);
      
         } else {
       // Se não há filtro de data, usar query simples
       const query = `
         SELECT
           campaign.id,
           campaign.name,
           campaign.status,
           campaign.advertising_channel_type,
           campaign.start_date,
           campaign.end_date,
           campaign_budget.amount_micros,
           metrics.impressions,
           metrics.clicks,
           metrics.cost_micros,
           metrics.conversions,
           metrics.average_cpc
         FROM campaign
         WHERE campaign.status = 'ENABLED'
         ORDER BY campaign.name
       `;
      
      console.log('🔍 Executando query GAQL sem filtro de data:', query);
      campaigns = await customer.query(query);
    }
    
              console.log('📊 Resultado da query:', {
       totalCampaigns: campaigns.length,
       uniqueCampaigns: new Set(campaigns.map(c => c.campaign?.id)).size,
       campaigns: campaigns.map(c => ({ 
         name: c.campaign?.name, 
         id: c.campaign?.id,
         impressions: c.metrics?.impressions || 0 
       }))
     });

     // Se há filtro de data, agregar os dados por campanha para a tabela
     if (dateFrom && dateTo) {
       console.log('🔄 Agregando dados por campanha para tabela...');
       const aggregatedCampaigns = aggregateCampaignData(campaigns);
       console.log('✅ Dados agregados para tabela:', {
         originalCount: campaigns.length,
         aggregatedCount: aggregatedCampaigns.length
       });
       return aggregatedCampaigns;
     }

     return campaigns;
    
  } catch (error) {
    console.error('❌ Erro na query do Google Ads:', error);
    
         // Se a query com segments.date falhar, tentar sem filtro de data
     if (dateFrom || dateTo) {
       console.log('🔄 Tentando query sem filtro de data...');
               const fallbackQuery = `
          SELECT
            campaign.id,
            campaign.name,
            campaign.status,
            campaign.advertising_channel_type,
            campaign.start_date,
            campaign.end_date,
            campaign_budget.amount_micros,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.conversions,
            metrics.average_cpc
          FROM campaign
          WHERE campaign.status = 'ENABLED'
          ORDER BY campaign.name
        `;
      
      return await customer.query(fallbackQuery);
    }
    
    throw error;
  }
}

// Função para obter dados de anúncios
async function getAdsData(customerId?: string) {
  const client = initializeGoogleAdsClient();
  
  const customer = client.Customer({
    customer_id: customerId || process.env.GOOGLE_CUSTOMER_ID || 'ID_DA_CONTA_ALVO',
    login_customer_id: process.env.GOOGLE_LOGIN_CUSTOMER_ID!,
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN!,
  });

  const ads = await customer.query(`
    SELECT
      ad_group_ad.ad.id,
      ad_group_ad.ad.name,
      ad_group_ad.ad.type,
      ad_group_ad.status,
      ad_group.name,
      campaign.name,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions
    FROM ad_group_ad
    WHERE ad_group_ad.status != 'REMOVED'
    ORDER BY metrics.impressions DESC
  `);

  return ads;
}

// Função para obter dados de palavras-chave
async function getKeywordsData(customerId?: string) {
  const client = initializeGoogleAdsClient();
  
  const customer = client.Customer({
    customer_id: customerId || process.env.GOOGLE_CUSTOMER_ID || 'ID_DA_CONTA_ALVO',
    login_customer_id: process.env.GOOGLE_LOGIN_CUSTOMER_ID!,
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN!,
  });

  const keywords = await customer.query(`
    SELECT
      ad_group_criterion.criterion_id,
      ad_group_criterion.keyword.text,
      ad_group_criterion.status,
      ad_group.name,
      campaign.name
    FROM ad_group_criterion
    WHERE ad_group_criterion.type = 'KEYWORD'
    AND ad_group_criterion.status != 'REMOVED'
    ORDER BY ad_group_criterion.criterion_id
  `);

  return keywords;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dataType = searchParams.get('type') || 'campaigns';
    const customerId = searchParams.get('customerId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    let data;
    
    switch (dataType) {
      case 'campaigns':
        data = await getCampaignsData(customerId || undefined, dateFrom || undefined, dateTo || undefined);
        break;
      case 'ads':
        data = await getAdsData(customerId || undefined);
        break;
      case 'keywords':
        data = await getKeywordsData(customerId || undefined);
        break;
      default:
        return NextResponse.json(
          { error: 'Tipo de dados inválido. Use: campaigns, ads, ou keywords' },
          { status: 400 }
        );
    }

    // Configuração de cache para Vercel
    const response = NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
      type: dataType
    });

    // Cache por 5 minutos para otimizar performance
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    
    return response;

  } catch (error) {
    console.error('❌ Erro na API do Google Ads:', error);
    
    // Tratamento específico de erros
    if (error instanceof Error) {
      if (error.message.includes('Variáveis de ambiente ausentes')) {
        return NextResponse.json(
          { 
            error: 'Configuração incompleta',
            details: error.message,
            help: 'Configure as variáveis de ambiente no Vercel Dashboard'
          },
          { status: 500 }
        );
      }
      
      if (error.message.includes('authentication')) {
        return NextResponse.json(
          { 
            error: 'Erro de autenticação',
            details: 'Verifique suas credenciais do Google Ads'
          },
          { status: 401 }
        );
      }
      
      // Erro específico de query GAQL
      if (error.message.includes('segments.date') || error.message.includes('GAQL')) {
        return NextResponse.json(
          { 
            error: 'Erro na query do Google Ads',
            details: 'O filtro de data pode não estar disponível para esta conta',
            help: 'Tente remover o filtro de data ou verificar as permissões da conta'
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: process.env.NODE_ENV === 'development' ? error : 'Erro ao processar requisição'
      },
      { status: 500 }
    );
  }
}

// Método POST para consultas customizadas
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, customerId } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query é obrigatória' },
        { status: 400 }
      );
    }

    const client = initializeGoogleAdsClient();
    
    const customer = client.Customer({
      customer_id: customerId || process.env.GOOGLE_CUSTOMER_ID || 'ID_DA_CONTA_ALVO',
      login_customer_id: process.env.GOOGLE_LOGIN_CUSTOMER_ID!,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN!,
    });

    const data = await customer.query(query);

    const response = NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
      query: query.substring(0, 100) + '...' // Log parcial da query
    });

    response.headers.set('Cache-Control', 'no-cache');
    
    return response;

  } catch (error) {
    console.error('Erro na query customizada:', error);
    
    return NextResponse.json(
      { 
        error: 'Erro na execução da query',
        details: process.env.NODE_ENV === 'development' ? error : 'Query inválida ou erro de conexão'
      },
      { status: 500 }
    );
  }
}