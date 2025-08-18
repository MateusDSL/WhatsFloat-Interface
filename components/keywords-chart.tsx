'use client';

import { useEffect } from 'react';
import { useGoogleAdsKeywords } from '../hooks/useGoogleAds';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Search, TrendingUp, Target, Star, BarChart3 } from 'lucide-react';

interface KeywordsChartProps {
  customerId?: string;
  dateFilter?: { from: string; to: string };
}

export function KeywordsChart({ customerId, dateFilter }: KeywordsChartProps) {
  const { keywordsData, campaignsData, topKeywords, totals, loading, error, fetchKeywordsData } = useGoogleAdsKeywords();

  useEffect(() => {
    if (customerId) {
      fetchKeywordsData(
        customerId,
        dateFilter?.from,
        dateFilter?.to
      );
    }
  }, [customerId, dateFilter, fetchKeywordsData]);

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
            <Search className="h-8 w-8 mx-auto mb-2 text-red-500" />
            <h3 className="font-semibold">Erro ao carregar dados de palavras-chave</h3>
            <p className="text-sm mt-1">{error.error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Palavras-chave por Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-600" />
            Top Palavras-chave por Custo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topKeywords.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Palavra-chave</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Campanha</TableHead>
                  <TableHead className="text-center">Impressões</TableHead>
                  <TableHead className="text-center">Cliques</TableHead>
                  <TableHead className="text-center">CTR</TableHead>
                  <TableHead className="text-center">Custo</TableHead>
                  <TableHead className="text-center">Conversões</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topKeywords.map((keyword: any, index: number) => (
                  <TableRow key={`keyword-${index}`}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>{keyword.keyword}</span>
                        <Badge variant="outline" className="text-xs">
                          {keyword.matchType}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={keyword.matchType === 'EXACT' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {keyword.matchType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {keyword.campaignName}
                    </TableCell>
                    <TableCell className="text-center">
                      {keyword.impressions.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      {keyword.clicks.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-green-600 font-medium">
                        {(keyword.ctr * 100).toFixed(2)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      R$ {keyword.cost.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-blue-600 font-medium">
                        {keyword.conversions.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={keyword.status === 'ENABLED' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {keyword.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-gray-500 py-4">
              Nenhum dado de palavra-chave encontrado
            </p>
          )}
        </CardContent>
      </Card>

      {/* Performance por Campanha */}
      {campaignsData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Performance por Campanha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaignsData.map((campaign: any, index: number) => (
                <div key={`campaign-${index}`} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm truncate">{campaign.campaignName}</h4>
                    <Badge variant="outline" className="text-xs">
                      {campaign.keywords.length} keywords
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Impressões:</span>
                      <span className="font-medium">{campaign.totalImpressions.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cliques:</span>
                      <span className="font-medium">{campaign.totalClicks.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Custo:</span>
                      <span className="font-medium">R$ {campaign.totalCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Conversões:</span>
                      <span className="font-medium text-blue-600">{campaign.totalConversions.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Todas as Palavras-chave */}
      {keywordsData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Todas as Palavras-chave
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Palavra-chave</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Campanha</TableHead>
                  <TableHead>Grupo de Anúncios</TableHead>
                  <TableHead className="text-center">Impressões</TableHead>
                  <TableHead className="text-center">Cliques</TableHead>
                  <TableHead className="text-center">CTR</TableHead>
                  <TableHead className="text-center">Custo</TableHead>
                  <TableHead className="text-center">Conversões</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keywordsData.slice(0, 20).map((keyword: any, index: number) => (
                  <TableRow key={`all-keyword-${index}`}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>{keyword.keyword}</span>
                        <Badge variant="outline" className="text-xs">
                          {keyword.matchType}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={keyword.matchType === 'EXACT' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {keyword.matchType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {keyword.campaignName}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {keyword.adGroupName}
                    </TableCell>
                    <TableCell className="text-center">
                      {keyword.impressions.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      {keyword.clicks.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-green-600 font-medium">
                        {(keyword.ctr * 100).toFixed(2)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      R$ {keyword.cost.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-blue-600 font-medium">
                        {keyword.conversions.toFixed(2)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Estatísticas Gerais */}
      {totals && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-yellow-600" />
              Resumo de Palavras-chave
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {totals.keywords || 0}
                </div>
                <div className="text-sm text-gray-600">Palavras-chave</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {totals.campaigns || 0}
                </div>
                <div className="text-sm text-gray-600">Campanhas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {totals.totalImpressions?.toLocaleString() || 0}
                </div>
                <div className="text-sm text-gray-600">Impressões</div>
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
