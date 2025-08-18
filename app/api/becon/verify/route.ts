import { NextResponse } from 'next/server';

// Interface para o corpo da requisição
interface VerifyRequest {
  phone: string;
}

export async function POST(request: Request) {
  try {
    const { phone }: VerifyRequest = await request.json();

    if (!phone) {
      return NextResponse.json({ error: 'Número de telefone é obrigatório' }, { status: 400 });
    }

    // Limpeza básica do número de telefone (remova caracteres não numéricos)
    const cleanPhone = phone.replace(/\D/g, '');

    // --- CHAMADA PARA A API EXTERNA DO BECON ---
    // Substitua com a URL real e o método de autenticação da API do BECON
    const beconApiUrl = `https://api.becon.com/v1/verify-phone`;
    const beconApiKey = process.env.BECON_API_KEY; // Armazene a chave no seu .env

    const response = await fetch(beconApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${beconApiKey}`, // Exemplo de autenticação
      },
      body: JSON.stringify({ phoneNumber: cleanPhone }),
    });

    if (!response.ok) {
      // Tenta extrair uma mensagem de erro da API do BECON
      const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido da API BECON' }));
      throw new Error(`Erro na API BECON: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    // ---------------------------------------------

    // Supondo que a API do BECON retorne um campo como `isRegistered`
    const isRegisteredInBecon = data.isRegistered || false;

    return NextResponse.json({
      phone: cleanPhone,
      isRegistered: isRegisteredInBecon,
    });

  } catch (error) {
    console.error('❌ Erro na verificação do BECON:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

