// Script para testar configuração do real-time
const { createClient } = require('@supabase/supabase-js')

// Carregar variáveis de ambiente
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔧 Testando configuração do Supabase...')
console.log('URL:', supabaseUrl ? '✅ Configurada' : '❌ Não configurada')
console.log('Key:', supabaseAnonKey ? '✅ Configurada' : '❌ Não configurada')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não configuradas!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

async function testRealtime() {
  console.log('\n🧪 Testando real-time...')

  try {
    // 1. Testar conexão básica
    console.log('1️⃣ Testando conexão básica...')
    const { data: testData, error: testError } = await supabase
      .from('leads')
      .select('count')
      .limit(1)

    if (testError) {
      console.error('❌ Erro na conexão:', testError.message)
      return
    }
    console.log('✅ Conexão básica OK')

    // 2. Configurar subscription
    console.log('2️⃣ Configurando subscription...')
    const channel = supabase
      .channel('test-leads')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads'
        },
        (payload) => {
          console.log('📡 Evento recebido:', payload.eventType, payload.new?.id || payload.old?.id)
        }
      )
      .subscribe((status) => {
        console.log('📡 Status da subscription:', status)
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscription ativa!')
          
          // 3. Testar inserção
          setTimeout(async () => {
            console.log('3️⃣ Testando inserção...')
            const testLead = {
              name: 'Teste Script',
              phone: '11999999999',
              gelid: `script-${Date.now()}`,
              utm_source: 'script',
              utm_medium: 'script',
              utm_campaign: 'script',
              utm_term: 'script',
              utm_content: 'script',
              qualification_status: 'novo',
              origem: 'script',
              comment: 'Teste via script',
              beacon: false,
              status: 'novo'
            }

            const { data, error } = await supabase
              .from('leads')
              .insert([testLead])
              .select()

            if (error) {
              console.error('❌ Erro na inserção:', error.message)
            } else {
              console.log('✅ Lead inserido:', data?.[0]?.id)
              console.log('⏳ Aguardando evento real-time...')
              
              // Aguardar 5 segundos para ver se o evento chega
              setTimeout(() => {
                console.log('🏁 Teste concluído!')
                process.exit(0)
              }, 5000)
            }
          }, 2000)
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Erro na subscription')
          process.exit(1)
        }
      })

  } catch (error) {
    console.error('❌ Erro inesperado:', error)
    process.exit(1)
  }
}

testRealtime()
