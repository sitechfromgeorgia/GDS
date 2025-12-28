import { logger } from '@/lib/logger'
import { createBrowserClient } from '@/lib/supabase'
import { useAuthStore, startSessionMonitoring } from '@/store/authStore'
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'

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

  async initialize(initialUser?: User | null): Promise<void> {
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
      logger.info('AuthInitializer: Starting initialization')

      let user = initialUser

      if (!user) {
        // Check for bypass cookie
        if (typeof document !== 'undefined') {
          const match = document.cookie.match(/TEST_AUTH_BYPASS=([^;]+)/)
          if (match && match[1]) {
            const role = match[1] as string
            if (['restaurant', 'driver', 'admin'].includes(role)) {
              logger.info('AuthInitializer: Bypassing auth due to cookie:', { role })
              user = {
                id: `test-${role}-id`,
                email: `test-${role}-browser@example.com`,
                role: 'authenticated',
                app_metadata: { provider: 'email' },
                user_metadata: { role: role },
                aud: 'authenticated',
                created_at: new Date().toISOString(),
              } as any
            }
          }
        }

        if (!user) {
          // Get initial user with timeout protection
          const userPromise = this.supabase.auth.getUser()
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('User fetch timeout')), 5000)
          )

          const result = await Promise.race([userPromise, timeoutPromise])
          const {
            data: { user: fetchedUser },
            error: userError,
          } = result as Awaited<typeof userPromise>

          if (userError) {
            // It's normal to not have a user session on initial load
            logger.info(`User fetch result: ${userError.message}`)
          }
          user = fetchedUser
        }
      }

      logger.info(user ? 'User found: Logged in' : 'No user found')
      setUser(user || null)

      if (user) {
        await this.setupUserSession(user)
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

  private async setupUserSession(user: User): Promise<void> {
    const { setProfile, setSessionInfo } = useAuthStore.getState()

    try {
      // Check for bypass user
      if (user.id.startsWith('test-') && user.id.endsWith('-id')) {
        const role = user.user_metadata?.role
        logger.info('AuthInitializer: Setting up mock profile for role:', { role })
        setProfile({
          id: user.id,
          role: role,
          full_name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
          email: user.email || null,
          restaurant_name: null,
          phone: null,
          address: null,
          google_maps_link: null,
          base_salary: 0,
          per_delivery_rate: 0,
          bonus_amount: 0,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        setSessionInfo({
          lastActivity: Date.now(),
          expiresAt: Date.now() + 3600 * 1000,
          deviceId: 'mock-device-id',
        })
        return
      }

      logger.info('Fetching user profile...')
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        logger.error('Profile fetch error:', profileError)
        return
      }

      setProfile(profile)

      // Initialize session info
      const deviceId = localStorage.getItem('deviceId') || crypto.randomUUID()
      localStorage.setItem('deviceId', deviceId)

      // Get current session for expiration info
      const {
        data: { session },
      } = await this.supabase.auth.getSession()

      setSessionInfo({
        lastActivity: Date.now(),
        expiresAt: (session?.expires_at ?? 0) * 1000, // Convert Unix seconds to milliseconds
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

        if (session?.user) {
          setUser(session.user)
          await this.setupUserSession(session.user)
        } else {
          // Check for test bypass cookie before clearing
          let bypassUser = null
          if (typeof document !== 'undefined') {
            const match = document.cookie.match(/TEST_AUTH_BYPASS=([^;]+)/)
            if (match && match[1]) {
              const role = match[1] as string
              if (['restaurant', 'driver', 'admin'].includes(role)) {
                logger.info('AuthListener: Bypassing clear due to cookie:', { role })
                bypassUser = {
                  id: `test-${role}-id`,
                  email: `test-${role}-browser@example.com`,
                  role: 'authenticated',
                  app_metadata: { provider: 'email' },
                  user_metadata: { role: role },
                  aud: 'authenticated',
                  created_at: new Date().toISOString(),
                } as any
              }
            }
          }

          if (bypassUser) {
            setUser(bypassUser)
            // We also need to setup session (profile etc) for the bypass user
            // But setupUserSession handles specific 'test-' logic, so it's safe to call
            await this.setupUserSession(bypassUser)
          } else {
            setUser(null)
            setProfile(null)
            useAuthStore.getState().clearSession()
          }
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
export async function ensureAuthInitialized(initialUser?: User | null): Promise<void> {
  return authInitializer.initialize(initialUser)
}
