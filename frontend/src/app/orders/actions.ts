'use server'
import { logger } from '@/lib/logger'
import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { Database } from '@/types/database'
import type { Order, OrderItem } from '@/types/database'

// Validation schemas
const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        quantity: z.number().int().positive().max(1000),
      })
    )
    .min(1)
    .max(100),
  notes: z.string().max(1000).optional(),
})

const updateOrderStatusSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum([
    'pending',
    'confirmed',
    'priced',
    'assigned',
    'out_for_delivery',
    'delivered',
    'completed',
    'cancelled',
  ]),
  notes: z.string().max(1000).optional(),
})

const assignOrderSchema = z.object({
  orderId: z.string().uuid(),
  driverId: z.string().uuid(),
})

const setPricingSchema = z.object({
  orderId: z.string().uuid(),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        cost_price: z.number().positive(),
        selling_price: z.number().positive(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
})

const cancelOrderSchema = z.object({
  orderId: z.string().uuid(),
  reason: z.string().min(1).max(500),
})

// Server Actions

/**
 * Create a new order (Restaurant only)
 */
export async function createOrder(formData: FormData) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Not authenticated' }
    }

    // Verify role

    const { data: profile, error: profileError } = await (supabase.from('profiles') as any)
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return { error: 'User profile not found' }
    }

    if (profile.role !== 'restaurant') {
      return { error: 'Unauthorized: Only restaurants can create orders' }
    }

    // Parse and validate input
    const rawData = {
      items: JSON.parse(formData.get('items') as string),
      notes: (formData.get('notes') as string) || undefined,
    }

    const parsed = createOrderSchema.safeParse(rawData)
    if (!parsed.success) {
      return {
        error: 'Invalid input',
        details: parsed.error.format(),
      }
    }

    // Create order

    const { data: order, error: orderError } = await (supabase.from('orders') as any)
      .insert({
        restaurant_id: user.id,
        status: 'pending',
        notes: parsed.data.notes,
      })
      .select()
      .single()

    if (orderError) {
      logger.error('Failed to create order:', orderError)
      return { error: 'Failed to create order' }
    }

    // Create order items
    const orderItems = parsed.data.items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
    }))

    const { error: itemsError } = await (supabase.from('order_items') as any).insert(orderItems)

    if (itemsError) {
      // Rollback: delete order

      await (supabase.from('orders') as any).delete().eq('id', order.id)
      logger.error('Failed to create order items:', itemsError)
      return { error: 'Failed to create order items' }
    }

    // Revalidate cache
    revalidatePath('/dashboard/restaurant/orders')

    return {
      success: true,
      orderId: order.id,
      message: 'Order created successfully',
    }
  } catch (error) {
    logger.error('Unexpected error in createOrder:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Update order status (Role-based permissions)
 */
export async function updateOrderStatus(formData: FormData) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Not authenticated' }
    }

    // Get user role

    const { data: profile, error: profileError } = await (supabase.from('profiles') as any)
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return { error: 'User profile not found' }
    }

    // Parse and validate input
    const rawData = {
      orderId: formData.get('orderId') as string,
      status: formData.get('status') as string,
      notes: (formData.get('notes') as string) || undefined,
    }

    const parsed = updateOrderStatusSchema.safeParse(rawData)
    if (!parsed.success) {
      return {
        error: 'Invalid input',
        details: parsed.error.format(),
      }
    }

    // Check permissions based on status change and role

    const { data: order, error: orderError } = await (supabase.from('orders') as any)
      .select('restaurant_id, driver_id, status')
      .eq('id', parsed.data.orderId)
      .single()

    if (orderError || !order) {
      return { error: 'Order not found' }
    }

    // Permission checks
    const canUpdate = (() => {
      switch (parsed.data.status) {
        case 'confirmed':
          return profile.role === 'admin'
        case 'priced':
          return profile.role === 'admin'
        case 'assigned':
          return profile.role === 'admin'
        case 'out_for_delivery':
          return profile.role === 'driver' && order.driver_id === user.id
        case 'delivered':
          return profile.role === 'driver' && order.driver_id === user.id
        case 'completed':
          return profile.role === 'restaurant' && order.restaurant_id === user.id
        case 'cancelled':
          return (
            profile.role === 'admin' ||
            (profile.role === 'restaurant' &&
              order.restaurant_id === user.id &&
              order.status === 'pending')
          )
        default:
          return false
      }
    })()

    if (!canUpdate) {
      return { error: 'Unauthorized: Insufficient permissions for this status update' }
    }

    // Business logic validations
    if (parsed.data.status === 'completed' && order.status !== 'delivered') {
      return { error: 'Order must be delivered before it can be completed' }
    }

    if (parsed.data.status === 'delivered' && order.status !== 'out_for_delivery') {
      return { error: 'Order must be out for delivery before it can be marked as delivered' }
    }

    // Update order
    const updateData = {
      status: parsed.data.status,
      updated_at: new Date().toISOString(),
    } as Record<string, any>

    // Add notes if provided
    if (parsed.data.notes) {
      updateData.notes = parsed.data.notes
    }

    const { data: updatedOrder, error: updateError } = await (supabase.from('orders') as any)
      .update(updateData)
      .eq('id', parsed.data.orderId)
      .select()
      .single()

    if (updateError) {
      logger.error('Failed to update order status:', updateError)
      return { error: 'Failed to update order status' }
    }

    // Revalidate relevant paths
    revalidatePath('/dashboard/restaurant/orders')
    revalidatePath('/dashboard/driver/orders')
    revalidatePath('/dashboard/admin/orders')

    return {
      success: true,
      order: updatedOrder,
      message: `Order status updated to ${parsed.data.status}`,
    }
  } catch (error) {
    logger.error('Unexpected error in updateOrderStatus:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Assign order to driver (Admin only)
 */
export async function assignOrderToDriver(formData: FormData) {
  try {
    const supabase = await createServerClient()
    // Verify authentication and admin role
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Not authenticated' }
    }

    const { data: profile, error: profileError } = await (supabase.from('profiles') as any)
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return { error: 'User profile not found' }
    }

    if (profile.role !== 'admin') {
      return { error: 'Unauthorized: Admin access required' }
    }

    // Parse and validate input
    const rawData = {
      orderId: formData.get('orderId') as string,
      driverId: formData.get('driverId') as string,
    }

    const parsed = assignOrderSchema.safeParse(rawData)
    if (!parsed.success) {
      return {
        error: 'Invalid input',
        details: parsed.error.format(),
      }
    }

    // Verify order exists and is in correct state
    const { data: order, error: orderError } = await (supabase.from('orders') as any)
      .select('status')
      .eq('id', parsed.data.orderId)
      .single()

    if (orderError || !order) {
      return { error: 'Order not found' }
    }

    if (order.status !== 'priced') {
      return { error: 'Order must be priced before assignment' }
    }

    // Verify driver exists and is active
    const { data: driver, error: driverError } = await (supabase.from('profiles') as any)
      .select('role, is_active')
      .eq('id', parsed.data.driverId)
      .single()

    if (driverError || !driver) {
      return { error: 'Driver not found' }
    }

    if (driver.role !== 'driver' || !driver.is_active) {
      return { error: 'Invalid or inactive driver' }
    }

    // Assign order to driver
    const { data: updatedOrder, error: updateError } = await (supabase.from('orders') as any)
      .update({
        driver_id: parsed.data.driverId,
        status: 'assigned',
        updated_at: new Date().toISOString(),
      })
      .eq('id', parsed.data.orderId)
      .select()
      .single()

    if (updateError) {
      logger.error('Failed to assign order:', updateError)
      return { error: 'Failed to assign order to driver' }
    }

    // Revalidate paths
    revalidatePath('/dashboard/admin/orders')
    revalidatePath('/dashboard/driver/orders')

    return {
      success: true,
      order: updatedOrder,
      message: 'Order assigned to driver successfully',
    }
  } catch (error) {
    logger.error('Unexpected error in assignOrderToDriver:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Set pricing for order items (Admin only)
 */
export async function setOrderPricing(formData: FormData) {
  try {
    const supabase = await createServerClient()
    // Verify authentication and admin role
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Not authenticated' }
    }

    const { data: profile, error: profileError } = await (supabase.from('profiles') as any)
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return { error: 'User profile not found' }
    }

    if (profile.role !== 'admin') {
      return { error: 'Unauthorized: Admin access required' }
    }

    // Parse and validate input
    const rawData = {
      orderId: formData.get('orderId') as string,
      items: JSON.parse(formData.get('items') as string),
    }

    const parsed = setPricingSchema.safeParse(rawData)
    if (!parsed.success) {
      return {
        error: 'Invalid input',
        details: parsed.error.format(),
      }
    }

    // Verify order exists and is in correct state
    const { data: order, error: orderError } = await (supabase.from('orders') as any)
      .select('status')
      .eq('id', parsed.data.orderId)
      .single()

    if (orderError || !order) {
      return { error: 'Order not found' }
    }

    if (order.status !== 'confirmed') {
      return { error: 'Order must be confirmed before pricing' }
    }

    // Update order items with pricing
    const updatePromises = parsed.data.items.map((item) =>
      (supabase.from('order_items') as any)
        .update({
          cost_price: item.cost_price,
          selling_price: item.selling_price,
        })
        .eq('order_id', parsed.data.orderId)
        .eq('product_id', item.product_id)
    )

    const results = await Promise.all(updatePromises)
    const hasErrors = results.some((result: { error?: unknown }) => result?.error)

    if (hasErrors) {
      logger.error('Failed to update some order items:', results)
      return { error: 'Failed to update order pricing' }
    }

    // Calculate total amount
    const totalAmount = parsed.data.items.reduce(
      (sum, item) => sum + item.selling_price * item.quantity,
      0
    )

    // Update order status and total
    const { data: updatedOrder, error: orderUpdateError } = await (supabase.from('orders') as any)
      .update({
        status: 'priced',
        total_amount: totalAmount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', parsed.data.orderId)
      .select()
      .single()

    if (orderUpdateError) {
      logger.error('Failed to update order:', orderUpdateError)
      return { error: 'Failed to finalize order pricing' }
    }

    // Revalidate paths
    revalidatePath('/dashboard/admin/orders')

    return {
      success: true,
      order: updatedOrder,
      message: 'Order pricing set successfully',
    }
  } catch (error) {
    logger.error('Unexpected error in setOrderPricing:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Cancel order (Admin or Restaurant with restrictions)
 */
export async function cancelOrder(formData: FormData) {
  try {
    const supabase = await createServerClient()
    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Not authenticated' }
    }

    // Get user role
    const { data: profile, error: profileError } = await (supabase.from('profiles') as any)
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return { error: 'User profile not found' }
    }

    // Parse and validate input
    const rawData = {
      orderId: formData.get('orderId') as string,
      reason: formData.get('reason') as string,
    }

    const parsed = cancelOrderSchema.safeParse(rawData)
    if (!parsed.success) {
      return {
        error: 'Invalid input',
        details: parsed.error.format(),
      }
    }

    // Verify order exists and check permissions
    const { data: order, error: orderError } = await (supabase.from('orders') as any)
      .select('restaurant_id, status')
      .eq('id', parsed.data.orderId)
      .single()

    if (orderError || !order) {
      return { error: 'Order not found' }
    }

    // Permission checks
    const canCancel =
      profile.role === 'admin' ||
      (profile.role === 'restaurant' &&
        order.restaurant_id === user.id &&
        order.status === 'pending')

    if (!canCancel) {
      return { error: 'Unauthorized: Cannot cancel this order' }
    }

    // Update order status to cancelled
    const { data: updatedOrder, error: updateError } = await (supabase.from('orders') as any)
      .update({
        status: 'cancelled',
        notes: `CANCELLED: ${parsed.data.reason}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', parsed.data.orderId)
      .select()
      .single()

    if (updateError) {
      logger.error('Failed to cancel order:', updateError)
      return { error: 'Failed to cancel order' }
    }

    // Revalidate paths
    revalidatePath('/dashboard/restaurant/orders')
    revalidatePath('/dashboard/admin/orders')

    return {
      success: true,
      order: updatedOrder,
      message: 'Order cancelled successfully',
    }
  } catch (error) {
    logger.error('Unexpected error in cancelOrder:', error)
    return { error: 'An unexpected error occurred' }
  }
}
