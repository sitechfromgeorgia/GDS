import { Database } from '@/types/database'

type Order = Database['public']['Tables']['orders']['Row']

/**
 * Simplified security utilities for the Georgian Distribution System
 * Note: Order access is handled by Supabase RLS policies
 * This file contains only input validation and utility functions
 */

/**
 * Authentication Security - Streamlined
 */
export class AuthSecurity {
  /**
   * Validate password strength
   */
  static validatePasswordStrength(password: string): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Sanitize user input for authentication
   */
  static sanitizeAuthInput(input: string): string {
    return input.trim().toLowerCase()
  }

  /**
   * Generate secure session token
   */
  static generateSessionToken(): string {
    return crypto.randomUUID()
  }

  /**
   * Validate session token format
   */
  static isValidSessionToken(token: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token)
  }
}

/**
 * Order Security - Simplified (RLS handles access control)
 */
export class OrderSecurity {
  /**
   * Validate order data integrity
   */
  static validateOrderData(order: Partial<Order>): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    // Required fields
    if (!order.restaurant_id) {
      errors.push('Restaurant ID is required')
    }

    // Status validation
    if (order.status && !this.isValidOrderStatus(order.status)) {
      errors.push('Invalid order status')
    }

    // Amount validation
    if (order.total_amount !== undefined && order.total_amount !== null && order.total_amount < 0) {
      errors.push('Total amount cannot be negative')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  private static isValidOrderStatus(status: string): status is Order['status'] {
    const validStatuses: Order['status'][] = [
      'pending',
      'confirmed',
      'priced',
      'assigned',
      'out_for_delivery',
      'delivered',
      'completed',
      'cancelled',
    ]
    return validStatuses.includes(status as Order['status'])
  }
}

/**
 * Input sanitization utilities
 */
export class InputSanitizer {
  /**
   * Sanitize string input
   */
  static sanitizeString(input: string, maxLength: number = 1000): string {
    if (!input || typeof input !== 'string') return ''

    return input.trim().substring(0, maxLength).replace(/[<>]/g, '') // Basic XSS prevention
  }

  /**
   * Sanitize numeric input
   */
  static sanitizeNumber(input: unknown, min?: number, max?: number): number | null {
    const num = Number(input)
    if (isNaN(num)) return null

    if (min !== undefined && num < min) return null
    if (max !== undefined && num > max) return null

    return num
  }

  /**
   * Sanitize UUID input
   */
  static sanitizeUUID(input: string): string | null {
    if (!input || typeof input !== 'string') return null

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(input) ? input : null
  }

  /**
   * Sanitize order notes
   */
  static sanitizeOrderNotes(notes: string): string {
    return this.sanitizeString(notes, 2000)
  }
}

/**
 * SQL injection prevention utilities
 */
export class SQLSecurity {
  /**
   * Check if input contains potentially dangerous SQL patterns
   */
  static containsSQLInjection(input: string): boolean {
    if (!input || typeof input !== 'string') return false

    const dangerousPatterns = [
      /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b)/i,
      /(-{2}|\/\*|\*\/)/, // Comments
      /('|(\\x27)|(\\x2D))/, // Quotes and dashes
      /(<script|javascript:|vbscript:|onload=|onerror=)/i, // XSS vectors
    ]

    return dangerousPatterns.some((pattern) => pattern.test(input))
  }

  /**
   * Validate order ID format
   */
  static isValidOrderId(orderId: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      orderId
    )
  }
}
