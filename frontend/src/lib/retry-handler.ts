import { logger } from '@/lib/logger'

/**
 * Retry handler with exponential backoff for resilient API calls
 */

export interface RetryOptions {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
  retryCondition?: (error: Error | any) => boolean
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'retryCondition'>> & {
  retryCondition: () => boolean
} = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  retryCondition: () => true,
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options }

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      // Don't retry on last attempt
      if (attempt === config.maxRetries) {
        throw error
      }

      // Check if error should be retried
      if (!config.retryCondition(error)) {
        throw error
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(config.baseDelay * Math.pow(2, attempt), config.maxDelay)

      logger.info(`🔄 Retry attempt ${attempt + 1}/${config.maxRetries} in ${delay}ms`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw new Error('Max retries exceeded')
}

/**
 * Specific retry conditions for Supabase errors
 */

export function shouldRetrySupabaseError(error: Error | any): boolean {
  // Network errors
  if (error.message?.includes('fetch')) return true

  // Timeout errors
  if (error.message?.includes('timeout') || error.code === 'PGRST301') return true

  // CORS errors - don't retry
  if (error.message?.includes('CORS')) return false

  // Authentication errors - don't retry
  if (error.code === 'invalid_credentials' || error.code === 'unauthorized') return false

  // Rate limiting - retry
  if (error.code === 'rate_limit_exceeded') return true

  // Server errors (5xx) - retry
  if (error.status >= 500) return true

  // Database connection errors - retry
  if (error.message?.includes('connection') || error.message?.includes('database')) return true

  return false
}

/**
 * Pre-configured retry handlers for common scenarios
 */

export function retryDatabaseQuery<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T> {
  return retryWithBackoff(fn, options)
}

export function retryAuthRequest<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T> {
  return retryWithBackoff(fn, {
    ...options,
    retryCondition: (error) => {
      // Don't retry auth errors
      if (error.code === 'invalid_credentials') return false
      return shouldRetrySupabaseError(error)
    },
  })
}

export function retryRealtimeConnection<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  return retryWithBackoff(fn, {
    ...options,
    maxRetries: 5,
    retryCondition: (error) => {
      // Allow more retries for realtime connections
      return shouldRetrySupabaseError(error) || error.message?.includes('WebSocket')
    },
  })
}
