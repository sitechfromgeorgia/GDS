/**
 * Next.js Middleware with Supabase Authentication
 *
 * This middleware handles:
 * 1. Session refresh and authentication
 * 2. Route protection based on user roles
 * 3. CSRF token validation for mutations
 * 4. Security headers
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'
import { getEnvVar, env } from '@/lib/env'
import { compareCSRFTokens, extractCSRFTokenFromHeaders } from '@/lib/csrf-utils'
import { getCSRFCookie } from '@/lib/csrf-cookie'
import { validateRequestOrigin, requiresCSRFProtection } from '@/lib/csrf-origin-validation'
import { logger } from '@/lib/logger'

/**
 * Protected routes that require authentication
 */
const PROTECTED_ROUTES = ['/dashboard', '/orders', '/api/orders', '/api/products', '/api/analytics']

/**
 * User role type based on database schema
 */
type UserRole = 'admin' | 'restaurant' | 'driver' | 'demo'

/**
 * Profile type returned from database query
 */
type ProfileRole = {
  role: UserRole
}

/**
 * Routes that require specific roles
 */
const ROLE_ROUTES: Record<string, UserRole[]> = {
  '/dashboard/admin': ['admin'],
  '/dashboard/restaurant': ['admin', 'restaurant'],
  '/dashboard/driver': ['admin', 'driver'],
  '/api/admin': ['admin'],
  '/api/analytics': ['admin'],
}

/**
 * Public routes that don't require authentication
 */
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/demo',
  '/signup',
  '/reset-password',
  '/test',
  '/diagnostic',
  '/health',
  '/api/health',
  '/api/csrf',
  '/api/contact',
]

/**
 * Mutation methods that require CSRF protection
 */
const MUTATION_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']

/**
 * Check if a path matches any of the route patterns
 */
function matchesRoute(path: string, routes: string[]): boolean {
  return routes.some((route) => {
    // Exact match
    if (path === route) return true
    // Prefix match for nested routes
    if (path.startsWith(route + '/')) return true
    return false
  })
}

/**
 * Validate CSRF token for mutation requests
 *
 * Enhanced security features:
 * - Timing-safe token comparison (prevents timing attacks)
 * - Origin/Referer validation (prevents unauthorized origins)
 * - Secure cookie validation
 *
 * @param request - Next.js request object
 * @returns Validation result with reason for failure
 */
function validateCSRF(request: NextRequest): { valid: boolean; reason?: string } {
  // Skip CSRF for safe methods (GET, HEAD, OPTIONS)
  if (!requiresCSRFProtection(request.method)) {
    return { valid: true }
  }

  // 1. Validate request origin
  const originValidation = validateRequestOrigin(request)
  if (!originValidation.valid) {
    return {
      valid: false,
      reason: `Origin validation failed: ${originValidation.reason}`,
    }
  }

  // 2. Extract CSRF token from request headers
  const csrfToken = extractCSRFTokenFromHeaders(request.headers)
  if (!csrfToken) {
    return {
      valid: false,
      reason: 'Missing CSRF token in request headers',
    }
  }

  // 3. Get CSRF token from secure cookie
  const csrfCookie = getCSRFCookie(request)
  if (!csrfCookie) {
    return {
      valid: false,
      reason: 'Missing CSRF token cookie',
    }
  }

  // 4. Timing-safe comparison of tokens
  const tokensMatch = compareCSRFTokens(csrfToken, csrfCookie)
  if (!tokensMatch) {
    return {
      valid: false,
      reason: 'CSRF token mismatch',
    }
  }

  return { valid: true }
}

/**
 * Main middleware function
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Create response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create Supabase client with cookie handling
  const supabase = createServerClient<Database>(
    getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
    getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // Set cookie in both request and response
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          // Remove cookie from both request and response
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session if needed
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  // Add comprehensive security headers (Phase 2 Enhancement)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Content Security Policy (CSP)
  // Note: Development mode requires 'unsafe-inline' and 'unsafe-eval' for Next.js HMR
  // In production, implement nonce-based CSP for better security
  const isDevelopment = process.env.NODE_ENV === 'development'

  const cspDirectives = [
    "default-src 'self'",
    // TEMPORARY FIX: Allow unsafe-inline and unsafe-eval for Next.js to work
    // TODO: Implement nonce-based CSP for production
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
    // Styles: 'unsafe-inline' kept for Tailwind/Radix UI
    // TODO: Implement nonce-based CSP or extract all inline styles
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://data.greenland77.ge wss://data.greenland77.ge",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ')

  response.headers.set('Content-Security-Policy', cspDirectives)

  // Strict Transport Security (HSTS) - Only in production
  if (env.isProduction) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }

  // Permissions Policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self), payment=()'
  )

  // Check if route is public
  const isPublicRoute = matchesRoute(pathname, PUBLIC_ROUTES)

  if (isPublicRoute) {
    return response
  }

  // Check if route requires authentication
  const isProtectedRoute = matchesRoute(pathname, PROTECTED_ROUTES)

  if (isProtectedRoute) {
    // No session - redirect to login
    if (!session) {
      logger.warn('No session found - redirecting to login', {
        path: pathname,
        cookies: request.cookies
          .getAll()
          .map((c) => c.name)
          .join(', '),
      })
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Validate CSRF for API mutations
    // Note: Next.js Server Actions (pages using 'use server') have built-in CSRF protection
    // through origin validation configured in next.config.ts experimental.serverActions.allowedOrigins
    // This CSRF check only applies to traditional API routes under /api/*
    if (pathname.startsWith('/api/')) {
      const csrfValidation = validateCSRF(request)
      if (!csrfValidation.valid) {
        return NextResponse.json(
          {
            error: 'CSRF validation failed',
            reason: csrfValidation.reason,
          },
          { status: 403 }
        )
      }
    }

    // Check role-based access
    for (const [route, allowedRoles] of Object.entries(ROLE_ROUTES)) {
      if (matchesRoute(pathname, [route])) {
        // Get user profile to check role
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        // Type guard: Validate profile has correct structure
        const isValidProfile = (p: unknown): p is ProfileRole => {
          return (
            p !== null &&
            typeof p === 'object' &&
            'role' in p &&
            typeof (p as ProfileRole).role === 'string'
          )
        }

        // Validate profile
        if (profileError || !profileData || !isValidProfile(profileData)) {
          // Invalid profile - redirect to login
          return NextResponse.redirect(new URL('/login', request.url))
        }

        // At this point, TypeScript knows profileData is ProfileRole
        const profile: ProfileRole = profileData

        // Check if user has required role
        if (!allowedRoles.includes(profile.role)) {
          // Unauthorized - redirect to appropriate dashboard based on user's actual role
          switch (profile.role) {
            case 'restaurant':
              return NextResponse.redirect(new URL('/dashboard/restaurant', request.url))
            case 'driver':
              return NextResponse.redirect(new URL('/dashboard/driver', request.url))
            case 'demo':
              return NextResponse.redirect(new URL('/dashboard/demo', request.url))
            default:
              // Unknown role - redirect to login
              return NextResponse.redirect(new URL('/login', request.url))
          }
        }
      }
    }
  }

  return response
}

/**
 * Middleware configuration
 * Define which routes should trigger the middleware
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
