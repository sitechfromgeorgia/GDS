/**
 * WebSocket Latency Tracking Utility
 * T028: Measures baseline and post-optimization WebSocket latency
 *
 * Features:
 * - Message send/receive time tracking
 * - p50, p95, p99 percentile calculation
 * - Performance degradation detection
 * - Automatic metric reporting
 */

export interface LatencyMeasurement {
  messageId: string
  sentAt: number
  receivedAt: number
  latencyMs: number
  channelName: string
  eventType: string
}

export interface LatencyStats {
  count: number
  min: number
  max: number
  mean: number
  p50: number
  p95: number
  p99: number
  measurements: LatencyMeasurement[]
}

export class WebSocketLatencyTracker {
  private measurements: Map<string, LatencyMeasurement> = new Map()
  private pendingMessages: Map<string, number> = new Map() // messageId -> sentAt timestamp
  private maxMeasurements: number
  private onLatencyUpdate?: (stats: LatencyStats) => void

  constructor(maxMeasurements = 1000, onLatencyUpdate?: (stats: LatencyStats) => void) {
    this.maxMeasurements = maxMeasurements
    this.onLatencyUpdate = onLatencyUpdate
  }

  /**
   * Track message send time
   * T028: Call this when sending a message
   */
  trackSend(messageId: string): void {
    this.pendingMessages.set(messageId, Date.now())
  }

  /**
   * Track message receive time and calculate latency
   * T028: Call this when receiving a response/update
   */
  trackReceive(
    messageId: string,
    channelName: string,
    eventType: string
  ): LatencyMeasurement | null {
    const sentAt = this.pendingMessages.get(messageId)

    if (!sentAt) {
      // Message not tracked or already processed
      return null
    }

    const receivedAt = Date.now()
    const latencyMs = receivedAt - sentAt

    const measurement: LatencyMeasurement = {
      messageId,
      sentAt,
      receivedAt,
      latencyMs,
      channelName,
      eventType,
    }

    // Store measurement
    this.measurements.set(messageId, measurement)
    this.pendingMessages.delete(messageId)

    // Enforce max measurements (keep most recent)
    if (this.measurements.size > this.maxMeasurements) {
      const oldestKey = this.measurements.keys().next().value
      if (oldestKey !== undefined) {
        this.measurements.delete(oldestKey)
      }
    }

    // Trigger stats update callback
    if (this.onLatencyUpdate) {
      this.onLatencyUpdate(this.getStats())
    }

    return measurement
  }

  /**
   * Calculate latency statistics
   * T028: Returns p50, p95, p99 percentiles
   */
  getStats(): LatencyStats {
    const measurements = Array.from(this.measurements.values())
    const latencies = measurements.map((m) => m.latencyMs).sort((a, b) => a - b)

    if (latencies.length === 0) {
      return {
        count: 0,
        min: 0,
        max: 0,
        mean: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        measurements: [],
      }
    }

    const count = latencies.length
    const min = latencies[0] ?? 0
    const max = latencies[count - 1] ?? 0
    const mean = latencies.reduce((sum, val) => sum + val, 0) / count

    // Calculate percentiles
    const p50 = this.percentile(latencies, 0.5)
    const p95 = this.percentile(latencies, 0.95)
    const p99 = this.percentile(latencies, 0.99)

    return {
      count,
      min,
      max,
      mean,
      p50,
      p95,
      p99,
      measurements,
    }
  }

  /**
   * Get stats for a specific channel
   */
  getStatsByChannel(channelName: string): LatencyStats {
    const channelMeasurements = Array.from(this.measurements.values()).filter(
      (m) => m.channelName === channelName
    )
    const latencies = channelMeasurements.map((m) => m.latencyMs).sort((a, b) => a - b)

    if (latencies.length === 0) {
      return {
        count: 0,
        min: 0,
        max: 0,
        mean: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        measurements: [],
      }
    }

    const count = latencies.length
    const min = latencies[0] ?? 0
    const max = latencies[count - 1] ?? 0
    const mean = latencies.reduce((sum, val) => sum + val, 0) / count

    return {
      count,
      min,
      max,
      mean,
      p50: this.percentile(latencies, 0.5),
      p95: this.percentile(latencies, 0.95),
      p99: this.percentile(latencies, 0.99),
      measurements: channelMeasurements,
    }
  }

  /**
   * Check if latency exceeds threshold
   * T030: Validates <200ms p99 requirement
   */
  isLatencyAcceptable(threshold = 200): boolean {
    const stats = this.getStats()
    return stats.p99 < threshold
  }

  /**
   * Get recent measurements (last N)
   */
  getRecentMeasurements(count = 10): LatencyMeasurement[] {
    return Array.from(this.measurements.values())
      .sort((a, b) => b.receivedAt - a.receivedAt)
      .slice(0, count)
  }

  /**
   * Clear all measurements
   */
  clear(): void {
    this.measurements.clear()
    this.pendingMessages.clear()
  }

  /**
   * Export measurements for analysis
   * T028: For baseline vs optimized comparison
   */
  exportMeasurements(): LatencyMeasurement[] {
    return Array.from(this.measurements.values())
  }

  /**
   * Calculate percentile from sorted array
   */
  private percentile(sortedValues: number[], percentile: number): number {
    if (sortedValues.length === 0) return 0

    const index = Math.ceil(sortedValues.length * percentile) - 1
    return sortedValues[Math.max(0, index)] ?? 0
  }

  /**
   * Generate performance report
   * T028, T030: Compare baseline vs optimized
   */
  generateReport(): string {
    const stats = this.getStats()

    return `
WebSocket Latency Report
========================
Measurements: ${stats.count}
Min: ${stats.min.toFixed(2)}ms
Max: ${stats.max.toFixed(2)}ms
Mean: ${stats.mean.toFixed(2)}ms
p50: ${stats.p50.toFixed(2)}ms
p95: ${stats.p95.toFixed(2)}ms
p99: ${stats.p99.toFixed(2)}ms ← Target: <200ms

Status: ${this.isLatencyAcceptable() ? '✅ PASS' : '❌ FAIL'}

Recent Measurements (last 5):
${this.getRecentMeasurements(5)
  .map((m, i) => `${i + 1}. ${m.channelName} / ${m.eventType}: ${m.latencyMs.toFixed(2)}ms`)
  .join('\n')}
    `.trim()
  }
}

// Singleton instance for global latency tracking
let globalLatencyTracker: WebSocketLatencyTracker | null = null

/**
 * Get or create global latency tracker
 * T028: Use this for consistent tracking across app
 */
export function getLatencyTracker(
  onLatencyUpdate?: (stats: LatencyStats) => void
): WebSocketLatencyTracker {
  if (!globalLatencyTracker) {
    globalLatencyTracker = new WebSocketLatencyTracker(1000, onLatencyUpdate)
  }
  return globalLatencyTracker
}

/**
 * Reset global latency tracker
 * T028: Use between baseline and optimization measurements
 */
export function resetLatencyTracker(): void {
  if (globalLatencyTracker) {
    globalLatencyTracker.clear()
  }
}
