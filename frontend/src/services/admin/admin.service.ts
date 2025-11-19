import { logger } from '@/lib/logger'
import { createBrowserClient } from '@/lib/supabase'
import {
  getAdminClient,
  adminDatabase,
  checkAdminConnection,
  getAdminEnvironmentInfo,
} from '@/lib/supabase/admin'
import { getEnvVar } from '@/lib/env'
import type { Database } from '@/lib/supabase'

export class AdminService {
  private supabase = createBrowserClient()
  private isServerContext = typeof window === 'undefined'
  private adminClient = this.isServerContext ? getAdminClient() : null

  async getDashboardAnalytics() {
    // Use service role client for more comprehensive data in server context
    if (this.isServerContext && this.adminClient) {
      try {
        const detailedAnalytics = await adminDatabase.getDetailedAnalytics()
        return {
          totalOrders: detailedAnalytics.totalOrders,
          totalRevenue: detailedAnalytics.totalRevenue,
          ordersByStatus: detailedAnalytics.ordersByStatus,
          revenueByDay: detailedAnalytics.revenueByDay,
          topProducts: detailedAnalytics.topProducts,
          averageOrderValue: detailedAnalytics.averageOrderValue,
          // Fallback data for UI compatibility
          activeRestaurants: 0,
          activeDrivers: 0,
          totalProducts: 0,
          orderTrends: this.calculateOrderTrends([]),
        }
      } catch (error) {
        logger.warn(
          'Failed to get detailed analytics from admin client, falling back to regular client',
          { error }
        )
      }
    }

    // Fallback to regular client
    const { data: orders } = await this.supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: restaurants } = await this.supabase
      .from('profiles' as any)
      .select('*')
      .eq('role', 'restaurant')

    const { data: drivers } = await this.supabase
      .from('profiles' as any)
      .select('*')
      .eq('role', 'driver')

    const { data: products } = await this.supabase.from('products').select('*')

    // Calculate analytics
    const totalOrders = orders?.length || 0
    const activeRestaurants = restaurants?.length || 0
    const activeDrivers = drivers?.length || 0
    const totalProducts = products?.length || 0
    const totalRevenue =
      orders?.reduce((sum: number, order: any) => sum + ((order as any).total_amount || 0), 0) || 0

    return {
      totalOrders,
      activeRestaurants,
      activeDrivers,
      totalProducts,
      totalRevenue,
      ordersByStatus: this.groupOrdersByStatus(orders || []),
      revenueByDay: this.calculateRevenueByDay(orders || []),
      topProducts: this.getTopProducts(products || []),
      orderTrends: this.calculateOrderTrends(orders || []),
    }
  }

  async getAllUsers() {
    // Use service role client in server context for more complete data
    if (this.isServerContext && this.adminClient) {
      try {
        const { data, error } = await this.adminClient
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          logger.warn('Admin client failed, falling back to regular client:', error)
        } else {
          return data || []
        }
      } catch (error) {
        logger.warn('Admin client error, falling back to regular client', { error })
      }
    }

    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`)
    }

    return data || []
  }

  async getAllRestaurants() {
    const { data, error } = await this.supabase
      .from('profiles' as any)
      .select('*')
      .eq('role', 'restaurant')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch restaurants: ${error.message}`)
    }

    return data || []
  }

  async getAllDrivers() {
    const { data, error } = await this.supabase
      .from('profiles' as any)
      .select('*')
      .eq('role', 'driver')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch drivers: ${error.message}`)
    }

    return data || []
  }

  async getAllProducts() {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch products: ${error.message}`)
    }

    return data || []
  }

  async updateUserRole(userId: string, role: string) {
    const { data, error } = await (this.supabase.from('profiles') as any)
      .update({ role })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update user role: ${error.message}`)
    }

    return data
  }

  async createProduct(productData: {
    name: string
    name_ka: string
    description: string
    description_ka: string
    category: string
    unit: string
    price: number
    image_url?: string
  }) {
    // Use service role client in server context for privileged operations
    if (this.isServerContext && this.adminClient) {
      try {
        return await adminDatabase.createProduct(productData as any)
      } catch (error) {
        logger.warn('Admin client failed, falling back to regular client', { error })
      }
    }

    const { data, error } = await (this.supabase.from('products') as any)
      .insert([productData])
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create product: ${error.message}`)
    }

    return data
  }

  async updateProduct(
    productId: string,
    updates: Database['public']['Tables']['products']['Update']
  ) {
    // Use service role client in server context for privileged operations
    if (this.isServerContext && this.adminClient) {
      try {
        const { data, error } = await this.adminClient
          .from('products')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', productId)
          .select()
          .single()

        if (error) {
          logger.warn('Admin client failed, falling back to regular client:', error)
        } else {
          return data
        }
      } catch (error) {
        logger.warn('Admin client error, falling back to regular client', { error })
      }
    }

    const { data, error } = await (this.supabase.from('products') as any)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', productId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update product: ${error.message}`)
    }

    return data
  }

  async deleteProduct(productId: string) {
    // Use service role client in server context for privileged operations
    if (this.isServerContext && this.adminClient) {
      try {
        const { data, error } = await this.adminClient
          .from('products')
          .update({ active: false, updated_at: new Date().toISOString() })
          .eq('id', productId)
          .select()
          .single()

        if (error) {
          logger.warn('Admin client failed, falling back to regular client:', error)
        } else {
          return { success: true, data }
        }
      } catch (error) {
        logger.warn('Admin client error, falling back to regular client', { error })
      }
    }

    const { error } = await this.supabase.from('products').delete().eq('id', productId)

    if (error) {
      throw new Error(`Failed to delete product: ${error.message}`)
    }

    return { success: true }
  }

  async getSystemHealth() {
    // Try admin client first in server context
    if (this.isServerContext && this.adminClient) {
      try {
        const adminHealth = await adminDatabase.getSystemHealth()
        return {
          ...adminHealth,
          hasAdminClient: true,
          adminClientAvailable: true,
        }
      } catch (error) {
        logger.warn('Admin client health check failed', { error })
      }
    }

    // Fallback to regular health checks
    const [ordersResult, productsResult] = await Promise.allSettled([
      this.supabase.from('orders').select('id').limit(1),
      this.supabase.from('products').select('id').limit(1),
    ])

    return {
      database: ordersResult.status === 'fulfilled' && productsResult.status === 'fulfilled',
      ordersAccessible: ordersResult.status === 'fulfilled',
      productsAccessible: productsResult.status === 'fulfilled',
      hasAdminClient: false,
      adminClientAvailable: this.isServerContext,
    }
  }

  // Admin-specific methods using service role
  async getAllOrdersWithDetails() {
    if (!this.isServerContext || !this.adminClient) {
      throw new Error('Admin operations require server context')
    }

    return await adminDatabase.getAllOrdersWithDetails()
  }

  async bulkUpdateProductPrices(priceUpdates: Array<{ id: string; price: number }>) {
    if (!this.isServerContext || !this.adminClient) {
      throw new Error('Bulk operations require server context')
    }

    return await adminDatabase.bulkUpdateProductPrices(priceUpdates)
  }

  async bulkUpdateUserStatus(userIds: string[], isActive: boolean) {
    if (!this.isServerContext || !this.adminClient) {
      throw new Error('Bulk operations require server context')
    }

    return await adminDatabase.bulkUpdateUserStatus(userIds, isActive)
  }

  async assignDriver(orderId: string, driverId: string | null) {
    if (!this.isServerContext || !this.adminClient) {
      throw new Error('Admin operations require server context')
    }

    return await adminDatabase.assignDriver(orderId, driverId)
  }

  async updateOrderStatus(
    orderId: string,
    status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'completed'
  ) {
    if (!this.isServerContext || !this.adminClient) {
      throw new Error('Admin operations require server context')
    }

    return await adminDatabase.updateOrderStatus(
      orderId,
      status as Database['public']['Tables']['orders']['Update']['status']
    )
  }

  // Environment and connection info
  async getConnectionInfo() {
    const hasAdminClient = this.isServerContext
    const adminConnection = hasAdminClient ? await checkAdminConnection() : false
    const adminEnvInfo = hasAdminClient ? getAdminEnvironmentInfo() : null

    return {
      clientType: this.isServerContext ? 'server' : 'browser',
      hasAdminClient,
      adminConnection,
      adminEnvironment: adminEnvInfo,
      environment: getEnvVar('NEXT_PUBLIC_ENVIRONMENT'),
      timestamp: new Date().toISOString(),
    }
  }

  async getPerformanceMetrics() {
    const { data: orders } = await this.supabase
      .from('orders')
      .select('created_at, status, updated_at')

    // Calculate performance metrics
    const totalOrders = orders?.length || 0
    const completedOrders =
      orders?.filter(
        (order: any) => (order as any).status === 'delivered' || (order as any).status === 'completed'
      ) || []
    const avgCompletionTime = this.calculateAverageCompletionTime(completedOrders)

    return {
      totalOrders,
      completedOrders: completedOrders.length,
      averageCompletionTime: avgCompletionTime,
      completionRate: totalOrders > 0 ? (completedOrders.length / totalOrders) * 100 : 0,
    }
  }

  private groupOrdersByStatus(orders: any[]) {
    return orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {})
  }

  private calculateRevenueByDay(orders: any[]) {
    const revenueByDay: { [key: string]: number } = {}

    orders.forEach((order: any) => {
      const date = new Date(order.created_at).toISOString().split('T')[0]
      if (date) {
        revenueByDay[date] = (revenueByDay[date] || 0) + (order.total_amount || 0)
      }
    })

    return revenueByDay
  }

  private getTopProducts(products: any[]) {
    // Mock implementation - in real app, this would come from sales data
    return products.slice(0, 5).map((product, index) => ({
      ...product,
      rank: index + 1,
      salesCount: Math.floor(Math.random() * 100) + 10,
      revenue: Math.random() * 1000 + 100,
    }))
  }

  private calculateOrderTrends(orders: any[]) {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split('T')[0]
    })

    return last7Days.reverse().map((date) => ({
      date,
      orders: orders.filter((order: any) => order.created_at.startsWith(date)).length,
    }))
  }

  private calculateAverageCompletionTime(completedOrders: any[]): number {
    if (completedOrders.length === 0) return 0

    const completionTimes = completedOrders
      .filter((order: any) => order.updated_at)
      .map((order: any) => {
        const created = new Date(order.created_at)
        const completed = new Date(order.updated_at)
        return (completed.getTime() - created.getTime()) / (1000 * 60) // minutes
      })

    if (completionTimes.length === 0) return 0

    const avgMs = completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
    return Math.round(avgMs)
  }

  async exportData(type: 'orders' | 'users' | 'products') {
    let data: any[] = []

    switch (type) {
      case 'orders':
        const { data: ordersData } = await this.supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
        data = ordersData || []
        break
      case 'users':
        const { data: usersData } = await this.supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
        data = usersData || []
        break
      case 'products':
        const { data: productsData } = await this.supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false })
        data = productsData || []
        break
    }

    // Convert to CSV format
    if (data.length > 0) {
      const headers = Object.keys(data[0])
      const csvContent = [
        headers.join(','),
        ...data.map((row) => headers.map((header) => row[header] || '').join(',')),
      ].join('\n')

      return csvContent
    }

    return ''
  }
}

export const adminService = new AdminService()
