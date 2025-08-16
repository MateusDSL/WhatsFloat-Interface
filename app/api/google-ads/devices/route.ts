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
          segments.device,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.average_cpc,
          metrics.average_cpm
        FROM campaign
        WHERE campaign.status = 'ENABLED'
          AND segments.date BETWEEN '${fromDate}' AND '${toDate}'
          AND segments.device IS NOT NULL
        ORDER BY metrics.cost_micros DESC
      `;
    } else {
      // Query sem filtro de data
      query = `
        SELECT
          campaign.id,
          campaign.name,
          segments.device,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.average_cpc,
          metrics.average_cpm
        FROM campaign
        WHERE campaign.status = 'ENABLED'
          AND segments.device IS NOT NULL
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

    // Processar e agrupar dados por dispositivo
    const deviceData = new Map();

    results.forEach((row: any) => {
      const device = row.segments?.device || 'Desconhecido';
      
      const current = deviceData.get(device) || {
        device,
        impressions: 0,
        clicks: 0,
        cost_micros: 0,
        conversions: 0,
        campaigns: new Set(),
        total_cpc: 0,
        total_cpm: 0,
        data_points: 0
      };

      current.impressions += row.metrics?.impressions || 0;
      current.clicks += row.metrics?.clicks || 0;
      current.cost_micros += row.metrics?.cost_micros || 0;
      current.conversions += row.metrics?.conversions || 0;
      current.campaigns.add(row.campaign?.name || 'Desconhecida');
      current.total_cpc += row.metrics?.average_cpc || 0;
      current.total_cpm += row.metrics?.average_cpm || 0;
      current.data_points += 1;

      deviceData.set(device, current);
    });

    // Converter para array e calcular métricas adicionais
    const processedData = Array.from(deviceData.values()).map(device => ({
      ...device,
      campaigns: Array.from(device.campaigns),
      campaign_count: device.campaigns.size,
      ctr: device.impressions > 0 ? (device.clicks / device.impressions) * 100 : 0,
      cpc: device.data_points > 0 ? device.total_cpc / device.data_points : 0,
      cpm: device.data_points > 0 ? device.total_cpm / device.data_points : 0,
      conversion_rate: device.clicks > 0 ? (device.conversions / device.clicks) * 100 : 0,
      cost_per_conversion: device.conversions > 0 ? device.cost_micros / device.conversions : 0
    }));

    // Mapear nomes de dispositivos para português
    const deviceNameMap: { [key: string]: string } = {
      'MOBILE': 'Mobile',
      'DESKTOP': 'Desktop',
      'TABLET': 'Tablet',
      'CONNECTED_TV': 'Smart TV',
      'OTHER': 'Outros'
    };

    processedData.forEach(device => {
      device.device_name = deviceNameMap[device.device] || device.device;
    });

    return NextResponse.json({
      success: true,
      data: processedData,
      total_devices: processedData.length,
      total_impressions: processedData.reduce((sum, device) => sum + device.impressions, 0),
      total_clicks: processedData.reduce((sum, device) => sum + device.clicks, 0),
      total_cost: processedData.reduce((sum, device) => sum + device.cost_micros, 0),
      total_conversions: processedData.reduce((sum, device) => sum + device.conversions, 0)
    });

  } catch (error: any) {
    console.error('Erro ao buscar dados de dispositivos:', error);
    
    return NextResponse.json({
      error: 'Erro ao buscar dados de dispositivos',
      details: error.message
    }, { status: 500 });
  }
}
