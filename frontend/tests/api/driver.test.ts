/**
 * Driver API Tests
 *
 * Tests for /api/driver endpoints
 * Covers driver deliveries and status updates
 *
 * Total: 8 tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock data
const mockDriverUser = {
  id: 'driver-123',
  email: 'driver@greenland77.ge',
}

const mockDeliveries = [
  {
    id: 'order-1',
    driver_id: 'driver-123',
    status: 'in_transit',
    created_at: '2025-12-11T10:00:00Z',
    delivery_address: 'თბილისი, რუსთაველის 12',
    restaurant_name: 'რესტორანი 1',
    total_amount: 150,
  },
  {
    id: 'order-2',
    driver_id: 'driver-123',
    status: 'pending_pickup',
    created_at: '2025-12-11T09:00:00Z',
    delivery_address: 'თბილისი, ვაჟა-ფშაველას 71',
    restaurant_name: 'რესტორანი 2',
    total_amount: 200,
  },
]

// Mock Supabase client
const createMockSupabaseClient = (isAuthenticated = true) => {
  const chainMethods = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({
      data: mockDeliveries,
      error: null,
    }),
    update: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: { ...mockDeliveries[0], status: 'delivered' },
      error: null,
    }),
  }

  return {
    from: vi.fn(() => chainMethods),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: isAuthenticated ? mockDriverUser : null },
        error: isAuthenticated ? null : { message: 'Not authenticated' },
      }),
    },
    ...chainMethods,
  }
}

let mockSupabaseClient: ReturnType<typeof createMockSupabaseClient>

// Mock Supabase SSR
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => mockSupabaseClient),
}))

// Mock cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: () => [],
  })),
}))

describe('Driver API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseClient = createMockSupabaseClient(true)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('GET /api/driver/deliveries', () => {
    it('returns deliveries for authenticated driver', async () => {
      const { GET } = await import('@/app/api/driver/deliveries/route')
      const request = new Request('http://localhost/api/driver/deliveries')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
    })

    it('returns 401 for unauthenticated requests', async () => {
      mockSupabaseClient = createMockSupabaseClient(false)

      const { GET } = await import('@/app/api/driver/deliveries/route')
      const request = new Request('http://localhost/api/driver/deliveries')
      const response = await GET(request)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('filters orders by driver_id', async () => {
      const { GET } = await import('@/app/api/driver/deliveries/route')
      const request = new Request('http://localhost/api/driver/deliveries')
      await GET(request)

      // Verify the query filters by driver_id
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('orders')
      expect(mockSupabaseClient.eq).toHaveBeenCalled()
    })

    it('orders deliveries by created_at descending', async () => {
      const { GET } = await import('@/app/api/driver/deliveries/route')
      const request = new Request('http://localhost/api/driver/deliveries')
      await GET(request)

      expect(mockSupabaseClient.order).toHaveBeenCalledWith('created_at', { ascending: false })
    })
  })

  describe('PATCH /api/driver/deliveries', () => {
    it('updates delivery status successfully', async () => {
      const { PATCH } = await import('@/app/api/driver/deliveries/route')
      const request = new Request('http://localhost/api/driver/deliveries', {
        method: 'PATCH',
        body: JSON.stringify({
          delivery_id: 'order-1',
          status: 'delivered',
        }),
      })
      const response = await PATCH(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.status).toBe('delivered')
    })

    it('returns 401 for unauthenticated status update', async () => {
      mockSupabaseClient = createMockSupabaseClient(false)

      const { PATCH } = await import('@/app/api/driver/deliveries/route')
      const request = new Request('http://localhost/api/driver/deliveries', {
        method: 'PATCH',
        body: JSON.stringify({
          delivery_id: 'order-1',
          status: 'delivered',
        }),
      })
      const response = await PATCH(request)

      expect(response.status).toBe(401)
    })

    it('returns 400 for missing delivery_id', async () => {
      const { PATCH } = await import('@/app/api/driver/deliveries/route')
      const request = new Request('http://localhost/api/driver/deliveries', {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'delivered',
        }),
      })
      const response = await PATCH(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Missing')
    })

    it('returns 400 for missing status', async () => {
      const { PATCH } = await import('@/app/api/driver/deliveries/route')
      const request = new Request('http://localhost/api/driver/deliveries', {
        method: 'PATCH',
        body: JSON.stringify({
          delivery_id: 'order-1',
        }),
      })
      const response = await PATCH(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Missing')
    })
  })
})
