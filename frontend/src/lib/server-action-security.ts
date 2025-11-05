/**
 * Server Action Security Utilities
 *
 * Provides additional security layers for Next.js Server Actions beyond the built-in
 * origin checking (configured in next.config.ts experimental.serverActions.allowedOrigins).
 *
 * Next.js 13+ Server Actions have built-in CSRF protection through:
 * 1. Origin header validation (checked against allowedOrigins)
 * 2. POST-only endpoints
 * 3. Encrypted action IDs
 *
 * This module provides additional validation helpers for enhanced security.
 */

import { headers } from 'next/headers'

/**
 * Validates that a server action request comes from an allowed origin.
 *
 * This is a supplementary check; Next.js already validates origins based on
 * the `allowedOrigins` configuration in next.config.ts.
 *
 * @throws {Error} If the request origin is invalid
 */
export async function validateServerActionOrigin(): Promise<void> {
  const headersList = await headers()
  const origin = headersList.get('origin')
  const host = headersList.get('host')

  // In development, allow localhost
  const isDevelopment = process.env.NODE_ENV === 'development'
  if (
    isDevelopment &&
    (origin?.includes('localhost') ||
      origin?.includes('127.0.0.1') ||
      host?.includes('localhost') ||
      host?.includes('127.0.0.1'))
  ) {
    return
  }

  // In production, validate against allowed origins
  const allowedOrigins = [
    'https://greenland77.ge',
    'https://www.greenland77.ge',
    'https://data.greenland77.ge',
  ]

  if (origin && !allowedOrigins.some((allowed) => origin.includes(allowed))) {
    throw new Error('Invalid origin for server action')
  }
}

/**
 * Rate limiting tracker for server actions.
 * In production, this should be replaced with Redis or a proper rate limiting service.
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

/**
 * Simple rate limiting for server actions.
 *
 * @param userId - User identifier for rate limiting
 * @param maxRequests - Maximum requests allowed in the time window
 * @param windowMs - Time window in milliseconds
 * @returns true if request should be allowed, false if rate limit exceeded
 */
export function checkRateLimit(
  userId: string,
  maxRequests: number = 100,
  windowMs: number = 60000 // 1 minute
): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(userId)

  if (!userLimit || now > userLimit.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (userLimit.count >= maxRequests) {
    return false
  }

  userLimit.count++
  return true
}

/**
 * Validates request headers for server actions.
 * Ensures that the request includes proper headers and is not coming from
 * an unexpected source.
 *
 * @returns true if headers are valid
 */
export async function validateServerActionHeaders(): Promise<boolean> {
  const headersList = await headers()

  // Ensure Next-Action header is present (indicates legitimate server action)
  const nextAction = headersList.get('next-action')
  if (!nextAction) {
    return false
  }

  // Ensure content-type is correct for server actions
  const contentType = headersList.get('content-type')
  if (
    !contentType?.includes('multipart/form-data') &&
    !contentType?.includes('application/x-www-form-urlencoded') &&
    !contentType?.includes('text/plain')
  ) {
    return false
  }

  return true
}

/**
 * Complete security validation for server actions.
 * Call this at the start of sensitive server actions for defense-in-depth.
 *
 * @param userId - Optional user ID for rate limiting
 * @throws {Error} If validation fails
 */
export async function validateServerAction(userId?: string): Promise<void> {
  // Validate origin (redundant but provides defense-in-depth)
  await validateServerActionOrigin()

  // Validate headers
  const headersValid = await validateServerActionHeaders()
  if (!headersValid) {
    throw new Error('Invalid server action headers')
  }

  // Check rate limit if userId provided
  if (userId) {
    const allowed = checkRateLimit(userId)
    if (!allowed) {
      throw new Error('Rate limit exceeded')
    }
  }
}
