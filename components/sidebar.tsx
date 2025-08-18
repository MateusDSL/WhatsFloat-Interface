"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import { SettingsModal } from "@/components/settings-modal"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Users,
  BarChart3,
  Settings,
  Target,
  TrendingUp,
  Bell,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Home,
  LogOut,
  Sparkles,
} from "lucide-react"

interface SidebarProps {
  className?: string
  notifications?: Array<{
    id: string
    message: string
    timestamp: Date
    read: boolean
  }>
  notificationCount?: number
  leadsCount?: number
  onMarkAsRead?: (id: string) => void
  onMarkAllAsRead?: () => void
  onClearNotifications?: () => void
  onLogout?: () => void
}

const menuItems = [
  {
    title: "Dashboard",
    icon: Home,
    href: "/",
    badge: null,
  },
  {
    title: "Leads",
    icon: Users,
    href: "/leads",
    badge: null,
  },
  {
    title: "Google Ads",
    icon: Target,
    href: "/google-ads",
    badge: null,
  },
  {
    title: "Meta Ads",
    icon: Target,
    href: "/meta-ads",
    badge: null,
  },

  {
    title: "Relatórios",
    icon: BarChart3,
    href: "/reports",
    badge: null,
  },
  {
    title: "Analytics",
    icon: TrendingUp,
    href: "/analytics",
    badge: null,
  },
  {
    title: "Insights (IA)",
    icon: Sparkles,
    href: "/insights",
    badge: "Beta",
  },
]

export function Sidebar({ 
  className, 
  notifications = [], 
  notificationCount = 0, 
  leadsCount = 0,
  onMarkAsRead, 
  onMarkAllAsRead, 
  onClearNotifications,
  onLogout
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <div
      className={cn(
        "relative flex flex-col bg-white border-r border-gray-200 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {!isCollapsed && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900">WhatsFloat</h2>
            <p className="text-xs text-gray-500">Gerenciamento de Leads</p>
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(!isCollapsed)} className="h-8 w-8 p-0">
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (item.href === "/" && pathname === "/")
            return (
              <Link key={item.title} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    isCollapsed ? "px-2" : "px-3",
                    isActive && "bg-green-600 text-white hover:bg-green-700",
                  )}
                  size="sm"
                >
                  <item.icon className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left">{item.title}</span>
                      {item.title === "Leads" && leadsCount > 0 && (
                        <Badge variant="secondary" className="ml-auto bg-white text-gray-900 border-gray-300 hover:bg-gray-50">
                          {leadsCount}
                        </Badge>
                      )}
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto">
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </Button>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t">
        {!isCollapsed ? (
          <div className="space-y-2">
            {!isCollapsed ? (
              <div className="w-full">
                <NotificationsDropdown
                  notifications={notifications}
                  notificationCount={notificationCount}
                  onMarkAsRead={onMarkAsRead || (() => {})}
                  onMarkAllAsRead={onMarkAllAsRead || (() => {})}
                  onClearAll={onClearNotifications || (() => {})}
                />
              </div>
            ) : (
              <NotificationsDropdown
                notifications={notifications}
                notificationCount={notificationCount}
                onMarkAsRead={onMarkAsRead || (() => {})}
                onMarkAllAsRead={onMarkAllAsRead || (() => {})}
                onClearAll={onClearNotifications || (() => {})}
              />
            )}
            <Button variant="ghost" size="sm" className="w-full justify-start text-gray-700">
              <HelpCircle className="h-4 w-4 mr-2" />
              Ajuda
            </Button>
            <SettingsModal>
              <Button variant="ghost" size="sm" className="w-full justify-start text-gray-700">
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </Button>
            </SettingsModal>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={onLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>

          </div>
        ) : (
          <div className="space-y-2">
            <Button variant="ghost" size="sm" className="w-full p-2">
              <HelpCircle className="h-4 w-4" />
            </Button>
            <SettingsModal>
              <Button variant="ghost" size="sm" className="w-full p-2">
                <Settings className="h-4 w-4" />
              </Button>
            </SettingsModal>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={onLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
