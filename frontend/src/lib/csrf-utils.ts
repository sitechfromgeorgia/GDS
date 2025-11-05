/**
 * CSRF Token Utilities
 *
 * Provides cryptographically secure token generation and timing-safe comparison
 * to prevent CSRF (Cross-Site Request Forgery) attacks.
 *
 * Security Features:
 * - Timing-safe comparison to prevent timing attacks
 * - Cryptographically random token generation
 * - Token expiration validation
 * - Hex encoding for safe transmission
 */

import { timingSafeEqual } from 'crypto'

/**
 * Generate a cryptographically secure CSRF token
 *
 * @param length - Token length in bytes (default: 32)
 * @returns Hex-encoded token string
 */
export function generateCSRFToken(length: number = 32): string {
  // Use Web Crypto API for browser compatibility
  if (typeof window !== 'undefined' && window.crypto) {
    const buffer = new Uint8Array(length)
    window.crypto.getRandomValues(buffer)
    return Array.from(buffer)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }

  // Use Node.js crypto for server-side
  const crypto = require('crypto')
  return crypto.randomBytes(length).toString('hex')
}

/**
 * Compare two CSRF tokens using timing-safe comparison
 *
 * This prevents timing attacks where an attacker could guess
 * the token by measuring response times.
 *
 * @param clientToken - Token from client request
 * @param serverToken - Token stored on server
 * @returns true if tokens match, false otherwise
 */
export function compareCSRFTokens(
  clientToken: string | null | undefined,
  serverToken: string | null | undefined
): boolean {
  // Handle null/undefined cases
  if (!clientToken || !serverToken) {
    return false
  }

  // Tokens must be same length
  if (clientToken.length !== serverToken.length) {
    return false
  }

  try {
    // Convert hex strings to buffers
    const clientBuffer = Buffer.from(clientToken, 'hex')
    const serverBuffer = Buffer.from(serverToken, 'hex')

    // Ensure buffers are same length (invalid hex would cause mismatch)
    if (clientBuffer.length !== serverBuffer.length) {
      return false
    }

    // Timing-safe comparison
    return timingSafeEqual(clientBuffer, serverBuffer)
  } catch (error) {
    // Invalid hex encoding or buffer creation failed - silent fail for security
    // Don't log details to avoid information leakage
    return false
  }
}

/**
 * Token metadata for expiration tracking
 */
export interface CSRFTokenMetadata {
  token: string
  createdAt: number // Unix timestamp in milliseconds
  expiresAt: number // Unix timestamp in milliseconds
}

/**
 * Create a CSRF token with expiration metadata
 *
 * @param expirationMinutes - Token validity period (default: 30 minutes)
 * @returns Token metadata object
 */
export function createCSRFTokenWithExpiry(expirationMinutes: number = 30): CSRFTokenMetadata {
  const token = generateCSRFToken()
  const now = Date.now()
  const expiresAt = now + expirationMinutes * 60 * 1000

  return {
    token,
    createdAt: now,
    expiresAt,
  }
}

/**
 * Validate CSRF token and check expiration
 *
 * @param clientToken - Token from client request
 * @param serverMetadata - Token metadata from server
 * @returns Validation result with reason for failure
 */
export function validateCSRFTokenWithExpiry(
  clientToken: string | null | undefined,
  serverMetadata: CSRFTokenMetadata | null | undefined
): { valid: boolean; reason?: string } {
  // Check if metadata exists
  if (!serverMetadata) {
    return { valid: false, reason: 'No server token found' }
  }

  // Check expiration
  const now = Date.now()
  if (now > serverMetadata.expiresAt) {
    return { valid: false, reason: 'Token expired' }
  }

  // Compare tokens with timing-safe comparison
  const tokensMatch = compareCSRFTokens(clientToken, serverMetadata.token)
  if (!tokensMatch) {
    return { valid: false, reason: 'Token mismatch' }
  }

  return { valid: true }
}

/**
 * Extract CSRF token from request headers
 *
 * Checks multiple possible header locations:
 * 1. X-CSRF-Token (standard)
 * 2. X-XSRF-Token (alternative)
 * 3. CSRF-Token (fallback)
 *
 * @param headers - Request headers object
 * @returns Token string or null
 */
export function extractCSRFTokenFromHeaders(
  headers: Headers | Record<string, string | string[] | undefined>
): string | null {
  if (headers instanceof Headers) {
    return (
      headers.get('x-csrf-token') ||
      headers.get('x-xsrf-token') ||
      headers.get('csrf-token') ||
      null
    )
  }

  // Handle plain object headers
  const token = headers['x-csrf-token'] || headers['x-xsrf-token'] || headers['csrf-token']

  if (Array.isArray(token)) {
    return token[0] || null
  }

  return token || null
}
