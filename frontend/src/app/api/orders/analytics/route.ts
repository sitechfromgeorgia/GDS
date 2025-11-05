import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'

type OrderStatus = Database['public']['Enums']['order_status']
import { z } from 'zod'
import { instrumentAPIHandler } from '@/lib/monitoring/api-instrumentation'
import { configureEndpointSLA, SLA_CONFIGS } from '@/lib/monitoring/api-instrumentation'

// Configure SLA for this endpoint
configureEndpointSLA('/api/orders/analytics', 'GET', SLA_CONFIGS.ORDERS_ANALYTICS)

type Order = Database['public']['Tables']['orders']['Row']
type OrderItem = Database['public']['Tables']['order_items']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

// Extended types for analytics queries
interface OrderWithItems extends Order {
  order_items:
    | (OrderItem & {
        products: {
          id: string
          name: string
          category: string
        } | null
      })[]
    | null
  profiles: Profile | null
}

// Analytics query schema
const analyticsQuerySchema = z.object({
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  restaurant_id: z.string().uuid().optional(),
  driver_id: z.string().uuid().optional(),
  status: z
    .enum([
      'pending',
      'confirmed',
      'priced',
      'assigned',
      'out_for_delivery',
      'delivered',
      'completed',
      'cancelled',
    ])
    .optional(),
  limit: z.number().int().min(1).max(1000).optional().default(100),
})

/**
 * GET /api/orders/analytics
 * Analytics endpoint for order reporting and business intelligence
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 })
    }

    // Type assertion for profile
    const userProfile = profile as Profile

    // Parse query parameters
    const url = new URL(request.url)
    const queryParams = {
      start_date: url.searchParams.get('start_date') || undefined,
      end_date: url.searchParams.get('end_date') || undefined,
      restaurant_id: url.searchParams.get('restaurant_id') || undefined,
      driver_id: url.searchParams.get('driver_id') || undefined,
      status: url.searchParams.get('status') as OrderStatus | undefined,
      limit: parseInt(url.searchParams.get('limit') || '100'),
    }

    const parsed = analyticsQuerySchema.safeParse(queryParams)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.format() },
        { status: 400 }
      )
    }

    // Build base query with role-based filtering
    let ordersQuery = supabase.from('orders').select(`
        id,
        restaurant_id,
        driver_id,
        status,
        total_amount,
        created_at,
        updated_at,
        order_items (
          quantity,
          cost_price,
          selling_price,
          products (
            name,
            category
          )
        ),
        profiles!orders_restaurant_id_fkey (
          full_name,
          restaurant_name
        ),
        profiles!orders_driver_id_fkey (
          full_name
        )
      `)

    // Apply filters
    if (parsed.data.start_date) {
      ordersQuery = ordersQuery.gte('created_at', parsed.data.start_date)
    }
    if (parsed.data.end_date) {
      ordersQuery = ordersQuery.lte('created_at', parsed.data.end_date)
    }
    if (parsed.data.restaurant_id) {
      ordersQuery = ordersQuery.eq('restaurant_id', parsed.data.restaurant_id)
    }
    if (parsed.data.driver_id) {
      ordersQuery = ordersQuery.eq('driver_id', parsed.data.driver_id)
    }
    if (parsed.data.status) {
      ordersQuery = ordersQuery.eq('status', parsed.data.status)
    }

    // Role-based access control
    if (userProfile.role === 'restaurant') {
      ordersQuery = ordersQuery.eq('restaurant_id', user.id)
    } else if (userProfile.role === 'driver') {
      ordersQuery = ordersQuery.eq('driver_id', user.id)
    }
    // Admin can see all orders

    // Apply limit and ordering
    ordersQuery = ordersQuery.order('created_at', { ascending: false }).limit(parsed.data.limit)

    const { data: orders, error: ordersError } = await ordersQuery

    if (ordersError) {
      logger.error('Failed to fetch orders for analytics:', ordersError)
      return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 })
    }

    // Type assertion for orders
    const typedOrders = orders as unknown as OrderWithItems[]

    // Calculate analytics metrics
    const analytics = {
      summary: {
        total_orders: typedOrders?.length || 0,
        total_revenue: typedOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0,
        completed_orders: typedOrders?.filter((order) => order.status === 'completed').length || 0,
        pending_orders: typedOrders?.filter((order) => order.status === 'pending').length || 0,
        cancelled_orders: typedOrders?.filter((order) => order.status === 'cancelled').length || 0,
      },
      orders_by_status:
        typedOrders?.reduce(
          (acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1
            return acc
          },
          {} as Record<string, number>
        ) || {},
      profit_analysis: calculateProfitAnalysis(typedOrders || []),
      top_products: calculateTopProducts(typedOrders || []),
      performance_metrics: calculatePerformanceMetrics(typedOrders || []),
    }

    return NextResponse.json({
      success: true,
      analytics,
      data: orders,
      query: parsed.data,
    })
  } catch (error) {
    logger.error('Analytics API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper functions for analytics calculations

function calculateProfitAnalysis(orders: OrderWithItems[]) {
  let totalCost = 0
  let totalRevenue = 0
  let totalProfit = 0

  orders.forEach((order) => {
    if (order.order_items) {
      order.order_items.forEach((item) => {
        const cost = (item.cost_price || 0) * item.quantity
        const revenue = (item.selling_price || 0) * item.quantity
        totalCost += cost
        totalRevenue += revenue
        totalProfit += revenue - cost
      })
    }
  })

  return {
    total_cost: totalCost,
    total_revenue: totalRevenue,
    total_profit: totalProfit,
    profit_margin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
  }
}

function calculateTopProducts(orders: OrderWithItems[]) {
  const productStats: Record<
    string,
    { name: string; total_quantity: number; total_revenue: number }
  > = {}

  orders.forEach((order) => {
    if (order.order_items) {
      order.order_items.forEach((item) => {
        const productId = item.products?.id
        const productName = item.products?.name || 'Unknown Product'

        if (productId) {
          if (!productStats[productId]) {
            productStats[productId] = {
              name: productName,
              total_quantity: 0,
              total_revenue: 0,
            }
          }

          productStats[productId].total_quantity += item.quantity
          productStats[productId].total_revenue += (item.selling_price || 0) * item.quantity
        }
      })
    }
  })

  return Object.values(productStats)
    .sort((a, b) => b.total_revenue - a.total_revenue)
    .slice(0, 10)
}

function calculatePerformanceMetrics(orders: OrderWithItems[]) {
  const completedOrders = orders.filter((order) => order.status === 'completed')

  if (completedOrders.length === 0) {
    return {
      average_delivery_time: 0,
      on_time_delivery_rate: 0,
      total_deliveries: 0,
    }
  }

  // Calculate average delivery time (simplified - in real app, you'd track actual delivery timestamps)
  const avgDeliveryTime =
    completedOrders.length > 0
      ? completedOrders.reduce((sum, order) => {
          const created = new Date(order.created_at).getTime()
          const updated = new Date(order.updated_at).getTime()
          return sum + (updated - created)
        }, 0) /
        completedOrders.length /
        (1000 * 60 * 60) // Convert to hours
      : 0

  return {
    average_delivery_time: Math.round(avgDeliveryTime * 100) / 100, // Round to 2 decimal places
    on_time_delivery_rate: 0, // Would need delivery time targets to calculate
    total_deliveries: completedOrders.length,
  }
}
