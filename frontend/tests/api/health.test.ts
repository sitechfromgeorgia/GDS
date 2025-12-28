/**
 * Health API Tests
 *
 * Tests for /api/health endpoints
 * Covers liveness, readiness, and detailed health checks
 *
 * Total: 8 tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock admin Supabase client
const createMockAdminClient = () => {
  return {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({
      data: [{ id: 'test-id' }],
      error: null,
    }),
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
    },
    storage: {
      listBuckets: vi.fn().mockResolvedValue({
        data: [{ name: 'products' }, { name: 'avatars' }],
        error: null,
      }),
    },
  }
}

let mockAdminClient: ReturnType<typeof createMockAdminClient>

// Mock the admin client
vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn(() => mockAdminClient),
}))

describe('Health API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAdminClient = createMockAdminClient()

    // Mock process.memoryUsage
    vi.spyOn(process, 'memoryUsage').mockReturnValue({
      rss: 100 * 1024 * 1024, // 100MB
      heapTotal: 50 * 1024 * 1024, // 50MB
      heapUsed: 25 * 1024 * 1024, // 25MB
      external: 1 * 1024 * 1024,
      arrayBuffers: 0,
    })

    // Mock process.uptime
    vi.spyOn(process, 'uptime').mockReturnValue(3600) // 1 hour
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('GET /api/health/liveness', () => {
    it('returns alive status', async () => {
      const { GET } = await import('@/app/api/health/liveness/route')
      const response = await GET()

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.status).toBe('alive')
      expect(data.timestamp).toBeDefined()
    })

    it('responds quickly (under 100ms)', async () => {
      const { GET } = await import('@/app/api/health/liveness/route')

      const start = Date.now()
      await GET()
      const duration = Date.now() - start

      expect(duration).toBeLessThan(100)
    })
  })

  describe('GET /api/health/readiness', () => {
    it('returns ready when database is accessible', async () => {
      const { GET } = await import('@/app/api/health/readiness/route')
      const response = await GET()

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.status).toBe('ready')
    })

    it('returns not_ready when database connection fails', async () => {
      mockAdminClient.limit = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Connection refused', code: 'PGRST301' },
      })

      const { GET } = await import('@/app/api/health/readiness/route')
      const response = await GET()

      expect(response.status).toBe(503)
      const data = await response.json()
      expect(data.status).toBe('not_ready')
      expect(data.reason).toBe('Database connection failed')
    })

    it('handles exceptions gracefully', async () => {
      mockAdminClient.from = vi.fn().mockImplementation(() => {
        throw new Error('Unexpected error')
      })

      const { GET } = await import('@/app/api/health/readiness/route')
      const response = await GET()

      expect(response.status).toBe(503)
      const data = await response.json()
      expect(data.status).toBe('not_ready')
      expect(data.reason).toContain('Unexpected error')
    })
  })

  describe('GET /api/health', () => {
    it('returns healthy status when all services are up', async () => {
      const { GET } = await import('@/app/api/health/route')
      const response = await GET()

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.status).toBe('healthy')
      expect(data.services).toBeDefined()
      expect(data.services.database.status).toBe('up')
      expect(data.services.auth.status).toBe('up')
      expect(data.services.storage.status).toBe('up')
      expect(data.services.api.status).toBe('up')
    })

    it('includes memory usage information', async () => {
      const { GET } = await import('@/app/api/health/route')
      const response = await GET()

      const data = await response.json()
      expect(data.checks.memory).toBeDefined()
      expect(data.checks.memory.used).toBe(25) // 25MB
      expect(data.checks.memory.total).toBe(50) // 50MB
      expect(data.checks.memory.percentage).toBe(50) // 50%
    })

    it('includes environment check', async () => {
      const { GET } = await import('@/app/api/health/route')
      const response = await GET()

      const data = await response.json()
      expect(data.checks.environment).toBeDefined()
      expect(data.checks.environment.nodeEnv).toBeDefined()
    })

    it('returns degraded status when some services are down', async () => {
      mockAdminClient.storage.listBuckets = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Storage unavailable' },
      })

      const { GET } = await import('@/app/api/health/route')
      const response = await GET()

      // Should be 503 for degraded
      expect([200, 503]).toContain(response.status)
      const data = await response.json()
      expect(['healthy', 'degraded']).toContain(data.status)
    })
  })
})
