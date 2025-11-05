// frontend/src/lib/testConnection.ts
// Test connection utility for Supabase
import { createBrowserClient } from '@/lib/supabase'

// Create Supabase client instance
const supabase = createBrowserClient()

export async function testConnection() {
  try {
    const { data, error } = await supabase.from('profiles').select('id').limit(1)

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return { success: true, data: data || null }
  } catch (error) {
    return { success: false, error }
  }
}

// Export the missing functions that are being imported
export async function testSupabaseConnection() {
  return testConnection()
}

export async function testAuth() {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      return { success: false, error }
    }

    return { success: true, session }
  } catch (error) {
    return { success: false, error }
  }
}
