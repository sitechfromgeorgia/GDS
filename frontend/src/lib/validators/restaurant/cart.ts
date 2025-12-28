import { z } from 'zod'

export const cartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive().min(1),
})

export const addToCartSchema = cartItemSchema

export const updateCartItemSchema = cartItemSchema

export const removeFromCartSchema = z.object({
  productId: z.string().uuid(),
})

export const cartSnapshotSchema = z.object({
  items: z.array(cartItemSchema),
})

export type CartItemInput = z.infer<typeof cartItemSchema>
export type AddToCartInput = z.infer<typeof addToCartSchema>
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>
