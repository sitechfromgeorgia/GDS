/**
 * CSRF Cookie Management
 *
 * Provides secure cookie configuration and utilities for CSRF token storage.
 *
 * Security Features:
 * - HttpOnly: Prevents JavaScript access (XSS protection)
 * - Secure: HTTPS only in production
 * - SameSite=Strict: Prevents cross-site requests
 * - Path=/api: Limits cookie scope to API routes
 * - MaxAge: Token expiration (30 minutes default)
 */

import type { NextRequest, NextResponse } from 'next/server'

/**
 * Cookie configuration constants
 */
export const CSRF_COOKIE_NAME = 'csrf-token'
export const CSRF_TOKEN_MAX_AGE = 30 * 60 // 30 minutes in seconds

/**
 * Secure cookie options for CSRF token
 *
 * @param maxAge - Cookie max age in seconds (default: 30 minutes)
 * @returns Cookie options object
 */
export function getSecureCSRFCookieOptions(maxAge: number = CSRF_TOKEN_MAX_AGE) {
  const isProduction = process.env.NODE_ENV === 'production'

  return {
    httpOnly: true, // Prevent JavaScript access (XSS protection)
    secure: isProduction, // HTTPS only in production
    sameSite: 'strict' as const, // Strict same-site policy
    path: '/api', // Limit cookie to API routes
    maxAge, // Token expiration
  }
}

/**
 * Set CSRF token cookie on response
 *
 * @param response - Next.js response object
 * @param token - CSRF token string
 * @param maxAge - Cookie max age in seconds (optional)
 * @returns Modified response object
 */
export function setCSRFCookie(
  response: NextResponse,
  token: string,
  maxAge?: number
): NextResponse {
  const options = getSecureCSRFCookieOptions(maxAge)

  response.cookies.set(CSRF_COOKIE_NAME, token, options)

  return response
}

/**
 * Get CSRF token from request cookies
 *
 * @param request - Next.js request object
 * @returns CSRF token string or null
 */
export function getCSRFCookie(request: NextRequest): string | null {
  const cookie = request.cookies.get(CSRF_COOKIE_NAME)
  return cookie?.value || null
}

/**
 * Delete CSRF token cookie
 *
 * @param response - Next.js response object
 * @returns Modified response object
 */
export function deleteCSRFCookie(response: NextResponse): NextResponse {
  response.cookies.delete(CSRF_COOKIE_NAME)
  return response
}

/**
 * Refresh CSRF token cookie (extend expiration)
 *
 * @param response - Next.js response object
 * @param token - Existing CSRF token
 * @param maxAge - New max age in seconds (optional)
 * @returns Modified response object
 */
export function refreshCSRFCookie(
  response: NextResponse,
  token: string,
  maxAge?: number
): NextResponse {
  return setCSRFCookie(response, token, maxAge)
}

/**
 * Check if CSRF cookie exists in request
 *
 * @param request - Next.js request object
 * @returns true if cookie exists, false otherwise
 */
export function hasCSRFCookie(request: NextRequest): boolean {
  return request.cookies.has(CSRF_COOKIE_NAME)
}

/**
 * Validate cookie configuration for security
 *
 * This is primarily for testing/debugging to ensure cookies are configured securely.
 *
 * @returns Validation result with any issues found
 */
export function validateCookieConfiguration(): {
  secure: boolean
  issues: string[]
} {
  const options = getSecureCSRFCookieOptions()
  const issues: string[] = []

  // Check HttpOnly
  if (!options.httpOnly) {
    issues.push('HttpOnly flag is not set - vulnerable to XSS attacks')
  }

  // Check Secure in production
  if (process.env.NODE_ENV === 'production' && !options.secure) {
    issues.push('Secure flag is not set in production - vulnerable to MITM attacks')
  }

  // Check SameSite
  if (options.sameSite !== 'strict' && options.sameSite !== 'lax') {
    issues.push('SameSite should be "strict" or "lax" for CSRF protection')
  }

  // Check Path
  if (!options.path || options.path === '/') {
    issues.push('Cookie path should be restricted to /api for better security')
  }

  // Check MaxAge
  if (!options.maxAge || options.maxAge > 3600) {
    issues.push('MaxAge should be set and less than 1 hour for security')
  }

  return {
    secure: issues.length === 0,
    issues,
  }
}
