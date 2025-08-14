import { useSettings } from './useSettings'

export function useDesktopNotifications() {
  const { settings } = useSettings()

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.log('Este navegador não suporta notificações desktop')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'denied') {
      console.log('Permissão para notificações foi negada')
      return false
    }

    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  const showNotification = async (title: string, options?: NotificationOptions) => {
    if (!settings.notifications.desktop) {
      return
    }

    const hasPermission = await requestPermission()
    if (!hasPermission) {
      return
    }

    try {
      new Notification(title, {
        icon: '/placeholder-logo.png',
        badge: '/placeholder-logo.png',
        ...options
      })
    } catch (error) {
      console.error('Erro ao mostrar notificação desktop:', error)
    }
  }

  return {
    showNotification,
    requestPermission
  }
}
