'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { LoginForm } from '@/components/auth/LoginForm'
import { Loader2 } from 'lucide-react'
import { ensureAuthInitialized } from '@/lib/auth-init'

interface AuthContextType {
  user: any
  profile: any
  loading: boolean
  signOut: () => Promise<void>
  isAdmin: () => boolean
  isRestaurant: () => boolean
  isDriver: () => boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

interface AuthProviderProps {
  children?: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const pathname = usePathname()
  const [authReady, setAuthReady] = useState(false)
  const [isClient, setIsClient] = useState(false)

  const { user, profile, loading, signOut, isAdmin, isRestaurant, isDriver, isAuthenticated } =
    useAuth()

  // Mark when we're on client side (after hydration)
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Initialize auth once on mount (client-side only)
  useEffect(() => {
    if (!isClient) return // Skip on server

    let mounted = true
    let timeoutId: NodeJS.Timeout

    // Set a hard timeout at React level (10 seconds)
    timeoutId = setTimeout(() => {
      if (mounted && !authReady) {
        console.warn('Auth initialization timeout - forcing ready state')
        setAuthReady(true)
      }
    }, 10000)

    ensureAuthInitialized()
      .then(() => {
        clearTimeout(timeoutId)
        if (mounted) {
          setAuthReady(true)
        }
      })
      .catch((error) => {
        clearTimeout(timeoutId)
        // Even if initialization fails, set authReady to true
        // to prevent infinite loading. The loading state from
        // useAuth() will be false, allowing the app to render.
        console.error('Auth initialization error:', error)
        if (mounted) {
          setAuthReady(true)
        }
      })

    return () => {
      mounted = false
      clearTimeout(timeoutId)
    }
  }, [isClient, authReady]) // Run when client-side is ready

  // Allow public access to certain routes
  const publicRoutes = ['/', '/welcome', '/demo', '/landing', '/login']
  const isDemoRoute = pathname.startsWith('/dashboard/demo')
  const isCatalogRoute = pathname.startsWith('/catalog')
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/api') || isDemoRoute || isCatalogRoute

  // Show loading spinner during auth initialization - but NOT for public routes
  // This prevents hydration issues and allows public pages to render immediately
  if (!authReady && !isPublicRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600 font-medium">მიმდინარეობს ავტორიზაცია...</p>
          <p className="text-xs text-gray-400 mt-2">
            თუ ეს გვერდი არ იტვირთება, გთხოვთ განაახლოთ გვერდი
          </p>
        </div>
      </div>
    )
  }

  // For non-public routes, require authentication
  if (!isPublicRoute && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full">
          <LoginForm />
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signOut,
        isAdmin,
        isRestaurant,
        isDriver,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider')
  }
  return context
}
