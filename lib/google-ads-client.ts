import { GoogleAdsApi } from 'google-ads-api';

// Cache para evitar múltiplas inicializações do cliente
let googleAdsClient: GoogleAdsApi | null = null;

// Interface para as variáveis de ambiente necessárias
interface GoogleAdsEnvVars {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_DEVELOPER_TOKEN: string;
  GOOGLE_REFRESH_TOKEN: string;
  GOOGLE_LOGIN_CUSTOMER_ID: string;
  GOOGLE_CUSTOMER_ID?: string;
}

// Função para validar e obter variáveis de ambiente
function getGoogleAdsEnvVars(): GoogleAdsEnvVars {
  const requiredEnvVars = {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_DEVELOPER_TOKEN: process.env.GOOGLE_DEVELOPER_TOKEN,
    GOOGLE_REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN,
    GOOGLE_LOGIN_CUSTOMER_ID: process.env.GOOGLE_LOGIN_CUSTOMER_ID,
  };

  // Verifica se todas as variáveis obrigatórias estão presentes
  const missingVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(`Variáveis de ambiente ausentes: ${missingVars.join(', ')}`);
  }

  return {
    ...requiredEnvVars,
    GOOGLE_CUSTOMER_ID: process.env.GOOGLE_CUSTOMER_ID,
  } as GoogleAdsEnvVars;
}

// Função para inicializar o cliente Google Ads
export function initializeGoogleAdsClient(): GoogleAdsApi {
  if (!googleAdsClient) {
    const envVars = getGoogleAdsEnvVars();

    googleAdsClient = new GoogleAdsApi({
      client_id: envVars.GOOGLE_CLIENT_ID,
      client_secret: envVars.GOOGLE_CLIENT_SECRET,
      developer_token: envVars.GOOGLE_DEVELOPER_TOKEN,
    });
  }

  return googleAdsClient;
}

// Função para obter uma instância do customer
export function getGoogleAdsCustomer(customerId?: string) {
  const client = initializeGoogleAdsClient();
  const envVars = getGoogleAdsEnvVars();

  return client.Customer({
    customer_id: customerId || envVars.GOOGLE_CUSTOMER_ID || 'ID_DA_CONTA_ALVO',
    login_customer_id: envVars.GOOGLE_LOGIN_CUSTOMER_ID,
    refresh_token: envVars.GOOGLE_REFRESH_TOKEN,
  });
}

// Função para validar se o cliente está configurado
export function isGoogleAdsConfigured(): boolean {
  try {
    getGoogleAdsEnvVars();
    return true;
  } catch {
    return false;
  }
}

// Função para obter informações de configuração (sem expor tokens)
export function getGoogleAdsConfigInfo() {
  try {
    const envVars = getGoogleAdsEnvVars();
    return {
      isConfigured: true,
      hasCustomerId: !!envVars.GOOGLE_CUSTOMER_ID,
      loginCustomerId: envVars.GOOGLE_LOGIN_CUSTOMER_ID,
    };
  } catch (error) {
    return {
      isConfigured: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}
