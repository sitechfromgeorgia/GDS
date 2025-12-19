import { createServerClient } from '@/lib/supabase/server'
import { CreateOrderInput } from '@/lib/validators/restaurant/orders'
import { Database } from '@/types/database'

export class OrderService {
    static async createOrder(userId: string, data: CreateOrderInput) {
        const supabase = await createServerClient()

        // 1. Get restaurant profile to verify role
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, role')
            .eq('id', userId)
            .single()

        if (profileError || !profile) {
            throw new Error('User profile not found')
        }

        if (profile.role !== 'restaurant') {
            throw new Error('Unauthorized: Only restaurants can create orders')
        }

        // 2. Create order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                restaurant_id: userId,
                status: 'pending',
                delivery_address: data.delivery_address,
                special_instructions: data.special_instructions,
                total_amount: 0, // Will be calculated by admin
            })
            .select()
            .single()

        if (orderError) {
            throw new Error(`Failed to create order: ${orderError.message}`)
        }

        // 3. Create order items
        const orderItems = data.items.map((item) => ({
            order_id: order.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: 0, // Will be set by admin
            subtotal: 0, // Will be calculated by admin
            total_price: 0, // Will be set by admin
        }))

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems)

        if (itemsError) {
            // Rollback order if items fail (manual rollback since no transactions in HTTP API)
            await supabase.from('orders').delete().eq('id', order.id)
            throw new Error(`Failed to create order items: ${itemsError.message}`)
        }

        return order
    }
}
