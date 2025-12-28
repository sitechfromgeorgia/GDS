import { createBrowserClient } from '@/lib/supabase'
import { z } from 'zod'

// Zod schemas for validation
export const orderItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unit: z.string().min(1, 'Unit is required'),
  special_instructions: z.string().optional(),
})

export const orderCreateSchema = z.object({
  restaurant_id: z.string().uuid(),
  delivery_address: z.string().min(1, 'Delivery address is required'),
  special_instructions: z.string().optional(),
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
})

export const orderUpdateSchema = z.object({
  status: z
    .enum(['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'completed'])
    .optional(),
  driver_id: z.string().uuid().optional(),
  total_amount: z.number().min(0).optional(),
  special_instructions: z.string().optional(),
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
      throw new Error(`Invalid order data: ${result.error.message}`)
    }

    // Calculate total amount
    const totalAmount = orderData.items.reduce((sum, item) => {
      // In a real implementation, you'd fetch product prices from the database
      // For now, we'll assume a default price
      return sum + item.quantity * 10 // Default price of 10 per unit
    }, 0)

    const { data, error } = await (this.supabase.from('orders') as any)
      .insert([
        {
          restaurant_id: orderData.restaurant_id,
          delivery_address: orderData.delivery_address,
          special_instructions: orderData.special_instructions,
          status: 'pending',
          total_amount: totalAmount,
        },
      ])
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create order: ${error.message}`)
    }

    // Create order items
    const orderItems = orderData.items.map((item) => ({
      order_id: data.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.quantity * 10, // Default price
    }))

    const { error: itemsError } = await (this.supabase.from('order_items') as any).insert(
      orderItems
    )

    if (itemsError) {
      // If order items creation fails, delete the order
      await this.supabase.from('orders').delete().eq('id', data.id)
      throw new Error(`Failed to create order items: ${itemsError.message}`)
    }

    return data
  }

  async getOrdersForRole(userId: string, role: string) {
    let query = this.supabase
      .from('orders')
      .select(
        `
        *,
        restaurants(name),
        drivers(name)
      `
      )
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
    }

    return data || []
  }

  async getOrderById(orderId: string) {
    const { data, error } = await this.supabase
      .from('orders')
      .select(
        `
        *,
        order_items(
          *,
          products(name, name_ka)
        ),
        restaurants(name, name_ka),
        drivers(name)
      `
      )
      .eq('id', orderId)
      .single()

    if (error) {
      throw new Error(`Failed to fetch order: ${error.message}`)
    }

    return data
  }

  async updateOrderStatus(orderId: string, status: string, driverId?: string) {
    const updateData: any = { status }

    if (driverId) {
      updateData.driver_id = driverId
    }

    const { data, error } = await (this.supabase.from('orders') as any)
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update order: ${error.message}`)
    }

    return data
  }

  async getOrderAnalytics() {
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

    // Calculate analytics
    const totalOrders = orders?.length || 0
    const activeRestaurants = restaurants?.length || 0
    const activeDrivers = drivers?.length || 0
    const totalRevenue =
      orders?.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0) || 0

    return {
      totalOrders,
      activeRestaurants,
      activeDrivers,
      totalRevenue,
      ordersByStatus: this.groupOrdersByStatus(orders || []),
      revenueByDay: this.calculateRevenueByDay(orders || []),
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
    const { error } = await this.supabase.from('orders').delete().eq('id', orderId)

    if (error) {
      throw new Error(`Failed to delete order: ${error.message}`)
    }

    return { success: true }
  }

  async assignDriver(orderId: string, driverId: string) {
    const { data, error } = await (this.supabase.from('orders') as any)
      .update({
        driver_id: driverId,
        status: 'confirmed',
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
