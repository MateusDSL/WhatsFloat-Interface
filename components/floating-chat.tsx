"use client"

import React, { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { MessageCircle, X, Send, Bot, User, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface Message {
  id: string
  content: string
  isUser: boolean
  timestamp: Date
}

export function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Verificar se estamos na página de insights ou login
  const pathname = usePathname()
  
  const isInsightsPage = pathname === '/insights'
  const isLoginPage = pathname === '/login'
  
  // Debug
  console.log('FloatingChat - pathname:', pathname, 'isLoginPage:', isLoginPage)

  // Auto-scroll para a última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Focar no input quando abrir o chat
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      isUser: true,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: messages.map(msg => ({
            role: msg.isUser ? 'user' : 'assistant',
            content: msg.content
          }))
        })
      })

      if (!response.ok) {
        throw new Error('Erro na comunicação com a IA')
      }

      const data = await response.json()
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        isUser: false,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
        isUser: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  // Não renderizar na página de insights ou login
  if (isInsightsPage || isLoginPage) {
    console.log('FloatingChat - Não renderizando na página:', pathname)
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Botão flutuante */}
      {!isOpen && (
                 <Button
           onClick={() => setIsOpen(true)}
           size="lg"
           className="h-14 w-14 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 animate-bounce"
           style={{ animationDuration: '2s', animationIterationCount: 'infinite' }}
         >
           <Bot className="h-6 w-6" />
         </Button>
      )}

             {/* Chat modal */}
       {isOpen && (
         <Card className={`w-96 shadow-2xl border-0 bg-white/95 backdrop-blur-sm transition-all duration-300 ${
           isMinimized ? 'h-16' : 'h-[500px]'
         }`}>
          <CardHeader className="pb-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Bot className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-gray-900">
                    Assistente IA
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                    Online
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-1">
                                 <Button
                   variant="ghost"
                   size="sm"
                   onClick={() => setIsMinimized(!isMinimized)}
                   className="h-8 w-8 p-0 hover:bg-green-100"
                 >
                   {isMinimized ? <MessageCircle className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                 </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0 hover:bg-red-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 flex flex-col h-full">
                         {/* Área de mensagens */}
             <div className={`flex-1 overflow-y-auto p-5 space-y-4 ${isMinimized ? 'hidden' : ''}`}>
              {messages.length === 0 && (
                <div className="text-center py-6">
                  <div className="p-3 bg-green-100 rounded-full w-fit mx-auto mb-3">
                    <Bot className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Olá! Sou seu assistente IA.
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    Posso ajudar com análises de leads, campanhas e insights estratégicos.
                  </p>
                  
                  {/* Sugestões de perguntas */}
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 font-medium">Sugestões:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {[
                        "Qual campanha está performando melhor?",
                        "Quando chegam mais leads?",
                        "Quantos leads não são rastreados?",
                        "Qual o melhor horário para campanhas?"
                      ].map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setInputValue(suggestion)
                            setTimeout(() => handleSendMessage(), 100)
                          }}
                          className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-200 hover:bg-green-100 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                                     <div
                     className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                       message.isUser
                         ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                         : 'bg-gray-100 text-gray-900'
                     }`}
                   >
                    <div className="flex items-start gap-2">
                      {!message.isUser && (
                        <div className="p-1 bg-green-100 rounded-full mt-0.5">
                          <Bot className="h-3 w-3 text-green-600" />
                        </div>
                      )}
                                             <div className="flex-1">
                         <p className="text-base whitespace-pre-wrap leading-relaxed">{message.content}</p>
                         <p className={`text-xs mt-2 ${
                           message.isUser ? 'text-green-100' : 'text-gray-500'
                         }`}>
                           {formatTime(message.timestamp)}
                         </p>
                       </div>
                      {message.isUser && (
                        <div className="p-1 bg-white/20 rounded-full mt-0.5">
                          <User className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-green-100 rounded-full">
                        <Bot className="h-3 w-3 text-green-600" />
                      </div>
                      <div className="flex gap-1">
                        <Skeleton className="h-2 w-2 rounded-full bg-gray-300 animate-pulse" />
                        <Skeleton className="h-2 w-2 rounded-full bg-gray-300 animate-pulse" style={{ animationDelay: '0.1s' }} />
                        <Skeleton className="h-2 w-2 rounded-full bg-gray-300 animate-pulse" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

                         {/* Input area */}
             <div className={`p-5 border-t border-gray-100 bg-gray-50/50 ${isMinimized ? 'hidden' : ''}`}>
               <div className="flex gap-3">
                 <Input
                   ref={inputRef}
                   value={inputValue}
                   onChange={(e) => setInputValue(e.target.value)}
                   onKeyPress={handleKeyPress}
                   placeholder="Digite sua pergunta..."
                   className="flex-1 text-base border-gray-200 focus:border-green-500 focus:ring-green-500"
                   disabled={isLoading}
                 />
                                 <Button
                   onClick={handleSendMessage}
                   disabled={!inputValue.trim() || isLoading}
                   size="default"
                   className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-4"
                 >
                   <Send className="h-5 w-5" />
                 </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
