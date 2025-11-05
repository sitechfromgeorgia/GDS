/**
 * CSRF Origin Validation
 *
 * Validates request origin and referer headers to prevent CSRF attacks.
 *
 * Security Features:
 * - Origin header validation (primary)
 * - Referer header validation (fallback)
 * - Whitelist of allowed origins
 * - Protocol, host, and port matching
 * - Environment-aware configuration
 */

import type { NextRequest } from 'next/server'

/**
 * Get allowed origins from environment
 *
 * Supports multiple origins separated by commas for flexibility.
 *
 * @returns Array of allowed origin URLs
 */
export function getAllowedOrigins(): string[] {
  const origins: string[] = []

  // Production origin
  const productionUrl = process.env.NEXT_PUBLIC_APP_URL
  if (productionUrl) {
    origins.push(productionUrl)
  }

  // Development origins (always include for local dev)
  if (process.env.NODE_ENV === 'development') {
    origins.push('http://localhost:3000')
    origins.push('http://localhost:3001')
    origins.push('http://127.0.0.1:3000')
  }

  // Additional trusted origins from environment
  const additionalOrigins = process.env.NEXT_PUBLIC_TRUSTED_ORIGINS
  if (additionalOrigins) {
    const parsed = additionalOrigins.split(',').map((o) => o.trim())
    origins.push(...parsed)
  }

  return origins
}

/**
 * Normalize URL for comparison
 *
 * Removes trailing slashes and normalizes protocol/host/port.
 *
 * @param url - URL string to normalize
 * @returns Normalized URL or null if invalid
 */
function normalizeUrl(url: string | null | undefined): string | null {
  if (!url) return null

  try {
    const parsed = new URL(url)
    // Remove trailing slash and return origin (protocol + host + port)
    return parsed.origin
  } catch {
    return null
  }
}

/**
 * Validate request origin header
 *
 * Checks if the Origin header matches one of the allowed origins.
 *
 * @param request - Next.js request object
 * @returns Validation result with reason for failure
 */
export function validateOrigin(request: NextRequest): {
  valid: boolean
  reason?: string
  origin?: string
} {
  const origin = request.headers.get('origin')
  const allowedOrigins = getAllowedOrigins()

  // No origin header (might be same-origin request or missing header)
  if (!origin) {
    return {
      valid: false,
      reason: 'No origin header present',
    }
  }

  // Normalize origin
  const normalizedOrigin = normalizeUrl(origin)
  if (!normalizedOrigin) {
    return {
      valid: false,
      reason: 'Invalid origin header format',
      origin,
    }
  }

  // Check against whitelist
  const isAllowed = allowedOrigins.some((allowed) => normalizeUrl(allowed) === normalizedOrigin)

  if (!isAllowed) {
    return {
      valid: false,
      reason: 'Origin not in allowed list',
      origin: normalizedOrigin,
    }
  }

  return {
    valid: true,
    origin: normalizedOrigin,
  }
}

/**
 * Validate request referer header (fallback)
 *
 * Used when Origin header is not present.
 *
 * @param request - Next.js request object
 * @returns Validation result with reason for failure
 */
export function validateReferer(request: NextRequest): {
  valid: boolean
  reason?: string
  referer?: string
} {
  const referer = request.headers.get('referer') || request.headers.get('referrer')
  const allowedOrigins = getAllowedOrigins()

  // No referer header
  if (!referer) {
    return {
      valid: false,
      reason: 'No referer header present',
    }
  }

  // Extract origin from referer URL
  const normalizedReferer = normalizeUrl(referer)
  if (!normalizedReferer) {
    return {
      valid: false,
      reason: 'Invalid referer header format',
      referer,
    }
  }

  // Check against whitelist
  const isAllowed = allowedOrigins.some((allowed) => normalizeUrl(allowed) === normalizedReferer)

  if (!isAllowed) {
    return {
      valid: false,
      reason: 'Referer not in allowed list',
      referer: normalizedReferer,
    }
  }

  return {
    valid: true,
    referer: normalizedReferer,
  }
}

/**
 * Validate request origin with fallback to referer
 *
 * Primary validation method for CSRF protection.
 *
 * @param request - Next.js request object
 * @returns Validation result with detailed reason
 */
export function validateRequestOrigin(request: NextRequest): {
  valid: boolean
  reason?: string
  method: 'origin' | 'referer' | 'none'
  value?: string
} {
  // Try Origin header first (more reliable)
  const originResult = validateOrigin(request)
  if (originResult.valid) {
    return {
      valid: true,
      method: 'origin',
      value: originResult.origin,
    }
  }

  // Fallback to Referer header
  const refererResult = validateReferer(request)
  if (refererResult.valid) {
    return {
      valid: true,
      method: 'referer',
      value: refererResult.referer,
    }
  }

  // Both failed
  return {
    valid: false,
    method: 'none',
    reason: `Origin validation failed: ${originResult.reason}; Referer validation failed: ${refererResult.reason}`,
  }
}

/**
 * Check if request method requires CSRF protection
 *
 * GET, HEAD, and OPTIONS are generally safe methods.
 * POST, PUT, PATCH, DELETE require CSRF protection.
 *
 * @param method - HTTP method string
 * @returns true if method requires CSRF protection
 */
export function requiresCSRFProtection(method: string): boolean {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS']
  return !safeMethods.includes(method.toUpperCase())
}

/**
 * Validate allowed origins configuration
 *
 * For testing/debugging to ensure origins are properly configured.
 *
 * @returns Validation result with any issues found
 */
export function validateOriginConfiguration(): {
  valid: boolean
  issues: string[]
  allowedOrigins: string[]
} {
  const allowedOrigins = getAllowedOrigins()
  const issues: string[] = []

  // Check if any origins are configured
  if (allowedOrigins.length === 0) {
    issues.push('No allowed origins configured - all requests will be rejected')
  }

  // Validate each origin format
  allowedOrigins.forEach((origin) => {
    const normalized = normalizeUrl(origin)
    if (!normalized) {
      issues.push(`Invalid origin format: ${origin}`)
    }

    // Warn about HTTP in production
    if (process.env.NODE_ENV === 'production' && normalized?.startsWith('http://')) {
      issues.push(`Insecure HTTP origin in production: ${origin}`)
    }
  })

  return {
    valid: issues.length === 0,
    issues,
    allowedOrigins,
  }
}
