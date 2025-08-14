"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { format, eachDayOfInterval, startOfDay, endOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { TrendingUp, Users, Calendar } from "lucide-react"

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

interface LeadsChartProps {
  leads: Lead[]
  dateFilter: {
    from: Date | undefined
    to: Date | undefined
  }
}

export function LeadsChart({ leads, dateFilter }: LeadsChartProps) {
  const chartData = useMemo(() => {
    // Define date range - default to last 30 days if no filter
    const endDate = dateFilter.to || new Date()
    const startDate = dateFilter.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    // Get all days in the range
    const days = eachDayOfInterval({ start: startDate, end: endDate })

    // Count leads per day
    const leadsByDay = days.map((day) => {
      const dayStart = startOfDay(day)
      const dayEnd = endOfDay(day)

      const leadsCount = leads.filter((lead) => {
        const leadDate = new Date(lead.createdAt)
        return leadDate >= dayStart && leadDate <= dayEnd
      }).length

      return {
        date: format(day, "dd/MM", { locale: ptBR }),
        fullDate: format(day, "dd/MM/yyyy", { locale: ptBR }),
        dayName: format(day, "EEE", { locale: ptBR }),
        leads: leadsCount,
        originalDate: day,
      }
    })

    return leadsByDay
  }, [leads, dateFilter])

  const totalLeads = chartData.reduce((sum, day) => sum + day.leads, 0)
  const averageLeads = totalLeads > 0 ? (totalLeads / chartData.length).toFixed(1) : "0"
  const maxLeads = Math.max(...chartData.map(day => day.leads))
  const today = new Date()
  const isToday = (date: Date) => format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')

  // Função para gerar cores baseadas no valor
  const getBarColor = (value: number, index: number) => {
    if (value === 0) return "#f3f4f6"
    
    const intensity = value / maxLeads
    const baseColor = "#10b981"
    
    if (intensity > 0.8) return "#047857" // Verde escuro para valores altos
    if (intensity > 0.5) return "#059669" // Verde médio
    if (intensity > 0.2) return "#10b981" // Verde base
    return "#34d399" // Verde claro para valores baixos
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const isTodayData = isToday(data.originalDate)
      
      return (
        <div className="bg-white/95 backdrop-blur-sm p-4 border border-gray-200 rounded-xl shadow-2xl">
          <div className="flex items-center gap-2 mb-2">
                         <Calendar className="w-4 h-4 text-green-600" />
            <p className="font-semibold text-gray-900">{data.fullDate}</p>
            {isTodayData && (
                           <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full font-medium">
               Hoje
             </span>
            )}
          </div>
                     <div className="flex items-center gap-2">
             <Users className="w-4 h-4 text-green-600" />
             <p className="text-lg font-bold text-green-600">
               {payload[0].value} {payload[0].value === 1 ? 'lead' : 'leads'}
             </p>
           </div>
          {data.dayName && (
            <p className="text-sm text-gray-500 mt-1 capitalize">{data.dayName}</p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
                         <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
               <TrendingUp className="w-5 h-5 text-green-600" />
               Leads por Dia
             </CardTitle>
            <CardDescription className="text-gray-600 mt-1">
              Distribuição diária de leads no período selecionado
            </CardDescription>
          </div>
                     <div className="text-right">
             <div className="text-2xl font-bold text-green-600">{totalLeads}</div>
             <div className="text-sm text-gray-500">Total de leads</div>
           </div>
        </div>
                 <div className="flex items-center gap-4 mt-4 p-3 bg-green-50/50 rounded-lg border border-green-100">
           <div className="flex items-center gap-2">
             <div className="w-3 h-3 bg-green-600 rounded-full"></div>
             <span className="text-sm font-medium text-gray-700">Média diária:</span>
             <span className="text-sm font-bold text-green-600">{averageLeads} leads</span>
           </div>
           <div className="flex items-center gap-2">
             <div className="w-3 h-3 bg-green-400 rounded-full"></div>
             <span className="text-sm font-medium text-gray-700">Pico:</span>
             <span className="text-sm font-bold text-green-600">{maxLeads} leads</span>
           </div>
         </div>
      </CardHeader>
      <CardContent className="pt-0 flex-1">
        <div className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
                             <defs>
                 <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="0%" stopColor="#10b981" stopOpacity={0.8}/>
                   <stop offset="100%" stopColor="#047857" stopOpacity={0.6}/>
                 </linearGradient>
               </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                className="opacity-20" 
                stroke="#e5e7eb"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                tickLine={{ stroke: "#e5e7eb" }}
                axisLine={{ stroke: "#e5e7eb" }}
                tickMargin={8}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6b7280' }}
                tickLine={{ stroke: "#e5e7eb" }}
                axisLine={{ stroke: "#e5e7eb" }}
                allowDecimals={false}
                tickMargin={8}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="leads"
                radius={[6, 6, 0, 0]}
                animationDuration={1500}
                animationBegin={0}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={getBarColor(entry.leads, index)}
                    className="hover:opacity-80 transition-opacity duration-200"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {chartData.length === 0 && (
          <div className="flex flex-col items-center justify-center h-[360px] text-muted-foreground">
            <TrendingUp className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-lg font-medium">Nenhum dado disponível</p>
            <p className="text-sm">Selecione um período diferente para visualizar os dados</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
