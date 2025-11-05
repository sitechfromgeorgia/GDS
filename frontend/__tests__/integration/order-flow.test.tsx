/**
 * Order Flow Integration Tests
 * Tests complete order workflows from creation to delivery
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { createClient } from '@/lib/supabase/client'
import { useOrders } from '@/hooks/useOrders'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn()
}))

describe('Order Flow Integration Tests', () => {
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

  describe('Complete Order Creation Flow', () => {
    it('should create order with items and calculate total', async () => {
      const orderData = {
        restaurantId: 'rest-1',
        deliveryAddress: '123 Main St',
        deliveryNotes: 'Ring doorbell',
        items: [
          { productId: 'prod-1', quantity: 2, unitPrice: 10.50 },
          { productId: 'prod-2', quantity: 1, unitPrice: 15.00 }
        ]
      }

      const createdOrder = {
        id: 'order-1',
        orderNumber: 'ORD-001',
        restaurantId: 'rest-1',
        status: 'pending',
        totalAmount: 36.00,
        deliveryAddress: '123 Main St',
        deliveryNotes: 'Ring doorbell',
        createdAt: new Date().toISOString()
      }

      const orderItems = [
        { id: 'item-1', orderId: 'order-1', productId: 'prod-1', quantity: 2, unitPrice: 10.50, subtotal: 21.00 },
        { id: 'item-2', orderId: 'order-1', productId: 'prod-2', quantity: 1, unitPrice: 15.00, subtotal: 15.00 }
      ]

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'orders') {
          return {
            insert: vi.fn().mockResolvedValue({
              data: [createdOrder],
              error: null
            }),
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
          }
        }
        if (table === 'order_items') {
          return {
            insert: vi.fn().mockResolvedValue({
              data: orderItems,
              error: null
            })
          }
        }
        if (table === 'products') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [
                  { id: 'prod-1', stock: 100 },
                  { id: 'prod-2', stock: 50 }
                ],
                error: null
              })
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: null
              })
            })
          }
        }
        return {}
      })

      mockSupabase.channel.mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockResolvedValue({ status: 'subscribed' })
      })

      const { result } = renderHook(() => useOrders())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let createResult: any
      await act(async () => {
        createResult = await result.current.createOrder(orderData)
      })

      expect(createResult.success).toBe(true)
      expect(createResult.data).toEqual(createdOrder)
      expect(createResult.data.totalAmount).toBe(36.00)
      expect(createResult.data.status).toBe('pending')
    })

    it('should validate stock availability before order creation', async () => {
      const orderData = {
        restaurantId: 'rest-1',
        deliveryAddress: '123 Main St',
        items: [
          { productId: 'prod-1', quantity: 200, unitPrice: 10.50 }
        ]
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'products') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [{ id: 'prod-1', stock: 5 }],
                error: null
              })
            })
          }
        }
        return {}
      })

      const { result } = renderHook(() => useOrders())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let createResult: any
      await act(async () => {
        createResult = await result.current.createOrder(orderData)
      })

      expect(createResult.success).toBe(false)
      expect(createResult.error).toContain('stock')
    })

    it('should generate unique order number', async () => {
      const orderData = {
        restaurantId: 'rest-1',
        deliveryAddress: '123 Main St',
        items: [
          { productId: 'prod-1', quantity: 1, unitPrice: 10.50 }
        ]
      }

      const createdOrder = {
        id: 'order-1',
        orderNumber: 'ORD-001',
        status: 'pending',
        totalAmount: 10.50
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'orders') {
          return {
            insert: vi.fn().mockResolvedValue({
              data: [createdOrder],
              error: null
            }),
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
          }
        }
        if (table === 'order_items') {
          return {
            insert: vi.fn().mockResolvedValue({
              data: [],
              error: null
            })
          }
        }
        if (table === 'products') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [{ id: 'prod-1', stock: 100 }],
                error: null
              })
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: null
              })
            })
          }
        }
        return {}
      })

      const { result } = renderHook(() => useOrders())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let createResult: any
      await act(async () => {
        createResult = await result.current.createOrder(orderData)
      })

      expect(createResult.data.orderNumber).toBeTruthy()
      expect(createResult.data.orderNumber).toMatch(/ORD-\d+/)
    })
  })

  describe('Order Status Update Flow', () => {
    it('should update order status through lifecycle', async () => {
      const orderId = 'order-1'
      const statusFlow = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered']

      let currentStatus = 'pending'

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'orders') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: orderId, status: currentStatus }],
                error: null
              })
            }),
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: orderId, status: currentStatus }],
                error: null
              })
            })
          }
        }
        return {}
      })

      mockSupabase.channel.mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockResolvedValue({ status: 'subscribed' })
      })

      const { result } = renderHook(() => useOrders())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Test each status transition
      for (const status of statusFlow) {
        currentStatus = status

        await act(async () => {
          await result.current.updateOrderStatus(orderId, status)
        })

        await waitFor(() => {
          const order = result.current.orders.find(o => o.id === orderId)
          expect(order?.status).toBe(status)
        })
      }
    })

    it('should prevent invalid status transitions', async () => {
      const orderId = 'order-1'

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'orders') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: orderId, status: 'delivered' }],
                error: null
              })
            })
          }
        }
        return {}
      })

      const { result } = renderHook(() => useOrders())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let updateResult: any
      await act(async () => {
        updateResult = await result.current.updateOrderStatus(orderId, 'pending')
      })

      expect(updateResult.success).toBe(false)
      expect(updateResult.error).toContain('Invalid status transition')
    })

    it('should update timestamps on status change', async () => {
      const orderId = 'order-1'
      const now = new Date().toISOString()

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'orders') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{
                  id: orderId,
                  status: 'picked_up',
                  pickedUpAt: now
                }],
                error: null
              })
            }),
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: orderId, status: 'ready' }],
                error: null
              })
            })
          }
        }
        return {}
      })

      const { result } = renderHook(() => useOrders())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.updateOrderStatus(orderId, 'picked_up')
      })

      await waitFor(() => {
        const order = result.current.orders.find(o => o.id === orderId)
        expect(order?.pickedUpAt).toBeTruthy()
      })
    })
  })

  describe('Driver Assignment Flow', () => {
    it('should assign driver to order', async () => {
      const orderId = 'order-1'
      const driverId = 'driver-1'

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'orders') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{
                  id: orderId,
                  driverId: driverId,
                  status: 'confirmed',
                  assignedAt: new Date().toISOString()
                }],
                error: null
              })
            }),
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{
                  id: orderId,
                  status: 'pending',
                  driverId: null
                }],
                error: null
              })
            })
          }
        }
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{
                  id: driverId,
                  role: 'driver',
                  available: true
                }],
                error: null
              })
            })
          }
        }
        return {}
      })

      const { result } = renderHook(() => useOrders())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let assignResult: any
      await act(async () => {
        assignResult = await result.current.assignDriver(orderId, driverId)
      })

      expect(assignResult.success).toBe(true)
      expect(assignResult.data.driverId).toBe(driverId)
      expect(assignResult.data.status).toBe('confirmed')
    })

    it('should validate driver availability before assignment', async () => {
      const orderId = 'order-1'
      const driverId = 'driver-1'

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{
                  id: driverId,
                  role: 'driver',
                  available: false
                }],
                error: null
              })
            })
          }
        }
        return {}
      })

      const { result } = renderHook(() => useOrders())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let assignResult: any
      await act(async () => {
        assignResult = await result.current.assignDriver(orderId, driverId)
      })

      expect(assignResult.success).toBe(false)
      expect(assignResult.error).toContain('not available')
    })

    it('should prevent reassignment without unassigning first', async () => {
      const orderId = 'order-1'
      const driverId1 = 'driver-1'
      const driverId2 = 'driver-2'

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'orders') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{
                  id: orderId,
                  driverId: driverId1,
                  status: 'confirmed'
                }],
                error: null
              })
            })
          }
        }
        return {}
      })

      const { result } = renderHook(() => useOrders())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let assignResult: any
      await act(async () => {
        assignResult = await result.current.assignDriver(orderId, driverId2)
      })

      expect(assignResult.success).toBe(false)
      expect(assignResult.error).toContain('already assigned')
    })
  })

  describe('Order Cancellation Flow', () => {
    it('should cancel pending order and restore stock', async () => {
      const orderId = 'order-1'
      const orderItems = [
        { productId: 'prod-1', quantity: 2 },
        { productId: 'prod-2', quantity: 1 }
      ]

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'orders') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{
                  id: orderId,
                  status: 'cancelled',
                  cancelledAt: new Date().toISOString()
                }],
                error: null
              })
            }),
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{
                  id: orderId,
                  status: 'pending'
                }],
                error: null
              })
            })
          }
        }
        if (table === 'order_items') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: orderItems,
                error: null
              })
            })
          }
        }
        if (table === 'products') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: null
              })
            })
          }
        }
        return {}
      })

      const { result } = renderHook(() => useOrders())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let cancelResult: any
      await act(async () => {
        cancelResult = await result.current.cancelOrder(orderId, 'Customer request')
      })

      expect(cancelResult.success).toBe(true)
      expect(cancelResult.data.status).toBe('cancelled')
    })

    it('should prevent cancellation of delivered orders', async () => {
      const orderId = 'order-1'

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'orders') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{
                  id: orderId,
                  status: 'delivered'
                }],
                error: null
              })
            })
          }
        }
        return {}
      })

      const { result } = renderHook(() => useOrders())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let cancelResult: any
      await act(async () => {
        cancelResult = await result.current.cancelOrder(orderId, 'Changed mind')
      })

      expect(cancelResult.success).toBe(false)
      expect(cancelResult.error).toContain('cannot be cancelled')
    })

    it('should require cancellation reason', async () => {
      const orderId = 'order-1'

      const { result } = renderHook(() => useOrders())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let cancelResult: any
      await act(async () => {
        cancelResult = await result.current.cancelOrder(orderId, '')
      })

      expect(cancelResult.success).toBe(false)
      expect(cancelResult.error).toContain('reason')
    })
  })

  describe('Real-time Order Updates', () => {
    it('should receive real-time order status updates', async () => {
      let subscriptionCallback: any

      mockSupabase.channel.mockReturnValue({
        on: vi.fn().mockImplementation((event: string, filter: any, callback: any) => {
          subscriptionCallback = callback
          return mockSupabase.channel()
        }),
        subscribe: vi.fn().mockResolvedValue({ status: 'subscribed' })
      })

      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      }))

      const { result } = renderHook(() => useOrders())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Simulate real-time update
      const updatedOrder = {
        id: 'order-1',
        status: 'confirmed',
        driverId: 'driver-1'
      }

      act(() => {
        subscriptionCallback({
          eventType: 'UPDATE',
          new: updatedOrder,
          old: { id: 'order-1', status: 'pending' }
        })
      })

      await waitFor(() => {
        const order = result.current.orders.find(o => o.id === 'order-1')
        expect(order?.status).toBe('confirmed')
      })
    })

    it('should add new orders via real-time subscription', async () => {
      let subscriptionCallback: any

      mockSupabase.channel.mockReturnValue({
        on: vi.fn().mockImplementation((event: string, filter: any, callback: any) => {
          subscriptionCallback = callback
          return mockSupabase.channel()
        }),
        subscribe: vi.fn().mockResolvedValue({ status: 'subscribed' })
      })

      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      }))

      const { result } = renderHook(() => useOrders())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const newOrder = {
        id: 'order-2',
        orderNumber: 'ORD-002',
        status: 'pending',
        totalAmount: 25.00
      }

      act(() => {
        subscriptionCallback({
          eventType: 'INSERT',
          new: newOrder
        })
      })

      await waitFor(() => {
        expect(result.current.orders).toContainEqual(newOrder)
      })
    })
  })

  describe('Order Statistics Flow', () => {
    it('should calculate order statistics correctly', async () => {
      const mockOrders = [
        { id: '1', status: 'pending', totalAmount: 50.00 },
        { id: '2', status: 'confirmed', totalAmount: 75.00 },
        { id: '3', status: 'delivered', totalAmount: 100.00 },
        { id: '4', status: 'delivered', totalAmount: 150.00 },
        { id: '5', status: 'cancelled', totalAmount: 25.00 }
      ]

      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockOrders,
            error: null
          })
        })
      }))

      mockSupabase.channel.mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockResolvedValue({ status: 'subscribed' })
      })

      const { result } = renderHook(() => useOrders())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.fetchStatistics()
      })

      await waitFor(() => {
        expect(result.current.statistics).toBeDefined()
        expect(result.current.statistics.total).toBe(5)
        expect(result.current.statistics.pending).toBe(1)
        expect(result.current.statistics.delivered).toBe(2)
        expect(result.current.statistics.cancelled).toBe(1)
        expect(result.current.statistics.totalRevenue).toBe(375.00) // All orders except cancelled
      })
    })
  })

  describe('Multi-Role Order Access', () => {
    it('should filter orders by restaurant for restaurant role', async () => {
      const restaurantId = 'rest-1'
      const mockOrders = [
        { id: '1', restaurantId: 'rest-1', status: 'pending' },
        { id: '2', restaurantId: 'rest-2', status: 'pending' },
        { id: '3', restaurantId: 'rest-1', status: 'confirmed' }
      ]

      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockOrders.filter(o => o.restaurantId === restaurantId),
            error: null
          })
        })
      }))

      mockSupabase.channel.mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockResolvedValue({ status: 'subscribed' })
      })

      const { result } = renderHook(() => useOrders())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.fetchOrders({ restaurantId })
      })

      await waitFor(() => {
        expect(result.current.orders).toHaveLength(2)
        expect(result.current.orders.every(o => o.restaurantId === restaurantId)).toBe(true)
      })
    })

    it('should filter orders by driver for driver role', async () => {
      const driverId = 'driver-1'
      const mockOrders = [
        { id: '1', driverId: 'driver-1', status: 'picked_up' },
        { id: '2', driverId: 'driver-2', status: 'picked_up' },
        { id: '3', driverId: 'driver-1', status: 'delivered' }
      ]

      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockOrders.filter(o => o.driverId === driverId),
            error: null
          })
        })
      }))

      mockSupabase.channel.mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockResolvedValue({ status: 'subscribed' })
      })

      const { result } = renderHook(() => useOrders())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.fetchOrders({ driverId })
      })

      await waitFor(() => {
        expect(result.current.orders).toHaveLength(2)
        expect(result.current.orders.every(o => o.driverId === driverId)).toBe(true)
      })
    })
  })
})
