import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  performanceAlertingService,
  type PerformanceAlert,
  type AlertCallback,
  type AlertThreshold,
} from '@/services/performance-alerting-service'
import { useToast } from '@/hooks/use-toast'

/**
 * React hook for performance alerting
 *
 * This hook integrates the performance alerting service with React components,
 * providing real-time performance alerts and threshold management.
 */
export const usePerformanceAlerts = () => {
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([])
  const { toast } = useToast()

  // Memoize thresholds and enabled state
  const thresholds = useMemo(() => performanceAlertingService.getThresholds(), [])
  const isEnabled = useMemo(() => performanceAlertingService.isEnabledAlerting(), [])

  // Initialize alerting service
  useEffect(() => {
    // Register alert callback
    const handleAlert: AlertCallback = (alert) => {
      // Add to alerts state
      setAlerts((prev) => [alert, ...prev.slice(0, 49)]) // Keep only last 50 alerts

      // Show toast notification
      toast({
        title: `Performance Alert: ${alert.metric}`,
        description: alert.message,
        variant:
          alert.severity === 'critical' || alert.severity === 'error'
            ? 'destructive'
            : alert.severity === 'warning'
              ? 'default'
              : 'default',
      })
    }

    performanceAlertingService.addAlertCallback(handleAlert)

    // Cleanup
    return () => {
      performanceAlertingService.removeAlertCallback(handleAlert)
    }
  }, [toast])

  /**
   * Enable performance alerting
   */
  const enableAlerting = useCallback(() => {
    performanceAlertingService.enable()
  }, [])

  /**
   * Disable performance alerting
   */
  const disableAlerting = useCallback(() => {
    performanceAlertingService.disable()
  }, [])

  /**
   * Update alert threshold
   * @param metric Metric name
   * @param threshold New threshold value
   * @param severity Alert severity
   * @param enabled Whether threshold is enabled
   * @param cooldownPeriod Cooldown period in milliseconds
   */
  const updateThreshold = useCallback(
    (
      metric: string,
      threshold: number,
      severity: 'info' | 'warning' | 'error' | 'critical' = 'warning',
      enabled: boolean = true,
      cooldownPeriod: number = 300000
    ) => {
      performanceAlertingService.updateThreshold(
        metric,
        threshold,
        severity,
        enabled,
        cooldownPeriod
      )
    },
    []
  )

  /**
   * Clear all alerts
   */
  const clearAlerts = useCallback(() => {
    setAlerts([])
  }, [])

  /**
   * Get alert count by severity
   */
  const getAlertCountBySeverity = useCallback(() => {
    return {
      info: alerts.filter((a) => a.severity === 'info').length,
      warning: alerts.filter((a) => a.severity === 'warning').length,
      error: alerts.filter((a) => a.severity === 'error').length,
      critical: alerts.filter((a) => a.severity === 'critical').length,
    }
  }, [alerts])

  /**
   * Get recent alerts
   * @param limit Maximum number of alerts to return
   * @returns Array of recent alerts
   */
  const getRecentAlerts = useCallback(
    (limit: number = 10) => {
      return alerts.slice(0, limit)
    },
    [alerts]
  )

  return {
    // Alerts
    alerts,
    clearAlerts,
    getAlertCountBySeverity,
    getRecentAlerts,

    // Thresholds
    thresholds,
    updateThreshold,

    // Alerting control
    isEnabled,
    enableAlerting,
    disableAlerting,
  }
}
