"use client"

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Send, Bot, User, Loader2, Sparkles, Lightbulb, TrendingUp, MapPin, Clock, BarChart3 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
}

// Sugestões de perguntas para ajudar o usuário
const questionSuggestions = [
  {
    icon: <TrendingUp className="w-4 h-4" />,
    text: "Qual campanha está performando melhor?",
    category: "Performance"
  },
  {
    icon: <Clock className="w-4 h-4" />,
    text: "Quando os leads chegam mais?",
    category: "Temporal"
  },
  {
    icon: <MapPin className="w-4 h-4" />,
    text: "De onde vêm os leads?",
    category: "Geográfica"
  },
  {
    icon: <BarChart3 className="w-4 h-4" />,
    text: "Como está a qualidade dos dados?",
    category: "Qualidade"
  },
  {
    icon: <Lightbulb className="w-4 h-4" />,
    text: "Que insights você pode me dar?",
    category: "Estratégico"
  },
  {
    icon: <Sparkles className="w-4 h-4" />,
    text: "Analise todos os dados para mim",
    category: "Geral"
  }
];

export function AiChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Efeito para rolar para a última mensagem
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', parts: [{ text: messageText }] };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText, history: messages }),
      });

      if (!response.ok) throw new Error('Falha ao obter resposta da IA.');

      const data = await response.json();
      const aiMessage: Message = { role: 'model', parts: [{ text: data.response }] };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      const errorMessage: Message = { 
        role: 'model', 
        parts: [{ text: 'Desculpe, não consegui processar sua solicitação. Tente novamente.' }] 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  return (
    <Card className="h-full flex flex-col border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
            <Bot className="w-6 h-6 text-white" />
          </div>
          Insights com IA
        </CardTitle>
        <CardDescription className="text-gray-600">
          Analise seus dados de leads com inteligência artificial. Peça análises específicas ou descubra insights automáticos.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col min-h-0">
        {/* Sugestões de perguntas */}
        {messages.length === 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-600" />
              Sugestões de perguntas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {questionSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion.text)}
                  className="flex items-center gap-2 p-3 text-left bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-green-300 transition-all duration-200 group"
                >
                  <div className="p-1 bg-gray-100 rounded group-hover:bg-green-100 transition-colors duration-200">
                    {suggestion.icon}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{suggestion.text}</div>
                    <div className="text-xs text-gray-500">{suggestion.category}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Área de mensagens */}
        <ScrollArea className="flex-1 mb-4 pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'model' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className={`rounded-xl p-4 max-w-lg shadow-sm ${
                  msg.role === 'model' 
                    ? 'bg-white border border-gray-200' 
                    : 'bg-gradient-to-br from-green-600 to-emerald-700 text-white'
                }`}>
                  <div className={`prose prose-sm max-w-none ${
                    msg.role === 'model' ? 'prose-gray' : 'prose-invert'
                  }`}>
                    <ReactMarkdown
                      components={{
                        h1: ({children}) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                        h2: ({children}) => <h2 className="text-base font-semibold mb-2">{children}</h2>,
                        h3: ({children}) => <h3 className="text-sm font-semibold mb-1">{children}</h3>,
                        ul: ({children}) => <ul className="list-disc list-inside space-y-1">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal list-inside space-y-1">{children}</ol>,
                        li: ({children}) => <li className="text-sm">{children}</li>,
                        p: ({children}) => <p className="text-sm mb-2 last:mb-0">{children}</p>,
                        strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                        em: ({children}) => <em className="italic">{children}</em>,
                        code: ({children}) => <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                        pre: ({children}) => <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{children}</pre>
                      }}
                    >
                      {msg.parts[0].text}
                    </ReactMarkdown>
                  </div>
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="rounded-xl p-4 bg-white border border-gray-200 shadow-sm flex items-center gap-3">
                  <Loader2 className="w-4 h-4 animate-spin text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Analisando dados...</p>
                    <p className="text-xs text-gray-500">Processando insights e tendências</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Formulário de entrada */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte-me sobre performance, tendências, qualidade dos dados..."
            disabled={isLoading}
            className="flex-1 border-gray-200 focus:border-green-500 focus:ring-green-500 transition-colors duration-200"
          />
          <Button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 transition-all duration-200 shadow-sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}