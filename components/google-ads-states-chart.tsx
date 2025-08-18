'use client';

import { useEffect, useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { TrendingUp, MapPin } from 'lucide-react';

interface GoogleAdsStatesChartProps {
  customerId?: string;
  dateFilter?: {
    from: Date | undefined;
    to: Date | undefined;
  };
}

// Cores para os estados
const STATE_COLORS = [
  '#3b82f6', // Azul - SC
  '#10b981', // Verde - PR
  '#f59e0b', // Amarelo - RS
  '#ef4444', // Vermelho - SP
  '#8b5cf6', // Roxo - MG
  '#06b6d4', // Ciano - RJ
  '#84cc16', // Verde claro - GO
  '#f97316', // Laranja - BA
  '#ec4899', // Rosa - PE
  '#6366f1', // Índigo - CE
  '#94a3b8', // Cinza - Outros
];

export function GoogleAdsStatesChart({ customerId, dateFilter }: GoogleAdsStatesChartProps) {
  const [locationData, setLocationData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar dados de localização
  const fetchLocationData = async () => {
    if (!customerId) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('customerId', customerId);
      
      if (dateFilter?.from) {
        params.append('dateFrom', dateFilter.from.toISOString().split('T')[0]);
      }
      if (dateFilter?.to) {
        params.append('dateTo', dateFilter.to.toISOString().split('T')[0]);
      }

      const response = await fetch(`/api/google-ads/location?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro na requisição');
      }

      setLocationData(result.data || []);
    } catch (err) {
      console.error('❌ Erro ao buscar dados de localização:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocationData();
  }, [customerId, dateFilter]);

  // Processar dados para o gráfico de donut
  const chartData = useMemo(() => {
    if (!locationData.length) return [];

    // Estados focados (mais importantes)
    const focusedStates = ['SC', 'PR', 'RS', 'SP', 'MG', 'RJ', 'GO', 'BA', 'PE', 'CE'];
    
    // Separar estados focados dos outros
    const focusedData = focusedStates.map((state, index) => {
      const stateData = locationData.find(item => item.state === state);
      return {
        name: state,
        value: stateData?.totalConversions || 0,
        fill: STATE_COLORS[index],
        totalCost: stateData?.totalCost || 0,
        totalImpressions: stateData?.totalImpressions || 0,
        totalClicks: stateData?.totalClicks || 0
      };
    }).filter(item => item.value > 0);

    // Calcular total dos outros estados
    const otherStatesTotal = locationData
      .filter(item => !focusedStates.includes(item.state))
      .reduce((sum, item) => sum + (item.totalConversions || 0), 0);

    // Adicionar "Outros" se houver dados
    if (otherStatesTotal > 0) {
      focusedData.push({
        name: 'Outros',
        value: otherStatesTotal,
        fill: STATE_COLORS[10], // Cinza para "Outros"
        totalCost: 0,
        totalImpressions: 0,
        totalClicks: 0
      });
    }

    // Ordenar por conversões decrescente
    return focusedData.sort((a, b) => b.value - a.value);
  }, [locationData]);

  const totalConversions = chartData.reduce((sum, item) => sum + item.value, 0);
  const topState = chartData[0];
  const topStatePercentage = topState ? ((topState.value / totalConversions) * 100).toFixed(1) : '0';

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / totalConversions) * 100).toFixed(1);
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-blue-600">
            <span className="font-medium">{data.value.toFixed(2)}</span> conversões ({percentage}%)
          </p>
          {data.totalCost > 0 && (
            <p className="text-green-600 text-sm">
              Custo: R$ {data.totalCost.toFixed(2)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Componente de skeleton para o gráfico de donut
  const DonutChartSkeleton = () => (
    <div className="h-[360px] w-full relative">
      <div className="absolute inset-0 flex items-center justify-center">
        <Skeleton className="w-48 h-48 rounded-full" />
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <Skeleton className="w-16 h-8 mb-2" />
        <Skeleton className="w-24 h-4" />
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          Conversões por Estado
        </CardTitle>
        <CardDescription>
          Estados com mais conversões • Total: {totalConversions.toFixed(2)} conversões
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <DonutChartSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-[360px] text-center">
            <div className="p-4 bg-red-100 rounded-full mb-4">
              <MapPin className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-red-700 mb-2">Erro ao carregar dados</h3>
            <p className="text-red-500 max-w-md">{error}</p>
          </div>
        ) : chartData.length > 0 ? (
          <div className="h-[360px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Centro do gráfico */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-5xl font-bold text-gray-900">{totalConversions.toFixed(0)}</div>
                <div className="text-sm text-gray-600">Conversões</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[360px] text-center">
            <div className="p-4 bg-gray-100 rounded-full mb-4">
              <MapPin className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum dado disponível</h3>
            <p className="text-gray-500 max-w-md">
              Não há dados de conversões por estado para o período selecionado.
            </p>
          </div>
        )}
        
        {/* Footer com estado líder */}
        {!loading && !error && topState && chartData.length > 0 && (
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center justify-center gap-2 text-sm bg-blue-50 px-4 py-2 rounded-lg">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">
                {topState.name} lidera com {topStatePercentage}% das conversões
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
