import { useState, useEffect } from 'react'

export interface AppSettings {
  notifications: {
    enabled: boolean
    sound: boolean
    desktop: boolean
  }
  language: string
}

const defaultSettings: AppSettings = {
  notifications: {
    enabled: true,
    sound: true,
    desktop: true
  },
  language: 'pt-BR'
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [isLoaded, setIsLoaded] = useState(false)

  // Carregar configurações do localStorage
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('app-settings')
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings)
        setSettings({ ...defaultSettings, ...parsedSettings })
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Salvar configurações no localStorage
  const saveSettings = (newSettings: AppSettings) => {
    try {
      localStorage.setItem('app-settings', JSON.stringify(newSettings))
      setSettings(newSettings)
      return { success: true }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      return { success: false, error }
    }
  }

  // Atualizar uma configuração específica
  const updateSetting = (category: keyof AppSettings, key: string, value: any) => {
    const newSettings = { ...settings }
    
    if (category === 'notifications') {
      newSettings.notifications = {
        ...newSettings.notifications,
        [key]: value
      }
    } else {
      (newSettings as any)[category] = value
    }
    
    saveSettings(newSettings)
  }

  // Resetar configurações para padrão
  const resetSettings = () => {
    saveSettings(defaultSettings)
  }

  return {
    settings,
    isLoaded,
    saveSettings,
    updateSetting,
    resetSettings
  }
}
