import { logger } from '@/lib/logger'
import { useCallback, useEffect, useRef } from 'react'
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring'
import { performanceMonitoringService } from '@/services/performance-monitoring-service'
import { getPerformanceMonitor } from '@/lib/performance-monitoring'

/**
 * Enhanced Performance Monitoring Hook
 *
 * This hook extends the basic performance monitoring with additional features:
 * - Integration with Sentry for error tracking
 * - Custom business metrics for the Georgian Distribution System
 * - Performance alerting
 * - Resource usage monitoring
 */
export const useEnhancedPerformanceMonitoring = () => {
  const {
    startInteractionTimer,
    measureFunction,
    measureAsyncFunction,
    recordCustomMetric,
    recordPerformanceEvent,
    getCoreWebVitals,
    getPerformanceSummary,
    sendPerformanceData,
  } = usePerformanceMonitoring()

  const interactionTimers = useRef<Record<string, () => number>>({})

  /**
   * Start timing a user interaction with enhanced monitoring
   * @param interactionName Name of the interaction to time
   * @returns Function to stop timing and get duration
   */
  const startEnhancedInteractionTimer = useCallback(
    (interactionName: string) => {
      // Start the basic timer
      const stopBasicTimer = startInteractionTimer(interactionName)

      // Start Sentry transaction if enabled
      const transaction = performanceMonitoringService.startTransaction(
        interactionName,
        'ui.interaction'
      )

      return () => {
        // Stop the basic timer and get duration
        const duration = stopBasicTimer()

        // Record with enhanced monitoring
        performanceMonitoringService.monitorUserInteraction(interactionName, duration)

        // Finish Sentry transaction
        if (transaction) {
          transaction.finish()
        }

        return duration
      }
    },
    [startInteractionTimer]
  )

  /**
   * Measure execution time of a synchronous function with enhanced monitoring
   * @param fn Function to measure
   * @param name Name for the measurement
   * @returns Result of the function
   */
  const measureEnhancedFunction = useCallback(
    <T>(fn: () => T, name: string) => {
      const startTime = performance.now()

      try {
        const result = fn()
        const duration = performance.now() - startTime

        // Record with basic monitoring
        recordPerformanceEvent(`function_${name}`, duration)

        // Record with enhanced monitoring
        performanceMonitoringService.monitorComponentRender(name, duration)

        return result
      } catch (error) {
        const duration = performance.now() - startTime

        // Record error with basic monitoring
        recordPerformanceEvent(`function_${name}_error`, duration)

        // Re-throw the error
        throw error
      }
    },
    [recordPerformanceEvent]
  )

  /**
   * Measure execution time of an asynchronous function with enhanced monitoring
   * @param fn Async function to measure
   * @param name Name for the measurement
   * @returns Promise resolving to the result of the function
   */
  const measureEnhancedAsyncFunction = useCallback(
    <T>(fn: () => Promise<T>, name: string) => {
      const startTime = performance.now()

      return fn()
        .then((result) => {
          const duration = performance.now() - startTime

          // Record with basic monitoring
          recordPerformanceEvent(`async_function_${name}`, duration)

          // Record with enhanced monitoring
          performanceMonitoringService.monitorComponentRender(name, duration)

          return result
        })
        .catch((error) => {
          const duration = performance.now() - startTime

          // Record error with basic monitoring
          recordPerformanceEvent(`async_function_${name}_error`, duration)

          // Re-throw the error
          throw error
        })
    },
    [recordPerformanceEvent]
  )

  /**
   * Record a custom performance metric with enhanced monitoring
   * @param name Metric name
   * @param value Metric value
   * @param unit Unit of measurement
   * @param tags Optional tags for categorization
   */
  const recordEnhancedCustomMetric = useCallback(
    (
      name: string,
      value: number,
      unit: 'ms' | 'bytes' | 'count' | 'ratio',
      tags?: Record<string, string>
    ) => {
      // Record with basic monitoring
      recordCustomMetric(name, value, unit, tags)

      // Record with enhanced monitoring
      performanceMonitoringService.recordMetric(name, value, unit)

      // Send to Sentry if enabled
      performanceMonitoringService.captureMeasurement(name, value, unit)
    },
    [recordCustomMetric]
  )

  /**
   * Record a performance event with enhanced monitoring
   * @param metric Metric name
   * @param value Metric value
   * @param tags Optional tags for categorization
   */
  const recordEnhancedPerformanceEvent = useCallback(
    (metric: string, value: number, tags?: Record<string, string>) => {
      // Record with basic monitoring
      recordPerformanceEvent(metric, value, tags)

      // Record with enhanced monitoring
      performanceMonitoringService.captureMeasurement(metric, value, 'millisecond')
    },
    [recordPerformanceEvent]
  )

  /**
   * Monitor database query performance
   * @param queryName Query name
   * @param duration Query duration in milliseconds
   * @param tableName Table name (optional)
   */
  const monitorDatabaseQuery = useCallback(
    (queryName: string, duration: number, tableName?: string) => {
      // Record with enhanced monitoring
      performanceMonitoringService.monitorDatabaseQuery(queryName, duration, tableName)

      // Record custom metric
      recordEnhancedCustomMetric(`db_query_${queryName}`, duration, 'ms', {
        table: tableName || 'unknown',
      })
    },
    [recordEnhancedCustomMetric]
  )

  /**
   * Monitor API call performance
   * @param endpoint API endpoint
   * @param duration Call duration in milliseconds
   * @param statusCode HTTP status code
   */
  const monitorApiCall = useCallback(
    (endpoint: string, duration: number, statusCode: number) => {
      // Record with enhanced monitoring
      performanceMonitoringService.captureMeasurement(`api_${endpoint}`, duration, 'millisecond')

      // Record custom metric
      recordEnhancedCustomMetric(`api_call_${endpoint}`, duration, 'ms', {
        status: statusCode.toString(),
      })

      // Record success/failure
      if (statusCode >= 200 && statusCode < 300) {
        recordEnhancedCustomMetric(`api_success_${endpoint}`, 1, 'count')
      } else {
        recordEnhancedCustomMetric(`api_error_${endpoint}`, 1, 'count', {
          status: statusCode.toString(),
        })
      }
    },
    [recordEnhancedCustomMetric]
  )

  /**
   * Monitor Georgian Distribution System specific metrics
   * @param metricName Metric name
   * @param value Metric value
   * @param context Additional context
   */
  const monitorBusinessMetric = useCallback(
    (metricName: string, value: number, context?: Record<string, string>) => {
      // Record with enhanced monitoring
      recordEnhancedCustomMetric(`business_${metricName}`, value, 'count', context)

      // Specific business metrics for the Georgian Distribution System
      switch (metricName) {
        case 'order_placed':
          recordEnhancedCustomMetric('orders_placed', value, 'count', context)
          break
        case 'order_confirmed':
          recordEnhancedCustomMetric('orders_confirmed', value, 'count', context)
          break
        case 'order_delivered':
          recordEnhancedCustomMetric('orders_delivered', value, 'count', context)
          break
        case 'driver_assigned':
          recordEnhancedCustomMetric('drivers_assigned', value, 'count', context)
          break
        case 'restaurant_active':
          recordEnhancedCustomMetric('restaurants_active', value, 'count', context)
          break
        case 'driver_active':
          recordEnhancedCustomMetric('drivers_active', value, 'count', context)
          break
      }
    },
    [recordEnhancedCustomMetric]
  )

  /**
   * Send performance data with enhanced monitoring
   * @param endpoint Optional endpoint to send data to
   */
  const sendEnhancedPerformanceData = useCallback(
    async (endpoint?: string) => {
      // Send with basic monitoring
      await sendPerformanceData(endpoint)

      // Send with enhanced monitoring
      performanceMonitoringService.sendPerformanceData()
    },
    [sendPerformanceData]
  )

  /**
   * Check for performance alerts
   */
  const checkPerformanceAlerts = useCallback(() => {
    const coreWebVitals = getCoreWebVitals()
    const performanceSummary = getPerformanceSummary()

    if (coreWebVitals) {
      // Check LCP alert
      if (coreWebVitals.LCP > 2500) {
        // 2.5 seconds
        logger.warn('Performance Alert: LCP is too high', { LCP: coreWebVitals.LCP })
        // In a real implementation, you would send this to an alerting system
      }

      // Check FID alert
      if (coreWebVitals.FID > 100) {
        // 100ms
        logger.warn('Performance Alert: FID is too high', { FID: coreWebVitals.FID })
        // In a real implementation, you would send this to an alerting system
      }

      // Check CLS alert
      if (coreWebVitals.CLS > 0.1) {
        // 0.1
        logger.warn('Performance Alert: CLS is too high', { CLS: coreWebVitals.CLS })
        // In a real implementation, you would send this to an alerting system
      }
    }

    if (performanceSummary) {
      // Check average load time alert
      if (performanceSummary.avgLoadTime > 3000) {
        // 3 seconds
        logger.warn('Performance Alert: Average load time is too high', {
          avgLoadTime: performanceSummary.avgLoadTime,
        })
        // In a real implementation, you would send this to an alerting system
      }

      // Check error rate alert
      if (performanceSummary.totalErrors > 10) {
        logger.warn('Performance Alert: Too many errors', {
          totalErrors: performanceSummary.totalErrors,
        })
        // In a real implementation, you would send this to an alerting system
      }
    }
  }, [getCoreWebVitals, getPerformanceSummary])

  // Periodically check for performance alerts
  useEffect(() => {
    const interval = setInterval(checkPerformanceAlerts, 30000) // Check every 30 seconds

    return () => {
      clearInterval(interval)
    }
  }, [checkPerformanceAlerts])

  return {
    startEnhancedInteractionTimer,
    measureEnhancedFunction,
    measureEnhancedAsyncFunction,
    recordEnhancedCustomMetric,
    recordEnhancedPerformanceEvent,
    monitorDatabaseQuery,
    monitorApiCall,
    monitorBusinessMetric,
    sendEnhancedPerformanceData,
    checkPerformanceAlerts,
    getCoreWebVitals,
    getPerformanceSummary,
  }
}
