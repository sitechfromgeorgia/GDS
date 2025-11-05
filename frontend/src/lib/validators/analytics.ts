// Zod validation schemas for Analytics Dashboard
// Based on specs/001-analytics-dashboard/data-model.md

import { z } from 'zod'

// Order status enum
export const orderStatusSchema = z.enum([
  'pending',
  'confirmed',
  'priced',
  'assigned',
  'out_for_delivery',
  'delivered',
  'completed',
  'cancelled',
])

// Date range validation
export const dateRangeSchema = z
  .object({
    from: z.string().datetime({ message: 'Invalid ISO 8601 timestamp for "from" date' }),
    to: z.string().datetime({ message: 'Invalid ISO 8601 timestamp for "to" date' }),
  })
  .refine(
    (data) => {
      const fromDate = new Date(data.from)
      const toDate = new Date(data.to)
      return fromDate <= toDate
    },
    {
      message: '"from" date must be before or equal to "to" date',
    }
  )
  .refine(
    (data) => {
      const fromDate = new Date(data.from)
      const toDate = new Date(data.to)
      const diffInDays = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)
      return diffInDays <= 365
    },
    {
      message: 'Date range must not exceed 12 months (365 days)',
    }
  )

// Filter criteria validation
export const filterCriteriaSchema = z.object({
  status: z.array(orderStatusSchema).optional(),
})

// KPI query parameters (URL query string)
export const kpiQueryParamsSchema = z
  .object({
    from: z.string().datetime(),
    to: z.string().datetime(),
    status: z.string().optional(), // Comma-separated status values
  })
  .refine(
    (data) => {
      const fromDate = new Date(data.from)
      const toDate = new Date(data.to)
      return fromDate <= toDate
    },
    {
      message: '"from" must be <= "to"',
    }
  )
  .refine(
    (data) => {
      const fromDate = new Date(data.from)
      const toDate = new Date(data.to)
      const diffInDays = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)
      return diffInDays <= 365
    },
    {
      message: 'Date range must not exceed 365 days',
    }
  )

// Export query parameters (same as KPI)
export const exportQueryParamsSchema = kpiQueryParamsSchema

// KPI Summary response
export const kpiSummarySchema = z.object({
  orders_per_day: z.number().nonnegative().nullable(),
  on_time_rate: z.number().min(0).max(100).nullable(),
  avg_delivery_time: z.number().nonnegative().nullable(),
  total_orders: z.number().int().nonnegative(),
  excluded_count: z.number().int().nonnegative(),
  date_range: dateRangeSchema,
  filters: filterCriteriaSchema,
})

// Order export row
export const orderExportRowSchema = z.object({
  order_id: z.string().uuid(),
  restaurant_name: z.string(),
  driver_name: z.string().nullable(),
  status: orderStatusSchema,
  created_at: z.string().datetime(),
  delivery_time: z.string().datetime().nullable(),
  duration_minutes: z.number().nonnegative().nullable(),
  total_amount: z.string().regex(/^\d+\.\d{2} GEL$/),
  delivery_fee: z.string().regex(/^\d+\.\d{2} GEL$/),
  tax_amount: z.string().regex(/^\d+\.\d{2} GEL$/),
})

// Helper: Parse comma-separated status query param
export function parseStatusParam(
  statusParam?: string
): z.infer<typeof orderStatusSchema>[] | undefined {
  if (!statusParam) return undefined

  const statuses = statusParam.split(',').map((s) => s.trim())
  const result = z.array(orderStatusSchema).safeParse(statuses)

  if (!result.success) {
    throw new Error(`Invalid status values: ${result.error.message}`)
  }

  return result.data
}

// Helper: Validate date range client-side with user-friendly messages
export function validateDateRange(from: string, to: string): { valid: boolean; error?: string } {
  const result = dateRangeSchema.safeParse({ from, to })

  if (!result.success) {
    const firstError = result.error.issues[0]
    return { valid: false, error: firstError?.message || 'Invalid date range' }
  }

  return { valid: true }
}

// Helper: Check if date range is large (>90 days) for performance warning
export function isLargeDateRange(from: string, to: string): boolean {
  const fromDate = new Date(from)
  const toDate = new Date(to)
  const diffInDays = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)
  return diffInDays > 90
}
