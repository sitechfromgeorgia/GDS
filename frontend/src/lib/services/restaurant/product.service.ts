import { createBrowserClient } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'
import { Database } from '@/types/restaurant-temp'

export interface Product {
  id: string
  name: string
  category: string
  unit: string
  cost_price: number
  markup_percentage: number
  is_active: boolean
  image_url: string | null
}

export class ProductService {
  private supabase = createBrowserClient()

  async getProducts(category?: string): Promise<Product[]> {
    let query = this.supabase.from('products').select('*').eq('is_active', true).order('name')

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching products:', error)
      throw error
    }

    return data || []
  }

  async searchProducts(searchTerm: string): Promise<Product[]> {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .ilike('name', `%${searchTerm}%`)
      .order('name')

    if (error) {
      logger.error('Error searching products:', error)
      throw error
    }

    return data || []
  }

  subscribeToCatalogChanges(callback: () => void) {
    return this.supabase
      .channel('product-catalog-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
        },
        () => {
          callback()
        }
      )
      .subscribe()
  }
}

export const productService = new ProductService()
