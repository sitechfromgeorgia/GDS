import { createBrowserClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { z } from 'zod'

// Zod schemas for validation
export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role: z.enum(['restaurant', 'driver', 'admin', 'demo']),
  restaurant_name: z.string().min(1, 'Restaurant name is required').optional(),
  full_name: z.string().min(1, 'Full name is required').optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export type SignInInput = z.infer<typeof signInSchema>
export type SignUpInput = z.infer<typeof signUpSchema>

export class AuthService {
  private supabase = createBrowserClient()

  async signIn(email: string, password: string) {
    // Validate input
    const result = signInSchema.safeParse({ email, password })
    if (!result.success) {
      throw new Error('Invalid input: ' + result.error.message)
    }

    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      throw new Error(error.message)
    }
    
    return { data, error: null }
  }
  
  async signOut() {
    return await this.supabase.auth.signOut()
  }
  
  async getCurrentUser(): Promise<User | null> {
    const { data: { user }, error } = await this.supabase.auth.getUser()
    if (error) {
      console.error('Error getting user:', error)
      return null
    }
    return user
  }

  async getUserRole(userId: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('Error fetching user role:', error)
      return null
    }
    
    return data?.role || null
  }

  async getUserProfile(userId: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }

    return data
  }

  async updateProfile(userId: string, updates: any) {
    const { data, error } = await this.supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`)
    }

    return data
  }

  async createUser(userData: SignUpInput) {
    const result = signUpSchema.safeParse(userData)
    if (!result.success) {
      throw new Error('Invalid input: ' + result.error.message)
    }

    const { data, error } = await this.supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          role: userData.role,
          full_name: userData.full_name,
          restaurant_name: userData.restaurant_name
        }
      }
    })

    if (error) {
      throw new Error(error.message)
    }

    return { data, error: null }
  }

  async resetPassword(email: string) {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })

    if (error) {
      throw new Error(error.message)
    }

    return { success: true }
  }

  async updatePassword(newPassword: string) {
    const { error } = await this.supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      throw new Error(error.message)
    }

    return { success: true }
  }

  async checkUserRole(userId: string, requiredRole: string): Promise<boolean> {
    const role = await this.getUserRole(userId)
    return role === requiredRole
  }
}

// Export singleton instance
export const authService = new AuthService()