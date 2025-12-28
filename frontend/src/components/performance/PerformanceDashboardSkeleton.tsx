/**
 * Performance Dashboard Loading Skeleton (T065)
 *
 * Loading placeholder for the Performance Dashboard while recharts loads.
 * Provides perceived performance improvement during code splitting.
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function PerformanceDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Real-time Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[120px]" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[100px] mb-2" />
              <Skeleton className="h-3 w-[140px]" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Timeline Chart */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[200px] mb-2" />
          <Skeleton className="h-4 w-[280px]" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Response Time Distribution */}
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-[180px] mb-2" />
            <Skeleton className="h-3 w-[220px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[250px] w-full" />
          </CardContent>
        </Card>

        {/* Error Rate Trend */}
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-[150px] mb-2" />
            <Skeleton className="h-3 w-[200px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[250px] w-full" />
          </CardContent>
        </Card>
      </div>

      {/* Alert Summary */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-[160px] mb-2" />
          <Skeleton className="h-4 w-[240px]" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-[200px] mb-2" />
                  <Skeleton className="h-3 w-[300px]" />
                </div>
                <Skeleton className="h-8 w-[80px]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
