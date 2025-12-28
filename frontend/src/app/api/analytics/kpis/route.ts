// GET /api/analytics/kpis - Fetch KPI metrics
// Based on specs/001-analytics-dashboard/contracts/kpi-api.json

import { logger } from '@/lib/logger'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { kpiQueryParamsSchema, parseStatusParam } from '@/lib/validators/analytics'
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
    const validation = kpiQueryParamsSchema.safeParse({
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

    // Fetch KPI data
    const kpiData = await analyticsService.getKPIs({ from, to }, { status: statusFilter })

    return NextResponse.json(kpiData, { status: 200 })
  } catch (error) {
    logger.error('KPI API Error:', error)
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to fetch KPIs',
      },
      { status: 500 }
    )
  }
}
