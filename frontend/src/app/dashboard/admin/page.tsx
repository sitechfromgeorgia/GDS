'use client'

import { lazy, Suspense } from 'react'
import { Loader2 } from 'lucide-react'

// Lazy load the dashboard content component
const AdminDashboardContent = lazy(() =>
  import('@/components/dashboard/AdminDashboardContent').then((module) => ({
    default: module.AdminDashboardContent,
  }))
)

// Loading fallback component
function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-sm text-muted-foreground">იტვირთება დეშბორდი...</p>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <AdminDashboardContent />
    </Suspense>
  )
}
