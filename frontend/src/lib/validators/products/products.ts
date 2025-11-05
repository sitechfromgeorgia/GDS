import { z } from 'zod'

export const productCreateSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  name_ka: z.string().min(1, 'Georgian name is required'),
  description: z.string().min(1, 'Product description is required'),
  description_ka: z.string().min(1, 'Georgian description is required'),
  category: z.string().min(1, 'Category is required'),
  unit: z.string().min(1, 'Unit is required'),
  price: z.number().min(0, 'Price must be non-negative'),
  image_url: z.string().url().optional(),
})

export const productUpdateSchema = z.object({
  name: z.string().min(1, 'Product name is required').optional(),
  name_ka: z.string().min(1, 'Georgian name is required').optional(),
  description: z.string().min(1, 'Product description is required').optional(),
  description_ka: z.string().min(1, 'Georgian description is required').optional(),
  category: z.string().min(1, 'Category is required').optional(),
  unit: z.string().min(1, 'Unit is required').optional(),
  price: z.number().min(0, 'Price must be non-negative').optional(),
  image_url: z.string().url().optional(),
  active: z.boolean().optional(),
})

export const productFilterSchema = z.object({
  category: z.string().optional(),
  active: z.boolean().optional(),
  search: z.string().optional(),
  min_price: z.number().min(0).optional(),
  max_price: z.number().min(0).optional(),
})

export type ProductCreateInput = z.infer<typeof productCreateSchema>
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>
export type ProductFilterInput = z.infer<typeof productFilterSchema>
