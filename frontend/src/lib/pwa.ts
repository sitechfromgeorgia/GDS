/**
 * PWA Utilities for Service Worker Registration and Management
 */

import { logger } from '@/lib/logger'

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * Register service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    logger.info('Service Worker not supported in this environment')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    })

    logger.info('Service Worker registered successfully', { scope: registration.scope })

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            logger.info('New Service Worker version available')
            // Notify user about update
            if (window.confirm('New version available! Refresh to update?')) {
              window.location.reload()
            }
          }
        })
      }
    })

    return registration
  } catch (error) {
    logger.error('Service Worker registration failed', error as Error)
    return null
  }
}

/**
 * Unregister service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      const success = await registration.unregister()
      logger.info('Service Worker unregistered', { success })
      return success
    }
    return false
  } catch (error) {
    logger.error('Service Worker unregistration failed', error as Error)
    return false
  }
}

/**
 * Check if app is installed as PWA
 */
export function isPWAInstalled(): boolean {
  if (typeof window === 'undefined') return false

  // Check display mode
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
  // iOS Safari standalone mode check
  const isIOSStandalone = (window.navigator as any).standalone === true

  return isStandalone || isIOSStandalone
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied'
  }

  try {
    const permission = await Notification.requestPermission()
    logger.info('Notification permission requested', { permission })
    return permission
  } catch (error) {
    logger.error('Notification permission request failed', error as Error)
    return 'denied'
  }
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(
  registration: ServiceWorkerRegistration,
  vapidPublicKey: string
): Promise<PushSubscription | null> {
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
    })

    logger.info('Push notification subscription created', { endpoint: subscription.endpoint })
    return subscription
  } catch (error) {
    logger.error('Push notification subscription failed', error as Error)
    return null
  }
}

/**
 * Convert VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/**
 * Background sync for offline data
 */
export async function requestBackgroundSync(tag: string): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    throw new Error('Service Worker not supported')
  }

  try {
    const registration = await navigator.serviceWorker.ready
    // Background Sync API (experimental, not in TypeScript types yet)
    if ('sync' in registration) {
      await (registration as any).sync.register(tag)
      logger.info('Background sync registered', { tag })
    } else {
      logger.warn('Background Sync API not supported in this browser')
    }
  } catch (error) {
    logger.error('Background sync registration failed', error as Error)
    throw error
  }
}

/**
 * Store data for background sync
 */
export async function storeForSync(storeName: string, data: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('georgian-distribution-db', 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const addRequest = store.add(data)

      addRequest.onerror = () => reject(addRequest.error)
      addRequest.onsuccess = () => resolve()
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      if (!db.objectStoreNames.contains('orders')) {
        db.createObjectStore('orders', { keyPath: 'id', autoIncrement: true })
      }

      if (!db.objectStoreNames.contains('cart')) {
        db.createObjectStore('cart', { keyPath: 'id' })
      }
    }
  })
}

/**
 * Check if online
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine
}

/**
 * Listen to online/offline events
 */
export function onNetworkChange(callback: (isOnline: boolean) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const handleOnline = () => callback(true)
  const handleOffline = () => callback(false)

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}

/**
 * Play notification sound
 */
export function playNotificationSound(): void {
  if (typeof window === 'undefined') return

  try {
    // Create audio element for notification sound
    const audio = new Audio('/sounds/notification.mp3')
    audio.volume = 0.5
    audio.play().catch((error) => {
      logger.warn('Failed to play notification sound', error)
    })
  } catch (error) {
    logger.error('Error playing notification sound', error as Error)
  }
}

/**
 * Vibrate device
 */
export function vibrateDevice(pattern: number | number[] = 200): void {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) {
    return
  }

  try {
    navigator.vibrate(pattern)
  } catch (error) {
    logger.error('Vibration failed', error as Error)
  }
}

/**
 * Show browser notification
 */
export async function showNotification(
  title: string,
  options?: NotificationOptions
): Promise<void> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return
  }

  try {
    // Request permission if not granted
    if (Notification.permission === 'default') {
      await Notification.requestPermission()
    }

    // Show notification if permission granted
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        ...options,
      })
    }
  } catch (error) {
    logger.error('Failed to show notification', error as Error)
  }
}
