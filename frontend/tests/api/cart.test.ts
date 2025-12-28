/**
 * Cart API Tests
 *
 * Tests for /api/cart endpoints and CartService
 * Covers cart operations, validation, and persistence
 *
 * Total: 10 tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((i: number) => Object.keys(store)[i] || null),
  }
})()

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// Mock cart data
const mockUser = {
  id: 'user-123',
  email: 'restaurant@greenland77.ge',
  role: 'restaurant',
}

const mockCartItems = [
  {
    quantity: 2,
    product: {
      id: 'prod-1',
      name: 'ხაჭაპური აჭარული',
      name_ka: 'ხაჭაპური აჭარული',
      price: 18.0,
      unit: 'ცალი',
      category: 'მთავარი კერძი',
      image_url: '/images/khachapuri.jpg',
    },
  },
  {
    quantity: 5,
    product: {
      id: 'prod-2',
      name: 'ხინკალი',
      name_ka: 'ხინკალი',
      price: 15.0,
      unit: '10 ცალი',
      category: 'მთავარი კერძი',
      image_url: '/images/khinkali.jpg',
    },
  },
]

// Mock Supabase client
const createMockSupabaseClient = () => {
  const chainMethods = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
  }

  return {
    from: vi.fn(() => chainMethods),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      }),
    },
    ...chainMethods,
  }
}

let mockSupabaseClient: ReturnType<typeof createMockSupabaseClient>

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}))

vi.mock('@/lib/supabase', () => ({
  createBrowserClient: vi.fn(() => mockSupabaseClient),
}))

vi.mock('@/lib/supabase/client', () => ({
  createBrowserClient: vi.fn(() => mockSupabaseClient),
}))

// Mock logger to suppress logs during tests
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}))

// Mock product service
vi.mock('@/services/products/product.service', () => ({
  productService: {
    getProductById: vi.fn().mockResolvedValue({
      id: 'prod-1',
      name: 'ხაჭაპური აჭარული',
      price: 18.0,
      unit: 'ცალი',
      category: 'მთავარი კერძი',
      image_url: '/images/khachapuri.jpg',
    }),
  },
}))

describe('Cart API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    mockSupabaseClient = createMockSupabaseClient()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('GET /api/cart', () => {
    it('returns cart items for authenticated user', async () => {
      mockSupabaseClient.eq = vi.fn().mockResolvedValue({
        data: mockCartItems,
        error: null,
      })

      const { GET } = await import('@/app/api/cart/route')
      const response = await GET()

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveLength(2)
    })

    it('returns 401 for unauthenticated requests', async () => {
      mockSupabaseClient.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const { GET } = await import('@/app/api/cart/route')
      const response = await GET()

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('returns empty array when cart is empty', async () => {
      mockSupabaseClient.eq = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      })

      const { GET } = await import('@/app/api/cart/route')
      const response = await GET()

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toEqual([])
    })
  })

  describe('POST /api/cart', () => {
    it('saves cart items successfully', async () => {
      const { POST } = await import('@/app/api/cart/route')
      const request = new Request('http://localhost:3000/api/cart', {
        method: 'POST',
        body: JSON.stringify({ items: mockCartItems }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('returns 401 for unauthenticated POST requests', async () => {
      mockSupabaseClient.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const { POST } = await import('@/app/api/cart/route')
      const request = new Request('http://localhost:3000/api/cart', {
        method: 'POST',
        body: JSON.stringify({ items: [] }),
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
    })
  })

  describe('CartService', () => {
    it('validates cart item input correctly', async () => {
      const { CartService } = await import('@/services/cart/cart.service')
      const service = new CartService()

      const validInput = {
        productId: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 5,
      }

      const result = service.validateCartItemInput(validInput)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('rejects invalid quantity', async () => {
      const { CartService } = await import('@/services/cart/cart.service')
      const service = new CartService()

      const invalidInput = {
        productId: '550e8400-e29b-41d4-a716-446655440000',
        quantity: -1,
      }

      const result = service.validateCartItemInput(invalidInput)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('formats cart total in Georgian currency', async () => {
      const { CartService } = await import('@/services/cart/cart.service')
      const service = new CartService()

      const formatted = service.formatCartTotal(150.5)

      expect(formatted).toContain('₾')
    })

    it('validates cart before checkout - empty cart error', async () => {
      const { CartService } = await import('@/services/cart/cart.service')
      const service = new CartService()

      const emptyCart = {
        id: 'cart-1',
        userId: 'user-1',
        items: [],
        totalItems: 0,
        totalPrice: 0,
        status: 'active' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const result = await service.validateCartForCheckout(emptyCart)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e: any) => e.code === 'EMPTY_CART')).toBe(true)
      expect(result.errors.some((e: any) => e.message === 'კალათა ცარიეა')).toBe(true)
    })

    it('validates cart before checkout - invalid quantity error', async () => {
      const { CartService } = await import('@/services/cart/cart.service')
      const service = new CartService()

      const invalidCart = {
        id: 'cart-1',
        userId: 'user-1',
        items: [
          {
            id: 'item-1',
            productId: 'prod-1',
            product: {
              id: 'prod-1',
              name: 'ხაჭაპური',
              name_ka: 'ხაჭაპური',
              price: 18.0,
              unit: 'ცალი',
              category: 'მთავარი კერძი',
            },
            quantity: 0, // Invalid
            unitPrice: 18.0,
            totalPrice: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        totalItems: 0,
        totalPrice: 0,
        status: 'active' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const result = await service.validateCartForCheckout(invalidCart)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e: any) => e.code === 'INVALID_QUANTITY')).toBe(true)
    })
  })
})
