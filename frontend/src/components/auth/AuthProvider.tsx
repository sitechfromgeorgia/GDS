'use client'

<<<<<<< HEAD
import { createContext, useContext, useEffect, useState } from 'react'
=======
import { createContext, useContext, ReactNode } from 'react'
>>>>>>> 4f46816d3369e63516557dedd905a7027f3ba306
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { LoginForm } from '@/components/auth/LoginForm'
import { Loader2 } from 'lucide-react'
<<<<<<< HEAD
import { ensureAuthInitialized } from '@/lib/auth-init'
=======
>>>>>>> 4f46816d3369e63516557dedd905a7027f3ba306

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
<<<<<<< HEAD
  const [authReady, setAuthReady] = useState(false)

=======
>>>>>>> 4f46816d3369e63516557dedd905a7027f3ba306
  const {
    user,
    profile,
    loading,
    signOut,
    isAdmin,
    isRestaurant,
    isDriver,
    isAuthenticated
  } = useAuth()

<<<<<<< HEAD
  // Initialize auth once on mount
  useEffect(() => {
    let mounted = true

    ensureAuthInitialized().then(() => {
      if (mounted) {
        setAuthReady(true)
      }
    })

    return () => {
      mounted = false
    }
  }, []) // Intentionally empty - runs once per AuthProvider instance

=======
>>>>>>> 4f46816d3369e63516557dedd905a7027f3ba306
  // Allow public access to certain routes
  const publicRoutes = ['/', '/welcome', '/demo', '/landing', '/login']
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/api')

<<<<<<< HEAD
  // Show loading spinner during auth initialization
  if (!authReady || loading) {
=======
  // Show loading spinner during auth check
  if (loading) {
>>>>>>> 4f46816d3369e63516557dedd905a7027f3ba306
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">მიმდინარეობს ავტორიზაცია...</p>
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
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signOut,
      isAdmin,
      isRestaurant,
      isDriver,
      isAuthenticated
    }}>
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