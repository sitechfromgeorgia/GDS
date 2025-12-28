import type { Metadata } from 'next'
import { Suspense, lazy } from 'react'
import { ProductGridSkeleton } from '@/components/restaurant/ProductGridSkeleton'
import { CartWidgetSkeleton } from '@/components/restaurant/CartWidgetSkeleton'

export const dynamic = 'force-dynamic'

// ============================================================================
// Code Splitting (T061 - Component-Level Optimization)
// ============================================================================
// Lazy load ProductGrid (131 lines with real-time subscriptions, search, filtering)
// Why: Large component with product fetching, real-time updates, search, category filtering
// Expected impact: 10-12% bundle reduction for restaurant orders page
const ProductGrid = lazy(() =>
  import('@/components/restaurant/ProductGrid').then((m) => ({ default: m.ProductGrid }))
)

// Lazy load CartWidget (includes ShoppingCart ~102 lines with dialog, form)
// Why: Complete cart functionality with forms and dialogs
// Expected impact: 8-10% additional bundle reduction
const CartWidget = lazy(() =>
  import('@/components/restaurant/CartWidget').then((m) => ({ default: m.CartWidget }))
)

export const metadata: Metadata = {
  title: 'შეკვეთის გაფორმება | Georgian Distribution System',
  description: 'შეუკვეთეთ პროდუქტები დისტრიბუტორისგან',
}

export default function OrderPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">შეკვეთის გაფორმება</h1>
          <p className="text-muted-foreground">აირჩიეთ პროდუქტები და დაამატეთ კალათაში</p>
        </div>
        <Suspense fallback={<CartWidgetSkeleton />}>
          <CartWidget />
        </Suspense>
      </div>

      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductGrid />
      </Suspense>
    </div>
  )
}
