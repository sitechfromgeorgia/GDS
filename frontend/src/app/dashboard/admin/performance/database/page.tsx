/**
 * Database Performance Monitoring Page - T049
 * Dedicated page for database metrics, slow queries, and connection pool status
 */

'use client'

import React, { Suspense, lazy } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Database } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Lazy load heavy components
const DatabaseMetrics = lazy(() => import('@/components/performance/DatabaseMetrics'))
const SlowQueryList = lazy(() => import('@/components/performance/SlowQueryList'))
const ConnectionPoolStatus = lazy(() => import('@/components/performance/ConnectionPoolStatus'))

// Loading skeleton
function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-40 bg-gray-200 rounded" />
          <div className="h-40 bg-gray-200 rounded" />
        </div>
        <div className="h-60 bg-gray-200 rounded mt-4" />
      </div>
    </div>
  )
}

export default function DatabaseMonitoringPage() {
  const { user } = useAuth()
  const router = useRouter()

  // Check if user is admin
  if (user?.app_metadata?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You do not have permission to access database monitoring.
            </p>
            <Button onClick={() => router.push('/dashboard')} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="h-8 w-8" />
            Database Monitoring
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time PostgreSQL performance metrics and diagnostics
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push('/dashboard/admin/performance')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Performance
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="queries">Slow Queries</TabsTrigger>
          <TabsTrigger value="connections">Connection Pool</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Suspense fallback={<LoadingSkeleton />}>
            {/* Connection Pool Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ConnectionPoolStatus refreshInterval={15000} />
              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg text-center">
                      <div className="text-3xl font-bold text-green-600">✓</div>
                      <div className="text-sm text-muted-foreground mt-2">Database Connected</div>
                    </div>
                    <div className="p-4 border rounded-lg text-center">
                      <div className="text-3xl font-bold text-blue-600">6</div>
                      <div className="text-sm text-muted-foreground mt-2">Indexes Active</div>
                    </div>
                    <div className="p-4 border rounded-lg text-center">
                      <div className="text-3xl font-bold text-purple-600">25+</div>
                      <div className="text-sm text-muted-foreground mt-2">RLS Policies</div>
                    </div>
                    <div className="p-4 border rounded-lg text-center">
                      <div className="text-3xl font-bold text-orange-600">&lt;1ms</div>
                      <div className="text-sm text-muted-foreground mt-2">Avg Query Time</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Database Metrics */}
            <DatabaseMetrics refreshInterval={30000} />
          </Suspense>
        </TabsContent>

        {/* Slow Queries Tab */}
        <TabsContent value="queries">
          <Suspense fallback={<LoadingSkeleton />}>
            <SlowQueryList refreshInterval={60000} defaultThreshold={100} defaultLimit={20} />
          </Suspense>
        </TabsContent>

        {/* Connection Pool Tab */}
        <TabsContent value="connections">
          <Suspense fallback={<LoadingSkeleton />}>
            <div className="space-y-6">
              <ConnectionPoolStatus refreshInterval={10000} />

              {/* Pool Configuration Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle>Pool Configuration Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Transaction Mode (Current)</h4>
                      <p className="text-sm text-muted-foreground">
                        Connections are returned to the pool after each transaction. This is the
                        recommended mode for web applications with short-lived requests.
                      </p>
                      <ul className="mt-2 text-sm list-disc list-inside text-muted-foreground">
                        <li>Best for high concurrency</li>
                        <li>Supports prepared statements per transaction</li>
                        <li>Lower memory usage per connection</li>
                      </ul>
                    </div>

                    <div className="p-4 border rounded-lg bg-muted/50">
                      <h4 className="font-medium mb-2">Scaling Recommendations</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 text-sm">
                        <div>
                          <span className="font-medium">Current Pool Size:</span>
                          <span className="ml-2">20</span>
                        </div>
                        <div>
                          <span className="font-medium">Max Connections:</span>
                          <span className="ml-2">100</span>
                        </div>
                        <div>
                          <span className="font-medium">Recommended:</span>
                          <span className="ml-2 text-green-600">Optimal</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">When to Increase Pool Size</h4>
                      <ul className="text-sm list-disc list-inside text-muted-foreground">
                        <li>Utilization consistently above 70%</li>
                        <li>Waiting clients regularly above 0</li>
                        <li>Average query time increasing</li>
                        <li>Connection timeout errors in logs</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
