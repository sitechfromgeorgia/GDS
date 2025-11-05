/**
 * useOrders Hook Test Suite
 * Tests for orders management hook functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useOrders } from '@/hooks/useOrders'
import { createClient } from '@/lib/supabase/client'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn()
}))

describe('useOrders Hook', () => {
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(),
      channel: vi.fn()
    }

    ;(createClient as any).mockReturnValue(mockSupabase)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Fetching Orders', () => {
    it('should fetch orders successfully', async () => {
      const mockOrders = [
        {
          id: '1',
          orderNumber: 'ORD-20250115-001',
          status: 'pending',
          totalAmount: 150.50,
          restaurantId: 'rest-1',
          restaurant: { name: 'Test Restaurant' }
        },
        {
          id: '2',
          orderNumber: 'ORD-20250115-002',
          status: 'confirmed',
          totalAmount: 200.00,
          restaurantId: 'rest-2',
          restaurant: { name: 'Another Restaurant' }
        }
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockOrders,
            error: null
          })
        })
      })

      const { result } = renderHook(() => useOrders())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.orders).toEqual(mockOrders)
      expect(result.current.orders).toHaveLength(2)
    })

    it('should handle fetch orders error', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Failed to fetch orders' }
          })
        })
      })

      const { result } = renderHook(() => useOrders())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.orders).toEqual([])
      expect(result.current.error).toBeTruthy()
    })

    it('should filter orders by status', async () => {
      const mockOrders = [
        { id: '1', status: 'pending', totalAmount: 100 },
        { id: '2', status: 'confirmed', totalAmount: 200 },
        { id: '3', status: 'pending', totalAmount: 150 }
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockOrders.filter(o => o.status === 'pending'),
              error: null
            })
          })
        })
      })

      const { result } = renderHook(() => useOrders({ status: 'pending' }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.orders).toHaveLength(2)
      expect(result.current.orders.every(o => o.status === 'pending')).toBe(true)
    })

    it('should filter orders by restaurant', async () => {
      const mockOrders = [
        { id: '1', restaurantId: 'rest-1', totalAmount: 100 },
        { id: '2', restaurantId: 'rest-1', totalAmount: 200 }
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockOrders,
              error: null
            })
          })
        })
      })

      const { result } = renderHook(() => useOrders({ restaurantId: 'rest-1' }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.orders).toHaveLength(2)
      expect(result.current.orders.every(o => o.restaurantId === 'rest-1')).toBe(true)
    })
  })

  describe('Creating Orders', () => {
    it('should create order successfully', async () => {
      const newOrder = {
        restaurantId: 'rest-1',
        deliveryAddress: '123 Main St',
        deliveryNotes: 'Ring doorbell',
        items: [
          { productId: 'prod-1', quantity: 2, unitPrice: 10.50 }
        ]
      }

      const createdOrder = {
        id: '1',
        ...newOrder,
        orderNumber: 'ORD-20250115-001',
        status: 'pending',
        totalAmount: 21.00
      }

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: [createdOrder],
          error: null
        }),
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })

      const { result } = renderHook(() => useOrders())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let createResult: any
      await act(async () => {
        createResult = await result.current.createOrder(newOrder)
      })

      expect(createResult.success).toBe(true)
      expect(createResult.data).toEqual(createdOrder)
    })

    it('should handle create order error', async () => {
      const newOrder = {
        restaurantId: 'rest-1',
        deliveryAddress: '123 Main St',
        items: [
          { productId: 'prod-1', quantity: 2, unitPrice: 10.50 }
        ]
      }

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Failed to create order' }
        }),
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })

      const { result } = renderHook(() => useOrders())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let createResult: any
      await act(async () => {
        createResult = await result.current.createOrder(newOrder)
      })

      expect(createResult.success).toBe(false)
      expect(createResult.error).toBeTruthy()
    })

    it('should validate order items before creating', async () => {
      const invalidOrder = {
        restaurantId: 'rest-1',
        deliveryAddress: '123 Main St',
        items: []
      }

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })

      const { result } = renderHook(() => useOrders())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let createResult: any
      await act(async () => {
        createResult = await result.current.createOrder(invalidOrder)
      })

      expect(createResult.success).toBe(false)
      expect(createResult.error).toContain('items')
    })
  })

  describe('Updating Orders', () => {
    it('should update order status successfully', async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ id: '1', status: 'confirmed' }],
            error: null
          })
        }),
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })

      const { result } = renderHook(() => useOrders())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let updateResult: any
      await act(async () => {
        updateResult = await result.current.updateOrderStatus('1', 'confirmed')
      })

      expect(updateResult.success).toBe(true)
    })

    it('should handle update order error', async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Failed to update order' }
          })
        }),
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })

      const { result } = renderHook(() => useOrders())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let updateResult: any
      await act(async () => {
        updateResult = await result.current.updateOrderStatus('1', 'confirmed')
      })

      expect(updateResult.success).toBe(false)
      expect(updateResult.error).toBeTruthy()
    })

    it('should assign driver to order', async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ id: '1', driverId: 'driver-1' }],
            error: null
          })
        }),
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })

      const { result } = renderHook(() => useOrders())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let assignResult: any
      await act(async () => {
        assignResult = await result.current.assignDriver('1', 'driver-1')
      })

      expect(assignResult.success).toBe(true)
    })
  })

  describe('Deleting Orders', () => {
    it('should cancel order successfully', async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ id: '1', status: 'cancelled' }],
            error: null
          })
        }),
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })

      const { result } = renderHook(() => useOrders())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let cancelResult: any
      await act(async () => {
        cancelResult = await result.current.cancelOrder('1')
      })

      expect(cancelResult.success).toBe(true)
    })

    it('should not cancel completed orders', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })

      const { result } = renderHook(() => useOrders())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let cancelResult: any
      await act(async () => {
        cancelResult = await result.current.cancelOrder('1', 'completed')
      })

      expect(cancelResult.success).toBe(false)
      expect(cancelResult.error).toContain('completed')
    })
  })

  describe('Real-time Updates', () => {
    it('should subscribe to order updates', async () => {
      const mockSubscription = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn()
      }

      mockSupabase.channel.mockReturnValue(mockSubscription)
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })

      renderHook(() => useOrders({ enableRealtime: true }))

      await waitFor(() => {
        expect(mockSupabase.channel).toHaveBeenCalledWith('orders')
      })

      expect(mockSubscription.on).toHaveBeenCalled()
      expect(mockSubscription.subscribe).toHaveBeenCalled()
    })

    it('should handle real-time INSERT event', async () => {
      let insertCallback: any

      const mockSubscription = {
        on: vi.fn().mockImplementation((event: string, callback: any) => {
          if (event === 'postgres_changes') {
            insertCallback = callback
          }
          return mockSubscription
        }),
        subscribe: vi.fn()
      }

      mockSupabase.channel.mockReturnValue(mockSubscription)
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })

      const { result } = renderHook(() => useOrders({ enableRealtime: true }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const newOrder = {
        id: '1',
        orderNumber: 'ORD-20250115-001',
        status: 'pending'
      }

      act(() => {
        insertCallback({
          eventType: 'INSERT',
          new: newOrder
        })
      })

      await waitFor(() => {
        expect(result.current.orders).toContainEqual(newOrder)
      })
    })

    it('should handle real-time UPDATE event', async () => {
      let updateCallback: any

      const mockSubscription = {
        on: vi.fn().mockImplementation((event: string, callback: any) => {
          if (event === 'postgres_changes') {
            updateCallback = callback
          }
          return mockSubscription
        }),
        subscribe: vi.fn()
      }

      mockSupabase.channel.mockReturnValue(mockSubscription)
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [{ id: '1', status: 'pending' }],
            error: null
          })
        })
      })

      const { result } = renderHook(() => useOrders({ enableRealtime: true }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        updateCallback({
          eventType: 'UPDATE',
          new: { id: '1', status: 'confirmed' }
        })
      })

      await waitFor(() => {
        expect(result.current.orders[0].status).toBe('confirmed')
      })
    })
  })

  describe('Statistics', () => {
    it('should calculate order statistics', async () => {
      const mockOrders = [
        { id: '1', status: 'pending', totalAmount: 100 },
        { id: '2', status: 'confirmed', totalAmount: 200 },
        { id: '3', status: 'completed', totalAmount: 150 },
        { id: '4', status: 'pending', totalAmount: 75 }
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockOrders,
            error: null
          })
        })
      })

      const { result } = renderHook(() => useOrders())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.statistics.total).toBe(4)
      expect(result.current.statistics.pending).toBe(2)
      expect(result.current.statistics.confirmed).toBe(1)
      expect(result.current.statistics.completed).toBe(1)
      expect(result.current.statistics.totalRevenue).toBe(525)
    })
  })

  describe('Cleanup', () => {
    it('should unsubscribe on unmount', async () => {
      const mockUnsubscribe = vi.fn()

      mockSupabase.channel.mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnValue({
          unsubscribe: mockUnsubscribe
        })
      })

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })

      const { unmount } = renderHook(() => useOrders({ enableRealtime: true }))

      await waitFor(() => {
        expect(mockSupabase.channel).toHaveBeenCalled()
      })

      unmount()

      expect(mockUnsubscribe).toHaveBeenCalled()
    })
  })
})
