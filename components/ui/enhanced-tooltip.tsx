import React from 'react'
import { TrendingUp, Users, DollarSign, Calendar, MapPin, Target } from 'lucide-react'

interface TooltipItem {
  name: string
  value: number | string
  color: string
  icon?: React.ReactNode
  formatter?: (value: number | string) => string
}

interface EnhancedTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
  title?: string
  items?: TooltipItem[]
  showDate?: boolean
  showPercentage?: boolean
  total?: number
  className?: string
}

export const EnhancedTooltip: React.FC<EnhancedTooltipProps> = ({
  active,
  payload,
  label,
  title,
  items,
  showDate = false,
  showPercentage = false,
  total,
  className = ""
}) => {
  if (!active || !payload || !payload.length) return null

  // Se items for fornecido, usar ele; senão, processar payload
  const tooltipItems = items || payload.map((entry: any) => ({
    name: entry.name,
    value: entry.value,
    color: entry.color || entry.fill,
    icon: entry.icon
  }))

  return (
    <div className={`
      bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-2xl
      p-4 min-w-[200px] max-w-[280px] relative z-50
      focus:outline-none
      ${className}
    `}>
      {/* Seta superior */}
      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-white/95 z-50"></div>
      
      {/* Header */}
      {(title || label) && (
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
          {showDate ? (
            <Calendar className="w-4 h-4 text-green-600" />
          ) : (
            <Target className="w-4 h-4 text-green-600" />
          )}
          <p className="font-semibold text-gray-900 text-sm">
            {title || label}
          </p>
        </div>
      )}

      {/* Items */}
      <div className="space-y-2">
        {tooltipItems.map((item, index) => {
          const displayValue = item.formatter ? item.formatter(item.value) : item.value
          const percentage = showPercentage && total && typeof item.value === 'number' 
            ? ` (${((item.value / total) * 100).toFixed(1)}%)`
            : ''

          return (
            <div key={index} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                {item.icon || (
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: item.color }}
                  />
                )}
                <span className="text-sm font-medium text-gray-700 truncate">
                  {item.name}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold text-gray-900">
                  {displayValue}
                </span>
                {percentage && (
                  <span className="text-xs text-gray-500">
                    {percentage}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer com total se aplicável */}
      {total && showPercentage && (
        <div className="mt-3 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600">Total:</span>
            <span className="text-sm font-bold text-gray-900">{total}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// Componentes específicos para diferentes tipos de charts
export const LeadsChartTooltip: React.FC<{ active?: boolean; payload?: any[]; label?: string }> = ({ 
  active, 
  payload, 
  label 
}) => {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload
  const isToday = data?.originalDate ? 
    new Date().toDateString() === data.originalDate.toDateString() : false

  return (
    <div style={{ zIndex: 9999 }}>
      <EnhancedTooltip
        active={active}
        payload={payload}
        label={data?.fullDate}
        showDate={true}
        items={[
          {
            name: 'Leads',
            value: payload[0].value,
            color: '#10b981',
            icon: <Users className="w-4 h-4 text-green-600" />,
            formatter: (value) => `${value} ${Number(value) === 1 ? 'lead' : 'leads'}`
          }
        ]}
        className="min-w-[180px]"
      >
        {isToday && (
          <div className="mt-2">
            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full font-medium">
              Hoje
            </span>
          </div>
        )}
      </EnhancedTooltip>
    </div>
  )
}

export const DemographicsTooltip: React.FC<{ active?: boolean; payload?: any[]; total?: number }> = ({ 
  active, 
  payload, 
  total 
}) => {
  if (!active || !payload || !payload.length) return null

  const data = payload[0]
  const percentage = total ? ((data.value / total) * 100).toFixed(1) : '0'

  return (
    <div style={{ zIndex: 9999 }}>
      <EnhancedTooltip
        active={active}
        payload={payload}
        items={[
          {
            name: data.name,
            value: data.value,
            color: data.fill,
            icon: <Users className="w-4 h-4 text-green-600" />,
            formatter: (value) => `${value} leads (${percentage}%)`
          }
        ]}
      />
    </div>
  )
}

export const GoogleAdsTooltip: React.FC<{ active?: boolean; payload?: any[]; label?: string }> = ({ 
  active, 
  payload, 
  label 
}) => {
  if (!active || !payload || !payload.length) return null

  return (
    <div style={{ zIndex: 9999 }}>
      <EnhancedTooltip
        active={active}
        payload={payload}
        label={label}
        showDate={true}
        items={payload.map((entry: any) => ({
          name: entry.name,
          value: entry.value,
          color: entry.color,
          icon: entry.name === 'Investimento' ? 
            <DollarSign className="w-4 h-4 text-green-600" /> : 
            <TrendingUp className="w-4 h-4 text-blue-600" />,
          formatter: (value) => entry.name === 'Investimento' 
            ? `R$ ${(Number(value) * 1000000).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            : `${Number(value).toFixed(2)} conversões`
        }))}
      />
    </div>
  )
}
