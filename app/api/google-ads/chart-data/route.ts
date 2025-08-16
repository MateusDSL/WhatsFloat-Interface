import { NextResponse } from 'next/server';
import { getGoogleAdsCustomer } from '@/lib/google-ads-client';
import { chartDataQuerySchema, validateUrlParams, formatValidationErrors } from '@/lib/validation-schemas';

// Função para obter dados segmentados por dia para o gráfico
async function getChartData(customerId?: string, dateFrom?: string, dateTo?: string) {
  const customer = getGoogleAdsCustomer(customerId);

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
    
    // Validar parâmetros de entrada
    let validatedParams;
    try {
      validatedParams = validateUrlParams(chartDataQuerySchema, searchParams);
    } catch (error) {
      if (error instanceof Error) {
        return NextResponse.json(
          { 
            error: 'Parâmetros inválidos',
            details: formatValidationErrors(error as any),
            help: 'Verifique os parâmetros da requisição'
          },
          { status: 400 }
        );
      }
      throw error;
    }

    const { customerId, dateFrom, dateTo } = validatedParams;
    const data = await getChartData(customerId, dateFrom, dateTo);

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
