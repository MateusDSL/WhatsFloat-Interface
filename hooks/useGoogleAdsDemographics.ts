import { useState, useEffect } from 'react';

interface DemographicData {
  age_range: string;
  age_range_name: string;
  gender: string;
  gender_name: string;
  impressions: number;
  clicks: number;
  cost_micros: number;
  conversions: number;
  campaigns: string[];
  campaign_count: number;
  ctr: number;
  cpc: number;
  cpm: number;
  conversion_rate: number;
  cost_per_conversion: number;
}

interface GenderSummary {
  gender: string;
  gender_name: string;
  impressions: number;
  clicks: number;
  cost_micros: number;
  conversions: number;
  campaigns: string[];
  campaign_count: number;
  ctr: number;
  conversion_rate: number;
  cost_per_conversion: number;
}

interface AgeSummary {
  age_range: string;
  age_range_name: string;
  impressions: number;
  clicks: number;
  cost_micros: number;
  conversions: number;
  campaigns: string[];
  campaign_count: number;
  ctr: number;
  conversion_rate: number;
  cost_per_conversion: number;
}

interface DemographicsResponse {
  success: boolean;
  data: {
    detailed: DemographicData[];
    gender_summary: GenderSummary[];
    age_summary: AgeSummary[];
  };
  total_demographics: number;
  total_impressions: number;
  total_clicks: number;
  total_cost: number;
  total_conversions: number;
}

export function useGoogleAdsDemographics(customerId?: string, dateFilter?: { from: Date | undefined; to: Date | undefined }) {
  const [detailedData, setDetailedData] = useState<DemographicData[]>([]);
  const [genderSummary, setGenderSummary] = useState<GenderSummary[]>([]);
  const [ageSummary, setAgeSummary] = useState<AgeSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totals, setTotals] = useState({
    total_demographics: 0,
    total_impressions: 0,
    total_clicks: 0,
    total_cost: 0,
    total_conversions: 0
  });

  const fetchDemographicsData = async () => {
    if (!customerId) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        customerId: customerId
      });

      if (dateFilter?.from && dateFilter?.to) {
        params.append('dateFrom', dateFilter.from.toISOString().split('T')[0]);
        params.append('dateTo', dateFilter.to.toISOString().split('T')[0]);
      }

      const response = await fetch(`/api/google-ads/demographics?${params}`);
      const result: DemographicsResponse = await response.json();

      if (result.success) {
        setDetailedData(result.data.detailed);
        setGenderSummary(result.data.gender_summary);
        setAgeSummary(result.data.age_summary);
        setTotals({
          total_demographics: result.total_demographics,
          total_impressions: result.total_impressions,
          total_clicks: result.total_clicks,
          total_cost: result.total_cost,
          total_conversions: result.total_conversions
        });
      } else {
        setError('Erro ao carregar dados demográficos');
      }
    } catch (err) {
      setError('Erro ao buscar dados demográficos');
      console.error('Erro ao buscar dados demográficos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemographicsData();
  }, [customerId, dateFilter?.from, dateFilter?.to]);

  const refetch = () => {
    fetchDemographicsData();
  };

  // Funções utilitárias para formatação
  const formatDemographicsData = {
    formatCost: (costMicros: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(costMicros / 1000000);
    },
    formatNumber: (num: number) => {
      return new Intl.NumberFormat('pt-BR').format(num);
    },
    formatPercentage: (value: number) => {
      return `${value.toFixed(2)}%`;
    },
    formatCPC: (cpc: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(cpc / 1000000);
    },
    formatCPM: (cpm: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(cpm / 1000000);
    }
  };

  return {
    detailedData,
    genderSummary,
    ageSummary,
    loading,
    error,
    totals,
    refetch,
    formatDemographicsData
  };
}
