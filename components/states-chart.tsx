"use client"

import React, { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { TrendingUp, Users, MapPin } from "lucide-react"
import { getStateFromPhone, detectGender, CHART_COLORS } from "@/lib/lead-utils"
import { DemographicsTooltip } from "@/components/ui/enhanced-tooltip"

interface Lead {
  id: number
  name: string
  email: string
  phone: string
  campaign: string
  beacon: boolean
  source: string
  createdAt: string
  status: string
  value: number
}

interface DemographicsChartProps {
  leads: Lead[]
  dateFilter: {
    from: Date | undefined
    to: Date | undefined
  }
  loading?: boolean
}

function DemographicsChartComponent({ leads, dateFilter, loading = false }: DemographicsChartProps) {
  const [chartType, setChartType] = useState<'estado' | 'genero'>('estado')

  const chartData = useMemo(() => {
    // Filtrar leads pelo período selecionado
    const filteredLeads = leads.filter((lead) => {
      const leadDate = new Date(lead.createdAt)
      const matchesDate =
        (!dateFilter.from || leadDate >= dateFilter.from) && 
        (!dateFilter.to || leadDate <= dateFilter.to)
      return matchesDate
    })

    if (chartType === 'estado') {
      // Contar leads por estado
      const stateCounts: { [key: string]: number } = {}
      
      filteredLeads.forEach((lead) => {
        const state = getStateFromPhone(lead.phone)
        stateCounts[state] = (stateCounts[state] || 0) + 1
      })

      // Estados focados
      const focusedStates = ['SC', 'PR', 'RS', 'SP']
      
      // Separar estados focados dos outros
      const focusedData: Array<{ name: string; value: number; fill: string }> = focusedStates.map(state => ({
        name: state,
        value: stateCounts[state] || 0,
        fill: CHART_COLORS.STATE_COLORS[focusedStates.indexOf(state)]
      })).filter(item => item.value > 0)

      // Calcular total dos outros estados
      const otherStatesTotal = Object.entries(stateCounts)
        .filter(([state]) => !focusedStates.includes(state))
        .reduce((sum, [, count]) => sum + count, 0)

      // Adicionar "Outros" se houver dados
      if (otherStatesTotal > 0) {
        focusedData.push({
          name: 'Outros',
          value: otherStatesTotal,
          fill: CHART_COLORS.OTHERS_COLOR
        })
      }

      // Ordenar por quantidade decrescente
      return focusedData.sort((a, b) => b.value - a.value)
    } else {
      // Contar leads por gênero
      const genderCounts: { [key: string]: number } = {}
      
      filteredLeads.forEach((lead) => {
        const gender = detectGender(lead.name)
        genderCounts[gender] = (genderCounts[gender] || 0) + 1
      })

      // Mapear gêneros para cores
      const genderData = [
        { name: 'Feminino', value: genderCounts['Feminino'] || 0, fill: CHART_COLORS.GENDER_COLORS[0] },
        { name: 'Masculino', value: genderCounts['Masculino'] || 0, fill: CHART_COLORS.GENDER_COLORS[1] },
        { name: 'Não Identificado', value: genderCounts['Não Identificado'] || 0, fill: CHART_COLORS.GENDER_COLORS[2] }
      ].filter(item => item.value > 0)

      // Ordenar por quantidade decrescente
      return genderData.sort((a, b) => b.value - a.value)
    }
  }, [leads, dateFilter, chartType])

  const totalLeads = chartData.reduce((sum, item) => sum + item.value, 0)
  const topItem = chartData[0]
  const topItemPercentage = topItem ? ((topItem.value / totalLeads) * 100).toFixed(1) : '0'

  const CustomTooltip = ({ active, payload }: any) => {
    return <DemographicsTooltip active={active} payload={payload} total={totalLeads} />
  }

  const getChartTitle = () => {
    return chartType === 'estado' ? 'Distribuição por Estado' : 'Distribuição por Gênero'
  }

  const getChartDescription = () => {
    const type = chartType === 'estado' ? 'estado brasileiro' : 'gênero'
    return `Leads distribuídos por ${type} • Total: ${totalLeads} leads`
  }

  const getTopItemText = () => {
    const type = chartType === 'estado' ? 'estado' : 'gênero'
    return `${topItem?.name} lidera com ${topItemPercentage}% dos leads`
  }

  // Componente de skeleton para o gráfico de pizza
  const PieChartSkeleton = () => (
    <div className="h-[360px] w-full relative">
      {/* Skeleton para o gráfico de pizza */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <Skeleton className="w-48 h-48 rounded-full" />
          {/* Skeleton para fatias do gráfico */}
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <div className="w-full h-full relative">
              <div className="absolute top-0 left-1/2 w-1/2 h-1/2 bg-gray-200 transform -translate-x-1/2 rounded-tl-full"></div>
              <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gray-300 rounded-tr-full"></div>
              <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gray-100 rounded-bl-full"></div>
              <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gray-400 rounded-br-full"></div>
            </div>
          </div>
        </div>
      </div>
      {/* Skeleton para o centro do gráfico */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <Skeleton className="w-16 h-8 mb-2" />
        <Skeleton className="w-24 h-4" />
      </div>
      {/* Skeleton para footer com item líder */}
      <div className="absolute bottom-0 left-0 right-0">
        <div className="flex items-center justify-center gap-2 p-3 bg-gray-50/50 rounded-lg border border-gray-100">
          <Skeleton className="w-4 h-4" />
          <Skeleton className="w-48 h-4" />
        </div>
      </div>
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {loading ? <Skeleton className="w-32 h-6" /> : getChartTitle()}
            </CardTitle>
            <CardDescription>
              {loading ? <Skeleton className="w-48 h-4" /> : getChartDescription()}
            </CardDescription>
          </div>
          {loading ? (
            <Skeleton className="w-[140px] h-10" />
          ) : (
            <Select value={chartType} onValueChange={(value: 'estado' | 'genero') => setChartType(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="estado">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Estado
                  </div>
                </SelectItem>
                <SelectItem value="genero">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Gênero
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <PieChartSkeleton />
        ) : (
          <div className="h-[360px] w-full relative" style={{ zIndex: 1, outline: 'none' }}>
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
                  style={{ outline: 'none' }}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.fill}
                      className="focus:outline-none"
                      style={{ 
                        outline: 'none',
                        WebkitTapHighlightColor: 'transparent'
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Centro do gráfico */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-5xl font-bold text-gray-900">{totalLeads}</div>
                <div className="text-sm text-gray-600">Leads</div>
              </div>
            </div>
          </div>
        )}

        {!loading && chartData.length === 0 && (
          <div className="flex items-center justify-center h-[360px] text-muted-foreground">
            <p>Nenhum dado disponível para o período selecionado</p>
          </div>
        )}
        
        {/* Footer com item líder */}
        {!loading && topItem && chartData.length > 0 && (
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center justify-center gap-2 text-sm bg-blue-50 px-4 py-2 rounded-lg">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">
                {getTopItemText()}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Memoização do componente para evitar renderizações desnecessárias
export const DemographicsChart = React.memo(DemographicsChartComponent, (prevProps, nextProps) => {
  // Comparação customizada para otimizar a memoização
  return (
    prevProps.loading === nextProps.loading &&
    prevProps.leads.length === nextProps.leads.length &&
    prevProps.dateFilter.from?.getTime() === nextProps.dateFilter.from?.getTime() &&
    prevProps.dateFilter.to?.getTime() === nextProps.dateFilter.to?.getTime() &&
    // Comparação superficial dos leads (só verifica se os IDs mudaram)
    JSON.stringify(prevProps.leads.map(l => l.id).sort()) === JSON.stringify(nextProps.leads.map(l => l.id).sort())
  )
})
