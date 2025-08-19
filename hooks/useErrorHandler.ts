import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

interface ErrorState {
  message: string
  type: 'error' | 'warning' | 'info'
  retryCount: number
  timestamp: Date
}

export function useErrorHandler() {
  const { toast } = useToast()
  const [errors, setErrors] = useState<ErrorState[]>([])
  const [isError, setIsError] = useState(false)

  const handleError = useCallback((
    error: unknown, 
    context: string, 
    showToast: boolean = true,
    retryAction?: () => void
  ) => {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const timestamp = new Date()
    
    const errorState: ErrorState = {
      message: errorMessage,
      type: 'error',
      retryCount: 0,
      timestamp
    }

    setErrors(prev => [...prev, errorState])
    setIsError(true)

    console.error(`❌ ${context}:`, error)

    if (showToast) {
      toast({
        title: `Erro: ${context}`,
        description: errorMessage,
        variant: "destructive",
      })
    }

    return errorState
  }, [toast])

  const clearError = useCallback((index?: number) => {
    if (index !== undefined) {
      setErrors(prev => prev.filter((_, i) => i !== index))
    } else {
      setErrors([])
      setIsError(false)
    }
  }, [])

  const retryAction = useCallback((action: () => void, context: string) => {
    try {
      action()
      clearError()
    } catch (error) {
      handleError(error, `${context} (tentativa de retry)`, true)
    }
  }, [handleError, clearError])

  const getLatestError = useCallback(() => {
    return errors[errors.length - 1]
  }, [errors])

  const getErrorCount = useCallback(() => {
    return errors.length
  }, [errors])

  return {
    errors,
    isError,
    handleError,
    clearError,
    retryAction,
    getLatestError,
    getErrorCount
  }
}

// Hook específico para operações de leads
export function useLeadsErrorHandler() {
  const { handleError, clearError, retryAction, ...errorState } = useErrorHandler()

  const handleLeadsError = useCallback((
    error: unknown, 
    operation: 'carregar' | 'adicionar' | 'atualizar' | 'deletar' | 'verificar',
    showToast: boolean = true
  ) => {
    const context = `Erro ao ${operation} leads`
    return handleError(error, context, showToast)
  }, [handleError])

  const retryLeadsOperation = useCallback((
    action: () => void, 
    operation: 'carregar' | 'adicionar' | 'atualizar' | 'deletar' | 'verificar'
  ) => {
    retryAction(action, `Operação de ${operation} leads`)
  }, [retryAction])

  return {
    ...errorState,
    handleLeadsError,
    retryLeadsOperation,
    clearError
  }
}
