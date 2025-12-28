/**
 * SlowQueryList Component - T047
 * Displays slow queries from pg_stat_statements
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RefreshCw, AlertTriangle, Clock, Database, TrendingUp, Search } from 'lucide-react'
import type { SlowQueryLog } from '@/types/performance'

interface SlowQueryListProps {
  className?: string
  refreshInterval?: number
  defaultThreshold?: number
  defaultLimit?: number
}

interface SlowQueryData {
  queries: SlowQueryLog[]
  threshold_ms: number
  is_simulated: boolean
  timestamp: string
}

export function SlowQueryList({
  className = '',
  refreshInterval = 60000,
  defaultThreshold = 100,
  defaultLimit = 10,
}: SlowQueryListProps) {
  const [data, setData] = useState<SlowQueryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [threshold, setThreshold] = useState(defaultThreshold)
  const [limit, setLimit] = useState(defaultLimit)
  const [expandedQuery, setExpandedQuery] = useState<number | null>(null)

  const fetchSlowQueries = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/performance/slow-queries?threshold=${threshold}&limit=${limit}`
      )
      const result = await response.json()

      if (result.success) {
        setData(result.data)
        setError(null)
      } else {
        setError(result.error || 'Failed to fetch slow queries')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch slow queries')
    } finally {
      setLoading(false)
    }
  }, [threshold, limit])

  useEffect(() => {
    fetchSlowQueries()
    const interval = setInterval(fetchSlowQueries, refreshInterval)
    return () => clearInterval(interval)
  }, [fetchSlowQueries, refreshInterval])

  const getSeverityBadge = (meanExecTime: number) => {
    if (meanExecTime >= 1000) return <Badge variant="destructive">Critical</Badge>
    if (meanExecTime >= 500) return <Badge variant="secondary">Slow</Badge>
    if (meanExecTime >= 100) return <Badge variant="outline">Warning</Badge>
    return <Badge variant="default">Normal</Badge>
  }

  const formatDuration = (ms: number) => {
    if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`
    return `${ms.toFixed(2)}ms`
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const truncateQuery = (query: string, maxLength: number = 100) => {
    if (query.length <= maxLength) return query
    return `${query.substring(0, maxLength)}...`
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Slow Queries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600 text-center py-4">
            Error: {error}
            <Button variant="outline" size="sm" className="ml-4" onClick={fetchSlowQueries}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Slow Queries
              {data?.is_simulated && (
                <Badge variant="outline" className="ml-2">
                  Simulated
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Queries exceeding {threshold}ms threshold</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchSlowQueries} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Threshold (ms):</label>
            <Input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value) || 100)}
              className="w-24"
              min={1}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Limit:</label>
            <Input
              type="number"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value) || 10)}
              className="w-20"
              min={1}
              max={100}
            />
          </div>
          <Button variant="secondary" size="sm" onClick={fetchSlowQueries}>
            <Search className="h-4 w-4 mr-2" />
            Apply
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {loading && !data ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded" />
            ))}
          </div>
        ) : data?.queries && data.queries.length > 0 ? (
          <div className="space-y-4">
            {data.queries.map((query, index) => (
              <div
                key={query.queryid || index}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {getSeverityBadge(query.mean_exec_time)}
                      <span className="text-sm text-muted-foreground">ID: {query.queryid}</span>
                    </div>

                    {/* Query text */}
                    <div
                      className="font-mono text-sm bg-muted p-2 rounded cursor-pointer"
                      onClick={() => setExpandedQuery(expandedQuery === index ? null : index)}
                    >
                      {expandedQuery === index ? query.query : truncateQuery(query.query)}
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-xs text-muted-foreground">Mean Time</div>
                          <div className="font-medium">{formatDuration(query.mean_exec_time)}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-xs text-muted-foreground">Calls</div>
                          <div className="font-medium">{formatNumber(query.calls)}</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-muted-foreground">Total Time</div>
                        <div className="font-medium">{formatDuration(query.total_exec_time)}</div>
                      </div>

                      <div>
                        <div className="text-xs text-muted-foreground">Rows</div>
                        <div className="font-medium">{formatNumber(query.rows)}</div>
                      </div>
                    </div>

                    {/* Extended stats */}
                    {expandedQuery === index && (
                      <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t">
                        <div>
                          <div className="text-xs text-muted-foreground">Min Time</div>
                          <div className="font-medium">{formatDuration(query.min_exec_time)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Max Time</div>
                          <div className="font-medium">{formatDuration(query.max_exec_time)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Std Dev</div>
                          <div className="font-medium">
                            {formatDuration(query.stddev_exec_time)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No slow queries found above {threshold}ms threshold</p>
            <p className="text-sm mt-2">This is good! Your queries are performing well.</p>
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

export default SlowQueryList
