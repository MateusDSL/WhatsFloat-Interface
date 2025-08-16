import { useState, useCallback } from 'react';

interface GoogleAdsData {
  success: boolean;
  data: any[];
  timestamp: string;
  type?: string;
}

interface GoogleAdsError {
  error: string;
  details?: string;
  help?: string;
}

interface UseGoogleAdsReturn {
  data: GoogleAdsData | null;
  loading: boolean;
  error: GoogleAdsError | null;
  fetchCampaigns: (customerId?: string, dateFrom?: string, dateTo?: string) => Promise<void>;
  fetchAds: (customerId?: string) => Promise<void>;
  fetchKeywords: (customerId?: string) => Promise<void>;
  executeCustomQuery: (query: string, customerId?: string) => Promise<void>;
  clearError: () => void;
}

export function useGoogleAds(): UseGoogleAdsReturn {
  const [data, setData] = useState<GoogleAdsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<GoogleAdsError | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchData = useCallback(async (
    type: 'campaigns' | 'ads' | 'keywords',
    customerId?: string,
    dateFrom?: string,
    dateTo?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ type });
      if (customerId) {
        params.append('customerId', customerId);
      }
      if (dateFrom) {
        params.append('dateFrom', dateFrom);
      }
      if (dateTo) {
        params.append('dateTo', dateTo);
      }

      const response = await fetch(`/api/google-ads/campaigns?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro na requisição');
      }

      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError({
        error: errorMessage,
        details: 'Falha ao buscar dados do Google Ads',
        help: 'Verifique as credenciais e tente novamente'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCampaigns = useCallback((customerId?: string, dateFrom?: string, dateTo?: string) => 
    fetchData('campaigns', customerId, dateFrom, dateTo), []);

  const fetchAds = useCallback((customerId?: string) => 
    fetchData('ads', customerId), []);

  const fetchKeywords = useCallback((customerId?: string) => 
    fetchData('keywords', customerId), []);

  const executeCustomQuery = useCallback(async (query: string, customerId?: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/google-ads/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, customerId })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro na execução da query');
      }

      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError({
        error: errorMessage,
        details: 'Falha ao executar query customizada',
        help: 'Verifique a sintaxe da query GAQL'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    data,
    loading,
    error,
    fetchCampaigns,
    fetchAds,
    fetchKeywords,
    executeCustomQuery,
    clearError
  };
}

// Hook para dados específicos de campanhas
export function useGoogleAdsCampaigns() {
  const { data, loading, error, fetchCampaigns, clearError } = useGoogleAds();

  return {
    campaigns: data?.data || [],
    loading,
    error,
    fetchCampaigns: (customerId?: string, dateFrom?: string, dateTo?: string) => 
      fetchCampaigns(customerId, dateFrom, dateTo),
    clearError,
    lastUpdated: data?.timestamp
  };
}

// Hook para dados específicos de anúncios
export function useGoogleAdsAds() {
  const { data, loading, error, fetchAds, clearError } = useGoogleAds();

  return {
    ads: data?.data || [],
    loading,
    error,
    fetchAds,
    clearError,
    lastUpdated: data?.timestamp
  };
}

// Hook para dados específicos de palavras-chave
export function useGoogleAdsKeywords() {
  const { data, loading, error, fetchKeywords, clearError } = useGoogleAds();

  return {
    keywords: data?.data || [],
    loading,
    error,
    fetchKeywords,
    clearError,
    lastUpdated: data?.timestamp
  };
}

// Hook para dados específicos do gráfico (segmentados por dia)
export function useGoogleAdsChartData() {
  const [data, setData] = useState<GoogleAdsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<GoogleAdsError | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchChartData = useCallback(async (customerId?: string, dateFrom?: string, dateTo?: string) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (customerId) {
        params.append('customerId', customerId);
      }
      if (dateFrom) {
        params.append('dateFrom', dateFrom);
      }
      if (dateTo) {
        params.append('dateTo', dateTo);
      }

      const response = await fetch(`/api/google-ads/chart-data?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro na requisição');
      }

      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError({
        error: errorMessage,
        details: 'Falha ao buscar dados do gráfico',
        help: 'Verifique as credenciais e tente novamente'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    chartData: data?.data || [],
    loading,
    error,
    fetchChartData,
    clearError,
    lastUpdated: data?.timestamp
  };
}

// Re-export dos formatters centralizados para compatibilidade
export { GoogleAdsFormatters as formatGoogleAdsData } from '@/lib/google-ads-formatters';
