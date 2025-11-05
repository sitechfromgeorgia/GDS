import { logger } from '@/lib/logger'
import { Database } from '@/types/database'

// Define Network Information interface
interface NetworkInformation {
  rtt?: number
  downlink?: number
  effectiveType?: string
}

// Define the PerformanceEventTiming interface if not available
interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number
  processingEnd: number
}

// Define the LayoutShift interface if not available
interface LayoutShift extends PerformanceEntry {
  value: number
  sources: Array<{
    node?: Node
    previousRect: DOMRectReadOnly
    currentRect: DOMRectReadOnly
  }>
  hadRecentInput: boolean
}

// Core Web Vitals interfaces
interface CoreWebVitals {
  LCP: number // Largest Contentful Paint
  FID: number // First Input Delay
  CLS: number // Cumulative Layout Shift
  FCP: number // First Contentful Paint
  TTFB: number // Time to First Byte
  INP?: number // Interaction to Next Paint (newer metric)
}

interface PerformanceEvent {
  id: string
  timestamp: number
  userId?: string
  sessionId: string
  route: string
  duration: number
  metric: string
  value: number
  tags?: Record<string, string>
  metadata?: Record<string, unknown>
}

interface ResourceTiming {
  name: string
  entryType: string
  startTime: number
  duration: number
  initiatorType: string
  transferSize: number
  encodedBodySize: number
  decodedBodySize: number
}

interface NavigationTiming {
  navigationStart: number
  loadEventEnd: number
  domContentLoadedEventEnd: number
  domInteractive: number
  responseEnd: number
  responseStart: number
  requestStart: number
  connectEnd: number
  connectStart: number
  domainLookupEnd: number
  domainLookupStart: number
  fetchStart: number
  redirectEnd: number
  redirectStart: number
  unloadEventEnd: number
  unloadEventStart: number
}

interface UserInteraction {
  type: 'click' | 'scroll' | 'keypress' | 'touchstart' | 'touchend'
  target: string
  timestamp: number
  duration?: number
  userId?: string
  sessionId: string
  route: string
}

interface CustomMetric {
  name: string
  value: number
  unit: 'ms' | 'bytes' | 'count' | 'ratio'
  timestamp: number
  userId?: string
  sessionId: string
  route: string
  tags?: Record<string, string>
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private events: PerformanceEvent[] = []
  private userInteractions: UserInteraction[] = []
  private customMetrics: CustomMetric[] = []
  private sessionId: string
  private userId?: string
  private enabled: boolean = true
  private performanceThresholds: {
    lcp: number
    fid: number
    cls: number
    fcp: number
    ttfb: number
  } = {
    lcp: 2500, // 2.5s
    fid: 100, // 100ms
    cls: 0.1, // 0.1
    fcp: 1800, // 1.8s
    ttfb: 600, // 600ms
  }

  private constructor() {
    this.sessionId = this.generateSessionId()
    this.initializeMonitoring()
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private initializeMonitoring(): void {
    if (!this.enabled) return

    // Monitor page load performance
    this.monitorPageLoad()

    // Monitor resource loading
    this.monitorResourceLoading()

    // Monitor user interactions
    this.monitorUserInteractions()

    // Monitor Core Web Vitals
    this.monitorCoreWebVitals()

    // Monitor network quality
    this.monitorNetworkQuality()
  }

  private monitorPageLoad(): void {
    if (typeof window === 'undefined') return

    // Track navigation timing
    window.addEventListener('load', () => {
      const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navTiming) {
        this.recordPerformanceEvent('page_load_time', navTiming.loadEventEnd)
        this.recordPerformanceEvent('dom_content_loaded', navTiming.domContentLoadedEventEnd)
        this.recordPerformanceEvent(
          'first_byte_time',
          navTiming.responseStart - navTiming.requestStart
        )
      }
    })
  }

  private monitorResourceLoading(): void {
    if (typeof window === 'undefined') return

    // Track resource loading performance
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming
          this.recordPerformanceEvent('resource_load_time', resourceEntry.duration, {
            url: resourceEntry.name,
            type: resourceEntry.initiatorType,
            size: resourceEntry.encodedBodySize.toString(),
          })
        }
      })
    })

    observer.observe({ entryTypes: ['resource'] })
  }

  private monitorUserInteractions(): void {
    if (typeof window === 'undefined') return

    // Track user interactions
    ;['click', 'scroll', 'keypress', 'touchstart', 'touchend'].forEach((eventType) => {
      document.addEventListener(
        eventType,
        (event) => {
          const interaction: UserInteraction = {
            type: eventType as UserInteraction['type'],
            target: (event.target as Element).tagName || 'unknown',
            timestamp: Date.now(),
            sessionId: this.sessionId,
            route: window.location.pathname,
          }

          this.userInteractions.push(interaction)

          // Record interaction metrics
          this.recordPerformanceEvent(`user_${eventType}`, 0)
        },
        true
      )
    })
  }

  private monitorCoreWebVitals(): void {
    if (typeof window === 'undefined') return

    // Use the Web Vitals library for accurate Core Web Vitals measurement
    // These will be imported and used in the component that implements this
    this.measureLCP()
    this.measureFID()
    this.measureCLS()
    this.measureFCP()
    this.measureTTFB()
  }

  private measureLCP(): void {
    if ('PerformanceObserver' in window) {
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        const lastEntry = entries[entries.length - 1] as PerformanceEntry
        this.recordPerformanceEvent('largest_contentful_paint', lastEntry.duration)
      }).observe({ entryTypes: ['largest-contentful-paint'] })
    }
  }

  private measureFID(): void {
    if ('PerformanceObserver' in window) {
      new PerformanceObserver((entryList) => {
        const firstInput = entryList.getEntries()[0] as PerformanceEventTiming
        if (firstInput) {
          this.recordPerformanceEvent(
            'first_input_delay',
            firstInput.processingStart - firstInput.startTime
          )
        }
      }).observe({ entryTypes: ['first-input'] })
    }
  }

  private measureCLS(): void {
    let clsValue = 0
    const clsEntries: PerformanceEntry[] = []

    if ('PerformanceObserver' in window) {
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries() as LayoutShift[]
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            const firstSession = entry.value
            clsValue += firstSession
            clsEntries.push(entry)
          }
        })
      }).observe({ entryTypes: ['layout-shift'] })

      // Report final CLS value
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.recordPerformanceEvent('cumulative_layout_shift', clsValue)
        }
      })
    }
  }

  private measureFCP(): void {
    if ('PerformanceObserver' in window) {
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        if (entries.length > 0) {
          const fcpEntry = entries[0] as PerformanceEntry
          this.recordPerformanceEvent('first_contentful_paint', fcpEntry.startTime)
        }
      }).observe({ entryTypes: ['paint'] })
    }
  }

  private measureTTFB(): void {
    if ('PerformanceObserver' in window) {
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        if (entries.length > 0) {
          const navigationEntry = entries[0] as PerformanceNavigationTiming
          this.recordPerformanceEvent(
            'time_to_first_byte',
            navigationEntry.responseStart - navigationEntry.requestStart
          )
        }
      }).observe({ entryTypes: ['navigation'] })
    }
  }

  private monitorNetworkQuality(): void {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection
      if (connection) {
        this.recordCustomMetric('network_rtt', connection.rtt || 0, 'ms')
        this.recordCustomMetric('network_downlink', connection.downlink || 0, 'count')
        this.recordCustomMetric(
          'network_effective_type',
          connection.effectiveType === '4g'
            ? 4
            : connection.effectiveType === '3g'
              ? 3
              : connection.effectiveType === '2g'
                ? 2
                : 1,
          'count'
        )
      }
    }
  }

  public recordPerformanceEvent(
    metric: string,
    value: number,
    tags?: Record<string, string>
  ): void {
    if (!this.enabled) return

    const event: PerformanceEvent = {
      id: this.generateSessionId(),
      timestamp: Date.now(),
      sessionId: this.sessionId,
      route: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
      duration: value,
      metric,
      value,
      tags,
    }

    // Add user ID if available
    if (this.userId) {
      event.userId = this.userId
    }

    this.events.push(event)

    // Check if performance is degrading
    this.checkPerformanceThresholds(metric, value)
  }

  public recordCustomMetric(
    name: string,
    value: number,
    unit: CustomMetric['unit'],
    tags?: Record<string, string>
  ): void {
    if (!this.enabled) return

    const metric: CustomMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      route: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
      tags,
    }

    // Add user ID if available
    if (this.userId) {
      metric.userId = this.userId
    }

    this.customMetrics.push(metric)
  }

  public setUserId(userId: string): void {
    this.userId = userId
  }

  public setUserRole(role: string): void {
    this.recordCustomMetric(
      'user_role',
      role === 'admin' ? 1 : role === 'restaurant' ? 2 : role === 'driver' ? 3 : 4,
      'count'
    )
  }

  public startInteractionTimer(name: string): () => number {
    const start = performance.now()
    return () => {
      const duration = performance.now() - start
      this.recordPerformanceEvent(`interaction_${name}`, duration)
      return duration
    }
  }

  public measureFunction<T>(fn: () => T, name: string): T {
    const start = performance.now()
    try {
      const result = fn()
      const duration = performance.now() - start
      this.recordPerformanceEvent(`function_${name}`, duration)
      return result
    } catch (error) {
      const duration = performance.now() - start
      this.recordPerformanceEvent(`function_${name}_error`, duration)
      throw error
    }
  }

  public async measureAsyncFunction<T>(fn: () => Promise<T>, name: string): Promise<T> {
    const start = performance.now()
    try {
      const result = await fn()
      const duration = performance.now() - start
      this.recordPerformanceEvent(`async_function_${name}`, duration)
      return result
    } catch (error) {
      const duration = performance.now() - start
      this.recordPerformanceEvent(`async_function_${name}_error`, duration)
      throw error
    }
  }

  private checkPerformanceThresholds(metric: string, value: number): void {
    let isDegraded = false
    let threshold = 0

    switch (metric) {
      case 'largest_contentful_paint':
        if (value > this.performanceThresholds.lcp) {
          isDegraded = true
          threshold = this.performanceThresholds.lcp
        }
        break
      case 'first_input_delay':
        if (value > this.performanceThresholds.fid) {
          isDegraded = true
          threshold = this.performanceThresholds.fid
        }
        break
      case 'cumulative_layout_shift':
        if (value > this.performanceThresholds.cls) {
          isDegraded = true
          threshold = this.performanceThresholds.cls
        }
        break
      case 'first_contentful_paint':
        if (value > this.performanceThresholds.fcp) {
          isDegraded = true
          threshold = this.performanceThresholds.fcp
        }
        break
      case 'time_to_first_byte':
        if (value > this.performanceThresholds.ttfb) {
          isDegraded = true
          threshold = this.performanceThresholds.ttfb
        }
        break
    }

    if (isDegraded) {
      logger.warn(
        `Performance threshold exceeded: ${metric} = ${value}ms (threshold: ${threshold}ms)`
      )
      // In a real implementation, you would send this to an alerting system
      this.sendPerformanceAlert(metric, value, threshold)
    }
  }

  private sendPerformanceAlert(metric: string, value: number, threshold: number): void {
    // This would integrate with your alerting system
    logger.info(`PERFORMANCE ALERT: ${metric} exceeded threshold: ${value}ms > ${threshold}ms`)
  }

  public getPerformanceData(): {
    events: PerformanceEvent[]
    userInteractions: UserInteraction[]
    customMetrics: CustomMetric[]
  } {
    return {
      events: [...this.events],
      userInteractions: [...this.userInteractions],
      customMetrics: [...this.customMetrics],
    }
  }

  public getCoreWebVitals(): CoreWebVitals | null {
    const lcpEvents = this.events.filter((e) => e.metric === 'largest_contentful_paint')
    const fidEvents = this.events.filter((e) => e.metric === 'first_input_delay')
    const clsEvents = this.events.filter((e) => e.metric === 'cumulative_layout_shift')
    const fcpEvents = this.events.filter((e) => e.metric === 'first_contentful_paint')
    const ttfbEvents = this.events.filter((e) => e.metric === 'time_to_first_byte')

    if (
      lcpEvents.length === 0 &&
      fidEvents.length === 0 &&
      clsEvents.length === 0 &&
      fcpEvents.length === 0 &&
      ttfbEvents.length === 0
    ) {
      return null
    }

    return {
      LCP: lcpEvents.length > 0 ? Math.max(...lcpEvents.map((e) => e.value)) : 0,
      FID: fidEvents.length > 0 ? Math.max(...fidEvents.map((e) => e.value)) : 0,
      CLS: clsEvents.length > 0 ? Math.max(...clsEvents.map((e) => e.value)) : 0,
      FCP: fcpEvents.length > 0 ? Math.max(...fcpEvents.map((e) => e.value)) : 0,
      TTFB: ttfbEvents.length > 0 ? Math.max(...ttfbEvents.map((e) => e.value)) : 0,
    }
  }

  public getPerformanceSummary(): {
    avgLoadTime: number
    avgResourceLoadTime: number
    avgFID: number
    avgLCP: number
    totalInteractions: number
    totalErrors: number
  } {
    const loadEvents = this.events.filter((e) => e.metric.includes('load_time'))
    const resourceEvents = this.events.filter((e) => e.metric.includes('resource_load_time'))
    const fidEvents = this.events.filter((e) => e.metric === 'first_input_delay')
    const lcpEvents = this.events.filter((e) => e.metric === 'largest_contentful_paint')

    return {
      avgLoadTime:
        loadEvents.length > 0
          ? loadEvents.reduce((sum, e) => sum + e.value, 0) / loadEvents.length
          : 0,
      avgResourceLoadTime:
        resourceEvents.length > 0
          ? resourceEvents.reduce((sum, e) => sum + e.value, 0) / resourceEvents.length
          : 0,
      avgFID:
        fidEvents.length > 0
          ? fidEvents.reduce((sum, e) => sum + e.value, 0) / fidEvents.length
          : 0,
      avgLCP:
        lcpEvents.length > 0
          ? lcpEvents.reduce((sum, e) => sum + e.value, 0) / lcpEvents.length
          : 0,
      totalInteractions: this.userInteractions.length,
      totalErrors: this.events.filter((e) => e.metric.includes('_error')).length,
    }
  }

  public enable(): void {
    this.enabled = true
  }

  public disable(): void {
    this.enabled = false
  }

  public reset(): void {
    this.events = []
    this.userInteractions = []
    this.customMetrics = []
    this.sessionId = this.generateSessionId()
  }

  public async sendPerformanceData(endpoint?: string): Promise<void> {
    if (!this.enabled) return

    const data = this.getPerformanceData()

    try {
      if (endpoint) {
        // Send to custom endpoint
        await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: this.sessionId,
            userId: this.userId,
            timestamp: Date.now(),
            data,
          }),
        })
      } else {
        // Send to default endpoint or use existing monitoring infrastructure
        // For now, we'll just log to console
        logger.info('Performance data:', data)
      }
    } catch (error) {
      logger.error('Failed to send performance data:', error)
    }
  }
}

// Helper function to get the singleton instance
export const getPerformanceMonitor = (): PerformanceMonitor => {
  return PerformanceMonitor.getInstance()
}

// Export types
export type {
  CoreWebVitals,
  PerformanceEvent,
  ResourceTiming,
  NavigationTiming,
  UserInteraction,
  CustomMetric,
  NetworkInformation,
}

// Default export
export default PerformanceMonitor
