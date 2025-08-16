import { useState, useEffect } from 'react';

interface DeviceData {
  device: string;
  device_name: string;
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

interface DeviceResponse {
  success: boolean;
  data: DeviceData[];
  total_devices: number;
  total_impressions: number;
  total_clicks: number;
  total_cost: number;
  total_conversions: number;
}

export function useGoogleAdsDevices(customerId?: string, dateFilter?: { from: Date | undefined; to: Date | undefined }) {
  const [data, setData] = useState<DeviceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totals, setTotals] = useState({
    total_devices: 0,
    total_impressions: 0,
    total_clicks: 0,
    total_cost: 0,
    total_conversions: 0
  });

  const fetchDeviceData = async () => {
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

      const response = await fetch(`/api/google-ads/devices?${params}`);
      const result: DeviceResponse = await response.json();

      if (result.success) {
        setData(result.data);
        setTotals({
          total_devices: result.total_devices,
          total_impressions: result.total_impressions,
          total_clicks: result.total_clicks,
          total_cost: result.total_cost,
          total_conversions: result.total_conversions
        });
      } else {
        setError('Erro ao carregar dados de dispositivos');
      }
    } catch (err) {
      setError('Erro ao buscar dados de dispositivos');
      console.error('Erro ao buscar dados de dispositivos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeviceData();
  }, [customerId, dateFilter?.from, dateFilter?.to]);

  const refetch = () => {
    fetchDeviceData();
  };

  // Funções utilitárias para formatação
  const formatDeviceData = {
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
    data,
    loading,
    error,
    totals,
    refetch,
    formatDeviceData
  };
}
