import { createClient } from '@/lib/supabase/server'

export interface AnalyticsSummary {
  totalRevenue: number
  totalOrders: number
  activeUsers: number
  averageOrderValue: number
}

export interface RecentOrder {
  id: string
  created_at: string
  status: string
  total_amount: number
  restaurant_name: string
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const supabase = await createClient()

  // Total Revenue (Completed orders)
  const { data: revenueData, error: revenueError } = await supabase
    .from('orders')
    .select('total_amount')
    .eq('status', 'completed')

  if (revenueError) throw revenueError

  const totalRevenue = revenueData.reduce((sum, order) => sum + (order.total_amount || 0), 0)

  // Total Orders
  const { count: totalOrders, error: ordersError } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })

  if (ordersError) throw ordersError

  // Active Users (Profiles)
  const { count: activeUsers, error: usersError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  if (usersError) throw usersError

  // Average Order Value
  const averageOrderValue = totalOrders ? totalRevenue / totalOrders : 0

  return {
    totalRevenue,
    totalOrders: totalOrders || 0,
    activeUsers: activeUsers || 0,
    averageOrderValue,
  }
}

export async function getRecentOrders(): Promise<RecentOrder[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      id,
      created_at,
      status,
      total_amount,
      profiles:restaurant_id (restaurant_name)
    `
    )
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) throw error

  return data.map((order: any) => ({
    id: order.id,
    created_at: order.created_at,
    status: order.status,
    total_amount: order.total_amount,
    restaurant_name: order.profiles?.restaurant_name || 'Unknown',
  }))
}
