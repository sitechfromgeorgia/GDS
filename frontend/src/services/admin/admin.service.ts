<<<<<<< HEAD
import { logger } from '@/lib/logger'
import { createBrowserClient } from '@/lib/supabase'
import { getAdminClient, adminDatabase, checkAdminConnection, getAdminEnvironmentInfo } from '@/lib/supabase/admin'
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
          orderTrends: this.calculateOrderTrends([])
        }
      } catch (error) {
        logger.warn('Failed to get detailed analytics from admin client, falling back to regular client', { error })
      }
    }

    // Fallback to regular client
    const { data: orders } = await this.supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: restaurants } = await this.supabase
      .from('restaurants')
      .select('*')

    const { data: drivers } = await this.supabase
      .from('drivers')
      .select('*')

    const { data: products } = await this.supabase
      .from('products')
      .select('*')

    // Calculate analytics
    const totalOrders = orders?.length || 0
    const activeRestaurants = restaurants?.length || 0
    const activeDrivers = drivers?.length || 0
    const totalProducts = products?.length || 0
    const totalRevenue = orders?.reduce((sum, order) => sum + ((order as any).total_amount || 0), 0) || 0

    return {
      totalOrders,
      activeRestaurants,
      activeDrivers,
      totalProducts,
      totalRevenue,
      ordersByStatus: this.groupOrdersByStatus(orders || []),
      revenueByDay: this.calculateRevenueByDay(orders || []),
      topProducts: this.getTopProducts(products || []),
      orderTrends: this.calculateOrderTrends(orders || [])
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
=======
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/database'

// Define types
export type Product = Database['public']['Tables']['products']['Row']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type ProductUpdate = Database['public']['Tables']['products']['Update']

export type Restaurant = Database['public']['Tables']['restaurants']['Row']
export type RestaurantInsert = Database['public']['Tables']['restaurants']['Insert']
export type RestaurantUpdate = Database['public']['Tables']['restaurants']['Update']

export type Driver = Database['public']['Tables']['drivers']['Row']
export type DriverInsert = Database['public']['Tables']['drivers']['Insert']
export type DriverUpdate = Database['public']['Tables']['drivers']['Update']

export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

// Service class for admin operations
export class AdminService {
  // Product Management
  async getAllProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching products:', error)
      return []
>>>>>>> 4f46816d3369e63516557dedd905a7027f3ba306
    }

    return data || []
  }

<<<<<<< HEAD
  async getAllRestaurants() {
    const { data, error } = await this.supabase
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch restaurants: ${error.message}`)
    }

    return data || []
  }

  async getAllDrivers() {
    const { data, error } = await this.supabase
      .from('drivers')
      .select('*')
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
    const { data, error } = await (this.supabase
      .from('profiles') as any)
      .update({ role })
      .eq('id', userId)
=======
  async createProduct(product: ProductInsert): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
>>>>>>> 4f46816d3369e63516557dedd905a7027f3ba306
      .select()
      .single()

    if (error) {
<<<<<<< HEAD
      throw new Error(`Failed to update user role: ${error.message}`)
=======
      console.error('Error creating product:', error)
      return null
>>>>>>> 4f46816d3369e63516557dedd905a7027f3ba306
    }

    return data
  }

<<<<<<< HEAD
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

    const { data, error } = await (this.supabase
      .from('products') as any)
      .insert([productData])
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create product: ${error.message}`)
    }

    return data
  }

  async updateProduct(productId: string, updates: Database['public']['Tables']['products']['Update']) {
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

    const { data, error } = await (this.supabase
      .from('products') as any)
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

    const { error } = await this.supabase
=======
  async updateProduct(productId: string, updates: ProductUpdate): Promise<boolean> {
    const { error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId)

    if (error) {
      console.error('Error updating product:', error)
      return false
    }

    return true
  }

  async deleteProduct(productId: string): Promise<boolean> {
    const { error } = await supabase
>>>>>>> 4f46816d3369e63516557dedd905a7027f3ba306
      .from('products')
      .delete()
      .eq('id', productId)

    if (error) {
<<<<<<< HEAD
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
          adminClientAvailable: true
        }
      } catch (error) {
        logger.warn('Admin client health check failed', { error })
      }
    }

    // Fallback to regular health checks
    const [ordersResult, productsResult] = await Promise.allSettled([
      this.supabase.from('orders').select('id').limit(1),
      this.supabase.from('products').select('id').limit(1)
    ])

    return {
      database: ordersResult.status === 'fulfilled' && productsResult.status === 'fulfilled',
      ordersAccessible: ordersResult.status === 'fulfilled',
      productsAccessible: productsResult.status === 'fulfilled',
      hasAdminClient: false,
      adminClientAvailable: this.isServerContext
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

  async updateOrderStatus(orderId: string, status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'completed') {
    if (!this.isServerContext || !this.adminClient) {
      throw new Error('Admin operations require server context')
    }

    return await adminDatabase.updateOrderStatus(orderId, status as Database['public']['Tables']['orders']['Update']['status'])
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
      timestamp: new Date().toISOString()
    }
  }

  async getPerformanceMetrics() {
    const { data: orders } = await this.supabase
      .from('orders')
      .select('created_at, status, updated_at')

    // Calculate performance metrics
    const totalOrders = orders?.length || 0
    const completedOrders = orders?.filter(order => (order as any).status === 'delivered' || (order as any).status === 'completed') || []
    const avgCompletionTime = this.calculateAverageCompletionTime(completedOrders)

    return {
      totalOrders,
      completedOrders: completedOrders.length,
      averageCompletionTime: avgCompletionTime,
      completionRate: totalOrders > 0 ? (completedOrders.length / totalOrders) * 100 : 0
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

    orders.forEach(order => {
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
      revenue: (Math.random() * 1000) + 100
    }))
  }

  private calculateOrderTrends(orders: any[]) {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split('T')[0]
    })

    return last7Days.reverse().map(date => ({
      date,
      orders: orders.filter(order => 
        order.created_at.startsWith(date)
      ).length
    }))
  }

  private calculateAverageCompletionTime(completedOrders: any[]): number {
    if (completedOrders.length === 0) return 0

    const completionTimes = completedOrders
      .filter(order => order.updated_at)
      .map(order => {
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
        ...data.map(row => headers.map(header => row[header] || '').join(','))
      ].join('\n')

      return csvContent
    }

    return ''
  }
}

export const adminService = new AdminService()
=======
      console.error('Error deleting product:', error)
      return false
    }

    return true
  }

  async getProductById(productId: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()

    if (error) {
      console.error('Error fetching product:', error)
      return null
    }

    return data
  }

  // Restaurant Management
  async getAllRestaurants(): Promise<Restaurant[]> {
    const { data, error } = await supabase
      .from('restaurants')
      .select(`
        *,
        user:users(email)
      `)
      .order('restaurant_name', { ascending: true })

    if (error) {
      console.error('Error fetching restaurants:', error)
      return []
    }

    return data || []
  }

  async createRestaurant(restaurant: RestaurantInsert): Promise<Restaurant | null> {
    const { data, error } = await supabase
      .from('restaurants')
      .insert(restaurant)
      .select()
      .single()

    if (error) {
      console.error('Error creating restaurant:', error)
      return null
    }

    return data
  }

  async updateRestaurant(restaurantId: string, updates: RestaurantUpdate): Promise<boolean> {
    const { error } = await supabase
      .from('restaurants')
      .update(updates)
      .eq('id', restaurantId)

    if (error) {
      console.error('Error updating restaurant:', error)
      return false
    }

    return true
  }

  async deleteRestaurant(restaurantId: string): Promise<boolean> {
    const { error } = await supabase
      .from('restaurants')
      .delete()
      .eq('id', restaurantId)

    if (error) {
      console.error('Error deleting restaurant:', error)
      return false
    }

    return true
  }

  async getRestaurantById(restaurantId: string): Promise<Restaurant | null> {
    const { data, error } = await supabase
      .from('restaurants')
      .select(`
        *,
        user:users(email)
      `)
      .eq('id', restaurantId)
      .single()

    if (error) {
      console.error('Error fetching restaurant:', error)
      return null
    }

    return data
  }

  // Driver Management
  async getAllDrivers(): Promise<Driver[]> {
    const { data, error } = await supabase
      .from('drivers')
      .select(`
        *,
        user:users(email)
      `)
      .order('full_name', { ascending: true })

    if (error) {
      console.error('Error fetching drivers:', error)
      return []
    }

    return data || []
  }

  async createDriver(driver: DriverInsert): Promise<Driver | null> {
    const { data, error } = await supabase
      .from('drivers')
      .insert(driver)
      .select()
      .single()

    if (error) {
      console.error('Error creating driver:', error)
      return null
    }

    return data
  }

  async updateDriver(driverId: string, updates: DriverUpdate): Promise<boolean> {
    const { error } = await supabase
      .from('drivers')
      .update(updates)
      .eq('id', driverId)

    if (error) {
      console.error('Error updating driver:', error)
      return false
    }

    return true
  }

  async deleteDriver(driverId: string): Promise<boolean> {
    const { error } = await supabase
      .from('drivers')
      .delete()
      .eq('id', driverId)

    if (error) {
      console.error('Error deleting driver:', error)
      return false
    }

    return true
  }

  async getDriverById(driverId: string): Promise<Driver | null> {
    const { data, error } = await supabase
      .from('drivers')
      .select(`
        *,
        user:users(email)
      `)
      .eq('id', driverId)
      .single()

    if (error) {
      console.error('Error fetching driver:', error)
      return null
    }

    return data
  }

  // User Management
  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        restaurant:restaurants(restaurant_name),
        driver:drivers(full_name)
      `)
      .order('email', { ascending: true })

    if (error) {
      console.error('Error fetching users:', error)
      return []
    }

    return data || []
  }

  async createUser(user: UserInsert): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .insert(user)
      .select()
      .single()

    if (error) {
      console.error('Error creating user:', error)
      return null
    }

    return data
  }

  async updateUser(userId: string, updates: UserUpdate): Promise<boolean> {
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)

    if (error) {
      console.error('Error updating user:', error)
      return false
    }

    return true
  }

  async deleteUser(userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (error) {
      console.error('Error deleting user:', error)
      return false
    }

    return true
  }

  async getUserById(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        restaurant:restaurants(restaurant_name),
        driver:drivers(full_name)
      `)
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user:', error)
      return null
    }

    return data
  }

  // Analytics and Reporting
  async getSystemStats(): Promise<{
    totalProducts: number
    totalRestaurants: number
    totalDrivers: number
    totalOrders: number
    pendingOrders: number
    completedOrders: number
  }> {
    try {
      const [products, restaurants, drivers, orders, pendingOrders, completedOrders] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('restaurants').select('id', { count: 'exact', head: true }),
        supabase.from('drivers').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'completed')
      ])

      return {
        totalProducts: products.count || 0,
        totalRestaurants: restaurants.count || 0,
        totalDrivers: drivers.count || 0,
        totalOrders: orders.count || 0,
        pendingOrders: pendingOrders.count || 0,
        completedOrders: completedOrders.count || 0
      }
    } catch (error) {
      console.error('Error fetching system stats:', error)
      return {
        totalProducts: 0,
        totalRestaurants: 0,
        totalDrivers: 0,
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0
      }
    }
  }

  // Bulk Operations
  async bulkUpdateProducts(updates: { id: string; data: ProductUpdate }[]): Promise<boolean> {
    try {
      for (const update of updates) {
        const { error } = await supabase
          .from('products')
          .update(update.data)
          .eq('id', update.id)

        if (error) {
          console.error('Error in bulk update:', error)
          return false
        }
      }
      return true
    } catch (error) {
      console.error('Error in bulk product update:', error)
      return false
    }
  }

  async bulkDeleteProducts(productIds: string[]): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .in('id', productIds)

      if (error) {
        console.error('Error in bulk delete:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in bulk product delete:', error)
      return false
    }
  }

  // Search and Filter
  async searchProducts(query: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${query}%,name_ka.ilike.%${query}%,description.ilike.%${query}%`)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error searching products:', error)
      return []
    }

    return data || []
  }

  async searchRestaurants(query: string): Promise<Restaurant[]> {
    const { data, error } = await supabase
      .from('restaurants')
      .select(`
        *,
        user:users(email)
      `)
      .or(`restaurant_name.ilike.%${query}%,phone.ilike.%${query}%`)
      .order('restaurant_name', { ascending: true })

    if (error) {
      console.error('Error searching restaurants:', error)
      return []
    }

    return data || []
  }

  async searchDrivers(query: string): Promise<Driver[]> {
    const { data, error } = await supabase
      .from('drivers')
      .select(`
        *,
        user:users(email)
      `)
      .or(`full_name.ilike.%${query}%,phone.ilike.%${query}%`)
      .order('full_name', { ascending: true })

    if (error) {
      console.error('Error searching drivers:', error)
      return []
    }

    return data || []
  }

  // Export Data
  async exportProducts(): Promise<Product[]> {
    return this.getAllProducts()
  }

  async exportRestaurants(): Promise<Restaurant[]> {
    return this.getAllRestaurants()
  }

  async exportDrivers(): Promise<Driver[]> {
    return this.getAllDrivers()
  }

  // Real-time subscriptions for admin dashboard
  subscribeToProducts(callback: (payload: any) => void) {
    const channel = supabase
      .channel('admin-products')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        callback
      )
      .subscribe()

    return channel
  }

  subscribeToUsers(callback: (payload: any) => void) {
    const channel = supabase
      .channel('admin-users')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users'
        },
        callback
      )
      .subscribe()

    return channel
  }

  subscribeToOrders(callback: (payload: any) => void) {
    const channel = supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        callback
      )
      .subscribe()

    return channel
  }
}
>>>>>>> 4f46816d3369e63516557dedd905a7027f3ba306
