/**
 * Slow Queries API Endpoint - T044
 * Returns slow queries from pg_stat_statements (queries >100ms)
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'
import type { SlowQueryLog } from '@/types/performance'

// Create admin client for performance queries
function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing Supabase configuration')
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })
}

// Threshold for slow queries in milliseconds
const SLOW_QUERY_THRESHOLD_MS = 100

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const threshold = parseInt(searchParams.get('threshold') || String(SLOW_QUERY_THRESHOLD_MS), 10)

    const supabase = getAdminClient()

    // Try to get slow queries from pg_stat_statements
    // Note: This requires pg_stat_statements extension to be enabled
    const { data: slowQueries, error } = await supabase.rpc('get_slow_queries', {
      threshold_ms: threshold,
      query_limit: limit,
    })

    if (error) {
      // If RPC doesn't exist, return simulated data for development
      logger.warn('get_slow_queries RPC not available, using simulated data:', { error: error.message })

      const simulatedQueries: SlowQueryLog[] = [
        {
          queryid: 1,
          query: 'SELECT * FROM orders WHERE restaurant_id = $1 ORDER BY created_at DESC',
          calls: 1500,
          total_exec_time: 450,
          mean_exec_time: 0.3,
          min_exec_time: 0.1,
          max_exec_time: 2.5,
          stddev_exec_time: 0.15,
          rows: 75000,
          first_seen: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          last_seen: new Date(),
        },
        {
          queryid: 2,
          query:
            'SELECT COUNT(*), SUM(total_amount) FROM orders WHERE created_at >= $1 GROUP BY status',
          calls: 500,
          total_exec_time: 250,
          mean_exec_time: 0.5,
          min_exec_time: 0.2,
          max_exec_time: 3.0,
          stddev_exec_time: 0.25,
          rows: 4000,
          first_seen: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          last_seen: new Date(),
        },
        {
          queryid: 3,
          query:
            'SELECT p.*, o.status FROM products p JOIN order_items oi ON p.id = oi.product_id JOIN orders o ON oi.order_id = o.id WHERE o.restaurant_id = $1',
          calls: 200,
          total_exec_time: 180,
          mean_exec_time: 0.9,
          min_exec_time: 0.3,
          max_exec_time: 5.0,
          stddev_exec_time: 0.5,
          rows: 10000,
          first_seen: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          last_seen: new Date(),
        },
      ]

      return NextResponse.json({
        success: true,
        data: {
          queries: simulatedQueries,
          threshold_ms: threshold,
          is_simulated: true,
          timestamp: new Date().toISOString(),
        },
      })
    }

    // Transform the data to match SlowQueryLog interface
    const queries: SlowQueryLog[] = (slowQueries || []).map((q: Record<string, unknown>) => ({
      queryid: q.queryid as number,
      query: q.query as string,
      calls: q.calls as number,
      total_exec_time: q.total_exec_time as number,
      mean_exec_time: q.mean_exec_time as number,
      min_exec_time: q.min_exec_time as number,
      max_exec_time: q.max_exec_time as number,
      stddev_exec_time: q.stddev_exec_time as number,
      rows: q.rows as number,
      first_seen: q.first_seen ? new Date(q.first_seen as string) : undefined,
      last_seen: q.last_seen ? new Date(q.last_seen as string) : undefined,
    }))

    return NextResponse.json({
      success: true,
      data: {
        queries,
        threshold_ms: threshold,
        is_simulated: false,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    logger.error('Slow queries API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch slow queries',
      },
      { status: 500 }
    )
  }
}
