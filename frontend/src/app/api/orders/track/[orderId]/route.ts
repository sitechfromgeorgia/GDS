import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createOrderSubmissionService } from '@/services/order-submission.service'
import { validateOrderTracking } from '@/lib/validators/orders/order-submission'

interface RouteContext {
  params: Promise<{ orderId: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // Await params promise (Next.js 15 requirement)
    const { orderId } = await context.params

    // Validate route parameter
    const validationResult = validateOrderTracking({ orderId })

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'შეკვეთის ID არასწორია',
          errors: validationResult.errors,
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

    // Get restaurant ID from order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('restaurant_id')
      .eq('id', orderId)
      .single()

    if (orderError || !orderData) {
      return NextResponse.json({ success: false, message: 'შეკვეთა არ მოიძებნა' }, { status: 404 })
    }

    // TypeScript workaround: type assertion after null check
    const restaurantId = (orderData as { restaurant_id: string }).restaurant_id

    // Initialize order submission service
    const orderService = createOrderSubmissionService({
      restaurantId,
      userId: user?.id,
      enableNotifications: true,
      autoConfirm: false,
    })

    // Track order
    const order = await orderService.trackOrder(orderId)

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'შეკვეთის ნახვა ვერ მოხერხდა' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: order,
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error('Order tracking API error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'შეკვეთის თვალყურის დევნება ვერ მოხერხდა',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    // Await params promise (Next.js 15 requirement)
    const { orderId } = await context.params

    // Get user session
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Get request body for cancellation reason
    const body = await request.json().catch(() => ({}))
    const { reason } = body as { reason?: string }

    // Validate route parameter
    const validationResult = validateOrderTracking({ orderId })

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'შეკვეთის ID არასწორია',
          errors: validationResult.errors,
        },
        { status: 400 }
      )
    }

    // Get order data to initialize service
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('restaurant_id')
      .eq('id', orderId)
      .single()

    if (orderError || !orderData) {
      return NextResponse.json({ success: false, message: 'შეკვეთა არ მოიძებნა' }, { status: 404 })
    }

    // TypeScript workaround: type assertion after null check
    const restaurantId = (orderData as { restaurant_id: string }).restaurant_id

    // Initialize order submission service
    const orderService = createOrderSubmissionService({
      restaurantId,
      userId: user?.id,
      enableNotifications: true,
    })

    // Cancel order
    const result = await orderService.cancelOrder(orderId, reason)

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    })
  } catch (error) {
    logger.error('Order cancellation API error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'შეკვეთის გაუქმება ვერ მოხერხდა',
      },
      { status: 500 }
    )
  }
}
