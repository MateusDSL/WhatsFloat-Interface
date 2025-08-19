"use client"

import { AlertTriangle, RefreshCw, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ErrorStateProps {
  title?: string
  message: string
  retryCount?: number
  onRetry?: () => void
  showRetry?: boolean
  variant?: 'default' | 'network' | 'permission' | 'not-found'
  className?: string
}

export function ErrorState({
  title = "Algo deu errado",
  message,
  retryCount = 0,
  onRetry,
  showRetry = true,
  variant = 'default',
  className = ""
}: ErrorStateProps) {
  const getIcon = () => {
    switch (variant) {
      case 'network':
        return <WifiOff className="h-12 w-12 text-red-500" />
      case 'permission':
        return <AlertTriangle className="h-12 w-12 text-yellow-500" />
      case 'not-found':
        return <AlertTriangle className="h-12 w-12 text-blue-500" />
      default:
        return <AlertTriangle className="h-12 w-12 text-red-500" />
    }
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'network':
        return "bg-red-50 border-red-200"
      case 'permission':
        return "bg-yellow-50 border-yellow-200"
      case 'not-found':
        return "bg-blue-50 border-blue-200"
      default:
        return "bg-red-50 border-red-200"
    }
  }

  const getRetryMessage = () => {
    if (retryCount === 0) return "Tentar novamente"
    if (retryCount === 1) return "Tentar novamente (1ª tentativa)"
    return `Tentar novamente (${retryCount}ª tentativa)`
  }

  return (
    <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
      <Card className={`w-full max-w-md border-2 ${getVariantStyles()}`}>
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            {title}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {showRetry && onRetry && (
            <div className="flex flex-col gap-3">
              <Button 
                onClick={onRetry}
                className="w-full"
                variant={variant === 'network' ? 'destructive' : 'default'}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {getRetryMessage()}
              </Button>
              
              {retryCount > 2 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Múltiplas tentativas falharam. Verifique sua conexão ou tente novamente mais tarde.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          
          {variant === 'network' && (
            <div className="text-sm text-gray-500 space-y-2">
              <p className="font-medium">Possíveis soluções:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Verifique sua conexão com a internet</li>
                <li>Tente recarregar a página</li>
                <li>Verifique se o servidor está online</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Componente específico para erros de carregamento de leads
export function LeadsErrorState({
  error,
  retryCount,
  onRetry
}: {
  error: string
  retryCount: number
  onRetry: () => void
}) {
  // Detectar tipo de erro baseado na mensagem
  const getErrorVariant = (errorMessage: string): 'default' | 'network' | 'permission' | 'not-found' => {
    const lowerError = errorMessage.toLowerCase()
    
    if (lowerError.includes('network') || lowerError.includes('fetch') || lowerError.includes('connection')) {
      return 'network'
    }
    
    if (lowerError.includes('permission') || lowerError.includes('unauthorized') || lowerError.includes('forbidden')) {
      return 'permission'
    }
    
    if (lowerError.includes('not found') || lowerError.includes('404')) {
      return 'not-found'
    }
    
    return 'default'
  }

  const variant = getErrorVariant(error)
  
  return (
    <ErrorState
      title="Erro ao carregar leads"
      message={error}
      retryCount={retryCount}
      onRetry={onRetry}
      variant={variant}
      className="h-screen"
    />
  )
}
