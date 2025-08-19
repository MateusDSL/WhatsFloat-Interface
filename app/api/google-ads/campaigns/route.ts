import { NextResponse } from 'next/server';
import { getGoogleAdsCustomer } from '@/lib/google-ads-client';
import { campaignsQuerySchema, customQuerySchema, validateUrlParams, validateRequestBody, formatValidationErrors } from '@/lib/validation-schemas';

// Cache para dados de campanhas (5 minutos)
const campaignCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos em millisegundos

// Função para gerenciar cache de dados
function getCachedData(cacheKey: string) {
  const cached = campaignCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

function setCachedData(cacheKey: string, data: any) {
  campaignCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
  
  // Limpar cache antigo periodicamente
  if (campaignCache.size > 100) {
    const now = Date.now();
    for (const [key, value] of campaignCache.entries()) {
      if (now - value.timestamp > CACHE_DURATION) {
        campaignCache.delete(key);
      }
    }
  }
}

 // Função otimizada para agregar dados de campanhas por período
 function aggregateCampaignData(campaigns: any[]) {
   const campaignMap = new Map();

   campaigns.forEach(campaign => {
     const campaignId = campaign.campaign.id;
     const impressions = campaign.metrics?.impressions || 0;
     
     if (!campaignMap.has(campaignId)) {
       // Primeira ocorrência da campanha
       campaignMap.set(campaignId, {
         ...campaign,
         metrics: {
           impressions: impressions,
           clicks: campaign.metrics?.clicks || 0,
           cost_micros: campaign.metrics?.cost_micros || 0,
           conversions: campaign.metrics?.conversions || 0,
           average_cpc: campaign.metrics?.average_cpc || 0,
           ctr: campaign.metrics?.ctr || 0,
           average_cpm: campaign.metrics?.average_cpm || 0,
           conversions_from_interactions_rate: campaign.metrics?.conversions_from_interactions_rate || 0
         },
         cpc_sum: campaign.metrics?.average_cpc || 0,
         cpc_count: 1,
         ctr_sum: campaign.metrics?.ctr || 0,
         ctr_count: 1,
         cpm_sum: campaign.metrics?.average_cpm || 0,
         cpm_count: 1,
         conv_rate_sum: campaign.metrics?.conversions_from_interactions_rate || 0,
         conv_rate_count: 1
       });
     } else {
       // Agregar dados à campanha existente
       const existing = campaignMap.get(campaignId);
       existing.metrics.impressions += impressions;
       existing.metrics.clicks += campaign.metrics?.clicks || 0;
       existing.metrics.cost_micros += campaign.metrics?.cost_micros || 0;
       existing.metrics.conversions += campaign.metrics?.conversions || 0;
       existing.cpc_sum += campaign.metrics?.average_cpc || 0;
       existing.cpc_count += 1;
       existing.ctr_sum += campaign.metrics?.ctr || 0;
       existing.ctr_count += 1;
       existing.cpm_sum += campaign.metrics?.average_cpm || 0;
       existing.cpm_count += 1;
       existing.conv_rate_sum += campaign.metrics?.conversions_from_interactions_rate || 0;
       existing.conv_rate_count += 1;
     }
   });

   // Calcular métricas médias e retornar array otimizado
   return Array.from(campaignMap.values())
     .map(campaign => {
       const metrics = {
         ...campaign.metrics,
         average_cpc: campaign.cpc_count > 0 ? campaign.cpc_sum / campaign.cpc_count : 0,
         ctr: campaign.ctr_count > 0 ? campaign.ctr_sum / campaign.ctr_count : 0,
         average_cpm: campaign.cpm_count > 0 ? campaign.cpm_sum / campaign.cpm_count : 0,
         conversions_from_interactions_rate: campaign.conv_rate_count > 0 ? campaign.conv_rate_sum / campaign.conv_rate_count : 0
       };

       // Calcular métricas derivadas
       const cost = metrics.cost_micros / 1000000; // Converter micros para reais
       const ctr_percentage = metrics.ctr * 100;
       const cpm = metrics.average_cpm / 1000; // Converter para formato padrão

       return {
         ...campaign,
         metrics: {
           ...metrics,
           cost_formatted: cost,
           ctr_percentage,
           cpm_formatted: cpm,
           // Calcular ROI se houver conversões
           roi: metrics.conversions > 0 ? ((metrics.conversions * 100) / cost) : 0
         }
       };
     });
 }

 // Função otimizada para obter dados das campanhas
async function getCampaignsData(customerId?: string, dateFrom?: string, dateTo?: string) {
  const customer = getGoogleAdsCustomer(customerId);

  // Gerar chave de cache única
  const cacheKey = `campaigns_${customerId}_${dateFrom}_${dateTo}`;
  
  // Verificar cache primeiro
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    console.log('📦 Retornando dados do cache:', cacheKey);
    return cachedData;
  }

  try {
    let campaigns;
    
    if (dateFrom && dateTo) {
      // Se há filtro de data, usar query com segments.date
      // REMOVIDA A CONVERSÃO DE TIMEZONE - USE AS DATAS DIRETAMENTE
      const fromDate = dateFrom;
      const toDate = dateTo;
      
      console.log('🔍 Aplicando filtro de data:', { fromDate, toDate });
      
      // Query otimizada com melhor performance e estrutura
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
          metrics.average_cpc,
          metrics.ctr,
          metrics.average_cpm,
          metrics.conversions_from_interactions_rate
        FROM campaign
        WHERE campaign.status IN ('ENABLED', 'PAUSED')
          AND segments.date BETWEEN '${fromDate}' AND '${toDate}'
          AND campaign.advertising_channel_type IN ('SEARCH', 'DISPLAY', 'VIDEO', 'SHOPPING')
        ORDER BY campaign.name, segments.date
        LIMIT 10000
      `;
      
      console.log('🔍 Executando query GAQL com filtro de data:', query);
      campaigns = await customer.query(query);
      
         } else {
       // Query otimizada sem filtro de data
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
           metrics.average_cpc,
           metrics.ctr,
           metrics.average_cpm,
           metrics.conversions_from_interactions_rate
         FROM campaign
         WHERE campaign.status IN ('ENABLED', 'PAUSED')
           AND campaign.advertising_channel_type IN ('SEARCH', 'DISPLAY', 'VIDEO', 'SHOPPING')
         ORDER BY campaign.name
         LIMIT 10000
       `;
      
      console.log('🔍 Executando query GAQL sem filtro de data:', query);
      campaigns = await customer.query(query);
    }
    
              console.log('📊 Resultado da query:', {
       totalCampaigns: campaigns.length,
       uniqueCampaigns: new Set(campaigns.map(c => c.campaign?.id)).size,
       campaignsWithImpressions: campaigns.filter(c => (c.metrics?.impressions || 0) > 0).length,
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
       
       // Cache dos dados agregados
       setCachedData(cacheKey, aggregatedCampaigns);
       return aggregatedCampaigns;
     }

     // Cache dos dados sem agregação
     setCachedData(cacheKey, campaigns);
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
            metrics.average_cpc,
            metrics.ctr,
            metrics.average_cpm,
            metrics.conversions_from_interactions_rate
          FROM campaign
          WHERE campaign.status IN ('ENABLED', 'PAUSED')
            AND campaign.advertising_channel_type IN ('SEARCH', 'DISPLAY', 'VIDEO', 'SHOPPING')
          ORDER BY campaign.name
          LIMIT 10000
        `;
      
      return await customer.query(fallbackQuery);
    }
    
    throw error;
  }
}

// Função para obter dados de anúncios
async function getAdsData(customerId?: string) {
  const customer = getGoogleAdsCustomer(customerId);

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
  const customer = getGoogleAdsCustomer(customerId);

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
    
    // Validar parâmetros de entrada
    let validatedParams;
    try {
      validatedParams = validateUrlParams(campaignsQuerySchema, searchParams);
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

    const { customerId, dateFrom, dateTo, type = 'campaigns', page = 1, limit = 20 } = validatedParams;
    const offset = (page - 1) * limit;

    let data;
    
    switch (type) {
      case 'campaigns':
        data = await getCampaignsData(customerId, dateFrom, dateTo);
        break;
      case 'ads':
        data = await getAdsData(customerId);
        break;
      case 'keywords':
        data = await getKeywordsData(customerId);
        break;
      default:
        return NextResponse.json(
          { error: 'Tipo de dados inválido. Use: campaigns, ads, ou keywords' },
          { status: 400 }
        );
    }

    // Aplicar paginação se for tipo 'campaigns'
    let paginatedData = data;
    let pagination = null;
    
    if (type === 'campaigns' && Array.isArray(data)) {
      const totalItems = data.length;
      const totalPages = Math.ceil(totalItems / limit);
      
      // Aplicar paginação apenas se há dados
      if (totalItems > 0) {
        paginatedData = data.slice(offset, offset + limit);
      }
      
      pagination = {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      };
    }

    // Configuração de cache para Vercel
    const response = NextResponse.json({
      success: true,
      data: paginatedData,
      pagination,
      timestamp: new Date().toISOString(),
      type
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
    
    // Validar body da requisição
    let validatedBody;
    try {
      validatedBody = validateRequestBody(customQuerySchema, body);
    } catch (error) {
      if (error instanceof Error) {
        return NextResponse.json(
          { 
            error: 'Dados inválidos',
            details: formatValidationErrors(error as any),
            help: 'Verifique o formato dos dados enviados'
          },
          { status: 400 }
        );
      }
      throw error;
    }

    const { query, customerId } = validatedBody;

    const customer = getGoogleAdsCustomer(customerId);

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