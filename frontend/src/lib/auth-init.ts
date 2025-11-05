import { logger } from '@/lib/logger'
import { createBrowserClient } from '@/lib/supabase'
import { useAuthStore, startSessionMonitoring } from '@/store/authStore'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

/**
 * Auth Initialization Service
 *
 * Singleton pattern to ensure auth initialization happens exactly once,
 * regardless of React component mounting/remounting behavior.
 *
 * This solves the infinite loop issue caused by:
 * 1. React Strict Mode double-mounting components
 * 2. Multiple useAuth() calls throughout the app
 * 3. Global flags that prevent second initialization but leave loading state stuck
 */
class AuthInitializer {
  private static instance: AuthInitializer
  private initialized = false
  private initializing = false
  private supabase = createBrowserClient()
  private authSubscription: { unsubscribe: () => void } | null = null

  private constructor() {}

  static getInstance(): AuthInitializer {
    if (!AuthInitializer.instance) {
      AuthInitializer.instance = new AuthInitializer()
    }
    return AuthInitializer.instance
  }

  async initialize(): Promise<void> {
    // Prevent multiple simultaneous initializations
    if (this.initialized || this.initializing) {
      logger.info('Auth already initialized or initializing, skipping')
      return Promise.resolve()
    }

    this.initializing = true
    const { setUser, setProfile, setLoading } = useAuthStore.getState()

    try {
      setLoading(true)
      logger.info('Starting auth initialization...')

      // Get initial session with timeout protection
      const sessionPromise = this.supabase.auth.getSession()
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Session timeout')), 5000)
      )

      const result = await Promise.race([sessionPromise, timeoutPromise])
      const {
        data: { session },
        error: sessionError,
      } = result as Awaited<typeof sessionPromise>

      if (sessionError) {
        logger.error('Session fetch error:', sessionError)
      }

      logger.info(session ? 'Session found: User logged in' : 'No session found')
      setUser(session?.user || null)

      if (session?.user) {
        await this.setupUserSession(session)
      }

      // Set up auth state change listener (only once)
      if (!this.authSubscription) {
        this.setupAuthListener()
      }

      this.initialized = true
      logger.info('Auth initialization complete')
    } catch (error) {
      logger.error('Auth initialization error:', error)
      setUser(null)
      setProfile(null)
    } finally {
      setLoading(false)
      this.initializing = false
    }
  }

  private async setupUserSession(session: Session): Promise<void> {
    const { setProfile, setSessionInfo } = useAuthStore.getState()

    try {
      logger.info('Fetching user profile...')
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileError) {
        logger.error('Profile fetch error:', profileError)
        return
      }

      setProfile(profile)

      // Initialize session info
      const deviceId = localStorage.getItem('deviceId') || crypto.randomUUID()
      localStorage.setItem('deviceId', deviceId)

      setSessionInfo({
        lastActivity: Date.now(),
        expiresAt: (session.expires_at ?? 0) * 1000, // Convert Unix seconds to milliseconds
        deviceId,
      })

      // Start session monitoring
      startSessionMonitoring()
    } catch (error) {
      logger.error('Error setting up user session:', error)
    }
  }

  private setupAuthListener(): void {
    const {
      data: { subscription },
    } = this.supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        logger.info('Auth state changed:', { event })
        const { setUser, setProfile, setLoading } = useAuthStore.getState()

        setUser(session?.user || null)

        if (session?.user) {
          await this.setupUserSession(session)
        } else {
          setProfile(null)
          useAuthStore.getState().clearSession()
        }

        setLoading(false)
      }
    )

    this.authSubscription = subscription
  }

  cleanup(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe()
      this.authSubscription = null
    }
    this.initialized = false
    this.initializing = false
  }
}

// Export singleton instance
export const authInitializer = AuthInitializer.getInstance()

/**
 * Helper function to ensure auth is initialized
 * Safe to call multiple times - will only initialize once
 */
export async function ensureAuthInitialized(): Promise<void> {
  return authInitializer.initialize()
}
