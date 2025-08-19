import { useReducer, useCallback } from 'react'

// Tipos para o estado
export interface LeadsPageState {
  // Filtros
  searchTerm: string
  sourceFilter: string
  campaignFilter: string
  dateFilter: {
    from: Date | undefined
    to: Date | undefined
  }
  
  // Paginação
  currentPage: number
  leadsPerPage: number
  
  // Seleção
  selectedLeads: number[]
  
  // Forçar atualização
  forceUpdate: number
}

// Tipos para as ações
export type LeadsPageAction =
  | { type: 'SET_SEARCH_TERM'; payload: string }
  | { type: 'SET_SOURCE_FILTER'; payload: string }
  | { type: 'SET_CAMPAIGN_FILTER'; payload: string }
  | { type: 'SET_DATE_FILTER'; payload: { from: Date | undefined; to: Date | undefined } }
  | { type: 'SET_CURRENT_PAGE'; payload: number }
  | { type: 'SET_LEADS_PER_PAGE'; payload: number }
  | { type: 'SET_SELECTED_LEADS'; payload: number[] }
  | { type: 'ADD_SELECTED_LEAD'; payload: number }
  | { type: 'REMOVE_SELECTED_LEAD'; payload: number }
  | { type: 'SELECT_ALL_LEADS'; payload: number[] }
  | { type: 'CLEAR_SELECTED_LEADS' }
  | { type: 'FORCE_UPDATE' }
  | { type: 'RESET_FILTERS' }
  | { type: 'RESET_PAGINATION' }
  | { type: 'RESET_ALL' }

// Estado inicial
const initialState: LeadsPageState = {
  searchTerm: '',
  sourceFilter: 'todos',
  campaignFilter: 'todos',
  dateFilter: {
    from: undefined,
    to: undefined,
  },
  currentPage: 1,
  leadsPerPage: 12,
  selectedLeads: [],
  forceUpdate: 0,
}

// Reducer function
function leadsPageReducer(state: LeadsPageState, action: LeadsPageAction): LeadsPageState {
  switch (action.type) {
    case 'SET_SEARCH_TERM':
      return {
        ...state,
        searchTerm: action.payload,
        currentPage: 1, // Reset para primeira página ao filtrar
      }
    
    case 'SET_SOURCE_FILTER':
      return {
        ...state,
        sourceFilter: action.payload,
        currentPage: 1,
      }
    
    case 'SET_CAMPAIGN_FILTER':
      return {
        ...state,
        campaignFilter: action.payload,
        currentPage: 1,
      }
    
    case 'SET_DATE_FILTER':
      return {
        ...state,
        dateFilter: action.payload,
        currentPage: 1,
      }
    
    case 'SET_CURRENT_PAGE':
      return {
        ...state,
        currentPage: action.payload,
      }
    
    case 'SET_LEADS_PER_PAGE':
      return {
        ...state,
        leadsPerPage: action.payload,
        currentPage: 1, // Reset para primeira página ao mudar quantidade
      }
    
    case 'SET_SELECTED_LEADS':
      return {
        ...state,
        selectedLeads: action.payload,
      }
    
    case 'ADD_SELECTED_LEAD':
      return {
        ...state,
        selectedLeads: state.selectedLeads.includes(action.payload)
          ? state.selectedLeads
          : [...state.selectedLeads, action.payload],
      }
    
    case 'REMOVE_SELECTED_LEAD':
      return {
        ...state,
        selectedLeads: state.selectedLeads.filter(id => id !== action.payload),
      }
    
    case 'SELECT_ALL_LEADS':
      return {
        ...state,
        selectedLeads: action.payload,
      }
    
    case 'CLEAR_SELECTED_LEADS':
      return {
        ...state,
        selectedLeads: [],
      }
    
    case 'FORCE_UPDATE':
      return {
        ...state,
        forceUpdate: state.forceUpdate + 1,
      }
    
    case 'RESET_FILTERS':
      return {
        ...state,
        searchTerm: '',
        sourceFilter: 'todos',
        campaignFilter: 'todos',
        dateFilter: {
          from: undefined,
          to: undefined,
        },
        currentPage: 1,
      }
    
    case 'RESET_PAGINATION':
      return {
        ...state,
        currentPage: 1,
      }
    
    case 'RESET_ALL':
      return initialState
    
    default:
      return state
  }
}

// Hook customizado
export function useLeadsPageState() {
  const [state, dispatch] = useReducer(leadsPageReducer, initialState)

  // Actions helpers
  const setSearchTerm = useCallback((searchTerm: string) => {
    dispatch({ type: 'SET_SEARCH_TERM', payload: searchTerm })
  }, [])

  const setSourceFilter = useCallback((sourceFilter: string) => {
    dispatch({ type: 'SET_SOURCE_FILTER', payload: sourceFilter })
  }, [])

  const setCampaignFilter = useCallback((campaignFilter: string) => {
    dispatch({ type: 'SET_CAMPAIGN_FILTER', payload: campaignFilter })
  }, [])

  const setDateFilter = useCallback((dateFilter: { from: Date | undefined; to: Date | undefined }) => {
    dispatch({ type: 'SET_DATE_FILTER', payload: dateFilter })
  }, [])

  const setCurrentPage = useCallback((page: number) => {
    dispatch({ type: 'SET_CURRENT_PAGE', payload: page })
  }, [])

  const setLeadsPerPage = useCallback((leadsPerPage: number) => {
    dispatch({ type: 'SET_LEADS_PER_PAGE', payload: leadsPerPage })
  }, [])

  const setSelectedLeads = useCallback((selectedLeads: number[]) => {
    dispatch({ type: 'SET_SELECTED_LEADS', payload: selectedLeads })
  }, [])

  const addSelectedLead = useCallback((leadId: number) => {
    dispatch({ type: 'ADD_SELECTED_LEAD', payload: leadId })
  }, [])

  const removeSelectedLead = useCallback((leadId: number) => {
    dispatch({ type: 'REMOVE_SELECTED_LEAD', payload: leadId })
  }, [])

  const selectAllLeads = useCallback((leadIds: number[]) => {
    dispatch({ type: 'SELECT_ALL_LEADS', payload: leadIds })
  }, [])

  const clearSelectedLeads = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTED_LEADS' })
  }, [])

  const forceUpdate = useCallback(() => {
    dispatch({ type: 'FORCE_UPDATE' })
  }, [])

  const resetFilters = useCallback(() => {
    dispatch({ type: 'RESET_FILTERS' })
  }, [])

  const resetPagination = useCallback(() => {
    dispatch({ type: 'RESET_PAGINATION' })
  }, [])

  const resetAll = useCallback(() => {
    dispatch({ type: 'RESET_ALL' })
  }, [])

  // Computed values
  const startIndex = (state.currentPage - 1) * state.leadsPerPage
  const endIndex = startIndex + state.leadsPerPage

  return {
    // State
    state,
    
    // Computed values
    startIndex,
    endIndex,
    
    // Actions
    setSearchTerm,
    setSourceFilter,
    setCampaignFilter,
    setDateFilter,
    setCurrentPage,
    setLeadsPerPage,
    setSelectedLeads,
    addSelectedLead,
    removeSelectedLead,
    selectAllLeads,
    clearSelectedLeads,
    forceUpdate,
    resetFilters,
    resetPagination,
    resetAll,
  }
}
