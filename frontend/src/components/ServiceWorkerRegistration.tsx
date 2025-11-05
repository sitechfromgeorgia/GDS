'use client'

import { useEffect } from 'react'
import { registerServiceWorker } from '@/lib/pwa'
import { logger } from '@/lib/logger'

/**
 * Component to register service worker on mount
 * Must be rendered in root layout
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Register service worker on client-side only
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      registerServiceWorker().catch((error) => {
        logger.error('Failed to register Service Worker in component', error as Error)
      })
    }
  }, [])

  // This component doesn't render anything
  return null
}
