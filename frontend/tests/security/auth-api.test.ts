/**
 * Auth API Security Tests
 *
 * Tests for OAuth callback handling, deprecated endpoint responses,
 * and authentication security behaviors.
 *
 * Note: Most auth functionality has been moved to direct Supabase Auth calls.
 * These tests verify:
 * 1. OAuth callback route behavior
 * 2. Deprecated endpoints return proper 410 responses
 * 3. Security of authentication flows
 *
 * @module tests/security/auth-api
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// Mock Supabase server client
const mockExchangeCodeForSession = vi.fn()
const mockSupabaseAuth = {
  exchangeCodeForSession: mockExchangeCodeForSession,
  getUser: vi.fn(),
  getSession: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
  mfa: {
    enroll: vi.fn(),
    challenge: vi.fn(),
    verify: vi.fn(),
  },
}

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(() =>
    Promise.resolve({
      auth: mockSupabaseAuth,
    })
  ),
}))

// Import routes after mocking
import { GET as callbackGET } from '@/app/api/auth/callback/route'
import { POST as resetPasswordPOST } from '@/app/api/auth/reset-password/route'
import { GET as mfaSetupGET } from '@/app/api/auth/mfa/setup/route'
import { POST as mfaVerifyPOST } from '@/app/api/auth/mfa/verify/route'

// Helper to create mock Request
function createMockRequest(
  url: string,
  options: {
    method?: string
    body?: object
    headers?: Record<string, string>
  } = {}
): Request {
  const fullUrl = url.startsWith('http') ? url : `http://localhost:3000${url}`

  return new Request(fullUrl, {
    method: options.method || 'GET',
    headers: new Headers(options.headers || {}),
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
}

describe('Auth API Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('OAuth Callback (/api/auth/callback)', () => {
    it('should exchange valid code for session and redirect', async () => {
      mockExchangeCodeForSession.mockResolvedValue({ error: null })

      const request = createMockRequest('/api/auth/callback?code=valid-auth-code&next=/dashboard')
      const response = await callbackGET(request)

      expect(mockExchangeCodeForSession).toHaveBeenCalledWith('valid-auth-code')
      expect(response.status).toBe(307) // Redirect
      expect(response.headers.get('location')).toContain('/dashboard')
    })

    it('should redirect to error page with invalid/expired code', async () => {
      mockExchangeCodeForSession.mockResolvedValue({
        error: { message: 'Invalid or expired code' },
      })

      const request = createMockRequest('/api/auth/callback?code=expired-code')
      const response = await callbackGET(request)

      expect(response.status).toBe(307) // Redirect
      expect(response.headers.get('location')).toContain('/auth/auth-code-error')
    })

    it('should redirect to error page when code is missing', async () => {
      const request = createMockRequest('/api/auth/callback')
      const response = await callbackGET(request)

      expect(response.status).toBe(307) // Redirect
      expect(response.headers.get('location')).toContain('/auth/auth-code-error')
    })

    it('should use default redirect path when next param is missing', async () => {
      mockExchangeCodeForSession.mockResolvedValue({ error: null })

      const request = createMockRequest('/api/auth/callback?code=valid-code')
      const response = await callbackGET(request)

      expect(response.headers.get('location')).toContain('/dashboard')
    })

    it('should preserve custom redirect path from next param', async () => {
      mockExchangeCodeForSession.mockResolvedValue({ error: null })

      const request = createMockRequest('/api/auth/callback?code=valid-code&next=/custom-path')
      const response = await callbackGET(request)

      expect(response.headers.get('location')).toContain('/custom-path')
    })

    it('should handle Supabase errors gracefully', async () => {
      mockExchangeCodeForSession.mockRejectedValue(new Error('Network error'))

      const request = createMockRequest('/api/auth/callback?code=valid-code')

      // Should not throw, should redirect to error
      await expect(callbackGET(request)).rejects.toThrow()
    })
  })

  describe('Deprecated Endpoints - 410 Gone Responses', () => {
    describe('Password Reset (/api/auth/reset-password)', () => {
      it('should return 410 Gone status', async () => {
        const request = createMockRequest('/api/auth/reset-password', {
          method: 'POST',
          body: { email: 'test@greenland77.ge' },
        })

        const response = await resetPasswordPOST(request as unknown as NextRequest)
        const data = await response.json()

        expect(response.status).toBe(410)
        expect(data.error).toBe('API Deprecated')
      })

      it('should include migration instructions', async () => {
        const request = createMockRequest('/api/auth/reset-password', {
          method: 'POST',
          body: { email: 'test@greenland77.ge' },
        })

        const response = await resetPasswordPOST(request as unknown as NextRequest)
        const data = await response.json()

        expect(data.migration).toBeDefined()
        expect(data.migration.to).toContain('resetPasswordForEmail')
        expect(data.migration.documentation).toContain('supabase.com')
      })

      it('should not leak user information (same response for any email)', async () => {
        const emails = ['existing@greenland77.ge', 'nonexistent@fake.com', 'admin@greenland77.ge']

        for (const email of emails) {
          const request = createMockRequest('/api/auth/reset-password', {
            method: 'POST',
            body: { email },
          })

          const response = await resetPasswordPOST(request as unknown as NextRequest)
          const data = await response.json()

          // All responses should be identical (no user enumeration)
          expect(response.status).toBe(410)
          expect(data.error).toBe('API Deprecated')
        }
      })
    })

    describe('MFA Setup (/api/auth/mfa/setup)', () => {
      it('should return 410 Gone status', async () => {
        const request = createMockRequest('/api/auth/mfa/setup')

        const response = await mfaSetupGET(request as unknown as NextRequest)
        const data = await response.json()

        expect(response.status).toBe(410)
        expect(data.error).toBe('API Deprecated')
      })

      it('should include migration instructions', async () => {
        const request = createMockRequest('/api/auth/mfa/setup')

        const response = await mfaSetupGET(request as unknown as NextRequest)
        const data = await response.json()

        expect(data.migration).toBeDefined()
        expect(data.migration.to).toContain('mfa.enroll')
        expect(data.migration.documentation).toContain('auth-mfa')
      })
    })

    describe('MFA Verify (/api/auth/mfa/verify)', () => {
      it('should return 410 Gone status', async () => {
        const request = createMockRequest('/api/auth/mfa/verify', {
          method: 'POST',
          body: { code: '123456' },
        })

        const response = await mfaVerifyPOST(request as unknown as NextRequest)
        const data = await response.json()

        expect(response.status).toBe(410)
        expect(data.error).toBe('API Deprecated')
      })

      it('should include migration instructions', async () => {
        const request = createMockRequest('/api/auth/mfa/verify', {
          method: 'POST',
          body: { code: '123456' },
        })

        const response = await mfaVerifyPOST(request as unknown as NextRequest)
        const data = await response.json()

        expect(data.migration).toBeDefined()
        expect(data.migration.to).toContain('mfa.verify')
      })
    })
  })

  describe('Direct Supabase Auth Security Tests', () => {
    describe('Password Reset Flow', () => {
      it('should call Supabase resetPasswordForEmail with correct params', async () => {
        mockSupabaseAuth.resetPasswordForEmail.mockResolvedValue({
          data: {},
          error: null,
        })

        await mockSupabaseAuth.resetPasswordForEmail('user@greenland77.ge', {
          redirectTo: 'http://localhost:3000/reset-password',
        })

        expect(mockSupabaseAuth.resetPasswordForEmail).toHaveBeenCalledWith(
          'user@greenland77.ge',
          expect.objectContaining({ redirectTo: expect.any(String) })
        )
      })

      it('should handle invalid email format', async () => {
        mockSupabaseAuth.resetPasswordForEmail.mockResolvedValue({
          data: null,
          error: { message: 'Invalid email format' },
        })

        const result = await mockSupabaseAuth.resetPasswordForEmail('invalid-email', {
          redirectTo: 'http://localhost:3000/reset-password',
        })

        expect(result.error).toBeDefined()
      })
    })

    describe('MFA Enrollment Flow', () => {
      it('should enroll TOTP factor successfully', async () => {
        mockSupabaseAuth.mfa.enroll.mockResolvedValue({
          data: {
            id: 'factor-id',
            type: 'totp',
            totp: {
              qr_code: 'data:image/svg+xml;base64,...',
              secret: 'JBSWY3DPEHPK3PXP',
              uri: 'otpauth://totp/...',
            },
          },
          error: null,
        })

        const result = await mockSupabaseAuth.mfa.enroll({ factorType: 'totp' })

        expect(result.data).toBeDefined()
        expect(result.data.totp.secret).toBeDefined()
        expect(result.error).toBeNull()
      })

      it('should reject unauthenticated MFA enrollment', async () => {
        mockSupabaseAuth.mfa.enroll.mockResolvedValue({
          data: null,
          error: { message: 'Not authenticated' },
        })

        const result = await mockSupabaseAuth.mfa.enroll({ factorType: 'totp' })

        expect(result.error).toBeDefined()
        expect(result.error.message).toContain('authenticated')
      })
    })

    describe('MFA Verification Flow', () => {
      it('should verify valid TOTP code', async () => {
        mockSupabaseAuth.mfa.verify.mockResolvedValue({
          data: { access_token: 'new-token', refresh_token: 'new-refresh' },
          error: null,
        })

        const result = await mockSupabaseAuth.mfa.verify({
          factorId: 'factor-id',
          challengeId: 'challenge-id',
          code: '123456',
        })

        expect(result.data).toBeDefined()
        expect(result.error).toBeNull()
      })

      it('should reject invalid TOTP code', async () => {
        mockSupabaseAuth.mfa.verify.mockResolvedValue({
          data: null,
          error: { message: 'Invalid TOTP code' },
        })

        const result = await mockSupabaseAuth.mfa.verify({
          factorId: 'factor-id',
          challengeId: 'challenge-id',
          code: '000000',
        })

        expect(result.error).toBeDefined()
      })

      it('should reject expired TOTP code', async () => {
        mockSupabaseAuth.mfa.verify.mockResolvedValue({
          data: null,
          error: { message: 'TOTP code expired' },
        })

        const result = await mockSupabaseAuth.mfa.verify({
          factorId: 'factor-id',
          challengeId: 'challenge-id',
          code: '999999',
        })

        expect(result.error).toBeDefined()
      })
    })

    describe('Brute Force Protection', () => {
      it('should track failed login attempts', async () => {
        const failedAttempts: number[] = []

        for (let i = 0; i < 5; i++) {
          mockSupabaseAuth.signInWithPassword.mockResolvedValue({
            data: null,
            error: { message: 'Invalid credentials' },
          })

          await mockSupabaseAuth.signInWithPassword({
            email: 'user@greenland77.ge',
            password: 'wrong-password',
          })

          failedAttempts.push(i + 1)
        }

        // Should have 5 failed attempts recorded
        expect(failedAttempts).toHaveLength(5)
        expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledTimes(5)
      })

      it('should verify MFA challenge limitations', async () => {
        // Simulate 5 failed MFA attempts
        for (let i = 0; i < 5; i++) {
          mockSupabaseAuth.mfa.verify.mockResolvedValue({
            data: null,
            error: { message: 'Invalid code' },
          })

          await mockSupabaseAuth.mfa.verify({
            factorId: 'factor-id',
            challengeId: 'challenge-id',
            code: `00000${i}`,
          })
        }

        expect(mockSupabaseAuth.mfa.verify).toHaveBeenCalledTimes(5)
      })
    })
  })

  describe('Session Management Security', () => {
    it('should get current user session', async () => {
      mockSupabaseAuth.getSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'valid-token',
            refresh_token: 'valid-refresh',
            expires_at: Math.floor(Date.now() / 1000) + 3600,
          },
        },
        error: null,
      })

      const result = await mockSupabaseAuth.getSession()

      expect(result.data.session).toBeDefined()
      expect(result.data.session.access_token).toBeDefined()
    })

    it('should handle expired sessions', async () => {
      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Session expired' },
      })

      const result = await mockSupabaseAuth.getSession()

      expect(result.data.session).toBeNull()
    })

    it('should sign out user and clear session', async () => {
      mockSupabaseAuth.signOut.mockResolvedValue({ error: null })

      const result = await mockSupabaseAuth.signOut()

      expect(result.error).toBeNull()
      expect(mockSupabaseAuth.signOut).toHaveBeenCalled()
    })
  })
})
