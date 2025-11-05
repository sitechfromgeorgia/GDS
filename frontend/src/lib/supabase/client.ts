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
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing required Supabase environment variables')
  }

  return createSupabaseBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        if (typeof document === 'undefined') return undefined
        return document.cookie
          .split('; ')
          .find((row) => row.startsWith(name + '='))
          ?.split('=')[1]
      },
      set(name: string, value: string, options: any) {
        if (typeof document === 'undefined') return

        const cookieParts = [`${name}=${value}`, 'path=/']

        // Add SameSite attribute (critical for cross-page auth)
        if (options.sameSite !== undefined) {
          cookieParts.push(`SameSite=${options.sameSite}`)
        } else {
          cookieParts.push('SameSite=Lax') // Default to Lax for navigation
        }

        // Add Secure flag in production
        if (
          options.secure ||
          (typeof window !== 'undefined' && window.location.protocol === 'https:')
        ) {
          cookieParts.push('Secure')
        }

        // Add domain if specified
        if (options.domain) {
          cookieParts.push(`domain=${options.domain}`)
        }

        // Add max-age
        if (options.maxAge) {
          cookieParts.push(`max-age=${options.maxAge}`)
        }

        // Add expires if specified
        if (options.expires) {
          cookieParts.push(`expires=${options.expires}`)
        }

        document.cookie = cookieParts.join('; ')
      },
      remove(name: string, options: any) {
        if (typeof document === 'undefined') return

        const cookieParts = [`${name}=`, 'path=/', 'max-age=0']

        if (options.domain) {
          cookieParts.push(`domain=${options.domain}`)
        }

        document.cookie = cookieParts.join('; ')
      },
    },
  })
}

/**
 * Legacy client creation with enhanced configuration
 * Used for backward compatibility and advanced real-time features
 */
export function createLegacyClient(): SupabaseClient<Database> {
  if (!supabaseUrl || !supabaseAnonKey) {
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
    hasAnonKey: !!supabaseAnonKey,
    clientInfo: 'georgian-distribution-system@1.0.0',
  }
}

// Export types for convenience
export type { Database } from '@/types/database'

// Default export alias for backward compatibility
export { createBrowserClient as createClient }
