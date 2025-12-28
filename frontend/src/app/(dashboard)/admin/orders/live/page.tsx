'use client'

import { Suspense, lazy } from 'react'
import { LiveOrderFeedSkeleton } from '@/components/admin/LiveOrderFeedSkeleton'

// ============================================================================
// Code Splitting (T059 - Heavy Dependencies)
// ============================================================================
// Lazy load LiveOrderFeed
// Why: Real-time component with date formatting and heavy dependencies (~5-6 KB)
// Expected impact: 8-12% bundle reduction for live orders page
const LiveOrderFeed = lazy(() =>
  import('@/components/admin/LiveOrderFeed').then((m) => ({ default: m.LiveOrderFeed }))
)

export default function AdminLiveOrdersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Live შეკვეთები</h1>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
          </span>
          <span className="text-sm text-muted-foreground">Live რეჟიმი</span>
        </div>
      </div>
      <Suspense fallback={<LiveOrderFeedSkeleton />}>
        <LiveOrderFeed />
      </Suspense>
    </div>
  )
}
