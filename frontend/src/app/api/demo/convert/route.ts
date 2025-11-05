import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { DemoUtils } from '@/lib/demo-utils'

export async function POST(request: NextRequest) {
  try {
    const { conversionType, contactInfo } = await request.json()
    const session = DemoUtils.getCurrentDemoSession()

    if (!session) {
      return NextResponse.json({ error: 'No active demo session' }, { status: 404 })
    }

    // Track conversion attempt (mock)
    await DemoUtils.attemptConversion(session.id, 'demo_user_id', conversionType)

    // Mock storing contact information
    logger.info('Demo conversion tracked:', {
      sessionId: session.id,
      conversionType,
      contactInfo,
    })

    return NextResponse.json({
      success: true,
      message: 'Conversion tracked successfully',
      conversion_type: conversionType,
    })
  } catch (error) {
    logger.error('Demo conversion error:', error)
    return NextResponse.json({ error: 'Failed to track conversion' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = DemoUtils.getCurrentDemoSession()

    if (!session) {
      return NextResponse.json({ error: 'No active demo session' }, { status: 404 })
    }

    // Mock conversion history
    return NextResponse.json({
      conversions: [],
      session_info: {
        session_id: session.id,
        conversion_attempted: false,
      },
    })
  } catch (error) {
    logger.error('Demo conversion status error:', error)
    return NextResponse.json({ error: 'Failed to get conversion status' }, { status: 500 })
  }
}
