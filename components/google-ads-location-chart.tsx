'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, MapPin, Target } from 'lucide-react';
import { useGoogleAdsLocation } from '@/hooks/useGoogleAdsLocation';

interface GoogleAdsLocationChartProps {
  customerId?: string;
  dateFilter: {
    from: Date | undefined;
    to: Date | undefined;
  };
}

// Cores para os estados focados
const STATE_COLORS = [
  '#3b82f6', // Azul - SP
  '#10b981', // Verde - RJ
  '#f59e0b', // Amarelo - MG
  '#ef4444', // Vermelho - PR
  '#8b5cf6', // Roxo - SC
  '#06b6d4', // Ciano - RS
  '#84cc16', // Verde claro - BA
  '#f97316', // Laranja - GO
  '#ec4899', // Rosa - PE
  '#6366f1', // Índigo - CE
];

// Mapeamento de regiões para estados principais
const regionToState: { [key: string]: string } = {
  'São Paulo': 'SP',
  'Rio de Janeiro': 'RJ',
  'Minas Gerais': 'MG',
  'Paraná': 'PR',
  'Santa Catarina': 'SC',
  'Rio Grande do Sul': 'RS',
  'Bahia': 'BA',
  'Goiás': 'GO',
  'Pernambuco': 'PE',
  'Ceará': 'CE',
  'Pará': 'PA',
  'Maranhão': 'MA',
  'Amazonas': 'AM',
  'Espírito Santo': 'ES',
  'Paraíba': 'PB',
  'Alagoas': 'AL',
  'Rio Grande do Norte': 'RN',
  'Piauí': 'PI',
  'Mato Grosso': 'MT',
  'Mato Grosso do Sul': 'MS',
  'Tocantins': 'TO',
  'Rondônia': 'RO',
  'Acre': 'AC',
  'Amapá': 'AP',
  'Roraima': 'RR',
  'Sergipe': 'SE',
  'Distrito Federal': 'DF',
};

export function GoogleAdsLocationChart({ customerId, dateFilter }: GoogleAdsLocationChartProps) {
  const { data, loading, error, totals, formatLocationData } = useGoogleAdsLocation(customerId, dateFilter);

  const chartData = useMemo(() => {
    if (!data.length) return [];

    // Ordenar dados por conversões e pegar top 10
    const sortedData = [...data]
      .sort((a, b) => b.conversions - a.conversions)
      .slice(0, 10);

    // Calcular total dos outros estados
    const otherStatesTotal = data
      .slice(10)
      .reduce((sum, item) => sum + item.conversions, 0);

    // Preparar dados para o gráfico
    const chartItems = sortedData.map((item, index) => ({
      name: item.state,
      value: item.conversions,
      fill: STATE_COLORS[index % STATE_COLORS.length],
      cost: item.cost_micros,
      impressions: item.impressions,
      clicks: item.clicks,
      data_points: item.data_points
    }));

    // Adicionar "Outros" se houver dados
    if (otherStatesTotal > 0) {
      chartItems.push({
        name: 'Outros',
        value: otherStatesTotal,
        fill: '#94a3b8', // Cor cinza para "Outros"
        cost: 0,
        impressions: 0,
        clicks: 0,
        data_points: 0
      });
    }

    return chartItems;
  }, [data]);

  const totalConversions = chartData.reduce((sum, item) => sum + item.value, 0);
  const topState = chartData[0];
  const topStatePercentage = topState ? ((topState.value / totalConversions) * 100).toFixed(1) : '0';

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / totalConversions) * 100).toFixed(1);
      const cost = data.payload.cost ? formatLocationData.formatCost(data.payload.cost) : 'N/A';
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{data.name}</p>
          <div className="space-y-1 text-sm">
            <p className="text-blue-600">
              <span className="font-medium">{data.value}</span> conversões ({percentage}%)
            </p>
            {data.payload.cost > 0 && (
              <p className="text-green-600">
                Investimento: <span className="font-medium">{cost}</span>
              </p>
            )}
            {data.payload.impressions > 0 && (
              <p className="text-gray-600">
                Impressões: <span className="font-medium">{formatLocationData.formatNumber(data.payload.impressions)}</span>
              </p>
            )}
            {data.payload.clicks > 0 && (
              <p className="text-gray-600">
                Cliques: <span className="font-medium">{formatLocationData.formatNumber(data.payload.clicks)}</span>
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Componente de skeleton para o gráfico
  const PieChartSkeleton = () => (
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

  if (error) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-red-600" />
            Erro no Gráfico de Localização
          </CardTitle>
          <CardDescription className="text-red-600">
            {error}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <p className="text-gray-500">Não foi possível carregar os dados de localização</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
             <CardHeader>
         <div>
           <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
             <MapPin className="w-5 h-5 text-blue-600" />
             Conversões por Estado
           </CardTitle>
           <CardDescription className="text-gray-600 mt-1">
             Estados com maior volume de conversões • Total: {formatLocationData.formatNumber(totalConversions)} conversões
           </CardDescription>
         </div>
       </CardHeader>
      <CardContent>
        {loading ? (
          <PieChartSkeleton />
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
                <div className="text-5xl font-bold text-gray-900">{formatLocationData.formatNumber(totalConversions)}</div>
                <div className="text-sm text-gray-600">Conversões</div>
              </div>
            </div>
          </div>
                 ) : (
           <div className="flex flex-col items-center justify-center h-96 text-center">
             <div className="p-4 bg-gray-100 rounded-full mb-4">
               <Target className="w-8 h-8 text-gray-400" />
             </div>
             <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum dado disponível</h3>
             <p className="text-gray-500 max-w-md">
               Não há dados de conversões por localização para o período selecionado. Configure segmentação geográfica nas suas campanhas do Google Ads para ver dados de conversões por estado.
             </p>
           </div>
         )}
        
        {/* Footer com estado líder */}
        {!loading && topState && chartData.length > 0 && (
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
