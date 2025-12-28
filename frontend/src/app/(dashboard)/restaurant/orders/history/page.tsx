import type { Metadata } from 'next'
import { logger } from '@/lib/logger'
import { Suspense } from 'react'
import { OrderHistoryTableSkeleton } from '@/components/restaurant/OrderHistoryTableSkeleton'
import { OrderHistoryFilters } from '@/components/restaurant/OrderHistoryFilters'
import { OrderHistoryTable } from '@/components/restaurant/OrderHistoryTable'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'შეკვეთების ისტორია | Georgian Distribution System',
  description: 'თქვენი შეკვეთების ისტორია და სტატუსები',
}

interface OrderHistoryPageProps {
  searchParams: Promise<{
    status?: string
    startDate?: string
    endDate?: string
    search?: string
    page?: string
  }>
}

export default async function OrderHistoryPage({ searchParams }: OrderHistoryPageProps) {
  const params = await searchParams
  // const cookieStore = await cookies() // Not needed
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Build query with filters
  let query = supabase
    .from('orders')
    .select(
      `
      *,
      items:order_items (
        *,
        product:products (name)
      )
    `
    )
    .eq('restaurant_id', user.id)
    .order('created_at', { ascending: false })

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }

  if (params.startDate && params.endDate) {
    query = query.gte('created_at', params.startDate).lte('created_at', params.endDate)
  }

  if (params.search) {
    query = query.eq('id', params.search) // Simple ID search for now
  }

  const { data: orders, error } = await query

  if (error) {
    logger.error('Error fetching orders:', error)
    return <div>შეცდომა მონაცემების წამოღებისას</div>
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">შეკვეთების ისტორია</h1>
        <p className="text-muted-foreground">იხილეთ თქვენი ყველა შეკვეთა და მათი სტატუსები</p>
      </div>

      <OrderHistoryFilters />
      <Suspense fallback={<OrderHistoryTableSkeleton />}>
        <OrderHistoryTable orders={orders || []} />
      </Suspense>
    </div>
  )
}
