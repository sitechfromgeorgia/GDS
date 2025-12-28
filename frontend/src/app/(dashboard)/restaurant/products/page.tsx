import { Suspense, lazy } from 'react'
import { verifyUserRole } from '@/lib/auth/server-auth'
import type { Metadata } from 'next'
import { ProductGridSkeleton } from '@/components/restaurant/ProductGridSkeleton'

// ============================================================================
// Code Splitting (T061 - Component-Level Optimization)
// ============================================================================
// Lazy load ProductGrid (2nd instance - reusing skeleton from Session 14)
// Why: Large component with product fetching, real-time updates, search, category filtering
// Expected impact: 10-12% bundle reduction for restaurant products page
const ProductGrid = lazy(() =>
  import('@/components/restaurant/ProductGrid').then((m) => ({ default: m.ProductGrid }))
)

export const metadata: Metadata = {
  title: 'პროდუქტების კატალოგი | Distribution Management',
  description: 'შეუკვეთეთ პროდუქტები ონლაინ',
}

export default async function ProductCatalogPage() {
  await verifyUserRole('restaurant')

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">პროდუქტების კატალოგი</h1>
        <p className="text-muted-foreground">აირჩიეთ სასურველი პროდუქტები და დაამატეთ კალათაში</p>
      </div>

      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductGrid />
      </Suspense>
    </div>
  )
}
