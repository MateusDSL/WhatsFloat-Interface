"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Lock, Mail, Loader2, User, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "@/hooks/use-toast"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  
  const { signIn } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!email || !password) {
      setError("Por favor, preencha todos os campos")
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await signIn(email, password)
      
      if (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
        setError(errorMessage)
        toast({
          title: "Erro no login",
          description: errorMessage,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Login realizado com sucesso",
          description: "Bem-vindo ao sistema!",
        })
        router.push("/leads")
      }
    } catch (err) {
      setError("Erro inesperado. Tente novamente.")
      toast({
        title: "Erro no login",
        description: "Erro inesperado. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          {/* Left Section - Login Form */}
          <div className="flex-1 p-8 lg:p-12 relative">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full -translate-x-16 -translate-y-16 opacity-60"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-100 to-green-100 rounded-full -translate-x-12 translate-y-12 opacity-60"></div>
            
            <div className="relative z-10">
              {/* Header */}
              <div className="mb-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-3">
                  LOGIN
                </h1>
                <p className="text-gray-600 text-lg">
                  Digite suas credenciais para acessar o sistema
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Username Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email
                  </Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Digite seu email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-12 h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-0 focus:ring-offset-0 rounded-xl text-base"
                      style={{ outline: 'none', boxShadow: 'none' }}
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Digite sua senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-12 pr-12 h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-0 focus:ring-offset-0 rounded-xl text-base"
                      style={{ outline: 'none', boxShadow: 'none' }}
                      disabled={isLoading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-700">{error}</AlertDescription>
                  </Alert>
                )}

                {/* Login Button */}
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl text-base shadow-lg hover:shadow-xl transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                                         "Entrar"
                  )}
                </Button>

                
              </form>
            </div>
          </div>

          {/* Right Section - Visual/Promotional */}
          <div className="flex-1 bg-gradient-to-br from-green-600 to-emerald-700 relative overflow-hidden min-h-[400px] lg:min-h-0">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-green-500 rounded-full translate-x-20 -translate-y-20 opacity-30"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-emerald-400 rounded-full translate-x-16 translate-y-16 opacity-30"></div>
            
            {/* Wavy patterns */}
            <div className="absolute inset-0 opacity-20">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path
                  d="M0,50 Q25,30 50,50 T100,50 L100,100 L0,100 Z"
                  fill="currentColor"
                  className="text-green-700"
                />
                <path
                  d="M0,60 Q25,40 50,60 T100,60 L100,100 L0,100 Z"
                  fill="currentColor"
                  className="text-green-600"
                />
              </svg>
            </div>

            {/* Central content */}
            <div className="relative z-10 flex items-center justify-center h-full p-12">
              <div className="text-center">
                {/* Lightning badge */}
                <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-lg mb-8">
                  <Zap className="w-6 h-6 text-yellow-500" />
                </div>
                
                                 {/* Main image placeholder */}
                 <div className="relative mx-auto w-48 h-60 lg:w-64 lg:h-80 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30 shadow-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                  
                                     {/* Placeholder for woman image */}
                   <div className="relative h-full flex items-center justify-center">
                     <div className="w-24 h-24 lg:w-32 lg:h-32 bg-white/30 rounded-full flex items-center justify-center">
                       <User className="w-12 h-12 lg:w-16 lg:h-16 text-white/70" />
                     </div>
                   </div>
                  
                  {/* Decorative elements */}
                  <div className="absolute top-4 left-4 w-3 h-3 bg-white/50 rounded-full"></div>
                  <div className="absolute top-8 right-6 w-2 h-2 bg-white/40 rounded-full"></div>
                  <div className="absolute bottom-6 left-6 w-4 h-4 bg-white/30 rounded-full"></div>
                </div>
                
                {/* Text overlay */}
                                 <div className="mt-8 text-white">
                   <h3 className="text-xl font-semibold mb-2">Bem-vindo de volta!</h3>
                                     <p className="text-green-100 text-sm">
                    Acesse seu painel e gerencie suas campanhas
                  </p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
