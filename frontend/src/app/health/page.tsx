'use client'

import { Suspense, lazy } from 'react'
import { HealthCheckDashboardSkeleton } from '@/components/health/HealthCheckDashboardSkeleton'

// ============================================================================
// Code Splitting (T059 - Heavy Dependencies)
// ============================================================================
// Lazy load HealthCheckDashboard
// Why: Large component with complex health monitoring, tabs, and real-time checks (~15-18 KB)
// Expected impact: 15-20% bundle reduction for health monitoring page
const HealthCheckDashboard = lazy(() => import('@/components/health/HealthCheckDashboard'))

export default function HealthPage() {
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<HealthCheckDashboardSkeleton />}>
        <HealthCheckDashboard />
      </Suspense>
    </div>
  )
}
