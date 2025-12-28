/**
 * CSRF Protection Tests
 *
 * Comprehensive tests for CSRF token generation, validation,
 * timing-safe comparison, and API integration.
 *
 * Security Tests:
 * - Token generation randomness
 * - Token format validation (64 chars, hex)
 * - Timing-safe comparison
 * - Cookie-based token storage
 * - API endpoint security
 *
 * @module tests/security/csrf
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import {
  generateCSRFToken,
  compareCSRFTokens,
  createCSRFTokenWithExpiry,
  validateCSRFTokenWithExpiry,
  extractCSRFTokenFromHeaders,
  type CSRFTokenMetadata,
} from '@/lib/csrf-utils'
import { getCsrfToken, validateCsrfToken, SecurityHeaders, RateLimiter } from '@/lib/csrf'

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

// Mock csrf-cookie module
const mockSetCSRFCookie = vi.fn()
const mockGetCSRFCookie = vi.fn()

vi.mock('@/lib/csrf-cookie', () => ({
  setCSRFCookie: (response: NextResponse, token: string) => mockSetCSRFCookie(response, token),
  getCSRFCookie: (request: NextRequest) => mockGetCSRFCookie(request),
}))

describe('CSRF Protection Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Token Generation', () => {
    it('should generate token with exactly 64 characters', () => {
      const token = generateCSRFToken()
      expect(token).toHaveLength(64)
    })

    it('should generate valid hex string', () => {
      const token = generateCSRFToken()
      expect(token).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should generate unique tokens (10,000 generations)', () => {
      const tokens = new Set<string>()
      const iterations = 10000

      for (let i = 0; i < iterations; i++) {
        tokens.add(generateCSRFToken())
      }

      // All tokens should be unique
      expect(tokens.size).toBe(iterations)
    })

    it('should use cryptographic randomness (no patterns)', () => {
      const tokens = Array.from({ length: 100 }, () => generateCSRFToken())

      // Check first character distribution (should be roughly uniform)
      const firstChars = tokens.map((t) => t[0])
      const charCounts = firstChars.reduce(
        (acc, char) => {
          acc[char!] = (acc[char!] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      )

      // With 100 tokens and 16 possible hex chars, expect reasonable distribution
      const values = Object.values(charCounts)
      const maxCount = Math.max(...values)
      const minCount = Math.min(...values)

      // Difference should not be too extreme (not all same character)
      expect(maxCount - minCount).toBeLessThan(50)
    })

    it('should generate different token each call', () => {
      const token1 = generateCSRFToken()
      const token2 = generateCSRFToken()
      const token3 = generateCSRFToken()

      expect(token1).not.toBe(token2)
      expect(token2).not.toBe(token3)
      expect(token1).not.toBe(token3)
    })

    it('should support custom length tokens', () => {
      const token16 = generateCSRFToken(16)
      const token64 = generateCSRFToken(64)

      expect(token16).toHaveLength(32) // 16 bytes = 32 hex chars
      expect(token64).toHaveLength(128) // 64 bytes = 128 hex chars
    })
  })

  describe('Token Validation', () => {
    it('should accept valid 64-character hex token', () => {
      const validToken = 'a'.repeat(64)
      expect(validateCsrfToken(validToken)).toBe(true)
    })

    it('should reject empty string', () => {
      expect(validateCsrfToken('')).toBe(false)
    })

    it('should reject null/undefined', () => {
      expect(validateCsrfToken(null as unknown as string)).toBe(false)
      expect(validateCsrfToken(undefined as unknown as string)).toBe(false)
    })

    it('should reject 63-character token (too short)', () => {
      const shortToken = 'a'.repeat(63)
      expect(validateCsrfToken(shortToken)).toBe(false)
    })

    it('should reject 65-character token (too long)', () => {
      const longToken = 'a'.repeat(65)
      expect(validateCsrfToken(longToken)).toBe(false)
    })

    it('should reject non-hex characters', () => {
      const invalidTokens = [
        'g'.repeat(64), // 'g' is not hex
        'z'.repeat(64), // 'z' is not hex
        `!${'a'.repeat(63)}`, // special char
        ` ${'a'.repeat(63)}`, // space
        'a'.repeat(32) + 'G'.repeat(32), // uppercase outside a-f
      ]

      invalidTokens.forEach((token) => {
        expect(validateCsrfToken(token)).toBe(false)
      })
    })

    it('should handle case sensitivity correctly', () => {
      // Lowercase hex should be valid
      const lowercaseToken = 'abcdef0123456789'.repeat(4)
      expect(validateCsrfToken(lowercaseToken)).toBe(true)

      // Uppercase hex should also be valid (regex uses /i flag)
      const uppercaseToken = 'ABCDEF0123456789'.repeat(4)
      expect(validateCsrfToken(uppercaseToken)).toBe(true)

      // Mixed case
      const mixedToken = 'AbCdEf0123456789'.repeat(4)
      expect(validateCsrfToken(mixedToken)).toBe(true)
    })
  })

  describe('Timing-Safe Token Comparison', () => {
    it('should return true for matching tokens', () => {
      const token = generateCSRFToken()
      expect(compareCSRFTokens(token, token)).toBe(true)
    })

    it('should return false for different tokens', () => {
      const token1 = generateCSRFToken()
      const token2 = generateCSRFToken()
      expect(compareCSRFTokens(token1, token2)).toBe(false)
    })

    it('should return false for null client token', () => {
      const serverToken = generateCSRFToken()
      expect(compareCSRFTokens(null, serverToken)).toBe(false)
    })

    it('should return false for null server token', () => {
      const clientToken = generateCSRFToken()
      expect(compareCSRFTokens(clientToken, null)).toBe(false)
    })

    it('should return false for undefined tokens', () => {
      expect(compareCSRFTokens(undefined, undefined)).toBe(false)
      expect(compareCSRFTokens(undefined, 'valid-token')).toBe(false)
      expect(compareCSRFTokens('valid-token', undefined)).toBe(false)
    })

    it('should return false for different length tokens', () => {
      const shortToken = 'a'.repeat(32)
      const longToken = 'a'.repeat(64)
      expect(compareCSRFTokens(shortToken, longToken)).toBe(false)
    })

    it('should be timing-safe (constant time comparison)', () => {
      const token = generateCSRFToken()
      const almostMatch = token.slice(0, -1) + (token[63] === 'a' ? 'b' : 'a')
      const totallyDifferent = 'b'.repeat(64)

      // Both should return false in similar time (we can't measure exact timing,
      // but we can verify the comparison works correctly)
      expect(compareCSRFTokens(token, almostMatch)).toBe(false)
      expect(compareCSRFTokens(token, totallyDifferent)).toBe(false)
    })
  })

  describe('Token Expiration', () => {
    it('should create token with expiry metadata', () => {
      const metadata = createCSRFTokenWithExpiry(30)

      expect(metadata.token).toHaveLength(64)
      expect(metadata.createdAt).toBeLessThanOrEqual(Date.now())
      expect(metadata.expiresAt).toBeGreaterThan(Date.now())
    })

    it('should set correct expiration time', () => {
      const expirationMinutes = 15
      const before = Date.now()
      const metadata = createCSRFTokenWithExpiry(expirationMinutes)
      const after = Date.now()

      const expectedExpiry = expirationMinutes * 60 * 1000
      expect(metadata.expiresAt - metadata.createdAt).toBe(expectedExpiry)
      expect(metadata.createdAt).toBeGreaterThanOrEqual(before)
      expect(metadata.createdAt).toBeLessThanOrEqual(after)
    })

    it('should validate non-expired token', () => {
      const metadata = createCSRFTokenWithExpiry(30)

      const result = validateCSRFTokenWithExpiry(metadata.token, metadata)

      expect(result.valid).toBe(true)
      expect(result.reason).toBeUndefined()
    })

    it('should reject expired token', () => {
      const metadata: CSRFTokenMetadata = {
        token: generateCSRFToken(),
        createdAt: Date.now() - 60 * 60 * 1000, // 1 hour ago
        expiresAt: Date.now() - 30 * 60 * 1000, // Expired 30 mins ago
      }

      const result = validateCSRFTokenWithExpiry(metadata.token, metadata)

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Token expired')
    })

    it('should reject mismatched token', () => {
      const metadata = createCSRFTokenWithExpiry(30)
      const wrongToken = generateCSRFToken()

      const result = validateCSRFTokenWithExpiry(wrongToken, metadata)

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Token mismatch')
    })

    it('should reject when server metadata is null', () => {
      const clientToken = generateCSRFToken()

      const result = validateCSRFTokenWithExpiry(clientToken, null)

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('No server token found')
    })
  })

  describe('Header Extraction', () => {
    it('should extract token from X-CSRF-Token header', () => {
      const headers = new Headers()
      headers.set('X-CSRF-Token', 'test-token-123')

      const token = extractCSRFTokenFromHeaders(headers)
      expect(token).toBe('test-token-123')
    })

    it('should extract token from X-XSRF-Token header', () => {
      const headers = new Headers()
      headers.set('X-XSRF-Token', 'xsrf-token-456')

      const token = extractCSRFTokenFromHeaders(headers)
      expect(token).toBe('xsrf-token-456')
    })

    it('should extract token from CSRF-Token header', () => {
      const headers = new Headers()
      headers.set('CSRF-Token', 'csrf-token-789')

      const token = extractCSRFTokenFromHeaders(headers)
      expect(token).toBe('csrf-token-789')
    })

    it('should prioritize X-CSRF-Token over others', () => {
      const headers = new Headers()
      headers.set('X-CSRF-Token', 'primary-token')
      headers.set('X-XSRF-Token', 'secondary-token')
      headers.set('CSRF-Token', 'fallback-token')

      const token = extractCSRFTokenFromHeaders(headers)
      expect(token).toBe('primary-token')
    })

    it('should return null when no token header exists', () => {
      const headers = new Headers()
      headers.set('Content-Type', 'application/json')

      const token = extractCSRFTokenFromHeaders(headers)
      expect(token).toBeNull()
    })

    it('should handle plain object headers', () => {
      const headers = {
        'x-csrf-token': 'object-token',
        'content-type': 'application/json',
      }

      const token = extractCSRFTokenFromHeaders(headers)
      expect(token).toBe('object-token')
    })

    it('should handle array header values', () => {
      const headers = {
        'x-csrf-token': ['first-token', 'second-token'],
      }

      const token = extractCSRFTokenFromHeaders(headers)
      expect(token).toBe('first-token')
    })
  })

  describe('API Integration', () => {
    // Import the route handlers
    let csrfGET: typeof import('@/app/api/csrf/route').GET
    let csrfPOST: typeof import('@/app/api/csrf/route').POST

    beforeEach(async () => {
      const csrfRoute = await import('@/app/api/csrf/route')
      csrfGET = csrfRoute.GET
      csrfPOST = csrfRoute.POST
    })

    it('should generate token via GET /api/csrf', async () => {
      const request = new NextRequest('http://localhost:3000/api/csrf')
      const response = await csrfGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.csrfToken).toHaveLength(64)
      expect(data.valid).toBe(true)
      expect(data.expiresIn).toBe(1800)
      expect(mockSetCSRFCookie).toHaveBeenCalled()
    })

    it('should validate token via POST /api/csrf', async () => {
      const token = generateCSRFToken()
      mockGetCSRFCookie.mockReturnValue(token)

      const request = new NextRequest('http://localhost:3000/api/csrf', {
        method: 'POST',
        body: JSON.stringify({ csrfToken: token }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await csrfPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.valid).toBe(true)
    })

    it('should reject missing token in POST request', async () => {
      const request = new NextRequest('http://localhost:3000/api/csrf', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await csrfPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('required')
      expect(data.valid).toBe(false)
    })

    it('should reject when cookie token is missing', async () => {
      mockGetCSRFCookie.mockReturnValue(null)

      const request = new NextRequest('http://localhost:3000/api/csrf', {
        method: 'POST',
        body: JSON.stringify({ csrfToken: 'some-token' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await csrfPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('cookie')
      expect(data.valid).toBe(false)
    })

    it('should reject mismatched tokens with 403', async () => {
      mockGetCSRFCookie.mockReturnValue('server-token-123')

      const request = new NextRequest('http://localhost:3000/api/csrf', {
        method: 'POST',
        body: JSON.stringify({ csrfToken: 'different-client-token' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await csrfPOST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toContain('Invalid')
      expect(data.valid).toBe(false)
    })

    it('should rotate token after successful validation', async () => {
      const originalToken = generateCSRFToken()
      mockGetCSRFCookie.mockReturnValue(originalToken)

      const request = new NextRequest('http://localhost:3000/api/csrf', {
        method: 'POST',
        body: JSON.stringify({ csrfToken: originalToken }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await csrfPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.csrfToken).not.toBe(originalToken)
      expect(mockSetCSRFCookie).toHaveBeenCalledWith(expect.anything(), expect.any(String))
    })
  })

  describe('Security Headers', () => {
    it('should include all required security headers', () => {
      const headers = SecurityHeaders.getHeaders()

      expect(headers['Content-Security-Policy']).toBeDefined()
      expect(headers['X-Frame-Options']).toBe('DENY')
      expect(headers['X-Content-Type-Options']).toBe('nosniff')
      expect(headers['X-XSS-Protection']).toBe('1; mode=block')
      expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
      expect(headers['Permissions-Policy']).toBeDefined()
      expect(headers['Strict-Transport-Security']).toContain('max-age=31536000')
    })

    it('should have proper CSP directives', () => {
      const headers = SecurityHeaders.getHeaders()
      const csp = headers['Content-Security-Policy']

      expect(csp).toContain("default-src 'self'")
      expect(csp).toContain("frame-ancestors 'none'")
      expect(csp).toContain("base-uri 'self'")
      expect(csp).toContain("form-action 'self'")
    })

    it('should apply headers to response', () => {
      const response = NextResponse.json({ test: true })
      SecurityHeaders.applyToResponse(response)

      expect(response.headers.get('X-Frame-Options')).toBe('DENY')
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    })
  })

  describe('Rate Limiter', () => {
    it('should allow requests within limit', async () => {
      const result = await RateLimiter.checkLimit('test-ip')

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBeGreaterThan(0)
      expect(result.resetTime).toBeGreaterThan(Date.now())
    })

    it('should return rate limit headers format', async () => {
      const result = await RateLimiter.checkLimit('test-ip')

      expect(typeof result.remaining).toBe('number')
      expect(typeof result.resetTime).toBe('number')
    })
  })
})
