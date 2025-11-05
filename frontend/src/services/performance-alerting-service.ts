/**
 * Performance Alerting Service
 *
 * Service for monitoring performance metrics and sending alerts when thresholds are exceeded.
 */

// Import performance monitoring utilities
import { logger } from '@/lib/logger'
import { getPerformanceMonitor } from '@/lib/performance-monitoring'

/**
 * Alert Severity Levels
 */
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical'

/**
 * Performance Alert Interface
 */
export interface PerformanceAlert {
  id: string
  timestamp: number
  metric: string
  value: number
  threshold: number
  severity: AlertSeverity
  message: string
  tags?: Record<string, string>
}

/**
 * Alert Threshold Configuration
 */
export interface AlertThreshold {
  metric: string
  threshold: number
  severity: AlertSeverity
  enabled: boolean
  cooldownPeriod: number // in milliseconds
}

/**
 * Alert Callback Function
 */
export type AlertCallback = (alert: PerformanceAlert) => void

/**
 * Performance Alerting Service
 */
class PerformanceAlertingService {
  private thresholds: AlertThreshold[] = []
  private callbacks: AlertCallback[] = []
  private lastAlertTimes: Record<string, number> = {}
  private isEnabled: boolean = true

  constructor() {
    // Set default thresholds
    this.setDefaultThresholds()

    // Start monitoring
    this.startMonitoring()
  }

  /**
   * Set default alert thresholds
   */
  private setDefaultThresholds(): void {
    this.thresholds = [
      // Core Web Vitals thresholds
      {
        metric: 'lcp',
        threshold: 2500, // 2.5 seconds
        severity: 'warning',
        enabled: true,
        cooldownPeriod: 300000, // 5 minutes
      },
      {
        metric: 'fid',
        threshold: 100, // 100ms
        severity: 'warning',
        enabled: true,
        cooldownPeriod: 300000, // 5 minutes
      },
      {
        metric: 'cls',
        threshold: 0.1, // 0.1
        severity: 'warning',
        enabled: true,
        cooldownPeriod: 300000, // 5 minutes
      },
      // Performance thresholds
      {
        metric: 'page_load_time',
        threshold: 3000, // 3 seconds
        severity: 'warning',
        enabled: true,
        cooldownPeriod: 300000, // 5 minutes
      },
      {
        metric: 'api_response_time',
        threshold: 1000, // 1 second
        severity: 'warning',
        enabled: true,
        cooldownPeriod: 300000, // 5 minutes
      },
      {
        metric: 'error_rate',
        threshold: 0.05, // 5%
        severity: 'error',
        enabled: true,
        cooldownPeriod: 300000, // 5 minutes
      },
      // Georgian Distribution System specific thresholds
      {
        metric: 'order_processing_time',
        threshold: 5000, // 5 seconds
        severity: 'warning',
        enabled: true,
        cooldownPeriod: 300000, // 5 minutes
      },
      {
        metric: 'database_query_time',
        threshold: 1000, // 1 second
        severity: 'warning',
        enabled: true,
        cooldownPeriod: 300000, // 5 minutes
      },
    ]
  }

  /**
   * Start monitoring performance metrics
   */
  private startMonitoring(): void {
    if (!this.isEnabled) return

    // Check metrics periodically
    setInterval(() => {
      this.checkPerformanceMetrics()
    }, 30000) // Check every 30 seconds
  }

  /**
   * Check performance metrics against thresholds
   */
  private checkPerformanceMetrics(): void {
    if (!this.isEnabled) return

    const performanceMonitor = getPerformanceMonitor()
    const coreWebVitals = performanceMonitor.getCoreWebVitals()
    const performanceSummary = performanceMonitor.getPerformanceSummary()

    // Check Core Web Vitals
    if (coreWebVitals) {
      this.checkThreshold('lcp', coreWebVitals.LCP)
      this.checkThreshold('fid', coreWebVitals.FID)
      this.checkThreshold('cls', coreWebVitals.CLS)
      this.checkThreshold('fcp', coreWebVitals.FCP)
      this.checkThreshold('ttfb', coreWebVitals.TTFB)
    }

    // Check performance summary metrics
    if (performanceSummary) {
      this.checkThreshold('page_load_time', performanceSummary.avgLoadTime)
      this.checkThreshold('resource_load_time', performanceSummary.avgResourceLoadTime)

      // Calculate error rate
      if (performanceSummary.totalInteractions > 0) {
        const errorRate = performanceSummary.totalErrors / performanceSummary.totalInteractions
        this.checkThreshold('error_rate', errorRate)
      }
    }
  }

  /**
   * Check a specific metric against its threshold
   * @param metric Metric name
   * @param value Metric value
   */
  private checkThreshold(metric: string, value: number): void {
    const thresholdConfig = this.thresholds.find((t) => t.metric === metric)

    if (!thresholdConfig || !thresholdConfig.enabled) {
      return
    }

    // Check if value exceeds threshold
    if (value > thresholdConfig.threshold) {
      // Check cooldown period
      const now = Date.now()
      const lastAlertTime = this.lastAlertTimes[metric] || 0

      if (now - lastAlertTime > thresholdConfig.cooldownPeriod) {
        // Create alert
        const alert: PerformanceAlert = {
          id: `${metric}-${now}`,
          timestamp: now,
          metric,
          value,
          threshold: thresholdConfig.threshold,
          severity: thresholdConfig.severity,
          message: `Performance alert: ${metric} (${value}) exceeded threshold (${thresholdConfig.threshold})`,
          tags: {
            metric,
            threshold: thresholdConfig.threshold.toString(),
            value: value.toString(),
          },
        }

        // Send alert
        this.sendAlert(alert)

        // Update last alert time
        this.lastAlertTimes[metric] = now
      }
    }
  }

  /**
   * Send performance alert to all registered callbacks
   * @param alert Performance alert to send
   */
  private sendAlert(alert: PerformanceAlert): void {
    logger.warn(`Performance Alert: ${alert.message}`)

    // Send to all callbacks
    for (const callback of this.callbacks) {
      try {
        callback(alert)
      } catch (error) {
        logger.error('Error in performance alert callback:', error)
      }
    }
  }

  /**
   * Add alert callback
   * @param callback Function to call when alert is triggered
   */
  public addAlertCallback(callback: AlertCallback): void {
    this.callbacks.push(callback)
  }

  /**
   * Remove alert callback
   * @param callback Function to remove
   */
  public removeAlertCallback(callback: AlertCallback): void {
    const index = this.callbacks.indexOf(callback)
    if (index !== -1) {
      this.callbacks.splice(index, 1)
    }
  }

  /**
   * Update threshold configuration
   * @param metric Metric name
   * @param threshold New threshold value
   * @param severity Alert severity
   * @param enabled Whether threshold is enabled
   * @param cooldownPeriod Cooldown period in milliseconds
   */
  public updateThreshold(
    metric: string,
    threshold: number,
    severity: AlertSeverity = 'warning',
    enabled: boolean = true,
    cooldownPeriod: number = 300000
  ): void {
    const existingThreshold = this.thresholds.find((t) => t.metric === metric)

    if (existingThreshold) {
      existingThreshold.threshold = threshold
      existingThreshold.severity = severity
      existingThreshold.enabled = enabled
      existingThreshold.cooldownPeriod = cooldownPeriod
    } else {
      this.thresholds.push({
        metric,
        threshold,
        severity,
        enabled,
        cooldownPeriod,
      })
    }
  }

  /**
   * Enable performance alerting
   */
  public enable(): void {
    this.isEnabled = true
    this.startMonitoring()
  }

  /**
   * Disable performance alerting
   */
  public disable(): void {
    this.isEnabled = false
  }

  /**
   * Check if alerting is enabled
   * @returns Boolean indicating if alerting is enabled
   */
  public isEnabledAlerting(): boolean {
    return this.isEnabled
  }

  /**
   * Get current alert thresholds
   * @returns Array of alert thresholds
   */
  public getThresholds(): AlertThreshold[] {
    return [...this.thresholds]
  }

  /**
   * Clear last alert times (for testing)
   */
  public clearLastAlertTimes(): void {
    this.lastAlertTimes = {}
  }
}

// Export singleton instance
export const performanceAlertingService = new PerformanceAlertingService()
