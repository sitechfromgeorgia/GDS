import { logger } from '@/lib/logger'

/**
 * Error handling utilities for Supabase connection diagnostics
 */

/**
 * Enhanced error interface for Supabase-specific errors
 */
export interface SupabaseError extends Error {
  code?: string
  status?: number
  details?: string
  hint?: string
}

/**
 * Categorize errors by type for better handling
 */
export type ErrorCategory =
  | 'network'
  | 'authentication'
  | 'authorization'
  | 'validation'
  | 'cors'
  | 'timeout'
  | 'database'
  | 'realtime'
  | 'unknown'

export function categorizeError(error: Error | any): ErrorCategory {
  const message = error.message?.toLowerCase() || ''
  const code = error.code?.toLowerCase() || ''

  // CORS errors
  if (message.includes('cors') || message.includes('cross-origin')) {
    return 'cors'
  }

  // Network errors
  if (message.includes('fetch') || message.includes('network') || message.includes('connection')) {
    return 'network'
  }

  // Authentication errors
  if (code === 'invalid_credentials' || code === 'unauthorized' || message.includes('auth')) {
    return 'authentication'
  }

  // Authorization errors
  if (code === '42501' || message.includes('permission') || message.includes('forbidden')) {
    return 'authorization'
  }

  // Database errors
  if (message.includes('database') || code?.startsWith('pgrst') || message.includes('postgresql')) {
    return 'database'
  }

  // Timeout errors
  if (message.includes('timeout') || code === 'PGRST301') {
    return 'timeout'
  }

  // Real-time errors
  if (message.includes('websocket') || message.includes('realtime')) {
    return 'realtime'
  }

  // Validation errors
  if (code?.startsWith('22') || message.includes('validation') || message.includes('invalid')) {
    return 'validation'
  }

  return 'unknown'
}

/**
 * Get user-friendly error messages for different error types
 */
export function getUserFriendlyMessage(error: Error | any): string {
  const category = categorizeError(error)

  switch (category) {
    case 'cors':
      return 'Connection blocked by security policy. Please contact support or try a different browser.'

    case 'network':
      return 'Network error. Please check your internet connection and try again.'

    case 'authentication':
      return 'Authentication failed. Please check your credentials and try again.'

    case 'authorization':
      return 'You do not have permission to access this resource.'

    case 'timeout':
      return 'The server is taking longer than expected. Please wait and try again.'

    case 'database':
      return 'Database error. Our team has been notified and is working on a fix.'

    case 'realtime':
      return 'Live updates are temporarily unavailable. Refresh to see latest changes.'

    case 'validation':
      return 'The data you provided is invalid. Please check your input and try again.'

    default:
      return error.message || 'An unexpected error occurred. Please try again.'
  }
}

/**
 * Get technical error details for debugging
 */
export function getErrorDetails(error: Error | any): Record<string, unknown> {
  return {
    message: error.message,
    code: error.code,
    status: error.status,
    details: error.details,
    hint: error.hint,
    category: categorizeError(error),
    timestamp: new Date().toISOString(),
    stack: error.stack,
  }
}

/**
 * Main error handler for Supabase operations
 */
export function handleSupabaseError(
  error: Error | any,
  context: string
): {
  userMessage: string
  technicalDetails: Record<string, unknown>
  shouldRetry: boolean
  shouldLog: boolean
} {
  const category = categorizeError(error)
  const userMessage = getUserFriendlyMessage(error)
  const technicalDetails = getErrorDetails(error)

  // Determine if error should be retried
  let shouldRetry = false
  switch (category) {
    case 'network':
    case 'timeout':
    case 'database':
    case 'realtime':
      shouldRetry = true
      break
    case 'cors':
    case 'authentication':
    case 'authorization':
    case 'validation':
      shouldRetry = false
      break
    default:
      shouldRetry = true // Retry unknown errors by default
  }

  // Determine if error should be logged (always log for production)
  const shouldLog = process.env.NODE_ENV === 'production' || category !== 'validation'

  // Log the error with context
  if (shouldLog) {
    logger.error(`[SUPABASE ERROR] ${context}:`, technicalDetails)
  }

  return {
    userMessage,
    technicalDetails,
    shouldRetry,
    shouldLog,
  }
}

/**
 * Safe error handler that never throws
 */
export function safeHandleError(
  error: Error | any,
  context: string
): {
  userMessage: string
  shouldRetry: boolean
} {
  try {
    const result = handleSupabaseError(error, context)
    return {
      userMessage: result.userMessage,
      shouldRetry: result.shouldRetry,
    }
  } catch (handlerError) {
    // Fallback error handling
    logger.error('Error handler failed:', handlerError)
    return {
      userMessage: 'An unexpected error occurred. Please try again.',
      shouldRetry: true,
    }
  }
}

/**
 * Wrapper for async operations with automatic error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string
): Promise<{ success: true; data: T } | { success: false; error: string; shouldRetry: boolean }> {
  try {
    const data = await operation()
    return { success: true, data }
  } catch (error) {
    const { userMessage, shouldRetry } = safeHandleError(error, context)
    return { success: false, error: userMessage, shouldRetry }
  }
}
