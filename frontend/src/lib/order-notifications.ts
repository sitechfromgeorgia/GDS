import { logger } from '@/lib/logger'
import { Database, OrderStatus } from '@/types/database'
import { ORDER_STATUSES } from '@/constants'
import { orderRealtimeManager, OrderNotification } from './realtime'
import { createServerClient } from '@/lib/supabase/server'

type Order = Database['public']['Tables']['orders']['Row']

/**
 * Notification configuration for different status changes
 */
interface NotificationConfig {
  recipients: ('restaurant' | 'driver' | 'admin')[]
  priority: 'low' | 'medium' | 'high' | 'urgent'
  browser?: boolean
  email?: boolean
  inApp?: boolean
}

/**
 * Status change notification mapping
 */
const STATUS_CHANGE_NOTIFICATIONS: Record<string, NotificationConfig> = {
  [`${ORDER_STATUSES.PENDING}-${ORDER_STATUSES.CONFIRMED}`]: {
    recipients: ['admin'],
    priority: 'low',
  },
  [`${ORDER_STATUSES.CONFIRMED}-${ORDER_STATUSES.PRICED}`]: {
    recipients: ['restaurant', 'admin'],
    priority: 'medium',
  },
  [`${ORDER_STATUSES.PRICED}-${ORDER_STATUSES.ASSIGNED}`]: {
    recipients: ['restaurant', 'driver', 'admin'],
    priority: 'high',
    browser: true,
  },
  [`${ORDER_STATUSES.ASSIGNED}-${ORDER_STATUSES.OUT_FOR_DELIVERY}`]: {
    recipients: ['restaurant', 'admin'],
    priority: 'high',
    browser: true,
  },
  [`${ORDER_STATUSES.OUT_FOR_DELIVERY}-${ORDER_STATUSES.DELIVERED}`]: {
    recipients: ['restaurant', 'admin'],
    priority: 'urgent',
    browser: true,
    email: true,
  },
  [`${ORDER_STATUSES.DELIVERED}-${ORDER_STATUSES.COMPLETED}`]: {
    recipients: ['driver', 'admin'],
    priority: 'medium',
    email: true,
  },
  [`${ORDER_STATUSES.PENDING}-${ORDER_STATUSES.CANCELLED}`]: {
    recipients: ['admin', 'restaurant', 'driver'],
    priority: 'high',
    email: true,
  },
  [`${ORDER_STATUSES.CONFIRMED}-${ORDER_STATUSES.CANCELLED}`]: {
    recipients: ['admin', 'restaurant', 'driver'],
    priority: 'high',
    email: true,
  },
  [`${ORDER_STATUSES.PRICED}-${ORDER_STATUSES.CANCELLED}`]: {
    recipients: ['admin', 'restaurant', 'driver'],
    priority: 'high',
    email: true,
  },
  [`${ORDER_STATUSES.ASSIGNED}-${ORDER_STATUSES.CANCELLED}`]: {
    recipients: ['admin', 'restaurant', 'driver'],
    priority: 'urgent',
    email: true,
  },
}

/**
 * Order Notification Manager
 * Handles all notification routing and delivery for order status changes
 */
export class OrderNotificationManager {
  /**
   * Send notifications for order status change
   */
  static async notifyStatusChange(
    orderId: string,
    oldStatus: OrderStatus,
    newStatus: OrderStatus
  ): Promise<OrderNotification[]> {
    const notifications: OrderNotification[] = []
    const configKey = `${oldStatus}-${newStatus}`
    const config = STATUS_CHANGE_NOTIFICATIONS[configKey]

    if (!config) {
      logger.warn(`No notification config found for status change: ${configKey}`)
      return notifications
    }

    // Get order details with related data
    const orderDetails = await this.getOrderDetails(orderId)
    if (!orderDetails) {
      logger.error(`Failed to get order details for notification: ${orderId}`)
      return notifications
    }

    const restaurantName =
      orderDetails.profiles?.restaurant_name ||
      orderDetails.profiles?.full_name ||
      'Unknown Restaurant'
    const driverName = orderDetails.driver_profile?.full_name || null

    // Create notifications for each recipient type
    for (const recipientType of config.recipients) {
      let recipientId: string
      let recipientRole: 'admin' | 'restaurant' | 'driver'

      switch (recipientType) {
        case 'restaurant':
          if (!orderDetails.restaurant_id) continue
          recipientId = orderDetails.restaurant_id
          recipientRole = 'restaurant'
          break
        case 'driver':
          if (!orderDetails.driver_id) continue
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
        order_id: orderId,
        type: 'status_change',
        message: this.generateStatusChangeMessage(
          oldStatus,
          newStatus,
          restaurantName,
          driverName,
          recipientRole
        ),
        recipient_id: recipientId,
        recipient_role: recipientRole,
        data: {
          order_id: orderId,
          old_status: oldStatus,
          new_status: newStatus,
          restaurant_name: restaurantName,
          driver_name: driverName,
          priority: config.priority,
        },
      }

      notifications.push(notification)

      // Send real-time notification
      await orderRealtimeManager.sendNotification(notification)

      // Send browser notification if requested
      if (config.browser && recipientId !== 'admin') {
        orderRealtimeManager.showBrowserNotification(`Order Update: ${restaurantName}`, {
          body: notification.message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: `order-${orderId}`,
          requireInteraction: config.priority === 'urgent',
        })
      }

      // Send email notification if requested (placeholder for future implementation)
      if (config.email) {
        await this.sendEmailNotification(notification, config.priority)
      }
    }

    return notifications
  }

  /**
   * Send notification for new order creation
   */
  static async notifyOrderCreated(orderId: string): Promise<void> {
    try {
      const orderDetails = await this.getOrderDetails(orderId)
      if (!orderDetails) return

      const restaurantName =
        orderDetails.profiles?.restaurant_name ||
        orderDetails.profiles?.full_name ||
        'Unknown Restaurant'

      // Notify admins of new order
      await orderRealtimeManager.sendNotification({
        order_id: orderId,
        type: 'created',
        message: `New order from ${restaurantName}`,
        recipient_id: 'admin',
        recipient_role: 'admin',
        data: {
          order_id: orderId,
          restaurant_name: restaurantName,
        },
      })
    } catch (error) {
      logger.error('Failed to send order creation notification:', error)
    }
  }

  /**
   * Send notification when order is assigned to driver
   */
  static async notifyOrderAssigned(orderId: string, driverId: string): Promise<void> {
    try {
      const orderDetails = await this.getOrderDetails(orderId)
      if (!orderDetails) return

      const restaurantName =
        orderDetails.profiles?.restaurant_name ||
        orderDetails.profiles?.full_name ||
        'Unknown Restaurant'
      const driverName = orderDetails.driver_profile?.full_name || 'a driver'

      const notifications: OrderNotification[] = []

      // Notify driver
      notifications.push({
        order_id: orderId,
        type: 'assigned',
        message: `New delivery assigned: ${restaurantName}`,
        recipient_id: driverId,
        recipient_role: 'driver',
        data: {
          order_id: orderId,
          restaurant_name: restaurantName,
        },
      })

      // Notify restaurant
      if (orderDetails.restaurant_id) {
        notifications.push({
          order_id: orderId,
          type: 'assigned',
          message: `Order #${orderId.slice(-8)} has been assigned to ${driverName}`,
          recipient_id: orderDetails.restaurant_id,
          recipient_role: 'restaurant',
          data: {
            order_id: orderId,
            driver_name: driverName,
          },
        })
      }

      // Notify admin
      notifications.push({
        order_id: orderId,
        type: 'assigned',
        message: `Order #${orderId.slice(-8)} assigned to driver`,
        recipient_id: 'admin',
        recipient_role: 'admin',
        data: {
          order_id: orderId,
          driver_name: driverName,
          restaurant_name: restaurantName,
        },
      })

      // Send all notifications
      await Promise.all(
        notifications.map((notification) => orderRealtimeManager.sendNotification(notification))
      )
    } catch (error) {
      logger.error('Failed to send order assignment notifications:', error)
    }
  }

  /**
   * Send notification for delivery status updates
   */
  static async notifyDeliveryUpdate(orderId: string, status: string): Promise<void> {
    try {
      const orderDetails = await this.getOrderDetails(orderId)
      if (!orderDetails) return

      const restaurantName =
        orderDetails.profiles?.restaurant_name ||
        orderDetails.profiles?.full_name ||
        'Unknown Restaurant'
      const driverName = orderDetails.driver_profile?.full_name || null

      const notifications: OrderNotification[] = []

      // Notify restaurant
      if (orderDetails.restaurant_id) {
        notifications.push({
          order_id: orderId,
          type: 'delivery_update',
          message: `Order #${orderId.slice(-8)} delivery status: ${status}`,
          recipient_id: orderDetails.restaurant_id,
          recipient_role: 'restaurant',
          data: {
            order_id: orderId,
            status,
            driver_name: driverName,
          },
        })
      }

      // Notify admin
      notifications.push({
        order_id: orderId,
        type: 'delivery_update',
        message: `Order #${orderId.slice(-8)} delivery status: ${status}`,
        recipient_id: 'admin',
        recipient_role: 'admin',
        data: {
          order_id: orderId,
          status,
          driver_name: driverName,
          restaurant_name: restaurantName,
        },
      })

      // Send all notifications
      await Promise.all(
        notifications.map((notification) => orderRealtimeManager.sendNotification(notification))
      )
    } catch (error) {
      logger.error('Failed to send delivery status update notification:', error)
    }
  }

  /**
   * Send escalation notification for overdue orders
   */
  static async notifyOrderEscalation(orderId: string, overdueHours: number): Promise<void> {
    try {
      const orderDetails = await this.getOrderDetails(orderId)
      if (!orderDetails) return

      const restaurantName =
        orderDetails.profiles?.restaurant_name ||
        orderDetails.profiles?.full_name ||
        'Unknown Restaurant'

      await orderRealtimeManager.sendNotification({
        order_id: orderId,
        type: 'status_change',
        message: `Order #${orderId.slice(-8)} is overdue for delivery (${overdueHours} hours)`,
        recipient_id: 'admin',
        recipient_role: 'admin',
        data: {
          order_id: orderId,
          overdue_hours: overdueHours,
          priority: 'urgent',
          restaurant_name: restaurantName,
        },
      })
    } catch (error) {
      logger.error('Failed to send escalation notification:', error)
    }
  }

  /**
   * Get order details with related profile information
   */
  private static async getOrderDetails(
    orderId: string
  ): Promise<
    | (Order & {
        profiles?: { full_name: string | null; restaurant_name: string | null }
        driver_profile?: { full_name: string | null }
      })
    | null
  > {
    try {
      const supabase = await createServerClient()
      const { data, error } = await supabase
        .from('orders')
        .select(
          `
          id,
          restaurant_id,
          driver_id,
          status,
          total_amount,
          delivery_fee,
          tax_amount,
          discount_amount,
          notes,
          created_at,
          updated_at,
          profiles!orders_restaurant_id_fkey (
            full_name,
            restaurant_name
          ),
          profiles!orders_driver_id_fkey (
            full_name
          )
        `
        )
        .eq('id', orderId)
        .single()

      if (error) {
        logger.error('Failed to get order details:', error)
        return null
      }

      return data as any
    } catch (error) {
      logger.error('Error getting order details:', error)
      return null
    }
  }

  /**
   * Generate appropriate status change message based on recipient
   */
  private static generateStatusChangeMessage(
    oldStatus: OrderStatus,
    newStatus: OrderStatus,
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
   * Send email notification (placeholder for future implementation)
   */
  private static async sendEmailNotification(
    notification: OrderNotification,
    priority: string
  ): Promise<void> {
    // TODO: Implement email sending using a service like SendGrid, Mailgun, etc.
    // For now, just log the email that would be sent
    logger.info('Email notification would be sent:', {
      to:
        notification.recipient_id === 'admin'
          ? 'admin@greenland77.ge'
          : `${notification.recipient_id}@example.com`,
      subject: `Order Notification: ${notification.message}`,
      body: notification.message,
      priority,
    })
  }

  /**
   * Send bulk notifications for multiple orders
   */
  static async sendBulkNotifications(notifications: OrderNotification[]): Promise<void> {
    try {
      await Promise.all(
        notifications.map((notification) => orderRealtimeManager.sendNotification(notification))
      )
    } catch (error) {
      logger.error('Failed to send bulk notifications:', error)
    }
  }

  /**
   * Get notification history for a user
   */
  static async getNotificationHistory(
    userId: string,
    limit: number = 50
  ): Promise<OrderNotification[]> {
    // TODO: Implement notification history storage and retrieval
    // For now, return empty array
    logger.info(`Getting notification history for user ${userId}, limit ${limit}`)
    return []
  }

  /**
   * Mark notification as read
   */
  static async markNotificationRead(notificationId: string): Promise<void> {
    // TODO: Implement notification read status tracking
    logger.info(`Marking notification ${notificationId} as read`)
  }

  /**
   * Get unread notification count for user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    // TODO: Implement unread count tracking
    logger.info(`Getting unread count for user ${userId}`)
    return 0
  }

  /**
   * Send new order notification (when admin assigns order to driver)
   */
  static async sendNewOrderNotification(orderId: string, driverId: string): Promise<void> {
    try {
      const supabase = await createServerClient()
      const orderDetails = await this.getOrderDetails(orderId)

      if (!orderDetails) {
        logger.error(`Failed to get order details for new order notification: ${orderId}`)
        return
      }

      const restaurantName =
        orderDetails.profiles?.restaurant_name ||
        orderDetails.profiles?.full_name ||
        'Unknown Restaurant'

      await supabase.from('notifications').insert({
        user_id: driverId,
        type: 'new_order',
        title: 'ახალი შეკვეთა',
        title_ka: 'ახალი შეკვეთა',
        message: `თქვენთვის გადანაწილდა ახალი შეკვეთა: ${restaurantName}`,
        message_ka: `თქვენთვის გადანაწილდა ახალი შეკვეთა: ${restaurantName}`,
        is_read: false,
      })

      logger.info(`New order notification sent to driver ${driverId} for order ${orderId}`)
    } catch (error) {
      logger.error('Failed to send new order notification', error as Error)
    }
  }

  /**
   * Send order update notification (when order status changes)
   */
  static async sendOrderUpdateNotification(
    orderId: string,
    driverId: string,
    oldStatus: OrderStatus,
    newStatus: OrderStatus
  ): Promise<void> {
    try {
      const supabase = await createServerClient()
      const statusMessages: Record<string, string> = {
        [ORDER_STATUSES.CONFIRMED]: 'დადასტურდა',
        [ORDER_STATUSES.PRICED]: 'განსაზღვრული ფასით',
        [ORDER_STATUSES.ASSIGNED]: 'მინიჭებულია',
        [ORDER_STATUSES.OUT_FOR_DELIVERY]: 'მიწოდების პროცესშია',
        [ORDER_STATUSES.DELIVERED]: 'მიწოდებულია',
        [ORDER_STATUSES.COMPLETED]: 'დასრულებულია',
        [ORDER_STATUSES.CANCELLED]: 'გაუქმებულია',
      }

      const statusMessage = statusMessages[newStatus] || newStatus

      await supabase.from('notifications').insert({
        user_id: driverId,
        type: 'order_update',
        title: 'შეკვეთის სტატუსი შეიცვალა',
        title_ka: 'შეკვეთის სტატუსი შეიცვალა',
        message: `შეკვეთის სტატუსი განახლდა: ${statusMessage}`,
        message_ka: `შეკვეთის სტატუსი განახლდა: ${statusMessage}`,
        is_read: false,
      })

      logger.info(
        `Order update notification sent to driver ${driverId} for order ${orderId}: ${oldStatus} -> ${newStatus}`
      )
    } catch (error) {
      logger.error('Failed to send order update notification', error as Error)
    }
  }

  /**
   * Send admin message notification
   */
  static async sendAdminMessage(driverId: string, message: string, title?: string): Promise<void> {
    try {
      const supabase = await createServerClient()

      await supabase.from('notifications').insert({
        user_id: driverId,
        type: 'admin_message',
        title: title || 'შეტყობინება ადმინისგან',
        title_ka: title || 'შეტყობინება ადმინისგან',
        message: message,
        message_ka: message,
        is_read: false,
      })

      logger.info(`Admin message sent to driver ${driverId}`)
    } catch (error) {
      logger.error('Failed to send admin message', error as Error)
    }
  }

  /**
   * Send restaurant message notification
   */
  static async sendRestaurantMessage(
    driverId: string,
    restaurantId: string,
    message: string,
    restaurantName?: string
  ): Promise<void> {
    try {
      const supabase = await createServerClient()

      // Get restaurant name if not provided
      let resName = restaurantName
      if (!resName) {
        const { data: restaurant } = await supabase
          .from('profiles')
          .select('full_name, restaurant_name')
          .eq('id', restaurantId)
          .single()

        resName = restaurant?.restaurant_name || restaurant?.full_name || 'Unknown Restaurant'
      }

      await supabase.from('notifications').insert({
        user_id: driverId,
        type: 'restaurant_message',
        title: `შეტყობინება: ${resName}`,
        title_ka: `შეტყობინება: ${resName}`,
        message: message,
        message_ka: message,
        is_read: false,
      })

      logger.info(`Restaurant message sent to driver ${driverId} from restaurant ${restaurantId}`)
    } catch (error) {
      logger.error('Failed to send restaurant message', error as Error)
    }
  }
}
