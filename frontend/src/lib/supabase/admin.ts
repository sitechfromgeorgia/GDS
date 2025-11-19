import { logger } from '@/lib/logger'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getEnvVar } from '@/lib/env'
import type { Database } from './client'

// Environment variables
const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL')
// Service role key is retrieved but validated separately in validateAdminConfig()
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Admin client configuration options
const adminClientOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
    flowType: 'pkce' as const,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'X-Client-Info': 'georgian-distribution-system-admin@1.0.0',
      'X-Admin-Client': 'true',
    },
  },
}

// Validate admin configuration
function validateAdminConfig() {
  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable for admin client')
  }
  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable for admin client')
  }

  if (typeof window !== 'undefined') {
    throw new Error('Admin client can only be used in server-side contexts')
  }

  logger.info('Admin client configured', {
    environment: supabaseUrl.includes('localhost') ? 'local development' : 'production',
  })
}

// Create admin client (server-side only)
export function createAdminClient(): SupabaseClient {
  try {
    validateAdminConfig()

    const adminClient = createClient(supabaseUrl, serviceRoleKey, adminClientOptions)

    // Add admin-specific error handling
    adminClient.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        logger.info('Admin client authenticated as service role')
      }
    })

    return adminClient
  } catch (error) {
    logger.error('Failed to create admin client:', error)
    throw error
  }
}

// Singleton admin client instance
let adminClientInstance: SupabaseClient | null = null

export function getAdminClient(): SupabaseClient {
  if (typeof window !== 'undefined') {
    throw new Error('Admin client can only be accessed from server-side contexts')
  }

  if (!adminClientInstance) {
    adminClientInstance = createAdminClient()
  }

  return adminClientInstance
}

// Export for use in admin services
export const adminClient = getAdminClient()

// Admin-specific database operations
export class AdminDatabase {
  private client = getAdminClient()

  // User management operations
  async createUser(userData: Database['public']['Tables']['profiles']['Insert']) {
    const { data, error } = await this.client.from('profiles').insert(userData).select().single()

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`)
    }

    return data
  }

  async updateUser(userId: string, updates: Database['public']['Tables']['profiles']['Update']) {
    const { data, error } = await this.client
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`)
    }

    return data
  }

  async deleteUser(userId: string) {
    const { error } = await this.client.from('profiles').delete().eq('id', userId)

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`)
    }

    return { success: true }
  }

  // Product management operations
  async createProduct(productData: Database['public']['Tables']['products']['Insert']) {
    const { data, error } = await this.client.from('products').insert(productData).select().single()

    if (error) {
      throw new Error(`Failed to create product: ${error.message}`)
    }

    return data
  }

  async bulkUpdateProductPrices(
    priceUpdates: Array<{
      id: string
      price: number
    }>
  ) {
    const updates = priceUpdates.map(({ id, price }) => ({
      id,
      price,
      updated_at: new Date().toISOString(),
    }))

    const { data, error } = await this.client
      .from('products')
      .upsert(updates, { onConflict: 'id' })
      .select()

    if (error) {
      throw new Error(`Failed to bulk update product prices: ${error.message}`)
    }

    return data
  }

  async softDeleteProducts(productIds: string[]) {
    const { data, error } = await this.client
      .from('products')
      .update({
        active: false,
        updated_at: new Date().toISOString(),
      })
      .in('id', productIds)
      .select()

    if (error) {
      throw new Error(`Failed to soft delete products: ${error.message}`)
    }

    return data
  }

  // Order management operations
  async getAllOrdersWithDetails() {
    const { data, error } = await this.client
      .from('orders')
      .select(
        `
        *,
        restaurant:restaurants(full_name, restaurant_name, phone),
        driver:drivers(full_name, phone),
        order_items(*, product:products(name, unit))
      `
      )
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch orders with details: ${error.message}`)
    }

    return data
  }

  async updateOrderStatus(
    orderId: string,
    status: Database['public']['Tables']['orders']['Update']['status']
  ) {
    const { data, error } = await this.client
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update order status: ${error.message}`)
    }

    return data
  }

  async assignDriver(orderId: string, driverId: string | null) {
    const { data, error } = await this.client
      .from('orders')
      .update({
        driver_id: driverId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to assign driver: ${error.message}`)
    }

    return data
  }

  // Bulk operations
  async bulkUpdateUserStatus(userIds: string[], isActive: boolean) {
    const { data, error } = await this.client
      .from('profiles')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .in('id', userIds)
      .select()

    if (error) {
      throw new Error(`Failed to bulk update user status: ${error.message}`)
    }

    return data
  }

  async bulkDeleteOrders(orderIds: string[]) {
    const { error } = await this.client.from('orders').delete().in('id', orderIds)

    if (error) {
      throw new Error(`Failed to bulk delete orders: ${error.message}`)
    }

    return { success: true, deletedCount: orderIds.length }
  }

  // Analytics and reporting
  async getDetailedAnalytics(dateFrom?: string, dateTo?: string) {
    let ordersQuery = this.client.from('orders').select(`
        *,
        restaurant:restaurants(full_name, restaurant_name),
        order_items(*, product:products(name, category))
      `)

    if (dateFrom) {
      ordersQuery = ordersQuery.gte('created_at', dateFrom)
    }
    if (dateTo) {
      ordersQuery = ordersQuery.lte('created_at', dateTo)
    }

    const { data: orders, error: ordersError } = await ordersQuery.order('created_at', {
      ascending: false,
    })

    if (ordersError) {
      throw new Error(`Failed to fetch analytics data: ${ordersError.message}`)
    }

    // Process analytics data
    const analytics = this.processAnalyticsData(orders || [])
    return analytics
  }

  private processAnalyticsData(orders: any[]) {
    const totalOrders = orders.length
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0)

    // Group by status
    const ordersByStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {})

    // Group by date
    const revenueByDay = orders.reduce(
      (acc, order) => {
        const date = new Date(order.created_at).toISOString().split('T')[0]
        if (date) {
          acc[date] = (acc[date] || 0) + (order.total_amount || 0)
        }
        return acc
      },
      {} as Record<string, number>
    )

    // Top products by revenue
    const productRevenue = orders
      .flatMap((order) => order.order_items || [])
      .reduce(
        (acc, item) => {
          const productName = item.product?.name || 'Unknown'
          acc[productName] = (acc[productName] || 0) + item.price * item.quantity
          return acc
        },
        {} as Record<string, number>
      )

    const topProducts = Object.entries(productRevenue)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([name, revenue], index) => ({
        name,
        revenue,
        rank: index + 1,
      }))

    return {
      totalOrders,
      totalRevenue,
      ordersByStatus,
      revenueByDay,
      topProducts,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    }
  }

  // System operations
  async getSystemHealth() {
    const [ordersResult, productsResult, profilesResult] = await Promise.allSettled([
      this.client.from('orders').select('id').limit(1),
      this.client.from('products').select('id').limit(1),
      this.client.from('profiles').select('id').limit(1),
    ])

    return {
      database: true, // Admin client connection is successful if we reach here
      ordersAccessible: ordersResult.status === 'fulfilled',
      productsAccessible: productsResult.status === 'fulfilled',
      profilesAccessible: profilesResult.status === 'fulfilled',
      timestamp: new Date().toISOString(),
    }
  }
}

// Export admin database class
export const adminDatabase = new AdminDatabase()

// Health check for admin client
export async function checkAdminConnection(): Promise<boolean> {
  try {
    const health = await adminDatabase.getSystemHealth()
    return Object.values(health).every((v) => v === true || v === 'success')
  } catch (error) {
    logger.error('Admin client connection check failed:', error)
    return false
  }
}

// Environment info for admin client
export function getAdminEnvironmentInfo() {
  return {
    url: supabaseUrl,
    hasServiceRoleKey: !!serviceRoleKey,
    isLocal: supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1'),
    clientInfo: 'georgian-distribution-system-admin@1.0.0',
  }
}

// Export types for use in admin services
export type { Database }
