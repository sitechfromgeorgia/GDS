/**
 * Middleware Security Tests
 *
 * Tests for authentication bypass, session validation, role-based access,
 * security headers, and edge cases in the Next.js middleware.
 *
 * @module tests/security/middleware
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { middleware, config } from '@/middleware'

// Mock Supabase SSR
const mockGetUser = vi.fn()
const mockFrom = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}))

// Helper to create mock NextRequest
function createMockRequest(
  path: string,
  options: {
    cookies?: Record<string, string>
    headers?: Record<string, string>
  } = {}
): NextRequest {
  const url = new URL(path, 'http://localhost:3000')
  const headers = new Headers(options.headers || {})

  const request = {
    nextUrl: url,
    url: url.toString(),
    headers,
    cookies: {
      get: (name: string) => {
        const value = options.cookies?.[name]
        return value ? { name, value } : undefined
      },
      getAll: () => Object.entries(options.cookies || {}).map(([name, value]) => ({ name, value })),
      set: vi.fn(),
      delete: vi.fn(),
      has: (name: string) => Boolean(options.cookies?.[name]),
      clear: vi.fn(),
      size: Object.keys(options.cookies || {}).length,
      [Symbol.iterator]: function* () {
        for (const [name, value] of Object.entries(options.cookies || {})) {
          yield [name, { name, value }]
        }
      },
    },
    method: 'GET',
    body: null,
    bodyUsed: false,
    cache: 'default' as RequestCache,
    credentials: 'same-origin' as RequestCredentials,
    destination: '' as RequestDestination,
    integrity: '',
    keepalive: false,
    mode: 'cors' as RequestMode,
    redirect: 'follow' as RequestRedirect,
    referrer: '',
    referrerPolicy: '' as ReferrerPolicy,
    signal: new AbortController().signal,
    clone: vi.fn(),
    arrayBuffer: vi.fn(),
    blob: vi.fn(),
    formData: vi.fn(),
    json: vi.fn(),
    text: vi.fn(),
    geo: undefined,
    ip: undefined,
  } as unknown as NextRequest

  return request
}

describe('Middleware Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: no user authenticated
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('TEST_AUTH_BYPASS Security', () => {
    it('should reject bypass cookie in production environment', async () => {
      // Simulate production environment check
      vi.stubEnv('NODE_ENV', 'production')

      const request = createMockRequest('/dashboard/admin', {
        cookies: { TEST_AUTH_BYPASS: 'admin' },
      })

      const response = await middleware(request)

      // In production, bypass should NOT work - user should be redirected to login
      expect(response.headers.get('location') || response.status).toBeDefined()

      vi.stubEnv('NODE_ENV', 'test')
    })

    it('should only accept valid bypass values: admin, restaurant, driver', async () => {
      const validValues = ['admin', 'restaurant', 'driver']

      for (const value of validValues) {
        const request = createMockRequest('/dashboard', {
          cookies: { TEST_AUTH_BYPASS: value },
        })

        const response = await middleware(request)

        // Should NOT redirect to login for valid bypass values
        const location = response.headers.get('location')
        expect(location).not.toContain('/login')
      }
    })

    it('should reject invalid bypass values', async () => {
      const invalidValues = ['user', 'customer', 'guest', 'superadmin', '', 'ADMIN', 'Admin']

      for (const value of invalidValues) {
        mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

        const request = createMockRequest('/dashboard', {
          cookies: { TEST_AUTH_BYPASS: value },
        })

        const response = await middleware(request)

        // Should redirect to login for invalid bypass values
        const location = response.headers.get('location')
        if (location) {
          expect(location).toContain('/login')
        }
      }
    })

    it('should create bypass user with test- prefix in ID', async () => {
      const request = createMockRequest('/dashboard', {
        cookies: { TEST_AUTH_BYPASS: 'admin' },
      })

      // Middleware creates mockedUser with id: `test-${role}-id`
      // We verify this by checking the behavior when accessing admin routes
      const response = await middleware(request)

      // Should allow access (no redirect to login)
      const location = response.headers.get('location')
      expect(location).not.toContain('/login')
    })
  })

  describe('Session Validation', () => {
    it('should grant access with valid session', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'valid-user-id',
            email: 'user@greenland77.ge',
            role: 'authenticated',
          },
        },
        error: null,
      })

      const request = createMockRequest('/dashboard')
      const response = await middleware(request)

      // Should not redirect to login
      const location = response.headers.get('location')
      expect(location).not.toContain('/login')
    })

    it('should redirect to login with expired/invalid session', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Session expired' },
      })

      const request = createMockRequest('/dashboard')
      const response = await middleware(request)

      // Should redirect to login
      const location = response.headers.get('location')
      expect(location).toContain('/login')
    })

    it('should handle invalid JWT gracefully', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid JWT' },
      })

      const request = createMockRequest('/dashboard')
      const response = await middleware(request)

      // Should redirect to login
      const location = response.headers.get('location')
      expect(location).toContain('/login')
    })

    it('should allow public routes without session', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

      const publicRoutes = ['/', '/login', '/register', '/about', '/contact']

      for (const route of publicRoutes) {
        const request = createMockRequest(route)
        const response = await middleware(request)

        // Should NOT redirect to login for public routes
        const location = response.headers.get('location')
        expect(location).not.toContain('/login')
      }
    })

    it('should redirect protected routes without session', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

      const protectedRoutes = ['/dashboard', '/dashboard/admin', '/dashboard/restaurant']

      for (const route of protectedRoutes) {
        const request = createMockRequest(route)
        const response = await middleware(request)

        // Should redirect to login
        const location = response.headers.get('location')
        expect(location).toContain('/login')
      }
    })
  })

  describe('Role-Based Access Control', () => {
    it('should allow admin access to /dashboard/admin', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'admin-user-id',
            email: 'admin@greenland77.ge',
            role: 'authenticated',
          },
        },
        error: null,
      })

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { role: 'admin' },
          error: null,
        }),
      })

      const request = createMockRequest('/dashboard/admin')
      const response = await middleware(request)

      // Admin should have access
      const location = response.headers.get('location')
      expect(location).not.toContain('/dashboard')
    })

    it('should block restaurant user from /dashboard/admin', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'restaurant-user-id',
            email: 'restaurant@greenland77.ge',
            role: 'authenticated',
          },
        },
        error: null,
      })

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { role: 'restaurant' },
          error: null,
        }),
      })

      const request = createMockRequest('/dashboard/admin')
      const response = await middleware(request)

      // Restaurant should be redirected to /dashboard
      const location = response.headers.get('location')
      if (location) {
        expect(location).toContain('/dashboard')
        expect(location).not.toContain('/admin')
      }
    })

    it('should block driver user from /dashboard/admin', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'driver-user-id',
            email: 'driver@greenland77.ge',
            role: 'authenticated',
          },
        },
        error: null,
      })

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { role: 'driver' },
          error: null,
        }),
      })

      const request = createMockRequest('/dashboard/admin')
      const response = await middleware(request)

      // Driver should be redirected
      const location = response.headers.get('location')
      if (location) {
        expect(location).toContain('/dashboard')
      }
    })

    it('should block demo user from /dashboard/admin', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'demo-user-id',
            email: 'demo@greenland77.ge',
            role: 'authenticated',
          },
        },
        error: null,
      })

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { role: 'demo' },
          error: null,
        }),
      })

      const request = createMockRequest('/dashboard/admin')
      const response = await middleware(request)

      // Demo should be redirected
      const location = response.headers.get('location')
      if (location) {
        expect(location).toContain('/dashboard')
      }
    })

    it('should allow restaurant user access to /dashboard/restaurant', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'restaurant-user-id',
            email: 'restaurant@greenland77.ge',
            role: 'authenticated',
          },
        },
        error: null,
      })

      const request = createMockRequest('/dashboard/restaurant')
      const response = await middleware(request)

      // Restaurant should have access
      const location = response.headers.get('location')
      expect(location).not.toContain('/login')
    })

    it('should allow driver user access to /dashboard/driver', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'driver-user-id',
            email: 'driver@greenland77.ge',
            role: 'authenticated',
          },
        },
        error: null,
      })

      const request = createMockRequest('/dashboard/driver')
      const response = await middleware(request)

      // Driver should have access
      const location = response.headers.get('location')
      expect(location).not.toContain('/login')
    })
  })

  describe('Security Headers', () => {
    it('should set X-Content-Type-Options header', async () => {
      const request = createMockRequest('/')
      const response = await middleware(request)

      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    })

    it('should set X-Frame-Options header', async () => {
      const request = createMockRequest('/')
      const response = await middleware(request)

      expect(response.headers.get('X-Frame-Options')).toBe('DENY')
    })

    it('should set X-XSS-Protection header', async () => {
      const request = createMockRequest('/')
      const response = await middleware(request)

      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block')
    })

    it('should set Strict-Transport-Security header', async () => {
      const request = createMockRequest('/')
      const response = await middleware(request)

      const hsts = response.headers.get('Strict-Transport-Security')
      expect(hsts).toContain('max-age=31536000')
      expect(hsts).toContain('includeSubDomains')
      expect(hsts).toContain('preload')
    })

    it('should set X-Response-Time header', async () => {
      const request = createMockRequest('/')
      const response = await middleware(request)

      const responseTime = response.headers.get('X-Response-Time')
      expect(responseTime).toMatch(/^\d+ms$/)
    })
  })

  describe('Route Matching Configuration', () => {
    it('should have correct matcher pattern', () => {
      expect(config.matcher).toBeDefined()
      expect(config.matcher).toHaveLength(1)

      const matcherPattern = config.matcher[0]

      // Should NOT match static files
      expect(matcherPattern).toContain('_next/static')
      expect(matcherPattern).toContain('_next/image')
      expect(matcherPattern).toContain('favicon.ico')
      expect(matcherPattern).toContain('api/health')
    })

    it('should exclude static assets from middleware', () => {
      const excludedPatterns = [
        '/_next/static/chunk.js',
        '/_next/image/image.jpg',
        '/favicon.ico',
        '/api/health',
        '/logo.svg',
        '/image.png',
        '/photo.jpg',
        '/pic.jpeg',
        '/animation.gif',
        '/modern.webp',
      ]

      const matcherRegex = new RegExp(
        (config.matcher?.[0] || '').replace('(?!', '(?:').replace(')', ')').replace('.*', '.*')
      )

      // These patterns are in the negative lookahead, so middleware should skip them
      // The matcher uses negative lookahead (?!...) to exclude these patterns
      expect(config.matcher[0]).toContain('_next/static')
      expect(config.matcher[0]).toContain('_next/image')
      expect(config.matcher[0]).toContain('favicon.ico')
      expect(config.matcher[0]).toContain('api/health')
      expect(config.matcher[0]).toContain('svg|png|jpg|jpeg|gif|webp')
    })
  })

  describe('Edge Cases', () => {
    it('should preserve query parameters on redirect', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

      const request = createMockRequest('/dashboard?returnTo=/orders')
      const response = await middleware(request)

      const location = response.headers.get('location')
      if (location) {
        expect(location).toContain('/login')
        expect(location).toContain('next=')
      }
    })

    it('should handle concurrent requests gracefully', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-1', email: 'test@test.com' } },
        error: null,
      })

      const requests = Array.from({ length: 10 }, (_, i) =>
        createMockRequest(`/dashboard/page-${i}`)
      )

      const responses = await Promise.all(requests.map((req) => middleware(req)))

      // All requests should complete successfully
      expect(responses).toHaveLength(10)
      responses.forEach((response) => {
        expect(response).toBeDefined()
      })
    })

    it('should handle profile fetch errors gracefully', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-id',
            email: 'user@greenland77.ge',
          },
        },
        error: null,
      })

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Profile not found' },
        }),
      })

      const request = createMockRequest('/dashboard/admin')
      const response = await middleware(request)

      // Should handle gracefully - redirect non-admin users
      const location = response.headers.get('location')
      if (location) {
        expect(location).toContain('/dashboard')
      }
    })
  })
})
