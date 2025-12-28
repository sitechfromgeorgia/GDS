import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch orders assigned to this driver
  // We use the 'orders' table directly now
  const { data: deliveries, error } = await supabase
    .from('orders')
    .select('*')
    .eq('driver_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Error fetching driver orders:', error)
    return NextResponse.json({ error: error.message, details: error }, { status: 500 })
  }

  // Map to a "delivery" like structure if needed, or just return orders
  // The frontend expects a certain structure, let's adapt it or return as is.
  // The frontend interface Delivery expects: id, orderId, customerName...
  // We'll return the raw data and let the frontend adapt, or adapt here.
  // For now, return raw.
  return NextResponse.json(deliveries)
}

export async function PATCH(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { delivery_id, status } = body // delivery_id is actually order_id now

    if (!delivery_id || !status) {
      return NextResponse.json(
        { error: 'Missing delivery_id (order_id) or status' },
        { status: 400 }
      )
    }

    // Update order status
    // RLS: "Admins and owners can update orders" -> driver_id = auth.uid()
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', delivery_id)
      .eq('driver_id', user.id) // Ensure driver owns this order
      .select()
      .single()

    if (orderError) throw orderError

    return NextResponse.json(order)
  } catch (error: any) {
    logger.error('Error updating order status:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
