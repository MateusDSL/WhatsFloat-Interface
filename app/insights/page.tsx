"use client"

import React from 'react';
import { SidebarWrapper } from "@/components/sidebar-wrapper";
import { AuthGuard } from "@/components/auth-guard";
import { AiChat } from "@/components/ai-chat";

export default function InsightsPage() {
  return (
    <AuthGuard>
      <div className="flex h-screen bg-gray-50/50 overflow-hidden">
        <SidebarWrapper />
        <div className="flex-1 p-4 lg:p-6">
          <AiChat />
        </div>
      </div>
    </AuthGuard>
  );
}
