'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/pwa';

/**
 * Component to register service worker on mount
 * Must be rendered in root layout
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Register service worker on client-side only
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      registerServiceWorker().catch((error) => {
        console.error('Failed to register service worker:', error);
      });
    }
  }, []);

  // This component doesn't render anything
  return null;
}
