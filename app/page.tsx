"use client"

import { useEffect, useMemo } from "react"
import { SidebarWrapper } from "@/components/sidebar-wrapper"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, Target, BarChart3, FileText, ArrowRight, Database, TrendingUp, Calendar, Tag, MapPin } from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard"
import { useLeads } from "@/hooks/useLeads"
import { getStateFromPhone, detectGender, CHART_COLORS } from "@/lib/lead-utils"
import { differenceInDays, subDays, startOfDay, endOfDay } from "date-fns"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts"
import { LeadsChartTooltip, DemographicsTooltip } from "@/components/ui/enhanced-tooltip"

// Skeleton components
const StatsCardSkeleton = () => (
  <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-4" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-3 w-32" />
    </CardContent>
  </Card>
)

const ChartSkeleton = () => (
  <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
    <CardHeader>
      <Skeleton className="h-6 w-32 mb-2" />
      <Skeleton className="h-4 w-48" />
    </CardHeader>
    <CardContent>
      <div className="h-[300px] w-full flex flex-col">
        <div className="flex-1 flex items-end justify-between gap-2 px-4 pb-8">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <Skeleton className="w-full rounded-t-sm" style={{ 
                height: `${Math.random() * 60 + 20}%`,
                minHeight: '20px'
              }} />
              <Skeleton className="w-8 h-3" />
            </div>
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
)

const PieChartSkeleton = () => (
  <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
    <CardHeader>
      <Skeleton className="h-6 w-32 mb-2" />
      <Skeleton className="h-4 w-48" />
    </CardHeader>
    <CardContent>
      <div className="h-[300px] w-full relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <Skeleton className="w-40 h-40 rounded-full" />
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
      </div>
    </CardContent>
  </Card>
)

export default function DashboardPage() {
  const { leads, loading, error } = useLeads()

  // Calcular estatísticas gerais
  const stats = useMemo(() => {
    if (!leads.length) return {
      totalLeads: 0,
      beaconLeads: 0,
      trackedLeads: 0,
      untrackedLeads: 0,
      recentLeads: 0,
      topStates: [],
      genderDistribution: [],
      leadsByDay: []
    }

    const now = new Date()
    const last30Days = subDays(now, 30)
    const last7Days = subDays(now, 7)

    // Leads dos últimos 30 dias
    const recentLeads = leads.filter(lead => {
      const leadDate = new Date(lead.created_at)
      return leadDate >= last30Days
    }).length

    // Leads dos últimos 7 dias
    const last7DaysLeads = leads.filter(lead => {
      const leadDate = new Date(lead.created_at)
      return leadDate >= last7Days
    }).length

    // Estatísticas de beacon
    const beaconLeads = leads.filter(lead => Boolean(lead.is_becon)).length

    // Leads rastreados vs não rastreados
    const trackedLeads = leads.filter(lead => 
      lead.origem && lead.origem !== 'nao-identificado'
    ).length
    const untrackedLeads = leads.length - trackedLeads

    // Distribuição por estado
    const stateCounts: { [key: string]: number } = {}
    leads.forEach(lead => {
      const state = getStateFromPhone(lead.phone)
      stateCounts[state] = (stateCounts[state] || 0) + 1
    })

    const topStates = Object.entries(stateCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([state, count]) => ({
        name: state,
        value: count,
        fill: CHART_COLORS.STATE_COLORS[Math.floor(Math.random() * CHART_COLORS.STATE_COLORS.length)]
      }))

    // Distribuição por gênero
    const genderCounts: { [key: string]: number } = {}
    leads.forEach(lead => {
      const gender = detectGender(lead.name)
      genderCounts[gender] = (genderCounts[gender] || 0) + 1
    })

    const genderDistribution = [
      { name: 'Feminino', value: genderCounts['Feminino'] || 0, fill: CHART_COLORS.GENDER_COLORS[0] },
      { name: 'Masculino', value: genderCounts['Masculino'] || 0, fill: CHART_COLORS.GENDER_COLORS[1] },
      { name: 'Não Identificado', value: genderCounts['Não Identificado'] || 0, fill: CHART_COLORS.GENDER_COLORS[2] }
    ].filter(item => item.value > 0)

    // Leads por dia (últimos 7 dias)
    const leadsByDay = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(now, 6 - i)
      const dayStart = startOfDay(date)
      const dayEnd = endOfDay(date)
      
      const dayLeads = leads.filter(lead => {
        const leadDate = new Date(lead.created_at)
        return leadDate >= dayStart && leadDate <= dayEnd
      }).length

      return {
        date: date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' }),
        leads: dayLeads,
        fullDate: date.toLocaleDateString('pt-BR')
      }
    })

    return {
      totalLeads: leads.length,
      beaconLeads,
      trackedLeads,
      untrackedLeads,
      recentLeads,
      last7DaysLeads,
      topStates,
      genderDistribution,
      leadsByDay
    }
  }, [leads])

  // Calcular variações percentuais
  const variations = useMemo(() => {
    if (!leads.length) return {
      totalVariation: 0,
      beaconVariation: 0,
      trackedVariation: 0
    }

    const now = new Date()
    const last30Days = subDays(now, 30)
    const previous30Days = subDays(last30Days, 30)

    // Período atual (últimos 30 dias)
    const currentPeriodLeads = leads.filter(lead => {
      const leadDate = new Date(lead.created_at)
      return leadDate >= last30Days
    })

    // Período anterior (30 dias antes)
    const previousPeriodLeads = leads.filter(lead => {
      const leadDate = new Date(lead.created_at)
      return leadDate >= previous30Days && leadDate < last30Days
    })

    const calculateVariation = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return ((current - previous) / previous) * 100
    }

    return {
      totalVariation: calculateVariation(currentPeriodLeads.length, previousPeriodLeads.length),
      beaconVariation: calculateVariation(
        currentPeriodLeads.filter(lead => Boolean(lead.is_becon)).length,
        previousPeriodLeads.filter(lead => Boolean(lead.is_becon)).length
      ),
      trackedVariation: calculateVariation(
        currentPeriodLeads.filter(lead => lead.origem && lead.origem !== 'nao-identificado').length,
        previousPeriodLeads.filter(lead => lead.origem && lead.origem !== 'nao-identificado').length
      )
    }
  }, [leads])

  const formatVariation = (variation: number) => {
    if (variation > 0) return `+${variation.toFixed(1)}%`
    if (variation < 0) return `${variation.toFixed(1)}%`
    return '0%'
  }

  const getVariationColor = (variation: number) => {
    if (variation > 0) return 'text-green-600'
    if (variation < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    return <LeadsChartTooltip active={active} payload={payload} label={label} />
  }

  const PieTooltip = ({ active, payload }: any) => {
    return <DemographicsTooltip active={active} payload={payload} total={stats.totalLeads} />
  }

  return (
    <AuthGuard>
      <div className="flex h-screen bg-gray-50/50 overflow-hidden">
        <SidebarWrapper />
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
              <p className="text-gray-600">Visão geral do desempenho dos seus leads e campanhas</p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {loading ? (
                <>
                  <StatsCardSkeleton />
                  <StatsCardSkeleton />
                  <StatsCardSkeleton />
                  <StatsCardSkeleton />
                </>
              ) : (
                <>
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 hover:shadow-xl transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardTitle className="text-sm font-semibold text-gray-900">Total de Leads</CardTitle>
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900 mb-2">{stats.totalLeads}</div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${getVariationColor(variations.totalVariation)}`}>
                          {formatVariation(variations.totalVariation)}
                        </span>
                        <span className="text-xs text-gray-500">vs mês anterior</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 hover:shadow-xl transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardTitle className="text-sm font-semibold text-gray-900">Becon Ativos</CardTitle>
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Tag className="h-4 w-4 text-green-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900 mb-2">{stats.beaconLeads}</div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${getVariationColor(variations.beaconVariation)}`}>
                          {formatVariation(variations.beaconVariation)}
                        </span>
                        <span className="text-xs text-gray-500">vs mês anterior</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 hover:shadow-xl transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardTitle className="text-sm font-semibold text-gray-900">Rastreados</CardTitle>
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900 mb-2">{stats.trackedLeads}</div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${getVariationColor(variations.trackedVariation)}`}>
                          {formatVariation(variations.trackedVariation)}
                        </span>
                        <span className="text-xs text-gray-500">vs mês anterior</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 hover:shadow-xl transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardTitle className="text-sm font-semibold text-gray-900">Últimos 7 Dias</CardTitle>
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Calendar className="h-4 w-4 text-orange-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900 mb-2">{stats.last7DaysLeads}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600">
                          {stats.recentLeads} nos últimos 30 dias
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Leads por Dia */}
              {loading ? (
                <ChartSkeleton />
              ) : (
                <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-green-600" />
                      Leads por Dia (Últimos 7 Dias)
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Distribuição diária de leads capturados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.leadsByDay} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-20" stroke="#e5e7eb" vertical={false} />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                            tickLine={{ stroke: "#e5e7eb" }}
                            axisLine={{ stroke: "#e5e7eb" }}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                            tickLine={{ stroke: "#e5e7eb" }}
                            axisLine={{ stroke: "#e5e7eb" }}
                            allowDecimals={false}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="leads" radius={[6, 6, 0, 0]} fill="#10b981">
                            {stats.leadsByDay.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`}
                                fill={entry.leads > 0 ? "#10b981" : "#f3f4f6"}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Distribuição por Estado */}
              {loading ? (
                <PieChartSkeleton />
              ) : (
                <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      Top Estados
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Distribuição de leads por estado brasileiro
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.topStates}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {stats.topStates.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip content={<PieTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      
                      {/* Centro do gráfico */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">{stats.totalLeads}</div>
                          <div className="text-sm text-gray-600">Total</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link href="/leads">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Gerenciar Leads</CardTitle>
                    <Users className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">Ver Todos</div>
                    <p className="text-xs text-gray-600 mt-1">
                      Acesse sua tabela completa de leads
                    </p>
                    <div className="flex items-center mt-2">
                      <ArrowRight className="h-3 w-3 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/google-ads">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Google Ads</CardTitle>
                    <Target className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">Configurar</div>
                    <p className="text-xs text-gray-600 mt-1">
                      Gerencie suas campanhas do Google Ads
                    </p>
                    <div className="flex items-center mt-2">
                      <ArrowRight className="h-3 w-3 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/analytics">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Analytics</CardTitle>
                    <BarChart3 className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">Visualizar</div>
                    <p className="text-xs text-gray-600 mt-1">
                      Análises e métricas detalhadas
                    </p>
                    <div className="flex items-center mt-2">
                      <ArrowRight className="h-3 w-3 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/reports">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Relatórios</CardTitle>
                    <FileText className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">Gerar</div>
                    <p className="text-xs text-gray-600 mt-1">
                      Relatórios personalizados
                    </p>
                    <div className="flex items-center mt-2">
                      <ArrowRight className="h-3 w-3 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
