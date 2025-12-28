/**
 * ConnectionPoolStatus Component - T048
 * Displays PgBouncer connection pool status and metrics
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  RefreshCw,
  Server,
  Users,
  Activity,
  Clock,
  AlertCircle,
  CheckCircle,
  Zap,
} from 'lucide-react'
import type { ConnectionPoolStatus as ConnectionPoolStatusType } from '@/types/performance'

interface ConnectionPoolStatusProps {
  className?: string
  refreshInterval?: number
}

interface PoolData {
  connectionPool: ConnectionPoolStatusType
  timestamp: string
}

export function ConnectionPoolStatus({
  className = '',
  refreshInterval = 15000,
}: ConnectionPoolStatusProps) {
  const [data, setData] = useState<PoolData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<{ timestamp: Date; utilization: number }[]>([])

  const fetchPoolStatus = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/performance/database')
      const result = await response.json()

      if (result.success && result.data.connectionPool) {
        setData({
          connectionPool: result.data.connectionPool,
          timestamp: result.data.timestamp,
        })

        // Keep last 20 data points for trend
        setHistory((prev) => {
          const newPoint = {
            timestamp: new Date(),
            utilization: result.data.connectionPool.utilization_percent,
          }
          const updated = [...prev, newPoint].slice(-20)
          return updated
        })

        setError(null)
      } else {
        setError(result.error || 'Failed to fetch pool status')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pool status')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPoolStatus()
    const interval = setInterval(fetchPoolStatus, refreshInterval)
    return () => clearInterval(interval)
  }, [fetchPoolStatus, refreshInterval])

  const getStatusColor = (utilization: number) => {
    if (utilization >= 80) return 'text-red-600'
    if (utilization >= 60) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getStatusBadge = (utilization: number) => {
    if (utilization >= 80) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Critical
        </Badge>
      )
    }
    if (utilization >= 60) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Activity className="h-3 w-3" />
          Warning
        </Badge>
      )
    }
    return (
      <Badge variant="default" className="flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        Healthy
      </Badge>
    )
  }

  const getPoolModeDescription = (mode: string) => {
    switch (mode) {
      case 'transaction':
        return 'Connections returned after each transaction (recommended)'
      case 'session':
        return 'Connections held for entire session'
      case 'statement':
        return 'Connections returned after each statement'
      default:
        return mode
    }
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Connection Pool Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600 text-center py-4">
            Error: {error}
            <Button variant="outline" size="sm" className="ml-4" onClick={fetchPoolStatus}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const pool = data?.connectionPool

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Connection Pool Status
              {pool && getStatusBadge(pool.utilization_percent)}
            </CardTitle>
            <CardDescription>PgBouncer connection pool metrics</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchPoolStatus} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {loading && !pool ? (
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-20 bg-gray-200 rounded" />
              <div className="h-20 bg-gray-200 rounded" />
            </div>
          </div>
        ) : pool ? (
          <div className="space-y-6">
            {/* Main Utilization */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Pool Utilization</span>
                <span className={`text-2xl font-bold ${getStatusColor(pool.utilization_percent)}`}>
                  {pool.utilization_percent}%
                </span>
              </div>
              <Progress value={pool.utilization_percent} className="h-3" />
              <p className="text-xs text-muted-foreground">
                {pool.utilization_percent < 60 && '✅ Pool has sufficient capacity'}
                {pool.utilization_percent >= 60 &&
                  pool.utilization_percent < 80 &&
                  '⚠️ Consider increasing pool size'}
                {pool.utilization_percent >= 80 &&
                  '🚨 Pool is near capacity - increase pool_size immediately'}
              </p>
            </div>

            {/* Connection Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Active Clients */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Active Clients</span>
                </div>
                <div className="text-2xl font-bold">{pool.active_clients}</div>
                <div className="text-xs text-muted-foreground">of {pool.max_client_conn} max</div>
                <Progress
                  value={(pool.active_clients / pool.max_client_conn) * 100}
                  className="h-1 mt-2"
                />
              </div>

              {/* Waiting Clients */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-muted-foreground">Waiting</span>
                </div>
                <div
                  className={`text-2xl font-bold ${pool.waiting_clients > 0 ? 'text-yellow-600' : ''}`}
                >
                  {pool.waiting_clients}
                </div>
                <div className="text-xs text-muted-foreground">clients in queue</div>
              </div>

              {/* Active Servers */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Server className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Active Servers</span>
                </div>
                <div className="text-2xl font-bold">{pool.active_servers}</div>
                <div className="text-xs text-muted-foreground">of {pool.pool_size} pool size</div>
                <Progress
                  value={(pool.active_servers / pool.pool_size) * 100}
                  className="h-1 mt-2"
                />
              </div>

              {/* Idle Servers */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-purple-500" />
                  <span className="text-sm text-muted-foreground">Idle Servers</span>
                </div>
                <div className="text-2xl font-bold">{pool.idle_servers}</div>
                <div className="text-xs text-muted-foreground">ready for use</div>
              </div>
            </div>

            {/* Pool Configuration */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Pool Configuration
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Database:</span>
                  <span className="ml-2 font-medium">{pool.database}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Pool Mode:</span>
                  <span className="ml-2 font-medium capitalize">{pool.pool_mode}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Avg Query Time:</span>
                  <span className="ml-2 font-medium">
                    {pool.avg_query_time?.toFixed(2) || 'N/A'}ms
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {getPoolModeDescription(pool.pool_mode)}
              </p>
            </div>

            {/* Trend (simple text-based for now) */}
            {history.length > 1 && (
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Utilization Trend</h4>
                <div className="flex items-end gap-1 h-12">
                  {history.map((point, index) => (
                    <div
                      key={index}
                      className={`flex-1 rounded-t ${
                        point.utilization >= 80
                          ? 'bg-red-500'
                          : point.utilization >= 60
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                      }`}
                      style={{ height: `${Math.max(point.utilization, 5)}%` }}
                      title={`${point.utilization}% at ${point.timestamp.toLocaleTimeString()}`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{history[0]?.timestamp.toLocaleTimeString()}</span>
                  <span>{history[history.length - 1]?.timestamp.toLocaleTimeString()}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No connection pool data available</p>
          </div>
        )}

        {data && (
          <div className="mt-4 text-xs text-muted-foreground text-right">
            Last updated: {new Date(data.timestamp).toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ConnectionPoolStatus
