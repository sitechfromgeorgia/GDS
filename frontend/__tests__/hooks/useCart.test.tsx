/**
 * useCart Hook Test Suite
 * Tests for shopping cart hook functionality
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

describe('useCart Hook', () => {
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

  describe('Session Management', () => {
    it('should create new session for guest users', async () => {
      const mockSession = {
        id: 'session-1',
        expiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString()
      }

      mockSupabase.from.mockReturnValue({
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
      })

      const { result } = renderHook(() => useCart())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.sessionId).toBe('session-1')
      expect(localStorage.getItem('cart_session_id')).toBe('session-1')
    })

    it('should restore existing session from localStorage', async () => {
      const existingSessionId = 'existing-session-1'
      localStorage.setItem('cart_session_id', existingSessionId)

      const mockSession = {
        id: existingSessionId,
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

      const { result } = renderHook(() => useCart())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.sessionId).toBe(existingSessionId)
    })

    it('should create new session if stored session expired', async () => {
      const expiredSessionId = 'expired-session-1'
      localStorage.setItem('cart_session_id', expiredSessionId)

      const newSession = {
        id: 'new-session-1',
        expiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString()
      }

      mockSupabase.from.mockReturnValue({
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
      })

      const { result } = renderHook(() => useCart())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.sessionId).toBe('new-session-1')
    })
  })

  describe('Adding Items', () => {
    it('should add item to cart', async () => {
      const mockSession = {
        id: 'session-1',
        expiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString()
      }

      const mockCartItem = {
        id: 'item-1',
        sessionId: 'session-1',
        productId: 'prod-1',
        quantity: 2,
        product: {
          name: 'Test Product',
          price: 10.50,
          imageUrl: '/test.jpg'
        }
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
            insert: vi.fn().mockResolvedValue({
              data: [mockCartItem],
              error: null
            }),
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null
              })
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

      let addResult: any
      await act(async () => {
        addResult = await result.current.addItem('prod-1', 2)
      })

      expect(addResult.success).toBe(true)
    })

    it('should update quantity if item already in cart', async () => {
      const mockSession = {
        id: 'session-1',
        expiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString()
      }

      const existingItem = {
        id: 'item-1',
        sessionId: 'session-1',
        productId: 'prod-1',
        quantity: 2
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

      let addResult: any
      await act(async () => {
        addResult = await result.current.addItem('prod-1', 3)
      })

      expect(addResult.success).toBe(true)
    })

    it('should validate product stock before adding', async () => {
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

      let addResult: any
      await act(async () => {
        addResult = await result.current.addItem('prod-1', 10)
      })

      expect(addResult.success).toBe(false)
      expect(addResult.error).toContain('stock')
    })
  })

  describe('Updating Items', () => {
    it('should update item quantity', async () => {
      const mockSession = {
        id: 'session-1',
        expiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString()
      }

      const mockCartItem = {
        id: 'item-1',
        sessionId: 'session-1',
        productId: 'prod-1',
        quantity: 2
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
                data: [mockCartItem],
                error: null
              })
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ ...mockCartItem, quantity: 5 }],
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

      let updateResult: any
      await act(async () => {
        updateResult = await result.current.updateQuantity('item-1', 5)
      })

      expect(updateResult.success).toBe(true)
    })

    it('should remove item if quantity is 0', async () => {
      const mockSession = {
        id: 'session-1',
        expiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString()
      }

      const mockCartItem = {
        id: 'item-1',
        sessionId: 'session-1',
        productId: 'prod-1',
        quantity: 2
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
                data: [mockCartItem],
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

      let updateResult: any
      await act(async () => {
        updateResult = await result.current.updateQuantity('item-1', 0)
      })

      expect(updateResult.success).toBe(true)
    })
  })

  describe('Removing Items', () => {
    it('should remove item from cart', async () => {
      const mockSession = {
        id: 'session-1',
        expiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString()
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
                data: [{ id: 'item-1' }],
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

      let removeResult: any
      await act(async () => {
        removeResult = await result.current.removeItem('item-1')
      })

      expect(removeResult.success).toBe(true)
    })
  })

  describe('Clearing Cart', () => {
    it('should clear all items from cart', async () => {
      const mockSession = {
        id: 'session-1',
        expiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString()
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
                data: [{ id: 'item-1' }, { id: 'item-2' }],
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

      await act(async () => {
        await result.current.clearCart()
      })

      expect(result.current.items).toEqual([])
    })
  })

  describe('Cart Calculations', () => {
    it('should calculate cart totals correctly', async () => {
      const mockSession = {
        id: 'session-1',
        expiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString()
      }

      const mockCartItems = [
        {
          id: 'item-1',
          quantity: 2,
          product: { price: 10.50 }
        },
        {
          id: 'item-2',
          quantity: 3,
          product: { price: 5.25 }
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
              eq: vi.fn().mockReturnValue({
                data: mockCartItems,
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

      expect(result.current.itemCount).toBe(5)
      expect(result.current.subtotal).toBe(36.75) // (2 * 10.50) + (3 * 5.25)
    })

    it('should handle empty cart', async () => {
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
              eq: vi.fn().mockReturnValue({
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

      expect(result.current.itemCount).toBe(0)
      expect(result.current.subtotal).toBe(0)
      expect(result.current.items).toEqual([])
    })
  })

  describe('Real-time Updates', () => {
    it('should subscribe to cart updates', async () => {
      const mockSubscription = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn()
      }

      const mockSession = {
        id: 'session-1',
        expiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString()
      }

      mockSupabase.channel.mockReturnValue(mockSubscription)
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
              eq: vi.fn().mockReturnValue({
                data: [],
                error: null
              })
            })
          }
        }
        return {}
      })

      renderHook(() => useCart({ enableRealtime: true }))

      await waitFor(() => {
        expect(mockSupabase.channel).toHaveBeenCalled()
      })

      expect(mockSubscription.on).toHaveBeenCalled()
      expect(mockSubscription.subscribe).toHaveBeenCalled()
    })
  })
})
