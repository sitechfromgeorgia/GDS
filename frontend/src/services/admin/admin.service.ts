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
    }

    return data || []
  }

  async createProduct(product: ProductInsert): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single()

    if (error) {
      console.error('Error creating product:', error)
      return null
    }

    return data
  }

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
      .from('products')
      .delete()
      .eq('id', productId)

    if (error) {
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