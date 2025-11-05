import { logger } from '@/lib/logger'
import type { Database } from '../supabase/client'

/**
 * Performance Monitoring Utility for Georgian Distribution System
 * Tracks API response times, database query performance, and system metrics
 */

export interface PerformanceMetrics {
  timestamp: string
  operation: string
  duration: number
  status: 'success' | 'error' | 'timeout'
  details?: any
  metadata?: Record<string, any>
}

export interface PerformanceReport {
  period: string
  totalOperations: number
  successfulOperations: number
  failedOperations: number
  averageResponseTime: number
  p50ResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  slowOperations: PerformanceMetrics[]
  errors: PerformanceMetrics[]
  trends: {
    responseTimeTrend: 'improving' | 'stable' | 'degrading'
    errorRateTrend: 'improving' | 'stable' | 'degrading'
    operationsPerSecond: number
  }
  recommendations: string[]
}

export interface DatabaseQueryMetrics {
  query: string
  table: string
  executionTime: number
  rowsAffected: number
  timestamp: string
  userId?: string
  status: 'success' | 'error'
  errorMessage?: string
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private dbMetrics: DatabaseQueryMetrics[] = []
  private readonly MAX_METRICS = 1000 // Keep last 1000 metrics
  private readonly SLOW_QUERY_THRESHOLD = 500 // milliseconds
  private readonly ERROR_RATE_THRESHOLD = 0.05 // 5%

  private alertCallbacks: Array<(metrics: PerformanceMetrics) => void> = []

  /**
   * Record a performance metric
   */
  recordMetric(
    operation: string,
    duration: number,
    status: 'success' | 'error' | 'timeout',
    details?: any
  ): void {
    const metric: PerformanceMetrics = {
      timestamp: new Date().toISOString(),
      operation,
      duration,
      status,
      details,
      metadata: {
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
        url: typeof window !== 'undefined' ? window.location.href : 'server',
        environment: process.env.NODE_ENV || 'development',
      },
    }

    this.metrics.push(metric)

    // Keep only the most recent metrics to prevent memory issues
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS)
    }

    // Check for alerts
    this.checkAlerts(metric)
  }

  /**
   * Record a database query metric
   */
  recordDatabaseMetric(
    query: string,
    table: string,
    executionTime: number,
    rowsAffected: number,
    status: 'success' | 'error',
    errorMessage?: string,
    userId?: string
  ): void {
    const metric: DatabaseQueryMetrics = {
      query,
      table,
      executionTime,
      rowsAffected,
      timestamp: new Date().toISOString(),
      userId,
      status,
      errorMessage,
    }

    this.dbMetrics.push(metric)

    // Keep only the most recent metrics
    if (this.dbMetrics.length > this.MAX_METRICS) {
      this.dbMetrics = this.dbMetrics.slice(-this.MAX_METRICS)
    }

    // Log slow queries immediately
    if (executionTime > this.SLOW_QUERY_THRESHOLD) {
      logger.warn(
        `🐌 Slow query detected: ${table}.${query} took ${executionTime}ms (${rowsAffected} rows)`
      )
    }

    // Record as performance metric as well
    this.recordMetric(`db:${table}:${query}`, executionTime, status, {
      rowsAffected,
      errorMessage,
    })
  }

  /**
   * Generate performance report for a time period
   */
  generateReport(period: '1h' | '24h' | '7d' | '30d' = '24h'): PerformanceReport {
    const now = new Date()
    const cutoffTime = new Date()

    switch (period) {
      case '1h':
        cutoffTime.setHours(now.getHours() - 1)
        break
      case '24h':
        cutoffTime.setDate(now.getDate() - 1)
        break
      case '7d':
        cutoffTime.setDate(now.getDate() - 7)
        break
      case '30d':
        cutoffTime.setDate(now.getDate() - 30)
        break
    }

    const periodMetrics = this.metrics.filter((m) => new Date(m.timestamp) >= cutoffTime)
    const totalOperations = periodMetrics.length
    const successfulOperations = periodMetrics.filter((m) => m.status === 'success').length
    const failedOperations = periodMetrics.filter((m) => m.status === 'error').length

    const responseTimes = periodMetrics
      .filter((m) => m.status === 'success')
      .map((m) => m.duration)
      .sort((a, b) => a - b)

    const averageResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
        : 0

    const percentile = (arr: number[], p: number): number => {
      if (arr.length === 0) return 0
      const index = Math.ceil((p / 100) * arr.length) - 1
      return arr[Math.max(0, Math.min(index, arr.length - 1))] ?? 0
    }

    const slowOperations = periodMetrics.filter((m) => m.duration > 1000)
    const errors = periodMetrics.filter((m) => m.status === 'error')

    // Calculate trends (simplified - comparing first half vs second half of period)
    const midPoint = Math.floor(periodMetrics.length / 2)
    const firstHalf = periodMetrics.slice(0, midPoint)
    const secondHalf = periodMetrics.slice(midPoint)

    const firstHalfAvg =
      firstHalf.length > 0
        ? firstHalf.reduce((sum, m) => sum + m.duration, 0) / firstHalf.length
        : 0
    const secondHalfAvg =
      secondHalf.length > 0
        ? secondHalf.reduce((sum, m) => sum + m.duration, 0) / secondHalf.length
        : 0

    let responseTimeTrend: 'improving' | 'stable' | 'degrading' = 'stable'
    if (firstHalfAvg > 0 && secondHalfAvg > 0) {
      const change = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100
      if (change > 10) responseTimeTrend = 'degrading'
      else if (change < -10) responseTimeTrend = 'improving'
    }

    const firstHalfErrorRate =
      firstHalf.length > 0
        ? firstHalf.filter((m) => m.status === 'error').length / firstHalf.length
        : 0
    const secondHalfErrorRate =
      secondHalf.length > 0
        ? secondHalf.filter((m) => m.status === 'error').length / secondHalf.length
        : 0

    let errorRateTrend: 'improving' | 'stable' | 'degrading' = 'stable'
    if (firstHalfErrorRate > 0 && secondHalfErrorRate > 0) {
      const change = ((secondHalfErrorRate - firstHalfErrorRate) / firstHalfErrorRate) * 100
      if (change > 20) errorRateTrend = 'degrading'
      else if (change < -20) errorRateTrend = 'improving'
    }

    const duration =
      period === '1h' ? 3600 : period === '24h' ? 86400 : period === '7d' ? 604800 : 2592000
    const operationsPerSecond = totalOperations / duration

    const recommendations = this.generateRecommendations({
      averageResponseTime,
      p95ResponseTime: percentile(responseTimes, 95),
      errorRate: failedOperations / totalOperations,
      slowOperationsCount: slowOperations.length,
      operationsPerSecond,
    })

    return {
      period,
      totalOperations,
      successfulOperations,
      failedOperations,
      averageResponseTime,
      p50ResponseTime: percentile(responseTimes, 50),
      p95ResponseTime: percentile(responseTimes, 95),
      p99ResponseTime: percentile(responseTimes, 99),
      slowOperations,
      errors,
      trends: {
        responseTimeTrend,
        errorRateTrend,
        operationsPerSecond,
      },
      recommendations,
    }
  }

  /**
   * Generate actionable recommendations based on performance data
   */
  private generateRecommendations(metrics: {
    averageResponseTime: number
    p95ResponseTime: number
    errorRate: number
    slowOperationsCount: number
    operationsPerSecond: number
  }): string[] {
    const recommendations: string[] = []

    if (metrics.averageResponseTime > 1000) {
      recommendations.push(
        '🐌 High average response time (>1s) - Consider query optimization and caching'
      )
    }

    if (metrics.p95ResponseTime > 2000) {
      recommendations.push(
        '🐌 High P95 response time (>2s) - Investigate worst-performing operations'
      )
    }

    if (metrics.errorRate > this.ERROR_RATE_THRESHOLD) {
      recommendations.push(
        `⚠️  High error rate (${(metrics.errorRate * 100).toFixed(1)}%) - Review error logs and fix critical issues`
      )
    }

    if (metrics.slowOperationsCount > 10) {
      recommendations.push(
        `🐌 Many slow operations (${metrics.slowOperationsCount}) - Optimize database queries and add indexes`
      )
    }

    if (metrics.operationsPerSecond > 100) {
      recommendations.push('⚡ High throughput - Consider connection pooling and load balancing')
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Performance is within acceptable parameters - Continue monitoring')
    }

    return recommendations
  }

  /**
   * Add alert callback for performance issues
   */
  addAlertCallback(callback: (metrics: PerformanceMetrics) => void): void {
    this.alertCallbacks.push(callback)
  }

  /**
   * Check if any alerts should be triggered
   */
  private checkAlerts(metric: PerformanceMetrics): void {
    if (metric.duration > 5000) {
      // Very slow operation (5+ seconds)
      logger.warn(
        `🚨 Critical: Very slow operation detected: ${metric.operation} took ${metric.duration}ms`
      )
    }

    if (metric.status === 'error') {
      // Error occurred
      logger.error(
        `🚨 Error in operation: ${metric.operation} - ${metric.details?.error || 'Unknown error'}`
      )
    }

    // Trigger callbacks
    this.alertCallbacks.forEach((callback) => {
      try {
        callback(metric)
      } catch (error) {
        logger.error('Alert callback error:', error)
      }
    })
  }

  /**
   * Get current performance statistics
   */
  getCurrentStats() {
    const recentMetrics = this.metrics.slice(-100) // Last 100 metrics
    const successCount = recentMetrics.filter((m) => m.status === 'success').length
    const avgDuration =
      recentMetrics.length > 0
        ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length
        : 0

    return {
      totalMetrics: this.metrics.length,
      recentMetrics: recentMetrics.length,
      successRate: recentMetrics.length > 0 ? successCount / recentMetrics.length : 0,
      averageResponseTime: avgDuration,
      lastUpdate:
        recentMetrics.length > 0
          ? (recentMetrics[recentMetrics.length - 1]?.timestamp ?? null)
          : null,
    }
  }

  /**
   * Export performance data for analysis
   */
  exportData(period: '1h' | '24h' | '7d' | '30d' = '24h') {
    const report = this.generateReport(period)
    const dbReport = this.generateDbReport(period)

    return {
      performance: report,
      database: dbReport,
      metadata: {
        exportedAt: new Date().toISOString(),
        period,
        systemInfo: {
          environment: process.env.NODE_ENV || 'development',
          nodeVersion: process.version,
          platform: process.platform,
          memoryUsage: process.memoryUsage(),
        },
      },
    }
  }

  /**
   * Generate database-specific performance report
   */
  private generateDbReport(period: string) {
    const now = new Date()
    const cutoffTime = new Date()

    switch (period) {
      case '1h':
        cutoffTime.setHours(now.getHours() - 1)
        break
      case '24h':
        cutoffTime.setDate(now.getDate() - 1)
        break
      case '7d':
        cutoffTime.setDate(now.getDate() - 7)
        break
      case '30d':
        cutoffTime.setDate(now.getDate() - 30)
        break
    }

    const periodDbMetrics = this.dbMetrics.filter((m) => new Date(m.timestamp) >= cutoffTime)

    const tableStats = periodDbMetrics.reduce(
      (acc, metric) => {
        if (!acc[metric.table]) {
          acc[metric.table] = {
            totalQueries: 0,
            totalTime: 0,
            errorCount: 0,
            slowQueries: 0,
          }
        }

        acc[metric.table].totalQueries++
        acc[metric.table].totalTime += metric.executionTime

        if (metric.status === 'error') {
          acc[metric.table].errorCount++
        }

        if (metric.executionTime > this.SLOW_QUERY_THRESHOLD) {
          acc[metric.table].slowQueries++
        }

        return acc
      },
      {} as Record<string, any>
    )

    // Calculate averages and identify problematic tables
    const tableAnalysis = Object.entries(tableStats)
      .map(([table, stats]) => ({
        table,
        avgExecutionTime: stats.totalTime / stats.totalQueries,
        errorRate: stats.errorCount / stats.totalQueries,
        slowQueryRate: stats.slowQueries / stats.totalQueries,
        totalQueries: stats.totalQueries,
      }))
      .sort((a, b) => b.avgExecutionTime - a.avgExecutionTime)

    return {
      totalQueries: periodDbMetrics.length,
      tables: tableAnalysis,
      slowQueries: periodDbMetrics.filter((m) => m.executionTime > this.SLOW_QUERY_THRESHOLD),
      errorQueries: periodDbMetrics.filter((m) => m.status === 'error'),
    }
  }

  /**
   * Clear all metrics (for testing or reset)
   */
  clear(): void {
    this.metrics = []
    this.dbMetrics = []
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor()

// Export helper functions for easy use
export const recordPerformance = (
  operation: string,
  duration: number,
  status: 'success' | 'error' | 'timeout',
  details?: any
) => {
  performanceMonitor.recordMetric(operation, duration, status, details)
}

export const recordDatabaseQuery = (
  query: string,
  table: string,
  executionTime: number,
  rowsAffected: number,
  status: 'success' | 'error',
  errorMessage?: string,
  userId?: string
) => {
  performanceMonitor.recordDatabaseMetric(
    query,
    table,
    executionTime,
    rowsAffected,
    status,
    errorMessage,
    userId
  )
}

export const getPerformanceReport = (period?: '1h' | '24h' | '7d' | '30d') => {
  return performanceMonitor.generateReport(period)
}

export const getCurrentStats = () => {
  return performanceMonitor.getCurrentStats()
}
