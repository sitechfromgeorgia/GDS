/**
 * Kubernetes Readiness Probe
 * Checks if the application is ready to serve traffic
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    logger.info('[Readiness] Starting health check...')
    logger.info('[Readiness] Environment vars:', {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      environment: process.env.NEXT_PUBLIC_ENVIRONMENT,
    })

    // Check critical dependencies - use admin client for health checks to bypass RLS
    logger.info('[Readiness] Creating Supabase admin client...')
    const supabase = createAdminClient()
    logger.info('[Readiness] Client created successfully')

    logger.info('[Readiness] Querying profiles table...')
    const { data, error } = await supabase.from('profiles').select('id').limit(1)

    if (error) {
      logger.error('[Readiness] Database error:', error)
      return NextResponse.json(
        {
          status: 'not_ready',
          reason: 'Database connection failed',
          error: error.message || `Error code: ${error.code}`,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      )
    }

    logger.info('[Readiness] Query successful, rows:', { count: data?.length ?? 0 })
    return NextResponse.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('[Readiness] Caught exception:', error)
    return NextResponse.json(
      {
        status: 'not_ready',
        reason: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}
