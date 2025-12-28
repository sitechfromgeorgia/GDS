import { logger } from '@/lib/logger'
import type { Database } from '@/types/database'
import { ORDER_STATUSES, USER_ROLES } from '@/constants'
import { OrderBusinessLogic } from './business-logic'
import type { OrderNotification } from './realtime'
import { orderRealtimeManager } from './realtime'
import { createServerClient } from '@/lib/supabase/server'

type Order = Database['public']['Tables']['orders']['Row']
type OrderUpdate = Database['public']['Tables']['orders']['Update']
type OrderStatus = (typeof ORDER_STATUSES)[keyof typeof ORDER_STATUSES]
type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES]

/**
 * Order status transition configuration
 */
interface StatusTransition {
  from: OrderStatus
  to: OrderStatus
  allowedRoles: UserRole[]
  requiresConfirmation?: boolean
  autoComplete?: boolean
  validationRules?: string[]
  notifications: {
    recipients: ('restaurant' | 'driver' | 'admin')[]
    priority: 'low' | 'medium' | 'high' | 'urgent'
    email?: boolean
    browser?: boolean
  }
}

/**
 * Order workflow configuration
 */
const ORDER_WORKFLOW: StatusTransition[] = [
  // Initial creation
  {
    from: 'pending',
    to: 'confirmed',
    allowedRoles: ['admin', 'restaurant'],
    notifications: {
      recipients: ['admin'],
      priority: 'low',
    },
  },

  // Admin pricing
  {
    from: 'confirmed',
    to: 'priced',
    allowedRoles: ['admin'],
    validationRules: ['has_total_amount', 'valid_pricing'],
    notifications: {
      recipients: ['restaurant', 'admin'],
      priority: 'medium',
    },
  },

  // Driver assignment
  {
    from: 'priced',
    to: 'assigned',
    allowedRoles: ['admin'],
    validationRules: ['has_driver'],
    notifications: {
      recipients: ['restaurant', 'driver', 'admin'],
      priority: 'high',
      browser: true,
    },
  },

  // Driver starts delivery
  {
    from: 'assigned',
    to: 'out_for_delivery',
    allowedRoles: ['driver'],
    validationRules: ['driver_assigned'],
    notifications: {
      recipients: ['restaurant', 'admin'],
      priority: 'high',
      browser: true,
    },
  },

  // Driver marks as delivered (first step of two-step confirmation)
  {
    from: 'out_for_delivery',
    to: 'delivered',
    allowedRoles: ['driver'],
    requiresConfirmation: true,
    notifications: {
      recipients: ['restaurant', 'admin'],
      priority: 'urgent',
      browser: true,
      email: true,
    },
  },

  // Restaurant confirms receipt (second step - completes the order)
  {
    from: 'delivered',
    to: 'completed',
    allowedRoles: ['restaurant'],
    autoComplete: true,
    notifications: {
      recipients: ['driver', 'admin'],
      priority: 'medium',
      email: true,
    },
  },

  // Cancellation (from any active state)
  {
    from: 'pending',
    to: 'cancelled',
    allowedRoles: ['admin', 'restaurant'],
    notifications: {
      recipients: ['admin', 'restaurant', 'driver'],
      priority: 'high',
      email: true,
    },
  },
  {
    from: 'confirmed',
    to: 'cancelled',
    allowedRoles: ['admin', 'restaurant'],
    notifications: {
      recipients: ['admin', 'restaurant', 'driver'],
      priority: 'high',
      email: true,
    },
  },
  {
    from: 'priced',
    to: 'cancelled',
    allowedRoles: ['admin'],
    notifications: {
      recipients: ['admin', 'restaurant', 'driver'],
      priority: 'high',
      email: true,
    },
  },
  {
    from: 'assigned',
    to: 'cancelled',
    allowedRoles: ['admin'],
    notifications: {
      recipients: ['admin', 'restaurant', 'driver'],
      priority: 'urgent',
      email: true,
    },
  },
]

/**
 * Order workflow validation result
 */
interface WorkflowValidation {
  valid: boolean
  reason?: string
  allowedTransitions?: OrderStatus[]
}

/**
 * Order status change result
 */
interface StatusChangeResult {
  success: boolean
  order?: Order
  error?: string
  notifications?: OrderNotification[]
}

/**
 * Order Workflow Engine
 * Manages the complete order lifecycle with validation, notifications, and automation
 */
export class OrderWorkflowEngine {
  /**
   * Validate if a status transition is allowed
   */
  static async validateTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
    userRole: UserRole,
    userId: string,
    order: Order
  ): Promise<WorkflowValidation> {
    // Find matching transition
    const transition = ORDER_WORKFLOW.find((t) => t.from === currentStatus && t.to === newStatus)

    if (!transition) {
      return {
        valid: false,
        reason: `Invalid transition from ${currentStatus} to ${newStatus}`,
      }
    }

    // Check role permissions
    if (!transition.allowedRoles.includes(userRole)) {
      return {
        valid: false,
        reason: `Role ${userRole} is not allowed to perform this transition`,
      }
    }

    // Check business rules
    if (transition.validationRules) {
      for (const rule of transition.validationRules) {
        const ruleResult = this.validateBusinessRule(rule, order, userId)
        if (!ruleResult.valid) {
          return ruleResult
        }
      }
    }

    // Note: Order access and authorization is handled by Supabase RLS policies
    // This workflow validation focuses on business rules, not security

    return { valid: true }
  }

  /**
   * Get all allowed transitions for current status and user
   */
  static async getAllowedTransitions(
    currentStatus: OrderStatus,
    userRole: UserRole,
    userId: string,
    order: Order
  ): Promise<OrderStatus[]> {
    const transitions = ORDER_WORKFLOW.filter(
      (t) => t.from === currentStatus && t.allowedRoles.includes(userRole)
    )

    const validTransitions: OrderStatus[] = []

    for (const transition of transitions) {
      const validation = await this.validateTransition(
        currentStatus,
        transition.to,
        userRole,
        userId,
        order
      )
      if (validation.valid) {
        validTransitions.push(transition.to)
      }
    }

    return validTransitions
  }

  /**
   * Execute a status change with full workflow processing
   */
  static async executeStatusChange(
    orderId: string,
    newStatus: OrderStatus,
    userId: string,
    userRole: UserRole,
    notes?: string,
    additionalData?: Record<string, unknown>
  ): Promise<StatusChangeResult> {
    try {
      // Get current order
      const supabase = await createServerClient()
      const { data: order, error: orderError } = (await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()) as { data: Order | null; error: any }

      if (orderError || !order) {
        return { success: false, error: 'Order not found' }
      }

      // Validate transition
      const validation = await this.validateTransition(
        order.status as OrderStatus,
        newStatus,
        userRole,
        userId,
        order
      )

      if (!validation.valid) {
        return { success: false, error: validation.reason }
      }

      // Prepare update data
      const updateData: Partial<Order> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      }

      // Add notes if provided
      if (notes) {
        updateData.notes = notes
      }

      // Add driver assignment if transitioning to assigned
      if (newStatus === ORDER_STATUSES.ASSIGNED && additionalData?.driver_id) {
        updateData.driver_id = additionalData.driver_id as string
      }

      // Execute the update
      const { data: updatedOrder, error: updateError } = (await (supabase as any)
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single()) as { data: Order | null; error: any }

      if (updateError) {
        logger.error('Failed to update order status:', updateError)
        return { success: false, error: 'Failed to update order status' }
      }

      if (!updatedOrder) {
        return { success: false, error: 'Order update returned no data' }
      }

      // Log the status change for audit
      await this.logStatusChange(order, updatedOrder, userId, notes)

      // Send notifications
      const notifications = await this.sendStatusChangeNotifications(
        order,
        updatedOrder,
        userId,
        userRole
      )

      // Handle automation (auto-complete, escalation, etc.)
      await this.handleWorkflowAutomation(updatedOrder, newStatus)

      return {
        success: true,
        order: updatedOrder,
        notifications,
      }
    } catch (error) {
      logger.error('Status change execution error:', error)
      return { success: false, error: 'Internal error during status change' }
    }
  }

  /**
   * Bulk status update for admin operations
   */
  static async executeBulkStatusChange(
    orderIds: string[],
    newStatus: OrderStatus,
    userId: string,
    notes?: string
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    }

    for (const orderId of orderIds) {
      const result = await this.executeStatusChange(
        orderId,
        newStatus,
        userId,
        USER_ROLES.ADMIN,
        notes
      )

      if (result.success) {
        results.success++
      } else {
        results.failed++
        results.errors.push(`Order ${orderId}: ${result.error}`)
      }
    }

    return results
  }

  /**
   * Handle workflow automation (escalation, auto-complete, etc.)
   */
  private static async handleWorkflowAutomation(
    order: Order,
    newStatus: OrderStatus
  ): Promise<void> {
    try {
      // Auto-complete orders that are delivered and confirmed
      if (newStatus === ORDER_STATUSES.DELIVERED) {
        // Schedule auto-completion after 24 hours if restaurant doesn't confirm
        setTimeout(
          async () => {
            await this.checkAndAutoCompleteOrder(order.id)
          },
          24 * 60 * 60 * 1000
        ) // 24 hours
      }

      // Escalate overdue orders
      if (newStatus === ORDER_STATUSES.OUT_FOR_DELIVERY) {
        setTimeout(
          async () => {
            await this.escalateOverdueOrder(order.id)
          },
          2 * 60 * 60 * 1000
        ) // 2 hours
      }
    } catch (error) {
      logger.error('Workflow automation error:', error)
    }
  }

  /**
   * Check and auto-complete orders that have been delivered but not confirmed
   */
  private static async checkAndAutoCompleteOrder(orderId: string): Promise<void> {
    try {
      const supabase = await createServerClient()
      const { data: order } = (await supabase
        .from('orders')
        .select('status, updated_at')
        .eq('id', orderId)
        .single()) as { data: Pick<Order, 'status' | 'updated_at'> | null; error: any }

      if (order && order.status === ORDER_STATUSES.DELIVERED) {
        // Auto-complete after 24 hours
        const deliveredTime = new Date(order.updated_at)
        const now = new Date()
        const hoursElapsed = (now.getTime() - deliveredTime.getTime()) / (1000 * 60 * 60)

        if (hoursElapsed >= 24) {
          await this.executeStatusChange(
            orderId,
            ORDER_STATUSES.COMPLETED,
            'system', // System user
            USER_ROLES.ADMIN,
            'Auto-completed after 24 hours'
          )
        }
      }
    } catch (error) {
      logger.error('Auto-complete check error:', error)
    }
  }

  /**
   * Escalate overdue orders
   */
  private static async escalateOverdueOrder(orderId: string): Promise<void> {
    try {
      const supabase = await createServerClient()
      const { data: order } = (await supabase
        .from('orders')
        .select('status, updated_at')
        .eq('id', orderId)
        .single()) as { data: Pick<Order, 'status' | 'updated_at'> | null; error: any }

      if (order && order.status === ORDER_STATUSES.OUT_FOR_DELIVERY) {
        const outForDeliveryTime = new Date(order.updated_at)
        const now = new Date()
        const hoursElapsed = (now.getTime() - outForDeliveryTime.getTime()) / (1000 * 60 * 60)

        if (hoursElapsed >= 2) {
          // Send escalation notification to admin
          await orderRealtimeManager.sendNotification({
            order_id: orderId,
            type: 'status_change',
            message: `Order #${orderId.slice(-8)} is overdue for delivery (${Math.round(hoursElapsed)} hours)`,
            recipient_id: 'admin',
            recipient_role: 'admin',
            data: {
              order_id: orderId,
              overdue_hours: Math.round(hoursElapsed),
              priority: 'urgent',
            },
          })
        }
      }
    } catch (error) {
      logger.error('Escalation check error:', error)
    }
  }

  /**
   * Validate business rules for transitions
   */
  private static validateBusinessRule(
    rule: string,
    order: Order,
    userId: string
  ): WorkflowValidation {
    switch (rule) {
      case 'has_total_amount':
        if (!order.total_amount || order.total_amount <= 0) {
          return { valid: false, reason: 'Order must have a valid total amount' }
        }
        break

      case 'valid_pricing':
        // This would validate pricing against order items
        // Implementation depends on your pricing logic
        break

      case 'has_driver':
        if (!order.driver_id) {
          return { valid: false, reason: 'Order must be assigned to a driver' }
        }
        break

      case 'driver_assigned':
        if (order.driver_id !== userId) {
          return { valid: false, reason: 'Only the assigned driver can update delivery status' }
        }
        break
    }

    return { valid: true }
  }

  /**
   * Log status change for audit trail
   */
  private static async logStatusChange(
    oldOrder: Order,
    newOrder: Order,
    userId: string,
    notes?: string
  ): Promise<void> {
    try {
      logger.info('Order status change audit:', {
        order_id: oldOrder.id,
        old_status: oldOrder.status,
        new_status: newOrder.status,
        user_id: userId,
        timestamp: new Date().toISOString(),
        notes,
      })

      // In a real implementation, you'd store this in an audit_logs table
      // await supabase.from('order_status_history').insert({ ... })
    } catch (error) {
      logger.error('Failed to log status change:', error)
    }
  }

  /**
   * Send notifications for status changes
   */
  private static async sendStatusChangeNotifications(
    oldOrder: Order,
    newOrder: Order,
    userId: string,
    userRole: UserRole
  ): Promise<OrderNotification[]> {
    try {
      const transition = ORDER_WORKFLOW.find(
        (t) => t.from === oldOrder.status && t.to === newOrder.status
      )

      if (!transition) return []

      const notifications: OrderNotification[] = []

      // Get order details with related data
      const supabase = await createServerClient()
      const { data: orderDetails } = (await supabase
        .from('orders')
        .select(
          `
          id,
          restaurant_id,
          driver_id,
          profiles!orders_restaurant_id_fkey (
            full_name,
            restaurant_name
          ),
          profiles!orders_driver_id_fkey (
            full_name
          )
        `
        )
        .eq('id', oldOrder.id)
        .single()) as {
        data: {
          id: string
          restaurant_id: string | null
          driver_id: string | null
          profiles: {
            full_name: string
            restaurant_name?: string
          } | null
        } | null
        error: any
      }

      const restaurantName =
        orderDetails?.profiles?.restaurant_name ||
        orderDetails?.profiles?.full_name ||
        'Unknown Restaurant'
      const driverName = orderDetails?.profiles ? orderDetails.profiles.full_name : null

      // Create notifications for each recipient type
      for (const recipientType of transition.notifications.recipients) {
        let recipientId: string
        let recipientRole: 'admin' | 'restaurant' | 'driver'

        switch (recipientType) {
          case 'restaurant':
            if (!orderDetails?.restaurant_id) continue
            recipientId = orderDetails.restaurant_id
            recipientRole = 'restaurant'
            break
          case 'driver':
            if (!orderDetails?.driver_id) continue
            recipientId = orderDetails.driver_id
            recipientRole = 'driver'
            break
          case 'admin':
            recipientId = 'admin' // Special identifier for admin broadcasts
            recipientRole = 'admin'
            break
          default:
            continue
        }

        const notification: OrderNotification = {
          order_id: oldOrder.id,
          type: 'status_change',
          message: this.generateStatusChangeMessage(
            oldOrder.status,
            newOrder.status,
            restaurantName,
            driverName,
            recipientRole
          ),
          recipient_id: recipientId,
          recipient_role: recipientRole,
          data: {
            order_id: oldOrder.id,
            old_status: oldOrder.status,
            new_status: newOrder.status,
            restaurant_name: restaurantName,
            driver_name: driverName,
            priority: transition.notifications.priority,
          },
        }

        notifications.push(notification)

        // Send the notification
        await orderRealtimeManager.sendNotification(notification)

        // Send browser notification if requested
        if (transition.notifications.browser && recipientId !== 'admin') {
          orderRealtimeManager.showBrowserNotification(`Order Update: ${restaurantName}`, {
            body: notification.message,
            icon: '/favicon.ico',
            tag: `order-${oldOrder.id}`,
            requireInteraction: transition.notifications.priority === 'urgent',
          })
        }
      }

      return notifications
    } catch (error) {
      logger.error('Failed to send status change notifications:', error)
      return []
    }
  }

  /**
   * Generate appropriate status change message based on recipient
   */
  private static generateStatusChangeMessage(
    oldStatus: string,
    newStatus: string,
    restaurantName: string,
    driverName: string | null,
    recipientRole: 'admin' | 'restaurant' | 'driver'
  ): string {
    const orderId = `Order #${Math.random().toString(36).substr(2, 8)}` // Simplified order ID display

    switch (recipientRole) {
      case 'restaurant':
        if (newStatus === ORDER_STATUSES.ASSIGNED) {
          return `${orderId} has been assigned to ${driverName || 'a driver'}`
        }
        if (newStatus === ORDER_STATUSES.OUT_FOR_DELIVERY) {
          return `${orderId} is now out for delivery`
        }
        if (newStatus === ORDER_STATUSES.DELIVERED) {
          return `${orderId} has been delivered. Please confirm receipt.`
        }
        break

      case 'driver':
        if (newStatus === ORDER_STATUSES.ASSIGNED) {
          return `New delivery assigned: ${restaurantName}`
        }
        if (newStatus === ORDER_STATUSES.COMPLETED) {
          return `${orderId} delivery completed successfully`
        }
        break

      case 'admin':
        return `${orderId} (${restaurantName}): ${oldStatus} → ${newStatus}`
    }

    return `${orderId} status changed to ${newStatus}`
  }

  /**
   * Get workflow statistics for analytics
   */
  static async getWorkflowStats(): Promise<{
    averageCompletionTime: number
    statusDistribution: Record<string, number>
    overdueOrders: number
    escalatedOrders: number
  }> {
    try {
      const supabase = await createServerClient()

      // Get all orders for analysis
      const { data: orders } = (await supabase
        .from('orders')
        .select('status, created_at, updated_at')) as {
        data: Array<Pick<Order, 'status' | 'created_at' | 'updated_at'>> | null
        error: any
      }

      if (!orders) {
        return {
          averageCompletionTime: 0,
          statusDistribution: {},
          overdueOrders: 0,
          escalatedOrders: 0,
        }
      }

      const ordersData = orders

      // Calculate status distribution
      const statusDistribution: Record<string, number> = {}
      ordersData.forEach((order) => {
        statusDistribution[order.status] = (statusDistribution[order.status] || 0) + 1
      })

      // Calculate average completion time
      const completedOrders = ordersData.filter(
        (order) => order.status === ORDER_STATUSES.COMPLETED
      )
      const completionTimes = completedOrders.map((order) => {
        const created = new Date(order.created_at)
        const completed = new Date(order.updated_at)
        return completed.getTime() - created.getTime()
      })

      const averageCompletionTime =
        completionTimes.length > 0
          ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
          : 0

      // Count overdue orders
      const overdueOrders = ordersData.filter(
        (order) =>
          order.status === ORDER_STATUSES.OUT_FOR_DELIVERY &&
          OrderBusinessLogic.isOrderOverdue(order as Order, 2)
      ).length

      return {
        averageCompletionTime,
        statusDistribution,
        overdueOrders,
        escalatedOrders: overdueOrders, // Simplified - in real app you'd track escalations separately
      }
    } catch (error) {
      logger.error('Failed to get workflow stats:', error)
      return {
        averageCompletionTime: 0,
        statusDistribution: {},
        overdueOrders: 0,
        escalatedOrders: 0,
      }
    }
  }
}
