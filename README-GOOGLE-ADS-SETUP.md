# Configuração do Google Ads - Leads Database

Este guia explica como configurar a integração com o Google Ads para acessar dados de campanhas, localização e palavras-chave.

## 📋 Pré-requisitos

1. **Conta Google Ads ativa** com campanhas configuradas
2. **Google Cloud Project** com APIs habilitadas
3. **Credenciais OAuth2** configuradas
4. **Developer Token** do Google Ads

## 🔧 Configuração das Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
# Google Ads API Configuration
GOOGLE_CLIENT_ID=seu_client_id_aqui
GOOGLE_CLIENT_SECRET=seu_client_secret_aqui
GOOGLE_DEVELOPER_TOKEN=seu_developer_token_aqui
GOOGLE_REFRESH_TOKEN=seu_refresh_token_aqui
GOOGLE_LOGIN_CUSTOMER_ID=seu_login_customer_id_aqui

# Customer ID da conta que você quer acessar (pode ser configurado via interface)
NEXT_PUBLIC_GOOGLE_CUSTOMER_ID=seu_customer_id_aqui
```

## 🚀 Como Obter as Credenciais

### 1. Google Cloud Project Setup

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Habilite a API do Google Ads:
   - Vá para "APIs & Services" > "Library"
   - Procure por "Google Ads API"
   - Clique em "Enable"

### 2. Configurar OAuth2

1. Vá para "APIs & Services" > "Credentials"
2. Clique em "Create Credentials" > "OAuth 2.0 Client IDs"
3. Configure o tipo de aplicação (Web application)
4. Adicione URLs de redirecionamento autorizadas
5. Anote o `Client ID` e `Client Secret`

### 3. Obter Developer Token

1. Acesse [Google Ads API Center](https://developers.google.com/google-ads/api/docs/first-call/dev-token)
2. Faça login com sua conta Google Ads
3. Solicite um Developer Token
4. Aguarde a aprovação (pode levar alguns dias)

### 4. Obter Refresh Token

1. Use o script de autenticação incluído no projeto:
   ```bash
   npm run get-refresh-token
   ```
2. Siga as instruções para autorizar o acesso
3. Anote o Refresh Token gerado

### 5. Encontrar Customer IDs

1. **Login Customer ID**: ID da conta manager (geralmente começa com 123-)
2. **Customer ID**: ID da conta específica que você quer acessar

Para encontrar estes IDs:
- Acesse o Google Ads
- Vá para "Tools & Settings" > "Setup" > "Account access"
- Os IDs aparecem no formato: `123-456-7890`

## 🔍 Verificação da Configuração

1. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

2. Acesse a página do Google Ads: `http://localhost:3000/google-ads`

3. Vá para a aba "⚙️ Configuração" para verificar o status de todas as variáveis

4. Se alguma variável estiver "Não configurado", configure-a no arquivo `.env.local`

## 🐛 Debug e Solução de Problemas

### Problema: "Customer ID não fornecido"

**Solução:**
- Configure a variável `NEXT_PUBLIC_GOOGLE_CUSTOMER_ID` no `.env.local`
- Ou use a interface de configuração na aba "⚙️ Configuração"

### Problema: "Erro de autenticação"

**Solução:**
- Verifique se todas as credenciais OAuth2 estão corretas
- Confirme se o Refresh Token não expirou
- Verifique se o Developer Token foi aprovado

### Problema: "Erro de permissão"

**Solução:**
- Confirme se o Login Customer ID tem acesso à conta de destino
- Verifique se a conta tem campanhas ativas
- Confirme se as APIs estão habilitadas no Google Cloud

## 📊 Funcionalidades Disponíveis

Com a configuração correta, você terá acesso a:

- **Campanhas**: Lista de todas as campanhas ativas com métricas
- **Localização**: Dados de performance por localização geográfica
- **Palavras-chave**: Análise de palavras-chave e performance
- **Debug**: Dados brutos da API para troubleshooting

## 🔒 Segurança

- Nunca commite o arquivo `.env.local` no repositório
- Mantenha suas credenciais seguras
- Use tokens de acesso temporários quando possível
- Monitore o uso da API para evitar limites de quota

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs do console do navegador
2. Use a aba "🐛 Debug" para ver dados detalhados
3. Confirme se todas as variáveis de ambiente estão configuradas
4. Teste a conexão com a API do Google Ads

## 🔄 Atualizações

Para atualizar tokens ou configurações:

1. Edite o arquivo `.env.local`
2. Reinicie o servidor de desenvolvimento
3. Verifique o status na aba "⚙️ Configuração"
4. Teste as funcionalidades na aba "🐛 Debug"
