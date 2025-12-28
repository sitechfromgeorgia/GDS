'use client'
import { logger } from '@/lib/logger'

import { useState, useCallback } from 'react'
import type {
  OrderSubmissionInput,
  OrderSubmissionResult,
  OrderWithItems,
} from '@/types/order-submission'
import { orderSubmissionService } from '@/services/order-submission.service'
import { ORDER_SUBMISSION_GEORGIAN } from '@/types/order-submission'

export interface UseOrderSubmissionReturn {
  submitOrder: (input: OrderSubmissionInput) => Promise<void>
  trackOrder: (orderId: string) => Promise<OrderWithItems | null>
  cancelOrder: (orderId: string, reason?: string) => Promise<OrderSubmissionResult>
  isLoading: boolean
  error: string | null
  success: boolean
  lastOrderId: string | null
  clearError: () => void
  reset: () => void
}

export function useOrderSubmission(): UseOrderSubmissionReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [lastOrderId, setLastOrderId] = useState<string | null>(null)

  const submitOrder = useCallback(async (input: OrderSubmissionInput): Promise<void> => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await orderSubmissionService.submitOrder(input)

      if (result.success && result.orderId) {
        setSuccess(true)
        setLastOrderId(result.orderId)
      } else {
        const errorMessage = result.validationErrors?.length
          ? result.validationErrors.map((err) => err.georgianMessage).join(', ')
          : result.message
        setError(errorMessage || ORDER_SUBMISSION_GEORGIAN.messages.validationFailed)
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : ORDER_SUBMISSION_GEORGIAN.messages.networkError
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const trackOrder = useCallback(async (orderId: string): Promise<OrderWithItems | null> => {
    try {
      const order = await orderSubmissionService.trackOrder(orderId)
      return order
    } catch (err) {
      logger.error('Order tracking failed:', err)
      return null
    }
  }, [])

  const cancelOrder = useCallback(
    async (orderId: string, reason?: string): Promise<OrderSubmissionResult> => {
      try {
        const result = await orderSubmissionService.cancelOrder(orderId, reason)
        return result
      } catch (err) {
        return {
          success: false,
          totalAmount: 0,
          message: ORDER_SUBMISSION_GEORGIAN.messages.networkError,
          orderId,
          validationErrors: [],
        }
      }
    },
    []
  )

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const reset = useCallback(() => {
    setIsLoading(false)
    setError(null)
    setSuccess(false)
    setLastOrderId(null)
  }, [])

  return {
    submitOrder,
    trackOrder,
    cancelOrder,
    isLoading,
    error,
    success,
    lastOrderId,
    clearError,
    reset,
  }
}

// Alternative hook for restaurant-specific order submission
export function useRestaurantOrderSubmission(
  restaurantId: string,
  options?: {
    enableNotifications?: boolean
    autoConfirm?: boolean
    rushDeliveryAvailable?: boolean
  }
): UseOrderSubmissionReturn {
  const baseHook = useOrderSubmission()
  const [restaurantOptions] = useState({
    enableNotifications: options?.enableNotifications ?? true,
    autoConfirm: options?.autoConfirm ?? false,
    rushDeliveryAvailable: options?.rushDeliveryAvailable ?? true,
  })

  const submitOrder = useCallback(
    async (input: OrderSubmissionInput): Promise<void> => {
      const enrichedInput: OrderSubmissionInput = {
        ...input,
        restaurantId,
        ...(restaurantOptions.rushDeliveryAvailable && { priority: input.priority }),
        ...(restaurantOptions.enableNotifications && {
          preferredDeliveryDate: input.preferredDeliveryDate,
        }),
      }

      return baseHook.submitOrder(enrichedInput)
    },
    [restaurantId, restaurantOptions, baseHook.submitOrder]
  )

  return {
    ...baseHook,
    submitOrder,
  }
}

// Bulk order submission hook
export function useBulkOrderSubmission() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<any[]>([])

  const submitBulkOrders = useCallback(async (orders: OrderSubmissionInput[]): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      // This would use the bulk submission service method
      // For now, we'll simulate sequential submission
      const submissionPromises = orders.map(async (order, index) => {
        try {
          const result = await orderSubmissionService.submitOrder(order)
          return { index, success: result.success, orderId: result.orderId, error: null }
        } catch (err) {
          return {
            index,
            success: false,
            orderId: null,
            error: err instanceof Error ? err.message : 'Unknown error',
          }
        }
      })

      const submissionResults = await Promise.all(submissionPromises)
      setResults(submissionResults)

      // Check if any orders failed
      const failedOrders = submissionResults.filter((result) => !result.success)
      if (failedOrders.length > 0) {
        setError(`${failedOrders.length} orders failed to submit`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk submission failed')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const clearResults = useCallback(() => {
    setResults([])
  }, [])

  return {
    submitBulkOrders,
    isLoading,
    error,
    results,
    clearError,
    clearResults,
  }
}

// Analytics hook for order submissions
export function useOrderAnalytics() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<any>(null)

  const fetchAnalytics = useCallback(
    async (restaurantId: string, dateRange?: { start: string; end: string }) => {
      setIsLoading(true)
      setError(null)

      try {
        // This would call the analytics endpoint
        // For now, we'll mock the data
        const mockAnalytics = {
          totalOrders: 0,
          averageOrderValue: 0,
          popularProducts: [],
          dailyOrders: {},
          hourlyDistribution: {},
        }
        setAnalytics(mockAnalytics)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch analytics')
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  return {
    fetchAnalytics,
    isLoading,
    error,
    analytics,
  }
}
