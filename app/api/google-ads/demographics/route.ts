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
          segments.user_list,
          segments.age_range,
          segments.gender,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.average_cpc,
          metrics.average_cpm
        FROM campaign
        WHERE campaign.status = 'ENABLED'
          AND segments.date BETWEEN '${fromDate}' AND '${toDate}'
          AND (segments.age_range IS NOT NULL OR segments.gender IS NOT NULL)
        ORDER BY metrics.cost_micros DESC
      `;
    } else {
      // Query sem filtro de data
      query = `
        SELECT
          campaign.id,
          campaign.name,
          segments.user_list,
          segments.age_range,
          segments.gender,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.average_cpc,
          metrics.average_cpm
        FROM campaign
        WHERE campaign.status = 'ENABLED'
          AND (segments.age_range IS NOT NULL OR segments.gender IS NOT NULL)
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

    // Processar e agrupar dados por demografia
    const demographicsData = new Map();

    results.forEach((row: any) => {
      const ageRange = row.segments?.age_range || 'Desconhecido';
      const gender = row.segments?.gender || 'Desconhecido';
      
      // Criar chave única para cada combinação de idade e gênero
      const demoKey = `${ageRange}|${gender}`;
      
      const current = demographicsData.get(demoKey) || {
        age_range: ageRange,
        gender: gender,
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

      demographicsData.set(demoKey, current);
    });

    // Converter para array e calcular métricas adicionais
    const processedData = Array.from(demographicsData.values()).map(demo => ({
      ...demo,
      campaigns: Array.from(demo.campaigns),
      campaign_count: demo.campaigns.size,
      ctr: demo.impressions > 0 ? (demo.clicks / demo.impressions) * 100 : 0,
      cpc: demo.data_points > 0 ? demo.total_cpc / demo.data_points : 0,
      cpm: demo.data_points > 0 ? demo.total_cpm / demo.data_points : 0,
      conversion_rate: demo.clicks > 0 ? (demo.conversions / demo.clicks) * 100 : 0,
      cost_per_conversion: demo.conversions > 0 ? demo.cost_micros / demo.conversions : 0
    }));

    // Mapear nomes para português
    const ageRangeMap: { [key: string]: string } = {
      'AGE_RANGE_18_24': '18-24 anos',
      'AGE_RANGE_25_34': '25-34 anos',
      'AGE_RANGE_35_44': '35-44 anos',
      'AGE_RANGE_45_54': '45-54 anos',
      'AGE_RANGE_55_64': '55-64 anos',
      'AGE_RANGE_65_UP': '65+ anos',
      'AGE_RANGE_UNDETERMINED': 'Indefinido'
    };

    const genderMap: { [key: string]: string } = {
      'MALE': 'Masculino',
      'FEMALE': 'Feminino',
      'UNDETERMINED': 'Indefinido'
    };

    processedData.forEach(demo => {
      demo.age_range_name = ageRangeMap[demo.age_range] || demo.age_range;
      demo.gender_name = genderMap[demo.gender] || demo.gender;
    });

    // Separar dados por gênero e idade para facilitar o uso
    const genderData = new Map();
    const ageData = new Map();

    processedData.forEach(demo => {
      // Agrupar por gênero
      const genderKey = demo.gender;
      const currentGender = genderData.get(genderKey) || {
        gender: demo.gender,
        gender_name: demo.gender_name,
        impressions: 0,
        clicks: 0,
        cost_micros: 0,
        conversions: 0,
        campaigns: new Set()
      };

      currentGender.impressions += demo.impressions;
      currentGender.clicks += demo.clicks;
      currentGender.cost_micros += demo.cost_micros;
      currentGender.conversions += demo.conversions;
      demo.campaigns.forEach((campaign: string) => currentGender.campaigns.add(campaign));

      genderData.set(genderKey, currentGender);

      // Agrupar por idade
      const ageKey = demo.age_range;
      const currentAge = ageData.get(ageKey) || {
        age_range: demo.age_range,
        age_range_name: demo.age_range_name,
        impressions: 0,
        clicks: 0,
        cost_micros: 0,
        conversions: 0,
        campaigns: new Set()
      };

      currentAge.impressions += demo.impressions;
      currentAge.clicks += demo.clicks;
      currentAge.cost_micros += demo.cost_micros;
      currentAge.conversions += demo.conversions;
      demo.campaigns.forEach((campaign: string) => currentAge.campaigns.add(campaign));

      ageData.set(ageKey, currentAge);
    });

    // Processar dados agrupados
    const genderSummary = Array.from(genderData.values()).map(gender => ({
      ...gender,
      campaigns: Array.from(gender.campaigns),
      campaign_count: gender.campaigns.size,
      ctr: gender.impressions > 0 ? (gender.clicks / gender.impressions) * 100 : 0,
      conversion_rate: gender.clicks > 0 ? (gender.conversions / gender.clicks) * 100 : 0,
      cost_per_conversion: gender.conversions > 0 ? gender.cost_micros / gender.conversions : 0
    }));

    const ageSummary = Array.from(ageData.values()).map(age => ({
      ...age,
      campaigns: Array.from(age.campaigns),
      campaign_count: age.campaigns.size,
      ctr: age.impressions > 0 ? (age.clicks / age.impressions) * 100 : 0,
      conversion_rate: age.clicks > 0 ? (age.conversions / age.clicks) * 100 : 0,
      cost_per_conversion: age.conversions > 0 ? age.cost_micros / age.conversions : 0
    }));

    return NextResponse.json({
      success: true,
      data: {
        detailed: processedData,
        gender_summary: genderSummary,
        age_summary: ageSummary
      },
      total_demographics: processedData.length,
      total_impressions: processedData.reduce((sum, demo) => sum + demo.impressions, 0),
      total_clicks: processedData.reduce((sum, demo) => sum + demo.clicks, 0),
      total_cost: processedData.reduce((sum, demo) => sum + demo.cost_micros, 0),
      total_conversions: processedData.reduce((sum, demo) => sum + demo.conversions, 0)
    });

  } catch (error: any) {
    console.error('Erro ao buscar dados demográficos:', error);
    
    return NextResponse.json({
      error: 'Erro ao buscar dados demográficos',
      details: error.message
    }, { status: 500 });
  }
}
