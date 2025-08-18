import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAdsCustomer } from '@/lib/google-ads-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID é obrigatório' }, { status: 400 });
    }

    // Usar o cliente Google Ads configurado
    const customer = getGoogleAdsCustomer(customerId);

    // Query simples para buscar dados de keywords
    const query = `
      SELECT
        campaign.id,
        campaign.name,
        ad_group.id,
        ad_group.name,
        ad_group_criterion.criterion_id,
        ad_group_criterion.keyword.text,
        ad_group_criterion.keyword.match_type,
        ad_group_criterion.status,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.average_cpc,
        metrics.ctr,
        metrics.average_cpm,
        metrics.conversions_from_interactions_rate
      FROM keyword_view
      WHERE campaign.status = 'ENABLED'
        AND ad_group.status = 'ENABLED'
        AND ad_group_criterion.keyword.text IS NOT NULL
      ORDER BY metrics.cost_micros DESC
      LIMIT 100
    `;

    const response = await customer.query(query);
    const results = response || [];

    // Processar dados de keywords
    const keywordsData = results.map((row: any) => {
      const campaign = row.campaign || {};
      const adGroup = row.ad_group || {};
      const adGroupCriterion = row.ad_group_criterion || {};
      const metrics = row.metrics || {};

      return {
        campaignId: campaign.id,
        campaignName: campaign.name,
        adGroupId: adGroup.id,
        adGroupName: adGroup.name,
        keywordId: adGroupCriterion.criterion_id,
        keyword: adGroupCriterion.keyword?.text || '',
        matchType: adGroupCriterion.keyword?.match_type || '',
        status: adGroupCriterion.status,
        impressions: metrics.impressions || 0,
        clicks: metrics.clicks || 0,
        cost: metrics.cost_micros ? metrics.cost_micros / 1000000 : 0,
        conversions: metrics.conversions || 0,
        averageCpc: metrics.average_cpc ? metrics.average_cpc / 1000000 : 0,
        ctr: metrics.ctr || 0,
        averageCpm: metrics.average_cpm ? metrics.average_cpm / 1000 : 0,
        conversionRate: metrics.conversions_from_interactions_rate || 0
      };
    });

    // Agrupar keywords por campanha
    const campaignKeywords: { [key: string]: any } = {};
    
    keywordsData.forEach((keyword: any) => {
      const campaignName = keyword.campaignName;
      
      if (!campaignKeywords[campaignName]) {
        campaignKeywords[campaignName] = {
          campaignName,
          campaignId: keyword.campaignId,
          keywords: [],
          totalImpressions: 0,
          totalClicks: 0,
          totalCost: 0,
          totalConversions: 0
        };
      }

      campaignKeywords[campaignName].keywords.push(keyword);
      campaignKeywords[campaignName].totalImpressions += keyword.impressions;
      campaignKeywords[campaignName].totalClicks += keyword.clicks;
      campaignKeywords[campaignName].totalCost += keyword.cost;
      campaignKeywords[campaignName].totalConversions += keyword.conversions;
    });

    // Top keywords por performance
    const topKeywords = keywordsData
      .filter((k: any) => k.impressions > 0)
      .sort((a: any, b: any) => b.cost - a.cost)
      .slice(0, 20);

    // Calcular totais gerais
    const totals = {
      keywords: keywordsData.length,
      campaigns: Object.keys(campaignKeywords).length,
      totalImpressions: keywordsData.reduce((sum, k) => sum + k.impressions, 0),
      totalClicks: keywordsData.reduce((sum, k) => sum + k.clicks, 0),
      totalCost: keywordsData.reduce((sum, k) => sum + k.cost, 0),
      totalConversions: keywordsData.reduce((sum, k) => sum + k.conversions, 0)
    };

    return NextResponse.json({
      success: true,
      customer_id: customerId,
      timestamp: new Date().toISOString(),
      data: {
        keywords: keywordsData,
        campaigns: Object.values(campaignKeywords),
        topKeywords: topKeywords
      },
      totals: totals,
      query: query,
      note: 'Dados de keywords com métricas básicas'
    });

  } catch (error: any) {
    console.error('Erro ao buscar dados de keywords:', error);
    
    return NextResponse.json({
      error: 'Erro ao buscar dados de keywords',
      details: error.message,
      help: 'Verifique as credenciais e tente novamente'
    }, { status: 500 });
  }
}

