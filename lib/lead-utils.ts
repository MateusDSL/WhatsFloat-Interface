// Mapeamento de DDD para estados brasileiros
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

/**
 * Extrai o estado brasileiro baseado no DDD do telefone
 * @param phone - Número de telefone (com ou sem formatação)
 * @returns Sigla do estado ou 'Não Rastreada' se não conseguir identificar
 */
export const getStateFromPhone = (phone: string): string => {
  if (!phone) return 'Não Rastreada'
  
  const cleanPhone = phone.replace(/\D/g, '')
  
  if (cleanPhone.length < 2) return 'Não Rastreada'
  
  const ddd = cleanPhone.substring(0, 2)
  
  return dddToState[ddd] || 'Não Rastreada'
}

/**
 * Detecta o gênero baseado no nome da pessoa
 * @param name - Nome completo da pessoa
 * @returns 'Feminino', 'Masculino' ou 'Não Identificado'
 */
export const detectGender = (name: string): string => {
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

/**
 * Constantes de cores para gráficos
 */
export const CHART_COLORS = {
  // Cores para os estados focados
  STATE_COLORS: [
    '#3b82f6', // Azul - SC
    '#10b981', // Verde - PR
    '#f59e0b', // Amarelo - RS
    '#ef4444', // Vermelho - SP
  ],
  
  // Cores para gênero
  GENDER_COLORS: [
    '#ec4899', // Rosa - Feminino
    '#3b82f6', // Azul - Masculino
    '#94a3b8', // Cinza - Não Identificado
  ],
  
  // Cor para "Outros"
  OTHERS_COLOR: '#94a3b8'
} as const
