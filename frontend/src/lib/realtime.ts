import { logger } from '@/lib/logger'
import { createBrowserClient } from '@/lib/supabase'

const supabase = createBrowserClient()
import { Database } from '@/types/database'
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
  RealtimePresenceState,
} from '@supabase/supabase-js'

type Order = Database['public']['Tables']['orders']['Row']
type OrderUpdate = Database['public']['Tables']['orders']['Update']
type Profile = Database['public']['Tables']['profiles']['Row']

// Realtime payload types
interface PostgresChangePayload<T = Record<string, unknown>> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T
  old: T
  schema: string
  table: string
  commit_timestamp: string
}

// Supabase specific payload types
type SupabasePostgresChangePayload<T = Record<string, unknown>> = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T
  old: T
  schema: string
  table: string
  commit_timestamp: string
}

interface BroadcastPayload<T = Record<string, unknown>> {
  event: string
  payload: T
}

// Presence types
interface DriverPresence {
  id: string
  status: 'available' | 'busy' | 'offline'
  timestamp: string
  full_name?: string
}

interface PresenceState {
  [key: string]: DriverPresence[]
}

// Connection states
type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error'

// Throttling configuration
interface ThrottleConfig {
  maxUpdatesPerSecond: number
  maxBurstSize: number
}

// Enhanced order query result type
interface OrderWithProfiles extends Order {
  profiles?: Profile | null
  driver_profile?: Profile | null
}

// Type for Supabase query results with joined profiles
interface OrderWithJoinedProfiles {
  id: string
  restaurant_id: string
  driver_id: string | null
  status: Order['status']
  total_amount: number | null
  notes: string | null
  created_at: string
  updated_at: string
  profiles: Profile | null
}

export interface OrderNotification {
  order_id: string
  type:
    | 'status_change'
    | 'assigned'
    | 'created'
    | 'cancelled'
    | 'location_update'
    | 'delivery_update'
  message: string
  recipient_id: string
  recipient_role: 'admin' | 'restaurant' | 'driver'
  data?: Record<string, unknown>
}

export interface DriverLocation {
  driver_id: string
  order_id: string
  latitude: number
  longitude: number
  timestamp: string
  accuracy?: number
}

/**
 * Real-time order updates and notifications system
 */
export class OrderRealtimeManager {
  private subscriptions: Map<string, RealtimeChannel> = new Map()
  private locationUpdateCallbacks: Map<string, (location: DriverLocation) => void> = new Map()
  private orderUpdateCallbacks: Map<
    string,
    (payload: SupabasePostgresChangePayload<Order>) => void
  > = new Map()
  private notificationCallbacks: Map<string, (notification: OrderNotification) => void> = new Map()
  private connectionStates: Map<string, ConnectionState> = new Map()
  private reconnectTimeouts: Map<string, NodeJS.Timeout> = new Map()
  private throttleBuckets: Map<string, { count: number; resetTime: number }> = new Map()
  private readonly throttleConfig: ThrottleConfig = {
    maxUpdatesPerSecond: 5,
    maxBurstSize: 10,
  }

  /**
   * Subscribe to order updates for a specific user
   */
  subscribeToOrderUpdates(
    userId: string,
    callback: (payload: SupabasePostgresChangePayload<Order>) => void
  ) {
    const channelName = `orders:${userId}`

    // Unsubscribe if already subscribed
    this.unsubscribeFromOrderUpdates(userId)

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${userId}`,
        },
        (payload: unknown) =>
          this.handleThrottledCallback(
            userId,
            callback,
            payload as SupabasePostgresChangePayload<Order>
          )
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `driver_id=eq.${userId}`,
        },
        (payload: any) => this.handleThrottledCallback(userId, callback, payload)
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${userId}`,
        },
        (payload: any) => this.handleThrottledCallback(userId, callback, payload)
      )
      .subscribe((status) => {
        this.connectionStates.set(userId, status === 'SUBSCRIBED' ? 'connected' : 'disconnected')
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          this.scheduleReconnect(userId, () => this.subscribeToOrderUpdates(userId, callback))
        }
      })

    this.subscriptions.set(userId, channel)
    this.orderUpdateCallbacks.set(userId, callback)
    return channel
  }

  /**
   * Unsubscribe from order updates
   */
  unsubscribeFromOrderUpdates(userId: string) {
    const channel = this.subscriptions.get(userId)
    if (channel) {
      supabase.removeChannel(channel)
      this.subscriptions.delete(userId)
      this.orderUpdateCallbacks.delete(userId)
    }
  }

  /**
   * Subscribe to all order updates (for admin dashboard)
   */
  subscribeToAllOrders(callback: (payload: SupabasePostgresChangePayload<Order>) => void) {
    const channelName = 'orders:all'

    this.unsubscribeFromAllOrders()

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload) =>
          this.handleThrottledCallback(
            'all',
            callback,
            payload as unknown as SupabasePostgresChangePayload<Order>
          )
      )
      .subscribe((status) => {
        this.connectionStates.set('all', status === 'SUBSCRIBED' ? 'connected' : 'disconnected')
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          this.scheduleReconnect('all', () => this.subscribeToAllOrders(callback))
        }
      })

    this.subscriptions.set('all', channel)
    return channel
  }

  /**
   * Unsubscribe from all order updates
   */
  unsubscribeFromAllOrders() {
    const channel = this.subscriptions.get('all')
    if (channel) {
      supabase.removeChannel(channel)
      this.subscriptions.delete('all')
    }
  }

  /**
   * Subscribe to driver location updates for a specific order
   */
  subscribeToDriverLocation(orderId: string, callback: (location: DriverLocation) => void) {
    const channelName = `driver-location:${orderId}`

    // Unsubscribe if already subscribed
    this.unsubscribeFromDriverLocation(orderId)

    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'location-update' }, (payload) => {
        callback(payload.payload as DriverLocation)
      })
      .subscribe()

    this.subscriptions.set(`location:${orderId}`, channel)
    this.locationUpdateCallbacks.set(orderId, callback)
    return channel
  }

  /**
   * Unsubscribe from driver location updates
   */
  unsubscribeFromDriverLocation(orderId: string) {
    const channel = this.subscriptions.get(`location:${orderId}`)
    if (channel) {
      supabase.removeChannel(channel)
      this.subscriptions.delete(`location:${orderId}`)
      this.locationUpdateCallbacks.delete(orderId)
    }
  }

  /**
   * Subscribe to notifications
   */
  subscribeToNotifications(userId: string, callback: (notification: OrderNotification) => void) {
    const channelName = `notifications:${userId}`

    // Unsubscribe if already subscribed
    this.unsubscribeFromNotifications(userId)

    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'notification' }, (payload) => {
        callback(payload.payload as OrderNotification)
      })
      .subscribe()

    this.subscriptions.set(`notification:${userId}`, channel)
    this.notificationCallbacks.set(userId, callback)
    return channel
  }

  /**
   * Unsubscribe from notifications
   */
  unsubscribeFromNotifications(userId: string) {
    const channel = this.subscriptions.get(`notification:${userId}`)
    if (channel) {
      supabase.removeChannel(channel)
      this.subscriptions.delete(`notification:${userId}`)
      this.notificationCallbacks.delete(userId)
    }
  }

  /**
   * Subscribe to presence updates for online drivers
   */
  async subscribeToDriverPresence(callback: (presence: PresenceState) => void) {
    const channelName = 'drivers:presence'

    const channel = supabase
      .channel(channelName, {
        config: {
          presence: {
            key: 'driver',
          },
        },
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const transformedState: PresenceState = {}
        Object.keys(state).forEach((key) => {
          const presences = state[key]
          if (presences) {
            transformedState[key] = presences.map((p) => ({
              id: (p as any).id || key,
              status: (p as any).status || 'available',
              timestamp: (p as any).timestamp || new Date().toISOString(),
              full_name: (p as any).full_name,
            }))
          }
        })
        callback(transformedState)
      })
      .on('presence', { event: 'join' }, (payload) => {
        const transformedState: PresenceState = {}
        const newPresences = payload.newPresences as unknown as Record<string, any[]>
        Object.keys(newPresences).forEach((key) => {
          const presences = newPresences[key]
          if (presences) {
            transformedState[key] = presences.map((p) => ({
              id: (p as any).id || key,
              status: (p as any).status || 'available',
              timestamp: (p as any).timestamp || new Date().toISOString(),
              full_name: (p as any).full_name,
            }))
          }
        })
        callback(transformedState)
      })
      .on('presence', { event: 'leave' }, (payload) => {
        const transformedState: PresenceState = {}
        const leftPresences = payload.leftPresences as unknown as Record<string, any[]>
        Object.keys(leftPresences).forEach((key) => {
          const presences = leftPresences[key]
          if (presences) {
            transformedState[key] = presences.map((p) => ({
              id: (p as any).id || key,
              status: (p as any).status || 'offline',
              timestamp: (p as any).timestamp || new Date().toISOString(),
              full_name: (p as any).full_name,
            }))
          }
        })
        callback(transformedState)
      })
      .subscribe((status) => {
        this.connectionStates.set(
          'presence',
          status === 'SUBSCRIBED' ? 'connected' : 'disconnected'
        )
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          this.scheduleReconnect('presence', () => this.subscribeToDriverPresence(callback))
        }
      })

    this.subscriptions.set('presence', channel)
    return channel
  }

  /**
   * Track driver presence
   */
  async trackDriverPresence(driverId: string, status: 'available' | 'busy' | 'offline') {
    const channel = this.subscriptions.get('presence')
    if (channel) {
      await channel.track({
        id: driverId,
        status,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Send notification to specific user
   */
  async sendNotification(notification: OrderNotification) {
    try {
      const channelName = `notifications:${notification.recipient_id}`

      const channel = supabase.channel(channelName, {
        config: {
          broadcast: { self: false },
        },
      })

      await channel.send({
        type: 'broadcast',
        event: 'notification',
        payload: notification,
      })

      // Clean up channel after sending
      supabase.removeChannel(channel)
    } catch (error) {
      logger.error('Failed to send notification:', error)
    }
  }

  /**
   * Send driver location update
   */
  async sendDriverLocationUpdate(location: DriverLocation) {
    try {
      const channelName = `driver-location:${location.order_id}`

      const channel = supabase.channel(channelName, {
        config: {
          broadcast: { self: false },
        },
      })

      await channel.send({
        type: 'broadcast',
        event: 'location-update',
        payload: location,
      })

      // Clean up channel after sending
      supabase.removeChannel(channel)
    } catch (error) {
      logger.error('Failed to send driver location update:', error)
    }
  }

  /**
   * Send notifications when order status changes
   */
  async notifyOrderStatusChange(orderId: string, oldStatus: string, newStatus: string) {
    try {
      // Get order details with related data
      const { data: order } = (await supabase
        .from('orders')
        .select(
          `
          id,
          restaurant_id,
          driver_id,
          status,
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
        .single()) as { data: any; error: any }

      if (!order) return

      const notifications: OrderNotification[] = []

      // Notify restaurant
      if ((order as any).restaurant_id) {
        notifications.push({
          order_id: orderId,
          type: 'status_change',
          message: `Order #${orderId.slice(-8)} status changed from ${oldStatus} to ${newStatus}`,
          recipient_id: (order as any).restaurant_id,
          recipient_role: 'restaurant',
          data: {
            order_id: orderId,
            old_status: oldStatus,
            new_status: newStatus,
            restaurant_name:
              (order as any).profiles?.restaurant_name || (order as any).profiles?.full_name,
          },
        })
      }

      // Notify assigned driver
      if ((order as any).driver_id) {
        notifications.push({
          order_id: orderId,
          type: 'status_change',
          message: `Order #${orderId.slice(-8)} status changed to ${newStatus}`,
          recipient_id: (order as any).driver_id,
          recipient_role: 'driver',
          data: {
            order_id: orderId,
            old_status: oldStatus,
            new_status: newStatus,
            restaurant_name:
              (order as any).profiles?.restaurant_name || (order as any).profiles?.full_name,
          },
        })
      }

      // Notify admins for important status changes
      if (
        ['assigned', 'out_for_delivery', 'delivered', 'completed', 'cancelled'].includes(newStatus)
      ) {
        // In a real app, you'd get all admin users
        // For now, we'll broadcast to an admin channel
        notifications.push({
          order_id: orderId,
          type: 'status_change',
          message: `Order #${orderId.slice(-8)} (${order.profiles?.restaurant_name || 'Unknown'}) status: ${oldStatus} → ${newStatus}`,
          recipient_id: 'admin', // Special identifier for admin broadcasts
          recipient_role: 'admin',
          data: {
            order_id: orderId,
            old_status: oldStatus,
            new_status: newStatus,
            restaurant_name:
              (order as any).profiles?.restaurant_name || (order as any).profiles?.full_name,
            driver_name: (order as any).profiles ? (order as any).profiles.full_name : null,
          },
        })
      }

      // Send all notifications
      await Promise.all(notifications.map((notification) => this.sendNotification(notification)))
    } catch (error) {
      logger.error('Failed to send order status notifications:', error)
    }
  }

  /**
   * Send notification when order is assigned to driver
   */
  async notifyOrderAssigned(orderId: string, driverId: string) {
    try {
      const { data: order } = (await supabase
        .from('orders')
        .select(
          `
          id,
          restaurant_id,
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
        .single()) as { data: any; error: any }

      if (!order) return

      const notifications: OrderNotification[] = []

      // Notify driver
      notifications.push({
        order_id: orderId,
        type: 'assigned',
        message: `New order assigned: ${order.profiles?.restaurant_name || order.profiles?.full_name}`,
        recipient_id: driverId,
        recipient_role: 'driver',
        data: {
          order_id: orderId,
          restaurant_name: order.profiles?.restaurant_name || order.profiles?.full_name,
        },
      })

      // Notify restaurant
      if ((order as any).restaurant_id) {
        notifications.push({
          order_id: orderId,
          type: 'assigned',
          message: `Order #${orderId.slice(-8)} has been assigned to ${order.profiles ? order.profiles.full_name : 'a driver'}`,
          recipient_id: (order as any).restaurant_id,
          recipient_role: 'restaurant',
          data: {
            order_id: orderId,
            driver_name: order.profiles ? order.profiles.full_name : null,
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
          driver_name: order.profiles ? order.profiles.full_name : null,
          restaurant_name: order.profiles?.restaurant_name || order.profiles?.full_name,
        },
      })

      await Promise.all(notifications.map((notification) => this.sendNotification(notification)))
    } catch (error) {
      logger.error('Failed to send order assignment notifications:', error)
    }
  }

  /**
   * Send notification for new order creation
   */
  async notifyOrderCreated(orderId: string, restaurantId: string) {
    try {
      const { data: order } = (await supabase
        .from('orders')
        .select(
          `
          id,
          profiles!orders_restaurant_id_fkey (
            full_name,
            restaurant_name
          )
        `
        )
        .eq('id', orderId)
        .single()) as { data: any; error: any }

      if (!order) return

      // Notify admins of new order
      await this.sendNotification({
        order_id: orderId,
        type: 'created',
        message: `New order from ${order.profiles?.restaurant_name || order.profiles?.full_name}`,
        recipient_id: 'admin',
        recipient_role: 'admin',
        data: {
          order_id: orderId,
          restaurant_name: order.profiles?.restaurant_name || order.profiles?.full_name,
        },
      })
    } catch (error) {
      logger.error('Failed to send order creation notification:', error)
    }
  }

  /**
   * Send notification when driver updates delivery status
   */
  async notifyDeliveryStatusUpdate(orderId: string, driverId: string, status: string) {
    try {
      const { data: order } = await supabase
        .from('orders')
        .select(
          `
          id,
          restaurant_id,
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

      if (!order) return

      const notifications: OrderNotification[] = []

      // Notify restaurant
      if ((order as any).restaurant_id) {
        notifications.push({
          order_id: orderId,
          type: 'delivery_update',
          message: `Order #${orderId.slice(-8)} delivery status: ${status}`,
          recipient_id: (order as any).restaurant_id,
          recipient_role: 'restaurant',
          data: {
            order_id: orderId,
            status,
            driver_name: (order as any).profiles ? (order as any).profiles.full_name : null,
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
          driver_name: (order as any).profiles ? (order as any).profiles.full_name : null,
          restaurant_name:
            (order as any).profiles?.restaurant_name || (order as any).profiles?.full_name,
        },
      })

      await Promise.all(notifications.map((notification) => this.sendNotification(notification)))
    } catch (error) {
      logger.error('Failed to send delivery status update notification:', error)
    }
  }

  /**
   * Handle throttled callback execution
   */
  private handleThrottledCallback<T>(key: string, callback: (payload: T) => void, payload: T) {
    const now = Date.now()
    const bucket = this.throttleBuckets.get(key) || { count: 0, resetTime: now + 1000 }

    if (now > bucket.resetTime) {
      bucket.count = 0
      bucket.resetTime = now + 1000
    }

    if (bucket.count < this.throttleConfig.maxBurstSize) {
      bucket.count++
      this.throttleBuckets.set(key, bucket)
      try {
        callback(payload)
      } catch (error) {
        logger.error(`Error in throttled callback for ${key}:`, error)
      }
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(key: string, reconnectFn: () => void) {
    const existingTimeout = this.reconnectTimeouts.get(key)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    const delay = Math.min(
      1000 * Math.pow(2, this.connectionStates.get(key) === 'error' ? 1 : 0),
      30000
    )
    const timeout = setTimeout(() => {
      logger.info(`Reconnecting ${key}...`)
      reconnectFn()
    }, delay)

    this.reconnectTimeouts.set(key, timeout)
  }

  /**
   * Get connection state for a subscription
   */
  getConnectionState(key: string): ConnectionState {
    return this.connectionStates.get(key) || 'disconnected'
  }

  /**
   * Request browser notification permission
   */
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'denied') {
      return false
    }

    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  /**
   * Show browser notification
   */
  showBrowserNotification(title: string, options?: NotificationOptions): Notification | undefined {
    if (Notification.permission === 'granted') {
      return new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      })
    }
    return undefined
  }

  /**
   * Cleanup all subscriptions and resources
   */
  cleanup() {
    // Clear all reconnection timeouts
    this.reconnectTimeouts.forEach((timeout) => clearTimeout(timeout))
    this.reconnectTimeouts.clear()

    // Remove all channels
    this.subscriptions.forEach((channel) => {
      supabase.removeChannel(channel)
    })
    this.subscriptions.clear()

    // Clear all callbacks and state
    this.locationUpdateCallbacks.clear()
    this.orderUpdateCallbacks.clear()
    this.notificationCallbacks.clear()
    this.connectionStates.clear()
    this.throttleBuckets.clear()
  }
}

// Singleton instance
export const orderRealtimeManager = new OrderRealtimeManager()

// React hooks for real-time functionality
import { useEffect, useRef, useCallback } from 'react'

export function useOrderRealtime(userId: string) {
  const callbackRef = useRef<((payload: PostgresChangePayload<Order>) => void) | null>(null)

  const subscribe = useCallback(
    (callback: (payload: PostgresChangePayload<Order>) => void) => {
      callbackRef.current = callback
      return orderRealtimeManager.subscribeToOrderUpdates(userId, callback)
    },
    [userId]
  )

  const unsubscribe = useCallback(() => {
    orderRealtimeManager.unsubscribeFromOrderUpdates(userId)
  }, [userId])

  useEffect(() => {
    return () => {
      unsubscribe()
    }
  }, [unsubscribe])

  return { subscribe, unsubscribe }
}

export function useAdminOrderRealtime() {
  const callbackRef = useRef<((payload: PostgresChangePayload<Order>) => void) | null>(null)

  const subscribe = useCallback((callback: (payload: PostgresChangePayload<Order>) => void) => {
    callbackRef.current = callback
    return orderRealtimeManager.subscribeToAllOrders(callback)
  }, [])

  const unsubscribe = useCallback(() => {
    orderRealtimeManager.unsubscribeFromAllOrders()
  }, [])

  useEffect(() => {
    return () => {
      unsubscribe()
    }
  }, [unsubscribe])

  return { subscribe, unsubscribe }
}

export function useDriverLocationTracking(orderId: string) {
  const callbackRef = useRef<((location: DriverLocation) => void) | null>(null)

  const subscribe = useCallback(
    (callback: (location: DriverLocation) => void) => {
      callbackRef.current = callback
      return orderRealtimeManager.subscribeToDriverLocation(orderId, callback)
    },
    [orderId]
  )

  const unsubscribe = useCallback(() => {
    orderRealtimeManager.unsubscribeFromDriverLocation(orderId)
  }, [orderId])

  const sendLocation = useCallback((location: DriverLocation) => {
    return orderRealtimeManager.sendDriverLocationUpdate(location)
  }, [])

  useEffect(() => {
    return () => {
      unsubscribe()
    }
  }, [unsubscribe])

  return { subscribe, unsubscribe, sendLocation }
}

export function useNotifications(userId: string) {
  const callbackRef = useRef<((notification: OrderNotification) => void) | null>(null)

  const subscribe = useCallback(
    (callback: (notification: OrderNotification) => void) => {
      callbackRef.current = callback
      return orderRealtimeManager.subscribeToNotifications(userId, callback)
    },
    [userId]
  )

  const unsubscribe = useCallback(() => {
    orderRealtimeManager.unsubscribeFromNotifications(userId)
  }, [userId])

  const sendNotification = useCallback((notification: OrderNotification) => {
    return orderRealtimeManager.sendNotification(notification)
  }, [])

  useEffect(() => {
    return () => {
      unsubscribe()
    }
  }, [unsubscribe])

  return { subscribe, unsubscribe, sendNotification }
}

export function useDriverPresence() {
  const callbackRef = useRef<((presence: PresenceState) => void) | null>(null)

  const subscribe = useCallback(async (callback: (presence: PresenceState) => void) => {
    callbackRef.current = callback
    return await orderRealtimeManager.subscribeToDriverPresence(callback)
  }, [])

  const trackPresence = useCallback(
    (driverId: string, status: 'available' | 'busy' | 'offline') => {
      return orderRealtimeManager.trackDriverPresence(driverId, status)
    },
    []
  )

  useEffect(() => {
    return () => {
      // Presence channels are managed by the manager
    }
  }, [])

  return { subscribe, trackPresence }
}

// Enhanced order status update function with proper change detection
export async function setupOrderStatusChangeListener(
  orderId: string,
  onStatusChange: (oldStatus: string, newStatus: string) => void
) {
  const channel = supabase
    .channel(`order-status-${orderId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`,
      },
      (payload) => {
        const oldStatus = payload.old.status
        const newStatus = payload.new.status
        if (oldStatus !== newStatus) {
          onStatusChange(oldStatus, newStatus)
        }
      }
    )
    .subscribe()

  return channel
}
