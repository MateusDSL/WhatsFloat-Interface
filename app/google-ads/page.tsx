"use client"

import { SidebarWrapper } from "@/components/sidebar-wrapper"
import { AuthGuard } from "@/components/auth-guard"
import { GoogleAdsDashboard } from "@/components/google-ads-dashboard"

export default function GoogleAdsPage() {
  return (
    <AuthGuard>
      <div className="flex h-screen bg-gray-50/50 overflow-hidden">
        <SidebarWrapper />
        <div className="flex-1 flex flex-col overflow-hidden">
          <GoogleAdsDashboard customerId={process.env.NEXT_PUBLIC_GOOGLE_CUSTOMER_ID} />
        </div>
      </div>
    </AuthGuard>
  )
}
