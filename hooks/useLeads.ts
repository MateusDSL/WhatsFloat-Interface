import { useState, useEffect, useRef } from 'react'
import { supabase, Lead } from '@/lib/supabase'
import { useSettings } from '@/hooks/useSettings'
import { useToast } from '@/hooks/use-toast'

export interface UseLeadsResult {
  leads: Lead[]
  loading: boolean
  error: string | null
  retryCount: number
  fetchLeads: () => Promise<void>
  addLead: (lead: Omit<Lead, 'id' | 'created_at'>) => Promise<Lead | undefined>
  updateLead: (id: number, updates: Partial<Lead>) => Promise<Lead>
  deleteLead: (id: number) => Promise<void>
  deleteMultipleLeads: (ids: number[]) => Promise<void>
  verifyAndUpdateBecon: (leadId: number) => Promise<Lead | undefined>
}

export function useLeads(): UseLeadsResult {
  const { settings } = useSettings()
  const { toast } = useToast()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const lastFetchTime = useRef<Date>(new Date())
  const pollingInterval = useRef<NodeJS.Timeout | null>(null)

  // Buscar todos os leads
  const fetchLeads = async () => {
    try {
      setLoading(true)
      setError(null) // Limpar erro anterior
      
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      setLeads(data || [])
      lastFetchTime.current = new Date()
      setRetryCount(0) // Reset retry count on success
    } catch (err) {
      console.error('❌ Erro ao carregar leads:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar leads'
      setError(errorMessage)
      setRetryCount(prev => prev + 1)
      
      // Mostrar toast de erro
      toast({
        title: "Erro ao carregar leads",
        description: errorMessage,
        variant: "destructive",
      })
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
      const errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar lead'
      setError(errorMessage)
      
      // Mostrar toast de erro
      toast({
        title: "Erro ao adicionar lead",
        description: errorMessage,
        variant: "destructive",
      })
      
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
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar lead'
      setError(errorMessage)
      
      // Mostrar toast de erro
      toast({
        title: "Erro ao atualizar lead",
        description: errorMessage,
        variant: "destructive",
      })
      
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
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar lead'
      setError(errorMessage)
      
      // Mostrar toast de erro
      toast({
        title: "Erro ao deletar lead",
        description: errorMessage,
        variant: "destructive",
      })
      
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
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar leads'
      setError(errorMessage)
      
      // Mostrar toast de erro
      toast({
        title: "Erro ao deletar leads",
        description: errorMessage,
        variant: "destructive",
      })
      
      throw err
    }
  }

  // Nova função para verificar e atualizar o Becon de um lead
  const verifyAndUpdateBecon = async (leadId: number) => {
    try {
      const lead = leads.find(l => l.id === leadId);
      if (!lead || !lead.phone) {
        throw new Error('Lead ou número de telefone não encontrado.');
      }

      // 1. Chamar sua nova API route
      const response = await fetch('/api/becon/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: lead.phone }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Falha ao verificar o Becon.');
      }

      // 2. Chamar a função updateLead para salvar o resultado no Supabase
      const updatedLead = await updateLead(leadId, { is_becon: result.isRegistered });

      if (updatedLead) {
        toast({
          title: "Verificação Concluída",
          description: `O lead "${lead.name}" foi verificado. Status do Becon: ${result.isRegistered ? "Registrado" : "Não Registrado"}.`,
          variant: "success",
        });
      }

      return updatedLead;

    } catch (err) {
      console.error('❌ Erro ao verificar Becon:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido.';
      toast({
        title: "Erro na Verificação",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

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
    retryCount,
    fetchLeads,
    addLead,
    updateLead,
    deleteLead,
    deleteMultipleLeads,
    verifyAndUpdateBecon,
  }
}
