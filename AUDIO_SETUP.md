# 🎵 Configuração do Áudio de Notificação

## 📁 Como adicionar seu arquivo de áudio

### 1. **Preparar o arquivo de áudio**
- Formato recomendado: **MP3** (melhor compatibilidade)
- Formatos suportados: MP3, WAV, OGG, AAC
- Duração recomendada: **1-3 segundos**
- Tamanho recomendado: **< 100KB**

### 2. **Adicionar o arquivo**
1. Copie seu arquivo de áudio para a pasta `public/`
2. Renomeie para `notification-sound.mp3`
3. Ou altere o nome no arquivo `hooks/useAudio.ts` linha 3:
   ```typescript
   const { play: playNotificationSound, loadAudio } = useAudio('/seu-arquivo.mp3')
   ```

### 3. **Testar o áudio**
- Abra as configurações do sistema
- Ative "Som de notificação"
- Adicione um novo lead para testar

## 🔧 Configurações disponíveis

### Volume do áudio
- Padrão: **50%** (0.5)
- Alterar em `hooks/useAudio.ts` linha 18:
  ```typescript
  audioRef.current.volume = 0.5 // 0.0 a 1.0
  ```

### Pré-carregamento
- O áudio é carregado automaticamente quando a página carrega
- Configurado em `hooks/useAudio.ts` linha 17:
  ```typescript
  audioRef.current.preload = 'auto'
  ```

## 🎯 Funcionalidades implementadas

- ✅ **Carregamento automático** do áudio
- ✅ **Controle de volume** configurável
- ✅ **Tratamento de erros** para compatibilidade
- ✅ **Integração** com sistema de notificações
- ✅ **Controle via configurações** (ligar/desligar som)

## 🚨 Solução de problemas

### Áudio não toca
1. Verifique se o arquivo existe em `public/notification-sound.mp3`
2. Verifique se "Som de notificação" está ativado nas configurações
3. Verifique o console do navegador para erros

### Erro de autoplay
- Alguns navegadores bloqueiam autoplay
- O sistema trata automaticamente esses erros
- Funciona normalmente após interação do usuário

### Arquivo não encontrado
- Verifique o caminho do arquivo
- Certifique-se de que está na pasta `public/`
- Reinicie o servidor de desenvolvimento
