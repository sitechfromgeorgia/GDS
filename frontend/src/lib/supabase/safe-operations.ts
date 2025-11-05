/**
 * Type-safe Supabase database operations wrapper
 * Provides type-safe operations to avoid TypeScript inference issues
 */

import { logger } from '@/lib/logger'
import { createBrowserClient } from './client'
import type { Database, ProductUpdate } from '@/types/database'

// Create Supabase client instance
const supabase = createBrowserClient()

/**
 * Type-safe product update operation
 * Addresses Supabase type inference issues in ProductForm
 */
export async function updateProduct(
  id: string,
  updateData: Partial<Database['public']['Tables']['products']['Row']>
) {
  try {
    const { data, error } = await (supabase as any)
      .from('products')
      .update(updateData) // Type assertion handled by casting supabase
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('Product update error:', error)
      throw error
    }

    return data
  } catch (error) {
    logger.error('Product update operation failed:', error)
    throw error
  }
}

/**
 * Type-safe product insert operation
 */
export async function insertProduct(
  insertData: Database['public']['Tables']['products']['Insert']
) {
  try {
    const { data, error } = await (supabase as any)
      .from('products')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      logger.error('Product insert error:', error)
      throw error
    }

    return data
  } catch (error) {
    logger.error('Product insert operation failed:', error)
    throw error
  }
}

/**
 * Type-safe general database operations
 */
export const safeSupabase = {
  update: <T extends keyof Database['public']['Tables']>(
    table: T,
    data: Database['public']['Tables'][T]['Update'],
    filter: Record<string, any>
  ) => {
    return (supabase as any).from(table).update(data).eq(filter.key, filter.value)
  },

  insert: <T extends keyof Database['public']['Tables']>(
    table: T,
    data: Database['public']['Tables'][T]['Insert']
  ) => {
    return (supabase as any).from(table).insert(data)
  },

  select: <T extends keyof Database['public']['Tables']>(table: T, query?: string) => {
    let queryBuilder = (supabase as any).from(table).select(query || '*')
    return queryBuilder
  },
}
