/**
 * Admin API Tests
 *
 * Tests for /api/admin endpoints
 * Covers admin-only analytics and management operations
 *
 * Total: 8 tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock data
const mockAdminUser = {
  id: 'admin-123',
  email: 'admin@greenland77.ge',
}

const mockRestaurantUser = {
  id: 'restaurant-123',
  email: 'restaurant@greenland77.ge',
}

const mockAnalyticsSummary = {
  totalRevenue: 125000,
  totalOrders: 450,
  activeUsers: 85,
  averageOrderValue: 277.78,
}

const mockRecentOrders = [
  {
    id: 'order-1',
    created_at: '2025-12-11T10:00:00Z',
    status: 'completed',
    total_amount: 250,
    restaurant_name: 'რესტორანი 1',
  },
  {
    id: 'order-2',
    created_at: '2025-12-11T09:00:00Z',
    status: 'pending',
    total_amount: 180,
    restaurant_name: 'რესტორანი 2',
  },
]

// Mock Supabase client
const createMockSupabaseClient = (role: 'admin' | 'restaurant' = 'admin') => {
  const chainMethods = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: { role },
      error: null,
    }),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({
      data: mockRecentOrders,
      error: null,
    }),
  }

  return {
    from: vi.fn(() => chainMethods),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: role === 'admin' ? mockAdminUser : mockRestaurantUser },
        error: null,
      }),
    },
    ...chainMethods,
  }
}

let mockSupabaseClient: ReturnType<typeof createMockSupabaseClient>

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}))

// Mock analytics service
vi.mock('@/lib/services/admin/analytics.service', () => ({
  getAnalyticsSummary: vi.fn().mockResolvedValue(mockAnalyticsSummary),
  getRecentOrders: vi.fn().mockResolvedValue(mockRecentOrders),
}))

describe('Admin API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseClient = createMockSupabaseClient('admin')
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('GET /api/admin/analytics', () => {
    it('returns analytics data for admin users', async () => {
      const { GET } = await import('@/app/api/admin/analytics/route')
      const response = await GET()

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.summary).toBeDefined()
      expect(data.recentOrders).toBeDefined()
    })

    it('includes correct summary metrics', async () => {
      const { GET } = await import('@/app/api/admin/analytics/route')
      const response = await GET()

      const data = await response.json()
      expect(data.summary.totalRevenue).toBe(125000)
      expect(data.summary.totalOrders).toBe(450)
      expect(data.summary.activeUsers).toBe(85)
      expect(data.summary.averageOrderValue).toBeCloseTo(277.78)
    })

    it('returns 401 for unauthenticated requests', async () => {
      mockSupabaseClient.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const { GET } = await import('@/app/api/admin/analytics/route')
      const response = await GET()

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('returns 403 for non-admin users', async () => {
      mockSupabaseClient = createMockSupabaseClient('restaurant')

      // Update the single mock to return restaurant role
      mockSupabaseClient.single = vi.fn().mockResolvedValue({
        data: { role: 'restaurant' },
        error: null,
      })

      const { GET } = await import('@/app/api/admin/analytics/route')
      const response = await GET()

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toBe('Forbidden')
    })

    it('returns recent orders in response', async () => {
      const { GET } = await import('@/app/api/admin/analytics/route')
      const response = await GET()

      const data = await response.json()
      expect(data.recentOrders).toHaveLength(2)
      expect(data.recentOrders[0].restaurant_name).toBe('რესტორანი 1')
    })

    it('handles service errors gracefully', async () => {
      // Mock the analytics service to throw
      const analyticsModule = await import('@/lib/services/admin/analytics.service')
      vi.mocked(analyticsModule.getAnalyticsSummary).mockRejectedValueOnce(
        new Error('Database error')
      )

      const { GET } = await import('@/app/api/admin/analytics/route')
      const response = await GET()

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Internal Server Error')
    })

    it('verifies admin role from profiles table', async () => {
      const { GET } = await import('@/app/api/admin/analytics/route')
      await GET()

      // Verify profile check was made
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles')
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('role')
    })

    it('queries profile by user ID', async () => {
      const { GET } = await import('@/app/api/admin/analytics/route')
      await GET()

      // Verify eq was called with user id
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', mockAdminUser.id)
    })
  })
})
