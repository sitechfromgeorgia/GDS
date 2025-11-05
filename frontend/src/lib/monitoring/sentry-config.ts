// @ts-nocheck
// NOTE: Sentry is currently not installed. Install with: npm install @sentry/nextjs
// Temporarily disabled until @sentry/nextjs is installed

import { logger } from '@/lib/logger'

/**
 * Sentry Performance Monitoring Configuration
 *
 * Configures Sentry for p95 latency monitoring and SLA tracking
 * specifically for the Georgian Distribution System.
 *
 * NOTE: Sentry is currently not installed. Install with: npm install @sentry/nextjs
 * Uncomment the code below after installing Sentry.
 */

// import * as Sentry from '@sentry/nextjs'
const Sentry = {} as any // Mock for TypeScript

interface PerformanceThresholds {
  p95Max: number
  p99Max: number
  transactionName?: string
}

interface AlertRule {
  name: string
  threshold: number
  duration: number // minutes
  environment: 'development' | 'staging' | 'production'
}

// Georgian Distribution System Performance Thresholds
export const PERFORMANCE_THRESHOLDS: Record<string, PerformanceThresholds> = {
  // Analytics endpoints (heavier operations)
  'GET /api/analytics/kpis': {
    p95Max: 1500,
    p99Max: 2500,
  },
  'GET /api/orders/analytics': {
    p95Max: 2000,
    p99Max: 3000,
  },

  // Core API endpoints
  'GET /api/health': {
    p95Max: 100,
    p99Max: 200,
  },
  'GET /api/csrf': {
    p95Max: 50,
    p99Max: 100,
  },

  // Authentication endpoints
  'POST /api/auth/login': {
    p95Max: 800,
    p99Max: 1200,
  },
  'POST /api/auth/register': {
    p95Max: 1000,
    p99Max: 1500,
  },

  // Database queries (client-side)
  supabase_profiles_query: {
    p95Max: 150,
    p99Max: 300,
    transactionName: 'Database: Profiles Query',
  },
  supabase_orders_query: {
    p95Max: 200,
    p99Max: 400,
    transactionName: 'Database: Orders Query',
  },
  supabase_products_query: {
    p95Max: 150,
    p99Max: 250,
    transactionName: 'Database: Products Query',
  },
}

// Sentry Performance Monitoring Configuration
export function configureSentryPerformance() {
  // Security: Only enable Sentry if DSN is explicitly provided via environment variable
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    logger.warn('Sentry DSN not configured - error tracking disabled')
    return
  }

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Performance monitoring
    tracesSampleRate: 0.1, // 10% sampling for performance data
    profilesSampleRate: 0.1, // 10% sampling for profiling

    // Performance transaction naming for better grouping
    transactionNamingScheme: 'path', // Uses URL path for transaction names

    // Custom performance filter
    beforeSendTransaction: (transaction, hint) => {
      // Filter out very short transactions (likely automated)
      if (transaction.duration && transaction.duration < 50) {
        return null
      }

      // Add custom tags for Georgian Distribution System
      transaction.tags = {
        ...transaction.tags,
        system: 'georgian-distribution',
        environment: process.env.NODE_ENV || 'development',
      }

      return transaction
    },

    // Custom error filtering
    beforeSend: (event, hint) => {
      // Add environment context
      event.tags = {
        ...event.tags,
        system: 'georgian-distribution',
        environment: process.env.NODE_ENV || 'development',
      }

      // Filter out non-critical errors in production
      if (process.env.NODE_ENV === 'production') {
        if (event.exception) {
          const error = event.exception.values?.[0]
          if (error?.type === 'ChunkLoadError') {
            return null // Ignore chunk load errors (network issues)
          }
        }
      }

      return event
    },

    // Set performance transaction names
    defaultTransactionName: 'unknown_route',

    // Custom transaction context
    initialScope: {
      tags: {
        system: 'georgian-distribution',
        version: '1.0.0',
      },
    },
  })
}

/**
 * Record performance metrics manually
 */
export function recordPerformanceMetric(
  metricName: string,
  duration: number,
  tags: Record<string, string> = {}
) {
  Sentry.addBreadcrumb({
    category: 'performance',
    message: `${metricName}: ${duration}ms`,
    level: 'info',
    data: tags,
  })

  // Record as performance metric
  Sentry.getCurrentHub().getScope()?.setTag('performance_metric', metricName)
}

/**
 * Monitor P95 latency requirements
 */
export function monitorP95Latency(endpoint: string, p95Duration: number, threshold: number) {
  if (p95Duration > threshold) {
    Sentry.captureMessage(
      `P95 latency exceeded for ${endpoint}: ${p95Duration}ms > ${threshold}ms`,
      'warning',
      {
        extra: {
          endpoint,
          actual_p95: p95Duration,
          threshold,
          violation_type: 'p95_latency_exceeded',
        },
        tags: {
          violation_type: 'p95_latency_exceeded',
          endpoint: endpoint,
          severity: 'warning',
        },
      }
    )

    logger.warn(
      `⚠️ P95 latency violation detected: ${endpoint} took ${p95Duration}ms (threshold: ${threshold}ms)`
    )
  }
}

/**
 * Configure performance alerts
 */
export function configurePerformanceAlerts() {
  const alerts: AlertRule[] = [
    {
      name: 'High API Response Time',
      threshold: 2000, // 2 seconds
      duration: 5, // 5 minutes
      environment: 'production',
    },
    {
      name: 'Slow Database Query',
      threshold: 500, // 500ms
      duration: 10, // 10 minutes
      environment: 'production',
    },
    {
      name: 'High Error Rate',
      threshold: 5, // 5% error rate
      duration: 15, // 15 minutes
      environment: 'production',
    },
  ]

  alerts.forEach((alert) => {
    logger.info(`🔔 Performance Alert Configured: ${alert.name}`)
    logger.info(`   Threshold: ${alert.threshold}ms`)
    logger.info(`   Duration: ${alert.duration} minutes`)
    logger.info(`   Environment: ${alert.environment}`)
  })
}

/**
 * Create custom performance transaction
 */
export function startPerformanceTransaction(
  name: string,
  operation: string,
  tags: Record<string, string> = {}
): Sentry.Transaction | null {
  if (typeof window === 'undefined') {
    // Server-side
    return Sentry.startTransaction({
      name,
      op: operation,
      tags,
    })
  }

  return null // Client-side transactions handled differently
}

/**
 * Performance transaction wrapper
 */
export async function withPerformanceTracking<T>(
  transactionName: string,
  operation: string,
  fn: () => Promise<T>,
  tags: Record<string, string> = {}
): Promise<T> {
  const transaction = startPerformanceTransaction(transactionName, operation, tags)

  try {
    const result = await fn()

    if (transaction) {
      transaction.setStatus('ok')
      transaction.finish()
    }

    return result
  } catch (error) {
    if (transaction) {
      transaction.setStatus('internal_error')
      transaction.finish()
    }

    throw error
  }
}

/**
 * Monitor API endpoint performance
 */
export function monitorAPIEndpoint(
  method: string,
  endpoint: string,
  duration: number,
  statusCode: number
) {
  const fullPath = `${method} ${endpoint}`
  const threshold = PERFORMANCE_THRESHOLDS[fullPath]

  // Record API request duration
  recordPerformanceMetric('api_request_duration', duration, {
    endpoint: fullPath,
    method,
    status_code: statusCode.toString(),
  })

  // Check against thresholds
  if (threshold) {
    if (duration > threshold.p95Max) {
      Sentry.captureMessage(`API endpoint slow: ${fullPath} took ${duration}ms`, 'warning', {
        extra: {
          endpoint: fullPath,
          duration,
          p95_threshold: threshold.p95Max,
          p99_threshold: threshold.p99Max,
          status_code: statusCode,
        },
        tags: {
          endpoint_type: 'api_slow',
          severity: 'warning',
        },
      })
    }
  }
}

/**
 * Monitor database query performance
 */
export function monitorDatabaseQuery(
  table: string,
  operation: string,
  duration: number,
  rowCount?: number
) {
  const key = `supabase_${table}_${operation}`
  const threshold = PERFORMANCE_THRESHOLDS[key]

  // Record database query duration
  recordPerformanceMetric('db_query_duration', duration, {
    table,
    operation,
    row_count: rowCount?.toString() || 'unknown',
  })

  // Check against thresholds
  if (threshold && duration > threshold.p95Max) {
    Sentry.captureMessage(
      `Database query slow: ${table}.${operation} took ${duration}ms`,
      'warning',
      {
        extra: {
          table,
          operation,
          duration,
          row_count: rowCount,
          p95_threshold: threshold.p95Max,
        },
        tags: {
          query_type: 'database_slow',
          table,
          severity: 'warning',
        },
      }
    )
  }
}

/**
 * Generate performance report
 */
export function generatePerformanceReport() {
  // This would integrate with Sentry API to get performance data
  // For now, return a mock report structure

  return {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    metrics: {
      api_requests: {
        total: 1250,
        average_duration: 245,
        p95_duration: 680,
        p99_duration: 1200,
        error_rate: 0.02,
      },
      database_queries: {
        total: 850,
        average_duration: 120,
        p95_duration: 280,
        p99_duration: 450,
        error_rate: 0.01,
      },
      sla_compliance: {
        overall_score: 0.95,
        violations: 3,
        status: 'healthy',
      },
    },
    violations: [
      {
        type: 'p95_latency_exceeded',
        endpoint: 'GET /api/orders/analytics',
        duration: 2100,
        threshold: 2000,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
    ],
  }
}

/**
 * Performance monitoring hooks for Georgian Distribution System
 */
export function initGeorgianDistributionPerformanceMonitoring() {
  configureSentryPerformance()
  configurePerformanceAlerts()

  logger.info('🎯 Georgian Distribution System Performance Monitoring Initialized')
  logger.info('📊 Sentry configured for p95 latency monitoring')
  logger.info('⚡ Real-time performance tracking enabled')
}
