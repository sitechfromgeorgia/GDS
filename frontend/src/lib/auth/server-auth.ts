import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Database } from '@/types/database'
import { getEnvVar } from '@/lib/env'
import { logger } from '@/lib/logger'

export type UserRole = 'admin' | 'restaurant' | 'driver' | 'demo'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
    getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

export async function getSession() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}

export async function verifyUserRole(requiredRole?: UserRole | UserRole[]) {
  logger.info('--- verifyUserRole Started ---', { requiredRole })
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  logger.info('verifyUserRole User:', { userId: user?.id, error })

  if (error || !user) {
    // Check for test bypass cookie in development
    const cookieStore = await cookies()
    const bypassCookie = cookieStore.get('TEST_AUTH_BYPASS')
    logger.debug('DEBUG: verifyUserRole check - Env:', { env: process.env.NODE_ENV, cookie: bypassCookie })

    if (process.env.NODE_ENV === 'development' && bypassCookie?.value) {
      const role = bypassCookie.value as UserRole
      if (['restaurant', 'driver', 'admin'].includes(role)) {
        logger.info(`verifyUserRole: Bypassing auth due to TEST_AUTH_BYPASS cookie (${role})`)

        // Validate role if required
        if (requiredRole) {
          const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
          if (!allowedRoles.includes(role)) {
                logger.info(
                  `verifyUserRole: Bypass role mismatch. Has: ${role}, Needs: ${allowedRoles}`
                )
            // Redirect to appropriate dashboard based on actual role
            switch (role) {
              case 'restaurant':
                redirect('/dashboard/restaurant')
                break
              case 'driver':
                redirect('/dashboard/driver')
                break
              case 'admin':
                redirect('/dashboard/admin')
                break
              default:
                redirect('/login')
            }
          }
        }

        return {
          user: {
            id:
              role === 'restaurant'
                ? '00000000-0000-0000-0000-000000000001'
                : role === 'driver'
                  ? '00000000-0000-0000-0000-000000000002'
                  : '00000000-0000-0000-0000-000000000003',
            email: `test-${role}-browser@example.com`,
            role: 'authenticated',
            app_metadata: { provider: 'email' },
            user_metadata: { role: role },
            aud: 'authenticated',
            created_at: new Date().toISOString(),
          } as any,
        }
      }
    }

    logger.info('verifyUserRole: No user, redirecting to /login')
    redirect('/login')
  }

  // If no specific role is required, just authentication is enough
  if (!requiredRole) {
    return { user }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  logger.info('verifyUserRole Profile:', { profile, profileError })

  if (!profile) {
    logger.info('verifyUserRole: No profile, redirecting to /login')
    redirect('/login')
  }

  const userRole = profile.role as UserRole
  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]

  if (!allowedRoles.includes(userRole)) {
    logger.info('verifyUserRole: Role mismatch', { userRole, allowedRoles })
    // Redirect to appropriate dashboard based on actual role
    switch (userRole) {
      case 'restaurant':
        redirect('/dashboard/restaurant')
        break
      case 'driver':
        redirect('/dashboard/driver')
        break
      case 'admin':
        redirect('/dashboard/admin')
        break
      case 'demo':
        redirect('/dashboard/demo')
        break
      default:
        redirect('/login')
    }
  }

  logger.info('verifyUserRole: Success')
  return { user }
}
