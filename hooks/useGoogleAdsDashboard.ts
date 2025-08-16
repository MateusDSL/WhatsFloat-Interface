import React from 'react';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useGoogleAds } from './useGoogleAds';
import { calculateAggregatedMetrics, CalculatedMetrics } from '@/lib/google-ads-formatters';

interface DateFilter {
  from: Date | undefined;
  to: Date | undefined;
}

interface UseGoogleAdsDashboardReturn {
  // Estados
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  dateFilter: DateFilter;
  setDateFilter: (filter: DateFilter) => void;
  sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
  setSortConfig: (config: { key: string; direction: 'asc' | 'desc' } | null) => void;
  
  // Dados processados
  campaigns: any[];
  filteredCampaigns: any[];
  sortedCampaigns: any[];
  aggregatedMetrics: CalculatedMetrics;
  
  // Estados de loading e erro
  loading: boolean;
  error: any;
  clearError: () => void;
  
  // Funções utilitárias
  handleSort: (key: string) => void;
  clearSort: () => void;
  getSortIcon: (key: string) => { icon: string; className: string };
  
  // Debug info
  debugInfo: {
    totalCampaigns: number;
    filteredCount: number;
    hasDateFilter: boolean;
    lastFetch: string | null;
  };
}

export function useGoogleAdsDashboard(customerId?: string): UseGoogleAdsDashboardReturn {
  // Estados locais
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>(() => {
    // Configurar filtro padrão para últimos 7 dias
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    const from = new Date(sevenDaysAgo);
    from.setHours(0, 0, 0, 0);
    
    const to = new Date(today);
    to.setHours(23, 59, 59, 999);
    
    return { from, to };
  });
  
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  // Cache para evitar requisições desnecessárias
  const cacheRef = useRef<Map<string, { data: any; timestamp: number }>>(new Map());
  const lastFetchRef = useRef<string | null>(null);
  
  // Hook do Google Ads
  const {
    data,
    loading,
    error,
    fetchCampaigns,
    clearError
  } = useGoogleAds();

  const campaigns = data?.data || [];

  // Função para gerar chave de cache
  const getCacheKey = useCallback((customerId?: string, dateFrom?: string, dateTo?: string) => {
    return `${customerId || 'default'}-${dateFrom || 'no-start'}-${dateTo || 'no-end'}`;
  }, []);

  // Função para verificar se o cache ainda é válido (5 minutos)
  const isCacheValid = useCallback((timestamp: number) => {
    return Date.now() - timestamp < 5 * 60 * 1000; // 5 minutos
  }, []);

  // Função otimizada para buscar dados
  const fetchDataOptimized = useCallback(async () => {
    const dateFrom = dateFilter.from ? dateFilter.from.toISOString().split('T')[0] : undefined;
    const dateTo = dateFilter.to ? dateFilter.to.toISOString().split('T')[0] : undefined;
    
    const cacheKey = getCacheKey(customerId, dateFrom, dateTo);
    const cached = cacheRef.current.get(cacheKey);
    
    // Verificar se temos dados em cache válidos
    if (cached && isCacheValid(cached.timestamp)) {
      console.log('📦 Usando dados do cache:', cacheKey);
      return;
    }
    
    // Buscar novos dados
    console.log('🔍 Buscando novos dados:', { customerId, dateFrom, dateTo });
    lastFetchRef.current = new Date().toISOString();
    
    await fetchCampaigns(customerId, dateFrom, dateTo);
    
    // Armazenar no cache após busca bem-sucedida
    if (data) {
      cacheRef.current.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
    }
  }, [customerId, dateFilter.from, dateFilter.to, fetchCampaigns, data, getCacheKey, isCacheValid]);

  // useEffect otimizado com debounce melhorado
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchDataOptimized();
    }, 300); // Reduzido para 300ms para melhor responsividade

    return () => clearTimeout(timeoutId);
  }, [fetchDataOptimized]);

  // Filtros otimizados com useMemo
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign: any) => {
      if (!searchTerm) return true;
      return campaign.campaign.name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [campaigns, searchTerm]);

  // Ordenação otimizada
  const sortedCampaigns = useMemo(() => {
    if (!sortConfig) return filteredCampaigns;

    return [...filteredCampaigns].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case 'name':
          aValue = a.campaign.name.toLowerCase();
          bValue = b.campaign.name.toLowerCase();
          break;
        case 'impressions':
          aValue = a.metrics?.impressions || 0;
          bValue = b.metrics?.impressions || 0;
          break;
        case 'clicks':
          aValue = a.metrics?.clicks || 0;
          bValue = b.metrics?.clicks || 0;
          break;
        case 'ctr':
          aValue = (a.metrics?.clicks || 0) / (a.metrics?.impressions || 1);
          bValue = (b.metrics?.clicks || 0) / (b.metrics?.impressions || 1);
          break;
        case 'cost':
          aValue = a.metrics?.cost_micros || 0;
          bValue = b.metrics?.cost_micros || 0;
          break;
        case 'cpc':
          aValue = a.metrics?.average_cpc || 0;
          bValue = b.metrics?.average_cpc || 0;
          break;
        case 'conversions':
          aValue = a.metrics?.conversions || 0;
          bValue = b.metrics?.conversions || 0;
          break;
        case 'conversionRate':
          aValue = (a.metrics?.conversions || 0) / (a.metrics?.clicks || 1);
          bValue = (b.metrics?.conversions || 0) / (b.metrics?.clicks || 1);
          break;
        case 'costPerConversion':
          aValue = (a.metrics?.cost_micros || 0) / (a.metrics?.conversions || 1);
          bValue = (b.metrics?.cost_micros || 0) / (b.metrics?.conversions || 1);
          break;
        case 'budget':
          aValue = a.campaign_budget?.amount_micros || 0;
          bValue = b.campaign_budget?.amount_micros || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredCampaigns, sortConfig]);

  // Métricas agregadas calculadas
  const aggregatedMetrics = useMemo(() => {
    return calculateAggregatedMetrics(sortedCampaigns);
  }, [sortedCampaigns]);

  // Funções utilitárias
  const handleSort = useCallback((key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { key, direction: 'asc' };
    });
  }, []);

  const clearSort = useCallback(() => {
    setSortConfig(null);
  }, []);

  const getSortIcon = useCallback((key: string) => {
    if (sortConfig?.key !== key) {
      return { icon: '↑', className: 'w-4 h-4 opacity-30' };
    }
    return sortConfig.direction === 'asc' 
      ? { icon: '↑', className: 'w-4 h-4' }
      : { icon: '↓', className: 'w-4 h-4' };
  }, [sortConfig]);

  // Informações de debug
  const debugInfo = useMemo(() => ({
    totalCampaigns: campaigns.length,
    filteredCount: filteredCampaigns.length,
    hasDateFilter: !!(dateFilter.from && dateFilter.to),
    lastFetch: lastFetchRef.current
  }), [campaigns.length, filteredCampaigns.length, dateFilter.from, dateFilter.to]);

  return {
    // Estados
    searchTerm,
    setSearchTerm,
    dateFilter,
    setDateFilter,
    sortConfig,
    setSortConfig,
    
    // Dados processados
    campaigns,
    filteredCampaigns,
    sortedCampaigns,
    aggregatedMetrics,
    
    // Estados de loading e erro
    loading,
    error,
    clearError,
    
    // Funções utilitárias
    handleSort,
    clearSort,
    getSortIcon,
    
    // Debug info
    debugInfo
  };
}
