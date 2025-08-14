"use client"

import { useRouter } from "next/navigation"
import { Sidebar } from "./sidebar"
import { useNotifications } from "@/hooks/useNotifications"
import { useLeads } from "@/hooks/useLeads"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "@/hooks/use-toast"

export function SidebarWrapper() {
  const { leads } = useLeads()
  const { signOut } = useAuth()
  const router = useRouter()
  const { 
    notificationCount, 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    clearNotifications
  } = useNotifications(leads)

  const handleLogout = async () => {
    try {
      const { error } = await signOut()
      if (error) {
        toast({
          title: "Erro ao sair",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Logout realizado",
          description: "Você foi desconectado com sucesso.",
        })
        router.push("/login")
      }
    } catch (error) {
      toast({
        title: "Erro ao sair",
        description: "Erro inesperado ao fazer logout.",
        variant: "destructive",
      })
    }
  }

  return (
    <Sidebar 
      notifications={notifications}
      notificationCount={notificationCount}
      leadsCount={leads.length}
      onMarkAsRead={markAsRead}
      onMarkAllAsRead={markAllAsRead}
      onClearNotifications={clearNotifications}
      onLogout={handleLogout}
    />
  )
}
