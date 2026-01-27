/**
 * Zod Validation Schemas
 * Centralized validation schemas for all forms and data in the application.
 */

import { z } from "zod";
import { UserRole, OrderStatus } from "../types";
import { APP_SETTINGS } from "../config";

// ============================================
// Common Validators
// ============================================

export const emailSchema = z
  .string()
  .min(1, "ელ-ფოსტა სავალდებულოა")
  .email("არასწორი ელ-ფოსტის ფორმატი");

export const passwordSchema = z
  .string()
  .min(6, "პაროლი მინიმუმ 6 სიმბოლო უნდა იყოს")
  .max(100, "პაროლი ძალიან გრძელია");

export const phoneSchema = z
  .string()
  .regex(/^(\+995)?[0-9]{9}$/, "არასწორი ტელეფონის ნომერი")
  .optional()
  .or(z.literal(""));

export const urlSchema = z
  .string()
  .url("არასწორი URL ფორმატი")
  .optional()
  .or(z.literal(""));

// ============================================
// User Schemas
// ============================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "პაროლი სავალდებულოა"),
  rememberMe: z.boolean().optional().default(false),
});

export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z
    .string()
    .min(2, "სახელი მინიმუმ 2 სიმბოლო უნდა იყოს")
    .max(100, "სახელი ძალიან გრძელია"),
  role: z.nativeEnum(UserRole, {
    message: "აირჩიეთ როლი",
  }),
  phone: phoneSchema,
  locationLink: urlSchema,
  avatar: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

export const updateUserSchema = createUserSchema.partial().extend({
  id: z.string().uuid("არასწორი ID ფორმატი"),
});

// ============================================
// Product Schemas
// ============================================

export const productSchema = z.object({
  name: z
    .string()
    .min(2, "პროდუქტის სახელი მინიმუმ 2 სიმბოლო უნდა იყოს")
    .max(200, "პროდუქტის სახელი ძალიან გრძელია"),
  category: z.string().min(1, "კატეგორია სავალდებულოა"),
  unit: z.string().min(1, "ერთეული სავალდებულოა"),
  price: z
    .number()
    .positive("ფასი დადებითი უნდა იყოს")
    .optional()
    .nullable(),
  isActive: z.boolean().optional().default(true),
  isPromo: z.boolean().optional().default(false),
  image: z.string().optional(),
});

export const createProductSchema = productSchema;

export const updateProductSchema = productSchema.partial().extend({
  id: z.string().uuid("არასწორი ID ფორმატი"),
});

// ============================================
// Order Schemas
// ============================================

export const orderItemSchema = z.object({
  productId: z.string().uuid("არასწორი პროდუქტის ID"),
  productName: z.string().min(1, "პროდუქტის სახელი სავალდებულოა"),
  unit: z.string().min(1, "ერთეული სავალდებულოა"),
  quantity: z
    .number()
    .positive("რაოდენობა დადებითი უნდა იყოს")
    .max(10000, "რაოდენობა ძალიან დიდია"),
  costPrice: z.number().nonnegative("თვითღირებულება არ შეიძლება იყოს უარყოფითი").optional(),
  sellPrice: z.number().nonnegative("გასაყიდი ფასი არ შეიძლება იყოს უარყოფითი").optional(),
});

export const createOrderSchema = z.object({
  items: z
    .array(orderItemSchema)
    .min(1, "შეკვეთა უნდა შეიცავდეს მინიმუმ 1 პროდუქტს"),
  notes: z.string().max(1000, "შენიშვნა ძალიან გრძელია").optional(),
});

export const updateOrderStatusSchema = z.object({
  id: z.string().uuid("არასწორი შეკვეთის ID"),
  status: z.nativeEnum(OrderStatus, {
    message: "აირჩიეთ სტატუსი",
  }),
  driverId: z.string().uuid("არასწორი მძღოლის ID").optional(),
});

export const updateOrderPricingSchema = z.object({
  id: z.string().uuid("არასწორი შეკვეთის ID"),
  items: z.array(orderItemSchema).min(1, "პროდუქტები სავალდებულოა"),
});

// ============================================
// Unit & Category Schemas
// ============================================

export const unitSchema = z
  .string()
  .min(1, "ერთეული სავალდებულოა")
  .max(50, "ერთეული ძალიან გრძელია");

export const categorySchema = z
  .string()
  .min(1, "კატეგორია სავალდებულოა")
  .max(100, "კატეგორია ძალიან გრძელია");

// ============================================
// File Upload Schema
// ============================================

export const imageUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) => file.size <= APP_SETTINGS.maxImageSize,
      `ფაილის ზომა არ უნდა აღემატებოდეს ${APP_SETTINGS.maxImageSize / 1024 / 1024}MB-ს`
    )
    .refine(
      (file) => APP_SETTINGS.allowedImageTypes.includes(file.type as any),
      "მხოლოდ JPEG, PNG და WebP ფორმატები არის დაშვებული"
    ),
});

// ============================================
// Config Schema (for setup)
// ============================================

export const appConfigSchema = z.object({
  supabaseUrl: z.string().url("არასწორი Supabase URL"),
  supabaseKey: z.string().min(20, "არასწორი Supabase Key"),
  companyName: z.string().min(1, "კომპანიის სახელი სავალდებულოა"),
  setupComplete: z.boolean().default(true),
});

// ============================================
// Type Exports
// ============================================

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type OrderItemInput = z.infer<typeof orderItemSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type UpdateOrderPricingInput = z.infer<typeof updateOrderPricingSchema>;
export type ImageUploadInput = z.infer<typeof imageUploadSchema>;
export type AppConfigInput = z.infer<typeof appConfigSchema>;

// ============================================
// Validation Helper Functions
// ============================================

/**
 * Validates data against a schema and returns either parsed data or error messages
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  result.error.issues.forEach((issue) => {
    const path = issue.path.join(".");
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  });

  return { success: false, errors };
}

/**
 * Validates a single field and returns error message or null
 */
export function validateField<T>(
  schema: z.ZodSchema<T>,
  value: unknown
): string | null {
  const result = schema.safeParse(value);
  if (result.success) return null;
  return result.error.issues[0]?.message || "არასწორი მნიშვნელობა";
}
