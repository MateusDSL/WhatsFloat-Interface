'use client';

import { useEffect, useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { TrendingUp, DollarSign, Target } from 'lucide-react';
import { formatGoogleAdsData } from '@/hooks/useGoogleAds';

// Função utilitária para formatar datas no fuso horário do Brasil
const formatDateToBrazil = (dateString: string) => {
  try {
    // Se a data já está no formato YYYY-MM-DD, criar uma data no fuso horário do Brasil
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-').map(Number);
      const brazilDate = new Date(year, month - 1, day);
      return brazilDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        timeZone: 'America/Sao_Paulo'
      });
    }
    
    // Para outros formatos, tentar converter
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      timeZone: 'America/Sao_Paulo'
    });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return dateString;
  }
};

interface GoogleAdsChartProps {
  customerId?: string;
  dateFilter: {
    from: Date | undefined;
    to: Date | undefined;
  };
}

interface ChartDataPoint {
  date: string;
  investment: number;
  conversions: number;
  formattedDate: string;
}

export function GoogleAdsChart({ customerId, dateFilter }: GoogleAdsChartProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar dados do gráfico
  const fetchChartData = async () => {
    if (!dateFilter.from || !dateFilter.to) return;

    setLoading(true);
    setError(null);

    try {
      const dateFrom = dateFilter.from.toISOString().split('T')[0];
      const dateTo = dateFilter.to.toISOString().split('T')[0];

      const params = new URLSearchParams();
      if (customerId) params.append('customerId', customerId);
      params.append('dateFrom', dateFrom);
      params.append('dateTo', dateTo);

      const response = await fetch(`/api/google-ads/chart-data?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro na requisição');
      }

      setChartData(result.data || []);
    } catch (err) {
      console.error('❌ Erro ao buscar dados do gráfico:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // Processar dados para o gráfico
  const processedChartData = useMemo(() => {
    if (!chartData.length) return [];

    // Verificar se temos dados segmentados por dia
    const hasSegmentedData = chartData.some(item => item.segments?.date);
    
    if (hasSegmentedData) {
      // Agrupar dados por data quando temos segments.date
      const dataByDate = new Map<string, { investment: number; conversions: number }>();

      chartData.forEach((item) => {
        const date = item.segments?.date || 'sem-data';
        const current = dataByDate.get(date) || { investment: 0, conversions: 0 };

        current.investment += item.metrics?.cost_micros || 0;
        current.conversions += item.metrics?.conversions || 0;

        dataByDate.set(date, current);
      });

      // Converter para array e ordenar por data
      const sortedData = Array.from(dataByDate.entries())
        .map(([date, data]) => ({
          date,
          investment: data.investment / 1000000, // Converter micros para reais
          conversions: data.conversions,
          formattedDate: formatDateToBrazil(date)
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return sortedData;
    } else {
      // Quando não temos dados segmentados, criar um ponto único com totais
      const totalInvestment = chartData.reduce((sum, item) => sum + (item.metrics?.cost_micros || 0), 0);
      const totalConversions = chartData.reduce((sum, item) => sum + (item.metrics?.conversions || 0), 0);
      
      // Criar dados para o período selecionado
      if (dateFilter.from && dateFilter.to) {
        const days = Math.ceil((dateFilter.to.getTime() - dateFilter.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const dailyInvestment = totalInvestment / days / 1000000;
        const dailyConversions = totalConversions / days;
        
        const dataPoints = [];
        for (let i = 0; i < days; i++) {
          const date = new Date(dateFilter.from);
          date.setDate(date.getDate() + i);
          
          dataPoints.push({
            date: date.toISOString().split('T')[0],
            investment: dailyInvestment,
            conversions: dailyConversions,
            formattedDate: formatDateToBrazil(date.toISOString().split('T')[0])
          });
        }
        
        return dataPoints;
      }
      
      // Fallback: retornar um único ponto com os totais
      return [{
        date: new Date().toISOString().split('T')[0],
        investment: totalInvestment / 1000000,
        conversions: totalConversions,
        formattedDate: formatDateToBrazil(new Date().toISOString().split('T')[0])
      }];
    }
  }, [chartData, dateFilter.from, dateFilter.to]);

  // Buscar dados quando o filtro de data mudar
  useEffect(() => {
    if (dateFilter.from && dateFilter.to) {
      fetchChartData();
    }
  }, [customerId, dateFilter.from, dateFilter.to]);

  // Calcular totais
  const totals = useMemo(() => {
    return processedChartData.reduce(
      (acc, item) => ({
        investment: acc.investment + item.investment,
        conversions: acc.conversions + item.conversions
      }),
      { investment: 0, conversions: 0 }
    );
  }, [processedChartData]);

  // Customizar tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name === 'Investimento' 
                ? formatGoogleAdsData.formatCost(entry.value * 1000000) // Converter de volta para micros
                : `${entry.value.toFixed(2)} conversões`
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Componente de loading
  if (loading) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Componente de erro
  if (error) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-red-600" />
            Erro no Gráfico
          </CardTitle>
          <CardDescription className="text-red-600">
            {error}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <p className="text-gray-500">Não foi possível carregar os dados do gráfico</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Investimento vs Conversões
            </CardTitle>
            <CardDescription className="text-gray-600 mt-1">
              Evolução diária do investimento e conversões
              {!chartData.some(item => item.segments?.date) && (
                <span className="ml-2 text-orange-600 text-xs">
                  (Dados distribuídos uniformemente)
                </span>
              )}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {formatGoogleAdsData.formatCost(totals.investment * 1000000)}
                </div>
                <div className="text-xs text-gray-500">Total Investido</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {totals.conversions.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">Total Conversões</div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {processedChartData.length > 0 ? (
          <div className="h-96">
                         <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={processedChartData}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                 <XAxis 
                   dataKey="formattedDate" 
                   stroke="#6b7280"
                   fontSize={14}
                   tickLine={false}
                   axisLine={false}
                   padding={{ left: 20, right: 20 }}
                 />
                 <YAxis 
                   yAxisId="left"
                   stroke="#6b7280"
                   fontSize={14}
                   tickLine={false}
                   axisLine={false}
                   tickFormatter={(value) => `R$ ${value.toFixed(0)}`}
                   padding={{ top: 20, bottom: 20 }}
                 />
                 <YAxis 
                   yAxisId="right"
                   orientation="right"
                   stroke="#6b7280"
                   fontSize={14}
                   tickLine={false}
                   axisLine={false}
                   tickFormatter={(value) => value.toFixed(1)}
                   padding={{ top: 20, bottom: 20 }}
                 />
                 <Tooltip content={<CustomTooltip />} />
                 <Legend 
                   verticalAlign="top" 
                   height={48}
                   iconType="line"
                   wrapperStyle={{ paddingBottom: '15px' }}
                   iconSize={16}
                 />
                 <Area
                   yAxisId="left"
                   type="monotone"
                   dataKey="investment"
                   name="Investimento"
                   stroke="#10b981"
                   strokeWidth={4}
                   fill="#10b981"
                   fillOpacity={0.3}
                   dot={{ fill: '#10b981', strokeWidth: 3, r: 6 }}
                   activeDot={{ r: 8, stroke: '#10b981', strokeWidth: 3 }}
                 />
                 <Area
                   yAxisId="right"
                   type="monotone"
                   dataKey="conversions"
                   name="Conversões"
                   stroke="#3b82f6"
                   strokeWidth={4}
                   fill="#3b82f6"
                   fillOpacity={0.3}
                   dot={{ fill: '#3b82f6', strokeWidth: 3, r: 6 }}
                   activeDot={{ r: 8, stroke: '#3b82f6', strokeWidth: 3 }}
                 />
               </AreaChart>
             </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <div className="p-4 bg-gray-100 rounded-full mb-4">
              <TrendingUp className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum dado disponível</h3>
            <p className="text-gray-500 max-w-md">
              Não há dados de investimento e conversões para o período selecionado.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
