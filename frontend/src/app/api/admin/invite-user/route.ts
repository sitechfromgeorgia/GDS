import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { InputSanitizer, SQLSecurity } from '@/lib/security'
import { isValidEmail } from '@/lib/validation'
import { z } from 'zod'

// Valid roles for user invitation
const VALID_ROLES = ['restaurant', 'driver'] as const
type UserRole = (typeof VALID_ROLES)[number]

/**
 * Validate role value
 */
function isValidRole(role: string): role is UserRole {
  return VALID_ROLES.includes(role as UserRole)
}

// Input validation schema for user invitation
const inviteUserSchema = z.object({
  email: z.string().email('Invalid email format').min(5).max(254),
  role: z.enum(VALID_ROLES, {
    errorMap: () => ({ message: `Role must be one of: ${VALID_ROLES.join(', ')}` }),
  }),
})

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()

    // Validate input with zod
    const validation = inviteUserSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { email, role } = validation.data

    // Additional email format validation using shared validation utility
    if (!isValidEmail(email)) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: [{ field: 'email', message: 'Invalid email format' }],
        },
        { status: 400 }
      )
    }

    // Additional role validation using shared validation function
    if (!isValidRole(role)) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: [{ field: 'role', message: `Role must be one of: ${VALID_ROLES.join(', ')}` }],
        },
        { status: 400 }
      )
    }

    // Sanitize email input
    const sanitizedEmail = InputSanitizer.sanitizeString(email, 254).toLowerCase().trim()

    // Security check for SQL injection patterns
    if (SQLSecurity.containsSQLInjection(email)) {
      logger.warn('Potential security threat detected in invite-user request', { email: sanitizedEmail })
      return NextResponse.json(
        { error: 'Invalid input detected' },
        { status: 400 }
      )
    }

    // Get admin client (server-side only)
    const adminClient = getAdminClient()

    // Get redirect URL from environment
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    // Invite user by email using Supabase Admin API
    // This automatically sends the invite email
    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(sanitizedEmail, {
      data: {
        role: role,
      },
      redirectTo: `${siteUrl}/welcome`,
    })

    if (error) {
      // Handle duplicate email error - Supabase may return various messages for existing users
      const isDuplicateEmail =
        error.message.includes('already registered') ||
        error.message.includes('already exists') ||
        error.message.includes('already been registered') ||
        error.message.includes('User already exists') ||
        error.message.includes('duplicate key') ||
        error.message.includes('unique constraint')

      if (isDuplicateEmail) {
        logger.info('Attempted to invite existing user', { email: sanitizedEmail })
        return NextResponse.json(
          {
            error: 'User already registered',
            code: 'DUPLICATE_EMAIL',
            details: [{ field: 'email', message: 'A user with this email already exists' }],
          },
          { status: 400 }
        )
      }

      logger.error('Failed to invite user', error, { email: sanitizedEmail, role })
      return NextResponse.json(
        { error: error.message || 'Failed to invite user' },
        { status: 400 }
      )
    }

    logger.info('User invited successfully', {
      userId: data.user?.id,
      email: sanitizedEmail,
      role,
    })

    return NextResponse.json(
      {
        success: true,
        message: 'User invited successfully',
        user: {
          id: data.user?.id,
          email: data.user?.email,
          role,
        },
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Handle admin client configuration errors
    if (error instanceof Error && error.message.includes('Missing')) {
      logger.error('Admin client configuration error', error)
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    logger.error('Unexpected error in invite-user endpoint', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Force dynamic rendering to ensure server-side only execution
export const dynamic = 'force-dynamic'
