import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: Request) {
  const cookieStore = await cookies()

  // 1. Authenticate User
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          // API route doesn't need to set cookies usually
        },
      },
    }
  )

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Initialize Service Role Client
  // Ensure we have the key
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    logger.error('SUPABASE_SERVICE_ROLE_KEY is missing')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const body = await request.json()
    const { items, delivery_address, delivery_time, special_instructions } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 })
    }

    const totalAmount = items.reduce(
      (sum: number, item: any) => sum + item.product.price * item.quantity,
      0
    )

    // 3. Create Order
    const { data: order, error: orderError } = await adminSupabase
      .from('orders')
      .insert({
        restaurant_id: user.id,
        total_amount: totalAmount,
        delivery_address,
        delivery_time,
        notes: special_instructions,
        status: 'pending',
      })
      .select()
      .single()

    if (orderError) throw orderError

    // 4. Create Order Items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product.id,
      quantity: item.quantity,
      unit_price: item.product.price,
      total_price: item.product.price * item.quantity,
      notes: item.notes,
    }))

    const { error: itemsError } = await adminSupabase.from('order_items').insert(orderItems)

    if (itemsError) {
      // Rollback order if items fail
      await adminSupabase.from('orders').delete().eq('id', order.id)
      throw itemsError
    }

    return NextResponse.json(order)
  } catch (error: any) {
    logger.error('Order creation failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
