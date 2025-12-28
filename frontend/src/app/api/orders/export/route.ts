import { createClient } from '@/lib/supabase/server'

import { type NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Create a TransformStream to stream data
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()
  const encoder = new TextEncoder()

  // Start background processing
  void (async () => {
    try {
      // Write BOM for Excel compatibility
      await writer.write(encoder.encode('\uFEFF'))

      // Write Header
      const header = 'Order ID,Date,Status,Total Amount (GEL),Items\n'
      await writer.write(encoder.encode(header))

      // Fetch data in chunks (cursor-like)
      const BATCH_SIZE = 1000
      let rangeStart = 0
      let hasMore = true

      while (hasMore) {
        const { data: orders, error } = await supabase
          .from('orders')
          .select(
            `
            id,
            created_at,
            status,
            total_amount,
            items:order_items (
              quantity,
              unit_price,
              product:products (name)
            )
          `
          )
          .eq('restaurant_id', user.id)
          .order('created_at', { ascending: false })
          .range(rangeStart, rangeStart + BATCH_SIZE - 1)

        if (error) throw error

        if (!orders || orders.length === 0) {
          hasMore = false
          break
        }

        // Process and write chunk
        let chunk = ''
        for (const order of orders) {
          const itemsStr = order.items
            .map(
              (i: { product: { name: string }; quantity: number }) =>
                `${i.product.name} (${i.quantity})`
            )
            .join('; ')
            .replace(/"/g, '""') // Escape quotes

          const row = [
            order.id,
            new Date(order.created_at).toLocaleString('ka-GE'),
            order.status,
            order.total_amount.toFixed(2),
            `"${itemsStr}"`, // Wrap items in quotes
          ].join(',')

          chunk += `${row}\n`
        }

        await writer.write(encoder.encode(chunk))

        if (orders.length < BATCH_SIZE) {
          hasMore = false
        } else {
          rangeStart += BATCH_SIZE
        }
      }
    } catch (err) {
      logger.error('Streaming error:', err)
      // Note: Cannot send error response if headers already sent
    } finally {
      await writer.close()
    }
  })()

  return new NextResponse(stream.readable, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="orders-export-${new Date().toISOString().split('T')[0]}.csv"`,
      'Cache-Control': 'no-cache',
    },
  })
}
