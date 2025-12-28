// Georgian Distribution System Query Error Handling & Loading States
// Advanced error handling and loading state management for Georgian Distribution System

import { logger } from '@/lib/logger'
import { useState, useCallback } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import { useQueryClient, UseMutationResult } from '@tanstack/react-query'
import { GDSQueryUtils } from './client'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle, WifiOff, RefreshCw } from 'lucide-react'

// Georgian-specific error types
export interface GDSError {
  code?: string
  message: string
  details?: string
  network?: boolean
  recoverable?: boolean
  retryable?: boolean
  georgianMessage?: string
  category?: GDSErrorCategory
}

// Error categories for Georgian Distribution System
export type GDSErrorCategory =
  | 'network'
  | 'auth'
  | 'permission'
  | 'validation'
  | 'server'
  | 'not_found'
  | 'conflict'
  | 'unknown'

// Georgian Distribution System error categories and messages
export const GDS_ERROR_CATEGORIES = {
  network: {
    category: 'network' as GDSErrorCategory,
    georgianMessage: 'ქსელის შეცდომა',
    englishMessage: 'Network error',
    recoverable: true,
    retryable: true,
  },
  auth: {
    category: 'auth' as GDSErrorCategory,
    georgianMessage: 'ავტორიზაციის შეცდომა',
    englishMessage: 'Authentication error',
    recoverable: true,
    retryable: false,
  },
  permission: {
    category: 'permission' as GDSErrorCategory,
    georgianMessage: 'წვდომის შეზღუდვა',
    englishMessage: 'Access denied',
    recoverable: false,
    retryable: false,
  },
  validation: {
    category: 'validation' as GDSErrorCategory,
    georgianMessage: 'მონაცემების ვალიდაცია',
    englishMessage: 'Validation error',
    recoverable: true,
    retryable: false,
  },
  server: {
    category: 'server' as GDSErrorCategory,
    georgianMessage: 'სერვერის შეცდომა',
    englishMessage: 'Server error',
    recoverable: true,
    retryable: true,
  },
  not_found: {
    category: 'not_found' as GDSErrorCategory,
    georgianMessage: 'მონაცემები ვერ მოიძებნა',
    englishMessage: 'Data not found',
    recoverable: false,
    retryable: true,
  },
  conflict: {
    category: 'conflict' as GDSErrorCategory,
    georgianMessage: 'კონფლიქტი',
    englishMessage: 'Conflict',
    recoverable: true,
    retryable: false,
  },
  unknown: {
    category: 'unknown' as GDSErrorCategory,
    georgianMessage: 'გაურკვეველი შეცდომა',
    englishMessage: 'Unknown error',
    recoverable: false,
    retryable: true,
  },
}

// Error classification function for Georgian Distribution System
export function classifyGDSError(error: any): GDSError {
  // Network errors
  if (
    error?.message?.includes('fetch') ||
    error?.name === 'NetworkError' ||
    !navigator.onLine ||
    error?.code === 'NETWORK_ERROR'
  ) {
    return {
      message: error?.message || 'Network error',
      georgianMessage: 'ქსელის შეცდომა',
      recoverable: true,
      retryable: true,
      category: 'network',
    }
  }

  // HTTP status codes
  if (error?.status) {
    const status = error.status as number

    switch (status) {
      case 401:
      case 403:
        return {
          message: error?.message || 'Authentication error',
          georgianMessage: 'ავტორიზაციის შეცდომა',
          recoverable: true,
          retryable: false,
          category: 'auth',
        }
      case 404:
        return {
          message: error?.message || 'Data not found',
          georgianMessage: 'მონაცემები ვერ მოიძებნა',
          recoverable: false,
          retryable: true,
          category: 'not_found',
        }
      case 409:
        return {
          message: error?.message || 'Conflict',
          georgianMessage: 'კონფლიქტი',
          recoverable: true,
          retryable: false,
          category: 'conflict',
        }
      case 422:
        return {
          message: error?.message || 'Validation error',
          georgianMessage: 'მონაცემების ვალიდაცია',
          recoverable: true,
          retryable: false,
          category: 'validation',
        }
      case 500:
      case 502:
      case 503:
      case 504:
        return {
          message: error?.message || 'Server error',
          georgianMessage: 'სერვერის შეცდომა',
          recoverable: true,
          retryable: true,
          category: 'server',
        }
    }
  }

  // Supabase specific errors
  if (error?.code) {
    switch (error.code) {
      case 'PGRST116': // No rows found
        return {
          message: error?.message || 'Data not found',
          georgianMessage: 'მონაცემები ვერ მოიძებნა',
          recoverable: false,
          retryable: true,
          category: 'not_found',
          code: error.code,
        }
      case '42501': // Insufficient privilege
        return {
          message: error?.message || 'Access denied',
          georgianMessage: 'წვდომის შეზღუდვა',
          recoverable: false,
          retryable: false,
          category: 'permission',
          code: error.code,
        }
      case '23505': // Unique constraint violation
        return {
          message: error?.message || 'Conflict',
          georgianMessage: 'კონფლიქტი',
          recoverable: true,
          retryable: false,
          category: 'conflict',
          code: error.code,
        }
    }
  }

  return {
    message: error?.message || 'Unknown error',
    georgianMessage: 'გაურკვეველი შეცდომა',
    recoverable: false,
    retryable: true,
    category: 'unknown',
  }
}

// Georgian Distribution System Error Boundary Component
interface GDSErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: GDSError; retry: () => void }>
  onError?: (error: GDSError) => void
}

export function GDSErrorBoundary({
  children,
  fallback: Fallback = DefaultErrorFallback,
  onError,
}: GDSErrorBoundaryProps) {
  const [error, setError] = useState<GDSError | null>(null)
  const [retryKey, setRetryKey] = useState(0)

  const handleRetry = useCallback(() => {
    setError(null)
    setRetryKey((prev) => prev + 1)
  }, [])

  if (error) {
    return <Fallback error={error} retry={handleRetry} />
  }

  return (
    <ErrorCapture
      onError={(err) => {
        const classifiedError = classifyGDSError(err)
        setError(classifiedError)
        onError?.(classifiedError)
      }}
    >
      <div key={retryKey}>{children}</div>
    </ErrorCapture>
  )
}

// Error capture component
function ErrorCapture({
  children,
  onError,
}: {
  children: React.ReactNode
  onError: (error: any) => void
}) {
  // This would typically capture React errors
  return <>{children}</>
}

// Default error fallback component with Georgian text
function DefaultErrorFallback({ error, retry }: { error: GDSError; retry: () => void }) {
  return (
    <Alert className="mb-4" variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex flex-col gap-2">
        <span>{error.georgianMessage || error.message}</span>
        {error.details && <span className="text-sm opacity-80">{error.details}</span>}
        {error.retryable && (
          <Button onClick={retry} variant="outline" size="sm" className="mt-2">
            <RefreshCw className="h-4 w-4 mr-2" />
            ხელახლა ცდა
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

// Georgian Distribution System Loading State Component
interface GDSLoadingStateProps {
  type?: 'spinner' | 'skeleton' | 'dots' | 'pulse'
  size?: 'sm' | 'md' | 'lg'
  text?: string
  georgianText?: string
  showText?: boolean
  className?: string
}

export function GDSLoadingState({
  type = 'spinner',
  size = 'md',
  text,
  georgianText,
  showText = true,
  className = '',
}: GDSLoadingStateProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  }

  const loadingText = georgianText || text || 'იტვირთება...'

  switch (type) {
    case 'spinner':
      return (
        <div className={`flex items-center justify-center gap-2 ${className}`}>
          <Loader2 className={`${sizeClasses[size]} animate-spin`} />
          {showText && <span className={textSizeClasses[size]}>{loadingText}</span>}
        </div>
      )

    case 'skeleton':
      return (
        <div className={`animate-pulse ${className}`}>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
        </div>
      )

    case 'dots':
      return (
        <div className={`flex items-center justify-center gap-1 ${className}`}>
          <div
            className={`${sizeClasses[size]} bg-gray-400 rounded-full animate-bounce`}
            style={{ animationDelay: '0ms' }}
          />
          <div
            className={`${sizeClasses[size]} bg-gray-400 rounded-full animate-bounce`}
            style={{ animationDelay: '150ms' }}
          />
          <div
            className={`${sizeClasses[size]} bg-gray-400 rounded-full animate-bounce`}
            style={{ animationDelay: '300ms' }}
          />
          {showText && <span className={`${textSizeClasses[size]} ml-2`}>{loadingText}</span>}
        </div>
      )

    case 'pulse':
      return (
        <div className={`flex items-center justify-center gap-2 ${className}`}>
          <div className={`${sizeClasses[size]} bg-gray-300 rounded-full animate-pulse`} />
          {showText && <span className={textSizeClasses[size]}>{loadingText}</span>}
        </div>
      )

    default:
      return null
  }
}

// Georgian Distribution System Network Status Component
export function GDSNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showOfflineMessage, setShowOfflineMessage] = useState(false)

  useState(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowOfflineMessage(false)
    }
    const handleOffline = () => {
      setIsOnline(false)
      setShowOfflineMessage(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  })

  if (!showOfflineMessage) return null

  return (
    <Alert variant="destructive" className="mb-4">
      <WifiOff className="h-4 w-4" />
      <AlertDescription>
        თქვენ არ ხართ ინტერნეტთან დაკავშირებული. ზოგიერთი ფუნქცია შეზღუდული იქნება.
      </AlertDescription>
    </Alert>
  )
}

// Georgian Distribution System Query Error Handler Hook
export function useGDSErrorHandler() {
  const queryClient = useQueryClient()

  const handleError = useCallback(
    (error: any, context?: string) => {
      const classifiedError = classifyGDSError(error)

      // Log error for monitoring
      logger.error(`[GDS Error] ${context || 'Unknown context'}:`, classifiedError)

      // Handle network errors specifically for Georgian users
      if (classifiedError.category === 'network') {
        // Could show offline notification
        logger.warn('[GDS] Network issue detected - user may be offline')
      }

      // Handle authentication errors
      if (classifiedError.category === 'auth') {
        // Could redirect to login
        logger.warn('[GDS] Authentication error - user may need to login')
      }

      // Handle permission errors
      if (classifiedError.category === 'permission') {
        // Could show access denied message
        logger.warn('[GDS] Permission denied - user lacks access')
      }

      return classifiedError
    },
    [queryClient]
  )

  return { handleError }
}

// Georgian Distribution System Loading State Hook
export function useGDSLoadingState() {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingText, setLoadingText] = useState<string>('')

  const startLoading = useCallback((text?: string) => {
    setIsLoading(true)
    setLoadingText(text || 'იტვირთება...')
  }, [])

  const stopLoading = useCallback(() => {
    setIsLoading(false)
    setLoadingText('')
  }, [])

  return {
    isLoading,
    loadingText,
    startLoading,
    stopLoading,
    LoadingComponent: () => (isLoading ? <GDSLoadingState georgianText={loadingText} /> : null),
  }
}

// Georgian Distribution System Query Status Component
interface GDSQueryStatusProps {
  query: UseQueryResult
  loadingComponent?: React.ComponentType
  errorComponent?: React.ComponentType<{ error: GDSError }>
  emptyComponent?: React.ComponentType
  children: React.ReactNode
}

export function GDSQueryStatus({
  query,
  loadingComponent: LoadingComponent = () => <GDSLoadingState georgianText="იტვირთება..." />,
  errorComponent: ErrorComponent = ({ error }) => (
    <DefaultErrorFallback error={error} retry={() => query.refetch()} />
  ),
  emptyComponent: EmptyComponent = () => (
    <div className="text-center text-gray-500 py-8">მონაცემები არ არის</div>
  ),
  children,
}: GDSQueryStatusProps) {
  if (query.isLoading) {
    return <LoadingComponent />
  }

  if (query.isError) {
    const error = classifyGDSError(query.error)
    return <ErrorComponent error={error} />
  }

  if (!query.data || (Array.isArray(query.data) && query.data.length === 0)) {
    return <EmptyComponent />
  }

  return <>{children}</>
}

export default {
  classifyGDSError,
  GDSErrorBoundary,
  GDSLoadingState,
  GDSNetworkStatus,
  useGDSErrorHandler,
  useGDSLoadingState,
  GDSQueryStatus,
  GDS_ERROR_CATEGORIES,
}
