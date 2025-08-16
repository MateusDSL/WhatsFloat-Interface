import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID é obrigatório' }, { status: 400 });
    }

    // Configurar autenticação do Google Ads
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_ADS_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_ADS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/adwords'],
    });

    const client = await auth.getClient();
    const googleAdsService = google.ads({ version: 'v16', auth: client });

    let query: string;

    if (dateFrom && dateTo) {
      // Query com filtro de data
      const fromDate = new Date(dateFrom + 'T00:00:00-03:00').toISOString().split('T')[0];
      const toDate = new Date(dateTo + 'T23:59:59-03:00').toISOString().split('T')[0];

      query = `
        SELECT
          campaign.id,
          campaign.name,
          segments.geo_target_country,
          segments.geo_target_region,
          segments.geo_target_city,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.average_cpc
        FROM campaign
        WHERE campaign.status = 'ENABLED'
          AND segments.date BETWEEN '${fromDate}' AND '${toDate}'
          AND segments.geo_target_country IS NOT NULL
        ORDER BY metrics.cost_micros DESC
      `;
    } else {
      // Query sem filtro de data
      query = `
        SELECT
          campaign.id,
          campaign.name,
          segments.geo_target_country,
          segments.geo_target_region,
          segments.geo_target_city,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.average_cpc
        FROM campaign
        WHERE campaign.status = 'ENABLED'
          AND segments.geo_target_country IS NOT NULL
        ORDER BY metrics.cost_micros DESC
        LIMIT 10000
      `;
    }

    const response = await googleAdsService.customers.search({
      customerId: customerId.replace(/-/g, ''),
      requestBody: {
        query: query,
      },
    });

    const results = response.data.results || [];

    // Processar e agrupar dados por localização
    const locationData = new Map();

    results.forEach((row: any) => {
      const country = row.segments?.geo_target_country || 'Desconhecido';
      const region = row.segments?.geo_target_region || 'N/A';
      const city = row.segments?.geo_target_city || 'N/A';
      
      const locationKey = `${country}|${region}|${city}`;
      const current = locationData.get(locationKey) || {
        country,
        region,
        city,
        impressions: 0,
        clicks: 0,
        cost_micros: 0,
        conversions: 0,
        campaigns: new Set()
      };

      current.impressions += row.metrics?.impressions || 0;
      current.clicks += row.metrics?.clicks || 0;
      current.cost_micros += row.metrics?.cost_micros || 0;
      current.conversions += row.metrics?.conversions || 0;
      current.campaigns.add(row.campaign?.name || 'Desconhecida');

      locationData.set(locationKey, current);
    });

    // Converter para array e calcular métricas adicionais
    const processedData = Array.from(locationData.values()).map(location => ({
      ...location,
      campaigns: Array.from(location.campaigns),
      campaign_count: location.campaigns.size,
      ctr: location.impressions > 0 ? (location.clicks / location.impressions) * 100 : 0,
      cpc: location.clicks > 0 ? location.cost_micros / location.clicks : 0,
      conversion_rate: location.clicks > 0 ? (location.conversions / location.clicks) * 100 : 0,
      cost_per_conversion: location.conversions > 0 ? location.cost_micros / location.conversions : 0
    }));

    return NextResponse.json({
      success: true,
      data: processedData,
      total_locations: processedData.length,
      total_impressions: processedData.reduce((sum, loc) => sum + loc.impressions, 0),
      total_clicks: processedData.reduce((sum, loc) => sum + loc.clicks, 0),
      total_cost: processedData.reduce((sum, loc) => sum + loc.cost_micros, 0),
      total_conversions: processedData.reduce((sum, loc) => sum + loc.conversions, 0)
    });

  } catch (error: any) {
    console.error('Erro ao buscar dados de localização:', error);
    
    return NextResponse.json({
      error: 'Erro ao buscar dados de localização',
      details: error.message
    }, { status: 500 });
  }
}
