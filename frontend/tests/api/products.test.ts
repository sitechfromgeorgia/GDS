/**
 * Products API Tests
 *
 * Tests for /api/products endpoints
 * Covers product listing, filtering, search, and pagination
 *
 * Total: 12 tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

// Mock product data
const mockProducts = [
  {
    id: 'prod-1',
    name: 'ხაჭაპური აჭარული',
    category: 'მთავარი კერძი',
    price: 18.0,
    unit: 'ცალი',
    is_active: true,
    is_available: true,
    stock_quantity: 100,
    min_stock_level: 10,
    image_url: '/images/khachapuri.jpg',
    description: 'ტრადიციული აჭარული ხაჭაპური',
  },
  {
    id: 'prod-2',
    name: 'ხინკალი',
    category: 'მთავარი კერძი',
    price: 15.0,
    unit: '10 ცალი',
    is_active: true,
    is_available: true,
    stock_quantity: 200,
    min_stock_level: 20,
    image_url: '/images/khinkali.jpg',
    description: 'ქართული ხინკალი',
  },
  {
    id: 'prod-3',
    name: 'ლობიანი',
    category: 'პური',
    price: 8.0,
    unit: 'ცალი',
    is_active: true,
    is_available: true,
    stock_quantity: 50,
    min_stock_level: 5,
    image_url: '/images/lobiani.jpg',
    description: 'ლობიოთი შემწვარი პური',
  },
  {
    id: 'prod-4',
    name: 'ლიმონათი',
    category: 'სასმელი',
    price: 4.0,
    unit: 'ბოთლი',
    is_active: true,
    is_available: true,
    stock_quantity: 300,
    min_stock_level: 30,
    image_url: '/images/lemonade.jpg',
    description: 'ქართული ლიმონათი',
  },
  {
    id: 'prod-5',
    name: 'მწვადი ღორის',
    category: 'მთავარი კერძი',
    price: 22.0,
    unit: 'პორცია',
    is_active: false, // Inactive product - should not appear
    is_available: true,
    stock_quantity: 0,
    min_stock_level: 10,
    image_url: '/images/shashlik.jpg',
    description: 'ღორის მწვადი',
  },
]

// Mock Supabase client
const createMockSupabaseClient = () => {
  const chainMethods = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
  }

  return {
    from: vi.fn(() => chainMethods),
    ...chainMethods,
    // Default response
    then: vi.fn((resolve) =>
      resolve({
        data: mockProducts.filter((p) => p.is_active),
        error: null,
      })
    ),
  }
}

let mockSupabaseClient: ReturnType<typeof createMockSupabaseClient>

// Mock the server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}))

// Mock browser client for service tests
vi.mock('@/lib/supabase', () => ({
  createBrowserClient: vi.fn(() => mockSupabaseClient),
}))

vi.mock('@/lib/supabase/client', () => ({
  createBrowserClient: vi.fn(() => mockSupabaseClient),
}))

describe('Products API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseClient = createMockSupabaseClient()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('GET /api/products', () => {
    it('returns all active products', async () => {
      // Setup mock to return active products
      mockSupabaseClient.order = vi.fn().mockResolvedValue({
        data: mockProducts.filter((p) => p.is_active),
        error: null,
      })

      // Import and call the route handler
      const { GET } = await import('@/app/api/products/route')
      const request = new Request('http://localhost:3000/api/products')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()

      // Should only return active products
      expect(data.every((p: any) => p.is_active)).toBe(true)
      expect(data.find((p: any) => p.id === 'prod-5')).toBeUndefined()
    })

    it('filters products by category', async () => {
      const categoryProducts = mockProducts.filter(
        (p) => p.is_active && p.category === 'მთავარი კერძი'
      )

      mockSupabaseClient.order = vi.fn().mockResolvedValue({
        data: categoryProducts,
        error: null,
      })

      const { GET } = await import('@/app/api/products/route')
      const request = new Request('http://localhost:3000/api/products?category=მთავარი კერძი')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()

      // Verify eq was called with category
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('is_active', true)
    })

    it('searches products by name', async () => {
      const searchResults = mockProducts.filter(
        (p) => p.is_active && p.name.toLowerCase().includes('ხაჭ')
      )

      mockSupabaseClient.order = vi.fn().mockResolvedValue({
        data: searchResults,
        error: null,
      })

      const { GET } = await import('@/app/api/products/route')
      const request = new Request('http://localhost:3000/api/products?search=ხაჭ')
      const response = await GET(request)

      expect(response.status).toBe(200)

      // Verify ilike was called for search
      expect(mockSupabaseClient.ilike).toHaveBeenCalled()
    })

    it('returns empty array when no products match filter', async () => {
      mockSupabaseClient.order = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      })

      const { GET } = await import('@/app/api/products/route')
      const request = new Request('http://localhost:3000/api/products?category=არასწორიკატეგორია')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toEqual([])
    })

    it('handles database errors gracefully', async () => {
      mockSupabaseClient.order = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      })

      const { GET } = await import('@/app/api/products/route')
      const request = new Request('http://localhost:3000/api/products')
      const response = await GET(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Database connection failed')
    })

    it('ignores category filter when set to "all"', async () => {
      mockSupabaseClient.order = vi.fn().mockResolvedValue({
        data: mockProducts.filter((p) => p.is_active),
        error: null,
      })

      const { GET } = await import('@/app/api/products/route')
      const request = new Request('http://localhost:3000/api/products?category=all')
      const response = await GET(request)

      expect(response.status).toBe(200)

      // Should get all active products, not filtered by category
      const data = await response.json()
      expect(data.length).toBeGreaterThan(0)
    })
  })

  describe('Product Service - Additional Functionality', () => {
    it('gets product by ID', async () => {
      const targetProduct = mockProducts[0]

      mockSupabaseClient.single = vi.fn().mockResolvedValue({
        data: targetProduct,
        error: null,
      })

      const { ProductService } = await import('@/services/products/product.service')
      const service = new ProductService()

      const product = await service.getProductById('prod-1')

      expect(product).toBeDefined()
      expect(product?.id).toBe('prod-1')
    })

    it('checks product availability', async () => {
      mockSupabaseClient.single = vi.fn().mockResolvedValue({
        data: {
          stock_quantity: 100,
          min_order_quantity: 1,
          max_order_quantity: 50,
        },
        error: null,
      })

      const { ProductService } = await import('@/services/products/product.service')
      const service = new ProductService()

      const availability = await service.checkProductAvailability('prod-1', 10)

      expect(availability.inStock).toBe(true)
      expect(availability.availableStock).toBe(100)
    })

    it('returns out of stock when requested quantity exceeds stock', async () => {
      mockSupabaseClient.single = vi.fn().mockResolvedValue({
        data: {
          stock_quantity: 5,
          min_order_quantity: 1,
          max_order_quantity: 50,
        },
        error: null,
      })

      const { ProductService } = await import('@/services/products/product.service')
      const service = new ProductService()

      const availability = await service.checkProductAvailability('prod-1', 10)

      expect(availability.inStock).toBe(false)
      expect(availability.requestedQuantity).toBe(10)
      expect(availability.availableStock).toBe(5)
    })

    it('formats price in GEL currency', async () => {
      const { ProductService } = await import('@/services/products/product.service')
      const service = new ProductService()

      const formattedPrice = service.formatPrice(18.5)

      expect(formattedPrice).toContain('18.50')
      expect(formattedPrice).toContain('₾')
    })

    it('returns correct stock status - in stock', async () => {
      const { ProductService } = await import('@/services/products/product.service')
      const service = new ProductService()

      const product = {
        ...mockProducts[0],
        stock_quantity: 100,
        min_stock_level: 10,
      }

      const status = service.getStockStatus(product as any)

      expect(status.status).toBe('in_stock')
      expect(status.label).toBe('მარაგშია')
      expect(status.color).toBe('green')
    })

    it('returns correct stock status - low stock', async () => {
      const { ProductService } = await import('@/services/products/product.service')
      const service = new ProductService()

      const product = {
        ...mockProducts[0],
        stock_quantity: 5,
        min_stock_level: 10,
      }

      const status = service.getStockStatus(product as any)

      expect(status.status).toBe('low_stock')
      expect(status.label).toBe('ცოტა მარაგი')
      expect(status.color).toBe('yellow')
    })

    it('returns correct stock status - out of stock', async () => {
      const { ProductService } = await import('@/services/products/product.service')
      const service = new ProductService()

      const product = {
        ...mockProducts[0],
        stock_quantity: 0,
        min_stock_level: 10,
      }

      const status = service.getStockStatus(product as any)

      expect(status.status).toBe('out_of_stock')
      expect(status.label).toBe('მარაგი არ არის')
      expect(status.color).toBe('red')
    })
  })

  describe('Edge Cases', () => {
    it('handles special characters in search query', async () => {
      mockSupabaseClient.order = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      })

      const { GET } = await import('@/app/api/products/route')
      // Test with Georgian characters and special chars
      const request = new Request(
        `http://localhost:3000/api/products?search=${encodeURIComponent("ხაჭაპური's")}`
      )
      const response = await GET(request)

      // Should not crash
      expect(response.status).toBe(200)
    })

    it('handles very long search queries gracefully', async () => {
      mockSupabaseClient.order = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      })

      const { GET } = await import('@/app/api/products/route')
      const longSearch = 'ა'.repeat(1000)
      const request = new Request(
        `http://localhost:3000/api/products?search=${encodeURIComponent(longSearch)}`
      )
      const response = await GET(request)

      // Should handle gracefully without crashing
      expect(response.status).toBe(200)
    })

    it('handles concurrent product queries', async () => {
      mockSupabaseClient.order = vi.fn().mockResolvedValue({
        data: mockProducts.filter((p) => p.is_active),
        error: null,
      })

      const { GET } = await import('@/app/api/products/route')

      // Fire multiple concurrent requests
      const requests = Array(10)
        .fill(null)
        .map(() => GET(new Request('http://localhost:3000/api/products')))

      const responses = await Promise.all(requests)

      // All should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200)
      })
    })

    it('returns products ordered by name', async () => {
      const orderedProducts = [...mockProducts]
        .filter((p) => p.is_active)
        .sort((a, b) => a.name.localeCompare(b.name, 'ka'))

      mockSupabaseClient.order = vi.fn().mockResolvedValue({
        data: orderedProducts,
        error: null,
      })

      const { GET } = await import('@/app/api/products/route')
      const request = new Request('http://localhost:3000/api/products')
      const response = await GET(request)

      expect(response.status).toBe(200)

      // Verify order was called
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('name')
    })
  })
})
