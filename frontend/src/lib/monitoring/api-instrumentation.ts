/**
 * API Instrumentation Utility
 *
 * Automatically instruments API routes and server actions with performance tracking
 * for the Georgian Distribution System p95 latency monitoring requirements.
 */

import { logger } from '@/lib/logger'
import { recordAPIRequest } from '@/lib/monitoring/sla-tracker'
import type { NextRequest, NextResponse } from 'next/server'

/**
 * Instrument a Next.js API route handler with performance tracking
 */
export function instrumentAPIHandler<
  T extends (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
>(
  handler: T,
  options: {
    endpoint: string
    method?: string
    slowThreshold?: number
    enabled?: boolean
  }
): T {
  return (async (request: NextRequest, ...args: any[]) => {
    const startTime = performance.now()
    const method = options.method || request.method

    try {
      // Execute the handler
      const response = await handler(request, ...args)

      // Calculate duration
      const endTime = performance.now()
      const duration = endTime - startTime
      const statusCode = response.status

      // Record the API request
      recordAPIRequest(options.endpoint, method, duration, statusCode)

      // Add performance headers
      const headers = new Headers(response.headers)
      headers.set('X-Response-Time', `${Math.round(duration)}ms`)

      // Create response with performance headers
      const enhancedResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      })

      return enhancedResponse
    } catch (error) {
      const endTime = performance.now()
      const duration = endTime - startTime

      // Record failed request
      recordAPIRequest(options.endpoint, method, duration, 500)

      logger.error(`❌ API Error [${options.endpoint}]: ${error}`)
      throw error
    }
  }) as T
}

/**
 * Instrument a server action with performance tracking
 */
export function instrumentServerAction<T extends (...args: any[]) => Promise<any>>(
  action: T,
  options: {
    actionName: string
    slowThreshold?: number
    enabled?: boolean
  }
): T {
  return (async (...args: any[]) => {
    const startTime = performance.now()

    try {
      const result = await action(...args)
      const endTime = performance.now()
      const duration = endTime - startTime

      // Record the server action performance
      recordAPIRequest(`server-action:${options.actionName}`, 'POST', duration, 200)

      return result
    } catch (error) {
      const endTime = performance.now()
      const duration = endTime - startTime

      // Record failed action
      recordAPIRequest(`server-action:${options.actionName}`, 'POST', duration, 500)

      logger.error(`❌ Server Action Error [${options.actionName}]: ${error}`)
      throw error
    }
  }) as T
}

/**
 * Instrument database queries with performance tracking
 */
export function instrumentDatabaseQuery<T extends (...args: any[]) => Promise<any>>(
  queryFn: T,
  options: {
    table: string
    operation: string
    userId?: string
    slowThreshold?: number
  }
): T {
  return (async (...args: any[]) => {
    const startTime = performance.now()

    try {
      const result = await queryFn(...args)
      const endTime = performance.now()
      const duration = endTime - startTime

      // Record database query performance
      recordAPIRequest(`db:${options.table}:${options.operation}`, 'SELECT', duration, 200)

      // Log slow queries
      if (duration > (options.slowThreshold || 500)) {
        logger.warn(
          `🐌 Slow DB query: ${options.table}.${options.operation} took ${duration.toFixed(2)}ms`
        )
      }

      return result
    } catch (error) {
      const endTime = performance.now()
      const duration = endTime - startTime

      // Record failed query
      recordAPIRequest(`db:${options.table}:${options.operation}`, 'SELECT', duration, 500)

      logger.error(`❌ DB Query Error [${options.table}.${options.operation}]: ${error}`)
      throw error
    }
  }) as T
}

/**
 * Configure SLA limits for specific endpoints
 */
export function configureEndpointSLA(
  endpoint: string,
  method: string,
  limits: {
    p95Max: number
    p99Max: number
    minSuccessRate: number
  }
) {
  // Placeholder for future SLA configuration
  logger.info(`SLA configured for ${method} ${endpoint}:`, limits)
}

/**
 * Get performance statistics for an endpoint
 */
export function getEndpointStats(endpoint: string, method: string) {
  // This would integrate with the SLA tracker to get real-time stats
  // For now, return a placeholder structure
  return {
    endpoint,
    method,
    recentRequests: 0,
    averageResponseTime: 0,
    p95ResponseTime: 0,
    p99ResponseTime: 0,
    errorRate: 0,
    status: 'unknown' as 'healthy' | 'warning' | 'critical',
  }
}

/**
 * Middleware for automatic request timing on all routes
 */
export function createPerformanceMiddleware(options?: {
  slowRequestThreshold?: number
  enableDetailedLogging?: boolean
  excludePaths?: string[]
}) {
  const config = {
    slowRequestThreshold: options?.slowRequestThreshold || 500,
    enableDetailedLogging: options?.enableDetailedLogging || false,
    excludePaths: options?.excludePaths || ['/api/health', '/api/status'],
  }

  return async function performanceTrackingMiddleware(
    request: NextRequest,
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
      const response = await next()
      const endTime = performance.now()
      const duration = endTime - startTime

      // Record the request
      recordAPIRequest(path, method, duration, response.status)

      // Add X-Response-Time header
      const headers = new Headers(response.headers)
      headers.set('X-Response-Time', `${Math.round(duration)}ms`)

      const enhancedResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      })

      // Log slow requests
      if (duration > config.slowRequestThreshold) {
        logger.warn(
          `🐌 Slow request: ${method} ${path} took ${duration.toFixed(2)}ms (threshold: ${config.slowRequestThreshold}ms)`
        )
      }

      // Detailed logging in development
      if (config.enableDetailedLogging) {
        const statusEmoji = response.status >= 400 ? '🔴' : response.status >= 300 ? '🟡' : '🟢'
        logger.info(
          `${statusEmoji} ${method} ${path} - ${duration.toFixed(2)}ms (${response.status})`
        )
      }

      return enhancedResponse
    } catch (error) {
      const endTime = performance.now()
      const duration = endTime - startTime

      // Record failed request
      recordAPIRequest(path, method, duration, 500)

      logger.error(`❌ Request failed: ${method} ${path} - ${duration.toFixed(2)}ms`)
      throw error
    }
  }
}

// Export commonly used SLA configurations for Georgian Distribution System
export const SLA_CONFIGS = {
  // API endpoints
  ORDERS_ANALYTICS: {
    p95Max: 2000,
    p99Max: 3000,
    minSuccessRate: 0.95,
  },
  ANALYTICS_KPIS: {
    p95Max: 1500,
    p99Max: 2500,
    minSuccessRate: 0.98,
  },
  AUTH_ROUTES: {
    p95Max: 800,
    p99Max: 1200,
    minSuccessRate: 0.99,
  },
  DEMO_ROUTES: {
    p95Max: 1000,
    p99Max: 1800,
    minSuccessRate: 0.9,
  },

  // Database operations
  ORDER_QUERIES: {
    p95Max: 300,
    p99Max: 500,
    minSuccessRate: 0.95,
  },
  PRODUCT_QUERIES: {
    p95Max: 200,
    p99Max: 400,
    minSuccessRate: 0.98,
  },
  USER_QUERIES: {
    p95Max: 150,
    p99Max: 300,
    minSuccessRate: 0.99,
  },
}
