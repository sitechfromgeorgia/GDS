import { logger } from '@/lib/logger'
import { createBrowserClient } from '@/lib/supabase'
import {
  RestaurantOrder,
  Product,
  RestaurantProduct,
  CartItem,
  RestaurantMetrics,
  OrderFilters,
  ProductFilters,
} from '@/types/restaurant'

// Create Supabase client instance
const supabase = createBrowserClient()

// Type for database product with optional restaurant-specific fields
type DatabaseProduct = Product & {
  is_available?: boolean
  max_order_quantity?: number
  min_order_quantity?: number
}

type AnyObject = Record<string, any>

// Define proper interfaces for database types
interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  total_price: number
  notes?: string
  products?: {
    name: string
    unit?: string
  }
}

export class RestaurantUtils {
  static async getOrders(filters?: OrderFilters): Promise<RestaurantOrder[]> {
    let query = (supabase as any)
      .from('orders')
      .select(
        `
        *,
        order_items (
          *,
          products (
            name,
            unit
          )
        ),
        profiles!orders_driver_id_fkey (
          full_name
        )
      `
      )
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters?.status?.length) {
      query = query.in('status', filters.status)
    }

    if (filters?.date_range) {
      query = query
        .gte('created_at', filters.date_range.start)
        .lte('created_at', filters.date_range.end)
    }

    if (filters?.min_amount) {
      query = query.gte('total_amount', filters.min_amount)
    }

    if (filters?.max_amount) {
      query = query.lte('total_amount', filters.max_amount)
    }

    if (filters?.search) {
      query = query.ilike('delivery_address', `%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) throw error

    return data.map((order: any) => ({
      ...order,
      items: order.order_items || [],
      driver_name: order.profiles?.full_name,
      total_amount: order.total_amount ?? undefined,
    })) as RestaurantOrder[]
  }

  static async getProducts(filters?: ProductFilters): Promise<RestaurantProduct[]> {
    let query = supabase.from('products').select('*').order('name')

    if (filters?.category?.length) {
      query = query.in('category', filters.category)
    }

    if (filters?.price_range) {
      query = query.gte('price', filters.price_range.min).lte('price', filters.price_range.max)
    }

    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`)
    }

    if (filters?.available_only !== undefined) {
      query = query.eq('is_available', filters.available_only)
    } else {
      // Default to only available products
      query = query.eq('is_available', true)
    }

    const { data, error } = await query
    if (error) throw error

    // Convert to RestaurantProduct with missing fields

    return (data || []).map((product: any) => ({
      ...product,
      is_available: product.is_active ?? false,
      max_order_quantity: product.max_order_quantity ?? 100,
      min_order_quantity: product.min_order_quantity ?? 1,
    })) as RestaurantProduct[]
  }

  static async createOrder(orderData: {
    items: CartItem[]
    delivery_address: string
    delivery_time?: string
    special_instructions?: string
  }): Promise<RestaurantOrder> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const totalAmount = orderData.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    )

    // Create order

    const { data: order, error: orderError } = await (supabase as any)
      .from('orders')
      .insert({
        restaurant_id: user.id,
        total_amount: totalAmount,
        delivery_address: orderData.delivery_address,
        delivery_time: orderData.delivery_time,
        notes: orderData.special_instructions,
        status: 'pending',
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Create order items
    const orderItems = orderData.items.map((item) => ({
      order_id: order.id,
      product_id: item.product.id,
      quantity: item.quantity,
      unit_price: item.product.price,
      total_price: item.product.price * item.quantity,
      notes: item.notes,
    }))

    const { error: itemsError } = await (supabase as any).from('order_items').insert(orderItems)

    if (itemsError) throw itemsError

    return order as RestaurantOrder
  }

  static async updateOrderStatus(
    orderId: string,
    status:
      | 'pending'
      | 'confirmed'
      | 'priced'
      | 'assigned'
      | 'out_for_delivery'
      | 'delivered'
      | 'completed'
      | 'cancelled'
  ): Promise<void> {
    const { error } = await (supabase as any)
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (error) throw error
  }

  static async getRestaurantMetrics(): Promise<RestaurantMetrics> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get orders for this restaurant

    const { data: orders, error } = await (supabase as any)
      .from('orders')
      .select(
        `
        *,
        order_items (
          quantity,
          products (
            name
          )
        )
      `
      )
      .eq('restaurant_id', user.id)

    if (error) throw error

    const totalOrders = orders.length

    const pendingOrders = orders.filter((o: any) => o.status === 'pending').length

    const completedOrders = orders.filter((o: any) =>
      ['delivered', 'completed'].includes(o.status)
    ).length

    const totalSpent = orders.reduce(
      (sum: number, order: any) => sum + (order.total_amount || 0),
      0
    )
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0

    // Calculate most ordered products
    const productCounts: Record<string, number> = {}

    orders.forEach((order: any) => {
      order.order_items?.forEach((item: OrderItem) => {
        const productName = item.products?.name || 'Unknown'
        productCounts[productName] = (productCounts[productName] || 0) + item.quantity
      })
    })

    const mostOrderedProducts = Object.entries(productCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([product_name, quantity]) => ({ product_name, quantity }))

    // Delivery performance (mock data for now)
    const deliveryPerformance = {
      on_time_deliveries: Math.floor(completedOrders * 0.85),
      late_deliveries: Math.floor(completedOrders * 0.15),
      average_delivery_time: 45, // minutes
    }

    return {
      total_orders: totalOrders,
      pending_orders: pendingOrders,
      completed_orders: completedOrders,
      total_spent: totalSpent,
      average_order_value: averageOrderValue,
      most_ordered_products: mostOrderedProducts,
      delivery_performance: deliveryPerformance,
    }
  }

  static async getCartFromStorage(): Promise<CartItem[]> {
    if (typeof window === 'undefined') return []

    try {
      const cartData = localStorage.getItem('restaurant_cart')
      return cartData ? JSON.parse(cartData) : []
    } catch {
      return []
    }
  }

  static async saveCartToStorage(cart: CartItem[]): Promise<void> {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem('restaurant_cart', JSON.stringify(cart))
    } catch (error) {
      logger.error('Failed to save cart to storage:', error)
    }
  }

  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ka-GE', {
      style: 'currency',
      currency: 'GEL',
    }).format(amount)
  }

  static formatDate(date: string): string {
    return new Intl.DateTimeFormat('ka-GE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  }

  static getStatusColor(status: RestaurantOrder['status']): string {
    const colors: Record<RestaurantOrder['status'], string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      priced: 'bg-purple-100 text-purple-800',
      assigned: 'bg-indigo-100 text-indigo-800',
      out_for_delivery: 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }
}
