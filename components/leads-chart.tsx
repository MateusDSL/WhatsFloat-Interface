"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { format, eachDayOfInterval, startOfDay, endOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"

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
        leads: leadsCount,
      }
    })

    return leadsByDay
  }, [leads, dateFilter])

  const totalLeads = chartData.reduce((sum, day) => sum + day.leads, 0)
  const averageLeads = totalLeads > 0 ? (totalLeads / chartData.length).toFixed(1) : "0"

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.fullDate}</p>
          <p className="text-blue-600">
            <span className="font-medium">{payload[0].value}</span> leads
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leads por Dia</CardTitle>
        <CardDescription>
          Distribuição diária de leads no período selecionado • Média: {averageLeads} leads/dia
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[430px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: "#e5e7eb" }}
                axisLine={{ stroke: "#e5e7eb" }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: "#e5e7eb" }}
                axisLine={{ stroke: "#e5e7eb" }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="leads"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>



        {chartData.length === 0 && (
          <div className="flex items-center justify-center h-[430px] text-muted-foreground">
            <p>Nenhum dado disponível para o período selecionado</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
