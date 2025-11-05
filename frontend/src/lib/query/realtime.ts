// Georgian Distribution System Real-time Integration
// Supabase real-time integration for Georgian Distribution System

'use client'
import { logger } from '@/lib/logger'

import { useEffect, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { createBrowserClient } from '@/lib/supabase'
import { GDSCacheManager, GDSInvalidationPatterns } from '@/lib/query/cache'
import { classifyGDSError } from '@/lib/query/error-handling'

// Georgian Distribution System Real-time Events
export type GDSEventType =
  | 'order.created'
  | 'order.updated'
  | 'order.delivered'
  | 'order.cancelled'
  | 'product.created'
  | 'product.updated'
  | 'product.deleted'
  | 'user.connected'
  | 'user.disconnected'
  | 'delivery.status_changed'

export interface GDSEventPayload {
  type: GDSEventType
  data: any
  userId?: string
  timestamp: string
}

export interface PresenceEventData {
  key: string
  newPresences?: any[]
  leftPresences?: any[]
}

// Georgian Distribution System Real-time Configuration
export interface GDSRealtimeConfig {
  // Georgian-specific channels
  orders: {
    enabled: boolean
    channels: string[]
    events: GDSEventType[]
  }
  products: {
    enabled: boolean
    channels: string[]
    events: GDSEventType[]
  }
  users: {
    enabled: boolean
    channels: string[]
    events: GDSEventType[]
  }
  deliveries: {
    enabled: boolean
    channels: string[]
    events: GDSEventType[]
  }
  // Network resilience
  network: {
    retryAttempts: number
    retryDelay: number
    heartbeatInterval: number
  }
}

// Default Georgian Distribution System real-time configuration
export const GDS_REALTIME_CONFIG: GDSRealtimeConfig = {
  orders: {
    enabled: true,
    channels: ['orders', 'order_updates'],
    events: ['order.created', 'order.updated', 'order.delivered', 'order.cancelled'],
  },
  products: {
    enabled: true,
    channels: ['products', 'product_updates'],
    events: ['product.created', 'product.updated', 'product.deleted'],
  },
  users: {
    enabled: true,
    channels: ['user_presence'],
    events: ['user.connected', 'user.disconnected'],
  },
  deliveries: {
    enabled: true,
    channels: ['delivery_tracking'],
    events: ['delivery.status_changed'],
  },
  network: {
    retryAttempts: 5,
    retryDelay: 2000,
    heartbeatInterval: 30000,
  },
}

// Georgian Distribution System Real-time Manager
export class GDSRealtimeManager {
  private supabase: any
  private queryClient: any
  private cacheManager: GDSCacheManager
  private config: GDSRealtimeConfig
  private channels: Map<string, any> = new Map()
  private isConnected: boolean = false
  private connectionAttempts: number = 0
  private eventHandlers: Map<string, (payload: GDSEventPayload) => void> = new Map()

  constructor(supabaseClient: any, queryClient: any, config: Partial<GDSRealtimeConfig> = {}) {
    this.supabase = supabaseClient
    this.queryClient = queryClient
    this.cacheManager = new GDSCacheManager(queryClient)
    this.config = { ...GDS_REALTIME_CONFIG, ...config }
  }

  // Initialize Georgian Distribution System real-time connection
  async connect(): Promise<boolean> {
    try {
      logger.info('[GDS Realtime] Connecting...')

      // Subscribe to order changes
      if (this.config.orders.enabled) {
        await this.subscribeToOrders()
      }

      // Subscribe to product changes
      if (this.config.products.enabled) {
        await this.subscribeToProducts()
      }

      // Subscribe to user presence
      if (this.config.users.enabled) {
        await this.subscribeToUserPresence()
      }

      // Subscribe to delivery tracking
      if (this.config.deliveries.enabled) {
        await this.subscribeToDeliveries()
      }

      this.isConnected = true
      this.connectionAttempts = 0
      logger.info('[GDS Realtime] Connected successfully')

      return true
    } catch (error) {
      logger.error('[GDS Realtime] Connection failed:', { error })
      this.isConnected = false

      if (this.connectionAttempts < this.config.network.retryAttempts) {
        this.connectionAttempts++
        setTimeout(() => this.connect(), this.config.network.retryDelay)
      }

      return false
    }
  }

  // Subscribe to order changes
  private async subscribeToOrders() {
    const ordersChannel = this.supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload: any) => {
          this.handleOrderEvent(payload)
        }
      )
      .subscribe()

    this.channels.set('orders', ordersChannel)
    logger.info('[GDS Realtime] Subscribed to orders changes')
  }

  // Subscribe to product changes
  private async subscribeToProducts() {
    const productsChannel = this.supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
        },
        (payload: any) => {
          this.handleProductEvent(payload)
        }
      )
      .subscribe()

    this.channels.set('products', productsChannel)
    logger.info('[GDS Realtime] Subscribed to products changes')
  }

  // Subscribe to user presence
  private async subscribeToUserPresence() {
    const presenceChannel = this.supabase
      .channel('user-presence')
      .on('presence', { event: 'sync' }, () => {
        this.handlePresenceSync()
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }: PresenceEventData) => {
        this.handleUserJoin(key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }: PresenceEventData) => {
        this.handleUserLeave(key, leftPresences)
      })
      .subscribe()

    this.channels.set('presence', presenceChannel)
    logger.info('[GDS Realtime] Subscribed to user presence')
  }

  // Subscribe to delivery tracking
  private async subscribeToDeliveries() {
    const deliveriesChannel = this.supabase
      .channel('delivery-tracking')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        (payload: any) => {
          if (payload.new?.status === 'out_for_delivery' || payload.new?.status === 'delivered') {
            this.handleDeliveryEvent(payload)
          }
        }
      )
      .subscribe()

    this.channels.set('deliveries', deliveriesChannel)
    logger.info('[GDS Realtime] Subscribed to delivery tracking')
  }

  // Handle order events
  private handleOrderEvent(payload: any) {
    const eventType = `order.${payload.eventType}` as GDSEventType
    const event: GDSEventPayload = {
      type: eventType,
      data: payload.new || payload.old,
      timestamp: new Date().toISOString(),
    }

    logger.info(`[GDS Realtime] Order event: ${eventType}`, { payload })

    // Invalidate cache based on order changes
    this.cacheManager.invalidateEntity('order', payload.new || payload.old)

    // Call registered event handlers
    this.emitEvent(eventType, event)

    // Show Georgian notification for critical order events
    if (eventType === 'order.created' || eventType === 'order.delivered') {
      this.showNotification(event)
    }
  }

  // Handle product events
  private handleProductEvent(payload: any) {
    const eventType = `product.${payload.eventType}` as GDSEventType
    const event: GDSEventPayload = {
      type: eventType,
      data: payload.new || payload.old,
      timestamp: new Date().toISOString(),
    }

    logger.info(`[GDS Realtime] Product event: ${eventType}`, { payload })

    // Invalidate cache based on product changes
    this.cacheManager.invalidateEntity('product', payload.new || payload.old)

    // Call registered event handlers
    this.emitEvent(eventType, event)
  }

  // Handle delivery events
  private handleDeliveryEvent(payload: any) {
    const eventType = 'delivery.status_changed' as GDSEventType
    const event: GDSEventPayload = {
      type: eventType,
      data: payload.new,
      timestamp: new Date().toISOString(),
    }

    logger.info(`[GDS Realtime] Delivery event: ${eventType}`, { delivery: payload.new })

    // Invalidate cache
    this.cacheManager.invalidateEntity('order', payload.new)

    // Call registered event handlers
    this.emitEvent(eventType, event)

    // Show notification for delivery status changes
    this.showNotification(event)
  }

  // Handle user presence events
  private handlePresenceSync() {
    // Could update UI to show connected users
    logger.info('[GDS Realtime] Presence sync completed')
  }

  private handleUserJoin(userId: string, presences?: any[]) {
    const event: GDSEventPayload = {
      type: 'user.connected',
      data: { userId, presences },
      userId,
      timestamp: new Date().toISOString(),
    }

    logger.info('[GDS Realtime] User joined:', { userId })
    this.emitEvent('user.connected', event)
  }

  private handleUserLeave(userId: string, presences?: any[]) {
    const event: GDSEventPayload = {
      type: 'user.disconnected',
      data: { userId, presences },
      userId,
      timestamp: new Date().toISOString(),
    }

    logger.info('[GDS Realtime] User left:', { userId })
    this.emitEvent('user.disconnected', event)
  }

  // Show Georgian notification for critical events
  private showNotification(event: GDSEventPayload) {
    // Georgian notification messages
    const georgianMessages: Record<GDSEventType, string> = {
      'order.created': 'ახალი შეკვეთა შეიქმნა',
      'order.updated': 'შეკვეთა განახლდა',
      'order.delivered': 'შეკვეთა მიწოდებულია',
      'order.cancelled': 'შეკვეთა გაუქმდა',
      'product.created': 'ახალი პროდუქტი შეიქმნა',
      'product.updated': 'პროდუქტი განახლდა',
      'product.deleted': 'პროდუქტი წაიშალა',
      'user.connected': 'მომხმარებელი დაკავშირდა',
      'user.disconnected': 'მომხმარებელი განთავისუფლდა',
      'delivery.status_changed': 'მიწოდების სტატუსი შეიცვალა',
    }

    const message = georgianMessages[event.type] || 'ცვლილება მოხდა'
    logger.info(`[GDS Notification] ${message}`)
  }

  // Register event handler
  on(eventType: GDSEventType, handler: (payload: GDSEventPayload) => void) {
    this.eventHandlers.set(eventType, handler)
  }

  // Unregister event handler
  off(eventType: GDSEventType) {
    this.eventHandlers.delete(eventType)
  }

  // Emit event to registered handlers
  private emitEvent(eventType: GDSEventType, payload: GDSEventPayload) {
    const handler = this.eventHandlers.get(eventType)
    if (handler) {
      handler(payload)
    }
  }

  // Disconnect from real-time
  disconnect() {
    logger.info('[GDS Realtime] Disconnecting...')

    this.channels.forEach((channel) => {
      channel.unsubscribe()
    })

    this.channels.clear()
    this.isConnected = false
    logger.info('[GDS Realtime] Disconnected')
  }

  // Get connection status
  getStatus() {
    return {
      connected: this.isConnected,
      channelsCount: this.channels.size,
      eventHandlersCount: this.eventHandlers.size,
    }
  }
}

// React hook for Georgian Distribution System real-time
export function useGDSRealtime(config?: Partial<GDSRealtimeConfig>) {
  const [realtimeManager, setRealtimeManager] = useState<GDSRealtimeManager | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const supabase = createBrowserClient()

  const finalConfig = { ...GDS_REALTIME_CONFIG, ...config }

  // Initialize real-time manager
  useEffect(() => {
    if (!supabase || !queryClient) return

    const manager = new GDSRealtimeManager(supabase, queryClient, finalConfig)
    setRealtimeManager(manager)

    // Connect when user is available
    if (user) {
      manager.connect().then(setIsConnected)
    }

    // Cleanup on unmount
    return () => {
      manager.disconnect()
    }
  }, [supabase, queryClient, user])

  // Event handler registration
  const subscribe = useCallback(
    (eventType: GDSEventType, handler: (payload: GDSEventPayload) => void) => {
      if (realtimeManager) {
        realtimeManager.on(eventType, handler)
      }
    },
    [realtimeManager]
  )

  const unsubscribe = useCallback(
    (eventType: GDSEventType) => {
      if (realtimeManager) {
        realtimeManager.off(eventType)
      }
    },
    [realtimeManager]
  )

  return {
    manager: realtimeManager,
    isConnected,
    subscribe,
    unsubscribe,
    status: realtimeManager?.getStatus() || null,
  }
}

export default {
  GDSRealtimeManager,
  useGDSRealtime,
  GDS_REALTIME_CONFIG,
}
