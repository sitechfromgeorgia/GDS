'use client'

import { DemoLayout } from '@/components/demo/DemoLayout'
import { RestaurantDashboardContent } from '@/components/dashboard/RestaurantDashboardContent'

export default function DemoDashboard() {
  return (
    <DemoLayout>
      <RestaurantDashboardContent isDemo />
    </DemoLayout>
  )
}
