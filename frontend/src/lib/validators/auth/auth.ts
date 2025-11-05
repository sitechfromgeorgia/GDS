import { z } from 'zod'

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const signUpSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    role: z.enum(['restaurant', 'driver', 'admin', 'demo']),
    restaurant_name: z.string().min(1, 'Restaurant name is required').optional(),
    full_name: z.string().min(1, 'Full name is required').optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export const passwordResetSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const updateProfileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  phone: z.string().optional(),
  address: z.string().optional(),
  avatar_url: z.string().url().optional(),
})

export type SignInInput = z.infer<typeof signInSchema>
export type SignUpInput = z.infer<typeof signUpSchema>
export type PasswordResetInput = z.infer<typeof passwordResetSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
