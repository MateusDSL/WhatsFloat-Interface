import { useState, useEffect, useRef } from 'react'
import React from 'react'
import { Lead } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'
import { useSettings } from '@/hooks/useSettings'
import { useDesktopNotifications } from '@/hooks/useDesktopNotifications'
import { useAudio } from '@/hooks/useAudio'

// Hook para gerenciar áudio de notificação
const useNotificationAudio = () => {
  const { play: playNotificationSound, loadAudio } = useAudio('/notification-sound.mp3')
  
  // Carregar o áudio quando o hook for inicializado
  React.useEffect(() => {
    loadAudio()
  }, [loadAudio])
  
  return { playNotificationSound }
}

export function useNotifications(leads: Lead[]) {
  const { settings } = useSettings()
  const { showNotification } = useDesktopNotifications()
  const { playNotificationSound } = useNotificationAudio()
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
        
                 // Mostrar toast de notificação apenas se habilitado
         if (settings.notifications.enabled) {
           toast({
             title: "Novo Lead!",
             description: `Lead "${lead.name}" foi adicionado ao sistema.`,
             duration: 5000,
           })
           
           // Mostrar notificação desktop se habilitada
           if (settings.notifications.desktop) {
             showNotification("Novo Lead!", {
               body: `Lead "${lead.name}" foi adicionado ao sistema.`,
               tag: `lead-${lead.id}`,
               requireInteraction: false
             })
           }
           
           // Tocar som de notificação apenas se habilitado
           if (settings.notifications.sound) {
             playNotificationSound()
           }
         }
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



  return {
    notificationCount,
    notifications,
    markAllAsRead,
    markAsRead,
    clearNotifications
  }
}
