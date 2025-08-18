"use client"

import { SidebarWrapper } from "@/components/sidebar-wrapper"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Target, BarChart3, FileText, ArrowRight, Database } from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard"


export default function DashboardPage() {
  return (
    <AuthGuard>
      <div className="flex h-screen bg-gray-50/50 overflow-hidden">
        <SidebarWrapper />
        <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Bem-vindo ao seu painel de controle de leads</p>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Link href="/leads">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Gerenciar Leads</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">Ver Todos</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Acesse sua tabela completa de leads
                  </p>
                  <div className="flex items-center mt-2">
                    <ArrowRight className="h-3 w-3 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/google-ads">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Google Ads</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">Configurar</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Gerencie suas campanhas do Google Ads
                  </p>
                  <div className="flex items-center mt-2">
                    <ArrowRight className="h-3 w-3 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/meta-ads">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Meta Ads</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">Configurar</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Gerencie suas campanhas do Meta Ads
                  </p>
                  <div className="flex items-center mt-2">
                    <ArrowRight className="h-3 w-3 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/analytics">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Analytics</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">Visualizar</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Análises e métricas detalhadas
                  </p>
                  <div className="flex items-center mt-2">
                    <ArrowRight className="h-3 w-3 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </Link>


          </div>

          {/* Additional Features */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Relatórios
                </CardTitle>
                <CardDescription>
                  Gere relatórios personalizados dos seus leads
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Acesse relatórios detalhados sobre performance, conversões e ROI das suas campanhas.
                </p>
                <Link href="/reports">
                  <Button variant="outline" className="w-full">
                    Acessar Relatórios
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Analytics Avançado
                </CardTitle>
                <CardDescription>
                  Métricas e insights em tempo real
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Visualize dados avançados sobre comportamento dos leads e performance das campanhas.
                </p>
                <Link href="/analytics">
                  <Button variant="outline" className="w-full">
                    Ver Analytics
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>


          </div>
        </div>
      </div>
    </div>
    </AuthGuard>
  )
}
