"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"

export function DebugRealtime() {
  const [status, setStatus] = useState<string>("Desconectado")
  const [logs, setLogs] = useState<string[]>([])
  const [testCount, setTestCount] = useState(0)
  const [realtimeStatus, setRealtimeStatus] = useState<string>("Desconhecido")
  const [pollingActive, setPollingActive] = useState<boolean>(false)
  const [pollingCount, setPollingCount] = useState<number>(0)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)])
  }

  useEffect(() => {
    addLog("🔧 Iniciando debug do real-time...")

    // Testar conexão com Supabase
    const testConnection = async () => {
      try {
        const { data, error } = await supabase
          .from('leads')
          .select('count')
          .limit(1)
        
        if (error) {
          addLog(`❌ Erro na conexão: ${error.message}`)
          setStatus("Erro de conexão")
        } else {
          addLog("✅ Conexão com Supabase OK")
          setStatus("Conectado")
        }
      } catch (err) {
        addLog(`❌ Erro inesperado: ${err}`)
        setStatus("Erro")
      }
    }

    testConnection()

    // Configurar real-time subscription
    addLog("📡 Configurando subscription...")
    
    const channel = supabase
      .channel('debug-leads')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads'
        },
        (payload) => {
          const newId = payload.new && typeof payload.new === 'object' && 'id' in payload.new ? payload.new.id : null
          const oldId = payload.old && typeof payload.old === 'object' && 'id' in payload.old ? payload.old.id : null
          addLog(`📡 Evento real-time: ${payload.eventType} - ID: ${newId || oldId}`)
        }
      )
      .subscribe((status) => {
        addLog(`📡 Status da subscription: ${status}`)
        setRealtimeStatus(status)
        if (status === 'SUBSCRIBED') {
          setStatus("Real-time ativo")
        } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
          addLog("⚠️ Real-time falhou, ativando polling...")
          setPollingActive(true)
          startPolling()
        }
      })

    // Polling como fallback
    let pollingInterval: NodeJS.Timeout | null = null
    let lastCheck = new Date()

    const startPolling = () => {
      addLog("🔄 Iniciando polling a cada 3 segundos...")
      setPollingActive(true)
      pollingInterval = setInterval(async () => {
        try {
          setPollingCount(prev => prev + 1)
          const { data, error } = await supabase
            .from('leads')
            .select('*')
            .gt('created_at', lastCheck.toISOString())
            .order('created_at', { ascending: false })

          if (error) {
            addLog(`❌ Erro no polling: ${error.message}`)
            return
          }

          if (data && data.length > 0) {
            addLog(`🔄 Polling encontrou ${data.length} novos leads`)
            lastCheck = new Date()
          }
        } catch (err) {
          addLog(`❌ Erro no polling: ${err}`)
        }
      }, 3000)
    }

    // Timeout para iniciar polling se real-time falhar
    const pollingTimeout = setTimeout(() => {
      if (realtimeStatus !== 'SUBSCRIBED') {
        addLog("⏰ Timeout do real-time, iniciando polling...")
        startPolling()
      }
    }, 5000)

    return () => {
      addLog("🧹 Limpando subscription e polling...")
      supabase.removeChannel(channel)
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
      clearTimeout(pollingTimeout)
    }
  }, [realtimeStatus])

  const testInsert = async () => {
    try {
      addLog("➕ Testando inserção...")
      const testLead = {
        name: `Teste Real-time ${testCount + 1}`,
        phone: `1199999${testCount.toString().padStart(4, '0')}`,
        gelid: `debug-${Date.now()}`,
        utm_source: "debug",
        utm_medium: "debug",
        utm_campaign: "debug",
        utm_term: "debug",
        utm_content: "debug",
        qualification_status: "novo",
        origem: "debug",
        comment: "Lead de teste para debug",
        beacon: false,
        status: "novo"
      }

      const { data, error } = await supabase
        .from('leads')
        .insert([testLead])
        .select()

      if (error) {
        addLog(`❌ Erro na inserção: ${error.message}`)
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive",
        })
      } else {
        addLog(`✅ Lead inserido: ${data?.[0]?.id}`)
        setTestCount(prev => prev + 1)
        toast({
          title: "Sucesso",
          description: "Lead de teste inserido. Verifique se o real-time funcionou.",
        })
      }
    } catch (err) {
      addLog(`❌ Erro inesperado: ${err}`)
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  const testManualPolling = async () => {
    try {
      addLog("🔄 Testando polling manual...")
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) {
        addLog(`❌ Erro no polling manual: ${error.message}`)
      } else {
        addLog(`✅ Polling manual OK - ${data?.length || 0} leads encontrados`)
      }
    } catch (err) {
      addLog(`❌ Erro no polling manual: ${err}`)
    }
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Debug Real-time</CardTitle>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              status === "Real-time ativo" ? "bg-green-500" : 
              status === "Conectado" ? "bg-yellow-500" : "bg-red-500"
            }`} />
            <span className="text-sm">{status}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Real-time:</span>
            <span className={`text-xs px-2 py-1 rounded ${
              realtimeStatus === 'SUBSCRIBED' ? 'bg-green-100 text-green-800' :
              realtimeStatus === 'CHANNEL_ERROR' || realtimeStatus === 'CLOSED' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {realtimeStatus}
            </span>
          </div>
          {pollingActive && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Polling:</span>
              <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                Ativo ({pollingCount})
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button onClick={testInsert} variant="outline">
            Testar Inserção
          </Button>
          <Button onClick={testManualPolling} variant="outline">
            Testar Polling
          </Button>
          <Button onClick={clearLogs} variant="outline">
            Limpar Logs
          </Button>
        </div>
        
        <div className="bg-gray-100 p-3 rounded-md max-h-96 overflow-y-auto">
          <div className="text-sm font-mono space-y-1">
            {logs.length === 0 ? (
              <div className="text-gray-500">Nenhum log ainda...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="text-xs">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="text-xs text-gray-500 space-y-1">
          <p>• <strong>Real-time:</strong> Atualização instantânea via WebSocket</p>
          <p>• <strong>Polling:</strong> Verificação a cada 3 segundos (fallback)</p>
          <p>• <strong>Status:</strong> Verde = funcionando, Amarelo = conectado mas sem real-time, Vermelho = erro</p>
          <p>• <strong>CLOSED:</strong> Real-time falhou, mas polling está ativo como fallback</p>
          <p>• Teste inserindo um lead e observe os logs para ver qual método está funcionando</p>
        </div>
      </CardContent>
    </Card>
  )
}
