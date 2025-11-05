import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { DemoUtils } from '@/lib/demo-utils'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Initialize demo session
    const session = await DemoUtils.initializeDemoSession(userId)

    // Generate sample data
    const sampleData = await DemoUtils.generateSampleData()

    return NextResponse.json({
      success: true,
      session,
      sampleData,
    })
  } catch (error) {
    logger.error('Demo setup error:', error)
    return NextResponse.json({ error: 'Failed to setup demo' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = DemoUtils.getCurrentDemoSession()

    if (!session) {
      return NextResponse.json({ error: 'No active demo session' }, { status: 404 })
    }

    const sampleData = await DemoUtils.generateSampleData()

    return NextResponse.json({
      session,
      sampleData,
    })
  } catch (error) {
    logger.error('Demo status error:', error)
    return NextResponse.json({ error: 'Failed to get demo status' }, { status: 500 })
  }
}
