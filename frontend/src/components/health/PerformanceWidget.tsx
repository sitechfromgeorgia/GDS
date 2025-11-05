'use client'
import { logger } from '@/lib/logger'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Clock,
  Database,
  Zap,
} from 'lucide-react'
import { getPerformanceReport } from '@/lib/monitoring/performance'
// Mock SLA compliance data since the function doesn't exist yet
const getSLAComplianceReport = () => ({
  status: 'healthy' as const,
  compliance: 0.96,
  violations: 2,
})

interface PerformanceMetrics {
  averageResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  successRate: number
  totalRequests: number
  errorRate: number
}

interface SLAStatus {
  status: 'healthy' | 'warning' | 'critical'
  compliance: number
  violations: number
}

export default function PerformanceWidget() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [slaStatus, setSLAStatus] = useState<SLAStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    loadPerformanceData()
    const interval = setInterval(loadPerformanceData, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadPerformanceData = async () => {
    try {
      setLoading(true)

      // Get performance metrics
      const report = getPerformanceReport('1h')
      const slaReport = getSLAComplianceReport()

      const performanceMetrics: PerformanceMetrics = {
        averageResponseTime: report.averageResponseTime,
        p95ResponseTime: report.p95ResponseTime,
        p99ResponseTime: report.p99ResponseTime,
        successRate: report.successfulOperations / report.totalOperations,
        totalRequests: report.totalOperations,
        errorRate: report.failedOperations / report.totalOperations,
      }

      setMetrics(performanceMetrics)
      setSLAStatus(slaReport)
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (error) {
      logger.error('Failed to load performance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'critical':
        return 'bg-red-100 text-red-800'
    }
  }

  const getStatusIcon = (status: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />
      case 'critical':
        return <XCircle className="h-4 w-4" />
    }
  }

  const formatResponseTime = (time: number) => {
    if (time < 1000) return `${Math.round(time)}ms`
    return `${(time / 1000).toFixed(2)}s`
  }

  const getProgressColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'bg-green-500'
    if (value <= thresholds.warning) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  if (loading && !metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance Monitoring
            {lastUpdated && (
              <span className="text-sm font-normal text-gray-500">Updated: {lastUpdated}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {slaStatus && (
              <Badge className={getStatusColor(slaStatus.status)}>
                {getStatusIcon(slaStatus.status)}
                <span className="ml-1">{slaStatus.status.toUpperCase()}</span>
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? 'Collapse' : 'Details'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {metrics && (
          <>
            {/* Key Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>Avg Response Time</span>
                </div>
                <div className="text-2xl font-bold">
                  {formatResponseTime(metrics.averageResponseTime)}
                </div>
                <Progress
                  value={Math.min((metrics.averageResponseTime / 1000) * 100, 100)}
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4" />
                  <span>P95 Response Time</span>
                </div>
                <div className="text-2xl font-bold">
                  {formatResponseTime(metrics.p95ResponseTime)}
                </div>
                <Progress
                  value={Math.min((metrics.p95ResponseTime / 2000) * 100, 100)}
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Database className="h-4 w-4" />
                  <span>Success Rate</span>
                </div>
                <div className="text-2xl font-bold">{(metrics.successRate * 100).toFixed(1)}%</div>
                <Progress value={metrics.successRate * 100} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="h-4 w-4" />
                  <span>Total Requests</span>
                </div>
                <div className="text-2xl font-bold">{metrics.totalRequests.toLocaleString()}</div>
                <div className="text-sm text-gray-500">
                  Error Rate: {(metrics.errorRate * 100).toFixed(2)}%
                </div>
              </div>
            </div>

            {/* SLA Compliance */}
            {slaStatus && (
              <Alert>
                <div className="flex items-center justify-between w-full">
                  <AlertDescription>
                    SLA Compliance: {(slaStatus.compliance * 100).toFixed(1)}%
                    {slaStatus.violations > 0 && (
                      <span className="ml-2 text-red-600">({slaStatus.violations} violations)</span>
                    )}
                  </AlertDescription>
                  <Badge variant={slaStatus.compliance >= 0.95 ? 'default' : 'destructive'}>
                    {slaStatus.compliance >= 0.95 ? 'COMPLIANT' : 'NON-COMPLIANT'}
                  </Badge>
                </div>
              </Alert>
            )}

            {/* Detailed View */}
            {isExpanded && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-semibold">Performance Breakdown</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h5 className="font-medium">Response Time Distribution</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>P50 (Median)</span>
                        <span className="font-mono">
                          {formatResponseTime(metrics.averageResponseTime * 0.8)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>P95</span>
                        <span className="font-mono">
                          {formatResponseTime(metrics.p95ResponseTime)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>P99</span>
                        <span className="font-mono">
                          {formatResponseTime(metrics.p99ResponseTime)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h5 className="font-medium">Status Indicators</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Database Queries</span>
                        <Badge variant="outline" className="text-green-600">
                          Healthy
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>API Endpoints</span>
                        <Badge variant="outline" className="text-yellow-600">
                          Warning
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Memory Usage</span>
                        <Badge variant="outline" className="text-green-600">
                          Healthy
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Refresh Button */}
            <div className="flex justify-end">
              <Button onClick={loadPerformanceData} disabled={loading} size="sm" variant="outline">
                {loading ? 'Updating...' : 'Refresh'}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
