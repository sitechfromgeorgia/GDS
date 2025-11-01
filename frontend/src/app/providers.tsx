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