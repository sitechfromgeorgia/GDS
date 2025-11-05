/**
 * User Management Flow Integration Tests
 * Tests complete user management workflows for admin operations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { createClient } from '@/lib/supabase/client'
import { useUsers } from '@/hooks/useUsers'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn()
}))

describe('User Management Flow Integration Tests', () => {
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = {
      auth: {
        admin: {
          createUser: vi.fn(),
          updateUserById: vi.fn(),
          deleteUser: vi.fn(),
          listUsers: vi.fn()
        }
      },
      from: vi.fn(),
      channel: vi.fn()
    }

    ;(createClient as any).mockReturnValue(mockSupabase)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Complete User Creation Flow', () => {
    it('should create user with auth and profile', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'SecurePass123',
        fullName: 'New User',
        phone: '+995555123456',
        role: 'restaurant'
      }

      const createdAuthUser = {
        id: 'user-1',
        email: userData.email,
        email_confirmed_at: new Date().toISOString()
      }

      const createdProfile = {
        id: 'user-1',
        email: userData.email,
        full_name: userData.fullName,
        phone: userData.phone,
        role: userData.role,
        created_at: new Date().toISOString()
      }

      // Mock auth user creation
      mockSupabase.auth.admin.createUser.mockResolvedValue({
        data: { user: createdAuthUser },
        error: null
      })

      // Mock profile creation
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            insert: vi.fn().mockResolvedValue({
              data: [createdProfile],
              error: null
            }),
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
          }
        }
        return {}
      })

      mockSupabase.channel.mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockResolvedValue({ status: 'subscribed' })
      })

      const { result } = renderHook(() => useUsers())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let createResult: any
      await act(async () => {
        createResult = await result.current.createUser(userData)
      })

      expect(createResult.success).toBe(true)
      expect(createResult.data.email).toBe(userData.email)
      expect(createResult.data.role).toBe(userData.role)
      expect(mockSupabase.auth.admin.createUser).toHaveBeenCalledWith({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          full_name: userData.fullName,
          phone: userData.phone,
          role: userData.role
        }
      })
    })

    it('should validate user data before creation', async () => {
      const invalidUserData = {
        email: 'not-an-email',
        password: 'short',
        fullName: '',
        phone: '123',
        role: 'invalid_role'
      }

      const { result } = renderHook(() => useUsers())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let createResult: any
      await act(async () => {
        createResult = await result.current.createUser(invalidUserData)
      })

      expect(createResult.success).toBe(false)
      expect(createResult.error).toBeTruthy()
    })

    it('should prevent duplicate email addresses', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'Password123',
        fullName: 'User',
        role: 'restaurant'
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: 'user-1', email: 'existing@example.com' }],
                error: null
              })
            })
          }
        }
        return {}
      })

      const { result } = renderHook(() => useUsers())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let createResult: any
      await act(async () => {
        createResult = await result.current.createUser(userData)
      })

      expect(createResult.success).toBe(false)
      expect(createResult.error).toContain('already exists')
    })

    it('should send welcome email after user creation', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'Password123',
        fullName: 'New User',
        role: 'driver'
      }

      const createdAuthUser = {
        id: 'user-1',
        email: userData.email
      }

      mockSupabase.auth.admin.createUser.mockResolvedValue({
        data: { user: createdAuthUser },
        error: null
      })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            insert: vi.fn().mockResolvedValue({
              data: [{ id: 'user-1' }],
              error: null
            }),
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
          }
        }
        if (table === 'email_queue') {
          return {
            insert: vi.fn().mockResolvedValue({
              data: [{ id: 'email-1', type: 'welcome' }],
              error: null
            })
          }
        }
        return {}
      })

      const { result } = renderHook(() => useUsers())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.createUser(userData)
      })

      expect(mockSupabase.from).toHaveBeenCalledWith('email_queue')
    })
  })

  describe('User Profile Update Flow', () => {
    it('should update user profile information', async () => {
      const userId = 'user-1'
      const updateData = {
        fullName: 'Updated Name',
        phone: '+995555999888',
        address: '456 New St'
      }

      const updatedProfile = {
        id: userId,
        full_name: updateData.fullName,
        phone: updateData.phone,
        address: updateData.address,
        updated_at: new Date().toISOString()
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [updatedProfile],
                error: null
              })
            }),
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: userId, full_name: 'Old Name' }],
                error: null
              })
            })
          }
        }
        return {}
      })

      mockSupabase.channel.mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockResolvedValue({ status: 'subscribed' })
      })

      const { result } = renderHook(() => useUsers())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let updateResult: any
      await act(async () => {
        updateResult = await result.current.updateUserProfile(userId, updateData)
      })

      expect(updateResult.success).toBe(true)
      expect(updateResult.data.full_name).toBe('Updated Name')
      expect(updateResult.data.phone).toBe('+995555999888')
    })

    it('should validate phone number format', async () => {
      const userId = 'user-1'
      const updateData = {
        phone: '123' // Invalid format
      }

      const { result } = renderHook(() => useUsers())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let updateResult: any
      await act(async () => {
        updateResult = await result.current.updateUserProfile(userId, updateData)
      })

      expect(updateResult.success).toBe(false)
      expect(updateResult.error).toContain('phone')
    })
  })

  describe('Role Management Flow', () => {
    it('should update user role with permission checks', async () => {
      const userId = 'user-1'
      const newRole = 'admin'
      const adminUserId = 'admin-1'

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: adminUserId, role: 'admin' }],
                error: null
              })
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: userId, role: newRole }],
                error: null
              })
            })
          }
        }
        return {}
      })

      const { result } = renderHook(() => useUsers())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let updateResult: any
      await act(async () => {
        updateResult = await result.current.updateUserRole(userId, newRole, adminUserId)
      })

      expect(updateResult.success).toBe(true)
      expect(updateResult.data.role).toBe('admin')
    })

    it('should prevent non-admin users from changing roles', async () => {
      const userId = 'user-1'
      const newRole = 'admin'
      const requestingUserId = 'user-2'

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: requestingUserId, role: 'restaurant' }],
                error: null
              })
            })
          }
        }
        return {}
      })

      const { result } = renderHook(() => useUsers())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let updateResult: any
      await act(async () => {
        updateResult = await result.current.updateUserRole(userId, newRole, requestingUserId)
      })

      expect(updateResult.success).toBe(false)
      expect(updateResult.error).toContain('permission')
    })

    it('should validate role transitions', async () => {
      const userId = 'user-1'
      const invalidRole = 'superadmin'
      const adminUserId = 'admin-1'

      const { result } = renderHook(() => useUsers())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let updateResult: any
      await act(async () => {
        updateResult = await result.current.updateUserRole(userId, invalidRole, adminUserId)
      })

      expect(updateResult.success).toBe(false)
      expect(updateResult.error).toContain('Invalid role')
    })

    it('should log role changes for audit', async () => {
      const userId = 'user-1'
      const newRole = 'driver'
      const adminUserId = 'admin-1'

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: adminUserId, role: 'admin' }],
                error: null
              })
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: userId, role: newRole }],
                error: null
              })
            })
          }
        }
        if (table === 'audit_logs') {
          return {
            insert: vi.fn().mockResolvedValue({
              data: [{ id: 'log-1', action: 'role_change' }],
              error: null
            })
          }
        }
        return {}
      })

      const { result } = renderHook(() => useUsers())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.updateUserRole(userId, newRole, adminUserId)
      })

      expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs')
    })
  })

  describe('User Status Management Flow', () => {
    it('should activate/deactivate user accounts', async () => {
      const userId = 'user-1'

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: userId, active: false }],
                error: null
              })
            }),
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: userId, active: true }],
                error: null
              })
            })
          }
        }
        return {}
      })

      mockSupabase.auth.admin.updateUserById.mockResolvedValue({
        data: { user: { id: userId, banned: true } },
        error: null
      })

      const { result } = renderHook(() => useUsers())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let deactivateResult: any
      await act(async () => {
        deactivateResult = await result.current.deactivateUser(userId)
      })

      expect(deactivateResult.success).toBe(true)
      expect(deactivateResult.data.active).toBe(false)
    })

    it('should suspend user with reason', async () => {
      const userId = 'user-1'
      const suspensionReason = 'Violation of terms'
      const suspensionDuration = 30 // days

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{
                  id: userId,
                  suspended: true,
                  suspension_reason: suspensionReason,
                  suspension_until: new Date(Date.now() + suspensionDuration * 24 * 60 * 60 * 1000).toISOString()
                }],
                error: null
              })
            })
          }
        }
        return {}
      })

      const { result } = renderHook(() => useUsers())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let suspendResult: any
      await act(async () => {
        suspendResult = await result.current.suspendUser(userId, suspensionReason, suspensionDuration)
      })

      expect(suspendResult.success).toBe(true)
      expect(suspendResult.data.suspended).toBe(true)
      expect(suspendResult.data.suspension_reason).toBe(suspensionReason)
    })

    it('should require suspension reason', async () => {
      const userId = 'user-1'
      const suspensionReason = ''

      const { result } = renderHook(() => useUsers())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let suspendResult: any
      await act(async () => {
        suspendResult = await result.current.suspendUser(userId, suspensionReason, 30)
      })

      expect(suspendResult.success).toBe(false)
      expect(suspendResult.error).toContain('reason required')
    })
  })

  describe('User Search and Filter Flow', () => {
    it('should search users by name or email', async () => {
      const searchQuery = 'john'
      const mockUsers = [
        { id: 'user-1', full_name: 'John Doe', email: 'john@example.com', role: 'restaurant' },
        { id: 'user-2', full_name: 'Jane Smith', email: 'jane@example.com', role: 'driver' },
        { id: 'user-3', full_name: 'Johnny Walker', email: 'johnny@example.com', role: 'restaurant' }
      ]

      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockResolvedValue({
            data: mockUsers.filter(u =>
              u.full_name.toLowerCase().includes(searchQuery) ||
              u.email.toLowerCase().includes(searchQuery)
            ),
            error: null
          })
        })
      }))

      mockSupabase.channel.mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockResolvedValue({ status: 'subscribed' })
      })

      const { result } = renderHook(() => useUsers())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.searchUsers(searchQuery)
      })

      await waitFor(() => {
        expect(result.current.searchResults).toHaveLength(2)
        expect(result.current.searchResults.every(u =>
          u.full_name.toLowerCase().includes(searchQuery) ||
          u.email.toLowerCase().includes(searchQuery)
        )).toBe(true)
      })
    })

    it('should filter users by role', async () => {
      const role = 'driver'
      const mockUsers = [
        { id: 'user-1', full_name: 'Driver 1', role: 'driver' },
        { id: 'user-2', full_name: 'Restaurant 1', role: 'restaurant' },
        { id: 'user-3', full_name: 'Driver 2', role: 'driver' }
      ]

      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockUsers.filter(u => u.role === role),
            error: null
          })
        })
      }))

      const { result } = renderHook(() => useUsers())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.filterByRole(role)
      })

      await waitFor(() => {
        expect(result.current.filteredUsers).toHaveLength(2)
        expect(result.current.filteredUsers.every(u => u.role === role)).toBe(true)
      })
    })

    it('should filter active/inactive users', async () => {
      const activeStatus = true
      const mockUsers = [
        { id: 'user-1', full_name: 'Active User', active: true },
        { id: 'user-2', full_name: 'Inactive User', active: false },
        { id: 'user-3', full_name: 'Active User 2', active: true }
      ]

      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockUsers.filter(u => u.active === activeStatus),
            error: null
          })
        })
      }))

      const { result } = renderHook(() => useUsers())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.filterByStatus(activeStatus)
      })

      await waitFor(() => {
        expect(result.current.filteredUsers).toHaveLength(2)
        expect(result.current.filteredUsers.every(u => u.active === activeStatus)).toBe(true)
      })
    })
  })

  describe('User Deletion Flow', () => {
    it('should soft delete user account', async () => {
      const userId = 'user-1'

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: userId, role: 'restaurant' }],
                error: null
              })
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: userId, deleted_at: new Date().toISOString() }],
                error: null
              })
            })
          }
        }
        return {}
      })

      const { result } = renderHook(() => useUsers())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let deleteResult: any
      await act(async () => {
        deleteResult = await result.current.softDeleteUser(userId)
      })

      expect(deleteResult.success).toBe(true)
      expect(deleteResult.data.deleted_at).toBeTruthy()
    })

    it('should prevent deletion of admin users', async () => {
      const userId = 'admin-1'

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: userId, role: 'admin' }],
                error: null
              })
            })
          }
        }
        return {}
      })

      const { result } = renderHook(() => useUsers())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let deleteResult: any
      await act(async () => {
        deleteResult = await result.current.softDeleteUser(userId)
      })

      expect(deleteResult.success).toBe(false)
      expect(deleteResult.error).toContain('cannot delete admin')
    })

    it('should check for active orders before deletion', async () => {
      const userId = 'rest-1'

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: userId, role: 'restaurant' }],
                error: null
              })
            })
          }
        }
        if (table === 'orders') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({
                  data: [{ id: 'order-1', status: 'pending' }],
                  error: null
                })
              })
            })
          }
        }
        return {}
      })

      const { result } = renderHook(() => useUsers())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let deleteResult: any
      await act(async () => {
        deleteResult = await result.current.softDeleteUser(userId)
      })

      expect(deleteResult.success).toBe(false)
      expect(deleteResult.error).toContain('active orders')
    })
  })

  describe('Password Reset Flow', () => {
    it('should initiate password reset for user', async () => {
      const userId = 'user-1'
      const email = 'user@example.com'

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: userId, email }],
                error: null
              })
            })
          }
        }
        return {}
      })

      mockSupabase.auth.admin.updateUserById.mockResolvedValue({
        data: { user: { id: userId } },
        error: null
      })

      const { result } = renderHook(() => useUsers())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let resetResult: any
      await act(async () => {
        resetResult = await result.current.initiatePasswordReset(userId)
      })

      expect(resetResult.success).toBe(true)
    })

    it('should set temporary password for user', async () => {
      const userId = 'user-1'
      const tempPassword = 'Temp123456'

      mockSupabase.auth.admin.updateUserById.mockResolvedValue({
        data: {
          user: {
            id: userId,
            user_metadata: { password_reset_required: true }
          }
        },
        error: null
      })

      const { result } = renderHook(() => useUsers())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let resetResult: any
      await act(async () => {
        resetResult = await result.current.setTemporaryPassword(userId, tempPassword)
      })

      expect(resetResult.success).toBe(true)
    })
  })

  describe('User Statistics Flow', () => {
    it('should calculate user statistics by role', async () => {
      const mockUsers = [
        { id: '1', role: 'admin', active: true },
        { id: '2', role: 'restaurant', active: true },
        { id: '3', role: 'restaurant', active: false },
        { id: '4', role: 'driver', active: true },
        { id: '5', role: 'driver', active: true },
        { id: '6', role: 'driver', active: false }
      ]

      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockResolvedValue({
          data: mockUsers,
          error: null
        })
      }))

      mockSupabase.channel.mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockResolvedValue({ status: 'subscribed' })
      })

      const { result } = renderHook(() => useUsers())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.fetchUserStatistics()
      })

      await waitFor(() => {
        expect(result.current.statistics).toBeDefined()
        expect(result.current.statistics.total).toBe(6)
        expect(result.current.statistics.byRole.admin).toBe(1)
        expect(result.current.statistics.byRole.restaurant).toBe(2)
        expect(result.current.statistics.byRole.driver).toBe(3)
        expect(result.current.statistics.active).toBe(4)
        expect(result.current.statistics.inactive).toBe(2)
      })
    })
  })

  describe('Real-time User Updates', () => {
    it('should receive real-time profile updates', async () => {
      let subscriptionCallback: any

      mockSupabase.channel.mockReturnValue({
        on: vi.fn().mockImplementation((event: string, filter: any, callback: any) => {
          subscriptionCallback = callback
          return mockSupabase.channel()
        }),
        subscribe: vi.fn().mockResolvedValue({ status: 'subscribed' })
      })

      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ id: 'user-1', full_name: 'Original Name' }],
            error: null
          })
        })
      }))

      const { result } = renderHook(() => useUsers())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const updatedUser = {
        id: 'user-1',
        full_name: 'Updated Name',
        role: 'driver'
      }

      act(() => {
        subscriptionCallback({
          eventType: 'UPDATE',
          new: updatedUser,
          old: { id: 'user-1', full_name: 'Original Name' }
        })
      })

      await waitFor(() => {
        const user = result.current.users.find(u => u.id === 'user-1')
        expect(user?.full_name).toBe('Updated Name')
      })
    })

    it('should add new users via real-time subscription', async () => {
      let subscriptionCallback: any

      mockSupabase.channel.mockReturnValue({
        on: vi.fn().mockImplementation((event: string, filter: any, callback: any) => {
          subscriptionCallback = callback
          return mockSupabase.channel()
        }),
        subscribe: vi.fn().mockResolvedValue({ status: 'subscribed' })
      })

      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      }))

      const { result } = renderHook(() => useUsers())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const newUser = {
        id: 'user-2',
        full_name: 'New User',
        email: 'newuser@example.com',
        role: 'restaurant'
      }

      act(() => {
        subscriptionCallback({
          eventType: 'INSERT',
          new: newUser
        })
      })

      await waitFor(() => {
        expect(result.current.users).toContainEqual(newUser)
      })
    })
  })
})
