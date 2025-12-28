import { logger } from '@/lib/logger'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { DemoUtils } from '@/lib/demo-utils'
import { DEMO_ANALYTICS_DATA } from '@/lib/demo-data'

export async function GET() {
  try {
    const session = DemoUtils.getCurrentDemoSession()

    if (!session) {
      return NextResponse.json({ error: 'No active demo session' }, { status: 404 })
    }

    // Mock analytics data for demo
    return NextResponse.json({
      session_analytics: [],
      system_analytics: DEMO_ANALYTICS_DATA,
      session_info: {
        session_id: session.id,
        started_at: session.startedAt,
        current_role: session.role,
        tour_completed: false,
      },
    })
  } catch (error) {
    logger.error('Demo analytics error:', error)
    return NextResponse.json({ error: 'Failed to get demo analytics' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, metadata } = await request.json()
    const session = DemoUtils.getCurrentDemoSession()

    if (!session) {
      return NextResponse.json({ error: 'No active demo session' }, { status: 404 })
    }

    // Mock tracking for demo
    logger.info('Demo action tracked:', { action, metadata, sessionId: session.id })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Demo analytics tracking error:', error)
    return NextResponse.json({ error: 'Failed to track demo analytics' }, { status: 500 })
  }
}
