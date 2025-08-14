import { useState, useEffect, useRef } from 'react'
import { supabase, Lead } from '@/lib/supabase'

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const lastFetchTime = useRef<Date>(new Date())
  const pollingInterval = useRef<NodeJS.Timeout | null>(null)

  // Buscar todos os leads
  const fetchLeads = async () => {
    try {
      setLoading(true)
      console.log('🔄 Buscando leads...')
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      console.log('✅ Leads carregados:', data?.length || 0)
      setLeads(data || [])
      lastFetchTime.current = new Date()
    } catch (err) {
      console.error('❌ Erro ao carregar leads:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar leads')
    } finally {
      setLoading(false)
    }
  }

  // Buscar apenas leads novos
  const fetchNewLeads = async () => {
    try {
      console.log('🔄 Verificando novos leads via polling...')
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .gt('created_at', lastFetchTime.current.toISOString())
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Erro ao buscar novos leads:', error)
        return
      }

      if (data && data.length > 0) {
        console.log('➕ Polling encontrou novos leads:', data.length)
        setLeads(prev => {
          const newLeads = [...data, ...prev]
          // Remover duplicatas baseado no ID
          const uniqueLeads = newLeads.filter((lead, index, self) => 
            index === self.findIndex(l => l.id === lead.id)
          )
          console.log('📊 Total de leads após polling:', uniqueLeads.length)
          return uniqueLeads
        })
        lastFetchTime.current = new Date()
      }
    } catch (err) {
      console.error('❌ Erro ao buscar novos leads:', err)
    }
  }

  // Adicionar novo lead
  const addLead = async (lead: Omit<Lead, 'id' | 'created_at'>) => {
    try {
      console.log('➕ Adicionando lead:', lead)
      const { data, error } = await supabase
        .from('leads')
        .insert([lead])
        .select()

      if (error) {
        throw error
      }

      console.log('✅ Lead adicionado:', data?.[0])
      return data?.[0]
    } catch (err) {
      console.error('❌ Erro ao adicionar lead:', err)
      setError(err instanceof Error ? err.message : 'Erro ao adicionar lead')
      throw err
    }
  }

  // Atualizar lead
  const updateLead = async (id: number, updates: Partial<Lead>) => {
    try {
      console.log('🔄 Atualizando lead:', id, 'com:', updates)
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()

      if (error) {
        throw error
      }

      console.log('✅ Lead atualizado:', data?.[0])
      
      // Atualizar estado local imediatamente
      setLeads(prev => prev.map(lead => 
        lead.id === id ? { ...lead, ...updates } : lead
      ))
      
      return data?.[0]
    } catch (err) {
      console.error('❌ Erro ao atualizar lead:', err)
      setError(err instanceof Error ? err.message : 'Erro ao atualizar lead')
      throw err
    }
  }

  // Deletar lead
  const deleteLead = async (id: number) => {
    try {
      console.log('🗑️ Deletando lead:', id)
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id)

      if (error) {
        throw error
      }

      console.log('✅ Lead deletado com sucesso')
      
      // Atualizar estado local imediatamente
      setLeads(prev => prev.filter(lead => lead.id !== id))
      
    } catch (err) {
      console.error('❌ Erro ao deletar lead:', err)
      setError(err instanceof Error ? err.message : 'Erro ao deletar lead')
      throw err
    }
  }

  // Deletar múltiplos leads
  const deleteMultipleLeads = async (ids: number[]) => {
    try {
      console.log('🗑️ Deletando múltiplos leads:', ids)
      const { error } = await supabase
        .from('leads')
        .delete()
        .in('id', ids)

      if (error) {
        throw error
      }

      console.log('✅ Leads deletados com sucesso')
      
      // Atualizar estado local imediatamente
      setLeads(prev => prev.filter(lead => !ids.includes(lead.id!)))
      
    } catch (err) {
      console.error('❌ Erro ao deletar leads:', err)
      setError(err instanceof Error ? err.message : 'Erro ao deletar leads')
      throw err
    }
  }

  // Iniciar polling
  const startPolling = () => {
    console.log('🔄 Iniciando polling automático...')
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current)
    }
    pollingInterval.current = setInterval(() => {
      console.log('🔄 Executando polling...')
      fetchNewLeads()
    }, 5000) // A cada 5 segundos para reduzir carga
  }

  useEffect(() => {
    console.log('🚀 Iniciando useLeads...')
    fetchLeads()
    
    // Iniciar polling imediatamente (sem tentar real-time)
    console.log('🚀 Usando polling para atualizações automáticas...')
    startPolling()

    // Cleanup
    return () => {
      console.log('🧹 Limpando polling...')
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current)
      }
    }
  }, [])

  return {
    leads,
    loading,
    error,
    fetchLeads,
    addLead,
    updateLead,
    deleteLead,
    deleteMultipleLeads,
  }
}
