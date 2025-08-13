"use client"

import { SidebarWrapper } from "@/components/sidebar-wrapper"
import { AuthGuard } from "@/components/auth-guard"

export default function MetaAdsPage() {
  return (
    <AuthGuard>
      <div className="flex h-screen bg-gray-50/50 overflow-hidden">
        <SidebarWrapper />
        <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl font-bold text-gray-300 mb-4">🚧</div>
          <h1 className="text-3xl font-bold text-gray-700 mb-2">Meta Ads</h1>
          <p className="text-xl text-gray-500">EM CONSTRUÇÃO</p>
          <p className="text-sm text-gray-400 mt-2">Esta página estará disponível em breve</p>
        </div>
      </div>
    </div>
    </AuthGuard>
  )
}
