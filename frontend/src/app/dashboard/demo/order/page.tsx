'use client'

import { ProductCatalog } from '@/components/restaurant/ProductCatalog'

export default function DemoOrderPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">ახალი შეკვეთა</h1>
      </div>

      <ProductCatalog isDemo onAddToCart={() => {}} cartItems={[]} />
    </div>
  )
}
