import { useState, useEffect, useCallback } from 'react'
import type { BeforeInstallPromptEvent } from '@/lib/pwa'
import {
  registerServiceWorker,
  isPWAInstalled,
  requestNotificationPermission,
  isOnline as checkIsOnline,
  onNetworkChange,
} from '@/lib/pwa'
import { logger } from '@/lib/logger'

export function usePWA() {
  const [isInstalled, setIsInstalled] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>('default')

  useEffect(() => {
    // Check if PWA is installed
    setIsInstalled(isPWAInstalled())

    // Check initial online status
    setIsOnline(checkIsOnline())

    // Register service worker
    registerServiceWorker().then((reg) => {
      setRegistration(reg)
    })

    // Listen to network changes
    const unsubscribe = onNetworkChange((online) => {
      setIsOnline(online)
    })

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Check notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }

    return () => {
      unsubscribe()
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      logger.info('PWA install prompt not available')
      return false
    }

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    logger.info('PWA install prompt outcome', { outcome })
    setDeferredPrompt(null)

    if (outcome === 'accepted') {
      setIsInstalled(true)
      return true
    }

    return false
  }, [deferredPrompt])

  const requestNotifications = useCallback(async () => {
    const permission = await requestNotificationPermission()
    setNotificationPermission(permission)
    return permission === 'granted'
  }, [])

  return {
    isInstalled,
    isOnline,
    registration,
    canInstall: Boolean(deferredPrompt),
    notificationPermission,
    promptInstall,
    requestNotifications,
  }
}
