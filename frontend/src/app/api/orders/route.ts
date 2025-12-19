import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createOrderSchema } from '@/lib/validators/restaurant/orders'
import { OrderService } from '@/lib/services/restaurant/order.service'
import { z } from 'zod'

export async function POST(req: NextRequest) {
    try {
        const supabase = await createServerClient()

        // 1. Authenticate user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 2. Parse and validate request body
        const body = await req.json()
        const validatedData = createOrderSchema.parse(body)

        // 3. Create order via service
        const order = await OrderService.createOrder(user.id, validatedData)

        return NextResponse.json(order, { status: 201 })
    } catch (error) {
        console.error('Order creation failed:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 })
        }

        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
