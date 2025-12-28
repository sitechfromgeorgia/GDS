/**
 * DatabaseMetrics Component - T046
 * Displays real-time database performance metrics
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  Database,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  HardDrive,
  Activity,
} from 'lucide-react'
import type { PerformanceMetric, ConnectionPoolStatus } from '@/types/performance'

interface DatabaseMetricsProps {
  className?: string
  refreshInterval?: number
}

interface TableStats {
  table_name: string
  row_count: number
  total_size: string
  index_size: string
}

interface DatabaseMetricsData {
  metrics: PerformanceMetric[]
  tables: TableStats[]
  connectionPool: ConnectionPoolStatus
  timestamp: string
}

export function DatabaseMetrics({ className = '', refreshInterval = 30000 }: DatabaseMetricsProps) {
  const [data, setData] = useState<DatabaseMetricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/performance/database')
      const result = await response.json()

      if (result.success) {
        setData(result.data)
        setLastRefresh(new Date())
        setError(null)
      } else {
        setError(result.error || 'Failed to fetch metrics')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, refreshInterval)
    return () => clearInterval(interval)
  }, [fetchMetrics, refreshInterval])

  const getStatusColor = (value: number, warningThreshold: number, criticalThreshold: number) => {
    if (value >= criticalThreshold) return 'text-red-600'
    if (value >= warningThreshold) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getStatusBadge = (value: number, warningThreshold: number, criticalThreshold: number) => {
    if (value >= criticalThreshold) return <Badge variant="destructive">Critical</Badge>
    if (value >= warningThreshold) return <Badge variant="secondary">Warning</Badge>
    return <Badge variant="default">Healthy</Badge>
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600 text-center py-4">
            Error: {error}
            <Button variant="outline" size="sm" className="ml-4" onClick={fetchMetrics}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Performance
        </h2>
        <div className="flex items-center gap-2">
          {lastRefresh && (
            <span className="text-sm text-muted-foreground">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={fetchMetrics} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Connection Pool Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Connection Pool</CardTitle>
          <CardDescription>PgBouncer connection pool status</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.connectionPool ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active Clients</span>
                  <span className="font-medium">{data.connectionPool.active_clients}</span>
                </div>
                <Progress
                  value={
                    (data.connectionPool.active_clients / data.connectionPool.max_client_conn) * 100
                  }
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pool Utilization</span>
                  <span
                    className={`font-medium ${getStatusColor(data.connectionPool.utilization_percent, 60, 80)}`}
                  >
                    {data.connectionPool.utilization_percent}%
                  </span>
                </div>
                <Progress value={data.connectionPool.utilization_percent} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active Servers</span>
                  <span className="font-medium">
                    {data.connectionPool.active_servers}/{data.connectionPool.pool_size}
                  </span>
                </div>
                <Progress
                  value={(data.connectionPool.active_servers / data.connectionPool.pool_size) * 100}
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg Query Time</span>
                  <span className="font-medium">
                    {data.connectionPool.avg_query_time?.toFixed(2)}ms
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(data.connectionPool.utilization_percent, 60, 80)}
                  <span className="text-xs text-muted-foreground">
                    {data.connectionPool.pool_mode} mode
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Table Statistics</CardTitle>
          <CardDescription>Row counts and storage usage by table</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.tables ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Table</th>
                    <th className="text-right py-2 font-medium">Rows</th>
                    <th className="text-right py-2 font-medium">Total Size</th>
                    <th className="text-right py-2 font-medium">Index Size</th>
                  </tr>
                </thead>
                <tbody>
                  {data.tables.map((table) => (
                    <tr key={table.table_name} className="border-b last:border-0">
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <HardDrive className="h-4 w-4 text-muted-foreground" />
                          {table.table_name}
                        </div>
                      </td>
                      <td className="text-right py-2 font-mono">
                        {table.row_count.toLocaleString()}
                      </td>
                      <td className="text-right py-2">{table.total_size}</td>
                      <td className="text-right py-2">{table.index_size}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 bg-gray-200 rounded" />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance Metrics</CardTitle>
          <CardDescription>Real-time database performance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.metrics ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {data.metrics.map((metric, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground capitalize">
                      {metric.name.replace(/_/g, ' ')}
                    </span>
                    {metric.labels?.table && (
                      <Badge variant="outline" className="text-xs">
                        {metric.labels.table}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold">
                      {metric.unit === 'bytes'
                        ? formatBytes(metric.value)
                        : metric.unit === 'percent'
                          ? `${metric.value.toFixed(1)}%`
                          : metric.value.toLocaleString()}
                    </span>
                    {metric.unit !== 'bytes' && metric.unit !== 'percent' && (
                      <span className="text-sm text-muted-foreground">{metric.unit}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="animate-pulse grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-200 rounded" />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export default DatabaseMetrics
