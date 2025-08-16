import { NextResponse } from 'next/server';
import { GoogleAdsApi } from 'google-ads-api';

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

// Função para obter dados segmentados por dia para o gráfico
async function getChartData(customerId?: string, dateFrom?: string, dateTo?: string) {
  const client = initializeGoogleAdsClient();
  
  const customer = client.Customer({
    customer_id: customerId || process.env.GOOGLE_CUSTOMER_ID || 'ID_DA_CONTA_ALVO',
    login_customer_id: process.env.GOOGLE_LOGIN_CUSTOMER_ID!,
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN!,
  });

  try {
    let campaigns;
    
    if (dateFrom && dateTo) {
      // Query com segments.date para dados diários
      // Garantir que as datas sejam tratadas no fuso horário do Brasil
      const fromDate = new Date(dateFrom + 'T00:00:00-03:00').toISOString().split('T')[0];
      const toDate = new Date(dateTo + 'T23:59:59-03:00').toISOString().split('T')[0];
      
      console.log('📊 Chart API - Aplicando filtro de data:', { 
        dateFrom, 
        dateTo, 
        fromDate, 
        toDate,
        isSameDay: fromDate === toDate 
      });
      
      const query = `
        SELECT
          campaign.id,
          campaign.name,
          campaign.status,
          segments.date,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.average_cpc,
          metrics.conversions_from_interactions_rate
        FROM campaign
        WHERE campaign.status = 'ENABLED'
          AND segments.date BETWEEN '${fromDate}' AND '${toDate}'
          AND campaign.advertising_channel_type IN ('SEARCH', 'DISPLAY', 'VIDEO', 'SHOPPING')
        ORDER BY segments.date, campaign.name
        LIMIT 10000
      `;
      
      console.log('📊 Chart API - Executando query GAQL:', query);
      campaigns = await customer.query(query);
      
    } else {
      // Query sem filtro de data - retorna dados agregados
      const query = `
        SELECT
          campaign.id,
          campaign.name,
          campaign.status,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.average_cpc,
          metrics.conversions_from_interactions_rate
        FROM campaign
        WHERE campaign.status = 'ENABLED'
          AND campaign.advertising_channel_type IN ('SEARCH', 'DISPLAY', 'VIDEO', 'SHOPPING')
        ORDER BY campaign.name
        LIMIT 10000
      `;
      
      console.log('📊 Chart API - Executando query sem filtro de data:', query);
      campaigns = await customer.query(query);
    }
    
    console.log('📊 Chart API - Resultado:', {
      totalRecords: campaigns.length,
      uniqueCampaigns: new Set(campaigns.map(c => c.campaign?.id)).size,
      hasSegments: campaigns.some(c => c.segments?.date)
    });

    // Retornar dados sem agregação para manter segmentação por dia
    return campaigns;
    
  } catch (error) {
    console.error('❌ Chart API - Erro na query do Google Ads:', error);
    
    // Se a query com segments.date falhar, tentar sem filtro de data
    if (dateFrom || dateTo) {
      console.log('🔄 Chart API - Tentando query sem filtro de data...');
      const fallbackQuery = `
        SELECT
          campaign.id,
          campaign.name,
          campaign.status,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.average_cpc,
          metrics.conversions_from_interactions_rate
        FROM campaign
        WHERE campaign.status = 'ENABLED'
          AND campaign.advertising_channel_type IN ('SEARCH', 'DISPLAY', 'VIDEO', 'SHOPPING')
        ORDER BY campaign.name
        LIMIT 10000
      `;
      
      return await customer.query(fallbackQuery);
    }
    
    throw error;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const data = await getChartData(customerId || undefined, dateFrom || undefined, dateTo || undefined);

    // Configuração de cache para Vercel
    const response = NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
      type: 'chart-data'
    });

    // Cache por 5 minutos para otimizar performance
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    
    return response;

  } catch (error) {
    console.error('❌ Chart API - Erro:', error);
    
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
