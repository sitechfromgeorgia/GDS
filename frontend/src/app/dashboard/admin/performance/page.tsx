'use client'

import React, { Suspense, lazy } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PerformanceDashboardSkeleton } from '@/components/performance/PerformanceDashboardSkeleton'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

// ============================================================================
// Code Splitting (T059 - Heavy Dependencies)
// ============================================================================
// Lazy load PerformanceDashboard with recharts (25.06 KB component)
// Why: Massive component with heavy chart library
// Expected impact: 15-25% initial bundle reduction
const PerformanceDashboard = lazy(() => import('@/components/performance/PerformanceDashboard'))

const PerformanceMonitoringPage = () => {
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
            <p className="text-muted-foreground">You do not have permission to access this page.</p>
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
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Performance Monitoring</h1>
        <Button onClick={() => router.push('/dashboard/admin')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Admin Dashboard
        </Button>
      </div>

      <Suspense fallback={<PerformanceDashboardSkeleton />}>
        <PerformanceDashboard />
      </Suspense>
    </div>
  )
}

export default PerformanceMonitoringPage
