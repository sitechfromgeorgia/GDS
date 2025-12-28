/**
 * Edge Runtime Compatible Environment Utilities
 *
 * This module provides environment variable access for Edge Runtime contexts
 * (like middleware) without using Zod, which is not Edge Runtime compatible.
 *
 * Use this in middleware.ts instead of env.ts
 */

/**
 * Get environment variable with type safety
 * For Edge Runtime - no Zod validation
 *
 * @param key - Environment variable key
 * @returns Environment variable value
 * @throws Error if required variable is missing
 */
export function getEnvVar(
  key:
    | 'NEXT_PUBLIC_SUPABASE_URL'
    | 'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    | 'NEXT_PUBLIC_APP_URL'
    | 'NEXT_PUBLIC_ENVIRONMENT'
): string {
  const value = process.env[key]

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }

  return value
}

/**
 * Environment helpers for Edge Runtime
 */
export const env = {
  /** Is production environment */
  get isProduction(): boolean {
    return process.env.NODE_ENV === 'production'
  },

  /** Is development environment */
  get isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development'
  },
} as const
