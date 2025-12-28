/**
 * Product Service
 * Handles product catalog operations
 * Implemented with Supabase
 */

import { createBrowserClient } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'
import type { Database } from '@/types/database'

type Product = Database['public']['Tables']['products']['Row']
type ProductInsert = Database['public']['Tables']['products']['Insert']
type ProductUpdate = Database['public']['Tables']['products']['Update']

export class ProductService {
  private static get supabase() {
    return createBrowserClient()
  }

  static async getAllProducts(): Promise<Product[]> {
    const { data, error } = await this.supabase.from('products').select('*').order('name')

    if (error) {
      logger.error('Error fetching products:', error)
      return []
    }
    return data || []
  }

  static async getProductById(id: string): Promise<Product | null> {
    const { data, error } = await this.supabase.from('products').select('*').eq('id', id).single()

    if (error) {
      logger.error('Error fetching product:', error)
      return null
    }
    return data
  }

  static async getProductsByCategory(category: string): Promise<Product[]> {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)

    if (error) {
      logger.error('Error fetching products by category:', error)
      return []
    }
    return data || []
  }

  static async searchProducts(query: string): Promise<Product[]> {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .eq('is_active', true)

    if (error) {
      logger.error('Error searching products:', error)
      return []
    }
    return data || []
  }

  static async createProduct(product: Partial<Product>): Promise<Product | null> {
    const { data, error } = await this.supabase
      .from('products')
      .insert(product as ProductInsert)
      .select()
      .single()

    if (error) {
      logger.error('Error creating product:', error)
      return null
    }
    return data
  }

  static async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    const { data, error } = await this.supabase
      .from('products')
      .update(updates as ProductUpdate)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('Error updating product:', error)
      return null
    }
    return data
  }

  static async deleteProduct(id: string): Promise<boolean> {
    const { error } = await this.supabase.from('products').delete().eq('id', id)

    if (error) {
      logger.error('Error deleting product:', error)
      return false
    }
    return true
  }
}
