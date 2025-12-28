import { createBrowserClient } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'
import { CreateOrderInput } from '@/lib/validators/restaurant/order'
import { Database } from '@/types/restaurant-temp'

export class OrderService {
  private supabase = createBrowserClient()

  async createOrder(input: any) {
    // Using any for now to bypass strict type check until types are generated
    const {
      data: { user },
    } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // 1. Create the order
    const { data: order, error: orderError } = await this.supabase
      .from('orders')
      .insert({
        restaurant_id: user.id,
        delivery_address: input.deliveryAddress,
        contact_phone: input.contactPhone,
        special_instructions: input.comment,
        total_amount: input.totalAmount,
        status: 'pending',
      })
      .select()
      .single()

    if (orderError) throw orderError

    // 2. Create order items
    const orderItems = input.items.map((item: any) => ({
      order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.price,
    }))

    const { error: itemsError } = await this.supabase.from('order_items').insert(orderItems)

    if (itemsError) {
      // Rollback logic would go here (delete order)
      logger.error('Error creating order items:', itemsError)
      throw itemsError
    }

    return order
  }

  async getOrders() {
    const {
      data: { user },
    } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await this.supabase
      .from('orders')
      .select(
        `
        *,
        items:order_items (
          *,
          product:products (name)
        )
      `
      )
      .eq('restaurant_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  async getOrderById(orderId: string) {
    const { data, error } = await this.supabase
      .from('orders')
      .select(
        `
        *,
        items:order_items (
          *,
          product:products (name, unit, image_url)
        ),
        comments:order_comments (*)
      `
      )
      .eq('id', orderId)
      .single()

    if (error) throw error
    return data
  }
  subscribeToOrderStatus(orderId: string, callback: (status: string) => void) {
    return this.supabase
      .channel(`order-status-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload: any) => {
          if (payload.new?.status) {
            callback(payload.new.status)
          }
        }
      )
      .subscribe()
  }

  async addComment(orderId: string, content: string) {
    const {
      data: { user },
    } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await this.supabase
      .from('order_comments')
      .insert({
        order_id: orderId,
        user_id: user.id,
        content,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }
}

export const orderService = new OrderService()
