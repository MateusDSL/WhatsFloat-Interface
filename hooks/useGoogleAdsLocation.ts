import { useState, useEffect } from 'react';

interface LocationData {
  state: string;
  state_id: string;
  impressions: number;
  clicks: number;
  cost_micros: number;
  conversions: number;
  data_points: number;
  ctr: number;
  cpc: number;
  conversion_rate: number;
  cost_per_conversion: number;
}

interface LocationResponse {
  success: boolean;
  data: LocationData[];
  total_states: number;
  total_impressions: number;
  total_clicks: number;
  total_cost: number;
  total_conversions: number;
}

export function useGoogleAdsLocation(customerId?: string, dateFilter?: { from: Date | undefined; to: Date | undefined }) {
  const [data, setData] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totals, setTotals] = useState({
    total_states: 0,
    total_impressions: 0,
    total_clicks: 0,
    total_cost: 0,
    total_conversions: 0
  });

  const fetchLocationData = async () => {
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

      const response = await fetch(`/api/google-ads/location?${params}`);
      const result: LocationResponse = await response.json();

      if (result.success) {
        setData(result.data);
        setTotals({
          total_states: result.total_states,
          total_impressions: result.total_impressions,
          total_clicks: result.total_clicks,
          total_cost: result.total_cost,
          total_conversions: result.total_conversions
        });
      } else {
        setError('Erro ao carregar dados de localização');
      }
    } catch (err) {
      setError('Erro ao buscar dados de localização');
      console.error('Erro ao buscar dados de localização:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocationData();
  }, [customerId, dateFilter?.from, dateFilter?.to]);

  const refetch = () => {
    fetchLocationData();
  };

  // Funções utilitárias para formatação
  const formatLocationData = {
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
    }
  };

  return {
    data,
    loading,
    error,
    totals,
    refetch,
    formatLocationData
  };
}
