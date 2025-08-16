'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useGoogleAds, formatGoogleAdsData } from '../hooks/useGoogleAds';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { TrendingUp, Eye, MousePointer, DollarSign, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { GoogleAdsDateFilter } from './google-ads-date-filter';
import { GoogleAdsLocationChart } from './google-ads-location-chart';
import { GoogleAdsChart } from './google-ads-chart';

interface GoogleAdsDashboardProps {
  customerId?: string;
}

export function GoogleAdsDashboard({ customerId }: GoogleAdsDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Configurar filtro padrão para últimos 7 dias
  const getDefaultDateFilter = () => {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    const from = new Date(sevenDaysAgo);
    from.setHours(0, 0, 0, 0);
    
    const to = new Date(today);
    to.setHours(23, 59, 59, 999);
    
    return {
      from,
      to,
    };
  };
  
  const [dateFilter, setDateFilter] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>(getDefaultDateFilter());
  
  // Estado para ordenação
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  
  // Ref para debounce
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);
  
  const {
    data,
    loading: campaignsLoading,
    error: campaignsError,
    fetchCampaigns,
    clearError: clearCampaignsError
  } = useGoogleAds();
  
  const campaigns = data?.data || [];

  // Carrega dados iniciais e quando o filtro de data muda
  useEffect(() => {
    // Limpar timeout anterior
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Debounce de 500ms para evitar múltiplas requisições
    debounceRef.current = setTimeout(() => {
      // Converter para formato ISO string antes de enviar para API
      const dateFrom = dateFilter.from ? dateFilter.from.toISOString().split('T')[0] : undefined;
      const dateTo = dateFilter.to ? dateFilter.to.toISOString().split('T')[0] : undefined;
      
      console.log('🔍 Filtro de data:', { dateFrom, dateTo });
      fetchCampaigns(customerId, dateFrom, dateTo);
    }, 500);
    
    // Cleanup function
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [customerId, dateFilter.from, dateFilter.to]);

  // Filtros - agora apenas busca por nome, pois o filtro de data é aplicado na API
  const filteredCampaigns = campaigns.filter((campaign: any) => {
    if (!searchTerm) return true;
    return campaign.campaign.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Função para ordenar dados
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

  // Função para lidar com ordenação
  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { key, direction: 'asc' };
    });
  };

  // Função para obter ícone de ordenação
  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) {
      return <ChevronUp className="w-4 h-4 opacity-30" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4" />
      : <ChevronDown className="w-4 h-4" />;
  };

  // Debug logs (reduzidos para melhorar performance)
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Total de campanhas da API:', campaigns.length);
    console.log('✅ Campanhas filtradas:', filteredCampaigns.length);
    console.log('🎯 Filtro de data ativo:', dateFilter.from && dateFilter.to ? 'SIM' : 'NÃO');
  }



  // Função para limpar ordenação
  const clearSort = () => {
    setSortConfig(null);
  };

  // Componentes de skeleton
  const StatCardSkeleton = () => (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );

  const TableRowSkeleton = () => (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
    </TableRow>
  );

    return (
    <div className="flex-1 p-4 space-y-4 overflow-auto">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {campaignsLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-gray-900">Custo Total</CardTitle>
                <div className="p-2 bg-gray-100 rounded-lg">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {formatGoogleAdsData.formatCost(
                    campaigns.reduce((sum, campaign) => sum + (campaign.metrics?.cost_micros || 0), 0)
                  )}
                </div>
                <p className="text-xs text-gray-600 font-medium">Investimento</p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-gray-900">Conversões</CardTitle>
                <div className="p-2 bg-gray-100 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {campaigns.reduce((sum, campaign) => sum + (campaign.metrics?.conversions || 0), 0).toFixed(2)}
                </div>
                <p className="text-xs text-gray-600 font-medium">Total de conversões</p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-gray-900">Cliques</CardTitle>
                <div className="p-2 bg-gray-100 rounded-lg">
                  <MousePointer className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {formatGoogleAdsData.formatImpressions(
                    campaigns.reduce((sum, campaign) => sum + (campaign.metrics?.clicks || 0), 0)
                  )}
                </div>
                <p className="text-xs text-gray-600 font-medium">Total de cliques</p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-gray-900">CTR</CardTitle>
                <div className="p-2 bg-gray-100 rounded-lg">
                  <MousePointer className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {(() => {
                    const totalClicks = campaigns.reduce((sum, campaign) => sum + (campaign.metrics?.clicks || 0), 0);
                    const totalImpressions = campaigns.reduce((sum, campaign) => sum + (campaign.metrics?.impressions || 0), 0);
                    return totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';
                  })()}%
                </div>
                <p className="text-xs text-gray-600 font-medium">Taxa de cliques</p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-gray-900">CPC</CardTitle>
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Eye className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {(() => {
                    const totalCost = campaigns.reduce((sum, campaign) => sum + (campaign.metrics?.cost_micros || 0), 0);
                    const totalClicks = campaigns.reduce((sum, campaign) => sum + (campaign.metrics?.clicks || 0), 0);
                    return totalClicks > 0 ? formatGoogleAdsData.formatCost(totalCost / totalClicks) : 'R$ 0,00';
                  })()}
                </div>
                <p className="text-xs text-gray-600 font-medium">Custo por clique</p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-gray-900">Custo por Conversão</CardTitle>
                <div className="p-2 bg-gray-100 rounded-lg">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {(() => {
                    const totalCost = campaigns.reduce((sum, campaign) => sum + (campaign.metrics?.cost_micros || 0), 0);
                    const totalConversions = campaigns.reduce((sum, campaign) => sum + (campaign.metrics?.conversions || 0), 0);
                    return totalConversions > 0 ? formatGoogleAdsData.formatCost(totalCost / totalConversions) : 'R$ 0,00';
                  })()}
                </div>
                <p className="text-xs text-gray-600 font-medium">Custo por conversão</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GoogleAdsChart customerId={customerId} dateFilter={dateFilter} />
        <GoogleAdsLocationChart customerId={customerId} dateFilter={dateFilter} />
      </div>

      {/* Campanhas Table */}
      <Card className="flex-1 flex flex-col min-h-0 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
        <CardHeader className="flex-shrink-0 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Campanhas
              </CardTitle>
              <CardDescription className="text-gray-600 mt-1">
                Gerencie todas as suas campanhas ativas do Google Ads
                {sortConfig && (
                  <span className="ml-2 text-purple-600 font-medium">
                    • Ordenado por {sortConfig.key} ({sortConfig.direction === 'asc' ? 'crescente' : 'decrescente'})
                  </span>
                )}
              </CardDescription>
            </div>

          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-0">
                     {/* Search Bar and Date Filter */}
           <div className="flex flex-col sm:flex-row gap-4 mb-6">
             <div className="relative flex-1">
               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
               <Input
                 placeholder="Buscar por nome da campanha..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="pl-10 border-gray-200 focus:border-green-500 focus:ring-green-500 transition-colors duration-200"
               />
             </div>
            <div className="flex gap-2">
              <GoogleAdsDateFilter 
                value={dateFilter} 
                onChange={setDateFilter}
                customerId={customerId}
              />
              {sortConfig && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSort}
                  className="px-3"
                >
                  Limpar Ordenação
                </Button>
              )}
            </div>
           </div>

          {/* Campanhas Table */}
          <div className="rounded-md border flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-auto">
              <Table>
                                 <TableHeader>
                   <TableRow>
                     <TableHead 
                       className="w-48 text-left cursor-pointer hover:bg-gray-50 transition-colors"
                       onClick={() => handleSort('name')}
                     >
                       <div className="flex items-center gap-1">
                         Campanha
                         {getSortIcon('name')}
                       </div>
                     </TableHead>
                     <TableHead 
                       className="w-32 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                       onClick={() => handleSort('impressions')}
                     >
                       <div className="flex items-center justify-center gap-1">
                         Impressões
                         {getSortIcon('impressions')}
                       </div>
                     </TableHead>
                     <TableHead 
                       className="w-24 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                       onClick={() => handleSort('clicks')}
                     >
                       <div className="flex items-center justify-center gap-1">
                         Cliques
                         {getSortIcon('clicks')}
                       </div>
                     </TableHead>
                     <TableHead 
                       className="w-24 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                       onClick={() => handleSort('ctr')}
                     >
                       <div className="flex items-center justify-center gap-1">
                         CTR
                         {getSortIcon('ctr')}
                       </div>
                     </TableHead>
                     <TableHead 
                       className="w-32 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                       onClick={() => handleSort('cost')}
                     >
                       <div className="flex items-center justify-center gap-1">
                         Custo
                         {getSortIcon('cost')}
                       </div>
                     </TableHead>
                     <TableHead 
                       className="w-32 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                       onClick={() => handleSort('cpc')}
                     >
                       <div className="flex items-center justify-center gap-1">
                         CPC Médio
                         {getSortIcon('cpc')}
                       </div>
                     </TableHead>
                     <TableHead 
                       className="w-32 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                       onClick={() => handleSort('conversions')}
                     >
                       <div className="flex items-center justify-center gap-1">
                         Conversões
                         {getSortIcon('conversions')}
                       </div>
                     </TableHead>
                     <TableHead 
                       className="w-32 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                       onClick={() => handleSort('costPerConversion')}
                     >
                       <div className="flex items-center justify-center gap-1">
                         Custo/Conv.
                         {getSortIcon('costPerConversion')}
                       </div>
                     </TableHead>
                     <TableHead 
                       className="w-32 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                       onClick={() => handleSort('conversionRate')}
                     >
                       <div className="flex items-center justify-center gap-1">
                         Taxa Conv.
                         {getSortIcon('conversionRate')}
                       </div>
                     </TableHead>
                     <TableHead 
                       className="w-32 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                       onClick={() => handleSort('budget')}
                     >
                       <div className="flex items-center justify-center gap-1">
                         Orçamento
                         {getSortIcon('budget')}
                       </div>
                     </TableHead>
                   </TableRow>
                 </TableHeader>
                                                 <TableBody>
                  {campaignsLoading ? (
                    // Skeletons para as linhas da tabela durante o carregamento
                    Array.from({ length: 8 }).map((_, index) => (
                      <TableRowSkeleton key={`skeleton-${index}`} />
                    ))
                  ) : (
                    sortedCampaigns.map((campaign: any, index: number) => (
                                         <TableRow
                       key={`campaign-${campaign.campaign.id}-${index}`}
                       className={index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                     >
                       <TableCell className="font-medium text-left">
                         <div className="text-sm">{campaign.campaign.name}</div>
                       </TableCell>
                       <TableCell className="text-center">
                         {formatGoogleAdsData.formatImpressions(campaign.metrics?.impressions || 0)}
                       </TableCell>
                       <TableCell className="text-center">
                         {formatGoogleAdsData.formatImpressions(campaign.metrics?.clicks || 0)}
                       </TableCell>
                       <TableCell className="text-center">
                         {formatGoogleAdsData.calculateCTR(campaign.metrics?.clicks || 0, campaign.metrics?.impressions || 0)}
                       </TableCell>
                       <TableCell className="text-center">
                         {formatGoogleAdsData.formatCost(campaign.metrics?.cost_micros || 0)}
                       </TableCell>
                       <TableCell className="text-center">
                         {formatGoogleAdsData.formatAvgCPC(campaign.metrics?.average_cpc || 0)}
                       </TableCell>
                       <TableCell className="text-center">
                         {formatGoogleAdsData.formatConversions(campaign.metrics?.conversions || 0)}
                       </TableCell>
                       <TableCell className="text-center">
                         {(() => {
                           const cost = campaign.metrics?.cost_micros || 0;
                           const conversions = campaign.metrics?.conversions || 0;
                           return conversions > 0 ? formatGoogleAdsData.formatCost(cost / conversions) : 'R$ 0,00';
                         })()}
                       </TableCell>
                       <TableCell className="text-center">
                         {formatGoogleAdsData.calculateConversionRate(campaign.metrics?.conversions || 0, campaign.metrics?.clicks || 0)}
                       </TableCell>
                       <TableCell className="text-center">
                         {formatGoogleAdsData.formatCost(campaign.campaign_budget?.amount_micros || 0)}
                                             </TableCell>
                    </TableRow>
                  ))
                  )}
                  
                  {/* Linha de Totais */}
                  {!campaignsLoading && sortedCampaigns.length > 0 && (
                    <TableRow className="bg-gray-50/80 border-t-2 border-gray-200">
                      <TableCell className="font-semibold text-left text-gray-700">
                        <div className="text-sm">TOTAIS</div>
                      </TableCell>
                      <TableCell className="text-center font-semibold text-gray-700">
                        {formatGoogleAdsData.formatImpressions(
                          sortedCampaigns.reduce((sum, campaign) => sum + (campaign.metrics?.impressions || 0), 0)
                        )}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-gray-700">
                        {formatGoogleAdsData.formatImpressions(
                          sortedCampaigns.reduce((sum, campaign) => sum + (campaign.metrics?.clicks || 0), 0)
                        )}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-gray-700">
                        {formatGoogleAdsData.calculateCTR(
                          sortedCampaigns.reduce((sum, campaign) => sum + (campaign.metrics?.clicks || 0), 0),
                          sortedCampaigns.reduce((sum, campaign) => sum + (campaign.metrics?.impressions || 0), 0)
                        )}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-gray-700">
                        {formatGoogleAdsData.formatCost(
                          sortedCampaigns.reduce((sum, campaign) => sum + (campaign.metrics?.cost_micros || 0), 0)
                        )}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-gray-700">
                        {formatGoogleAdsData.calculateAvgCPC(
                          sortedCampaigns.reduce((sum, campaign) => sum + (campaign.metrics?.cost_micros || 0), 0),
                          sortedCampaigns.reduce((sum, campaign) => sum + (campaign.metrics?.clicks || 0), 0)
                        )}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-gray-700">
                        {formatGoogleAdsData.formatConversions(
                          sortedCampaigns.reduce((sum, campaign) => sum + (campaign.metrics?.conversions || 0), 0)
                        )}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-gray-700">
                        {(() => {
                          const totalCost = sortedCampaigns.reduce((sum, campaign) => sum + (campaign.metrics?.cost_micros || 0), 0);
                          const totalConversions = sortedCampaigns.reduce((sum, campaign) => sum + (campaign.metrics?.conversions || 0), 0);
                          return totalConversions > 0 ? formatGoogleAdsData.formatCost(totalCost / totalConversions) : 'R$ 0,00';
                        })()}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-gray-700">
                        {formatGoogleAdsData.calculateConversionRate(
                          sortedCampaigns.reduce((sum, campaign) => sum + (campaign.metrics?.conversions || 0), 0),
                          sortedCampaigns.reduce((sum, campaign) => sum + (campaign.metrics?.clicks || 0), 0)
                        )}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-gray-700">
                        {formatGoogleAdsData.formatCost(
                          sortedCampaigns.reduce((sum, campaign) => sum + (campaign.campaign_budget?.amount_micros || 0), 0)
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>


        </CardContent>
      </Card>
    </div>
  );

  
}
