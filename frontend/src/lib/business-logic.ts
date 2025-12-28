import type { Database } from '@/types/database'

type Order = Database['public']['Tables']['orders']['Row']
type OrderItem = Database['public']['Tables']['order_items']['Row']
type Product = Database['public']['Tables']['products']['Row']

export interface OrderWithItems extends Order {
  order_items: (OrderItem & {
    products: Product
  })[]
}

export interface ShoppingListItem {
  product_id: string
  product_name: string
  category: string
  unit: string
  total_quantity: number
  orders_count: number
  estimated_cost: number
  estimated_revenue: number
  profit_margin: number
}

export interface ProfitSummary {
  total_cost: number
  total_revenue: number
  total_profit: number
  profit_margin: number
  order_count: number
  average_order_value: number
}

/**
 * Business logic utilities for order management
 */
export class OrderBusinessLogic {
  /**
   * Calculate profit for a single order
   */
  static calculateOrderProfit(order: OrderWithItems): number {
    return order.order_items.reduce((totalProfit, item) => {
      const cost = (item.cost_price || 0) * item.quantity
      const revenue = (item.selling_price || 0) * item.quantity
      return totalProfit + (revenue - cost)
    }, 0)
  }

  /**
   * Calculate total cost for an order
   */
  static calculateOrderCost(order: OrderWithItems): number {
    return order.order_items.reduce((total, item) => {
      return total + (item.cost_price || 0) * item.quantity
    }, 0)
  }

  /**
   * Calculate total revenue for an order
   */
  static calculateOrderRevenue(order: OrderWithItems): number {
    return order.order_items.reduce((total, item) => {
      return total + (item.selling_price || 0) * item.quantity
    }, 0)
  }

  /**
   * Generate shopping list from pending orders (Admin view)
   */
  static generateShoppingList(orders: OrderWithItems[]): ShoppingListItem[] {
    const productMap = new Map<string, ShoppingListItem>()

    // Only include orders that need to be fulfilled (confirmed, priced, assigned)
    const activeOrders = orders.filter((order) =>
      ['confirmed', 'priced', 'assigned', 'out_for_delivery'].includes(order.status)
    )

    activeOrders.forEach((order) => {
      order.order_items.forEach((item) => {
        const product = item.products
        const existing = productMap.get(item.product_id)

        if (existing) {
          existing.total_quantity += item.quantity
          existing.orders_count += 1
          existing.estimated_cost += (item.cost_price || 0) * item.quantity
          existing.estimated_revenue += (item.selling_price || 0) * item.quantity
        } else {
          productMap.set(item.product_id, {
            product_id: item.product_id,
            product_name: product.name,
            category: product.category,
            unit: product.unit,
            total_quantity: item.quantity,
            orders_count: 1,
            estimated_cost: (item.cost_price || 0) * item.quantity,
            estimated_revenue: (item.selling_price || 0) * item.quantity,
            profit_margin: 0,
          })
        }
      })
    })

    // Calculate profit margins
    productMap.forEach((item) => {
      item.profit_margin =
        item.estimated_cost > 0
          ? ((item.estimated_revenue - item.estimated_cost) / item.estimated_cost) * 100
          : 0
    })

    return Array.from(productMap.values()).sort((a, b) => b.total_quantity - a.total_quantity)
  }

  /**
   * Calculate profit summary for multiple orders
   */
  static calculateProfitSummary(orders: OrderWithItems[]): ProfitSummary {
    let totalCost = 0
    let totalRevenue = 0
    let orderCount = 0

    orders.forEach((order) => {
      if (order.status === 'completed') {
        totalCost += this.calculateOrderCost(order)
        totalRevenue += this.calculateOrderRevenue(order)
        orderCount += 1
      }
    })

    const totalProfit = totalRevenue - totalCost
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
    const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0

    return {
      total_cost: totalCost,
      total_revenue: totalRevenue,
      total_profit: totalProfit,
      profit_margin: profitMargin,
      order_count: orderCount,
      average_order_value: averageOrderValue,
    }
  }

  /**
   * Validate order lifecycle transitions
   */
  static validateStatusTransition(
    currentStatus: Order['status'],
    newStatus: Order['status']
  ): {
    valid: boolean
    reason?: string
  } {
    const validTransitions: Record<Order['status'], Order['status'][]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['priced', 'cancelled'],
      priced: ['assigned', 'cancelled'],
      assigned: ['out_for_delivery', 'cancelled'],
      out_for_delivery: ['delivered'],
      delivered: ['completed'],
      completed: [], // Terminal state
      cancelled: [], // Terminal state
    }

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      return {
        valid: false,
        reason: `Invalid transition from ${currentStatus} to ${newStatus}`,
      }
    }

    return { valid: true }
  }

  /**
   * Check if order can be cancelled by user role
   */
  static canCancelOrder(
    order: Order,
    userRole: 'admin' | 'restaurant' | 'driver',
    userId: string
  ): {
    canCancel: boolean
    reason?: string
  } {
    // Admins can cancel any order
    if (userRole === 'admin') {
      return { canCancel: true }
    }

    // Restaurants can only cancel their own pending orders
    if (userRole === 'restaurant' && order.restaurant_id === userId && order.status === 'pending') {
      return { canCancel: true }
    }

    // Drivers cannot cancel orders
    if (userRole === 'driver') {
      return {
        canCancel: false,
        reason: 'Drivers cannot cancel orders',
      }
    }

    return {
      canCancel: false,
      reason: 'Unauthorized to cancel this order',
    }
  }

  /**
   * Calculate estimated delivery time based on order items and distance
   */
  static estimateDeliveryTime(orderItems: OrderItem[], distanceKm: number = 5): number {
    // Base time for preparation and pickup
    let totalMinutes = 15

    // Add time based on items (assume 2 minutes per item)
    totalMinutes += orderItems.length * 2

    // Add time based on distance (assume 3 minutes per km)
    totalMinutes += distanceKm * 3

    // Add buffer time
    totalMinutes += 10

    return Math.max(totalMinutes, 30) // Minimum 30 minutes
  }

  /**
   * Generate order summary for notifications
   */
  static generateOrderSummary(order: OrderWithItems): string {
    const itemCount = order.order_items.reduce((sum, item) => sum + item.quantity, 0)
    const totalValue = this.calculateOrderRevenue(order)

    return `${itemCount} items • ₾${totalValue.toFixed(2)}`
  }

  /**
   * Check if order is overdue for delivery
   */
  static isOrderOverdue(order: Order, maxDeliveryHours: number = 2): boolean {
    if (order.status !== 'out_for_delivery') {
      return false
    }

    const outForDeliveryTime = new Date(order.updated_at)
    const now = new Date()
    const hoursElapsed = (now.getTime() - outForDeliveryTime.getTime()) / (1000 * 60 * 60)

    return hoursElapsed > maxDeliveryHours
  }

  /**
   * Calculate order priority based on value and urgency
   */
  static calculateOrderPriority(order: OrderWithItems): 'low' | 'medium' | 'high' | 'urgent' {
    const totalValue = this.calculateOrderRevenue(order)
    const itemCount = order.order_items.length
    const isOverdue = this.isOrderOverdue(order)

    if (isOverdue || totalValue > 500 || itemCount > 20) {
      return 'urgent'
    }

    if (totalValue > 200 || itemCount > 10) {
      return 'high'
    }

    if (totalValue > 50 || itemCount > 3) {
      return 'medium'
    }

    return 'low'
  }

  /**
   * Validate order pricing (ensure selling price > cost price)
   */
  static validatePricing(orderItems: OrderItem[]): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    orderItems.forEach((item, index) => {
      if (!item.cost_price || !item.selling_price) {
        errors.push(`Item ${index + 1}: Missing pricing information`)
        return
      }

      if (item.selling_price <= item.cost_price) {
        errors.push(`Item ${index + 1}: Selling price must be greater than cost price`)
      }

      if (item.cost_price <= 0 || item.selling_price <= 0) {
        errors.push(`Item ${index + 1}: Prices must be positive`)
      }
    })

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Calculate bulk discount for large orders
   */
  static calculateBulkDiscount(order: OrderWithItems): number {
    const totalItems = order.order_items.reduce((sum, item) => sum + item.quantity, 0)
    const totalValue = this.calculateOrderRevenue(order)

    // 5% discount for orders over 50 items
    if (totalItems >= 50) {
      return 0.05
    }

    // 3% discount for orders over ₾300
    if (totalValue >= 300) {
      return 0.03
    }

    // 1% discount for orders over ₾100
    if (totalValue >= 100) {
      return 0.01
    }

    return 0
  }
}
