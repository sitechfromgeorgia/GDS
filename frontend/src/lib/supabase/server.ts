/**
 * Supabase Server Clients
 *
 * Server-side Supabase clients for different Next.js contexts:
 * - createServerClient: For Server Components and Server Actions
 * - createAdminClient: For privileged operations (service role)
 *
 * Usage:
 *   import { createServerClient } from '@/lib/supabase/server'
 *   const supabase = await createServerClient()
 */

import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { CookieOptions } from '@supabase/ssr'
import type { Database } from '@/types/database'
import { getEnvVar } from '@/lib/env'

/**
 * Creates a Supabase client for server-side operations
 * Handles cookies for session management in Next.js Server Components
 *
 * @returns Supabase client instance
 */
export async function createServerClient() {
  const cookieStore = await cookies()

  return createSupabaseServerClient<Database>(
    getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
    getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set(name, value, options)
          } catch {
            // Ignore error - cookies can't be set in Server Components
            // This is expected and harmless
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set(name, '', { ...options, maxAge: 0 })
          } catch {
            // Ignore error - cookies can't be removed in Server Components
            // This is expected and harmless
          }
        },
      },
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
    }
  )
}

/**
 * Alias for createServerClient - for backward compatibility
 * Use this in Server Components, Route Handlers, and Server Actions
 */
export const createClient = createServerClient

/**
 * Alias for createServerClient - for route handlers
 * @deprecated Use createServerClient instead
 */
export const createRouteHandlerClient = createServerClient

/**
 * Alias for createServerClient - for server actions
 * @deprecated Use createServerClient instead
 */
export const createServerActionClient = createServerClient

/**
 * Creates a Supabase Admin client with service role privileges
 * WARNING: Only use on server-side! Never expose service role key to client.
 *
 * Use cases:
 * - Bypassing Row Level Security (RLS)
 * - Creating/deleting users
 * - Admin operations that require elevated privileges
 *
 * @returns Supabase admin client instance
 */
export function createAdminClient() {
  // Use env validation layer for secure access to service role key
  const serviceRoleKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY')

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin client')
  }

  return createSupabaseClient<Database>(getEnvVar('NEXT_PUBLIC_SUPABASE_URL'), serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Cursor-based pagination helper for orders (T016)
 *
 * Why cursor pagination vs offset/limit:
 * - Consistent results even with concurrent inserts
 * - Better performance (no offset scan overhead)
 * - Works perfectly with idx_orders_restaurant_status_created index
 *
 * @param options Pagination options
 * @returns Paginated orders with next cursor
 *
 * Example usage:
 *   const result = await getOrdersPaginated({
 *     restaurantId: user.id,
 *     status: ['pending', 'confirmed'],
 *     limit: 20,
 *     cursor: previousResult?.nextCursor
 *   })
 */
export async function getOrdersPaginated(options: {
  restaurantId: string
  status?: string[]
  limit?: number
  cursor?: string // ISO timestamp of last item
}) {
  const { restaurantId, status = ['pending', 'confirmed', 'priced'], limit = 20, cursor } = options

  const supabase = await createServerClient()

  // Build query with specific columns (works with covering index)
  // Note: customer_name doesn't exist in orders table - restaurant info is via restaurant_id FK
  let query = supabase
    .from('orders')
    .select(
      `
      id,
      status,
      total_amount,
      driver_id,
      created_at,
      order_items (
        id,
        product_id,
        quantity,
        unit_price,
        total_price,
        products (
          name,
          unit
        )
      ),
      profiles!orders_driver_id_fkey (
        full_name
      )
    `,
      { count: 'exact' }
    )
    .eq('restaurant_id', restaurantId)
    .in('status', status)
    .order('created_at', { ascending: false })
    .limit(limit + 1) // Fetch one extra to detect if there's a next page

  // Apply cursor (created_at < cursor for descending order)
  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  const { data, error, count } = await query

  if (error) {
    throw error
  }

  // Check if there are more results
  const hasMore = data != null && data.length > limit
  const items = hasMore ? data.slice(0, limit) : (data ?? [])

  // Next cursor is the created_at of the last item
  const lastItem = items.length > 0 ? items[items.length - 1] : null
  const nextCursor = hasMore && lastItem ? lastItem.created_at : null

  return {
    items,
    nextCursor,
    hasMore,
    total: count || 0,
  }
}

// Export types for convenience
export type { Database } from '@/types/database'
