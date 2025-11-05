import { z } from 'zod'

export const orderItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unit: z.string().min(1, 'Unit is required'),
  special_instructions: z.string().optional(),
})

export const orderCreateSchema = z.object({
  restaurant_id: z.string().uuid(),
  delivery_address: z.string().min(1, 'Delivery address is required'),
  special_instructions: z.string().optional(),
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
})

export const orderUpdateSchema = z.object({
  status: z
    .enum(['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'completed'])
    .optional(),
  driver_id: z.string().uuid().optional(),
  total_amount: z.number().min(0).optional(),
  special_instructions: z.string().optional(),
})

export const orderPricingSchema = z.object({
  pricing_data: z.record(
    z.string(),
    z.object({
      unit_price: z.number().min(0),
      total_price: z.number().min(0),
    })
  ),
})

export type OrderItem = z.infer<typeof orderItemSchema>
export type OrderCreateInput = z.infer<typeof orderCreateSchema>
export type OrderUpdateInput = z.infer<typeof orderUpdateSchema>
export type OrderPricingInput = z.infer<typeof orderPricingSchema>
