import { logger } from '@/lib/logger'
import { create } from 'zustand'
import { User } from '@supabase/supabase-js'
import { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

interface SessionInfo {
  lastActivity: number
  expiresAt: number
  deviceId: string
}

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  sessionInfo: SessionInfo | null
  mfaRequired: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  setSessionInfo: (info: SessionInfo | null) => void
  setMFARequired: (required: boolean) => void
  updateLastActivity: () => void
  signOut: () => void
  clearSession: () => void
}

const SESSION_TIMEOUT = 5 * 60 * 60 * 1000 // 5 hours (matches JWT expiry)
const WARNING_TIME = 10 * 60 * 1000 // 10 minutes before timeout

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: false, // Changed from true - AuthProvider handles initialization loading state
  sessionInfo: null,
  mfaRequired: false,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  setSessionInfo: (sessionInfo) => set({ sessionInfo }),
  setMFARequired: (mfaRequired) => set({ mfaRequired }),
  updateLastActivity: () => {
    const { sessionInfo } = get()
    if (sessionInfo) {
      set({
        sessionInfo: {
          ...sessionInfo,
          lastActivity: Date.now(),
        },
      })
    }
  },
  signOut: () =>
    set({
      user: null,
      profile: null,
      loading: false,
      sessionInfo: null,
      mfaRequired: false,
    }),
  clearSession: () =>
    set({
      sessionInfo: null,
      mfaRequired: false,
    }),
}))

// Session monitoring
export const startSessionMonitoring = () => {
  const checkSession = () => {
    const { sessionInfo, signOut, updateLastActivity } = useAuthStore.getState()

    if (!sessionInfo) return

    const now = Date.now()
    const timeSinceActivity = now - sessionInfo.lastActivity
    const timeUntilExpiry = sessionInfo.expiresAt - now

    // Auto sign out if session expired
    if (timeUntilExpiry <= 0) {
      logger.info('Session expired, signing out')
      signOut()
      return
    }

    // Update activity if user is active
    if (timeSinceActivity < SESSION_TIMEOUT / 2) {
      updateLastActivity()
    }

    // Warn user about impending timeout
    if (timeUntilExpiry <= WARNING_TIME) {
      logger.info('Session will expire soon')
      // Could dispatch a notification here
    }
  }

  // Check session every minute
  const interval = setInterval(checkSession, 60000)

  // Listen for user activity
  const handleActivity = () => {
    useAuthStore.getState().updateLastActivity()
  }

  // Add event listeners for user activity
  if (typeof window !== 'undefined') {
    window.addEventListener('mousedown', handleActivity)
    window.addEventListener('keydown', handleActivity)
    window.addEventListener('scroll', handleActivity)
    window.addEventListener('touchstart', handleActivity)
  }

  return () => {
    clearInterval(interval)
    if (typeof window !== 'undefined') {
      window.removeEventListener('mousedown', handleActivity)
      window.removeEventListener('keydown', handleActivity)
      window.removeEventListener('scroll', handleActivity)
      window.removeEventListener('touchstart', handleActivity)
    }
  }
}
