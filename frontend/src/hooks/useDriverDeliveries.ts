import { logger } from '@/lib/logger'
import { useState, useEffect, useCallback } from 'react'
import type { DriverDelivery, DriverFilters } from '@/types/driver'
import { createBrowserClient } from '@/lib/supabase'

// Create Supabase client instance
const supabase = createBrowserClient()

interface UseDriverDeliveriesReturn {
  deliveries: DriverDelivery[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  updateDeliveryStatus: (
    deliveryId: string,
    status: DriverDelivery['status'],
    notes?: string
  ) => Promise<boolean>
  filters: DriverFilters
  setFilters: (filters: DriverFilters) => void
  totalCount: number
  hasMore: boolean
  loadMore: () => Promise<void>
}

export function useDriverDeliveries(initialFilters: DriverFilters = {}): UseDriverDeliveriesReturn {
  const [deliveries, setDeliveries] = useState<DriverDelivery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<DriverFilters>(initialFilters)
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20

  const fetchDeliveries = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      try {
        setLoading(true)
        setError(null)

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          throw new Error('User not authenticated')
        }

        let query = (supabase as any)
          .from('deliveries')
          .select(
            `
          *,
          order:orders(
            id,
            restaurant_name,
            total_amount,
            order_items(
              product_name,
              quantity,
              unit
            )
          )
        `
          )
          .eq('driver_id', user.id)
          .order('created_at', { ascending: false })
          .range((pageNum - 1) * PAGE_SIZE, pageNum * PAGE_SIZE - 1)

        // Apply filters
        if (filters.status && filters.status.length > 0) {
          query = query.in('status', filters.status)
        }

        if (filters.date_range) {
          query = query
            .gte('created_at', filters.date_range.start)
            .lte('created_at', filters.date_range.end)
        }

        if (filters.search) {
          query = query.or(
            `order_id.ilike.%${filters.search}%,delivery_address.ilike.%${filters.search}%`
          )
        }

        if (filters.priority === 'high') {
          query = query.lt(
            'estimated_delivery_time',
            new Date(Date.now() + 30 * 60 * 1000).toISOString()
          )
        }

        const { data, error: fetchError, count } = await query

        if (fetchError) {
          throw fetchError
        }

        const transformedDeliveries: DriverDelivery[] = (data || []).map((item: any) => ({
          id: item.id,
          order_id: item.order_id,
          driver_id: item.driver_id,
          status: item.status,
          pickup_time: item.pickup_time,
          delivery_time: item.delivery_time,
          estimated_delivery_time: item.estimated_delivery_time,
          actual_delivery_time: item.actual_delivery_time,
          delivery_address: item.delivery_address,
          delivery_coordinates: item.delivery_coordinates,
          customer_name: item.customer_name,
          customer_phone: item.customer_phone,
          special_instructions: item.special_instructions,
          delivery_fee: item.delivery_fee,
          distance_km: item.distance_km,
          estimated_duration_minutes: item.estimated_duration_minutes,
          actual_duration_minutes: item.actual_duration_minutes,
          created_at: item.created_at,
          updated_at: item.updated_at,
          order: item.order
            ? {
                id: item.order.id,
                restaurant_name: item.order.restaurant_name,
                total_amount: item.order.total_amount,
                items: item.order.order_items || [],
              }
            : undefined,
        }))

        if (append) {
          setDeliveries((prev) => [...prev, ...transformedDeliveries])
        } else {
          setDeliveries(transformedDeliveries)
        }

        setTotalCount(count || 0)
        setHasMore((count || 0) > pageNum * PAGE_SIZE)
        setPage(pageNum)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch deliveries')
        logger.error('Error fetching deliveries:', err)
      } finally {
        setLoading(false)
      }
    },
    [filters]
  )

  const refetch = useCallback(async () => {
    await fetchDeliveries(1, false)
  }, [fetchDeliveries])

  const loadMore = useCallback(async () => {
    if (hasMore && !loading) {
      await fetchDeliveries(page + 1, true)
    }
  }, [fetchDeliveries, hasMore, loading, page])

  const updateDeliveryStatus = useCallback(
    async (
      deliveryId: string,
      status: DriverDelivery['status'],
      notes?: string
    ): Promise<boolean> => {
      try {
        const updateData: Record<string, any> = {
          status,
          updated_at: new Date().toISOString(),
        }

        // Set timestamps based on status
        if (status === 'picked_up' && !deliveries.find((d) => d.id === deliveryId)?.pickup_time) {
          updateData.pickup_time = new Date().toISOString()
        } else if (
          status === 'delivered' &&
          !deliveries.find((d) => d.id === deliveryId)?.delivery_time
        ) {
          updateData.delivery_time = new Date().toISOString()
          updateData.actual_delivery_time = new Date().toISOString()
        }

        if (notes) {
          updateData.notes = notes
        }

        const { error } = await (supabase as any)
          .from('deliveries')
          .update(updateData)
          .eq('id', deliveryId)

        if (error) {
          throw error
        }

        // Update local state
        setDeliveries((prev) =>
          prev.map((delivery) =>
            delivery.id === deliveryId ? { ...delivery, ...updateData } : delivery
          )
        )

        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update delivery status')
        logger.error('Error updating delivery status:', err)
        return false
      }
    },
    [deliveries]
  )

  // Initial load
  useEffect(() => {
    fetchDeliveries(1, false)
  }, [fetchDeliveries])

  return {
    deliveries,
    loading,
    error,
    refetch,
    updateDeliveryStatus,
    filters,
    setFilters,
    totalCount,
    hasMore,
    loadMore,
  }
}
