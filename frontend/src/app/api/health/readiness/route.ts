/**
 * Kubernetes Readiness Probe
 * Checks if the application is ready to serve traffic
 */

import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    // Check critical dependencies
    const supabase = createServerClient()
    const { error } = await supabase
      .from('profiles')
      .select('id', { head: true })
      .limit(1)

    if (error) {
      return NextResponse.json(
        {
          status: 'not_ready',
          reason: 'Database connection failed',
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      )
    }

    return NextResponse.json({
      status: 'ready',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'not_ready',
        reason: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    )
  }
}
