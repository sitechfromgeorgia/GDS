import { logger } from '@/lib/logger'

// Core Web Vitals types (simplified implementation)
interface Metric {
  name: string
  value: number
  id: string
  delta: number
  navigationType?: string
}

declare function getCLS(onReport: (metric: Metric) => void): void
declare function getFID(onReport: (metric: Metric) => void): void
declare function getFCP(onReport: (metric: Metric) => void): void
declare function getLCP(onReport: (metric: Metric) => void): void
declare function getTTFB(onReport: (metric: Metric) => void): void

/**
 * Web Vitals Monitoring for Georgian Distribution System
 * Tracks Core Web Vitals and React Compiler performance
 */

export interface WebVitalMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  id: string
  delta: number
  navigationType: string
  timestamp: number
}

export interface TurbopackMetric {
  buildStartTime: number
  buildEndTime?: number
  totalBuildTime?: number
  cacheHits: number
  cacheMisses: number
  modulesProcessed: number
  assetsGenerated: number
  hmrTime: number
  compilationSpeed: number
}

export interface ReactCompilerMetric {
  compilationTime: number
  optimizedComponents: number
  memoizedComponents: number
  eliminatedUpdates: number
  performanceScore: number
}

class PerformanceMonitor {
  private webVitals: WebVitalMetric[] = []
  private turbopackMetrics: TurbopackMetric[] = []
  private reactCompilerMetrics: ReactCompilerMetric[] = []
  private buildMetrics: {
    startTime: number
    endTime?: number
    phases: Record<string, { start: number; end?: number; duration?: number }>
  } = {
    startTime: Date.now(),
    phases: {},
  }

  constructor() {
    this.initializeWebVitals()
    this.initializePerformanceObservers()
  }

  private initializeWebVitals() {
    // Core Web Vitals tracking
    getCLS(this.onWebVital.bind(this))
    getFID(this.onWebVital.bind(this))
    getFCP(this.onWebVital.bind(this))
    getLCP(this.onWebVital.bind(this))
    getTTFB(this.onWebVital.bind(this))
  }

  private onWebVital(metric: Metric) {
    const webVital: WebVitalMetric = {
      name: metric.name,
      value: metric.value,
      rating: this.getVitalRating(metric.name, metric.value),
      id: metric.id,
      delta: metric.delta,
      navigationType: metric.navigationType || 'navigate',
      timestamp: Date.now(),
    }

    this.webVitals.push(webVital)

    // Keep only last 100 metrics to prevent memory issues
    if (this.webVitals.length > 100) {
      this.webVitals = this.webVitals.slice(-100)
    }

    // Send to analytics if enabled
    if (process.env.NEXT_PUBLIC_WEB_VITALS_ANALYTICS === 'true') {
      this.sendToAnalytics(webVital)
    }

    // Log critical issues
    if (webVital.rating === 'poor') {
      logger.warn(`🚨 Poor ${metric.name}: ${metric.value.toFixed(2)}ms`)
    }
  }

  private getVitalRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = {
      CLS: { good: 0.1, poor: 0.25 },
      FID: { good: 100, poor: 300 },
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      TTFB: { good: 800, poor: 1800 },
    }

    const threshold = thresholds[name as keyof typeof thresholds]
    if (!threshold) return 'good'

    if (value <= threshold.good) return 'good'
    if (value <= threshold.poor) return 'needs-improvement'
    return 'poor'
  }

  private initializePerformanceObservers() {
    // Performance Observer for custom metrics
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        // Navigation Timing
        const navigationObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.trackNavigationTiming(entry as PerformanceNavigationTiming)
          }
        })
        navigationObserver.observe({ entryTypes: ['navigation'] })

        // Resource Timing
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.trackResourceTiming(entry as PerformanceResourceTiming)
          }
        })
        resourceObserver.observe({ entryTypes: ['resource'] })

        // Long Tasks (React Compiler optimization)
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.trackLongTask(entry)
          }
        })
        longTaskObserver.observe({ entryTypes: ['longtask'] })
      } catch (error) {
        logger.warn('Performance Observer not supported:', { error })
      }
    }
  }

  private trackNavigationTiming(entry: PerformanceNavigationTiming) {
    const metrics = {
      dnsLookup: entry.domainLookupEnd - entry.domainLookupStart,
      tcpConnection: entry.connectEnd - entry.connectStart,
      serverResponse: entry.responseEnd - entry.requestStart,
      domProcessing: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      pageLoad: entry.loadEventEnd - entry.loadEventStart,
    }

    logger.info('🌐 Navigation Timing:', metrics)
  }

  private trackResourceTiming(entry: PerformanceResourceTiming) {
    // Track resource loading performance
    if (entry.duration > 1000) {
      logger.warn(`🐌 Slow resource: ${entry.name} took ${entry.duration.toFixed(2)}ms`)
    }
  }

  private trackLongTask(entry: PerformanceEntry) {
    // Long tasks indicate React Compiler may need optimization
    logger.warn(`⏰ Long task detected: ${entry.duration.toFixed(2)}ms`)
  }

  private sendToAnalytics(metric: WebVitalMetric) {
    // Send to custom analytics endpoint
    if (process.env.NEXT_PUBLIC_WEB_VITALS_ENDPOINT) {
      fetch(process.env.NEXT_PUBLIC_WEB_VITALS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metric,
          environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
          timestamp: new Date().toISOString(),
        }),
      }).catch((error) => {
        logger.warn('Failed to send Web Vital to analytics:', error)
      })
    }
  }

  // Turbopack Performance Tracking
  startTurbopackBuild() {
    this.turbopackMetrics.push({
      buildStartTime: Date.now(),
      cacheHits: 0,
      cacheMisses: 0,
      modulesProcessed: 0,
      assetsGenerated: 0,
      hmrTime: 0,
      compilationSpeed: 0,
    })
  }

  recordTurbopackMetric(metric: Partial<TurbopackMetric>) {
    const currentBuild = this.turbopackMetrics[this.turbopackMetrics.length - 1]
    if (currentBuild) {
      Object.assign(currentBuild, metric)

      if (metric.buildEndTime) {
        currentBuild.totalBuildTime = metric.buildEndTime - currentBuild.buildStartTime
      }
    }
  }

  // React Compiler Performance Tracking
  recordReactCompilerMetric(metric: Partial<ReactCompilerMetric>) {
    this.reactCompilerMetrics.push({
      compilationTime: metric.compilationTime || 0,
      optimizedComponents: metric.optimizedComponents || 0,
      memoizedComponents: metric.memoizedComponents || 0,
      eliminatedUpdates: metric.eliminatedUpdates || 0,
      performanceScore: metric.performanceScore || 0,
    })
  }

  // Build Performance Tracking
  startBuildPhase(phaseName: string) {
    this.buildMetrics.phases[phaseName] = {
      start: Date.now(),
    }
  }

  endBuildPhase(phaseName: string) {
    const phase = this.buildMetrics.phases[phaseName]
    if (phase?.start && !phase.end) {
      phase.end = Date.now()
      phase.duration = phase.end - phase.start
    }
  }

  endBuild() {
    this.buildMetrics.endTime = Date.now()
  }

  // Public API
  getWebVitals(): WebVitalMetric[] {
    return [...this.webVitals]
  }

  getTurbopackMetrics(): TurbopackMetric[] {
    return [...this.turbopackMetrics]
  }

  getReactCompilerMetrics(): ReactCompilerMetric[] {
    return [...this.reactCompilerMetrics]
  }

  getBuildMetrics() {
    return { ...this.buildMetrics }
  }

  generatePerformanceReport() {
    const latestWebVitals = this.webVitals.slice(-10)
    const latestTurbopack = this.turbopackMetrics.slice(-5)
    const latestCompiler = this.reactCompilerMetrics.slice(-5)
    const buildMetrics = this.getBuildMetrics()

    // Calculate performance scores
    const webVitalsScore = this.calculateWebVitalsScore(latestWebVitals)
    const buildPerformanceScore = this.calculateBuildPerformanceScore(buildMetrics)
    const turbopackScore = this.calculateTurbopackScore(latestTurbopack)

    return {
      timestamp: new Date().toISOString(),
      environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
      webVitals: {
        score: webVitalsScore,
        metrics: latestWebVitals,
        averageCLS: this.getAverageMetric('CLS', latestWebVitals),
        averageLCP: this.getAverageMetric('LCP', latestWebVitals),
        averageFID: this.getAverageMetric('FID', latestWebVitals),
        goodVitalPercentage: this.getGoodVitalPercentage(latestWebVitals),
      },
      build: {
        score: buildPerformanceScore,
        totalBuildTime: buildMetrics.endTime
          ? buildMetrics.endTime - buildMetrics.startTime
          : undefined,
        phases: buildMetrics.phases,
      },
      turbopack: {
        score: turbopackScore,
        latest: latestTurbopack[latestTurbopack.length - 1],
        averageBuildTime: this.getAverageTurbopackTime(latestTurbopack),
        cacheHitRate: this.getCacheHitRate(latestTurbopack),
      },
      reactCompiler: {
        score: this.calculateReactCompilerScore(latestCompiler),
        latest: latestCompiler[latestCompiler.length - 1],
        averageOptimization: this.getAverageOptimization(latestCompiler),
      },
      recommendations: this.generateRecommendations(
        webVitalsScore,
        buildPerformanceScore,
        turbopackScore
      ),
    }
  }

  private calculateWebVitalsScore(vitals: WebVitalMetric[]): number {
    if (vitals.length === 0) return 0

    const goodCount = vitals.filter((v) => v.rating === 'good').length
    return Math.round((goodCount / vitals.length) * 100)
  }

  private calculateBuildPerformanceScore(buildMetrics: any): number {
    if (!buildMetrics.endTime) return 0

    const totalTime = buildMetrics.endTime - buildMetrics.startTime
    // Assume good build time is under 30 seconds
    const score = Math.max(0, 100 - (totalTime / 1000) * 2)
    return Math.min(100, Math.round(score))
  }

  private calculateTurbopackScore(metrics: TurbopackMetric[]): number {
    if (metrics.length === 0) return 0

    const latest = metrics[metrics.length - 1]
    if (!latest) return 0

    let score = 100

    if (latest.totalBuildTime && latest.totalBuildTime > 30000) score -= 20
    if (latest.compilationSpeed && latest.compilationSpeed < 1000) score -= 15
    if (latest.hmrTime && latest.hmrTime > 1000) score -= 10

    return Math.max(0, score)
  }

  private calculateReactCompilerScore(metrics: ReactCompilerMetric[]): number {
    if (metrics.length === 0) return 0

    const latest = metrics[metrics.length - 1]
    if (!latest) return 0

    let score = 0

    score += Math.min(40, latest.optimizedComponents * 2)
    score += Math.min(30, latest.eliminatedUpdates)
    score += Math.min(30, latest.performanceScore)

    return Math.min(100, Math.round(score))
  }

  private getAverageMetric(name: string, vitals: WebVitalMetric[]): number {
    const filtered = vitals.filter((v) => v.name === name)
    if (filtered.length === 0) return 0

    const sum = filtered.reduce((acc, v) => acc + v.value, 0)
    return Math.round(sum / filtered.length)
  }

  private getGoodVitalPercentage(vitals: WebVitalMetric[]): number {
    if (vitals.length === 0) return 0

    const goodCount = vitals.filter((v) => v.rating === 'good').length
    return Math.round((goodCount / vitals.length) * 100)
  }

  private getAverageTurbopackTime(metrics: TurbopackMetric[]): number {
    const times = metrics.filter((m) => m.totalBuildTime).map((m) => m.totalBuildTime!)
    if (times.length === 0) return 0

    const sum = times.reduce((acc, time) => acc + time, 0)
    return Math.round(sum / times.length)
  }

  private getCacheHitRate(metrics: TurbopackMetric[]): number {
    const total = metrics.reduce((acc, m) => acc + m.cacheHits + m.cacheMisses, 0)
    const hits = metrics.reduce((acc, m) => acc + m.cacheHits, 0)

    return total > 0 ? Math.round((hits / total) * 100) : 0
  }

  private getAverageOptimization(metrics: ReactCompilerMetric[]): number {
    if (metrics.length === 0) return 0

    const sum = metrics.reduce((acc, m) => acc + m.performanceScore, 0)
    return Math.round(sum / metrics.length)
  }

  private generateRecommendations(
    webVitalsScore: number,
    buildScore: number,
    turbopackScore: number
  ): string[] {
    const recommendations: string[] = []

    if (webVitalsScore < 75) {
      recommendations.push(
        '📱 Improve Core Web Vitals - optimize images and reduce JavaScript bundle size'
      )
    }

    if (buildScore < 75) {
      recommendations.push(
        '🏗️ Optimize build performance - consider code splitting and tree shaking'
      )
    }

    if (turbopackScore < 80) {
      recommendations.push('⚡ Enhance Turbopack performance - optimize module dependencies')
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Performance is excellent - maintain current optimization practices')
    }

    return recommendations
  }
}

// Export singleton instance
export const enhancedPerformanceMonitor = new PerformanceMonitor()

// Export helper functions
export const startBuildPhase = (phase: string) => enhancedPerformanceMonitor.startBuildPhase(phase)
export const endBuildPhase = (phase: string) => enhancedPerformanceMonitor.endBuildPhase(phase)
export const endBuild = () => enhancedPerformanceMonitor.endBuild()
export const recordTurbopackMetric = (metric: Partial<TurbopackMetric>) =>
  enhancedPerformanceMonitor.recordTurbopackMetric(metric)
export const recordReactCompilerMetric = (metric: Partial<ReactCompilerMetric>) =>
  enhancedPerformanceMonitor.recordReactCompilerMetric(metric)
export const getPerformanceReport = () => enhancedPerformanceMonitor.generatePerformanceReport()
