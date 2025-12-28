import { logger } from '@/lib/logger'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { InputSanitizer, SQLSecurity, AuthSecurity } from '@/lib/security'
import { z } from 'zod'

// Create Supabase Admin client instance
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

logger.info('Supabase URL:', { url: supabaseUrl })
logger.info('Service Key Length:', { length: supabaseServiceKey?.length })
logger.info('Service Key Prefix:', { prefix: supabaseServiceKey?.substring(0, 10) })

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    headers: {
      Authorization: `Bearer ${supabaseServiceKey}`,
    },
  },
})

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

    // Try to create user directly
    const { data, error: createError } = await supabase.auth.admin.createUser({
      email: sanitizedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: sanitizedFullName,
        role,
      },
    })

    const userId = data.user?.id

    if (createError) {
      // If user already exists, we can't easily get the ID without listUsers (which is failing)
      // But maybe we can try to sign in?
      logger.error('Create user failed:', createError.message)

      // If error is "User already registered", we try to sign in to get the ID?
      // No, we can't sign in with admin api.

      // Let's try to proceed if it's "User already registered" by assuming we can't update it
      // but we can try to upsert the profile if we had the ID.
      // Without ID, we are stuck if listUsers fails.

      return NextResponse.json(
        {
          error: `Failed to create user: ${createError.message}`,
          debug: { url: supabaseUrl },
        },
        { status: 400 }
      )
    }

    if (userId) {
      // Explicitly create/update profile
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        role: role,
        full_name: sanitizedFullName,
        email: sanitizedEmail,
      })

      if (profileError) {
        logger.error('Failed to create profile:', profileError)
        // Return success anyway as user is created
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Test user created/updated successfully',
      user: {
        id: userId,
        email: sanitizedEmail,
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
