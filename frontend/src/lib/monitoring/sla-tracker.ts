/**
 * SLA Tracker Service for Georgian Distribution System
 * Tracks p50, p95, p99 latencies for all API endpoints with minimal performance overhead
 * Integrates with existing performance monitoring and provides external monitoring export
 */

import { logger } from '@/lib/logger'

export interface EndpointMetrics {
  endpoint: string
  method: string
  timestamps: number[] // Unix timestamps in milliseconds
  durations: number[] // Response times in milliseconds
  statusCodes: number[]
  errorCount: number
  successCount: number
  lastUpdated: number
}

export interface SLAReport {
  endpoint: string
  method: string
  period: string
  totalRequests: number
  successRate: number
  errorRate: number
  avgResponseTime: number
  p50Latency: number
  p95Latency: number
  p99Latency: number
  throughput: number // requests per second
  timestamp: string
}

export interface ExternalMonitoringData {
  service: 'sentry' | 'datadog' | 'prometheus' | 'custom'
  format: 'json' | 'metrics' | 'opentelemetry'
  data: any
  timestamp: string
}

export interface SLALimits {
  p50Max: number // Maximum acceptable p50 latency in ms
  p95Max: number // Maximum acceptable p95 latency in ms
  p99Max: number // Maximum acceptable p99 latency in ms
  minSuccessRate: number // Minimum success rate (0.0 - 1.0)
  maxErrorRate: number // Maximum error rate (0.0 - 1.0)
}

export interface AlertThreshold {
  warning: number // Warning threshold multiplier
  critical: number // Critical threshold multiplier
}

export interface EndpointConfig {
  endpoint: string
  method: string
  limits: SLALimits
  alerts: AlertThreshold
  enabled: boolean
}

class SLATracker {
  private metrics: Map<string, EndpointMetrics> = new Map()
  private configs: Map<string, EndpointConfig> = new Map()
  private readonly MAX_DATA_POINTS = 10000 // Maximum data points per endpoint
  private readonly RETENTION_PERIOD = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
  private readonly CLEANUP_INTERVAL = 60 * 60 * 1000 // 1 hour
  private alertCallbacks: Map<string, Array<(report: SLAReport) => void>> = new Map()
  private externalExporters: Array<(data: ExternalMonitoringData) => void> = []

  constructor() {
    // Start periodic cleanup
    this.startCleanupScheduler()
  }

  /**
   * Record an API endpoint request with minimal overhead
   */
  recordRequest(
    endpoint: string,
    method: string,
    duration: number,
    statusCode: number,
    timestamp: number = Date.now()
  ): void {
    const key = this.getEndpointKey(endpoint, method)

    let metrics = this.metrics.get(key)
    if (!metrics) {
      metrics = this.createEndpointMetrics(endpoint, method)
      this.metrics.set(key, metrics)
    }

    // Update metrics with minimal allocations
    metrics.timestamps.push(timestamp)
    metrics.durations.push(duration)
    metrics.statusCodes.push(statusCode)

    if (statusCode >= 200 && statusCode < 300) {
      metrics.successCount++
    } else {
      metrics.errorCount++
    }

    metrics.lastUpdated = timestamp

    // Keep data size bounded
    this.boundDataSize(metrics)

    // Check for SLA violations (async to avoid blocking)
    setTimeout(() => this.checkSLAViolations(key), 0)
  }

  /**
   * Get current SLA report for an endpoint
   */
  getSLAReport(endpoint: string, method: string, period: string = '1h'): SLAReport {
    const key = this.getEndpointKey(endpoint, method)
    const metrics = this.metrics.get(key)

    if (!metrics) {
      return this.createEmptyReport(endpoint, method, period)
    }

    const cutoffTime = this.getCutoffTime(period)
    const validData = this.getValidData(metrics, cutoffTime)

    if (validData.durations.length === 0) {
      return this.createEmptyReport(endpoint, method, period)
    }

    // Calculate statistics with minimal allocations
    const totalRequests = validData.durations.length
    const successCount = validData.statusCodes.filter(
      (code) => code !== undefined && code >= 200 && code < 300
    ).length
    const errorCount = totalRequests - successCount

    const successRate = successCount / totalRequests
    const errorRate = errorCount / totalRequests

    const avgResponseTime = this.calculateAverage(validData.durations)
    const sortedDurations = [...validData.durations].sort((a, b) => (a ?? 0) - (b ?? 0))

    const p50Latency = this.calculatePercentile(sortedDurations, 50)
    const p95Latency = this.calculatePercentile(sortedDurations, 95)
    const p99Latency = this.calculatePercentile(sortedDurations, 99)

    const periodMs = this.getPeriodMilliseconds(period)
    const throughput = totalRequests / (periodMs / 1000)

    return {
      endpoint,
      method,
      period,
      totalRequests,
      successRate,
      errorRate,
      avgResponseTime,
      p50Latency,
      p95Latency,
      p99Latency,
      throughput,
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Get SLA reports for all endpoints
   */
  getAllSLAReports(period: string = '1h'): SLAReport[] {
    const reports: SLAReport[] = []

    this.metrics.forEach((metrics, key) => {
      const [endpoint, method] = key.split('::')
      if (endpoint && method) {
        const report = this.getSLAReport(endpoint, method, period)
        reports.push(report)
      }
    })

    return reports
  }

  /**
   * Configure SLA limits for an endpoint
   */
  configureEndpoint(config: EndpointConfig): void {
    const key = this.getEndpointKey(config.endpoint, config.method)
    this.configs.set(key, config)
  }

  /**
   * Add alert callback for SLA violations
   */
  addAlertCallback(endpoint: string, method: string, callback: (report: SLAReport) => void): void {
    const key = this.getEndpointKey(endpoint, method)
    if (!this.alertCallbacks.has(key)) {
      this.alertCallbacks.set(key, [])
    }
    this.alertCallbacks.get(key)!.push(callback)
  }

  /**
   * Add external monitoring exporter
   */
  addExternalExporter(exporter: (data: ExternalMonitoringData) => void): void {
    this.externalExporters.push(exporter)
  }

  /**
   * Export metrics for external monitoring systems
   */
  exportForSentry(tags?: Record<string, string>): void {
    const reports = this.getAllSLAReports('1h')
    const sentryData = {
      type: 'sla_report',
      timestamp: new Date().toISOString(),
      reports: reports.map((report) => ({
        endpoint: report.endpoint,
        method: report.method,
        p50Latency: report.p50Latency,
        p95Latency: report.p95Latency,
        p99Latency: report.p99Latency,
        successRate: report.successRate,
        errorRate: report.errorRate,
        ...tags,
      })),
    }

    this.externalExporters.forEach((exporter) => {
      exporter({
        service: 'sentry',
        format: 'json',
        data: sentryData,
        timestamp: new Date().toISOString(),
      })
    })
  }

  /**
   * Export metrics for DataDog
   */
  exportForDataDog(): void {
    const reports = this.getAllSLAReports('1h')
    const datadogMetrics = reports.flatMap((report) => [
      {
        metric: 'api.latency.p50',
        value: report.p50Latency,
        tags: [`endpoint:${report.endpoint}`, `method:${report.method}`],
      },
      {
        metric: 'api.latency.p95',
        value: report.p95Latency,
        tags: [`endpoint:${report.endpoint}`, `method:${report.method}`],
      },
      {
        metric: 'api.latency.p99',
        value: report.p99Latency,
        tags: [`endpoint:${report.endpoint}`, `method:${report.method}`],
      },
      {
        metric: 'api.success_rate',
        value: report.successRate,
        tags: [`endpoint:${report.endpoint}`, `method:${report.method}`],
      },
      {
        metric: 'api.error_rate',
        value: report.errorRate,
        tags: [`endpoint:${report.endpoint}`, `method:${report.method}`],
      },
      {
        metric: 'api.throughput',
        value: report.throughput,
        tags: [`endpoint:${report.endpoint}`, `method:${report.method}`],
      },
    ])

    this.externalExporters.forEach((exporter) => {
      exporter({
        service: 'datadog',
        format: 'metrics',
        data: datadogMetrics,
        timestamp: new Date().toISOString(),
      })
    })
  }

  /**
   * Export metrics in OpenTelemetry format
   */
  exportForOpenTelemetry(): void {
    const reports = this.getAllSLAReports('1h')
    const otelData = {
      resourceMetrics: [
        {
          resource: {
            attributes: [
              { key: 'service.name', value: { stringValue: 'georgian-distribution' } },
              { key: 'service.version', value: { stringValue: '1.0.0' } },
            ],
          },
          scopeMetrics: [
            {
              scope: { name: 'sla-tracker', version: '1.0.0' },
              metrics: reports.flatMap((report) => [
                {
                  name: 'http_request_duration_seconds',
                  description: 'HTTP request duration in seconds',
                  data: {
                    sum: {
                      dataPoints: [
                        {
                          value: report.avgResponseTime / 1000,
                          attributes: [
                            { key: 'http.method', value: { stringValue: report.method } },
                            { key: 'http.route', value: { stringValue: report.endpoint } },
                          ],
                        },
                      ],
                    },
                  },
                },
                {
                  name: 'http_request_errors_total',
                  description: 'Total number of HTTP request errors',
                  data: {
                    sum: {
                      dataPoints: [
                        {
                          value: report.totalRequests * report.errorRate,
                          attributes: [
                            { key: 'http.method', value: { stringValue: report.method } },
                            { key: 'http.route', value: { stringValue: report.endpoint } },
                          ],
                        },
                      ],
                    },
                  },
                },
              ]),
            },
          ],
        },
      ],
    }

    this.externalExporters.forEach((exporter) => {
      exporter({
        service: 'prometheus',
        format: 'opentelemetry',
        data: otelData,
        timestamp: new Date().toISOString(),
      })
    })
  }

  /**
   * Get current statistics summary
   */
  getStatistics() {
    let totalEndpoints = 0
    let totalRequests = 0
    let totalErrors = 0
    let avgResponseTime = 0

    this.metrics.forEach((metrics) => {
      totalEndpoints++
      totalRequests += metrics.successCount + metrics.errorCount
      totalErrors += metrics.errorCount

      if (metrics.durations.length > 0) {
        avgResponseTime += this.calculateAverage(metrics.durations)
      }
    })

    return {
      totalEndpoints,
      totalRequests,
      totalErrors,
      avgResponseTime: totalEndpoints > 0 ? avgResponseTime / totalEndpoints : 0,
      configuredEndpoints: this.configs.size,
      lastCleanup: new Date().toISOString(),
    }
  }

  // Private helper methods

  private createEndpointMetrics(endpoint: string, method: string): EndpointMetrics {
    return {
      endpoint,
      method,
      timestamps: [],
      durations: [],
      statusCodes: [],
      errorCount: 0,
      successCount: 0,
      lastUpdated: Date.now(),
    }
  }

  private getEndpointKey(endpoint: string, method: string): string {
    return `${method.toUpperCase()}::${endpoint}`
  }

  private boundDataSize(metrics: EndpointMetrics): void {
    // Remove oldest data points if we exceed the limit
    while (metrics.timestamps.length > this.MAX_DATA_POINTS) {
      metrics.timestamps.shift()
      metrics.durations.shift()
      metrics.statusCodes.shift()

      // Recalculate counts (less expensive than tracking individually)
      const successCount = metrics.statusCodes.filter((code) => code >= 200 && code < 300).length
      metrics.successCount = successCount
      metrics.errorCount = metrics.statusCodes.length - successCount
    }
  }

  private getValidData(metrics: EndpointMetrics, cutoffTime: number) {
    const validIndices = metrics.timestamps
      .map((timestamp, index) => (timestamp !== undefined ? { timestamp, index } : null))
      .filter(
        (item): item is { timestamp: number; index: number } =>
          item !== null && item.timestamp >= cutoffTime
      )
      .map((item) => item.index)

    return {
      durations: validIndices
        .map((index) => metrics.durations[index])
        .filter((d): d is number => d !== undefined),
      statusCodes: validIndices
        .map((index) => metrics.statusCodes[index])
        .filter((s): s is number => s !== undefined),
      timestamps: validIndices
        .map((index) => metrics.timestamps[index])
        .filter((t): t is number => t !== undefined),
    }
  }

  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length
  }

  private calculatePercentile(sortedNumbers: number[], percentile: number): number {
    if (sortedNumbers.length === 0) return 0

    const index = Math.ceil((percentile / 100) * sortedNumbers.length) - 1
    return sortedNumbers[Math.max(0, Math.min(index, sortedNumbers.length - 1))] ?? 0
  }

  private getCutoffTime(period: string): number {
    const now = Date.now()
    switch (period) {
      case '5m':
        return now - 5 * 60 * 1000
      case '15m':
        return now - 15 * 60 * 1000
      case '1h':
        return now - 60 * 60 * 1000
      case '6h':
        return now - 6 * 60 * 60 * 1000
      case '24h':
        return now - 24 * 60 * 60 * 1000
      case '7d':
        return now - 7 * 24 * 60 * 60 * 1000
      default:
        return now - 60 * 60 * 1000
    }
  }

  private getPeriodMilliseconds(period: string): number {
    switch (period) {
      case '5m':
        return 5 * 60 * 1000
      case '15m':
        return 15 * 60 * 1000
      case '1h':
        return 60 * 60 * 1000
      case '6h':
        return 6 * 60 * 60 * 1000
      case '24h':
        return 24 * 60 * 60 * 1000
      case '7d':
        return 7 * 24 * 60 * 60 * 1000
      default:
        return 60 * 60 * 1000
    }
  }

  private createEmptyReport(endpoint: string, method: string, period: string): SLAReport {
    return {
      endpoint,
      method,
      period,
      totalRequests: 0,
      successRate: 0,
      errorRate: 0,
      avgResponseTime: 0,
      p50Latency: 0,
      p95Latency: 0,
      p99Latency: 0,
      throughput: 0,
      timestamp: new Date().toISOString(),
    }
  }

  private async checkSLAViolations(endpointKey: string): Promise<void> {
    const [endpoint, method] = endpointKey.split('::')
    const config = this.configs.get(endpointKey)

    if (!config || !config.enabled || !endpoint || !method) return

    const report = this.getSLAReport(endpoint, method, '1h')

    // Check latency violations
    if (report.p50Latency > config.limits.p50Max * config.alerts.warning) {
      this.triggerAlert(endpointKey, report, 'p50_latency_warning')
    }

    if (report.p95Latency > config.limits.p95Max * config.alerts.warning) {
      this.triggerAlert(endpointKey, report, 'p95_latency_warning')
    }

    if (report.p99Latency > config.limits.p99Max * config.alerts.warning) {
      this.triggerAlert(endpointKey, report, 'p99_latency_warning')
    }

    // Check error rate violations
    if (report.errorRate > config.limits.maxErrorRate * config.alerts.warning) {
      this.triggerAlert(endpointKey, report, 'error_rate_warning')
    }

    // Critical violations
    if (report.p99Latency > config.limits.p99Max * config.alerts.critical) {
      this.triggerAlert(endpointKey, report, 'p99_latency_critical')
    }

    if (report.errorRate > config.limits.maxErrorRate * config.alerts.critical) {
      this.triggerAlert(endpointKey, report, 'error_rate_critical')
    }
  }

  private triggerAlert(endpointKey: string, report: SLAReport, alertType: string): void {
    const callbacks = this.alertCallbacks.get(endpointKey)
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(report)
        } catch (error) {
          logger.error('SLA alert callback error:', error)
        }
      })
    }

    // Log the alert
    logger.warn(`SLA Alert [${alertType}]: ${report.endpoint} ${report.method}`, {
      p50Latency: report.p50Latency,
      p95Latency: report.p95Latency,
      p99Latency: report.p99Latency,
      errorRate: report.errorRate,
      successRate: report.successRate,
    })
  }

  private startCleanupScheduler(): void {
    setInterval(() => {
      this.cleanupOldData()
    }, this.CLEANUP_INTERVAL)
  }

  private cleanupOldData(): void {
    const cutoffTime = Date.now() - this.RETENTION_PERIOD

    this.metrics.forEach((metrics, key) => {
      // Remove old data points
      const validIndices = metrics.timestamps
        .map((timestamp, index) => ({ timestamp, index }))
        .filter((item) => item.timestamp >= cutoffTime)
        .map((item) => item.index)

      if (validIndices.length < metrics.timestamps.length) {
        metrics.timestamps = validIndices
          .map((index) => metrics.timestamps[index])
          .filter((t): t is number => t !== undefined)
        metrics.durations = validIndices
          .map((index) => metrics.durations[index])
          .filter((d): d is number => d !== undefined)
        metrics.statusCodes = validIndices
          .map((index) => metrics.statusCodes[index])
          .filter((s): s is number => s !== undefined)

        // Recalculate counts
        const successCount = metrics.statusCodes.filter(
          (code) => code !== undefined && code >= 200 && code < 300
        ).length
        metrics.successCount = successCount
        metrics.errorCount = metrics.statusCodes.length - successCount
      }

      // Remove endpoints with no data
      if (metrics.timestamps.length === 0) {
        this.metrics.delete(key)
      }
    })
  }

  /**
   * Clear all data (for testing)
   */
  clear(): void {
    this.metrics.clear()
  }
}

// Export singleton instance
export const slaTracker = new SLATracker()

// Export helper functions for easy integration
export const recordAPIRequest = (
  endpoint: string,
  method: string,
  duration: number,
  statusCode: number
) => {
  slaTracker.recordRequest(endpoint, method, duration, statusCode)
}

export const getSLAReport = (endpoint: string, method: string, period?: string) => {
  return slaTracker.getSLAReport(endpoint, method, period)
}

export const configureSLA = (config: EndpointConfig) => {
  slaTracker.configureEndpoint(config)
}

export const addSLAAlert = (
  endpoint: string,
  method: string,
  callback: (report: SLAReport) => void
) => {
  slaTracker.addAlertCallback(endpoint, method, callback)
}

// Example usage and integration guide
export const SLA_INTEGRATION_EXAMPLE = `
/**
 * Integration Example for Next.js API Routes
 */

// pages/api/orders.ts or app/api/orders/route.ts
import { logger } from '@/lib/logger'
import { recordAPIRequest } from '@/lib/monitoring/sla-tracker';

export async function POST(request: Request) {
  const startTime = Date.now();
  
  try {
    // Your API logic here
    const result = await processOrder(request);
    
    // Record successful request
    const duration = Date.now() - startTime;
    recordAPIRequest('/api/orders', 'POST', duration, 200);
    
    return Response.json(result);
  } catch (error) {
    // Record failed request
    const duration = Date.now() - startTime;
    recordAPIRequest('/api/orders', 'POST', duration, 500);
    
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Configuration Example
 */
import { configureSLA } from '@/lib/monitoring/sla-tracker';

// Configure SLA limits for critical endpoints
configureSLA({
  endpoint: '/api/orders',
  method: 'POST',
  limits: {
    p50Max: 500,   // 500ms max for p50
    p95Max: 1000,  // 1s max for p95
    p99Max: 2000,  // 2s max for p99
    minSuccessRate: 0.95, // 95% minimum success rate
    maxErrorRate: 0.05     // 5% maximum error rate
  },
  alerts: {
    warning: 1.2,  // Alert at 120% of limits
    critical: 1.5  // Critical alert at 150% of limits
  },
  enabled: true
});

/**
 * External Monitoring Integration
 */
import { slaTracker } from '@/lib/monitoring/sla-tracker';

// Add custom exporter for your monitoring system
slaTracker.addExternalExporter((data) => {
  if (data.service === 'custom') {
    // Send to your monitoring system
    fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }
});

// Periodic export for external monitoring
setInterval(() => {
  slaTracker.exportForSentry({ environment: process.env.NODE_ENV });
  slaTracker.exportForDataDog();
}, 5 * 60 * 1000); // Every 5 minutes
`
