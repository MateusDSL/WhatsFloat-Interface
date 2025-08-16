// Utilitários centralizados para formatação de dados do Google Ads
// Este arquivo garante consistência na exibição dos dados em toda a aplicação

export const GoogleAdsFormatters = {
  // Formata custo de micros para reais
  formatCost: (costMicros: number): string => {
    const costInReais = costMicros / 1000000;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(costInReais);
  },

  // Formata impressões com separadores
  formatImpressions: (impressions: number): string => {
    return new Intl.NumberFormat('pt-BR').format(impressions);
  },

  // Calcula CTR
  calculateCTR: (clicks: number, impressions: number): string => {
    if (impressions === 0) return '0%';
    const ctr = (clicks / impressions) * 100;
    return `${ctr.toFixed(2)}%`;
  },

  // Calcula CPC médio
  calculateAvgCPC: (costMicros: number, clicks: number): string => {
    if (clicks === 0) return 'R$ 0,00';
    const avgCPC = (costMicros / 1000000) / clicks;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(avgCPC);
  },

  // Formata CPC médio direto da API
  formatAvgCPC: (avgCPCMicros: number): string => {
    const avgCPC = avgCPCMicros / 1000000;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(avgCPC);
  },

  // Calcula taxa de conversão
  calculateConversionRate: (conversions: number, clicks: number): string => {
    if (clicks === 0) return '0%';
    const conversionRate = (conversions / clicks) * 100;
    return `${conversionRate.toFixed(2)}%`;
  },

  // Formata conversões sem casas decimais
  formatConversions: (conversions: number): string => {
    return Math.round(conversions).toString();
  },

  // Formata data
  formatDate: (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  },

  // Calcula custo por conversão
  calculateCostPerConversion: (costMicros: number, conversions: number): string => {
    if (conversions === 0) return 'R$ 0,00';
    const costPerConversion = costMicros / conversions;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(costPerConversion / 1000000);
  },

  // Formata números grandes com sufixos (K, M, B)
  formatLargeNumber: (num: number): string => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + 'B';
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  },

  // Formata porcentagem
  formatPercentage: (value: number, total: number): string => {
    if (total === 0) return '0%';
    const percentage = (value / total) * 100;
    return `${percentage.toFixed(2)}%`;
  }
};

// Interface para métricas calculadas
export interface CalculatedMetrics {
  totalCost: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  averageCTR: string;
  averageCPC: string;
  averageConversionRate: string;
  averageCostPerConversion: string;
}

// Função para calcular métricas agregadas
export const calculateAggregatedMetrics = (campaigns: any[]): CalculatedMetrics => {
  const totals = campaigns.reduce((acc, campaign) => {
    const metrics = campaign.metrics || {};
    return {
      cost: acc.cost + (metrics.cost_micros || 0),
      impressions: acc.impressions + (metrics.impressions || 0),
      clicks: acc.clicks + (metrics.clicks || 0),
      conversions: acc.conversions + (metrics.conversions || 0)
    };
  }, { cost: 0, impressions: 0, clicks: 0, conversions: 0 });

  return {
    totalCost: totals.cost,
    totalImpressions: totals.impressions,
    totalClicks: totals.clicks,
    totalConversions: totals.conversions,
    averageCTR: GoogleAdsFormatters.calculateCTR(totals.clicks, totals.impressions),
    averageCPC: GoogleAdsFormatters.calculateAvgCPC(totals.cost, totals.clicks),
    averageConversionRate: GoogleAdsFormatters.calculateConversionRate(totals.conversions, totals.clicks),
    averageCostPerConversion: GoogleAdsFormatters.calculateCostPerConversion(totals.cost, totals.conversions)
  };
};
