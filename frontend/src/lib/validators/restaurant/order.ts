import { z } from 'zod'

export const orderItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().positive(),
  unit: z.string(),
  special_instructions: z.string().optional(),
})

export const createOrderSchema = z.object({
  delivery_address: z.string().min(5, 'Delivery address is required'),
  special_instructions: z.string().optional(),
  items: z.array(orderItemSchema).min(1, 'Order must contain at least one item'),
})

export const orderCommentSchema = z.object({
  comment_text: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment is too long'),
  comment_type: z.enum(['general', 'issue', 'praise']).default('general'),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type OrderItemInput = z.infer<typeof orderItemSchema>
export type OrderCommentInput = z.infer<typeof orderCommentSchema>
