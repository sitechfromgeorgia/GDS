/**
 * useAuth Hook Test Suite
 * Tests for authentication hook functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn()
}))

describe('useAuth Hook', () => {
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

  describe('Initialization', () => {
    it('should initialize with loading state', () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const { result } = renderHook(() => useAuth())

      expect(result.current.loading).toBe(true)
      expect(result.current.user).toBeNull()
    })

    it('should fetch current user on mount', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com'
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.user).toEqual(mockUser)
    })

    it('should handle initialization error', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Network error' }
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.user).toBeNull()
      expect(result.current.error).toBeTruthy()
    })
  })

  describe('Login', () => {
    it('should login successfully', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com'
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: {} },
        error: null
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let loginResult: any
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'password123')
      })

      expect(loginResult.success).toBe(true)
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    it('should handle login failure', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' }
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let loginResult: any
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'wrongpassword')
      })

      expect(loginResult.success).toBe(false)
      expect(loginResult.error).toBeTruthy()
    })

    it('should validate email format', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let loginResult: any
      await act(async () => {
        loginResult = await result.current.login('invalidemail', 'password123')
      })

      expect(loginResult.success).toBe(false)
      expect(loginResult.error).toContain('email')
    })

    it('should validate password length', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let loginResult: any
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'short')
      })

      expect(loginResult.success).toBe(false)
      expect(loginResult.error).toContain('password')
    })
  })

  describe('Signup', () => {
    it('should signup successfully', async () => {
      const mockUser = {
        id: '123',
        email: 'newuser@example.com'
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: {} },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: {},
          error: null
        })
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let signupResult: any
      await act(async () => {
        signupResult = await result.current.signup({
          email: 'newuser@example.com',
          password: 'password123',
          fullName: 'New User',
          role: 'restaurant'
        })
      })

      expect(signupResult.success).toBe(true)
      expect(mockSupabase.auth.signUp).toHaveBeenCalled()
    })

    it('should handle signup failure', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email already registered' }
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let signupResult: any
      await act(async () => {
        signupResult = await result.current.signup({
          email: 'existing@example.com',
          password: 'password123',
          fullName: 'Existing User',
          role: 'restaurant'
        })
      })

      expect(signupResult.success).toBe(false)
      expect(signupResult.error).toBeTruthy()
    })
  })

  describe('Logout', () => {
    it('should logout successfully', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com'
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.auth.signOut.mockResolvedValue({
        error: null
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.user).toEqual(mockUser)
      })

      await act(async () => {
        await result.current.logout()
      })

      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    })

    it('should handle logout error', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: '123' } },
        error: null
      })

      mockSupabase.auth.signOut.mockResolvedValue({
        error: { message: 'Logout failed' }
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        try {
          await result.current.logout()
        } catch (error) {
          expect(error).toBeTruthy()
        }
      })
    })
  })

  describe('Auth State Changes', () => {
    it('should listen to auth state changes', async () => {
      const mockCallback = vi.fn()

      mockSupabase.auth.onAuthStateChange.mockImplementation((callback: any) => {
        mockCallback.mockImplementation(callback)
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

      expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled()
    })

    it('should update user on SIGNED_IN event', async () => {
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

      const newUser = {
        id: '456',
        email: 'newuser@example.com'
      }

      act(() => {
        authCallback('SIGNED_IN', { user: newUser })
      })

      await waitFor(() => {
        expect(result.current.user).toEqual(newUser)
      })
    })

    it('should clear user on SIGNED_OUT event', async () => {
      let authCallback: any

      mockSupabase.auth.onAuthStateChange.mockImplementation((callback: any) => {
        authCallback = callback
        return {
          data: { subscription: { unsubscribe: vi.fn() } }
        }
      })

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: '123' } },
        error: null
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.user).toBeTruthy()
      })

      act(() => {
        authCallback('SIGNED_OUT', null)
      })

      await waitFor(() => {
        expect(result.current.user).toBeNull()
      })
    })
  })

  describe('User Profile', () => {
    it('should fetch user profile after authentication', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com'
      }

      const mockProfile = {
        id: '123',
        fullName: 'Test User',
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

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.profile).toEqual(mockProfile)
      })
    })

    it('should handle profile fetch error', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com'
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Profile not found' }
            })
          })
        })
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.profile).toBeNull()
      })
    })
  })

  describe('Cleanup', () => {
    it('should unsubscribe on unmount', async () => {
      const mockUnsubscribe = vi.fn()

      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: mockUnsubscribe } }
      })

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const { unmount } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled()
      })

      unmount()

      expect(mockUnsubscribe).toHaveBeenCalled()
    })
  })
})
