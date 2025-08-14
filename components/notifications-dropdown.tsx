"use client"

import { useState } from "react"
import { Bell, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Notification {
  id: string
  message: string
  timestamp: Date
  read: boolean
}

interface NotificationsDropdownProps {
  notifications: Notification[]
  notificationCount: number
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onClearAll: () => void
}

export function NotificationsDropdown({
  notifications,
  notificationCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
}: NotificationsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  console.log('🔔 NotificationsDropdown renderizado:', { notificationCount, notificationsLength: notifications.length })

  const handleMarkAsRead = (id: string) => {
    onMarkAsRead(id)
  }

  const handleMarkAllAsRead = () => {
    onMarkAllAsRead()
    setIsOpen(false)
  }

  const handleClearAll = () => {
    onClearAll()
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start text-gray-700 relative">
          <Bell className="h-4 w-4 mr-2" />
          <span className="flex-1 text-left">Notificações</span>
                     {notificationCount > 0 && (
             <Badge variant="destructive" className="ml-auto">
               {notificationCount >= 5 ? '5+' : notificationCount}
             </Badge>
           )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-2">
          <h3 className="font-semibold">Notificações</h3>
          <div className="flex items-center gap-1">
            {notificationCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="h-6 px-2 text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                Marcar todas
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
              >
                <X className="h-3 w-3 mr-1" />
                Limpar
              </Button>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        
                 {notifications.length === 0 ? (
           <div className="p-4 text-center text-gray-500">
             <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
             <p className="text-sm">Nenhuma notificação</p>
           </div>
         ) : (
           <div className="max-h-64 overflow-y-auto">
             {notifications.length >= 5 && (
               <div className="p-2 text-center text-xs text-gray-500 bg-gray-50 border-b">
                 Mostrando as 5 notificações mais recentes
               </div>
             )}
             {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`p-3 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
                onClick={() => handleMarkAsRead(notification.id)}
              >
                <div className="flex items-start justify-between w-full">
                  <div className="flex-1">
                    <p className={`text-sm ${!notification.read ? 'font-medium' : ''}`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(notification.timestamp, { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 flex-shrink-0" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
