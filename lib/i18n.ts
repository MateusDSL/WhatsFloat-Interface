export type Language = 'pt-BR' | 'en-US' | 'es-ES'

export interface Translations {
  [key: string]: {
    [key in Language]: string
  }
}

const translations: Translations = {
  // Configurações
  'settings.title': {
    'pt-BR': 'Configurações',
    'en-US': 'Settings',
    'es-ES': 'Configuración'
  },
  'settings.description': {
    'pt-BR': 'Personalize as configurações do sistema conforme suas preferências.',
    'en-US': 'Customize system settings according to your preferences.',
    'es-ES': 'Personaliza la configuración del sistema según tus preferencias.'
  },
  
  // Notificações
  'notifications.title': {
    'pt-BR': 'Notificações',
    'en-US': 'Notifications',
    'es-ES': 'Notificaciones'
  },
  'notifications.enable': {
    'pt-BR': 'Ativar notificações',
    'en-US': 'Enable notifications',
    'es-ES': 'Activar notificaciones'
  },
  'notifications.enable.description': {
    'pt-BR': 'Receber notificações de novos leads',
    'en-US': 'Receive notifications for new leads',
    'es-ES': 'Recibir notificaciones de nuevos leads'
  },
  'notifications.sound': {
    'pt-BR': 'Som de notificação',
    'en-US': 'Notification sound',
    'es-ES': 'Sonido de notificación'
  },
  'notifications.sound.description': {
    'pt-BR': 'Tocar som ao receber notificações',
    'en-US': 'Play sound when receiving notifications',
    'es-ES': 'Reproducir sonido al recibir notificaciones'
  },
  'notifications.desktop': {
    'pt-BR': 'Notificações desktop',
    'en-US': 'Desktop notifications',
    'es-ES': 'Notificaciones de escritorio'
  },
  'notifications.desktop.description': {
    'pt-BR': 'Mostrar notificações no sistema',
    'en-US': 'Show system notifications',
    'es-ES': 'Mostrar notificaciones del sistema'
  },




  // Atualizações
  'updates.title': {
    'pt-BR': 'Atualizações',
    'en-US': 'Updates',
    'es-ES': 'Actualizaciones'
  },
  'updates.auto': {
    'pt-BR': 'Atualização automática',
    'en-US': 'Auto update',
    'es-ES': 'Actualización automática'
  },
  'updates.auto.description': {
    'pt-BR': 'Atualizar dados automaticamente',
    'en-US': 'Update data automatically',
    'es-ES': 'Actualizar datos automáticamente'
  },
  'updates.interval': {
    'pt-BR': 'Intervalo de atualização (segundos)',
    'en-US': 'Update interval (seconds)',
    'es-ES': 'Intervalo de actualización (segundos)'
  },

  // Idioma
  'language.title': {
    'pt-BR': 'Idioma',
    'en-US': 'Language',
    'es-ES': 'Idioma'
  },

  // Botões
  'save': {
    'pt-BR': 'Salvar',
    'en-US': 'Save',
    'es-ES': 'Guardar'
  },
  'cancel': {
    'pt-BR': 'Cancelar',
    'en-US': 'Cancel',
    'es-ES': 'Cancelar'
  },
  'reset': {
    'pt-BR': 'Restaurar Padrão',
    'en-US': 'Reset to Default',
    'es-ES': 'Restaurar Predeterminado'
  },

  // Mensagens
  'settings.saved': {
    'pt-BR': 'Configurações salvas',
    'en-US': 'Settings saved',
    'es-ES': 'Configuración guardada'
  },
  'settings.saved.description': {
    'pt-BR': 'Suas configurações foram salvas com sucesso.',
    'en-US': 'Your settings have been saved successfully.',
    'es-ES': 'Tu configuración ha sido guardada exitosamente.'
  },
  'settings.reset': {
    'pt-BR': 'Configurações resetadas',
    'en-US': 'Settings reset',
    'es-ES': 'Configuración restablecida'
  },
  'settings.reset.description': {
    'pt-BR': 'As configurações foram restauradas para os valores padrão.',
    'en-US': 'Settings have been restored to default values.',
    'es-ES': 'La configuración ha sido restaurada a los valores predeterminados.'
  },

  // Tooltips
  'tooltip.notifications': {
    'pt-BR': 'Configure como você quer receber notificações sobre novos leads no sistema.',
    'en-US': 'Configure how you want to receive notifications about new leads in the system.',
    'es-ES': 'Configura cómo quieres recibir notificaciones sobre nuevos leads en el sistema.'
  },

  'tooltip.language': {
    'pt-BR': 'Escolha o idioma da interface do sistema.',
    'en-US': 'Choose the language for the system interface.',
    'es-ES': 'Elige el idioma de la interfaz del sistema.'
  },
  'test.notification': {
    'pt-BR': 'Testar Notificação',
    'en-US': 'Test Notification',
    'es-ES': 'Probar Notificación'
  },
  'test.notification.title': {
    'pt-BR': 'Teste de Notificação',
    'en-US': 'Test Notification',
    'es-ES': 'Prueba de Notificación'
  },
  'test.notification.description': {
    'pt-BR': 'Esta é uma notificação de teste para verificar o sistema.',
    'en-US': 'This is a test notification to verify the system.',
    'es-ES': 'Esta es una notificación de prueba para verificar el sistema.'
  }
}

export function t(key: string, language: Language): string {
  return translations[key]?.[language] || key
}

export function getLanguageName(language: Language): string {
  const names = {
    'pt-BR': 'Português (Brasil)',
    'en-US': 'English (US)',
    'es-ES': 'Español'
  }
  return names[language]
}
