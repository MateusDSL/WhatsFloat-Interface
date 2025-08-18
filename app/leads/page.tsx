"use client"

import type React from "react"
import { DollarSign } from "lucide-react"

import { useState, useEffect, useMemo } from "react"
import { Search, Download, Users, TrendingUp, CalendarIcon, Trash2, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import { AdvancedDatePicker } from "@/components/advanced-date-picker"
import { SidebarWrapper } from "@/components/sidebar-wrapper"
import { LeadsChart } from "@/components/leads-chart"
import { DemographicsChart } from "@/components/demographics-chart"
import { toast } from "@/hooks/use-toast"
import { useLeads } from "@/hooks/useLeads"
import { Lead } from "@/lib/supabase"
import { differenceInDays, subDays, startOfDay, endOfDay } from "date-fns"
import { AuthGuard } from "@/components/auth-guard"

const sourceLabels = {
  google: "Google",
  meta: "Meta",
  "nao-identificado": "Não Identificado",
}

// Mapeamento de DDD para estados
const dddToState: { [key: string]: string } = {
  '11': 'SP',
  '12': 'SP',
  '13': 'SP',
  '14': 'SP',
  '15': 'SP',
  '16': 'SP',
  '17': 'SP',
  '18': 'SP',
  '19': 'SP',
  '21': 'RJ',
  '22': 'RJ',
  '24': 'RJ',
  '27': 'ES',
  '28': 'ES',
  '31': 'MG',
  '32': 'MG',
  '33': 'MG',
  '34': 'MG',
  '35': 'MG',
  '37': 'MG',
  '38': 'MG',
  '41': 'PR',
  '42': 'PR',
  '43': 'PR',
  '44': 'PR',
  '45': 'PR',
  '46': 'PR',
  '47': 'SC',
  '48': 'SC',
  '49': 'SC',
  '51': 'RS',
  '53': 'RS',
  '54': 'RS',
  '55': 'RS',
  '61': 'DF',
  '62': 'GO',
  '63': 'TO',
  '64': 'GO',
  '65': 'MT',
  '66': 'MT',
  '67': 'MS',
  '68': 'AC',
  '69': 'RO',
  '71': 'BA',
  '73': 'BA',
  '74': 'BA',
  '75': 'BA',
  '77': 'BA',
  '79': 'SE',
  '81': 'PE',
  '82': 'AL',
  '83': 'PB',
  '84': 'RN',
  '85': 'CE',
  '86': 'PI',
  '87': 'PE',
  '88': 'CE',
  '89': 'PI',
  '91': 'PA',
  '92': 'AM',
  '93': 'PA',
  '94': 'PA',
  '95': 'RR',
  '96': 'AP',
  '97': 'AM',
  '98': 'MA',
  '99': 'MA'
}

// Função para extrair DDD e retornar estado
const getStateFromPhone = (phone: string): string => {
  if (!phone) return 'Não Rastreada'
  
  // Remove caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '')
  
  // Verifica se tem pelo menos 2 dígitos para DDD
  if (cleanPhone.length < 2) return 'Não Rastreada'
  
  // Pega os primeiros 2 dígitos (DDD)
  const ddd = cleanPhone.substring(0, 2)
  
  return dddToState[ddd] || 'Não Rastreada'
}

// Skeleton components
const StatsCardSkeleton = () => (
  <Card>
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

const TableRowSkeleton = () => (
  <TableRow>
    <TableCell>
      <Skeleton className="h-4 w-4" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-16" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-32" />
    </TableCell>
    <TableCell>
      <div className="space-y-1">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-20" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-16" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-20" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-16" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-6 w-12" />
    </TableCell>
  </TableRow>
)

// Mapeamento para os campos reais do Supabase
const mapLeadToDisplay = (lead: Lead) => ({
  id: lead.id || 0,
  name: lead.name,
  email: lead.phone, // Usando phone como email temporariamente
  phone: lead.phone,
  campaign: lead.utm_campaign,
  utm_term: lead.utm_term,
  utm_medium: lead.utm_medium,
  beacon: Boolean(lead.is_becon), // Garantir que seja sempre boolean
  source: lead.origem || 'nao-identificado', // Fallback para 'nao-identificado' se origem estiver vazia
  createdAt: lead.created_at,
  status: lead.status || 'novo', // Fallback para 'novo' se status estiver vazio
  value: 0, // Valor padrão já que não temos esse campo
})

export default function LeadsPage() {
  const { leads, loading, error, updateLead, deleteLead, deleteMultipleLeads, verifyAndUpdateBecon } = useLeads()
  const [searchTerm, setSearchTerm] = useState("")
  const [sourceFilter, setSourceFilter] = useState("todos")

  const [selectedLeads, setSelectedLeads] = useState<number[]>([])
  const [dateFilter, setDateFilter] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })
  const [currentPage, setCurrentPage] = useState(1)
  const leadsPerPage = 12
  const [forceUpdate, setForceUpdate] = useState(0)

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, sourceFilter, dateFilter])

  // Mapear leads do Supabase para o formato da interface
  const mappedLeads = useMemo(() => {
    return leads.map(mapLeadToDisplay)
  }, [leads, forceUpdate])

  // Gerar opções de filtro baseadas nos dados reais
  const getSourceFilterOptions = () => {
    const uniqueOrigins = [...new Set(leads.map(lead => lead.origem).filter(Boolean))]
    const options = [
      { value: "todos", label: "Todas as Origens" },
      ...uniqueOrigins.map(origin => ({
        value: origin,
        label: sourceLabels[origin as keyof typeof sourceLabels] || origin
      }))
    ]
    
    // Adicionar "Não Rastreada" se houver leads sem origem
    const hasUntrackedLeads = leads.some(lead => !lead.origem || lead.origem === 'nao-identificado')
    if (hasUntrackedLeads) {
      options.push({ value: "nao-rastreada", label: "Não Rastreada" })
    }
    
    return options
  }

  // Filter leads based on search and filters
  const filteredLeads = mappedLeads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.campaign && lead.campaign.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.utm_term && lead.utm_term.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.utm_medium && lead.utm_medium.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.source && lead.source.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesSource = sourceFilter === "todos" || 
                         (sourceFilter === "nao-rastreada" && (!lead.source || lead.source === 'nao-identificado')) ||
                         (lead.source && lead.source === sourceFilter)

    // Date filter
    const leadDate = new Date(lead.createdAt)
    const matchesDate =
      (!dateFilter.from || leadDate >= dateFilter.from) && (!dateFilter.to || leadDate <= dateFilter.to)

    return matchesSearch && matchesSource && matchesDate
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredLeads.length / leadsPerPage)
  const startIndex = (currentPage - 1) * leadsPerPage
  const endIndex = startIndex + leadsPerPage
  const currentLeads = filteredLeads.slice(startIndex, endIndex)

  // Calculate statistics based on filtered data (including source filter)
  const filteredLeadsForStats = mappedLeads.filter((lead) => {
    const leadDate = new Date(lead.createdAt)
    const matchesDate =
      (!dateFilter.from || leadDate >= dateFilter.from) && (!dateFilter.to || leadDate <= dateFilter.to)
    
    // Apply source filter to statistics
    const matchesSource = sourceFilter === "todos" || 
                         (sourceFilter === "nao-rastreada" && (!lead.source || lead.source === 'nao-identificado')) ||
                         (lead.source && lead.source === sourceFilter)
    
    return matchesDate && matchesSource
  })

  // Calcular estatísticas do período anterior para comparação
  const previousPeriodStats = useMemo(() => {
    if (!dateFilter.from || !dateFilter.to) {
      return { 
        totalLeads: 0, 
        beaconLeads: 0,
        trackedLeads: 0,
        untrackedLeads: 0,
        hasComparison: false 
      }
    }

    // Calcular duração do período atual
    const currentPeriodDays = differenceInDays(dateFilter.to, dateFilter.from) + 1
    
    // Calcular período anterior
    const previousPeriodEnd = subDays(dateFilter.from, 1)
    const previousPeriodStart = subDays(previousPeriodEnd, currentPeriodDays - 1)
    
    // Filtrar leads do período anterior (incluindo filtro de origem)
    const previousPeriodLeads = mappedLeads.filter((lead) => {
      const leadDate = new Date(lead.createdAt)
      const matchesDate = leadDate >= startOfDay(previousPeriodStart) && leadDate <= endOfDay(previousPeriodEnd)
      
      // Apply source filter to previous period as well
      const matchesSource = sourceFilter === "todos" || 
                           (sourceFilter === "nao-rastreada" && (!lead.source || lead.source === 'nao-identificado')) ||
                           (lead.source && lead.source === sourceFilter)
      
      return matchesDate && matchesSource
    })
    
    const previousTotalLeads = previousPeriodLeads.length
    const previousBeaconLeads = previousPeriodLeads.filter((lead) => lead.beacon).length
    const previousTrackedLeads = previousPeriodLeads.filter((lead) => 
      lead.source && lead.source !== 'nao-identificado' && lead.source !== 'Não Rastreada'
    ).length
    const previousUntrackedLeads = previousPeriodLeads.filter((lead) => 
      !lead.source || lead.source === 'nao-identificado' || lead.source === 'Não Rastreada'
    ).length
    
    // Calcular estatísticas do período atual
    const currentBeaconLeads = filteredLeadsForStats.filter((lead) => lead.beacon).length
    const currentTrackedLeads = filteredLeadsForStats.filter((lead) => 
      lead.source && lead.source !== 'nao-identificado' && lead.source !== 'Não Rastreada'
    ).length
    const currentUntrackedLeads = filteredLeadsForStats.filter((lead) => 
      !lead.source || lead.source === 'nao-identificado' || lead.source === 'Não Rastreada'
    ).length
    
    // Calcular variações percentuais
    const calculatePercentageChange = (current: number, previous: number) => {
      if (previous > 0) {
        return ((current - previous) / previous) * 100
      } else if (current > 0) {
        return 100 // Se não havia no período anterior, é 100% de crescimento
      }
      return 0
    }
    
    return {
      totalLeads: previousTotalLeads,
      beaconLeads: previousBeaconLeads,
      trackedLeads: previousTrackedLeads,
      untrackedLeads: previousUntrackedLeads,
      totalPercentageChange: calculatePercentageChange(filteredLeadsForStats.length, previousTotalLeads),
      beaconPercentageChange: calculatePercentageChange(currentBeaconLeads, previousBeaconLeads),
      trackedPercentageChange: calculatePercentageChange(currentTrackedLeads, previousTrackedLeads),
      untrackedPercentageChange: calculatePercentageChange(currentUntrackedLeads, previousUntrackedLeads),
      hasComparison: true
    }
  }, [dateFilter, sourceFilter, mappedLeads, filteredLeadsForStats])

  // Função auxiliar para formatar mensagem de comparação
  const formatComparisonMessage = (percentageChange: number | undefined, hasComparison: boolean) => {
    if (!hasComparison || percentageChange === undefined) {
      return "Dados de todos os períodos"
    }
    
    if (percentageChange > 0) {
      return `+${percentageChange.toFixed(1)}% em relação ao período anterior`
    } else if (percentageChange < 0) {
      return `${percentageChange.toFixed(1)}% em relação ao período anterior`
    } else {
      return "Sem variação em relação ao período anterior"
    }
  }

  const totalLeads = filteredLeadsForStats.length
  const beaconLeads = filteredLeadsForStats.filter((lead) => lead.beacon).length
  const trackedLeads = filteredLeadsForStats.filter((lead) => 
    lead.source && lead.source !== 'nao-identificado' && lead.source !== 'Não Rastreada'
  ).length
  const untrackedLeads = filteredLeadsForStats.filter((lead) => 
    !lead.source || lead.source === 'nao-identificado' || lead.source === 'Não Rastreada'
  ).length

    const toggleBeacon = async (leadId: number) => {
    try {
      const lead = leads.find(l => l.id === leadId)
      
      if (!lead) {
        toast({
          title: "Erro",
          description: "Lead não encontrado.",
          variant: "destructive",
        })
        return
      }
      
      if (lead.id === undefined || lead.id === null) {
        toast({
          title: "Erro",
          description: "ID do lead inválido.",
          variant: "destructive",
        })
        return
      }
      
      // Garantir que o valor seja um boolean
      const currentBeaconValue = Boolean(lead.is_becon)
      const newBeaconValue = !currentBeaconValue
      
      // Atualizar o lead no banco de dados
      const updatedLead = await updateLead(lead.id, { is_becon: newBeaconValue })
      
      if (updatedLead) {
        // Forçar re-renderização
        setForceUpdate(prev => prev + 1)
        toast({
          title: "Becon atualizado",
          description: `Becon ${newBeaconValue ? "ativado" : "desativado"} para ${lead.name}.`,
          variant: "success",
        })
      } else {
        throw new Error('Falha ao atualizar o lead')
      }
    } catch (error) {
      console.error('❌ Erro ao alternar becon:', error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar becon do lead.",
        variant: "destructive",
      })
    }
  }

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(currentLeads.map((lead) => lead.id || 0).filter(id => id > 0))
    } else {
      setSelectedLeads([])
    }
  }

  const handleSelectLead = (leadId: number | undefined, checked: boolean) => {
    if (checked && leadId && leadId > 0) {
      setSelectedLeads([...selectedLeads, leadId])
    } else if (leadId && leadId > 0) {
      setSelectedLeads(selectedLeads.filter((id) => id !== leadId))
    }
  }

  const isAllSelected = currentLeads.length > 0 && selectedLeads.length === currentLeads.length
  const isIndeterminate = selectedLeads.length > 0 && selectedLeads.length < currentLeads.length

  // Bulk actions
  const handleBulkDelete = async () => {
    try {
      const leadsToDelete = selectedLeads.length
      await deleteMultipleLeads(selectedLeads)
      setSelectedLeads([])
              toast({
          title: "Leads excluídos",
          description: `${leadsToDelete} leads foram excluídos com sucesso.`,
          variant: "success",
        })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir leads.",
        variant: "destructive",
      })
    }
  }

  const handleBulkBeaconToggle = async (beaconValue: boolean) => {
    try {
      const leadsToUpdate = selectedLeads.length
      await Promise.all(selectedLeads.map(id => updateLead(id, { is_becon: beaconValue })))
      setSelectedLeads([])
              toast({
                   title: "Becon atualizado",
         description: `Becon de ${leadsToUpdate} leads foi ${beaconValue ? "ativado" : "desativado"}.`,
          variant: "success",
        })
    } catch (error) {
      toast({
        title: "Erro",
                 description: "Erro ao atualizar becon dos leads.",
        variant: "destructive",
      })
    }
  }

  const handleBulkExport = () => {
    const selectedLeadsData = mappedLeads.filter((lead) => selectedLeads.includes(lead.id!))
    console.log("Exportando leads:", selectedLeadsData)
          toast({
        title: "Exportação iniciada",
        description: `Exportando ${selectedLeads.length} leads selecionados.`,
        variant: "info",
      })
  }

  // Mostrar loading
  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50/50 overflow-hidden">
        <SidebarWrapper />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando leads...</p>
          </div>
        </div>
      </div>
    )
  }

  // Mostrar erro
  if (error) {
    return (
      <div className="flex h-screen bg-gray-50/50 overflow-hidden">
        <SidebarWrapper />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">Erro ao carregar leads: {error}</p>
            <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="flex h-screen bg-gray-50/50 overflow-hidden">
        {/* Sidebar */}
        <SidebarWrapper />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">

        {/* Content */}
        <div className="flex-1 p-4 space-y-4 overflow-auto">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                     <div className="p-2 bg-gray-100 rounded-lg">
                       <Users className="h-4 w-4 text-green-600" />
                     </div>
                   </CardHeader>
                   <CardContent>
                     <div className="text-3xl font-bold text-gray-900 mb-2">{totalLeads}</div>
                     <p className="text-xs text-gray-600 font-medium">
                       {formatComparisonMessage(previousPeriodStats.totalPercentageChange, previousPeriodStats.hasComparison)}
                     </p>
                   </CardContent>
                 </Card>
                 <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 hover:shadow-xl transition-all duration-300">
                   <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                     <CardTitle className="text-sm font-semibold text-gray-900">Becon</CardTitle>
                     <div className="p-2 bg-gray-100 rounded-lg">
                       <Tag className="h-4 w-4 text-green-600" />
                     </div>
                   </CardHeader>
                   <CardContent>
                     <div className="text-3xl font-bold text-gray-900 mb-2">{beaconLeads}</div>
                     <p className="text-xs text-gray-600 font-medium">
                       {formatComparisonMessage(previousPeriodStats.beaconPercentageChange, previousPeriodStats.hasComparison)}
                     </p>
                   </CardContent>
                 </Card>
                 <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 hover:shadow-xl transition-all duration-300">
                   <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                     <CardTitle className="text-sm font-semibold text-gray-900">Rastreadas</CardTitle>
                     <div className="p-2 bg-gray-100 rounded-lg">
                       <TrendingUp className="h-4 w-4 text-green-600" />
                     </div>
                   </CardHeader>
                   <CardContent>
                     <div className="text-3xl font-bold text-gray-900 mb-2">{trackedLeads}</div>
                     <p className="text-xs text-gray-600 font-medium">
                       {formatComparisonMessage(previousPeriodStats.trackedPercentageChange, previousPeriodStats.hasComparison)}
                     </p>
                   </CardContent>
                 </Card>
                 <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 hover:shadow-xl transition-all duration-300">
                   <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                     <CardTitle className="text-sm font-semibold text-gray-900">Não Rastreadas</CardTitle>
                     <div className="p-2 bg-gray-100 rounded-lg">
                       <Users className="h-4 w-4 text-green-600" />
                     </div>
                   </CardHeader>
                   <CardContent>
                     <div className="text-3xl font-bold text-gray-900 mb-2">{untrackedLeads}</div>
                     <p className="text-xs text-gray-600 font-medium">
                       {formatComparisonMessage(previousPeriodStats.untrackedPercentageChange, previousPeriodStats.hasComparison)}
                     </p>
                   </CardContent>
                 </Card>
               </>
            )}
                     </div>

                       {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
              <div className="lg:col-span-7 h-full">
                <LeadsChart leads={filteredLeadsForStats} dateFilter={dateFilter} loading={loading} />
              </div>
              <div className="lg:col-span-3 h-full">
                <DemographicsChart leads={filteredLeadsForStats} dateFilter={dateFilter} loading={loading} />
              </div>
            </div>

           {/* Filters and Search */}
          <Card className="flex-1 flex flex-col min-h-0 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
            <CardHeader className="flex-shrink-0 pb-4">
              {loading ? (
                <>
                  <Skeleton className="h-6 w-24 mb-2" />
                  <Skeleton className="h-4 w-64" />
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                                         <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                     <Users className="w-5 h-5 text-green-600" />
                     Leads
                   </CardTitle>
                      <CardDescription className="text-gray-600 mt-1">
                        Gerencie todos os seus leads em um só lugar
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">{filteredLeads.length}</div>
                      <div className="text-sm text-gray-500">Leads filtrados</div>
                    </div>
                  </div>
                </>
              )}
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0">
              {loading ? (
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 w-[180px]" />
                  <Skeleton className="h-10 w-[180px]" />
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar por nome, telefone, campanha ou origem..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                                             className="pl-10 border-gray-200 focus:border-green-500 focus:ring-green-500 transition-colors duration-200"
                    />
                  </div>
                  <Select value={sourceFilter} onValueChange={setSourceFilter}>
                                         <SelectTrigger className="w-full sm:w-[180px] border-gray-200 focus:border-green-500 focus:ring-green-500 transition-colors duration-200">
                      <SelectValue placeholder="Origem" />
                    </SelectTrigger>
                    <SelectContent>
                      {getSourceFilterOptions().map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <AdvancedDatePicker value={dateFilter} onChange={setDateFilter} />
                </div>
              )}

                             {/* Bulk Actions Bar */}
               {selectedLeads.length > 0 && (
                 <div className="flex items-center justify-between p-4 mb-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-sm">
                   <div className="flex items-center gap-3">
                     <div className="p-2 bg-green-100 rounded-lg">
                       <Users className="w-4 h-4 text-green-600" />
                     </div>
                     <div>
                       <span className="text-sm font-semibold text-green-900">
                         {selectedLeads.length} lead{selectedLeads.length > 1 ? "s" : ""} selecionado
                         {selectedLeads.length > 1 ? "s" : ""}
                       </span>
                       <p className="text-xs text-green-600">Ações em massa disponíveis</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-2">
                     <DropdownMenu>
                       <DropdownMenuTrigger asChild>
                         <Button variant="outline" size="sm" className="border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 transition-colors duration-200">
                           <Tag className="w-4 h-4 mr-2" />
                           Becon
                         </Button>
                       </DropdownMenuTrigger>
                       <DropdownMenuContent>
                         <DropdownMenuItem onClick={() => handleBulkBeaconToggle(true)}>Ativar Becon</DropdownMenuItem>
                         <DropdownMenuItem onClick={() => handleBulkBeaconToggle(false)}>
                           Desativar Becon
                         </DropdownMenuItem>
                       </DropdownMenuContent>
                     </DropdownMenu>

                     <Button variant="outline" size="sm" onClick={handleBulkExport} className="border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 transition-colors duration-200">
                       <Download className="w-4 h-4 mr-2" />
                       Exportar
                     </Button>

                     <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="hover:bg-red-600 transition-colors duration-200">
                       <Trash2 className="w-4 h-4 mr-2" />
                       Excluir
                     </Button>

                     <Button variant="ghost" size="sm" onClick={() => setSelectedLeads([])} className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors duration-200">
                       Cancelar
                     </Button>
                   </div>
                 </div>
               )}

              {/* Leads Table */}
              <div className="rounded-md border flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={isAllSelected}
                            onCheckedChange={handleSelectAll}
                            aria-label="Selecionar todos"
                            {...(isIndeterminate && { "data-state": "indeterminate" })}
                          />
                        </TableHead>
                        <TableHead className="w-24">Data</TableHead>
                        <TableHead className="w-48">Nome</TableHead>
                        <TableHead className="w-40">Telefone / Estado</TableHead>
                                                                          <TableHead className="w-24">Origem</TableHead>
                         <TableHead className="w-28">Medium</TableHead>
                         <TableHead className="w-32">Campanha</TableHead>
                         <TableHead className="w-28">Termo</TableHead>
                                                   <TableHead className="w-20">Becon</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <>
                          {Array.from({ length: 12 }, (_, i) => (
                            <TableRowSkeleton key={i} />
                          ))}
                        </>
                      ) : (
                        currentLeads.map((lead, index) => (
                          <TableRow
                            key={lead.id}
                            className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"} ${
                              selectedLeads.includes(lead.id) ? "bg-blue-50 border-blue-200" : ""
                            }`}
                          >
                            <TableCell>
                              <Checkbox
                                checked={selectedLeads.includes(lead.id || 0)}
                                onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                                aria-label={`Selecionar ${lead.name}`}
                              />
                            </TableCell>
                            <TableCell className="w-24">
                              {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString("pt-BR") : 'N/A'}
                            </TableCell>
                            <TableCell className="w-48 font-medium">{lead.name || 'N/A'}</TableCell>
                                                    <TableCell className="w-40">
                          <div className="space-y-1">
                            <div className="text-sm">{lead.phone}</div>
                            <div className="text-xs text-gray-500">{getStateFromPhone(lead.phone)}</div>
                          </div>
                        </TableCell>
                                                                                                           <TableCell className="w-24">
                           <div className="text-sm">
                             {sourceLabels[lead.source as keyof typeof sourceLabels] || 
                              (lead.source && lead.source !== 'nao-identificado' ? lead.source : 'Não Rastreada')}
                           </div>
                         </TableCell>
                         <TableCell className="w-28">
                           <div className="text-sm text-gray-600">{lead.utm_medium || 'N/A'}</div>
                         </TableCell>
                         <TableCell className="w-32">
                           <div className="text-sm">{lead.campaign || 'Não Rastreada'}</div>
                         </TableCell>
                         <TableCell className="w-28">
                           <div className="text-sm text-gray-600">{lead.utm_term || 'N/A'}</div>
                         </TableCell>
                            <TableCell className="w-20">
                              <div className="flex items-center gap-2">
                                <Badge
                                  className={`cursor-pointer ${lead.beacon ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-red-100 text-red-800 hover:bg-red-200"}`}
                                  onClick={() => {
                                    lead.id && toggleBeacon(lead.id)
                                  }}
                                >
                                  {lead.beacon ? "Sim" : "Não"}
                                </Badge>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => lead.id && verifyAndUpdateBecon(lead.id)}
                                >
                                  <Search className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

                             {currentLeads.length === 0 && (
                 <div className="flex flex-col items-center justify-center py-12 text-center">
                   <div className="p-4 bg-gray-100 rounded-full mb-4">
                     <Users className="w-8 h-8 text-gray-400" />
                   </div>
                   <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum lead encontrado</h3>
                   <p className="text-gray-500 max-w-md">
                     Não encontramos leads que correspondam aos filtros aplicados. Tente ajustar os critérios de busca.
                   </p>
                 </div>
               )}

              {/* Pagination Controls */}
              {loading ? (
                <div className="flex items-center justify-between px-2 py-4 flex-shrink-0">
                  <Skeleton className="h-4 w-48" />
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-8 w-16" />
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Skeleton key={i} className="h-8 w-8" />
                      ))}
                    </div>
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              ) : (
                                 filteredLeads.length > 0 && (
                   <div className="flex items-center justify-between px-4 py-4 flex-shrink-0 bg-gray-50/50 rounded-lg border border-gray-100">
                     <div className="text-sm text-gray-600 font-medium">
                       Mostrando <span className="text-green-600 font-semibold">{startIndex + 1}</span> a <span className="text-green-600 font-semibold">{Math.min(endIndex, filteredLeads.length)}</span> de <span className="text-green-600 font-semibold">{filteredLeads.length}</span> leads
                     </div>
                     <div className="flex items-center space-x-2">
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => setCurrentPage(currentPage - 1)}
                         disabled={currentPage === 1}
                         className="border-gray-200 text-gray-700 hover:bg-green-50 hover:border-green-300 transition-colors duration-200 disabled:opacity-50"
                       >
                         Anterior
                       </Button>
                       <div className="flex items-center space-x-1">
                         {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                           let pageNumber
                           if (totalPages <= 5) {
                             pageNumber = i + 1
                           } else if (currentPage <= 3) {
                             pageNumber = i + 1
                           } else if (currentPage >= totalPages - 2) {
                             pageNumber = totalPages - 4 + i
                           } else {
                             pageNumber = currentPage - 2 + i
                           }
                           
                           return (
                             <Button
                               key={pageNumber}
                               variant={currentPage === pageNumber ? "default" : "outline"}
                               size="sm"
                               onClick={() => setCurrentPage(pageNumber)}
                               className={`w-8 h-8 p-0 transition-all duration-200 ${
                                 currentPage === pageNumber 
                                   ? "bg-green-600 text-white hover:bg-green-700" 
                                   : "border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                               }`}
                             >
                               {pageNumber}
                             </Button>
                           )
                         })}
                       </div>
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => setCurrentPage(currentPage + 1)}
                         disabled={currentPage === totalPages}
                         className="border-gray-200 text-gray-700 hover:bg-green-50 hover:border-green-300 transition-colors duration-200 disabled:opacity-50"
                       >
                         Próxima
                       </Button>
                     </div>
                   </div>
                 )
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </AuthGuard>
  )
}
