'use client'

import { Suspense, lazy } from 'react'
import { AnalyticsDashboardSkeleton } from '@/components/admin/AnalyticsDashboardSkeleton'

// ============================================================================
// Code Splitting (T059 - Heavy Dependencies)
// ============================================================================
// Lazy load AnalyticsDashboard with recharts
// Why: Large component with charts, complex analytics, and heavy dependencies (~14-16 KB)
// Expected impact: 15-20% bundle reduction for admin dashboard page
const AnalyticsDashboard = lazy(() =>
  import('@/components/admin/AnalyticsDashboard').then((module) => ({
    default: module.AnalyticsDashboard,
  }))
)

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<AnalyticsDashboardSkeleton />}>
        <AnalyticsDashboard dateRange={{}} />
      </Suspense>
    </div>
  )
}
