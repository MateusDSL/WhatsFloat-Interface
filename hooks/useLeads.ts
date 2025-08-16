import { useState, useEffect, useRef } from 'react'
import { supabase, Lead } from '@/lib/supabase'
import { useSettings } from '@/hooks/useSettings'

export function useLeads() {
  const { settings } = useSettings()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const lastFetchTime = useRef<Date>(new Date())
  const pollingInterval = useRef<NodeJS.Timeout | null>(null)

  // Buscar todos os leads
  const fetchLeads = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

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
        setLeads(prev => {
          const newLeads = [...data, ...prev]
          // Remover duplicatas baseado no ID
          const uniqueLeads = newLeads.filter((lead, index, self) => 
            index === self.findIndex(l => l.id === lead.id)
          )
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
      const { data, error } = await supabase
        .from('leads')
        .insert([lead])
        .select()

      if (error) {
        throw error
      }

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
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()

      if (error) {
        throw error
      }

      if (!data || data.length === 0) {
        throw new Error('Lead não encontrado')
      }

      const updatedLead = data[0]
      
      // Atualizar estado local imediatamente
      setLeads(prev => prev.map(lead => 
        lead.id === id ? { ...lead, ...updatedLead } : lead
      ))
      
      return updatedLead
    } catch (err) {
      console.error('❌ Erro ao atualizar lead:', err)
      setError(err instanceof Error ? err.message : 'Erro ao atualizar lead')
      throw err
    }
  }

  // Deletar lead
  const deleteLead = async (id: number) => {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id)

      if (error) {
        throw error
      }
      
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
      const { error } = await supabase
        .from('leads')
        .delete()
        .in('id', ids)

      if (error) {
        throw error
      }
      
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
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current)
    }
    
    // Usar intervalo fixo para polling (5 segundos)
    const interval = 5000
    
    if (interval > 0) {
      pollingInterval.current = setInterval(() => {
        fetchNewLeads()
      }, interval)
    }
  }

  useEffect(() => {
    fetchLeads()
    startPolling()

    // Cleanup
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current)
      }
    }
  }, [])

  // Polling sempre ativo com intervalo fixo de 5 segundos
  useEffect(() => {
    startPolling()
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
