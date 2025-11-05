/**
 * Order Service Test Suite
 * Tests for order service layer functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/client'
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  updateOrderStatus,
  assignDriver,
  cancelOrder,
  getOrderStatistics
} from '@/services/order-service'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn()
}))

describe('Order Service', () => {
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(),
      auth: {
        getUser: vi.fn()
      }
    }

    ;(createClient as any).mockReturnValue(mockSupabase)
  })

  describe('getOrders', () => {
    it('should fetch all orders', async () => {
      const mockOrders = [
        { id: '1', orderNumber: 'ORD-001', status: 'pending' },
        { id: '2', orderNumber: 'ORD-002', status: 'confirmed' }
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockOrders,
            error: null
          })
        })
      })

      const result = await getOrders()

      expect(result.data).toEqual(mockOrders)
      expect(result.error).toBeNull()
    })

    it('should filter orders by status', async () => {
      const mockOrders = [
        { id: '1', orderNumber: 'ORD-001', status: 'pending' }
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

      const result = await getOrders({ status: 'pending' })

      expect(result.data).toEqual(mockOrders)
      expect(result.error).toBeNull()
    })

    it('should filter orders by restaurant', async () => {
      const mockOrders = [
        { id: '1', orderNumber: 'ORD-001', restaurantId: 'rest-1' }
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

      const result = await getOrders({ restaurantId: 'rest-1' })

      expect(result.data).toEqual(mockOrders)
      expect(result.error).toBeNull()
    })

    it('should filter orders by driver', async () => {
      const mockOrders = [
        { id: '1', orderNumber: 'ORD-001', driverId: 'driver-1' }
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

      const result = await getOrders({ driverId: 'driver-1' })

      expect(result.data).toEqual(mockOrders)
      expect(result.error).toBeNull()
    })

    it('should handle fetch error', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Failed to fetch orders' }
          })
        })
      })

      const result = await getOrders()

      expect(result.data).toBeNull()
      expect(result.error).toBeTruthy()
    })

    it('should include related data', async () => {
      const mockOrders = [
        {
          id: '1',
          orderNumber: 'ORD-001',
          restaurant: { id: 'rest-1', name: 'Test Restaurant' },
          driver: { id: 'driver-1', fullName: 'Test Driver' },
          items: [{ id: 'item-1', quantity: 2 }]
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

      const result = await getOrders()

      expect(result.data[0].restaurant).toBeDefined()
      expect(result.data[0].driver).toBeDefined()
      expect(result.data[0].items).toBeDefined()
    })
  })

  describe('getOrderById', () => {
    it('should fetch order by id', async () => {
      const mockOrder = {
        id: '1',
        orderNumber: 'ORD-001',
        status: 'pending'
      }

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockOrder,
              error: null
            })
          })
        })
      })

      const result = await getOrderById('1')

      expect(result.data).toEqual(mockOrder)
      expect(result.error).toBeNull()
    })

    it('should handle order not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Order not found' }
            })
          })
        })
      })

      const result = await getOrderById('invalid-id')

      expect(result.data).toBeNull()
      expect(result.error).toBeTruthy()
    })
  })

  describe('createOrder', () => {
    it('should create order successfully', async () => {
      const newOrder = {
        restaurantId: 'rest-1',
        deliveryAddress: '123 Main St',
        items: [
          { productId: 'prod-1', quantity: 2, unitPrice: 10.50 }
        ]
      }

      const createdOrder = {
        id: '1',
        ...newOrder,
        orderNumber: 'ORD-001',
        status: 'pending',
        totalAmount: 21.00
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null
      })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'orders') {
          return {
            insert: vi.fn().mockResolvedValue({
              data: [createdOrder],
              error: null
            })
          }
        }
        if (table === 'order_items') {
          return {
            insert: vi.fn().mockResolvedValue({
              data: [{ id: 'item-1' }],
              error: null
            })
          }
        }
        return {}
      })

      const result = await createOrder(newOrder)

      expect(result.data).toEqual(createdOrder)
      expect(result.error).toBeNull()
    })

    it('should validate required fields', async () => {
      const invalidOrder = {
        restaurantId: '',
        deliveryAddress: '',
        items: []
      }

      const result = await createOrder(invalidOrder as any)

      expect(result.data).toBeNull()
      expect(result.error).toBeTruthy()
    })

    it('should calculate total amount correctly', async () => {
      const newOrder = {
        restaurantId: 'rest-1',
        deliveryAddress: '123 Main St',
        items: [
          { productId: 'prod-1', quantity: 2, unitPrice: 10.50 },
          { productId: 'prod-2', quantity: 3, unitPrice: 5.25 }
        ]
      }

      const createdOrder = {
        id: '1',
        ...newOrder,
        orderNumber: 'ORD-001',
        status: 'pending',
        totalAmount: 36.75 // (2 * 10.50) + (3 * 5.25)
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null
      })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'orders') {
          return {
            insert: vi.fn().mockResolvedValue({
              data: [createdOrder],
              error: null
            })
          }
        }
        if (table === 'order_items') {
          return {
            insert: vi.fn().mockResolvedValue({
              data: [{ id: 'item-1' }, { id: 'item-2' }],
              error: null
            })
          }
        }
        return {}
      })

      const result = await createOrder(newOrder)

      expect(result.data.totalAmount).toBe(36.75)
    })

    it('should handle create error', async () => {
      const newOrder = {
        restaurantId: 'rest-1',
        deliveryAddress: '123 Main St',
        items: [
          { productId: 'prod-1', quantity: 2, unitPrice: 10.50 }
        ]
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Failed to create order' }
        })
      })

      const result = await createOrder(newOrder)

      expect(result.data).toBeNull()
      expect(result.error).toBeTruthy()
    })
  })

  describe('updateOrder', () => {
    it('should update order successfully', async () => {
      const updates = {
        deliveryAddress: '456 New St',
        deliveryNotes: 'Ring doorbell'
      }

      const updatedOrder = {
        id: '1',
        ...updates
      }

      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [updatedOrder],
            error: null
          })
        })
      })

      const result = await updateOrder('1', updates)

      expect(result.data).toEqual(updatedOrder)
      expect(result.error).toBeNull()
    })

    it('should handle update error', async () => {
      const updates = {
        deliveryAddress: '456 New St'
      }

      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Failed to update order' }
          })
        })
      })

      const result = await updateOrder('1', updates)

      expect(result.data).toBeNull()
      expect(result.error).toBeTruthy()
    })
  })

  describe('updateOrderStatus', () => {
    it('should update order status', async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ id: '1', status: 'confirmed' }],
            error: null
          })
        })
      })

      const result = await updateOrderStatus('1', 'confirmed')

      expect(result.data.status).toBe('confirmed')
      expect(result.error).toBeNull()
    })

    it('should validate status transition', async () => {
      const result = await updateOrderStatus('1', 'invalid-status' as any)

      expect(result.data).toBeNull()
      expect(result.error).toBeTruthy()
    })

    it('should not allow invalid status changes', async () => {
      // e.g., cannot go from completed back to pending
      const result = await updateOrderStatus('1', 'pending', 'completed')

      expect(result.data).toBeNull()
      expect(result.error).toBeTruthy()
    })
  })

  describe('assignDriver', () => {
    it('should assign driver to order', async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ id: '1', driverId: 'driver-1' }],
            error: null
          })
        })
      })

      const result = await assignDriver('1', 'driver-1')

      expect(result.data.driverId).toBe('driver-1')
      expect(result.error).toBeNull()
    })

    it('should validate driver availability', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'driver-1', role: 'driver', isAvailable: false },
                  error: null
                })
              })
            })
          }
        }
        return {}
      })

      const result = await assignDriver('1', 'driver-1')

      expect(result.data).toBeNull()
      expect(result.error).toContain('not available')
    })

    it('should handle driver not found', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Driver not found' }
                })
              })
            })
          }
        }
        return {}
      })

      const result = await assignDriver('1', 'invalid-driver')

      expect(result.data).toBeNull()
      expect(result.error).toBeTruthy()
    })
  })

  describe('cancelOrder', () => {
    it('should cancel order successfully', async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ id: '1', status: 'cancelled' }],
            error: null
          })
        })
      })

      const result = await cancelOrder('1')

      expect(result.data.status).toBe('cancelled')
      expect(result.error).toBeNull()
    })

    it('should not cancel completed orders', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: '1', status: 'completed' },
              error: null
            })
          })
        })
      })

      const result = await cancelOrder('1')

      expect(result.data).toBeNull()
      expect(result.error).toContain('cannot cancel')
    })

    it('should not cancel delivered orders', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: '1', status: 'delivered' },
              error: null
            })
          })
        })
      })

      const result = await cancelOrder('1')

      expect(result.data).toBeNull()
      expect(result.error).toContain('cannot cancel')
    })
  })

  describe('getOrderStatistics', () => {
    it('should calculate order statistics', async () => {
      const mockOrders = [
        { id: '1', status: 'pending', totalAmount: 100 },
        { id: '2', status: 'confirmed', totalAmount: 200 },
        { id: '3', status: 'completed', totalAmount: 150 },
        { id: '4', status: 'pending', totalAmount: 75 }
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: mockOrders,
          error: null
        })
      })

      const result = await getOrderStatistics()

      expect(result.data.total).toBe(4)
      expect(result.data.pending).toBe(2)
      expect(result.data.confirmed).toBe(1)
      expect(result.data.completed).toBe(1)
      expect(result.data.totalRevenue).toBe(525)
    })

    it('should handle empty orders', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [],
          error: null
        })
      })

      const result = await getOrderStatistics()

      expect(result.data.total).toBe(0)
      expect(result.data.totalRevenue).toBe(0)
    })

    it('should filter statistics by date range', async () => {
      const mockOrders = [
        { id: '1', status: 'completed', totalAmount: 100, createdAt: '2025-01-15' }
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({
              data: mockOrders,
              error: null
            })
          })
        })
      })

      const result = await getOrderStatistics({
        startDate: '2025-01-01',
        endDate: '2025-01-31'
      })

      expect(result.data.total).toBe(1)
    })
  })
})
