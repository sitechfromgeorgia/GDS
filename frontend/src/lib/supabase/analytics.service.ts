// Analytics Service for KPI calculations
// Based on specs/001-analytics-dashboard/data-model.md

import { createBrowserClient } from '@/lib/supabase'
import type { KPISummary, OrderStatus, DateRange, FilterCriteria } from '@/types/analytics'

export class AnalyticsService {
  private supabase = createBrowserClient()

  /**
   * Fetch KPI metrics for the specified date range and filters
   * @param dateRange Date range to filter orders
   * @param filters Optional status filters
   * @returns KPISummary with calculated metrics
   */
  async getKPIs(dateRange: DateRange, filters?: FilterCriteria): Promise<KPISummary> {
    const { from, to } = dateRange
    const statusFilter = filters?.status

    // Build base query
    let query = this.supabase
      .from('orders')
      .select('id, status, created_at, delivery_time')
      .gte('created_at', from)
      .lte('created_at', to)

    // Apply status filter if provided
    if (statusFilter && statusFilter.length > 0) {
      query = query.in('status', statusFilter)
    }

    const { data: orders, error } = await query

    if (error) {
      throw new Error(`Failed to fetch orders: ${error.message}`)
    }

    if (!orders || orders.length === 0) {
      return {
        orders_per_day: null,
        on_time_rate: null,
        avg_delivery_time: null,
        total_orders: 0,
        excluded_count: 0,
        date_range: dateRange,
        filters: filters || {},
      }
    }

    // Calculate metrics
    const totalOrders = orders.length
    const ordersPerDay = this.calculateOrdersPerDay(orders, from, to)
    const onTimeRate = this.calculateOnTimeRate(orders)
    const avgDeliveryTime = this.calculateAvgDeliveryTime(orders)
    const excludedCount = this.countExcludedOrders(orders)

    return {
      orders_per_day: ordersPerDay,
      on_time_rate: onTimeRate,
      avg_delivery_time: avgDeliveryTime,
      total_orders: totalOrders,
      excluded_count: excludedCount,
      date_range: dateRange,
      filters: filters || {},
    }
  }

  /**
   * Calculate orders per day
   * Formula: COUNT(*) / (date_range_days)
   */
  private calculateOrdersPerDay(
    orders: Array<{ created_at: string }>,
    from: string,
    to: string
  ): number {
    const fromDate = new Date(from)
    const toDate = new Date(to)
    const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

    if (daysDiff === 0) return orders.length // Same day

    const ordersPerDay = orders.length / daysDiff
    return Math.round(ordersPerDay * 100) / 100 // Round to 2 decimal places
  }

  /**
   * Calculate on-time delivery rate
   * Formula: (COUNT(on_time_orders) / COUNT(delivered_orders)) * 100
   * On-time = delivered within 90 minutes of created_at (60 min window + 30 min tolerance)
   */
  private calculateOnTimeRate(
    orders: Array<{ status: string; created_at: string; delivery_time: string | null }>
  ): number | null {
    // Filter for delivered/completed orders with non-null delivery_time
    const deliveredOrders = orders.filter(
      (order) =>
        (order.status === 'delivered' || order.status === 'completed') &&
        order.delivery_time !== null
    )

    if (deliveredOrders.length === 0) return null

    // Count on-time orders (delivered within 90 minutes)
    const onTimeOrders = deliveredOrders.filter((order) => {
      const createdAt = new Date(order.created_at)
      const deliveryTime = new Date(order.delivery_time!)
      const promisedTime = new Date(createdAt.getTime() + 90 * 60 * 1000) // 90 minutes

      return deliveryTime <= promisedTime
    })

    const onTimeRate = (onTimeOrders.length / deliveredOrders.length) * 100
    return Math.round(onTimeRate * 10) / 10 // Round to 1 decimal place
  }

  /**
   * Calculate average delivery time in minutes
   * Formula: AVG(delivery_time - created_at) for delivered/completed orders
   */
  private calculateAvgDeliveryTime(
    orders: Array<{ status: string; created_at: string; delivery_time: string | null }>
  ): number | null {
    // Filter for delivered/completed orders with non-null timestamps
    const completedOrders = orders.filter(
      (order) =>
        (order.status === 'delivered' || order.status === 'completed') &&
        order.delivery_time !== null &&
        order.created_at !== null
    )

    if (completedOrders.length === 0) return null

    // Calculate durations in minutes
    const durations = completedOrders.map((order) => {
      const createdAt = new Date(order.created_at)
      const deliveryTime = new Date(order.delivery_time!)
      return (deliveryTime.getTime() - createdAt.getTime()) / (1000 * 60) // Convert to minutes
    })

    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length
    return Math.round(avgDuration) // Round to whole minutes
  }

  /**
   * Count orders excluded from calculations due to missing data
   */
  private countExcludedOrders(
    orders: Array<{ delivery_time: string | null; created_at: string | null }>
  ): number {
    return orders.filter((order) => order.delivery_time === null || order.created_at === null)
      .length
  }

  /**
   * Fetch order data for CSV export
   * @param dateRange Date range to filter orders
   * @param filters Optional status filters
   * @returns Array of orders with joined profile data
   */
  async getExportData(dateRange: DateRange, filters?: FilterCriteria) {
    const { from, to } = dateRange
    const statusFilter = filters?.status

    // Build query with joins to profiles table for restaurant and driver names
    let query = this.supabase
      .from('orders')
      .select(
        `
        id,
        status,
        created_at,
        delivery_time,
        total_amount,
        delivery_fee,
        tax_amount,
        restaurant:restaurant_id(full_name),
        driver:driver_id(full_name)
      `
      )
      .gte('created_at', from)
      .lte('created_at', to)

    // Apply status filter if provided
    if (statusFilter && statusFilter.length > 0) {
      query = query.in('status', statusFilter)
    }

    const { data: orders, error } = await query

    if (error) {
      throw new Error(`Failed to fetch export data: ${error.message}`)
    }

    return orders || []
  }
}

// Singleton instance
export const analyticsService = new AnalyticsService()
