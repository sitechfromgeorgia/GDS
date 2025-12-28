/**
 * Restaurant Dashboard Client Wrapper (T059)
 *
 * Client component wrapper for lazy loading the RestaurantDashboard.
 * Separates client logic from server component page.
 */

'use client'

import { Suspense, lazy } from 'react'
import { RestaurantDashboardSkeleton } from './RestaurantDashboardSkeleton'

// ============================================================================
// Code Splitting (T059 - Heavy Dependencies)
// ============================================================================
// Lazy load RestaurantDashboard with date-fns (14.65 KB component)
// Why: Large component with date formatting library
// Expected impact: 10-15% initial bundle reduction
const RestaurantDashboard = lazy(() =>
  import('./RestaurantDashboard').then((module) => ({
    default: module.RestaurantDashboard,
  }))
)

export function RestaurantDashboardClient() {
  return (
    <Suspense fallback={<RestaurantDashboardSkeleton />}>
      <RestaurantDashboard />
    </Suspense>
  )
}
