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
import type { Database } from '@/types/database'

/**
 * Creates a Supabase client for browser environments
 * Handles cookie-based session management automatically
 *
 * Note: Uses direct environment variable access to avoid server-only validation
 */
export function createBrowserClient() {
  // Access public env vars directly in browser to avoid server-side validation
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!url || !anonKey) {
    throw new Error('Missing required Supabase environment variables')
  }

  return createSupabaseBrowserClient<Database>(url, anonKey)
}

// Export types for convenience
export type { Database } from '@/types/database'
