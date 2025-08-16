# Melhorias nas API Routes do Google Ads

## Resumo das Implementações

Este documento descreve as melhorias implementadas nas API routes do Google Ads para aumentar a segurança, manutenibilidade e robustez do código.

## 1. Validação de Entradas com Zod

### Problema Identificado
- Falta de validação dos parâmetros de entrada nas API routes
- Possibilidade de receber dados malformados ou inválidos
- Ausência de mensagens de erro claras para o usuário

### Solução Implementada

#### Schemas de Validação (`lib/validation-schemas.ts`)

```typescript
// Validação de datas (formato YYYY-MM-DD)
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: 'Data deve estar no formato YYYY-MM-DD'
});

// Validação de customer ID
const customerIdSchema = z.string().optional().refine((id) => {
  if (!id) return true;
  return /^\d{10,11}$/.test(id); // Google Ads customer IDs têm 10-11 dígitos
}, {
  message: 'Customer ID deve ter 10-11 dígitos numéricos'
});

// Schema principal para queries do Google Ads
export const googleAdsQuerySchema = z.object({
  customerId: customerIdSchema,
  dateFrom: dateSchema.optional(),
  dateTo: dateSchema.optional(),
  type: z.enum(['campaigns', 'ads', 'keywords', 'chart-data', 'demographics', 'devices', 'location']).optional(),
}).refine((data) => {
  // Validações customizadas
  if (data.dateFrom && !data.dateTo) return false;
  if (data.dateTo && !data.dateFrom) return false;
  return true;
}, {
  message: 'Ambas as datas (dateFrom e dateTo) devem ser fornecidas juntas'
});
```

#### Funções Helper

```typescript
// Validar parâmetros de URL
export function validateUrlParams<T extends z.ZodType>(
  schema: T,
  searchParams: URLSearchParams
): z.infer<T>

// Validar body de requisição
export function validateRequestBody<T extends z.ZodType>(
  schema: T,
  body: any
): z.infer<T>

// Formatar erros de validação
export function formatValidationErrors(error: z.ZodError): string[]
```

### Benefícios
- **Segurança**: Previne injeção de dados maliciosos
- **Robustez**: Garante que apenas dados válidos sejam processados
- **UX**: Mensagens de erro claras e específicas
- **Manutenibilidade**: Schemas centralizados e reutilizáveis

## 2. Refatoração do Código de Autenticação

### Problema Identificado
- Código de autenticação duplicado em todas as API routes
- Dificuldade de manutenção e atualização
- Falta de centralização da lógica de configuração

### Solução Implementada

#### Helper Centralizado (`lib/google-ads-client.ts`)

```typescript
// Cache para evitar múltiplas inicializações
let googleAdsClient: GoogleAdsApi | null = null;

// Função para inicializar o cliente
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

// Função para obter customer
export function getGoogleAdsCustomer(customerId?: string) {
  const client = initializeGoogleAdsClient();
  const envVars = getGoogleAdsEnvVars();
  
  return client.Customer({
    customer_id: customerId || envVars.GOOGLE_CUSTOMER_ID || 'ID_DA_CONTA_ALVO',
    login_customer_id: envVars.GOOGLE_LOGIN_CUSTOMER_ID,
    refresh_token: envVars.GOOGLE_REFRESH_TOKEN,
  });
}
```

### Benefícios
- **DRY Principle**: Elimina duplicação de código
- **Manutenibilidade**: Mudanças centralizadas
- **Performance**: Cache do cliente evita reinicializações
- **Consistência**: Comportamento uniforme em todas as routes

## 3. API Routes Refatoradas

### Routes Atualizadas

1. **`/api/google-ads/chart-data`**
   - Validação com `chartDataQuerySchema`
   - Uso do helper `getGoogleAdsCustomer`

2. **`/api/google-ads/campaigns`**
   - Validação com `campaignsQuerySchema`
   - Validação de body com `customQuerySchema`
   - Uso do helper `getGoogleAdsCustomer`

3. **`/api/google-ads/demographics`**
   - Validação com `demographicsQuerySchema`

4. **`/api/google-ads/devices`**
   - Validação com `devicesQuerySchema`


   

### Exemplo de Implementação

```typescript
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Validar parâmetros de entrada
    let validatedParams;
    try {
      validatedParams = validateUrlParams(chartDataQuerySchema, searchParams);
    } catch (error) {
      if (error instanceof Error) {
        return NextResponse.json(
          { 
            error: 'Parâmetros inválidos',
            details: formatValidationErrors(error as any),
            help: 'Verifique os parâmetros da requisição'
          },
          { status: 400 }
        );
      }
      throw error;
    }

    const { customerId, dateFrom, dateTo } = validatedParams;
    const data = await getChartData(customerId, dateFrom, dateTo);
    
    // ... resto da lógica
  } catch (error) {
    // Tratamento de erros melhorado
  }
}
```

## 4. Tratamento de Erros Melhorado

### Novos Tipos de Erro

1. **Erros de Validação (400)**
   - Parâmetros inválidos
   - Formato de data incorreto
   - Customer ID malformado

2. **Erros de Autenticação (401)**
   - Credenciais inválidas
   - Token expirado

3. **Erros de Configuração (500)**
   - Variáveis de ambiente ausentes
   - Configuração incompleta

4. **Erros de Query GAQL (400)**
   - Queries inválidas
   - Filtros não suportados

### Estrutura de Resposta de Erro

```typescript
{
  error: 'Descrição do erro',
  details: ['Lista de erros específicos'],
  help: 'Sugestão de como resolver'
}
```

## 5. Benefícios Gerais

### Segurança
- Validação rigorosa de entradas
- Prevenção de injeção de dados maliciosos
- Sanitização de parâmetros

### Performance
- Cache do cliente Google Ads
- Validação rápida com Zod
- Redução de chamadas desnecessárias

### Manutenibilidade
- Código centralizado e reutilizável
- Schemas bem definidos
- Tratamento de erros consistente

### Experiência do Desenvolvedor
- Mensagens de erro claras
- Documentação inline
- Tipagem TypeScript completa

## 6. Próximos Passos

### Melhorias Futuras Sugeridas

1. **Rate Limiting**
   - Implementar limitação de requisições por IP
   - Proteção contra abuso da API

2. **Logging Estruturado**
   - Logs detalhados para debugging
   - Monitoramento de performance

3. **Cache Inteligente**
   - Cache baseado em parâmetros
   - Invalidação automática

4. **Testes Automatizados**
   - Testes unitários para validação
   - Testes de integração para APIs

5. **Documentação da API**
   - OpenAPI/Swagger
   - Exemplos de uso

## 7. Como Usar

### Exemplo de Requisição Válida

```typescript
// Requisição válida
const response = await fetch('/api/google-ads/chart-data?customerId=1234567890&dateFrom=2024-01-01&dateTo=2024-01-31');

// Resposta de sucesso
{
  success: true,
  data: [...],
  timestamp: "2024-01-15T10:30:00.000Z",
  type: "chart-data"
}
```

### Exemplo de Requisição Inválida

```typescript
// Requisição inválida
const response = await fetch('/api/google-ads/chart-data?dateFrom=2024-01-01'); // Falta dateTo

// Resposta de erro
{
  error: "Parâmetros inválidos",
  details: ["dateFrom: Ambas as datas (dateFrom e dateTo) devem ser fornecidas juntas"],
  help: "Verifique os parâmetros da requisição"
}
```

## Conclusão

As melhorias implementadas tornam o sistema mais robusto, seguro e fácil de manter. A validação com Zod garante a integridade dos dados, enquanto a centralização da autenticação reduz duplicação e facilita manutenção futura.
