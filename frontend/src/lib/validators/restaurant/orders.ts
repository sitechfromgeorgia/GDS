import { z } from 'zod'

export const orderItemSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().positive('Quantity must be at least 1'),
  unit: z.string().min(1, 'Unit is required'),
  special_instructions: z.string().optional(),
})

export const createOrderSchema = z.object({
  delivery_address: z.string().min(5, 'Delivery address is too short'),
  special_instructions: z.string().optional(),
  items: z.array(orderItemSchema).min(1, 'Order must contain at least one item'),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type OrderItemInput = z.infer<typeof orderItemSchema>
