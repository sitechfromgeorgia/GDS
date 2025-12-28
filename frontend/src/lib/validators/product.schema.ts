import { z } from 'zod'

/**
 * Product validation schema
 */
export const ProductSchema = z.object({
  id: z.string().uuid('Invalid product ID format'),
  name: z.string().min(1, 'Product name is required'),
  category: z.string().min(1, 'Category is required'),
  unit: z.string().min(1, 'Unit is required'),
  is_active: z.boolean(),
  image_url: z.string().url('Invalid image URL').optional().nullable(),
  description: z.string().optional().nullable(),
})

/**
 * Array of products validation
 */
export const ProductArraySchema = z.array(ProductSchema)

/**
 * Category validation schema
 */
export const CategorySchema = z.string().min(1, 'Category cannot be empty')

/**
 * Array of categories validation
 */
export const CategoryArraySchema = z.array(CategorySchema)

/**
 * Product type inferred from schema
 */
export type ValidatedProduct = z.infer<typeof ProductSchema>

/**
 * Helper to validate product data
 */
export function validateProduct(data: unknown): ValidatedProduct {
  return ProductSchema.parse(data)
}

/**
 * Helper to validate product array
 */
export function validateProducts(data: unknown): ValidatedProduct[] {
  return ProductArraySchema.parse(data)
}

/**
 * Safe validation that returns Result type
 */
export function safeValidateProduct(
  data: unknown
): { success: true; data: ValidatedProduct } | { success: false; error: z.ZodError } {
  const result = ProductSchema.safeParse(data)
  return result.success
    ? { success: true, data: result.data }
    : { success: false, error: result.error }
}

/**
 * Safe validation for product arrays
 */
export function safeValidateProducts(
  data: unknown
): { success: true; data: ValidatedProduct[] } | { success: false; error: z.ZodError } {
  const result = ProductArraySchema.safeParse(data)
  return result.success
    ? { success: true, data: result.data }
    : { success: false, error: result.error }
}
