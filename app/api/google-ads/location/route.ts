import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAdsCustomer } from '@/lib/google-ads-client';
import { locationQuerySchema, validateUrlParams, formatValidationErrors } from '@/lib/validation-schemas';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Validar parâmetros de entrada
    let validatedParams;
    try {
      validatedParams = validateUrlParams(locationQuerySchema, searchParams);
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

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID é obrigatório' }, { status: 400 });
    }

    // Usar o cliente Google Ads configurado
    const customer = getGoogleAdsCustomer(customerId);

    // Query que funciona - buscar campanhas com métricas
    let query: string;
    
    if (dateFrom && dateTo) {
      const fromDate = new Date(dateFrom + 'T00:00:00-03:00').toISOString().split('T')[0];
      const toDate = new Date(dateTo + 'T23:59:59-03:00').toISOString().split('T')[0];
      
      query = `
        SELECT
          campaign.id,
          campaign.name,
          campaign.status,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.average_cpc,
          metrics.ctr,
          metrics.average_cpm,
          metrics.conversions_from_interactions_rate
        FROM campaign
        WHERE campaign.status = 'ENABLED'
          AND segments.date BETWEEN '${fromDate}' AND '${toDate}'
        ORDER BY metrics.cost_micros DESC
      `;
    } else {
      query = `
        SELECT
          campaign.id,
          campaign.name,
          campaign.status,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.average_cpc,
          metrics.ctr,
          metrics.average_cpm,
          metrics.conversions_from_interactions_rate
        FROM campaign
        WHERE campaign.status = 'ENABLED'
        ORDER BY metrics.cost_micros DESC
      `;
    }

    const response = await customer.query(query);
    const results = response || [];

    // Processar dados e extrair localização dos nomes das campanhas
    const locationData: { [key: string]: any } = {};
    
    results.forEach((row: any) => {
      const campaignName = row.campaign?.name || '';
      const campaignId = row.campaign?.id;
      
      // Extrair estado do nome da campanha (ex: [KOPU] [SEARCH] [SC] [MADURA])
      const stateMatch = campaignName.match(/\[([A-Z]{2})\]/);
      const state = stateMatch ? stateMatch[1] : 'Outros';
      
      // Extrair produto do nome da campanha
      const productMatch = campaignName.match(/\[([A-Z]+)\]$/);
      const product = productMatch ? productMatch[1] : 'Geral';
      
      const metrics = row.metrics || {};
      const impressions = metrics.impressions || 0;
      const clicks = metrics.clicks || 0;
      const cost = metrics.cost_micros ? metrics.cost_micros / 1000000 : 0;
      const conversions = metrics.conversions || 0;
      const averageCpc = metrics.average_cpc ? metrics.average_cpc / 1000000 : 0;
      const ctr = metrics.ctr || 0;
      const averageCpm = metrics.average_cpm ? metrics.average_cpm / 1000 : 0;
      const conversionRate = metrics.conversions_from_interactions_rate || 0;

      // Agrupar por estado
      if (!locationData[state]) {
        locationData[state] = {
          state: state,
          campaigns: [],
          totalImpressions: 0,
          totalClicks: 0,
          totalCost: 0,
          totalConversions: 0,
          averageCpc: 0,
          averageCtr: 0,
          averageCpm: 0,
          averageConversionRate: 0
        };
      }

      // Adicionar campanha ao estado
      locationData[state].campaigns.push({
        id: campaignId,
        name: campaignName,
        product: product,
        impressions,
        clicks,
        cost,
        conversions,
        averageCpc,
        ctr,
        averageCpm,
        conversionRate
      });

      // Atualizar totais do estado
      locationData[state].totalImpressions += impressions;
      locationData[state].totalClicks += clicks;
      locationData[state].totalCost += cost;
      locationData[state].totalConversions += conversions;
    });

    // Calcular médias para cada estado
    Object.values(locationData).forEach((stateData: any) => {
      const campaignCount = stateData.campaigns.length;
      if (campaignCount > 0) {
        stateData.averageCpc = stateData.totalCost / stateData.totalClicks || 0;
        stateData.averageCtr = stateData.totalClicks / stateData.totalImpressions || 0;
        stateData.averageCpm = (stateData.totalCost / stateData.totalImpressions) * 1000 || 0;
        stateData.averageConversionRate = stateData.totalConversions / stateData.totalClicks || 0;
      }
    });

    // Converter para array e ordenar por custo total
    const locationArray = Object.values(locationData).sort((a: any, b: any) => b.totalCost - a.totalCost);

    // Calcular totais gerais
    const totals = {
      states: locationArray.length,
      totalImpressions: locationArray.reduce((sum, state: any) => sum + state.totalImpressions, 0),
      totalClicks: locationArray.reduce((sum, state: any) => sum + state.totalClicks, 0),
      totalCost: locationArray.reduce((sum, state: any) => sum + state.totalCost, 0),
      totalConversions: locationArray.reduce((sum, state: any) => sum + state.totalConversions, 0)
    };

    return NextResponse.json({
      success: true,
      customer_id: customerId,
      timestamp: new Date().toISOString(),
      data: locationArray,
      totals: totals,
      query: query,
      note: 'Dados de localização extraídos dos nomes das campanhas'
    });

  } catch (error: any) {
    console.error('Erro ao buscar dados de localização:', error);
    
    return NextResponse.json({
      error: 'Erro ao buscar dados de localização',
      details: error.message,
      help: 'Verifique as credenciais e tente novamente'
    }, { status: 500 });
  }
}
