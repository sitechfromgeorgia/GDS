/**
 * Authentication Flow Integration Tests
 * Tests complete authentication workflows from UI to backend
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { renderHook, act } from '@testing-library/react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn()
}))

// Mock router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn()
  }),
  usePathname: () => '/'
}))

describe('Authentication Flow Integration Tests', () => {
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = {
      auth: {
        getUser: vi.fn(),
        getSession: vi.fn(),
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        onAuthStateChange: vi.fn()
      },
      from: vi.fn()
    }

    ;(createClient as any).mockReturnValue(mockSupabase)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Complete Login Flow', () => {
    it('should complete full login flow from form to authenticated state', async () => {
      // Mock successful authentication
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {
          full_name: 'Test User'
        }
      }

      const mockProfile = {
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'restaurant'
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: mockUser,
          session: {
            access_token: 'mock-token',
            expires_in: 3600
          }
        },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null
            })
          })
        })
      })

      mockSupabase.auth.onAuthStateChange.mockImplementation((callback: any) => {
        return {
          data: { subscription: { unsubscribe: vi.fn() } }
        }
      })

      // Render hook and wait for initialization
      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Perform login
      let loginResult: any
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'Password123')
      })

      // Verify login success
      expect(loginResult.success).toBe(true)
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123'
      })

      // Verify user is authenticated
      expect(result.current.user).toEqual(mockUser)

      // Verify profile was fetched
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
    })

    it('should handle login validation errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Try to login with invalid email
      let loginResult: any
      await act(async () => {
        loginResult = await result.current.login('invalid-email', 'Password123')
      })

      expect(loginResult.success).toBe(false)
      expect(loginResult.error).toContain('email')
      expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled()
    })

    it('should handle login authentication errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' }
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let loginResult: any
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'WrongPassword')
      })

      expect(loginResult.success).toBe(false)
      expect(loginResult.error).toBeTruthy()
      expect(result.current.user).toBeNull()
    })
  })

  describe('Complete Signup Flow', () => {
    it('should complete full signup flow from form to profile creation', async () => {
      const signupData = {
        email: 'newuser@example.com',
        password: 'SecurePass123',
        fullName: 'New User',
        phone: '+995555123456',
        role: 'restaurant'
      }

      const mockUser = {
        id: 'new-user-123',
        email: signupData.email
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: mockUser,
          session: {
            access_token: 'mock-token'
          }
        },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: [{
            id: 'new-user-123',
            email: signupData.email,
            full_name: signupData.fullName,
            phone: signupData.phone,
            role: signupData.role
          }],
          error: null
        })
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let signupResult: any
      await act(async () => {
        signupResult = await result.current.signup(signupData)
      })

      // Verify signup success
      expect(signupResult.success).toBe(true)
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: signupData.email,
        password: signupData.password,
        options: {
          data: {
            full_name: signupData.fullName,
            phone: signupData.phone,
            role: signupData.role
          }
        }
      })

      // Verify profile was created
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
    })

    it('should handle duplicate email during signup', async () => {
      const signupData = {
        email: 'existing@example.com',
        password: 'Password123',
        fullName: 'Test User',
        role: 'restaurant'
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already registered' }
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let signupResult: any
      await act(async () => {
        signupResult = await result.current.signup(signupData)
      })

      expect(signupResult.success).toBe(false)
      expect(signupResult.error).toContain('registered')
    })
  })

  describe('Complete Logout Flow', () => {
    it('should complete full logout flow and clear state', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.auth.signOut.mockResolvedValue({
        error: null
      })

      mockSupabase.auth.onAuthStateChange.mockImplementation((callback: any) => {
        return {
          data: { subscription: { unsubscribe: vi.fn() } }
        }
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.user).toEqual(mockUser)
      })

      // Perform logout
      await act(async () => {
        await result.current.logout()
      })

      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    })
  })

  describe('Session Persistence', () => {
    it('should restore session on page reload', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      }

      const mockProfile = {
        id: 'user-123',
        full_name: 'Test User',
        role: 'restaurant'
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null
            })
          })
        })
      })

      mockSupabase.auth.onAuthStateChange.mockImplementation((callback: any) => {
        return {
          data: { subscription: { unsubscribe: vi.fn() } }
        }
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.profile).toEqual(mockProfile)
    })

    it('should handle expired sessions', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'JWT expired' }
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.user).toBeNull()
      expect(result.current.error).toBeTruthy()
    })
  })

  describe('Auth State Changes', () => {
    it('should handle auth state change events', async () => {
      let authCallback: any

      mockSupabase.auth.onAuthStateChange.mockImplementation((callback: any) => {
        authCallback = callback
        return {
          data: { subscription: { unsubscribe: vi.fn() } }
        }
      })

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Simulate SIGNED_IN event
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      }

      act(() => {
        authCallback('SIGNED_IN', { user: mockUser })
      })

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

      // Simulate SIGNED_OUT event
      act(() => {
        authCallback('SIGNED_OUT', null)
      })

      await waitFor(() => {
        expect(result.current.user).toBeNull()
      })
    })
  })

  describe('Role-Based Behavior', () => {
    it('should fetch role-specific data after authentication', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      }

      const mockProfile = {
        id: 'user-123',
        role: 'admin'
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null
            })
          })
        })
      })

      mockSupabase.auth.onAuthStateChange.mockImplementation(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      }))

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.profile?.role).toBe('admin')
    })
  })
})
