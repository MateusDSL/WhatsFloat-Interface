import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Mapeamento de IDs dos estados brasileiros para nomes
const BRAZIL_STATES_MAP: { [key: string]: string } = {
  '1001460': 'São Paulo',
  '1001461': 'Rio de Janeiro',
  '1001462': 'Minas Gerais',
  '1001463': 'Paraná',
  '1001464': 'Santa Catarina',
  '1001465': 'Rio Grande do Sul',
  '1001466': 'Bahia',
  '1001467': 'Goiás',
  '1001468': 'Pernambuco',
  '1001469': 'Ceará',
  '1001470': 'Pará',
  '1001471': 'Maranhão',
  '1001472': 'Amazonas',
  '1001473': 'Espírito Santo',
  '1001474': 'Paraíba',
  '1001475': 'Alagoas',
  '1001476': 'Rio Grande do Norte',
  '1001477': 'Piauí',
  '1001478': 'Mato Grosso',
  '1001479': 'Mato Grosso do Sul',
  '1001480': 'Tocantins',
  '1001481': 'Rondônia',
  '1001482': 'Acre',
  '1001483': 'Amapá',
  '1001484': 'Roraima',
  '1001485': 'Sergipe',
  '1001486': 'Distrito Federal'
};

// Função para extrair o ID do estado do resource name
const getStateIdFromResourceName = (resourceName: string): string => {
  if (!resourceName) return '';
  const parts = resourceName.split('/');
  return parts[parts.length - 1] || '';
};

// Função para obter o nome do estado
const getStateName = (resourceName: string): string => {
  const stateId = getStateIdFromResourceName(resourceName);
  return BRAZIL_STATES_MAP[stateId] || 'Outros';
};

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
      // Query com filtro de data usando geographic_view
      const fromDate = new Date(dateFrom + 'T00:00:00-03:00').toISOString().split('T')[0];
      const toDate = new Date(dateTo + 'T23:59:59-03:00').toISOString().split('T')[0];

      query = `
        SELECT
          segments.geo_target_region,
          segments.geo_target_country,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.average_cpc
        FROM geographic_view
        WHERE segments.date BETWEEN '${fromDate}' AND '${toDate}'
          AND campaign.status = 'ENABLED'
          AND ad_group.status = 'ENABLED'
          AND segments.geo_target_country = 'geoTargetConstants/1001'
          AND metrics.conversions > 0
        ORDER BY metrics.conversions DESC
      `;
    } else {
      // Query sem filtro de data usando geographic_view
      query = `
        SELECT
          segments.geo_target_region,
          segments.geo_target_country,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.average_cpc
        FROM geographic_view
        WHERE campaign.status = 'ENABLED'
          AND ad_group.status = 'ENABLED'
          AND segments.geo_target_country = 'geoTargetConstants/1001'
          AND metrics.conversions > 0
        ORDER BY metrics.conversions DESC
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

    // Processar e agrupar dados por estado
    const stateData = new Map();

    results.forEach((row: any) => {
      const stateResourceName = row.segments?.geo_target_region;
      const stateName = getStateName(stateResourceName);
      
      const current = stateData.get(stateName) || {
        state: stateName,
        state_id: getStateIdFromResourceName(stateResourceName),
        impressions: 0,
        clicks: 0,
        cost_micros: 0,
        conversions: 0,
        data_points: 0
      };

      current.impressions += row.metrics?.impressions || 0;
      current.clicks += row.metrics?.clicks || 0;
      current.cost_micros += row.metrics?.cost_micros || 0;
      current.conversions += row.metrics?.conversions || 0;
      current.data_points += 1;

      stateData.set(stateName, current);
    });

    // Converter para array e calcular métricas adicionais
    const processedData = Array.from(stateData.values()).map(state => ({
      ...state,
      ctr: state.impressions > 0 ? (state.clicks / state.impressions) * 100 : 0,
      cpc: state.clicks > 0 ? state.cost_micros / state.clicks : 0,
      conversion_rate: state.clicks > 0 ? (state.conversions / state.clicks) * 100 : 0,
      cost_per_conversion: state.conversions > 0 ? state.cost_micros / state.conversions : 0
    }));

    return NextResponse.json({
      success: true,
      data: processedData,
      total_states: processedData.length,
      total_impressions: processedData.reduce((sum, state) => sum + state.impressions, 0),
      total_clicks: processedData.reduce((sum, state) => sum + state.clicks, 0),
      total_cost: processedData.reduce((sum, state) => sum + state.cost_micros, 0),
      total_conversions: processedData.reduce((sum, state) => sum + state.conversions, 0)
    });

  } catch (error: any) {
    console.error('Erro ao buscar dados de localização:', error);
    
    return NextResponse.json({
      error: 'Erro ao buscar dados de localização',
      details: error.message
    }, { status: 500 });
  }
}
