/**
 * Next.js Instrumentation
 *
 * This file runs when Next.js server initializes.
 * Used to load polyfills and server-side initialization code.
 */

import { logger } from '@/lib/logger'

export async function register() {
  // Server initialization code
  // This runs once when the server starts

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Node.js-specific initialization
    // Polyfill 'self' global for server-side rendering
    if (typeof globalThis !== 'undefined' && typeof (globalThis as any).self === 'undefined') {
      ;(globalThis as any).self = globalThis
    }
    logger.info('✓ Server polyfills loaded')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime initialization
    logger.info('✓ Edge runtime initialized')
  }
}
