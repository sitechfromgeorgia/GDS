// GET /api/analytics/export - Export analytics data as CSV
// Based on specs/001-analytics-dashboard/contracts/csv-export.json

import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { exportQueryParamsSchema, parseStatusParam } from '@/lib/validators/analytics'
import { analyticsService } from '@/lib/supabase/analytics.service'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check user role (Admin or Operations Manager)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions. Admin role required.' },
        { status: 403 }
      )
    }

    // TypeScript workaround: type assertion after null check
    const userRole = (profile as { role: string }).role
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions. Admin role required.' },
        { status: 403 }
      )
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const statusParam = searchParams.get('status')

    if (!from || !to) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Missing required parameters: from, to' },
        { status: 400 }
      )
    }

    // Validate query parameters
    const validation = exportQueryParamsSchema.safeParse({
      from,
      to,
      status: statusParam || undefined,
    })

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: validation.error.issues[0]?.message || 'Invalid parameters',
        },
        { status: 400 }
      )
    }

    // Parse status filter
    let statusFilter
    try {
      statusFilter = parseStatusParam(statusParam || undefined)
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: error instanceof Error ? error.message : 'Invalid status values',
        },
        { status: 400 }
      )
    }

    // Fetch export data
    const orders = await analyticsService.getExportData({ from, to }, { status: statusFilter })

    // Generate CSV
    const csv = generateCSV(orders)

    // Return CSV with appropriate headers
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="analytics-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    logger.error('Export API Error:', error)
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to export data',
      },
      { status: 500 }
    )
  }
}

// Helper function to generate CSV from order data
function generateCSV(orders: any[]): string {
  // CSV header
  const headers = [
    'Order ID',
    'Restaurant',
    'Driver',
    'Status',
    'Created At',
    'Delivery Time',
    'Duration (min)',
    'Total Amount (GEL)',
    'Delivery Fee (GEL)',
    'Tax Amount (GEL)',
  ]

  const csvRows = [headers.join(',')]

  // Add data rows
  for (const order of orders) {
    const restaurantName = order.restaurant?.full_name || 'Unknown'
    const driverName = order.driver?.full_name || ''

    // Calculate duration if both timestamps exist
    let duration = ''
    if (order.created_at && order.delivery_time) {
      const createdAt = new Date(order.created_at)
      const deliveryTime = new Date(order.delivery_time)
      const durationMs = deliveryTime.getTime() - createdAt.getTime()
      duration = Math.round(durationMs / (1000 * 60)).toString()
    }

    const row = [
      order.id || '',
      escapeCSV(restaurantName),
      escapeCSV(driverName),
      order.status || '',
      order.created_at || '',
      order.delivery_time || '',
      duration,
      formatCurrency(order.total_amount),
      formatCurrency(order.delivery_fee),
      formatCurrency(order.tax_amount),
    ]

    csvRows.push(row.join(','))
  }

  return csvRows.join('\n')
}

// Helper function to escape CSV values
function escapeCSV(value: string): string {
  if (!value) return ''
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

// Helper function to format currency
function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '0.00'
  return amount.toFixed(2)
}
