import { useEffect, useCallback } from 'react'
import { getPerformanceMonitor } from '@/lib/performance-monitoring'
import { useAuth } from '@/hooks/useAuth'

/**
 * React hook for performance monitoring in the Georgian Distribution System
 *
 * This hook integrates with the performance monitoring library to track:
 * - Core Web Vitals (LCP, FID, CLS, FCP, TTFB)
 * - User interactions and page navigation
 * - Custom business metrics for the food distribution system
 * - Network quality and resource loading
 */
export const usePerformanceMonitoring = () => {
  const { user } = useAuth()
  const performanceMonitor = getPerformanceMonitor()

  // Initialize performance monitoring
  useEffect(() => {
    // Enable performance monitoring
    performanceMonitor.enable()

    // Set user information if available
    if (user) {
      performanceMonitor.setUserId(user.id)
      performanceMonitor.setUserRole(user.app_metadata?.role || 'unknown')
    }

    // Start monitoring when component mounts
    return () => {
      // Cleanup when component unmounts
      performanceMonitor.disable()
    }
  }, [user])

  /**
   * Start timing a user interaction
   * @param interactionName Name of the interaction to time
   * @returns Function to stop timing and get duration
   */
  const startInteractionTimer = useCallback((interactionName: string) => {
    return performanceMonitor.startInteractionTimer(interactionName)
  }, [])

  /**
   * Measure execution time of a synchronous function
   * @param fn Function to measure
   * @param name Name for the measurement
   * @returns Result of the function
   */
  const measureFunction = useCallback(<T>(fn: () => T, name: string) => {
    return performanceMonitor.measureFunction(fn, name)
  }, [])

  /**
   * Measure execution time of an asynchronous function
   * @param fn Async function to measure
   * @param name Name for the measurement
   * @returns Promise resolving to the result of the function
   */
  const measureAsyncFunction = useCallback(<T>(fn: () => Promise<T>, name: string) => {
    return performanceMonitor.measureAsyncFunction(fn, name)
  }, [])

  /**
   * Record a custom performance metric
   * @param name Metric name
   * @param value Metric value
   * @param unit Unit of measurement
   * @param tags Optional tags for categorization
   */
  const recordCustomMetric = useCallback(
    (
      name: string,
      value: number,
      unit: 'ms' | 'bytes' | 'count' | 'ratio',
      tags?: Record<string, string>
    ) => {
      performanceMonitor.recordCustomMetric(name, value, unit, tags)
    },
    []
  )

  /**
   * Record a performance event
   * @param metric Metric name
   * @param value Metric value
   * @param tags Optional tags for categorization
   */
  const recordPerformanceEvent = useCallback(
    (metric: string, value: number, tags?: Record<string, string>) => {
      performanceMonitor.recordPerformanceEvent(metric, value, tags)
    },
    []
  )

  /**
   * Get current Core Web Vitals metrics
   */
  const getCoreWebVitals = useCallback(() => {
    return performanceMonitor.getCoreWebVitals()
  }, [])

  /**
   * Get performance summary
   */
  const getPerformanceSummary = useCallback(() => {
    return performanceMonitor.getPerformanceSummary()
  }, [])

  /**
   * Send performance data to endpoint
   * @param endpoint Optional endpoint to send data to
   */
  const sendPerformanceData = useCallback(async (endpoint?: string) => {
    await performanceMonitor.sendPerformanceData(endpoint)
  }, [])

  // Record page navigation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Record page load time
      const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navTiming) {
        recordPerformanceEvent('page_load_time', navTiming.loadEventEnd)
        recordPerformanceEvent('dom_content_loaded', navTiming.domContentLoadedEventEnd)
      }

      // Record first paint metrics
      const paintEntries = performance.getEntriesByType('paint')
      paintEntries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          recordPerformanceEvent('first_contentful_paint', entry.startTime)
        }
      })
    }
  }, [])

  return {
    startInteractionTimer,
    measureFunction,
    measureAsyncFunction,
    recordCustomMetric,
    recordPerformanceEvent,
    getCoreWebVitals,
    getPerformanceSummary,
    sendPerformanceData,
  }
}
