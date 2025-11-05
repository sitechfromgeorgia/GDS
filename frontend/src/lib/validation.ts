/**
 * Validation Utilities
 * Common validation functions for forms and inputs
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate Georgian phone number
 */
export function isValidGeorgianPhone(phone: string): boolean {
  // Georgian phone: +995 XXX XXX XXX or starting with 5
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length === 12 && cleaned.startsWith('995')
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('პაროლი უნდა შედგებოდეს მინიმუმ 8 სიმბოლოსგან')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('პაროლი უნდა შეიცავდეს დიდ ასოს')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('პაროლი უნდა შეიცავდეს პატარა ასოს')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('პაროლი უნდა შეიცავდეს ციფრს')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Validate positive number
 */
export function isPositiveNumber(value: number | string): boolean {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return !isNaN(num) && num > 0
}

/**
 * Validate required field
 */
export function isRequired(value: string | null | undefined): boolean {
  return value !== null && value !== undefined && value.trim().length > 0
}
