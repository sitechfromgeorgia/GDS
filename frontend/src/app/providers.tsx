<<<<<<< HEAD
// Georgian Distribution System Providers Setup
// Unified providers configuration for Georgian Distribution System

'use client'

import { QueryProvider } from '@/components/providers/QueryProvider'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { Toaster } from '@/components/ui/toaster'
import { GDSNetworkStatus, GDSErrorBoundary } from '@/lib/query/error-handling'
import { ThemeProvider } from 'next-themes'

// Georgian Distribution System Providers wrapper
export function Providers({ 
  children,
  enableNetworkStatus = true,
  enableErrorBoundary = true
}: { 
  children: React.ReactNode
  enableNetworkStatus?: boolean
  enableErrorBoundary?: boolean
}) {
  const providers = (
    <QueryProvider>
      <AuthProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </AuthProvider>
    </QueryProvider>
  )

  // Wrap with error boundary for Georgian Distribution System specific error handling
  if (enableErrorBoundary) {
    return (
      <GDSErrorBoundary>
        {providers}
      </GDSErrorBoundary>
    )
  }

  // Wrap with network status monitoring for Georgian infrastructure
  if (enableNetworkStatus) {
    return (
      <>
        {enableErrorBoundary && <GDSNetworkStatus />}
        {providers}
      </>
    )
  }

  return providers
}

// Georgian Distribution System Provider Configuration
export interface GDSProviderConfig {
  // Provider settings
  query: {
    enablePersistence: boolean
    enableDevtools: boolean
    networkMode: 'good' | 'poor' | 'offline'
  }
  auth: {
    enableAutoRefresh: boolean
    sessionTimeout: number // in minutes
  }
  error: {
    enableBoundary: boolean
    enableLogging: boolean
    enableNotifications: boolean
  }
  network: {
    enableStatusMonitoring: boolean
    retryStrategies: boolean
  }
}

// Default Georgian Distribution System provider configuration
export const GDS_PROVIDER_CONFIG: GDSProviderConfig = {
  query: {
    enablePersistence: process.env.NODE_ENV === 'production',
    enableDevtools: process.env.NODE_ENV === 'development',
    networkMode: 'good' // Will be detected automatically
  },
  auth: {
    enableAutoRefresh: true,
    sessionTimeout: 30 // 30 minutes
  },
  error: {
    enableBoundary: true,
    enableLogging: true,
    enableNotifications: true
  },
  network: {
    enableStatusMonitoring: true,
    retryStrategies: true
  }
}

// Georgian Distribution System Provider Factory
export function createGDSProviders(
  config: Partial<GDSProviderConfig> = {}
) {
  const finalConfig = { ...GDS_PROVIDER_CONFIG, ...config }
  
  return function GDSProviders({ 
    children 
  }: { 
    children: React.ReactNode 
  }) {
    return (
      <Providers
        enableNetworkStatus={finalConfig.network.enableStatusMonitoring}
        enableErrorBoundary={finalConfig.error.enableBoundary}
      >
        {children}
      </Providers>
    )
  }
}

// Export default providers for Georgian Distribution System
export default Providers
=======
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'

// Define error types for better type safety
interface ApiError {
  status?: number
  message?: string
  name?: string
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes - longer cache
        refetchOnWindowFocus: false,
        refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
        retry: (failureCount, error: Error | ApiError) => {
          // Don't retry on 404s, network errors, or auth errors
          const apiError = error as ApiError
          if (error && (
            apiError.status === 404 || 
            apiError.status === 401 || 
            apiError.status === 403 ||
            apiError.name === '404' ||
            error.message?.includes('Network request failed') ||
            error.message?.includes('Failed to fetch') ||
            error.message?.includes('404')
          )) {
            return false
          }
          // Retry other errors with exponential backoff
          return failureCount < 2 // Reduced from 3 to 2 for faster failure
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        retry: (failureCount, error: Error | ApiError) => {
          // Only retry mutations on temporary failures
          const apiError = error as ApiError
          if (error && (
            apiError.status === 503 || 
            apiError.status === 502 ||
            apiError.name === '503' ||
            apiError.name === '502' ||
            error.message?.includes('Network error') ||
            error.message?.includes('503') ||
            error.message?.includes('502')
          )) {
            return failureCount < 1 // Only 1 retry for mutations
          }
          return false
        }
      }
    },
  }))

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
>>>>>>> 4f46816d3369e63516557dedd905a7027f3ba306
