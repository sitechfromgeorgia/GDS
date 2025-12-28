/**
 * Real-time Orders Hook for Drivers
 * T027: Uses optimized connection manager for driver order subscriptions
 *
 * Features:
 * - Real-time updates for assigned orders
 * - Automatic subscription management
 * - Connection health monitoring
 * - Optimized RLS policy usage (idx_orders_driver_id)
 */

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getConnectionManager } from '@/lib/realtime/connection-manager'
import type { Database } from '@/types/database'
import { logger } from '@/lib/logger'

type Order = Database['public']['Tables']['orders']['Row']

export type OrderStatus = Order['status']

export interface OrderUpdate {
  id: string
  status: OrderStatus
  driver_id: string | null
  created_at: string
  updated_at: string
}

interface UseRealtimeOrdersOptions {
  /**
   * Filter by order status
   * @default ['assigned', 'out_for_delivery']
   */
  status?: OrderStatus[]

  /**
   * Auto-subscribe on mount
   * @default true
   */
  autoSubscribe?: boolean

  /**
   * Callback when order is updated
   */
  onOrderUpdate?: (order: OrderUpdate) => void

  /**
   * Callback when new order is assigned
   */
  onOrderAssigned?: (order: OrderUpdate) => void

  /**
   * Callback when order status changes
   */
  onStatusChange?: (orderId: string, newStatus: OrderStatus, oldStatus: OrderStatus) => void
}

export function useRealtimeOrders(options: UseRealtimeOrdersOptions = {}) {
  const {
    status = ['assigned', 'out_for_delivery'],
    autoSubscribe = true,
    onOrderUpdate,
    onOrderAssigned,
    onStatusChange,
  } = options

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [connected, setConnected] = useState(false)
  const [quality, setQuality] = useState<'excellent' | 'good' | 'poor' | 'disconnected'>(
    'disconnected'
  )

  // T027: Initialize connection manager
  const supabase = createClient()
  const connectionManager = getConnectionManager(supabase.realtime, {
    maxSubscriptions: 50, // T026: Enforce subscription limit
    heartbeatInterval: 30000, // T025: 30s ping/pong
    enableLogging: process.env.NODE_ENV === 'development',
  })

  // Load initial orders
  const loadOrders = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // T020: This query uses idx_orders_driver_id for <50ms performance
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .in('status', status)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setOrders(data || [])
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      logger.error('Failed to load orders:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase, status])

  // Subscribe to real-time updates
  const subscribe = useCallback(() => {
    try {
      // T027: Use optimized connection manager
      const channel = connectionManager.subscribe('driver-orders')

      if (!channel) {
        throw new Error('Failed to create subscription channel (limit reached?)')
      }

      // Subscribe to INSERT events (new order assignments)
      channel
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orders',
            filter: `status=in.(${status.join(',')})`,
          },
          (payload) => {
            const newOrder = payload.new as Order
            logger.info('New order assigned', { orderId: newOrder.id })

            setOrders((prev) => [newOrder, ...prev])

            // Trigger callbacks
            if (onOrderAssigned) onOrderAssigned(newOrder)
            if (onOrderUpdate) onOrderUpdate(newOrder)
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
          },
          (payload) => {
            const updatedOrder = payload.new as Order
            const oldOrder = payload.old as Order

            logger.info('Order updated', {
              orderId: updatedOrder.id,
              oldStatus: oldOrder.status,
              newStatus: updatedOrder.status,
            })

            setOrders((prev) =>
              prev.map((order) => (order.id === updatedOrder.id ? updatedOrder : order))
            )

            // Trigger callbacks
            if (onOrderUpdate) onOrderUpdate(updatedOrder)
            if (onStatusChange && oldOrder.status !== updatedOrder.status) {
              onStatusChange(updatedOrder.id, updatedOrder.status, oldOrder.status)
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'orders',
          },
          (payload) => {
            const deletedOrder = payload.old as Order
            logger.info('Order deleted', { orderId: deletedOrder.id })

            setOrders((prev) => prev.filter((order) => order.id !== deletedOrder.id))
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setConnected(true)
            logger.info('Subscribed to driver orders channel')
          } else if (status === 'CHANNEL_ERROR') {
            setConnected(false)
            setError(new Error('Subscription channel error'))
          } else if (status === 'TIMED_OUT') {
            setConnected(false)
            setError(new Error('Subscription timed out'))
          }
        })

      return channel
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      logger.error('Failed to subscribe to orders:', error)
      return null
    }
  }, [connectionManager, status, onOrderAssigned, onOrderUpdate, onStatusChange])

  // Monitor connection health
  useEffect(() => {
    const unsubscribeState = connectionManager.onStateChange((state) => {
      setConnected(state === 'connected')
    })

    const unsubscribeQuality = connectionManager.onQualityChange((newQuality) => {
      setQuality(newQuality)
    })

    const unsubscribeError = connectionManager.onError((error) => {
      setError(error)
      logger.error('Connection manager error:', error)
    })

    return () => {
      unsubscribeState()
      unsubscribeQuality()
      unsubscribeError()
    }
  }, [connectionManager])

  // Auto-subscribe on mount
  useEffect(() => {
    loadOrders()

    if (!autoSubscribe) {
      return // No cleanup needed when not auto-subscribing
    }

    const channel = subscribe()

    return () => {
      if (channel) {
        connectionManager.unsubscribe('driver-orders')
      }
    }
  }, [autoSubscribe, loadOrders, subscribe, connectionManager])

  // Manual refresh
  const refresh = useCallback(() => {
    return loadOrders()
  }, [loadOrders])

  // Get connection stats
  const getStats = useCallback(() => {
    return connectionManager.getStats()
  }, [connectionManager])

  return {
    orders,
    loading,
    error,
    connected,
    quality,
    refresh,
    subscribe,
    getStats,
  }
}
