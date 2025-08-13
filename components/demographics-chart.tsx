"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { TrendingUp, Users, MapPin } from "lucide-react"

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
}

// Mapeamento de DDD para estados
const dddToState: { [key: string]: string } = {
  '11': 'SP', '12': 'SP', '13': 'SP', '14': 'SP', '15': 'SP', '16': 'SP', '17': 'SP', '18': 'SP', '19': 'SP',
  '21': 'RJ', '22': 'RJ', '24': 'RJ',
  '27': 'ES', '28': 'ES',
  '31': 'MG', '32': 'MG', '33': 'MG', '34': 'MG', '35': 'MG', '37': 'MG', '38': 'MG',
  '41': 'PR', '42': 'PR', '43': 'PR', '44': 'PR', '45': 'PR', '46': 'PR',
  '47': 'SC', '48': 'SC', '49': 'SC',
  '51': 'RS', '53': 'RS', '54': 'RS', '55': 'RS',
  '61': 'DF',
  '62': 'GO', '63': 'TO', '64': 'GO',
  '65': 'MT', '66': 'MT', '67': 'MS',
  '68': 'AC', '69': 'RO',
  '71': 'BA', '73': 'BA', '74': 'BA', '75': 'BA', '77': 'BA',
  '79': 'SE',
  '81': 'PE', '82': 'AL', '83': 'PB', '84': 'RN', '85': 'CE', '86': 'PI', '87': 'PE', '88': 'CE', '89': 'PI',
  '91': 'PA', '92': 'AM', '93': 'PA', '94': 'PA', '95': 'RR', '96': 'AP', '97': 'AM', '98': 'MA', '99': 'MA'
}

// Função para extrair DDD e retornar estado
const getStateFromPhone = (phone: string): string => {
  if (!phone) return 'Não Rastreada'
  
  const cleanPhone = phone.replace(/\D/g, '')
  
  if (cleanPhone.length < 2) return 'Não Rastreada'
  
  const ddd = cleanPhone.substring(0, 2)
  
  return dddToState[ddd] || 'Não Rastreada'
}

// Função para detectar gênero baseado no nome
const detectGender = (name: string): string => {
  if (!name) return 'Não Identificado'
  
  // Nomes femininos comuns no Brasil
  const femaleNames = [
    // Nomes muito comuns
    'maria', 'ana', 'juliana', 'patricia', 'alessandra', 'fernanda', 'camila', 'amanda', 'leticia', 'vanessa',
    'bruna', 'jessica', 'carolina', 'gabriela', 'isabella', 'sophia', 'valentina', 'giulia', 'heloisa', 'luiza',
    'manuela', 'cecilia', 'beatriz', 'laura', 'clara', 'mariana', 'barbara', 'rafaella', 'isabela', 'lorena',
    'yasmin', 'nicole', 'sarah', 'lara', 'julia', 'victoria', 'emily', 'alice', 'sophie', 'melissa',
    
    // Nomes tradicionais femininos
    'adriana', 'cristina', 'eliane', 'rosangela', 'silvia', 'regina', 'marcia', 'denise', 'eliana', 'fatima',
    'graziela', 'ivone', 'josefa', 'karla', 'lucia', 'margarida', 'nadia', 'olga', 'paula', 'renata',
    'sonia', 'tatiana', 'vera', 'wilma', 'yara', 'zenaida', 'angela', 'benedita', 'carmem', 'diana',
    'elisa', 'flavia', 'gisele', 'helena', 'ines', 'janaina', 'karen', 'lilian', 'mirella', 'nayara',
    'olivia', 'priscila', 'queila', 'rosana', 'sabrina', 'tamara', 'ursula', 'viviane', 'wanda', 'xuxa',
    'yasmim', 'zuleica', 'adelaide', 'bernadete', 'cassandra', 'doralice', 'eunice', 'fabiana', 'geovana',
    'hilda', 'iris', 'juliana', 'kelly', 'lais', 'mirela', 'nathalia', 'orlanda', 'paloma', 'quenia',
    'rosemary', 'sueli', 'tania', 'valeria', 'waleska', 'xenia', 'yolanda', 'zilda'
  ]
  
  // Nomes masculinos comuns no Brasil
  const maleNames = [
    // Nomes muito comuns
    'jose', 'joao', 'antonio', 'francisco', 'carlos', 'paulo', 'pedro', 'lucas', 'luiz', 'marcos',
    'luis', 'gabriel', 'rafael', 'daniel', 'marcelo', 'bruno', 'eduardo', 'felipe', 'rodrigo',
    'anderson', 'thiago', 'leonardo', 'guilherme', 'gustavo', 'henrique', 'matheus', 'arthur', 'bernardo', 'davi',
    'heitor', 'samuel', 'joaquim', 'benicio', 'enzo', 'lorenzo', 'theo', 'noah', 'benjamin', 'diego',
    
    // Nomes tradicionais masculinos
    'adriano', 'cristiano', 'elias', 'fabricio', 'hugo', 'igor', 'julio', 'kevin', 'miguel', 'nelson',
    'otavio', 'quintino', 'ricardo', 'sergio', 'tiago', 'ulisses', 'vinicius', 'wagner', 'xavier', 'yago',
    'zeus', 'alberto', 'benedito', 'caio', 'diego', 'elias', 'fabio', 'gilberto', 'heitor', 'ivan',
    'jorge', 'kleber', 'leandro', 'mauro', 'nilo', 'osvaldo', 'pablo', 'quintino', 'roberto', 'sandro',
    'tadeu', 'ulisses', 'valdir', 'washington', 'xavier', 'yuri', 'zeca', 'adilson', 'breno', 'caua',
    'davi', 'elton', 'felipe', 'gabriel', 'henrique', 'italo', 'joel', 'kaique', 'luan', 'marcelo',
    'nathan', 'otavio', 'pietro', 'rafael', 'samuel', 'tomas', 'vitor', 'wesley', 'xande', 'yago'
  ]
  
  // Limpar e normalizar o nome
  const cleanName = name.toLowerCase().trim()
  const firstName = cleanName.split(' ')[0]
  
  // Verificar se é um nome feminino
  if (femaleNames.includes(firstName)) {
    return 'Feminino'
  }
  
  // Verificar se é um nome masculino
  if (maleNames.includes(firstName)) {
    return 'Masculino'
  }
  
  // Verificar sufixos típicos de gênero
  const femaleSuffixes = ['a', 'ia', 'ina', 'ela', 'ana', 'ina', 'ela', 'ana', 'ina', 'ela']
  const maleSuffixes = ['o', 'io', 'inho', 'elo', 'ano', 'inho', 'elo', 'ano', 'inho', 'elo']
  
  if (femaleSuffixes.some(suffix => firstName.endsWith(suffix))) {
    return 'Feminino'
  }
  
  if (maleSuffixes.some(suffix => firstName.endsWith(suffix))) {
    return 'Masculino'
  }
  
  // Se não conseguir identificar, retornar "Não Identificado"
  return 'Não Identificado'
}

// Cores para os estados focados
const STATE_COLORS = [
  '#3b82f6', // Azul - SC
  '#10b981', // Verde - PR
  '#f59e0b', // Amarelo - RS
  '#ef4444', // Vermelho - SP
]

// Cores para gênero
const GENDER_COLORS = [
  '#ec4899', // Rosa - Feminino
  '#3b82f6', // Azul - Masculino
  '#94a3b8', // Cinza - Não Identificado
]

export function DemographicsChart({ leads, dateFilter }: DemographicsChartProps) {
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
      const focusedData = focusedStates.map(state => ({
        name: state,
        value: stateCounts[state] || 0,
        fill: STATE_COLORS[focusedStates.indexOf(state)]
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
          fill: '#94a3b8' // Cor cinza para "Outros"
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
        { name: 'Feminino', value: genderCounts['Feminino'] || 0, fill: GENDER_COLORS[0] },
        { name: 'Masculino', value: genderCounts['Masculino'] || 0, fill: GENDER_COLORS[1] },
        { name: 'Não Identificado', value: genderCounts['Não Identificado'] || 0, fill: GENDER_COLORS[2] }
      ].filter(item => item.value > 0)

      // Ordenar por quantidade decrescente
      return genderData.sort((a, b) => b.value - a.value)
    }
  }, [leads, dateFilter, chartType])

  const totalLeads = chartData.reduce((sum, item) => sum + item.value, 0)
  const topItem = chartData[0]
  const topItemPercentage = topItem ? ((topItem.value / totalLeads) * 100).toFixed(1) : '0'

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      const percentage = ((data.value / totalLeads) * 100).toFixed(1)
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-blue-600">
            <span className="font-medium">{data.value}</span> leads ({percentage}%)
          </p>
        </div>
      )
    }
    return null
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{getChartTitle()}</CardTitle>
            <CardDescription>
              {getChartDescription()}
            </CardDescription>
          </div>
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
        </div>
      </CardHeader>
      <CardContent>
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
              <div className="text-5xl font-bold text-gray-900">{totalLeads}</div>
              <div className="text-sm text-gray-600">Leads</div>
            </div>
          </div>
        </div>

        {chartData.length === 0 && (
          <div className="flex items-center justify-center h-[360px] text-muted-foreground">
            <p>Nenhum dado disponível para o período selecionado</p>
          </div>
        )}
        
        {/* Footer com item líder */}
        {topItem && chartData.length > 0 && (
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
