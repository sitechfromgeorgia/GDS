/**
 * Supabase Browser Client
 *
 * Browser-side Supabase client with authentication and real-time support.
 * Used in Client Components ('use client') for client-side operations.
 *
 * Usage:
 *   import { createBrowserClient } from '@/lib/supabase'
 *   const supabase = createBrowserClient()
 */

import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { logger } from '@/lib/logger'

// Environment configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client configuration options
export const clientOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce' as const,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'georgian-distribution-auth',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
    heartbeatIntervalMs: 30000,
    timeout: 60000,
  },
  global: {
    headers: {
      'X-Client-Info': 'georgian-distribution-system@1.0.0',
    },
  },
}

/**
 * Creates a Supabase client for browser environments using SSR
 * Handles cookie-based session management automatically
 * This is the recommended approach for Next.js App Router
 */
export function createBrowserClient() {
  // During build time, return a mock client to avoid errors
  // This happens when Next.js analyzes API routes during the build phase
  if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
      // Build time - return a mock client
      logger.warn('Building without Supabase credentials - using mock client')
      return null as any
    }
    throw new Error('Missing required Supabase environment variables')
  }

  return createSupabaseBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}

/**
 * Legacy client creation with enhanced configuration
 * Used for backward compatibility and advanced real-time features
 */
export function createLegacyClient(): SupabaseClient<Database> {
  if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
      // Build time - return a mock client
      logger.warn('Building without Supabase credentials - using mock legacy client')
      return null as any
    }
    throw new Error('Missing required Supabase environment variables')
  }

  const client = createClient<Database>(supabaseUrl, supabaseAnonKey, clientOptions)

  // Add global error handler for auth state changes
  if (typeof window !== 'undefined') {
    client.auth.onAuthStateChange((event, session) => {
      logger.info('Auth state changed', { event, userEmail: session?.user?.email || 'No user' })
    })
  }

  return client
}

// Health check function
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const client = createBrowserClient()
    const { error } = await client.from('profiles').select('id').limit(1)
    return !error
  } catch (error) {
    logger.error('Supabase connection check failed', error as Error)
    return false
  }
}

// Get current environment info
export function getEnvironmentInfo() {
  return {
    url: supabaseUrl,
    isLocal: supabaseUrl?.includes('localhost') || supabaseUrl?.includes('127.0.0.1'),
    hasAnonKey: Boolean(supabaseAnonKey),
    clientInfo: 'georgian-distribution-system@1.0.0',
  }
}

// Export types for convenience
export type { Database } from '@/types/database'

// Default export alias for backward compatibility
export { createBrowserClient as createClient }
