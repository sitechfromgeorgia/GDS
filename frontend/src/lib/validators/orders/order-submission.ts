import { z } from 'zod'

// Order submission validation schema
export const orderSubmissionSchema = z.object({
  restaurantId: z.string().uuid('რესტორნის ID არასწორია'),
  cartSessionId: z.string().optional(),
  specialInstructions: z.string().max(500, 'განსაკუთრებული ინსტრუქციები ძალიან გრძელია').optional(),
  preferredDeliveryDate: z.string().datetime().optional(),
  contactPhone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'ტელეფონის ნომერი არასწორია')
    .optional(),
  deliveryAddress: z.string().max(200, 'მიწოდების მისამართი ძალიან გრძელია').optional(),
  priority: z.enum(['normal', 'urgent']).default('normal'),
  paymentMethod: z.enum(['cash', 'card', 'transfer']).default('cash'),
})

// Order tracking validation schema
export const orderTrackingSchema = z.object({
  orderId: z.string().uuid('შეკვეთის ID არასწორია'),
})

// Order cancellation validation schema
export const orderCancellationSchema = z.object({
  orderId: z.string().uuid('შეკვეთის ID არასწორია'),
  reason: z.string().max(200, 'გაუქმების მიზეზი ძალიან გრძელია').optional(),
})

// Bulk order submission schema
export const bulkOrderSubmissionSchema = z.object({
  orders: z
    .array(orderSubmissionSchema)
    .min(1, 'მინიმუმ ერთი შეკვეთა აუცილებელია')
    .max(50, 'მაქსიმუმ 50 შეკვეთა'),
  bulkNotes: z.string().max(500, 'ზოგადი შენიშვნები ძალიან გრძელია').optional(),
  prioritizedDelivery: z.boolean().default(false),
  combinedPayment: z.boolean().default(false),
})

// Order statistics query schema
export const orderStatsQuerySchema = z.object({
  restaurantId: z.string().uuid('რესტორნის ID არასწორია'),
  userId: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  status: z
    .enum([
      'pending',
      'confirmed',
      'preparing',
      'out_for_delivery',
      'delivered',
      'completed',
      'cancelled',
    ])
    .optional(),
})

// Order update schema (for admin/restaurant updates)
export const orderUpdateSchema = z.object({
  orderId: z.string().uuid('შეკვეთის ID არასწორია'),
  status: z
    .enum([
      'pending',
      'confirmed',
      'preparing',
      'out_for_delivery',
      'delivered',
      'completed',
      'cancelled',
    ])
    .optional(),
  specialInstructions: z.string().max(500).optional(),
  estimatedDeliveryTime: z.string().datetime().optional(),
  driverId: z.string().uuid().optional(),
  driverPhone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'ტელეფონის ნომერი არასწორია')
    .optional(),
  notes: z.string().max(500).optional(),
})

// Type inference
export type OrderSubmissionInput = z.infer<typeof orderSubmissionSchema>
export type OrderTrackingInput = z.infer<typeof orderTrackingSchema>
export type OrderCancellationInput = z.infer<typeof orderCancellationSchema>
export type BulkOrderSubmissionInput = z.infer<typeof bulkOrderSubmissionSchema>
export type OrderStatsQueryInput = z.infer<typeof orderStatsQuerySchema>
export type OrderUpdateInput = z.infer<typeof orderUpdateSchema>

// Validation helper functions
export function validateOrderSubmission(
  data: unknown
): { success: true; data: OrderSubmissionInput } | { success: false; errors: string[] } {
  try {
    const result = orderSubmissionSchema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(
        (issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`
      )
      return { success: false, errors }
    }
    return { success: false, errors: ['Unknown validation error'] }
  }
}

export function validateOrderTracking(
  data: unknown
): { success: true; data: OrderTrackingInput } | { success: false; errors: string[] } {
  try {
    const result = orderTrackingSchema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(
        (issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`
      )
      return { success: false, errors }
    }
    return { success: false, errors: ['Unknown validation error'] }
  }
}

export function validateBulkOrderSubmission(
  data: unknown
): { success: true; data: BulkOrderSubmissionInput } | { success: false; errors: string[] } {
  try {
    const result = bulkOrderSubmissionSchema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(
        (issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`
      )
      return { success: false, errors }
    }
    return { success: false, errors: ['Unknown validation error'] }
  }
}

// Georgian validation messages
export const GEORGIAN_VALIDATION_MESSAGES = {
  required: 'ეს ველი აუცილებელია',
  invalidUuid: 'ID არასწორია',
  invalidPhone: 'ტელეფონის ნომერი არასწორია',
  tooLong: 'ტექსტი ძალიან გრძელია',
  invalidEmail: 'ელექტრონული ფოსტა არასწორია',
  invalidDate: 'თარიღი არასწორია',
  invalidEnum: 'მნიშვნელობა არასწორია',
  minItems: 'მინიმალური რაოდენობა არ დაკმაყოფილდა',
  maxItems: 'მაქსიმალური რაოდენობა გადააჭარბა',
} as const
