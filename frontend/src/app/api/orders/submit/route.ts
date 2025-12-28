import { logger } from '@/lib/logger'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { OrderSubmissionInput } from '@/types/order-submission'
import { createOrderSubmissionService } from '@/services/order-submission.service'

export async function POST(request: NextRequest) {
  try {
    const body: OrderSubmissionInput = await request.json()

    // Validate required fields
    if (!body.restaurantId) {
      return NextResponse.json(
        {
          success: false,
          message: 'რესტორნის ID აუცილებელია',
        },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = await createServerClient()

    // Get user session (optional for demo/guest orders)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Initialize order submission service
    const orderService = createOrderSubmissionService({
      restaurantId: body.restaurantId,
      userId: user?.id,
      enableNotifications: true,
      autoConfirm: false,
      rushDeliveryAvailable: true,
      requireDeliveryAddress: true,
      maxOrderValue: 10000,
      minOrderValue: 100,
    })

    // Submit order
    const result = await orderService.submitOrder(body)

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    logger.error('Order submission API error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'შეკვეთის გაგზავნა ვერ მოხერხდა',
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')
    const userId = searchParams.get('userId')

    if (!restaurantId) {
      return NextResponse.json(
        {
          success: false,
          message: 'რესტორნის ID აუცილებელია',
        },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = await createServerClient()

    // Get user session
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Initialize order submission service
    const orderService = createOrderSubmissionService({
      restaurantId,
      userId: user?.id || userId || undefined,
      enableNotifications: true,
      autoConfirm: false,
    })

    // Get order statistics
    const stats = await orderService.getOrderStats()

    return NextResponse.json(
      {
        success: true,
        data: stats,
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error('Order stats API error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'სტატისტიკის მიღება ვერ მოხერხდა',
      },
      { status: 500 }
    )
  }
}
