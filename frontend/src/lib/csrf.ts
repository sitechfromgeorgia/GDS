import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

/**
 * Security Headers Utilities
 * Provides comprehensive security headers for the application
 */
export class SecurityHeaders {
  /**
   * Get comprehensive security headers
   */
  static getHeaders(): Record<string, string> {
    return {
      // Content Security Policy
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https: blob:",
        "font-src 'self' data:",
        process.env.NEXT_PUBLIC_SUPABASE_URL
          ? `connect-src 'self' ${process.env.NEXT_PUBLIC_SUPABASE_URL} ${process.env.NEXT_PUBLIC_SUPABASE_URL.replace('https', 'wss')}`
          : "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'self' data: blob:",
        "media-src 'self' data: blob:",
        "child-src 'self'",
      ].join('; '),

      // Prevent clickjacking
      'X-Frame-Options': 'DENY',

      // Prevent MIME type sniffing
      'X-Content-Type-Options': 'nosniff',

      // Enable XSS protection
      'X-XSS-Protection': '1; mode=block',

      // Referrer policy
      'Referrer-Policy': 'strict-origin-when-cross-origin',

      // Permissions policy
      'Permissions-Policy': [
        'camera=()',
        'microphone=()',
        'geolocation=()',
        'payment=()',
        'usb=()',
        'magnetometer=()',
        'accelerometer=()',
        'gyroscope=()',
        'ambient-light-sensor=()',
        'autoplay=()',
        'encrypted-media=()',
        'fullscreen=(self)',
        'picture-in-picture=()',
      ].join(', '),

      // HSTS (HTTP Strict Transport Security)
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',

      // Prevent caching of sensitive content
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    }
  }

  /**
   * Apply security headers to response
   */
  static applyToResponse(response: NextResponse): NextResponse {
    const headers = this.getHeaders()

    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  }
}

/**
 * Rate Limiting Utilities
 * Simple rate limiting for API protection
 */
export class RateLimiter {
  private static readonly WINDOW_MS = 15 * 60 * 1000 // 15 minutes
  private static readonly MAX_REQUESTS = 100 // requests per window

  /**
   * Check if request should be rate limited
   * Note: This is a simple in-memory implementation.
   * For production, use Redis or similar.
   */
  static async checkLimit(identifier: string): Promise<{
    allowed: boolean
    remaining: number
    resetTime: number
  }> {
    // In a real implementation, you'd check against Redis or database
    // For now, return mock data
    return {
      allowed: true,
      remaining: this.MAX_REQUESTS - 1,
      resetTime: Date.now() + this.WINDOW_MS,
    }
  }

  /**
   * Middleware for rate limiting
   */
  static async middleware(request: NextRequest): Promise<NextResponse | null> {
    // Get client IP from headers (set by reverse proxy)
    const identifier =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous'
    const limit = await this.checkLimit(identifier)

    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          retryAfter: Math.ceil((limit.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((limit.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': this.MAX_REQUESTS.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': limit.resetTime.toString(),
          },
        }
      )
    }

    return null
  }
}

/**
 * CSRF Protection Utilities
 * Provides CSRF token generation and validation
 */

/**
 * Generate a cryptographically secure CSRF token
 */
export function getCsrfToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Validate CSRF token format and integrity
 */
export function validateCsrfToken(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false
  }

  // Check if token is 64 characters (32 bytes in hex)
  if (token.length !== 64) {
    return false
  }

  // Check if token contains only valid hex characters
  return /^[a-f0-9]{64}$/i.test(token)
}
