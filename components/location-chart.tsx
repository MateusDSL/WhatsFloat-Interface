'use client';

import { useEffect } from 'react';
import { useGoogleAdsLocation } from '../hooks/useGoogleAds';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { MapPin, TrendingUp, Users, DollarSign } from 'lucide-react';

interface LocationChartProps {
  customerId?: string;
  dateFilter?: { from: string; to: string };
}

export function LocationChart({ customerId, dateFilter }: LocationChartProps) {
  const { locationData, totals, loading, error, fetchLocationData } = useGoogleAdsLocation();

  useEffect(() => {
    if (customerId) {
      fetchLocationData(
        customerId,
        dateFilter?.from,
        dateFilter?.to
      );
    }
  }, [customerId, dateFilter, fetchLocationData]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="text-center text-red-700">
            <MapPin className="h-8 w-8 mx-auto mb-2 text-red-500" />
            <h3 className="font-semibold">Erro ao carregar dados de localização</h3>
            <p className="text-sm mt-1">{error.error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo por Estado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Performance por Estado
          </CardTitle>
        </CardHeader>
        <CardContent>
          {locationData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-center">Campanhas</TableHead>
                  <TableHead className="text-center">Impressões</TableHead>
                  <TableHead className="text-center">Cliques</TableHead>
                  <TableHead className="text-center">CTR</TableHead>
                  <TableHead className="text-center">Custo</TableHead>
                  <TableHead className="text-center">Conversões</TableHead>
                  <TableHead className="text-center">Taxa Conv.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locationData.map((state: any, index: number) => (
                  <TableRow key={`state-${index}`}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>{state.state}</span>
                        <Badge variant="outline" className="text-xs">
                          {state.campaigns.length} campanhas
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{state.campaigns.length}</Badge>
                    </TableCell>
                                         <TableCell className="text-center">
                       {Number(state.totalImpressions || 0).toLocaleString()}
                     </TableCell>
                     <TableCell className="text-center">
                       {Number(state.totalClicks || 0).toLocaleString()}
                     </TableCell>
                     <TableCell className="text-center">
                       <span className="text-green-600 font-medium">
                         {((Number(state.averageCtr || 0)) * 100).toFixed(2)}%
                       </span>
                     </TableCell>
                     <TableCell className="text-center">
                       R$ {Number(state.totalCost || 0).toFixed(2)}
                     </TableCell>
                     <TableCell className="text-center">
                       {Number(state.totalConversions || 0).toFixed(2)}
                     </TableCell>
                     <TableCell className="text-center">
                       <span className="text-blue-600 font-medium">
                         {((Number(state.averageConversionRate || 0)) * 100).toFixed(2)}%
                       </span>
                     </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-gray-500 py-4">
              Nenhum dado de localização encontrado
            </p>
          )}
        </CardContent>
      </Card>

      {/* Detalhes das Campanhas por Estado */}
      {locationData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Detalhes das Campanhas por Estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {locationData.map((state: any, stateIndex: number) => (
                <div key={`state-detail-${stateIndex}`} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    {state.state}
                    <Badge variant="outline">
                      {state.campaigns.length} campanhas
                    </Badge>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {state.campaigns.map((campaign: any, campaignIndex: number) => (
                      <div key={`campaign-${stateIndex}-${campaignIndex}`} className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm truncate">{campaign.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {campaign.product}
                          </Badge>
                        </div>
                                                 <div className="space-y-1 text-xs">
                           <div className="flex justify-between">
                             <span className="text-gray-600">Impressões:</span>
                             <span className="font-medium">{Number(campaign.impressions || 0).toLocaleString()}</span>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-gray-600">CTR:</span>
                             <span className="font-medium text-green-600">{((Number(campaign.ctr || 0)) * 100).toFixed(2)}%</span>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-gray-600">Custo:</span>
                             <span className="font-medium">R$ {Number(campaign.cost || 0).toFixed(2)}</span>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-gray-600">Conversões:</span>
                             <span className="font-medium text-blue-600">{Number(campaign.conversions || 0).toFixed(2)}</span>
                           </div>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estatísticas Gerais */}
      {totals && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-yellow-600" />
              Resumo de Localização
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {totals.states || 0}
                </div>
                <div className="text-sm text-gray-600">Estados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {totals.totalImpressions?.toLocaleString() || 0}
                </div>
                <div className="text-sm text-gray-600">Impressões</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {totals.totalClicks?.toLocaleString() || 0}
                </div>
                <div className="text-sm text-gray-600">Cliques</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  R$ {totals.totalCost?.toFixed(2) || 0}
                </div>
                <div className="text-sm text-gray-600">Custo Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
