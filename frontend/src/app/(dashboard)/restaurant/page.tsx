import type { Metadata } from 'next'
import { RestaurantDashboardClient } from './_components/RestaurantDashboardClient'
import { GeometricBackground } from '@/components/ui/GeometricBackground'

export const metadata: Metadata = {
  title: 'რესტორნის პანელი | Georgian Distribution System',
  description: 'მართეთ თქვენი შეკვეთები და იხილეთ სტატისტიკა',
}

export default function RestaurantPage() {
  return (
    <div className="relative min-h-screen">
      <GeometricBackground />
      <div className="relative z-10">
        <RestaurantDashboardClient />
      </div>
    </div>
  )
}
