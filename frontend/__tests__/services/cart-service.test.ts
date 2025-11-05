/**
 * Cart Service Test Suite
 * Tests for cart service layer functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/client'
import {
  createCartSession,
  getCartSession,
  getCartItems,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  calculateCartTotal,
  cleanupExpiredSessions
} from '@/services/cart-service'

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

describe('Cart Service', () => {
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn()
    }

    ;(createClient as any).mockReturnValue(mockSupabase)
    localStorageMock.clear()
  })

  describe('createCartSession', () => {
    it('should create new cart session', async () => {
      const mockSession = {
        id: 'session-1',
        expiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString()
      }

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: [mockSession],
          error: null
        })
      })

      const result = await createCartSession()

      expect(result.data).toEqual(mockSession)
      expect(result.error).toBeNull()
      expect(localStorage.getItem('cart_session_id')).toBe('session-1')
    })

    it('should handle create session error', async () => {
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Failed to create session' }
        })
      })

      const result = await createCartSession()

      expect(result.data).toBeNull()
      expect(result.error).toBeTruthy()
    })

    it('should set expiration time', async () => {
      const mockSession = {
        id: 'session-1',
        expiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString()
      }

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: [mockSession],
          error: null
        })
      })

      const result = await createCartSession()

      expect(new Date(result.data.expiresAt).getTime()).toBeGreaterThan(Date.now())
    })
  })

  describe('getCartSession', () => {
    it('should retrieve existing session', async () => {
      const sessionId = 'session-1'
      localStorage.setItem('cart_session_id', sessionId)

      const mockSession = {
        id: sessionId,
        expiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString()
      }

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockSession,
              error: null
            })
          })
        })
      })

      const result = await getCartSession()

      expect(result.data).toEqual(mockSession)
    })

    it('should create new session if none exists', async () => {
      const mockSession = {
        id: 'new-session-1',
        expiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString()
      }

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: [mockSession],
          error: null
        })
      })

      const result = await getCartSession()

      expect(result.data).toEqual(mockSession)
    })

    it('should create new session if expired', async () => {
      const expiredSessionId = 'expired-session'
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
        return {}
      })

      const result = await getCartSession()

      expect(result.data.id).toBe('new-session-1')
    })
  })

  describe('getCartItems', () => {
    it('should retrieve cart items', async () => {
      const mockItems = [
        { id: '1', productId: 'prod-1', quantity: 2, product: { name: 'Product 1', price: 10 } },
        { id: '2', productId: 'prod-2', quantity: 1, product: { name: 'Product 2', price: 20 } }
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockItems,
            error: null
          })
        })
      })

      const result = await getCartItems('session-1')

      expect(result.data).toEqual(mockItems)
      expect(result.data).toHaveLength(2)
    })

    it('should handle empty cart', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })

      const result = await getCartItems('session-1')

      expect(result.data).toEqual([])
    })

    it('should include product details', async () => {
      const mockItems = [
        {
          id: '1',
          productId: 'prod-1',
          quantity: 2,
          product: {
            id: 'prod-1',
            name: 'Product 1',
            price: 10,
            imageUrl: '/image.jpg'
          }
        }
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockItems,
            error: null
          })
        })
      })

      const result = await getCartItems('session-1')

      expect(result.data[0].product).toBeDefined()
      expect(result.data[0].product.name).toBe('Product 1')
    })
  })

  describe('addToCart', () => {
    it('should add new item to cart', async () => {
      const newItem = {
        sessionId: 'session-1',
        productId: 'prod-1',
        quantity: 2
      }

      const createdItem = {
        id: '1',
        ...newItem
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'cart_items') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [],
                  error: null
                })
              })
            }),
            insert: vi.fn().mockResolvedValue({
              data: [createdItem],
              error: null
            })
          }
        }
        return {}
      })

      const result = await addToCart('session-1', 'prod-1', 2)

      expect(result.data).toEqual(createdItem)
      expect(result.error).toBeNull()
    })

    it('should update quantity if item exists', async () => {
      const existingItem = {
        id: '1',
        sessionId: 'session-1',
        productId: 'prod-1',
        quantity: 2
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'cart_items') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [existingItem],
                  error: null
                })
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

      const result = await addToCart('session-1', 'prod-1', 3)

      expect(result.data.quantity).toBe(5)
    })

    it('should validate stock availability', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'products') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'prod-1', stock: 5 },
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
                eq: vi.fn().mockResolvedValue({
                  data: [],
                  error: null
                })
              })
            })
          }
        }
        return {}
      })

      const result = await addToCart('session-1', 'prod-1', 10)

      expect(result.data).toBeNull()
      expect(result.error).toContain('stock')
    })
  })

  describe('updateCartItem', () => {
    it('should update item quantity', async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ id: '1', quantity: 5 }],
            error: null
          })
        })
      })

      const result = await updateCartItem('1', 5)

      expect(result.data.quantity).toBe(5)
      expect(result.error).toBeNull()
    })

    it('should validate positive quantity', async () => {
      const result = await updateCartItem('1', 0)

      expect(result.data).toBeNull()
      expect(result.error).toContain('greater than 0')
    })

    it('should handle update error', async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Update failed' }
          })
        })
      })

      const result = await updateCartItem('1', 5)

      expect(result.data).toBeNull()
      expect(result.error).toBeTruthy()
    })
  })

  describe('removeFromCart', () => {
    it('should remove item from cart', async () => {
      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null
          })
        })
      })

      const result = await removeFromCart('1')

      expect(result.error).toBeNull()
    })

    it('should handle remove error', async () => {
      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Delete failed' }
          })
        })
      })

      const result = await removeFromCart('1')

      expect(result.error).toBeTruthy()
    })
  })

  describe('clearCart', () => {
    it('should clear all cart items', async () => {
      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null
          })
        })
      })

      const result = await clearCart('session-1')

      expect(result.error).toBeNull()
    })
  })

  describe('calculateCartTotal', () => {
    it('should calculate cart total', async () => {
      const mockItems = [
        { id: '1', quantity: 2, product: { price: 10.50 } },
        { id: '2', quantity: 3, product: { price: 5.25 } }
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockItems,
            error: null
          })
        })
      })

      const result = await calculateCartTotal('session-1')

      expect(result.data.subtotal).toBe(36.75) // (2 * 10.50) + (3 * 5.25)
      expect(result.data.itemCount).toBe(5)
    })

    it('should handle empty cart', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })

      const result = await calculateCartTotal('session-1')

      expect(result.data.subtotal).toBe(0)
      expect(result.data.itemCount).toBe(0)
    })
  })

  describe('cleanupExpiredSessions', () => {
    it('should delete expired sessions', async () => {
      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          lt: vi.fn().mockResolvedValue({
            data: null,
            error: null
          })
        })
      })

      const result = await cleanupExpiredSessions()

      expect(result.error).toBeNull()
    })

    it('should handle cleanup error', async () => {
      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          lt: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Cleanup failed' }
          })
        })
      })

      const result = await cleanupExpiredSessions()

      expect(result.error).toBeTruthy()
    })
  })
})
