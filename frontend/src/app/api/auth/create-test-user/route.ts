import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { createBrowserClient } from '@/lib/supabase'
import { InputSanitizer, SQLSecurity, AuthSecurity } from '@/lib/security'
import { z } from 'zod'

// Create Supabase client instance
const supabase = createBrowserClient()

// Input validation schema
const createUserSchema = z.object({
  email: z.string().email().min(5).max(254),
  password: z.string().min(8).max(128),
  role: z.enum(['admin', 'restaurant', 'driver', 'demo']).default('admin'),
  full_name: z.string().min(1).max(100).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input with zod
    const validation = createUserSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { email, password, role, full_name } = validation.data

    // Additional sanitization
    const sanitizedEmail = InputSanitizer.sanitizeString(email).toLowerCase()
    const sanitizedFullName = full_name
      ? InputSanitizer.sanitizeString(full_name, 100)
      : 'Test User'

    // Security checks
    if (
      SQLSecurity.containsSQLInjection(email) ||
      SQLSecurity.containsSQLInjection(password) ||
      SQLSecurity.containsSQLInjection(full_name || '')
    ) {
      return NextResponse.json({ error: 'Potential security threat detected' }, { status: 400 })
    }

    // Validate password strength
    const passwordValidation = AuthSecurity.validatePasswordStrength(password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          error: 'Password does not meet security requirements',
          details: passwordValidation.errors,
        },
        { status: 400 }
      )
    }

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: sanitizedEmail,
      password,
      options: {
        data: {
          full_name: sanitizedFullName,
          role,
        },
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Test user created successfully',
      user: {
        id: data.user?.id,
        email: data.user?.email,
        role,
      },
    })
  } catch (error: any) {
    logger.error('Create test user error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// Only allow this in development
export const dynamic = 'force-dynamic'
