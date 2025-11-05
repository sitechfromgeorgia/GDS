/**
 * Georgian Distribution System - Comprehensive Logger
 *
 * Centralized logging system with:
 * - Multiple log levels (debug, info, warn, error)
 * - Environment-aware logging
 * - Structured logging with metadata
 * - Performance tracking
 * - Connection diagnostics
 * - Test results logging
 *
 * Usage:
 *   import { logger } from '@/lib/logger'
 *   logger.info('User logged in', { userId: '123' })
 *   logger.error('API failed', error, { endpoint: '/api/orders' })
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogMetadata {
  [key: string]: any
}

/**
 * Logger configuration
 */
const config = {
  // Enable logging based on environment
  enabled:
    process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENABLE_LOGGING === 'true',

  // Minimum log level
  minLevel: (process.env.NEXT_PUBLIC_LOG_LEVEL || 'info') as LogLevel,
}

/**
 * Log level priorities
 */
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

/**
 * Check if a log level should be output
 */
function shouldLog(level: LogLevel): boolean {
  if (!config.enabled) return level === 'error' // Always log errors
  return LOG_LEVELS[level] >= LOG_LEVELS[config.minLevel]
}

/**
 * Format timestamp
 */
function getTimestamp(): string {
  return new Date().toISOString()
}

/**
 * Main logger object
 */
export const logger = {
  /**
   * Debug level - detailed diagnostic information
   */
  debug(message: string, context?: LogMetadata): void {
    if (!shouldLog('debug')) return
    console.debug(`[${getTimestamp()}] [DEBUG] ${message}`, context)
  },

  /**
   * Info level - general informational messages
   */
  info(message: string, context?: LogMetadata): void {
    if (!shouldLog('info')) return
    console.log(`[${getTimestamp()}] [INFO] ${message}`, context || '')
  },

  /**
   * Warning level - potentially harmful situations
   */
  warn(message: string, context?: LogMetadata): void {
    if (!shouldLog('warn')) return
    console.warn(`[${getTimestamp()}] [WARN] ${message}`, context || '')
  },

  /**
   * Error level - error events
   */
  error(message: string, error?: Error | unknown, context?: LogMetadata): void {
    if (!shouldLog('error')) return

    const errorContext =
      error instanceof Error
        ? { error: error.message, stack: error.stack, ...context }
        : { error, ...context }

    console.error(`[${getTimestamp()}] [ERROR] ${message}`, errorContext)
  },

  /**
   * Connection logs
   */
  connection(event: string, details: LogMetadata): void {
    if (!shouldLog('info')) return
    console.log(`[${getTimestamp()}] [CONNECTION] ${event}`, details)
  },

  /**
   * Test result logs
   */
  test(testName: string, result: 'PASS' | 'FAIL' | 'SKIP', details?: LogMetadata): void {
    if (!shouldLog('info')) return
    const icon = result === 'PASS' ? '✅' : result === 'FAIL' ? '❌' : '⏭️'
    console.log(`[${getTimestamp()}] ${icon} ${testName}: ${result}`, details || '')
  },

  /**
   * Performance tracking
   */
  performance: {
    /**
     * Log performance metric
     */
    log(operation: string, duration: number, metadata?: LogMetadata): void {
      if (!shouldLog('debug')) return
      console.log(`[${getTimestamp()}] ⏱️ ${operation}: ${duration}ms`, metadata || '')
    },

    /**
     * Start a performance timer
     */
    start(label: string): () => void {
      const startTime = performance.now()

      return () => {
        const duration = performance.now() - startTime
        logger.performance.log(label, Math.round(duration))
      }
    },

    /**
     * Track async function performance
     */
    async track<T>(label: string, fn: () => Promise<T>): Promise<T> {
      const end = logger.performance.start(label)
      try {
        return await fn()
      } finally {
        end()
      }
    },
  },

  /**
   * Create a child logger with default metadata
   */
  child(defaultMetadata: LogMetadata) {
    return {
      debug(message: string, metadata?: LogMetadata) {
        logger.debug(message, { ...defaultMetadata, ...metadata })
      },
      info(message: string, metadata?: LogMetadata) {
        logger.info(message, { ...defaultMetadata, ...metadata })
      },
      warn(message: string, metadata?: LogMetadata) {
        logger.warn(message, { ...defaultMetadata, ...metadata })
      },
      error(message: string, error?: Error | unknown, metadata?: LogMetadata) {
        logger.error(message, error, { ...defaultMetadata, ...metadata })
      },
    }
  },
}

/**
 * Create a module-specific logger
 */
export const createLogger = (module: string) => {
  return logger.child({ module })
}

/**
 * Development-only logging utilities
 */
export const devLog = {
  log(...args: any[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEV]', ...args)
    }
  },

  table(data: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.table(data)
    }
  },

  time(label: string): void {
    if (process.env.NODE_ENV === 'development') {
      console.time(label)
    }
  },

  timeEnd(label: string): void {
    if (process.env.NODE_ENV === 'development') {
      console.timeEnd(label)
    }
  },
}

// Export default
export default logger

/**
 * Usage examples:
 *
 * Basic logging:
 *   logger.info('User logged in', { userId: '123' })
 *   logger.warn('Slow query detected', { duration: 2500 })
 *   logger.error('API failed', error, { endpoint: '/api/orders' })
 *
 * Connection logging:
 *   logger.connection('WebSocket connected', { channel: 'orders' })
 *
 * Test logging:
 *   logger.test('Database Connection', 'PASS', { latency: 120 })
 *
 * Performance tracking:
 *   const end = logger.performance.start('User Login')
 *   // ... do work ...
 *   end() // Logs duration automatically
 *
 *   // Or with async functions:
 *   await logger.performance.track('Fetch Orders', async () => {
 *     return await fetchOrders()
 *   })
 *
 * Module-specific logger:
 *   const authLogger = createLogger('auth')
 *   authLogger.info('Login attempt', { email: 'user@example.com' })
 */
