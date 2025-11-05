/**
 * useInventoryTracking Hook
 *
 * Track real-time inventory changes
 * Features:
 * - Live stock updates
 * - Low stock alerts
 * - Inventory history
 * - Multi-product tracking
 */

'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'
import type { Product, InventoryHistory } from '@/types/database'

interface UseInventoryTrackingOptions {
  productId?: string
  productIds?: string[]
  autoSubscribe?: boolean
  trackHistory?: boolean
  lowStockThreshold?: number
}

interface InventoryAlert {
  productId: string
  productName: string
  currentStock: number
  threshold: number
  type: 'low_stock' | 'out_of_stock'
  timestamp: Date
}

interface UseInventoryTrackingReturn {
  // Product data
  product: Product | null
  products: Map<string, Product>

  // History
  history: InventoryHistory[]

  // Alerts
  alerts: InventoryAlert[]
  hasLowStock: boolean
  hasOutOfStock: boolean

  // Connection
  isConnected: boolean
  isLoading: boolean
  error: Error | null

  // Actions
  updateStock: (productId: string, newQuantity: number, notes?: string) => Promise<void>
  refresh: () => Promise<void>
  clearAlerts: () => void
}

export function useInventoryTracking(
  options: UseInventoryTrackingOptions = {}
): UseInventoryTrackingReturn {
  const {
    productId,
    productIds = [],
    autoSubscribe = true,
    trackHistory = false,
    lowStockThreshold = 10,
  } = options

  const supabase = createBrowserClient()
  const channelRef = useRef<RealtimeChannel | null>(null)

  const [product, setProduct] = useState<Product | null>(null)
  const [products, setProducts] = useState<Map<string, Product>>(new Map())
  const [history, setHistory] = useState<InventoryHistory[]>([])
  const [alerts, setAlerts] = useState<InventoryAlert[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const trackingIds = productId ? [productId, ...productIds] : productIds

  /**
   * Check for low stock and create alerts
   */
  const checkStockLevels = useCallback(
    (prod: Product) => {
      const threshold = (prod as any).low_stock_threshold || lowStockThreshold

      if (prod.stock_quantity === 0) {
        setAlerts((prev) => [
          ...prev.filter((a) => a.productId !== prod.id),
          {
            productId: prod.id,
            productName: prod.name,
            currentStock: prod.stock_quantity,
            threshold,
            type: 'out_of_stock' as const,
            timestamp: new Date(),
          },
        ])
      } else if (prod.stock_quantity <= threshold) {
        setAlerts((prev) => [
          ...prev.filter((a) => a.productId !== prod.id),
          {
            productId: prod.id,
            productName: prod.name,
            currentStock: prod.stock_quantity,
            threshold,
            type: 'low_stock' as const,
            timestamp: new Date(),
          },
        ])
      } else {
        setAlerts((prev) => prev.filter((a) => a.productId !== prod.id))
      }
    },
    [lowStockThreshold]
  )

  /**
   * Update product stock
   */
  const updateStock = useCallback(
    async (prodId: string, newQuantity: number, notes?: string) => {
      try {
        const { data, error: updateError } = await supabase
          .from('products')
          .update({ stock_quantity: newQuantity })
          .eq('id', prodId)
          .select()
          .single()

        if (updateError) throw updateError

        // Update local state
        if (prodId === productId) {
          setProduct(data)
        }

        setProducts((prev) => {
          const newMap = new Map(prev)
          newMap.set(prodId, data)
          return newMap
        })

        checkStockLevels(data)
        setError(null)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to update stock')
        setError(error)
        throw error
      }
    },
    [productId, supabase, checkStockLevels]
  )

  /**
   * Load initial data
   */
  const loadData = useCallback(async () => {
    if (trackingIds.length === 0) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)

      // Load products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .in('id', trackingIds)

      if (productsError) throw productsError

      // Update state
      if (productId && productsData) {
        const mainProduct = productsData.find((p) => p.id === productId)
        if (mainProduct) {
          setProduct(mainProduct)
          checkStockLevels(mainProduct)
        }
      }

      const productsMap = new Map<string, Product>()
      productsData?.forEach((p) => {
        productsMap.set(p.id, p)
        checkStockLevels(p)
      })
      setProducts(productsMap)

      // Load history if requested
      if (trackHistory) {
        const { data: historyData, error: historyError } = await supabase
          .from('inventory_history')
          .select('*')
          .in('product_id', trackingIds)
          .order('created_at', { ascending: false })
          .limit(50)

        if (historyError) throw historyError

        setHistory(historyData || [])
      }

      setError(null)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load inventory data')
      setError(error)
    } finally {
      setIsLoading(false)
    }
  }, [trackingIds, productId, trackHistory, supabase, checkStockLevels])

  /**
   * Refresh data
   */
  const refresh = useCallback(async () => {
    await loadData()
  }, [loadData])

  /**
   * Clear alerts
   */
  const clearAlerts = useCallback(() => {
    setAlerts([])
  }, [])

  /**
   * Subscribe to real-time updates
   */
  useEffect(() => {
    if (!autoSubscribe || trackingIds.length === 0) return

    const channel = supabase
      .channel('inventory-tracking')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
          filter: `id=in.(${trackingIds.join(',')})`,
        },
        (payload) => {
          const updatedProduct = payload.new as Product

          if (productId && updatedProduct.id === productId) {
            setProduct(updatedProduct)
          }

          setProducts((prev) => {
            const newMap = new Map(prev)
            newMap.set(updatedProduct.id, updatedProduct)
            return newMap
          })

          checkStockLevels(updatedProduct)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'inventory_history',
          filter: `product_id=in.(${trackingIds.join(',')})`,
        },
        (payload) => {
          if (trackHistory) {
            const newHistory = payload.new as InventoryHistory
            setHistory((prev) => [newHistory, ...prev].slice(0, 50))
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [autoSubscribe, trackingIds, productId, trackHistory, supabase, checkStockLevels])

  /**
   * Load initial data
   */
  useEffect(() => {
    loadData()
  }, [loadData])

  return {
    product,
    products,
    history,
    alerts,
    hasLowStock: alerts.some((a) => a.type === 'low_stock'),
    hasOutOfStock: alerts.some((a) => a.type === 'out_of_stock'),
    isConnected,
    isLoading,
    error,
    updateStock,
    refresh,
    clearAlerts,
  }
}
