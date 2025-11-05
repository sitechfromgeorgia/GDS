'use client'
import { logger } from '@/lib/logger'

import { createBrowserClient } from '@/lib/supabase'
import {
  OrderSubmissionInput,
  OrderSubmissionResult,
  OrderWithItems,
  CartToOrderConversion,
  OrderConfirmation,
  OrderSubmissionEvent,
  OrderSubmissionStats,
  BulkOrderSubmission,
  BulkOrderResult,
} from '@/types/order-submission'
import { Cart } from '@/types/cart'
import { RealtimeCartService } from './realtime-cart.service'

// Create Supabase client instance
const supabase = createBrowserClient()

export interface OrderSubmissionConfig {
  restaurantId: string
  userId?: string
  enableNotifications?: boolean
  autoConfirm?: boolean
  rushDeliveryAvailable?: boolean
  requireDeliveryAddress?: boolean
  maxOrderValue?: number
  minOrderValue?: number
}

export class OrderSubmissionService {
  private config: OrderSubmissionConfig
  private realtimeCartService: RealtimeCartService

  constructor(config: OrderSubmissionConfig) {
    this.config = {
      enableNotifications: true,
      autoConfirm: false,
      rushDeliveryAvailable: false,
      requireDeliveryAddress: true,
      maxOrderValue: 10000,
      minOrderValue: 100,
      ...config,
    }

    this.realtimeCartService = new RealtimeCartService({
      enableRealTime: true,
      userId: this.config.userId,
    })
  }

  /**
   * Submit an order from cart data
   */
  async submitOrder(input: OrderSubmissionInput): Promise<OrderSubmissionResult> {
    try {
      // Validate input
      const validationResult = await this.validateOrderSubmission(input)
      if (!validationResult.isValid) {
        return {
          success: false,
          totalAmount: 0,
          message: 'მონაცემების ვალიდაცია ვერ მოხერხდა',
          validationErrors: validationResult.errors,
        }
      }

      // Get cart data
      const cart = await this.getCartData(input.cartSessionId)
      if (!cart || cart.items.length === 0) {
        return {
          success: false,
          totalAmount: 0,
          message: 'კალათა ცარიეა ან არ მოიძებნა',
        }
      }

      // Convert cart to order items
      const orderItems = await this.convertCartToOrderItems(cart)

      // Create order
      const order = await this.createOrder({
        ...input,
        items: orderItems,
      })

      // Clear cart after successful order
      await this.clearCartAfterOrder(cart.id)

      // Generate order confirmation
      const confirmation = await this.generateOrderConfirmation(order)

      return {
        success: true,
        orderId: order.id,
        orderNumber: order.order_number,
        estimatedDeliveryDate: confirmation.estimatedDeliveryTime,
        totalAmount: order.total_amount,
        message: 'შეკვეთა წარმატებით გაიგზავნა',
      }
    } catch (error) {
      logger.error('Order submission failed:', error)
      return {
        success: false,
        totalAmount: 0,
        message: error instanceof Error ? error.message : 'შეკვეთის გაგზავნა ვერ მოხერხდა',
      }
    }
  }

  /**
   * Validate order submission data
   */
  async validateOrderSubmission(input: OrderSubmissionInput): Promise<{
    isValid: boolean
    errors: Array<{
      field: string
      code: string
      message: string
      georgianMessage: string
    }>
  }> {
    const errors: Array<{
      field: string
      code: string
      message: string
      georgianMessage: string
    }> = []

    // Required fields validation
    if (!input.restaurantId) {
      errors.push({
        field: 'restaurantId',
        code: 'REQUIRED_FIELD',
        message: 'Restaurant ID is required',
        georgianMessage: 'რესტორნის ID აუცილებელია',
      })
    }

    // Cart session validation
    if (!input.cartSessionId) {
      errors.push({
        field: 'cartSessionId',
        code: 'REQUIRED_FIELD',
        message: 'Cart session is required',
        georgianMessage: 'კალათის სესია აუცილებელია',
      })
    }

    // Delivery address validation
    if (this.config.requireDeliveryAddress && !input.deliveryAddress) {
      errors.push({
        field: 'deliveryAddress',
        code: 'REQUIRED_FIELD',
        message: 'Delivery address is required',
        georgianMessage: 'მიწოდების მისამართი აუცილებელია',
      })
    }

    // Contact phone validation
    if (!input.contactPhone) {
      errors.push({
        field: 'contactPhone',
        code: 'REQUIRED_FIELD',
        message: 'Contact phone is required',
        georgianMessage: 'საკონტაქტო ტელეფონი აუცილებელია',
      })
    }

    // Order value validation
    if (input.cartSessionId) {
      const cart = await this.getCartData(input.cartSessionId)
      if (cart) {
        const totalValue = cart.totalPrice

        if (totalValue < this.config.minOrderValue!) {
          errors.push({
            field: 'totalAmount',
            code: 'MIN_ORDER_VALUE',
            message: `Minimum order value is ${this.config.minOrderValue}`,
            georgianMessage: `შეკვეთის მინიმალური თანხა ${this.config.minOrderValue} ლარია`,
          })
        }

        if (totalValue > this.config.maxOrderValue!) {
          errors.push({
            field: 'totalAmount',
            code: 'MAX_ORDER_VALUE',
            message: `Maximum order value is ${this.config.maxOrderValue}`,
            georgianMessage: `შეკვეთის მაქსიმალური თანხა ${this.config.maxOrderValue} ლარია`,
          })
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Get cart data from cart session
   */
  private async getCartData(cartSessionId?: string): Promise<Cart | null> {
    try {
      if (cartSessionId) {
        // Get cart from cart service
        const originalService = new RealtimeCartService({
          enableRealTime: false, // Don't need real-time for order submission
        })

        // This would need to be adjusted to work with specific session
        // For now, return null to indicate implementation needed
        return null
      }

      return null
    } catch (error) {
      logger.error('Failed to get cart data:', error)
      return null
    }
  }

  /**
   * Convert cart items to order items
   */
  private async convertCartToOrderItems(cart: Cart): Promise<any[]> {
    const orderItems = []

    for (const cartItem of cart.items) {
      orderItems.push({
        product_id: cartItem.productId,
        quantity: cartItem.quantity,
        price: cartItem.unitPrice,
        notes: cartItem.notes,
      })
    }

    return orderItems
  }

  /**
   * Create order in database
   */
  private async createOrder(data: {
    restaurantId: string
    cartSessionId?: string
    specialInstructions?: string
    preferredDeliveryDate?: string
    contactPhone?: string
    deliveryAddress?: string
    priority?: 'normal' | 'urgent'
    paymentMethod?: 'cash' | 'card' | 'transfer'
    items: any[]
  }): Promise<any> {
    // Calculate delivery fee
    const deliveryFee =
      data.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0) >= 500
        ? 0
        : 25

    // Create order
    const { data: order, error: orderError } = await (supabase.from('orders') as any)
      .insert({
        restaurant_id: data.restaurantId,
        status: 'pending',
        total_amount:
          data.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0) +
          deliveryFee,
        special_instructions: data.specialInstructions,
        preferred_delivery_date: data.preferredDeliveryDate,
        contact_phone: data.contactPhone,
        delivery_address: data.deliveryAddress,
        priority: data.priority || 'normal',
        payment_method: data.paymentMethod || 'cash',
        delivery_fee: deliveryFee,
      })
      .select()
      .single()

    if (orderError) {
      throw new Error(`Failed to create order: ${orderError.message}`)
    }

    // Create order items
    const orderItems = data.items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
    }))

    const { error: itemsError } = await (supabase.from('order_items') as any).insert(orderItems)

    if (itemsError) {
      // Clean up order if items creation fails
      await (supabase.from('orders') as any).delete().eq('id', order.id)
      throw new Error(`Failed to create order items: ${itemsError.message}`)
    }

    return order
  }

  /**
   * Clear cart after successful order
   */
  private async clearCartAfterOrder(cartSessionId: string): Promise<void> {
    try {
      const service = new RealtimeCartService({
        enableRealTime: false,
      })
      // Implementation would need session ID access
      // service.clearCart()
    } catch (error) {
      logger.warn('Failed to clear cart after order', { error })
    }
  }

  /**
   * Generate order confirmation
   */
  private async generateOrderConfirmation(order: any): Promise<OrderConfirmation> {
    // Get restaurant info
    const { data: restaurant } = await (supabase.from('profiles') as any)
      .select('full_name')
      .eq('id', order.restaurant_id)
      .single()

    // Get order items
    const { data: orderItems } = await (supabase.from('order_items') as any)
      .select(
        `
        *,
        products (
          name,
          name_ka,
          unit
        )
      `
      )
      .eq('order_id', order.id)

    return {
      orderId: order.id,
      orderNumber: order.order_number || order.id.slice(0, 8).toUpperCase(),
      restaurantName: restaurant?.full_name || 'რესტორანი',
      totalAmount: order.total_amount,
      estimatedDeliveryTime: this.calculateEstimatedDeliveryTime(order),
      status: order.status,
      items:
        orderItems?.map((item: any) => ({
          id: item.id,
          productId: item.product_id,
          productName: item.products.name,
          productNameKa: item.products.name_ka,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity,
          unit: item.products.unit,
          notes: item.notes,
        })) || [],
      contactInfo: {
        phone: order.contact_phone,
        address: order.delivery_address,
        specialInstructions: order.special_instructions,
      },
    }
  }

  /**
   * Calculate estimated delivery time
   */
  private calculateEstimatedDeliveryTime(order: any): string {
    const now = new Date()
    const estimatedMinutes = order.priority === 'urgent' ? 45 : 90
    const deliveryTime = new Date(now.getTime() + estimatedMinutes * 60000)

    return deliveryTime.toLocaleString('ka-GE', {
      hour: '2-digit',
      minute: '2-digit',
      day: 'numeric',
      month: 'long',
    })
  }

  /**
   * Submit bulk orders
   */
  async submitBulkOrders(bulkSubmission: BulkOrderSubmission): Promise<BulkOrderResult> {
    const successfulOrders: string[] = []
    const failedOrders: Array<{ input: OrderSubmissionInput; error: string; errorCode: string }> =
      []

    for (const orderInput of bulkSubmission.orders) {
      try {
        const result = await this.submitOrder(orderInput)
        if (result.success && result.orderId) {
          successfulOrders.push(result.orderId)
        } else {
          failedOrders.push({
            input: orderInput,
            error: result.message,
            errorCode: 'SUBMISSION_FAILED',
          })
        }
      } catch (error) {
        failedOrders.push({
          input: orderInput,
          error: error instanceof Error ? error.message : 'Unknown error',
          errorCode: 'SYSTEM_ERROR',
        })
      }
    }

    const totalAmount = successfulOrders.length * 500 // Simplified calculation

    return {
      successfulOrders,
      failedOrders,
      totalAmount,
      estimatedDeliveryWindow: this.calculateBulkDeliveryWindow(successfulOrders.length),
    }
  }

  /**
   * Calculate bulk delivery window
   */
  private calculateBulkDeliveryWindow(orderCount: number): string {
    const now = new Date()
    const startTime = new Date(now.getTime() + 60 * 60000) // 1 hour from now
    const endTime = new Date(startTime.getTime() + orderCount * 30 * 60000) // 30 min per order

    return `${startTime.toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })}`
  }

  /**
   * Track order status
   */
  async trackOrder(orderId: string): Promise<OrderWithItems | null> {
    try {
      const { data: order, error } = await (supabase.from('orders') as any)
        .select(
          `
          *,
          order_items (
            *,
            products (
              name,
              name_ka,
              unit
            )
          )
        `
        )
        .eq('id', orderId)
        .single()

      if (error) {
        throw new Error(`Failed to fetch order: ${error.message}`)
      }

      return {
        id: order.id,
        restaurantId: order.restaurant_id,
        status: order.status,
        totalAmount: order.total_amount,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        specialInstructions: order.special_instructions,
        preferredDeliveryDate: order.preferred_delivery_date,
        contactPhone: order.contact_phone,
        deliveryAddress: order.delivery_address,
        orderNumber: order.order_number,
        items:
          order.order_items?.map((item: any) => ({
            id: item.id,
            productId: item.product_id,
            productName: item.products.name,
            productNameKa: item.products.name_ka,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
            unit: item.products.unit,
            notes: item.notes,
          })) || [],
      }
    } catch (error) {
      logger.error('Failed to track order:', error)
      return null
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(
    orderId: string,
    reason?: string
  ): Promise<{ success: boolean; message: string; totalAmount: number }> {
    try {
      const { data, error } = await (supabase.from('orders') as any)
        .update({
          status: 'cancelled',
          cancellation_reason: reason,
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to cancel order: ${error.message}`)
      }

      return {
        success: true,
        message: 'შეკვეთა წარმატებით გაუქმდა',
        totalAmount: data?.total_amount || 0,
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'შეკვეთის გაუქმება ვერ მოხერხდა',
        totalAmount: 0,
      }
    }
  }

  /**
   * Get order submission statistics
   */
  async getOrderStats(): Promise<OrderSubmissionStats> {
    try {
      const { data: orders, error } = await (supabase.from('orders') as any).select(
        'status, total_amount, order_items(product_id, products(name))'
      )

      if (error) {
        throw new Error(`Failed to fetch order stats: ${error.message}`)
      }

      const totalOrders = orders?.length || 0
      const pendingOrders = orders?.filter((o: any) => o.status === 'pending').length || 0
      const completedOrders = orders?.filter((o: any) => o.status === 'completed').length || 0
      const averageOrderValue =
        totalOrders > 0
          ? orders!.reduce((sum: number, o: any) => sum + o.total_amount, 0) / totalOrders
          : 0

      // Popular products calculation
      const productCounts: Record<string, { name: string; count: number }> = {}
      orders?.forEach((order: any) => {
        order.order_items?.forEach((item: any) => {
          const productId = item.product_id
          const productName = item.products?.name || 'Unknown'
          if (!productCounts[productId]) {
            productCounts[productId] = { name: productName, count: 0 }
          }
          productCounts[productId].count++
        })
      })

      const popularProducts = Object.entries(productCounts)
        .map(([productId, data]) => ({
          productId,
          productName: data.name,
          orderCount: data.count,
        }))
        .sort((a, b) => b.orderCount - a.orderCount)
        .slice(0, 10)

      return {
        totalOrders,
        pendingOrders,
        completedOrders,
        averageOrderValue,
        popularProducts,
      }
    } catch (error) {
      logger.error('Failed to get order stats:', error)
      return {
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        averageOrderValue: 0,
        popularProducts: [],
      }
    }
  }
}

// Service factory function
export function createOrderSubmissionService(
  config: OrderSubmissionConfig
): OrderSubmissionService {
  return new OrderSubmissionService(config)
}

// Default service instance
export const orderSubmissionService = createOrderSubmissionService({
  restaurantId: '', // Will be set when used
  enableNotifications: true,
  autoConfirm: false,
})
