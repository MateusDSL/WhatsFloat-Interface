import { useState, useEffect, useRef } from 'react'
import { Lead } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'

// Função para tocar som de notificação
const playNotificationSound = () => {
  try {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT')
    audio.volume = 0.3
    audio.play().catch(() => {
      // Ignora erros de autoplay
    })
  } catch (error) {
    // Ignora erros de áudio
  }
}

export function useNotifications(leads: Lead[]) {
  const [notificationCount, setNotificationCount] = useState(0)
  const [notifications, setNotifications] = useState<Array<{
    id: string
    message: string
    timestamp: Date
    read: boolean
  }>>([])
  const processedLeads = useRef<Set<number>>(new Set())
  const isInitialized = useRef(false)

  console.log('🔔 useNotifications renderizado com', leads.length, 'leads')
  console.log('🔔 Leads IDs:', leads.map(l => l.id))
  console.log('🔔 Processados:', Array.from(processedLeads.current))

  useEffect(() => {
    console.log('🔔 useNotifications: leads atualizados', leads.length)
    
    // Filtrar leads válidos (com ID)
    const validLeads = leads.filter(lead => lead.id !== null && lead.id !== undefined)
    
    // Na primeira execução, marcar todos os leads existentes como processados
    if (!isInitialized.current && validLeads.length > 0) {
      console.log('🔔 Inicializando notificações com', validLeads.length, 'leads')
      validLeads.forEach(lead => processedLeads.current.add(lead.id!))
      isInitialized.current = true
      return
    }

    // Detectar novos leads
    const newLeads = validLeads.filter(lead => !processedLeads.current.has(lead.id!))
    
    console.log('🔔 Novos leads detectados:', newLeads.length)
    console.log('🔔 IDs dos novos leads:', newLeads.map(l => l.id))
    
    if (newLeads.length > 0) {
      // Processar novos leads
      newLeads.forEach(lead => {
        processedLeads.current.add(lead.id!)
        
        console.log('🔔 Processando novo lead:', lead.name, 'ID:', lead.id)
        
        const notification = {
          id: `lead-${lead.id}-${Date.now()}`,
          message: `Novo lead: ${lead.name}`,
          timestamp: new Date(lead.created_at),
          read: false
        }
        
        console.log('🔔 Criando notificação:', notification)
        
        setNotifications(prev => {
          const newNotifications = [notification, ...prev]
          // Manter apenas as 5 notificações mais recentes
          const result = newNotifications.slice(0, 5)
          console.log('🔔 Notificações atualizadas:', result.length)
          return result
        })
        
        setNotificationCount(prev => {
          const newCount = Math.min(prev + 1, 5)
          console.log('🔔 Contador de notificações atualizado:', newCount)
          return newCount
        })
        
        // Mostrar toast de notificação
        toast({
          title: "Novo Lead!",
          description: `Lead "${lead.name}" foi adicionado ao sistema.`,
          duration: 5000,
        })
        
        // Tocar som de notificação
        playNotificationSound()
      })
    }
  }, [leads])

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notification => ({ ...notification, read: true })))
    setNotificationCount(0)
  }

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => {
      const updatedNotifications = prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
      
      // Recalcular o contador baseado nas notificações não lidas
      const unreadCount = updatedNotifications.filter(n => !n.read).length
      setNotificationCount(Math.min(unreadCount, 5))
      
      return updatedNotifications
    })
  }

  const clearNotifications = () => {
    setNotifications([])
    setNotificationCount(0)
  }

  // Função de teste para adicionar notificação manual
  const addTestNotification = () => {
    const testNotification = {
      id: `test-${Date.now()}`,
      message: `Notificação de teste - ${new Date().toLocaleTimeString()}`,
      timestamp: new Date(),
      read: false
    }
    
    setNotifications(prev => {
      const newNotifications = [testNotification, ...prev]
      return newNotifications.slice(0, 5)
    })
    
    setNotificationCount(prev => Math.min(prev + 1, 5))
    
    toast({
      title: "Teste de Notificação!",
      description: "Esta é uma notificação de teste.",
      duration: 3000,
    })
    
    playNotificationSound()
  }

  return {
    notificationCount,
    notifications,
    markAllAsRead,
    markAsRead,
    clearNotifications,
    addTestNotification
  }
}
