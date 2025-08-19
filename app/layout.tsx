import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/theme-provider'
import { FloatingChat } from '@/components/floating-chat'

export const metadata: Metadata = {
  title: 'Leads Database - WhatsFloat',
  description: 'Sistema de gerenciamento de leads da WhatsFloat',
  generator: 'Next.js',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className={GeistSans.className}>
        <ThemeProvider defaultTheme="system" storageKey="app-theme">
          {children}
          <Toaster />
          <FloatingChat />
        </ThemeProvider>
      </body>
    </html>
  )
}
