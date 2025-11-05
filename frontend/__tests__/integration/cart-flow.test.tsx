/**
 * Cart Flow Integration Tests
 * Tests complete shopping cart workflows from session to checkout
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useCart } from '@/hooks/useCart'
import { createClient } from '@/lib/supabase/client'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn()
}))

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    }
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('Cart Flow Integration Tests', () => {
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(),
      channel: vi.fn()
    }

    ;(createClient as any).mockReturnValue(mockSupabase)
    localStorageMock.clear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Complete Add to Cart Flow', () => {
    it('should create session, add item, and update totals', async () => {
      const mockSession = {
        id: 'session-1',
        expiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString()
      }

      const mockProduct = {
        id: 'prod-1',
        name: 'Test Product',
        price: 10.50,
        stock: 100
      }

      const mockCartItem = {
        id: 'item-1',
        sessionId: 'session-1',
        productId: 'prod-1',
        quantity: 2,
        product: mockProduct
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'cart_sessions') {
          return {
            insert: vi.fn().mockResolvedValue({
              data: [mockSession],
              error: null
            }),
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: null
                })
              })
            })
          }
        }
        if (table === 'products') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockProduct,
                  error: null
                })
              })
            })
          }
        }
        if (table === 'cart_items') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null
              })
            }),
            insert: vi.fn().mockResolvedValue({
              data: [mockCartItem],
              error: null
            }),
            upsert: vi.fn().mockResolvedValue({
              data: [mockCartItem],
              error: null
            })
          }
        }
        return {}
      })

      const { result } = renderHook(() => useCart())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Session should be created
      expect(result.current.sessionId).toBe('session-1')
      expect(localStorage.getItem('cart_session_id')).toBe('session-1')

      // Add item to cart
      let addResult: any
      await act(async () => {
        addResult = await result.current.addItem('prod-1', 2)
      })

      expect(addResult.success).toBe(true)
      expect(result.current.itemCount).toBe(2)
      expect(result.current.subtotal).toBe(21.00) // 2 * 10.50
    })

    it('should validate stock before adding to cart', async () => {
      const mockSession = {
        id: 'session-1',
        expiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString()
      }

      const mockProduct = {
        id: 'prod-1',
        name: 'Limited Stock Product',
        price: 10.50,
        stock: 5
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'cart_sessions') {
          return {
            insert: vi.fn().mockResolvedValue({
              data: [mockSession],
              error: null
            }),
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: null
                })
              })
            })
          }
        }
        if (table === 'products') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockProduct,
                  error: null
                })
              })
            })
          }
        }
        if (table === 'cart_items') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
          }
        }
        return {}
      })

      const { result } = renderHook(() => useCart())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Try to add more than available stock
      let addResult: any
      await act(async () => {
        addResult = await result.current.addItem('prod-1', 10)
      })

      expect(addResult.success).toBe(false)
      expect(addResult.error).toContain('stock')
    })
  })

  describe('Update Cart Quantity Flow', () => {
    it('should update existing item quantity and recalculate totals', async () => {
      const mockSession = {
        id: 'session-1',
        expiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString()
      }

      const existingItem = {
        id: 'item-1',
        sessionId: 'session-1',
        productId: 'prod-1',
        quantity: 2,
        product: {
          id: 'prod-1',
          name: 'Product',
          price: 10.00,
          stock: 100
        }
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'cart_sessions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockSession,
                  error: null
                })
              })
            })
          }
        }
        if (table === 'cart_items') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [existingItem],
                error: null
              })
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ ...existingItem, quantity: 5 }],
                error: null
              })
            })
          }
        }
        return {}
      })

      localStorage.setItem('cart_session_id', 'session-1')

      const { result } = renderHook(() => useCart())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.items).toHaveLength(1)
      expect(result.current.subtotal).toBe(20.00) // 2 * 10

      // Update quantity
      let updateResult: any
      await act(async () => {
        updateResult = await result.current.updateQuantity('item-1', 5)
      })

      expect(updateResult.success).toBe(true)
      expect(result.current.subtotal).toBe(50.00) // 5 * 10
    })

    it('should increment quantity when adding existing product', async () => {
      const mockSession = {
        id: 'session-1',
        expiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString()
      }

      const existingItem = {
        id: 'item-1',
        sessionId: 'session-1',
        productId: 'prod-1',
        quantity: 2,
        product: { price: 10.00 }
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'cart_sessions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockSession,
                  error: null
                })
              })
            })
          }
        }
        if (table === 'cart_items') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                data: [existingItem],
                error: null
              })
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ ...existingItem, quantity: 5 }],
                error: null
              })
            })
          }
        }
        return {}
      })

      localStorage.setItem('cart_session_id', 'session-1')

      const { result } = renderHook(() => useCart())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Add same product again (should increment)
      await act(async () => {
        await result.current.addItem('prod-1', 3)
      })

      expect(result.current.items[0].quantity).toBe(5)
    })
  })

  describe('Remove from Cart Flow', () => {
    it('should remove item and update totals', async () => {
      const mockSession = {
        id: 'session-1',
        expiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString()
      }

      const cartItems = [
        {
          id: 'item-1',
          productId: 'prod-1',
          quantity: 2,
          product: { price: 10.00 }
        },
        {
          id: 'item-2',
          productId: 'prod-2',
          quantity: 3,
          product: { price: 5.00 }
        }
      ]

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'cart_sessions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockSession,
                  error: null
                })
              })
            })
          }
        }
        if (table === 'cart_items') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: cartItems,
                error: null
              })
            }),
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: null
              })
            })
          }
        }
        return {}
      })

      localStorage.setItem('cart_session_id', 'session-1')

      const { result } = renderHook(() => useCart())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.items).toHaveLength(2)
      expect(result.current.subtotal).toBe(35.00) // (2*10) + (3*5)

      // Remove first item
      await act(async () => {
        await result.current.removeItem('item-1')
      })

      expect(result.current.items).toHaveLength(1)
      expect(result.current.subtotal).toBe(15.00) // 3*5
    })
  })

  describe('Clear Cart Flow', () => {
    it('should clear all items and reset totals', async () => {
      const mockSession = {
        id: 'session-1',
        expiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString()
      }

      const cartItems = [
        { id: 'item-1', quantity: 2, product: { price: 10.00 } },
        { id: 'item-2', quantity: 3, product: { price: 5.00 } }
      ]

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'cart_sessions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockSession,
                  error: null
                })
              })
            })
          }
        }
        if (table === 'cart_items') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: cartItems,
                error: null
              })
            }),
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: null
              })
            })
          }
        }
        return {}
      })

      localStorage.setItem('cart_session_id', 'session-1')

      const { result } = renderHook(() => useCart())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.items).toHaveLength(2)

      await act(async () => {
        await result.current.clearCart()
      })

      expect(result.current.items).toEqual([])
      expect(result.current.itemCount).toBe(0)
      expect(result.current.subtotal).toBe(0)
    })
  })

  describe('Session Persistence Flow', () => {
    it('should restore cart items on page reload', async () => {
      const existingSessionId = 'existing-session-1'
      localStorage.setItem('cart_session_id', existingSessionId)

      const mockSession = {
        id: existingSessionId,
        expiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString()
      }

      const savedItems = [
        {
          id: 'item-1',
          quantity: 2,
          product: { name: 'Product 1', price: 10.00 }
        }
      ]

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'cart_sessions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockSession,
                  error: null
                })
              })
            })
          }
        }
        if (table === 'cart_items') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: savedItems,
                error: null
              })
            })
          }
        }
        return {}
      })

      const { result } = renderHook(() => useCart())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.sessionId).toBe(existingSessionId)
      expect(result.current.items).toEqual(savedItems)
      expect(result.current.subtotal).toBe(20.00)
    })

    it('should create new session when expired', async () => {
      const expiredSessionId = 'expired-session-1'
      localStorage.setItem('cart_session_id', expiredSessionId)

      const newSession = {
        id: 'new-session-1',
        expiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString()
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'cart_sessions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: expiredSessionId,
                    expiresAt: new Date(Date.now() - 1000).toISOString()
                  },
                  error: null
                })
              })
            }),
            insert: vi.fn().mockResolvedValue({
              data: [newSession],
              error: null
            })
          }
        }
        if (table === 'cart_items') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
          }
        }
        return {}
      })

      const { result } = renderHook(() => useCart())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.sessionId).toBe('new-session-1')
      expect(result.current.items).toEqual([])
    })
  })

  describe('Real-time Cart Updates', () => {
    it('should handle real-time item additions', async () => {
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

      const mockSession = {
        id: 'session-1',
        expiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString()
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'cart_sessions') {
          return {
            insert: vi.fn().mockResolvedValue({
              data: [mockSession],
              error: null
            }),
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: null
                })
              })
            })
          }
        }
        if (table === 'cart_items') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
          }
        }
        return {}
      })

      const { result } = renderHook(() => useCart({ enableRealtime: true }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const newItem = {
        id: 'item-1',
        sessionId: 'session-1',
        productId: 'prod-1',
        quantity: 2,
        product: { price: 10.00 }
      }

      act(() => {
        insertCallback({
          eventType: 'INSERT',
          new: newItem
        })
      })

      await waitFor(() => {
        expect(result.current.items).toContainEqual(newItem)
      })
    })
  })
})
