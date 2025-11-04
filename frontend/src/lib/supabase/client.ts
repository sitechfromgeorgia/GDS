<<<<<<< HEAD
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
=======
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Environment configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client configuration options
const clientOptions = {
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
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'georgian-distribution-system@1.0.0'
    }
  }
}

// Validate environment variables
function validateEnvironment() {
  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  }
  if (!supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
  }
  
  if (supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1')) {
    console.warn('Using local development Supabase instance')
  }
}

// Create and validate environment
try {
  validateEnvironment()
} catch (error) {
  console.error('Supabase configuration error:', error)
}

// Enhanced client creation with error handling
export function createSupabaseClient(): SupabaseClient {
  try {
    const client = createClient(supabaseUrl, supabaseAnonKey, clientOptions)
    
    // Add global error handler for unhandled rejections
    client.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email || 'No user')
    })
    
    return client
  } catch (error) {
    console.error('Failed to create Supabase client:', error)
    throw error
  }
}

// Default client instance
export const supabase = createSupabaseClient()

// Client creation for browser environments
export function createBrowserClient(): SupabaseClient {
  return createSupabaseClient()
}

// Client creation for server environments
export function createServerClient(): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    ...clientOptions,
    auth: {
      ...clientOptions.auth,
      persistSession: false, // Server doesn't need persistent sessions
      autoRefreshToken: false
    }
  })
}

// Health check function
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('profiles').select('id').limit(1)
    return !error
  } catch (error) {
    console.error('Supabase connection check failed:', error)
    return false
  }
}

// Get current environment info
export function getEnvironmentInfo() {
  return {
    url: supabaseUrl,
    isLocal: supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1'),
    hasAnonKey: !!supabaseAnonKey,
    clientInfo: 'georgian-distribution-system@1.0.0'
  }
}

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'admin' | 'restaurant' | 'driver' | 'demo'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role: 'admin' | 'restaurant' | 'driver' | 'demo'
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'admin' | 'restaurant' | 'driver' | 'demo'
        }
      }
      products: {
        Row: {
          id: string
          name: string
          name_ka: string
          description: string
          description_ka: string
          category: string
          unit: string
          price: number
          image_url?: string
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          name_ka: string
          description: string
          description_ka: string
          category: string
          unit: string
          price: number
          image_url?: string
          active?: boolean
        }
        Update: {
          name?: string
          name_ka?: string
          description?: string
          description_ka?: string
          category?: string
          unit?: string
          price?: number
          image_url?: string
          active?: boolean
        }
      }
      orders: {
        Row: {
          id: string
          restaurant_id: string
          status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'completed'
          total_amount: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          status?: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'completed'
          total_amount: number
        }
        Update: {
          status?: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'completed'
          total_amount?: number
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          price: number
        }
        Update: {
          quantity?: number
          price?: number
        }
      }
    }
  }
}

// Export types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Export client options for testing and customization
export { clientOptions }
>>>>>>> 4f46816d3369e63516557dedd905a7027f3ba306
