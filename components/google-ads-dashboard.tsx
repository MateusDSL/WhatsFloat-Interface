'use client';

import { useState } from 'react';
import { useGoogleAdsDashboard } from '../hooks/useGoogleAdsDashboard';
import { GoogleAdsFormatters } from '@/lib/google-ads-formatters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { TrendingUp, Eye, MousePointer, DollarSign, Search, ChevronUp, ChevronDown, MapPin, Target } from 'lucide-react';
import { GoogleAdsDateFilter } from './google-ads-date-filter';
import { GoogleAdsChart } from './google-ads-chart';
import { KeywordsChartFixed } from './keywords-chart-fixed';


interface GoogleAdsDashboardProps {
  customerId?: string;
}

export function GoogleAdsDashboard({ customerId: propCustomerId }: GoogleAdsDashboardProps) {
  const [activeTab, setActiveTab] = useState('campaigns');

  // Get customerId from prop or environment variable
  const customerId = propCustomerId || process.env.NEXT_PUBLIC_GOOGLE_CUSTOMER_ID;

  // Usar o hook otimizado
  const {
    searchTerm,
    setSearchTerm,
    dateFilter,
    setDateFilter,
    sortConfig,
    loading: campaignsLoading,
    error: campaignsError,
    clearError: clearCampaignsError,
    sortedCampaigns,
    aggregatedMetrics,
    handleSort,
    clearSort,
    getSortIcon
  } = useGoogleAdsDashboard(customerId);



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
                  {GoogleAdsFormatters.formatCost(aggregatedMetrics.totalCost)}
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
                  {aggregatedMetrics.totalConversions.toFixed(2)}
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
                  {GoogleAdsFormatters.formatImpressions(aggregatedMetrics.totalClicks)}
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
                  {aggregatedMetrics.averageCTR}
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
                  {aggregatedMetrics.averageCPC}
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
                  {aggregatedMetrics.averageCostPerConversion}
                </div>
                <p className="text-xs text-gray-600 font-medium">Custo por conversão</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 gap-6">
        <GoogleAdsChart customerId={customerId} dateFilter={dateFilter} />
      </div>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Campanhas
          </TabsTrigger>
          <TabsTrigger value="keywords" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Palavras-chave
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="mt-6">
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
                         <span className={getSortIcon('name').className}>{getSortIcon('name').icon}</span>
                       </div>
                     </TableHead>
                     <TableHead 
                       className="w-32 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                       onClick={() => handleSort('impressions')}
                     >
                       <div className="flex items-center justify-center gap-1">
                         Impressões
                         <span className={getSortIcon('impressions').className}>{getSortIcon('impressions').icon}</span>
                       </div>
                     </TableHead>
                     <TableHead 
                       className="w-24 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                       onClick={() => handleSort('clicks')}
                     >
                       <div className="flex items-center justify-center gap-1">
                         Cliques
                         <span className={getSortIcon('clicks').className}>{getSortIcon('clicks').icon}</span>
                       </div>
                     </TableHead>
                     <TableHead 
                       className="w-24 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                       onClick={() => handleSort('ctr')}
                     >
                       <div className="flex items-center justify-center gap-1">
                         CTR
                         <span className={getSortIcon('ctr').className}>{getSortIcon('ctr').icon}</span>
                       </div>
                     </TableHead>
                     <TableHead 
                       className="w-32 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                       onClick={() => handleSort('cost')}
                     >
                       <div className="flex items-center justify-center gap-1">
                         Custo
                         <span className={getSortIcon('cost').className}>{getSortIcon('cost').icon}</span>
                       </div>
                     </TableHead>
                     <TableHead 
                       className="w-32 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                       onClick={() => handleSort('cpc')}
                     >
                       <div className="flex items-center justify-center gap-1">
                         CPC Médio
                         <span className={getSortIcon('cpc').className}>{getSortIcon('cpc').icon}</span>
                       </div>
                     </TableHead>
                     <TableHead 
                       className="w-32 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                       onClick={() => handleSort('conversions')}
                     >
                       <div className="flex items-center justify-center gap-1">
                         Conversões
                         <span className={getSortIcon('conversions').className}>{getSortIcon('conversions').icon}</span>
                       </div>
                     </TableHead>
                     <TableHead 
                       className="w-32 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                       onClick={() => handleSort('costPerConversion')}
                     >
                       <div className="flex items-center justify-center gap-1">
                         Custo/Conv.
                         <span className={getSortIcon('costPerConversion').className}>{getSortIcon('costPerConversion').icon}</span>
                       </div>
                     </TableHead>
                     <TableHead 
                       className="w-32 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                       onClick={() => handleSort('conversionRate')}
                     >
                       <div className="flex items-center justify-center gap-1">
                         Taxa Conv.
                         <span className={getSortIcon('conversionRate').className}>{getSortIcon('conversionRate').icon}</span>
                       </div>
                     </TableHead>
                     <TableHead 
                       className="w-32 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                       onClick={() => handleSort('budget')}
                     >
                       <div className="flex items-center justify-center gap-1">
                         Orçamento
                         <span className={getSortIcon('budget').className}>{getSortIcon('budget').icon}</span>
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
                         {GoogleAdsFormatters.formatImpressions(campaign.metrics?.impressions || 0)}
                       </TableCell>
                       <TableCell className="text-center">
                         {GoogleAdsFormatters.formatImpressions(campaign.metrics?.clicks || 0)}
                       </TableCell>
                       <TableCell className="text-center">
                         {GoogleAdsFormatters.calculateCTR(campaign.metrics?.clicks || 0, campaign.metrics?.impressions || 0)}
                       </TableCell>
                       <TableCell className="text-center">
                         {GoogleAdsFormatters.formatCost(campaign.metrics?.cost_micros || 0)}
                       </TableCell>
                       <TableCell className="text-center">
                         {GoogleAdsFormatters.formatAvgCPC(campaign.metrics?.average_cpc || 0)}
                       </TableCell>
                       <TableCell className="text-center">
                         {GoogleAdsFormatters.formatConversions(campaign.metrics?.conversions || 0)}
                       </TableCell>
                                                <TableCell className="text-center">
                           {GoogleAdsFormatters.calculateCostPerConversion(campaign.metrics?.cost_micros || 0, campaign.metrics?.conversions || 0)}
                         </TableCell>
                         <TableCell className="text-center">
                           {GoogleAdsFormatters.calculateConversionRate(campaign.metrics?.conversions || 0, campaign.metrics?.clicks || 0)}
                         </TableCell>
                         <TableCell className="text-center">
                           {GoogleAdsFormatters.formatCost(campaign.campaign_budget?.amount_micros || 0)}
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
                        {GoogleAdsFormatters.formatImpressions(aggregatedMetrics.totalImpressions)}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-gray-700">
                        {GoogleAdsFormatters.formatImpressions(aggregatedMetrics.totalClicks)}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-gray-700">
                        {aggregatedMetrics.averageCTR}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-gray-700">
                        {GoogleAdsFormatters.formatCost(aggregatedMetrics.totalCost)}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-gray-700">
                        {aggregatedMetrics.averageCPC}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-gray-700">
                        {GoogleAdsFormatters.formatConversions(aggregatedMetrics.totalConversions)}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-gray-700">
                        {aggregatedMetrics.averageCostPerConversion}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-gray-700">
                        {aggregatedMetrics.averageConversionRate}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-gray-700">
                        {GoogleAdsFormatters.formatCost(
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
        </TabsContent>



                 <TabsContent value="keywords" className="mt-6">
           <KeywordsChartFixed
             customerId={customerId}
           />
         </TabsContent>

         


      </Tabs>
    </div>
  );
}
