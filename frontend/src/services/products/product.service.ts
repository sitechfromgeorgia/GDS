import { createBrowserClient } from '@/lib/supabase'
import { z } from 'zod'
import type { Product } from '@/types/database'
import type { ProductFilterInput } from '@/lib/validators/products/products'

// Enhanced product service with restaurant-focused features
export class ProductService {
  private supabase = createBrowserClient()

  // Get all products with filtering and pagination
  async getProducts(filters: ProductFilterInput = {}) {
    let query = this.supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .eq('is_available', true)
      .order('name', { ascending: true })

    // Apply filters
    if (filters.category) {
      query = query.eq('category', filters.category)
    }

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    if (filters.min_price !== undefined) {
      query = query.gte('price', filters.min_price)
    }

    if (filters.max_price !== undefined) {
      query = query.lte('price', filters.max_price)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch products: ${error.message}`)
    }

    return data || []
  }

  // Get products by category
  async getProductsByCategory(category: string) {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .eq('is_available', true)
      .order('name', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch products by category: ${error.message}`)
    }

    return data || []
  }

  // Get product categories for filtering
  async getCategories() {
    const { data, error } = await this.supabase
      .from('products')
      .select('category')
      .eq('is_active', true)
      .eq('is_available', true)

    if (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`)
    }

    // Get unique categories
    const categories = Array.from(new Set(data?.map((item: any) => item.category) || []))
    return categories.sort()
  }

  // Get single product by ID
  async getProductById(productId: string) {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('is_active', true)
      .eq('is_available', true)
      .single()

    if (error) {
      throw new Error(`Failed to fetch product: ${error.message}`)
    }

    return data
  }

  // Check product availability and stock
  async checkProductAvailability(productId: string, requestedQuantity: number) {
    const { data, error } = await this.supabase
      .from('products')
      .select('stock_quantity, min_order_quantity, max_order_quantity')
      .eq('id', productId)
      .eq('is_available', true)
      .single()

    if (error) {
      throw new Error(`Failed to check product availability: ${error.message}`)
    }

    const availability = {
      inStock: (data as any).stock_quantity >= requestedQuantity,
      requestedQuantity,
      availableStock: (data as any).stock_quantity,
      minOrder: (data as any).min_order_quantity || 1,
      maxOrder: (data as any).max_order_quantity || (data as any).stock_quantity,
    }

    return availability
  }

  // Subscribe to real-time product updates
  subscribeToProductUpdates(callback: (payload: any) => void) {
    return this.supabase
      .channel('product-catalog-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
        },
        callback
      )
      .subscribe()
  }

  // Get products with pagination
  async getProductsPaginated(
    page: number = 1,
    limit: number = 50,
    filters: ProductFilterInput = {}
  ) {
    const offset = (page - 1) * limit

    let query = this.supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .eq('is_available', true)
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (filters.category) {
      query = query.eq('category', filters.category)
    }

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    if (filters.min_price !== undefined) {
      query = query.gte('price', filters.min_price)
    }

    if (filters.max_price !== undefined) {
      query = query.lte('price', filters.max_price)
    }

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch products: ${error.message}`)
    }

    return {
      products: data || [],
      totalCount: count || 0,
      currentPage: page,
      totalPages: Math.ceil((count || 0) / limit),
      hasNextPage: page < Math.ceil((count || 0) / limit),
      hasPreviousPage: page > 1,
    }
  }

  // Format price in GEL currency
  formatPrice(price: number): string {
    return `${price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ₾`
  }

  // Get product stock status
  getStockStatus(product: Product) {
    if (product.stock_quantity <= 0) {
      return { status: 'out_of_stock', label: 'მარაგი არ არის', color: 'red' }
    }

    if (product.stock_quantity <= product.min_stock_level) {
      return { status: 'low_stock', label: 'ცოტა მარაგი', color: 'yellow' }
    }

    return { status: 'in_stock', label: 'მარაგშია', color: 'green' }
  }

  // Search products with debounced query
  async searchProducts(query: string, limit: number = 10) {
    const { data, error } = await this.supabase
      .from('products')
      .select('id, name, price, unit, image_url')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .eq('is_active', true)
      .eq('is_available', true)
      .order('name', { ascending: true })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to search products: ${error.message}`)
    }

    return data || []
  }
}

export const productService = new ProductService()
