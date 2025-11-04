<<<<<<< HEAD
import { createBrowserClient } from '@/lib/supabase'
import { z } from 'zod'

// Zod schemas for validation
export const orderItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unit: z.string().min(1, 'Unit is required'),
  special_instructions: z.string().optional()
})

export const orderCreateSchema = z.object({
  restaurant_id: z.string().uuid(),
  delivery_address: z.string().min(1, 'Delivery address is required'),
  special_instructions: z.string().optional(),
  items: z.array(orderItemSchema).min(1, 'At least one item is required')
})

export const orderUpdateSchema = z.object({
  status: z.enum([
    'pending', 'confirmed', 'preparing', 'out_for_delivery', 
    'delivered', 'completed'
  ]).optional(),
  driver_id: z.string().uuid().optional(),
  total_amount: z.number().min(0).optional(),
  special_instructions: z.string().optional()
})

export type OrderItem = z.infer<typeof orderItemSchema>
export type OrderCreateInput = z.infer<typeof orderCreateSchema>
export type OrderUpdateInput = z.infer<typeof orderUpdateSchema>

export class OrderService {
  private supabase = createBrowserClient()

  async createOrder(orderData: OrderCreateInput) {
    // Validate order data
    const result = orderCreateSchema.safeParse(orderData)
    if (!result.success) {
      throw new Error('Invalid order data: ' + result.error.message)
    }

    // Calculate total amount
    const totalAmount = orderData.items.reduce((sum, item) => {
      // In a real implementation, you'd fetch product prices from the database
      // For now, we'll assume a default price
      return sum + (item.quantity * 10) // Default price of 10 per unit
    }, 0)

    const { data, error } = await (this.supabase
      .from('orders') as any)
      .insert([
        {
          restaurant_id: orderData.restaurant_id,
          delivery_address: orderData.delivery_address,
          special_instructions: orderData.special_instructions,
          status: 'pending',
          total_amount: totalAmount
        }
      ])
=======
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/database'

// Define types
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderInsert = Database['public']['Tables']['orders']['Insert']
export type OrderUpdate = Database['public']['Tables']['orders']['Update']

export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type OrderItemInsert = Database['public']['Tables']['order_items']['Insert']

export type Product = Database['public']['Tables']['products']['Row']

// Service class for order management
export class OrderService {
  // Create a new order
  async createOrder(orderData: OrderInsert): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .insert(orderData)
>>>>>>> 4f46816d3369e63516557dedd905a7027f3ba306
      .select()
      .single()

    if (error) {
<<<<<<< HEAD
      throw new Error(`Failed to create order: ${error.message}`)
    }

    // Create order items
    const orderItems = orderData.items.map(item => ({
      order_id: data.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.quantity * 10 // Default price
    }))

    const { error: itemsError } = await (this.supabase
      .from('order_items') as any)
      .insert(orderItems)

    if (itemsError) {
      // If order items creation fails, delete the order
      await this.supabase.from('orders').delete().eq('id', data.id)
      throw new Error(`Failed to create order items: ${itemsError.message}`)
=======
      console.error('Error creating order:', error)
      return null
>>>>>>> 4f46816d3369e63516557dedd905a7027f3ba306
    }

    return data
  }

<<<<<<< HEAD
  async getOrdersForRole(userId: string, role: string) {
    let query = this.supabase
      .from('orders')
      .select(`
        *,
        restaurants(name),
        drivers(name)
      `)
      .order('created_at', { ascending: false })

    switch (role) {
      case 'restaurant':
        query = query.eq('restaurant_id', userId)
        break
      case 'driver':
        query = query.eq('driver_id', userId)
        break
      case 'admin':
        // Admin sees all orders
        break
      case 'demo':
        // Demo sees limited orders
        query = query.limit(5)
        break
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch orders: ${error.message}`)
=======
  // Get orders for a restaurant
  async getRestaurantOrders(restaurantId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*),
        driver:drivers(full_name, phone)
      `)
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching restaurant orders:', error)
      return []
>>>>>>> 4f46816d3369e63516557dedd905a7027f3ba306
    }

    return data || []
  }

<<<<<<< HEAD
  async getOrderById(orderId: string) {
    const { data, error } = await this.supabase
      .from('orders')
      .select(`
        *,
        order_items(
          *,
          products(name, name_ka)
        ),
        restaurants(name, name_ka),
        drivers(name)
=======
  // Get orders for a driver
  async getDriverOrders(driverId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*),
        restaurant:restaurants(restaurant_name, phone)
      `)
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching driver orders:', error)
      return []
    }

    return data || []
  }

  // Get all orders (admin)
  async getAllOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*),
        restaurant:restaurants(restaurant_name, phone),
        driver:drivers(full_name, phone)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching all orders:', error)
      return []
    }

    return data || []
  }

  // Update order status
  async updateOrderStatus(orderId: string, status: string): Promise<boolean> {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)

    if (error) {
      console.error('Error updating order status:', error)
      return false
    }

    return true
  }

  // Assign driver to order
  async assignDriver(orderId: string, driverId: string): Promise<boolean> {
    const { error } = await supabase
      .from('orders')
      .update({ driver_id: driverId })
      .eq('id', orderId)

    if (error) {
      console.error('Error assigning driver:', error)
      return false
    }

    return true
  }

  // Get order by ID with details
  async getOrderById(orderId: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*),
        restaurant:restaurants(restaurant_name, phone),
        driver:drivers(full_name, phone)
>>>>>>> 4f46816d3369e63516557dedd905a7027f3ba306
      `)
      .eq('id', orderId)
      .single()

    if (error) {
<<<<<<< HEAD
      throw new Error(`Failed to fetch order: ${error.message}`)
=======
      console.error('Error fetching order:', error)
      return null
>>>>>>> 4f46816d3369e63516557dedd905a7027f3ba306
    }

    return data
  }

<<<<<<< HEAD
  async updateOrderStatus(orderId: string, status: string, driverId?: string) {
    const updateData: any = { status }
    
    if (driverId) {
      updateData.driver_id = driverId
    }

    const { data, error } = await (this.supabase
      .from('orders') as any)
      .update(updateData)
      .eq('id', orderId)
=======
  // Subscribe to real-time order updates
  subscribeToOrderUpdates(callback: (payload: any) => void) {
    const channel = supabase
      .channel('order-updates')
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

  // Subscribe to real-time order item updates
  subscribeToOrderItemUpdates(callback: (payload: any) => void) {
    const channel = supabase
      .channel('order-item-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items'
        },
        callback
      )
      .subscribe()

    return channel
  }

  // Cancel order
  async cancelOrder(orderId: string): Promise<boolean> {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId)

    if (error) {
      console.error('Error cancelling order:', error)
      return false
    }

    return true
  }

  // Complete order
  async completeOrder(orderId: string): Promise<boolean> {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', orderId)

    if (error) {
      console.error('Error completing order:', error)
      return false
    }

    return true
  }

  // Add order item
  async addOrderItem(orderItem: OrderItemInsert): Promise<OrderItem | null> {
    const { data, error } = await supabase
      .from('order_items')
      .insert(orderItem)
>>>>>>> 4f46816d3369e63516557dedd905a7027f3ba306
      .select()
      .single()

    if (error) {
<<<<<<< HEAD
      throw new Error(`Failed to update order: ${error.message}`)
=======
      console.error('Error adding order item:', error)
      return null
>>>>>>> 4f46816d3369e63516557dedd905a7027f3ba306
    }

    return data
  }

<<<<<<< HEAD
  async getOrderAnalytics() {
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

    // Calculate analytics
    const totalOrders = orders?.length || 0
    const activeRestaurants = restaurants?.length || 0
    const activeDrivers = drivers?.length || 0
    const totalRevenue = orders?.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0) || 0

    return {
      totalOrders,
      activeRestaurants,
      activeDrivers,
      totalRevenue,
      ordersByStatus: this.groupOrdersByStatus(orders || []),
      revenueByDay: this.calculateRevenueByDay(orders || [])
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

  async deleteOrder(orderId: string) {
    const { error } = await this.supabase
      .from('orders')
      .delete()
      .eq('id', orderId)

    if (error) {
      throw new Error(`Failed to delete order: ${error.message}`)
    }

    return { success: true }
  }

  async assignDriver(orderId: string, driverId: string) {
    const { data, error } = await (this.supabase
      .from('orders') as any)
      .update({
        driver_id: driverId,
        status: 'confirmed'
      })
      .eq('id', orderId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to assign driver: ${error.message}`)
    }

    return data
  }
}

export const orderService = new OrderService()
=======
  // Update order item
  async updateOrderItem(itemId: string, updates: Partial<OrderItem>): Promise<boolean> {
    const { error } = await supabase
      .from('order_items')
      .update(updates)
      .eq('id', itemId)

    if (error) {
      console.error('Error updating order item:', error)
      return false
    }

    return true
  }

  // Delete order item
  async deleteOrderItem(itemId: string): Promise<boolean> {
    const { error } = await supabase
      .from('order_items')
      .delete()
      .eq('id', itemId)

    if (error) {
      console.error('Error deleting order item:', error)
      return false
    }

    return true
  }

  // Get order items for an order
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    const { data, error } = await supabase
      .from('order_items')
      .select(`
        *,
        product:products(name, name_ka, price, unit)
      `)
      .eq('order_id', orderId)

    if (error) {
      console.error('Error fetching order items:', error)
      return []
    }

    return data || []
  }

  // Calculate order total
  async calculateOrderTotal(orderId: string): Promise<number> {
    const orderItems = await this.getOrderItems(orderId)
    return orderItems.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  // Update order total
  async updateOrderTotal(orderId: string, total: number): Promise<boolean> {
    const { error } = await supabase
      .from('orders')
      .update({ total_amount: total })
      .eq('id', orderId)

    if (error) {
      console.error('Error updating order total:', error)
      return false
    }

    return true
  }

  // Get order history for a restaurant
  async getOrderHistory(restaurantId: string, limit: number = 50): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*)
      `)
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching order history:', error)
      return []
    }

    return data || []
  }

  // Get pending orders
  async getPendingOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        restaurant:restaurants(restaurant_name, phone)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching pending orders:', error)
      return []
    }

    return data || []
  }

  // Confirm order
  async confirmOrder(orderId: string): Promise<boolean> {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'confirmed' })
      .eq('id', orderId)

    if (error) {
      console.error('Error confirming order:', error)
      return false
    }

    return true
  }

  // Price order
  async priceOrder(orderId: string, items: OrderItem[]): Promise<boolean> {
    // Update each item with pricing
    for (const item of items) {
      const { error } = await supabase
        .from('order_items')
        .update({
          price: item.price,
          total_price: item.price * item.quantity
        })
        .eq('id', item.id)

      if (error) {
        console.error('Error pricing order item:', error)
        return false
      }
    }

    // Update order status to priced
    const { error: orderError } = await supabase
      .from('orders')
      .update({ status: 'priced' })
      .eq('id', orderId)

    if (orderError) {
      console.error('Error pricing order:', orderError)
      return false
    }

    return true
  }
}
>>>>>>> 4f46816d3369e63516557dedd905a7027f3ba306
