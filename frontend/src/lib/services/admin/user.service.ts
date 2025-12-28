import { createBrowserClient } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'
import type { User, UserFormData, FilterParams } from '@/types/admin'

export class UserService {
  private supabase = createBrowserClient()

  async getUsers(filters?: FilterParams): Promise<User[]> {
    let query = this.supabase.from('profiles').select('*').order('created_at', { ascending: false })

    if (filters) {
      if (filters.search) {
        query = query.or(
          `full_name.ilike.%${filters.search}%,restaurant_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`
        )
      }
      if (filters.role && filters.role !== 'all') {
        query = query.eq('role', filters.role)
      }
      if (filters.status && filters.status !== 'all') {
        query = query.eq('is_active', filters.status === 'active')
      }
    }

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching users:', error)
      throw error
    }

    return (data as User[]) || []
  }

  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await this.supabase.from('profiles').select('*').eq('id', id).single()

    if (error) {
      logger.error('Error fetching user:', error)
      return null
    }

    return data as User
  }

  async updateUser(id: string, data: Partial<UserFormData>): Promise<User | null> {
    // Remove email and password from profile update as they belong to auth
    const { email, password, ...profileData } = data

    const { data: updatedUser, error } = await this.supabase
      .from('profiles')
      .update(profileData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('Error updating user:', error)
      throw error
    }

    return updatedUser as User
  }

  async toggleUserStatus(id: string, isActive: boolean): Promise<boolean> {
    const { error } = await this.supabase
      .from('profiles')
      .update({ is_active: isActive })
      .eq('id', id)

    if (error) {
      logger.error('Error toggling user status:', error)
      throw error
    }

    return true
  }

  async deleteUser(id: string): Promise<boolean> {
    // Note: This only deletes the profile. Deleting the auth user requires server-side admin client.
    // We'll implement a server action for full deletion later.
    const { error } = await this.supabase.from('profiles').delete().eq('id', id)

    if (error) {
      logger.error('Error deleting user profile:', error)
      throw error
    }

    return true
  }
}

export const userService = new UserService()
