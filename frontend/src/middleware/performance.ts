import { logger } from '@/lib/logger'
import type { NextRequest, NextResponse } from 'next/server'
import { recordAPIRequest } from '@/lib/monitoring/sla-tracker'

/**
 * Performance monitoring middleware for Next.js
 * Automatically tracks request timing for all API routes
 * and adds X-Response-Time headers
 */

export interface PerformanceMiddlewareOptions {
  enableLogging?: boolean
  logSlowRequests?: boolean
  slowRequestThreshold?: number // ms
  excludePaths?: string[]
  enableDetailedMetrics?: boolean
}

const DEFAULT_OPTIONS: Required<PerformanceMiddlewareOptions> = {
  enableLogging: process.env.NODE_ENV === 'development',
  logSlowRequests: true,
  slowRequestThreshold: 500,
  excludePaths: ['/api/health', '/api/status'],
  enableDetailedMetrics: process.env.NODE_ENV === 'production',
}

/**
 * Middleware for automatic request timing
 */
export function performanceMiddleware(options: PerformanceMiddlewareOptions = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options }

  return async function withPerformanceTracking(
    request: NextRequest,
    response: NextResponse,
    next: () => Promise<Response>
  ): Promise<Response> {
    const startTime = performance.now()
    const url = new URL(request.url)
    const path = url.pathname
    const method = request.method

    // Skip excluded paths
    if (config.excludePaths.some((excludedPath) => path.startsWith(excludedPath))) {
      return next()
    }

    try {
      // Execute the request
      const response_result = await next()

      // Calculate timing
      const endTime = performance.now()
      const duration = endTime - startTime
      const statusCode = response_result.status

      // Record the API request using SLA tracker
      recordAPIRequest(path, method, duration, statusCode)

      // Add X-Response-Time header
      const headers = new Headers(response_result.headers)
      headers.set('X-Response-Time', `${Math.round(duration)}ms`)
      headers.set('X-Request-ID', generateRequestId())

      // Create response with additional headers
      const enhancedResponse = new Response(response_result.body, {
        status: response_result.status,
        statusText: response_result.statusText,
        headers,
      })

      // Log slow requests
      if (config.logSlowRequests && duration > config.slowRequestThreshold) {
        logger.warn(
          `🐌 Slow request detected: ${method} ${path} took ${duration.toFixed(2)}ms (status: ${statusCode})`
        )
      }

      // Development logging
      if (config.enableLogging) {
        const statusColor = statusCode >= 400 ? '🔴' : statusCode >= 300 ? '🟡' : '🟢'
        logger.info(`${statusColor} ${method} ${path} - ${duration.toFixed(2)}ms (${statusCode})`)
      }

      return enhancedResponse
    } catch (error) {
      const endTime = performance.now()
      const duration = endTime - startTime

      // Record failed request
      recordAPIRequest(path, method, duration, 500)

      // Log error
      if (config.enableLogging) {
        logger.error(`❌ ${method} ${path} - ${duration.toFixed(2)}ms (ERROR: ${error})`)
      }

      // Re-throw the error
      throw error
    }
  }
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * HOC (Higher-Order Component) for Next.js route handlers
 * Wraps API routes with automatic performance tracking
 */
export function withPerformanceTracking<T extends (...args: any[]) => Promise<Response>>(
  handler: T,
  options: PerformanceMiddlewareOptions = {}
): T {
  const middleware = performanceMiddleware(options)

  return (async (request: NextRequest, ...args: any[]) => {
    const wrappedHandler = async () => {
      return handler(request, ...args)
    }

    return middleware(request, {} as NextResponse, wrappedHandler)
  }) as T
}

/**
 * Performance monitoring decorator for server actions
 */
export function monitorPerformance<T extends (...args: any[]) => Promise<any>>(
  action: T,
  actionName: string
): T {
  return (async (...args: any[]) => {
    const startTime = performance.now()

    try {
      const result = await action(...args)
      const endTime = performance.now()
      const duration = endTime - startTime

      // Record the action performance
      recordAPIRequest(`server-action:${actionName}`, 'POST', duration, 200)

      return result
    } catch (error) {
      const endTime = performance.now()
      const duration = endTime - startTime

      // Record failed action
      recordAPIRequest(`server-action:${actionName}`, 'POST', duration, 500)

      throw error
    }
  }) as T
}

/**
 * Database query performance monitoring
 */
export function monitorDatabaseQuery<T extends (...args: any[]) => Promise<any>>(
  queryFn: T,
  queryInfo: { table: string; operation: string; userId?: string }
): T {
  return (async (...args: any[]) => {
    const startTime = performance.now()

    try {
      const result = await queryFn(...args)
      const endTime = performance.now()
      const duration = endTime - startTime

      // Log slow database queries
      if (duration > 500) {
        logger.warn(
          `🐌 Slow database query: ${queryInfo.table}.${queryInfo.operation} took ${duration.toFixed(2)}ms`
        )
      }

      return result
    } catch (error) {
      const endTime = performance.now()
      const duration = endTime - startTime

      logger.error(
        `❌ Database query failed: ${queryInfo.table}.${queryInfo.operation} - ${duration.toFixed(2)}ms`
      )
      throw error
    }
  }) as T
}

/**
 * Component render performance monitoring
 */
export function withRenderMonitoring<T extends (...args: any[]) => any>(
  Component: T,
  componentName?: string
): T {
  const displayName =
    componentName || (Component as any).displayName || (Component as any).name || 'UnknownComponent'

  const WrappedComponent = (...args: any[]) => {
    const startTime = performance.now()

    try {
      const result = Component(...args)
      const endTime = performance.now()
      const duration = endTime - startTime

      // Log slow renders in development
      if (process.env.NODE_ENV === 'development' && duration > 16) {
        // 16ms = 60fps
        logger.warn(`🐌 Slow render: ${displayName} took ${duration.toFixed(2)}ms`)
      }

      return result
    } catch (error) {
      const endTime = performance.now()
      const duration = endTime - startTime

      logger.error(`❌ Component render failed: ${displayName} - ${duration.toFixed(2)}ms`)
      throw error
    }
  }

  ;(WrappedComponent as any).displayName = `withRenderMonitoring(${displayName})`

  return WrappedComponent as T
}

/**
 * User interaction performance monitoring
 */
export function monitorUserInteraction<T extends (...args: any[]) => void>(
  interactionFn: T,
  interactionName: string
): T {
  return ((...args: any[]) => {
    const startTime = performance.now()

    try {
      const result = interactionFn(...args)
      const endTime = performance.now()
      const duration = endTime - startTime

      // Log slow interactions
      if (duration > 100) {
        logger.warn(`🐌 Slow interaction: ${interactionName} took ${duration.toFixed(2)}ms`)
      }

      return result
    } catch (error) {
      const endTime = performance.now()
      const duration = endTime - startTime

      logger.error(`❌ User interaction failed: ${interactionName} - ${duration.toFixed(2)}ms`)
      throw error
    }
  }) as T
}

/**
 * Utility to check if we're in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof performance !== 'undefined'
}

/**
 * Get current performance marks
 */
export function getPerformanceMarks() {
  if (!isBrowser()) return {}

  const marks = performance.getEntriesByType('mark') as PerformanceMark[]
  const measures = performance.getEntriesByType('measure') as PerformanceMeasure[]

  return {
    marks: marks.reduce(
      (acc, mark) => {
        acc[mark.name] = mark.startTime
        return acc
      },
      {} as Record<string, number>
    ),
    measures: measures.reduce(
      (acc, measure) => {
        acc[measure.name] = {
          duration: measure.duration,
          startTime: measure.startTime,
        }
        return acc
      },
      {} as Record<string, { duration: number; startTime: number }>
    ),
  }
}

/**
 * Export default middleware instance
 */
export default performanceMiddleware()
