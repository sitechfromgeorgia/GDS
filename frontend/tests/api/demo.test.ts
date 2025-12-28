/**
 * Demo API Tests
 *
 * Tests for /api/demo endpoints
 * Covers demo setup, analytics, and conversion tracking
 *
 * Total: 10 tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock DemoUtils
const mockSession = {
  id: 'demo-session-123',
  role: 'demo',
  data: {},
  startedAt: '2025-12-11T10:00:00Z',
  tourSteps: [],
}

const mockSampleData = {
  products: [
    { id: '1', name: 'Demo Product 1', price: 25.99 },
    { id: '2', name: 'Demo Product 2', price: 15.99 },
  ],
  orders: [{ id: 'order-1', total: 150, status: 'pending' }],
}

const mockDemoUtils = {
  getCurrentDemoSession: vi.fn().mockReturnValue(mockSession),
  initializeDemoSession: vi.fn().mockResolvedValue(mockSession),
  generateSampleData: vi.fn().mockResolvedValue(mockSampleData),
  attemptConversion: vi.fn().mockResolvedValue({ success: true }),
}

vi.mock('@/lib/demo-utils', () => ({
  DemoUtils: mockDemoUtils,
}))

vi.mock('@/lib/demo-data', () => ({
  DEMO_ANALYTICS_DATA: {
    totalOrders: 150,
    totalRevenue: 45000,
    activeUsers: 25,
  },
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}))

describe('Demo API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDemoUtils.getCurrentDemoSession.mockReturnValue(mockSession)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('POST /api/demo/setup', () => {
    it('initializes demo session with user ID', async () => {
      const { POST } = await import('@/app/api/demo/setup/route')
      const request = new Request('http://localhost/api/demo/setup', {
        method: 'POST',
        body: JSON.stringify({ userId: 'test-user-123' }),
      })
      const response = await POST(request as any)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.session).toBeDefined()
      expect(data.sampleData).toBeDefined()
    })

    it('returns 400 for missing userId', async () => {
      const { POST } = await import('@/app/api/demo/setup/route')
      const request = new Request('http://localhost/api/demo/setup', {
        method: 'POST',
        body: JSON.stringify({}),
      })
      const response = await POST(request as any)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('User ID is required')
    })
  })

  describe('GET /api/demo/setup', () => {
    it('returns current demo session status', async () => {
      const { GET } = await import('@/app/api/demo/setup/route')
      const response = await GET()

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.session).toBeDefined()
      expect(data.sampleData).toBeDefined()
    })

    it('returns 404 when no active session', async () => {
      mockDemoUtils.getCurrentDemoSession.mockReturnValue(null)

      const { GET } = await import('@/app/api/demo/setup/route')
      const response = await GET()

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toContain('No active demo session')
    })
  })

  describe('GET /api/demo/analytics', () => {
    it('returns analytics for active session', async () => {
      const { GET } = await import('@/app/api/demo/analytics/route')
      const response = await GET()

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.system_analytics).toBeDefined()
      expect(data.session_info).toBeDefined()
      expect(data.session_info.session_id).toBe(mockSession.id)
    })

    it('returns 404 when no active session', async () => {
      mockDemoUtils.getCurrentDemoSession.mockReturnValue(null)

      const { GET } = await import('@/app/api/demo/analytics/route')
      const response = await GET()

      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/demo/analytics', () => {
    it('tracks demo action successfully', async () => {
      const { POST } = await import('@/app/api/demo/analytics/route')
      const request = new Request('http://localhost/api/demo/analytics', {
        method: 'POST',
        body: JSON.stringify({
          action: 'page_view',
          metadata: { page: 'dashboard' },
        }),
      })
      const response = await POST(request as any)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
    })
  })

  describe('POST /api/demo/convert', () => {
    it('tracks conversion attempt', async () => {
      const { POST } = await import('@/app/api/demo/convert/route')
      const request = new Request('http://localhost/api/demo/convert', {
        method: 'POST',
        body: JSON.stringify({
          conversionType: 'signup',
          contactInfo: { email: 'test@example.com' },
        }),
      })
      const response = await POST(request as any)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.conversion_type).toBe('signup')
    })
  })

  describe('GET /api/demo/convert', () => {
    it('returns conversion status', async () => {
      const { GET } = await import('@/app/api/demo/convert/route')
      const response = await GET()

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.session_info).toBeDefined()
      expect(data.conversions).toBeDefined()
    })

    it('returns 404 when no active session', async () => {
      mockDemoUtils.getCurrentDemoSession.mockReturnValue(null)

      const { GET } = await import('@/app/api/demo/convert/route')
      const response = await GET()

      expect(response.status).toBe(404)
    })
  })
})
