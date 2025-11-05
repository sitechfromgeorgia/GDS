/**
 * CSRF Protection API Route
 *
 * Provides CSRF token generation with secure cookie storage.
 *
 * Security Features:
 * - Cryptographically secure token generation
 * - HttpOnly cookies (prevents XSS)
 * - Secure flag in production (HTTPS only)
 * - SameSite=Strict (prevents CSRF)
 * - Token expiration (30 minutes)
 */

import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { generateCSRFToken } from '@/lib/csrf-utils'
import { setCSRFCookie, getCSRFCookie } from '@/lib/csrf-cookie'

/**
 * GET /api/csrf
 *
 * Generates a new CSRF token and sets it in a secure cookie.
 * Returns the token to the client for use in subsequent requests.
 *
 * @returns JSON with token and metadata
 */
export async function GET(request: NextRequest) {
  try {
    // Generate new CSRF token
    const csrfToken = generateCSRFToken()

    // Create response with token
    const response = NextResponse.json({
      csrfToken,
      token: csrfToken, // Alias for backward compatibility
      valid: true,
      expiresIn: 1800, // 30 minutes in seconds
    })

    // Set secure cookie
    setCSRFCookie(response, csrfToken)

    logger.info('CSRF token generated successfully')
    return response
  } catch (error) {
    logger.error('CSRF token generation failed:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate CSRF token',
        valid: false,
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/csrf
 *
 * Validates a CSRF token from the request body against the cookie.
 * Used for manual CSRF validation in client-side code.
 *
 * Note: Most API routes should use middleware CSRF validation instead.
 *
 * @param request - Request with CSRF token in body
 * @returns JSON with validation result
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { csrfToken } = body

    if (!csrfToken) {
      return NextResponse.json({ error: 'CSRF token is required', valid: false }, { status: 400 })
    }

    // Get token from secure cookie
    const cookieToken = getCSRFCookie(request)

    if (!cookieToken) {
      return NextResponse.json({ error: 'CSRF cookie not found', valid: false }, { status: 400 })
    }

    // Import timing-safe comparison
    const { compareCSRFTokens } = await import('@/lib/csrf-utils')

    // Validate tokens match (timing-safe comparison)
    const isValid = compareCSRFTokens(csrfToken, cookieToken)

    if (!isValid) {
      logger.warn('CSRF token validation failed', {
        hasToken: !!csrfToken,
        hasCookie: !!cookieToken,
      })

      return NextResponse.json({ error: 'Invalid CSRF token', valid: false }, { status: 403 })
    }

    // Generate new token for token rotation (optional security enhancement)
    const newToken = generateCSRFToken()

    const response = NextResponse.json({
      valid: true,
      csrfToken: newToken,
      token: newToken,
    })

    // Set new token in cookie
    setCSRFCookie(response, newToken)

    logger.info('CSRF token validated and rotated successfully')
    return response
  } catch (error) {
    logger.error('CSRF validation failed:', error)
    return NextResponse.json(
      {
        error: 'CSRF validation failed',
        valid: false,
      },
      { status: 500 }
    )
  }
}
