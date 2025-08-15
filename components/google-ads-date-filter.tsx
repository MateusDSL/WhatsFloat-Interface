"use client"

import * as React from "react"
import { CalendarIcon, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import {
  format,
  addMonths,
  subMonths,
  startOfDay,
  endOfDay,
  subDays,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths as subMonthsDate,
  subYears,
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useGoogleAds } from "@/hooks/useGoogleAds"

interface DateRange {
  from: Date | undefined
  to: Date | undefined
}

interface GoogleAdsDateFilterProps {
  value: DateRange
  onChange: (range: DateRange) => void
  onDataFetch?: (data: any[]) => void
  customerId?: string
  className?: string
}

const presetOptions = [
  {
    label: "Hoje",
    description: "Dados de campanhas de hoje",
    getValue: () => ({
      from: startOfDay(new Date()),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "Ontem",
    description: "Dados de campanhas de ontem",
    getValue: () => ({
      from: startOfDay(subDays(new Date(), 1)),
      to: endOfDay(subDays(new Date(), 1)),
    }),
  },
  {
    label: "Últimos 7 dias",
    description: "Dados dos últimos 7 dias incluindo hoje",
    getValue: () => ({
      from: startOfDay(subDays(new Date(), 6)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "Últimos 30 dias",
    description: "Dados dos últimos 30 dias incluindo hoje",
    getValue: () => ({
      from: startOfDay(subDays(new Date(), 29)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "Este mês",
    description: "Todos os dados do mês atual",
    getValue: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
  {
    label: "Mês passado",
    description: "Todos os dados do mês anterior",
    getValue: () => {
      const lastMonth = subMonthsDate(new Date(), 1)
      return {
        from: startOfMonth(lastMonth),
        to: endOfMonth(lastMonth),
      }
    },
  },
  {
    label: "Este ano",
    description: "Todos os dados do ano atual",
    getValue: () => ({
      from: startOfYear(new Date()),
      to: endOfYear(new Date()),
    }),
  },
  {
    label: "Últimos 12 meses",
    description: "Dados dos últimos 12 meses incluindo o mês atual",
    getValue: () => ({
      from: startOfDay(subYears(new Date(), 1)),
      to: endOfDay(new Date()),
    }),
  },
]

export function GoogleAdsDateFilter({ 
  value, 
  onChange, 
  onDataFetch,
  customerId,
  className 
}: GoogleAdsDateFilterProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [tempRange, setTempRange] = React.useState<DateRange>(value)
  const [currentMonth, setCurrentMonth] = React.useState(new Date())
  const [selectedPreset, setSelectedPreset] = React.useState<string | null>(null)
  const [isFetching, setIsFetching] = React.useState(false)

  const { fetchCampaigns, loading, error } = useGoogleAds()

  const handlePresetClick = async (preset: (typeof presetOptions)[0]) => {
    const range = preset.getValue()
    setTempRange(range)
    setSelectedPreset(preset.label)
    
    // Aplicar imediatamente se for um preset
    await applyDateFilter(range)
  }

  const applyDateFilter = async (dateRange: DateRange) => {
    if (!dateRange.from) return

    setIsFetching(true)
    
    try {
      // Cria um intervalo final garantindo que a data 'to' exista.
      const finalDateRange = {
        from: dateRange.from,
        to: dateRange.to || dateRange.from, // Se 'to' for undefined, usa 'from'.
      };

      const dateFrom = finalDateRange.from.toISOString().split('T')[0]
      const dateTo = finalDateRange.to.toISOString().split('T')[0]
      
      console.log('🔍 Aplicando filtro de data Google Ads:', { dateFrom, dateTo })
      
      // Busca dados com o filtro de data correto
      await fetchCampaigns(customerId, dateFrom, dateTo)
      
      // Aplica o filtro no estado do componente pai com o intervalo corrigido
      onChange(finalDateRange)
      setIsOpen(false)
      
      console.log('✅ Filtro de data aplicado com sucesso')
      
    } catch (err) {
      console.error('❌ Erro ao aplicar filtro de data:', err)
      // Em caso de erro, reverte para o valor anterior
      setTempRange(value)
    } finally {
      setIsFetching(false)
    }
  }

  const handleApply = async () => {
    await applyDateFilter(tempRange)
  }

  const handleCancel = () => {
    setTempRange(value)
    setSelectedPreset(null)
    setIsOpen(false)
  }

  const handleDateClick = (date: Date) => {
    if (!tempRange.from || (tempRange.from && tempRange.to)) {
      // Primeira seleção ou reset - selecionar apenas uma data
      setTempRange({ from: date, to: undefined })
      setSelectedPreset(null)
    } else if (tempRange.from && !tempRange.to) {
      // Segunda seleção - criar intervalo
      if (date < tempRange.from) {
        setTempRange({ from: date, to: tempRange.from })
      } else {
        setTempRange({ from: tempRange.from, to: date })
      }
    }
  }

  const renderCalendar = (month: Date) => {
    const monthStart = startOfMonth(month)
    const monthEnd = endOfMonth(month)
    const startDate = startOfDay(monthStart)
    const endDate = endOfDay(monthEnd)

    // Get first day of the week for the month
    const firstDayOfWeek = startDate.getDay()
    const daysInMonth = monthEnd.getDate()

    // Create array of days
    const days = []

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDayOfWeek; i++) {
      const prevDate = new Date(monthStart)
      prevDate.setDate(prevDate.getDate() - (firstDayOfWeek - i))
      days.push({ date: prevDate, isCurrentMonth: false })
    }

    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(month.getFullYear(), month.getMonth(), day)
      days.push({ date, isCurrentMonth: true })
    }

    // Add days from next month to fill the grid
    const remainingCells = 42 - days.length // 6 rows × 7 days
    for (let day = 1; day <= remainingCells; day++) {
      const nextDate = new Date(monthEnd)
      nextDate.setDate(nextDate.getDate() + day)
      days.push({ date: nextDate, isCurrentMonth: false })
    }

    return (
      <div className="p-3">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentMonth(subMonths(month, 1))}
            className="h-7 w-7 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="font-medium">{format(month, "MMMM yyyy", { locale: ptBR })}</div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentMonth(addMonths(month, 1))}
            className="h-7 w-7 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
            <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map(({ date, isCurrentMonth }, index) => {
            const isSelected = tempRange.from && tempRange.to && date >= tempRange.from && date <= tempRange.to
            const isRangeStart = tempRange.from && format(date, "yyyy-MM-dd") === format(tempRange.from, "yyyy-MM-dd")
            const isRangeEnd = tempRange.to && format(date, "yyyy-MM-dd") === format(tempRange.to, "yyyy-MM-dd")

            return (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 w-8 p-0 font-normal",
                  !isCurrentMonth && "text-muted-foreground opacity-50",
                  isSelected && "bg-primary/10",
                  (isRangeStart || isRangeEnd) && "bg-primary text-primary-foreground",
                )}
                onClick={() => handleDateClick(date)}
              >
                {date.getDate()}
              </Button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full sm:w-[280px] justify-start text-left font-normal",
              !value.from && !value.to && "text-muted-foreground",
              className,
            )}
            disabled={isFetching}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {isFetching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Carregando...
              </>
            ) : value.from ? (
              value.to ? (
                <>
                  {format(value.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                  {format(value.to, "dd/MM/yyyy", { locale: ptBR })}
                </>
              ) : (
                format(value.from, "dd/MM/yyyy", { locale: ptBR })
              )
            ) : (
              <span>Filtrar por data</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            {/* Sidebar with presets */}
            <div className="w-48 border-r bg-muted/50 p-3">
              <div className="space-y-1">
                {presetOptions.map((preset) => (
                  <Tooltip key={preset.label}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "w-full justify-start font-normal",
                          selectedPreset === preset.label && "bg-primary text-primary-foreground",
                        )}
                        onClick={() => handlePresetClick(preset)}
                        disabled={isFetching}
                      >
                        {preset.label}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <p>{preset.description}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "w-full justify-start font-normal",
                        !selectedPreset && "bg-primary text-primary-foreground",
                      )}
                      onClick={() => setSelectedPreset(null)}
                      disabled={isFetching}
                    >
                      Personalizado
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p>Selecione um período personalizado usando o calendário</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Calendar */}
            <div className="flex">
              {renderCalendar(currentMonth)}
              {renderCalendar(addMonths(currentMonth, 1))}
            </div>
          </div>

                     {/* Footer */}
           <div className="flex items-center justify-between p-3 border-t">
             <div className="text-sm text-muted-foreground">
               {tempRange.from && (
                 tempRange.to ? (
                   <>
                     {format(tempRange.from, "dd/MM/yyyy", { locale: ptBR })} a{" "}
                     {format(tempRange.to, "dd/MM/yyyy", { locale: ptBR })}
                   </>
                 ) : (
                   <>
                     {format(tempRange.from, "dd/MM/yyyy", { locale: ptBR })}
                   </>
                 )
               )}
             </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCancel}
                disabled={isFetching}
              >
                Cancelar
              </Button>
                             <Button 
                 size="sm" 
                 onClick={handleApply}
                 disabled={isFetching || !tempRange.from}
               >
                {isFetching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Aplicando...
                  </>
                ) : (
                  'Aplicar'
                )}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  )
}
