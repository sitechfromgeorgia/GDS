<<<<<<< HEAD
import { createBrowserClient } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

/**
 * Auth Hook
 *
 * Simplified hook that only reads from the auth store and provides auth methods.
 * Initialization is handled by auth-init.ts singleton service.
 *
 * This prevents the infinite loop issue by removing initialization logic from React lifecycle.
 */

// Create Supabase client instance
const supabase = createBrowserClient()

export function useAuth() {
  // Simply read from store - no initialization logic here
  const user = useAuthStore((state) => state.user)
  const profile = useAuthStore((state) => state.profile)
  const loading = useAuthStore((state) => state.loading)
=======
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore, startSessionMonitoring } from '@/store/authStore'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

export function useAuth() {
  const { user, profile, loading, setUser, setProfile, setLoading } = useAuthStore()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      setLoading(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user || null)

        if (session?.user) {
          // Fetch user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          setProfile(profile)

          // Initialize session info
          const deviceId = localStorage.getItem('deviceId') || crypto.randomUUID()
          localStorage.setItem('deviceId', deviceId)

          useAuthStore.getState().setSessionInfo({
            lastActivity: Date.now(),
            expiresAt: new Date(session.expires_at!).getTime(),
            deviceId
          })

          // Start session monitoring
          startSessionMonitoring()
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
        setUser(null)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user || null)

        if (session?.user) {
          // Fetch user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          setProfile(profile)

          // Update session info
          const deviceId = localStorage.getItem('deviceId') || crypto.randomUUID()
          localStorage.setItem('deviceId', deviceId)

          useAuthStore.getState().setSessionInfo({
            lastActivity: Date.now(),
            expiresAt: new Date(session.expires_at!).getTime(),
            deviceId
          })
        } else {
          setProfile(null)
          useAuthStore.getState().clearSession()
        }

        setLoading(false)
      }
    )

    return () => subscription?.unsubscribe()
  }, [setUser, setProfile, setLoading])
>>>>>>> 4f46816d3369e63516557dedd905a7027f3ba306

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error
    return data
  }

  const signInWithMFA = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    // Check if MFA is required
    if (data.user) {
      const { data: factors } = await supabase.auth.mfa.listFactors()

      if (factors && factors.totp.length > 0) {
        // MFA is enrolled, will need verification
        return { ...data, requiresMFA: true }
      }
    }

    return data
  }

  const verifyMFA = async (factorId: string, code: string) => {
    // First challenge the factor
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId
    })

    if (challengeError) throw challengeError

    // Then verify with the challenge
    const { data, error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code
    })

    if (error) throw error
    return data
  }

  const setupMFA = async () => {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp'
    })

    if (error) throw error
    return data
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })

    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    useAuthStore.getState().signOut()
  }

  const isAdmin = () => {
    const { profile } = useAuthStore.getState()
    return profile?.role === 'admin'
  }
<<<<<<< HEAD

=======
>>>>>>> 4f46816d3369e63516557dedd905a7027f3ba306
  const isRestaurant = () => {
    const { profile } = useAuthStore.getState()
    return profile?.role === 'restaurant'
  }
<<<<<<< HEAD

=======
>>>>>>> 4f46816d3369e63516557dedd905a7027f3ba306
  const isDriver = () => {
    const { profile } = useAuthStore.getState()
    return profile?.role === 'driver'
  }

  return {
    user,
    profile,
    loading,
    signIn,
    signInWithMFA,
    verifyMFA,
    setupMFA,
    resetPassword,
    signOut,
    isAdmin,
    isRestaurant,
    isDriver,
    isAuthenticated: !!user
  }
<<<<<<< HEAD
}
=======
}
>>>>>>> 4f46816d3369e63516557dedd905a7027f3ba306
