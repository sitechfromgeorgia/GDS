import { Suspense, lazy } from 'react'
import { verifyUserRole } from '@/lib/auth/server-auth'
import { OrderFormSkeleton } from '@/components/restaurant/OrderFormSkeleton'
import { OrderSummarySkeleton } from '@/components/restaurant/OrderSummarySkeleton'

// ============================================================================
// Code Splitting (T059 - Heavy Dependencies)
// ============================================================================
// Lazy load order components
// Why: OrderForm uses react-hook-form + zod validation (~10 KB)
// Expected impact: 10-15% initial bundle reduction
const OrderForm = lazy(() =>
  import('@/components/restaurant/OrderForm').then((m) => ({ default: m.OrderForm }))
)
const OrderSummary = lazy(() =>
  import('@/components/restaurant/OrderSummary').then((m) => ({ default: m.OrderSummary }))
)

export default async function OrderPlacementPage() {
  await verifyUserRole('restaurant')

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">შეკვეთის გაფორმება</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-card border rounded-lg p-6">
            <Suspense fallback={<OrderFormSkeleton />}>
              <OrderForm />
            </Suspense>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <Suspense fallback={<OrderSummarySkeleton />}>
              <OrderSummary />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
