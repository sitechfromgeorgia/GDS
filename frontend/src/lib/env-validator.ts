/**
 * Comprehensive Environment Variable Validation
 * Validates and enforces required environment variables at startup
 */

import { z } from 'zod'
import { logger } from '@/lib/logger'

// Define environment schema with strict validation
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Supabase configuration (required)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20, 'Invalid Supabase anon key'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, 'Invalid Supabase service role key').optional(),

  // Application configuration
  NEXT_PUBLIC_APP_URL: z.string().url('Invalid app URL'),
  NEXT_PUBLIC_ENVIRONMENT: z.enum(['development', 'staging', 'production']).default('development'),

  // Monitoring and logging
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  LOGS_DIR: z.string().default('/var/log/app'),

  // Feature flags
  NEXT_PUBLIC_ENABLE_ANALYTICS: z
    .enum(['true', 'false'])
    .default('false')
    .transform((val) => val === 'true'),
  NEXT_PUBLIC_ENABLE_DEMO_MODE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((val) => val === 'true'),
  NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING: z
    .enum(['true', 'false'])
    .default('false')
    .transform((val) => val === 'true'),
  NEXT_PUBLIC_DEBUG_MODE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((val) => val === 'true'),

  // API configuration
  NEXT_PUBLIC_API_TIMEOUT: z
    .string()
    .default('30000')
    .transform((val) => parseInt(val, 10)),
  NEXT_PUBLIC_MAX_RETRIES: z
    .string()
    .default('3')
    .transform((val) => parseInt(val, 10)),

  // Security
  CSRF_SECRET: z.string().optional(),
  SESSION_SECRET: z.string().min(32).optional(),

  // Log aggregation (optional)
  LOG_AGGREGATION_URL: z.string().url().optional(),
  LOG_AGGREGATION_HOST: z.string().optional(),
  LOG_AGGREGATION_PORT: z.string().optional(),
  LOG_AGGREGATION_PATH: z.string().optional(),
  LOG_AGGREGATION_SSL: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
  LOG_AGGREGATION_USERNAME: z.string().optional(),
  LOG_AGGREGATION_PASSWORD: z.string().optional(),

  // CDN configuration (optional)
  CDN_URL: z.string().url().optional(),
  CDN_ASSETS_PATH: z.string().optional(),

  // Database backup (optional)
  BACKUP_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((val) => val === 'true'),
  BACKUP_SCHEDULE: z.string().default('0 2 * * *'), // Daily at 2 AM
  BACKUP_RETENTION_DAYS: z
    .string()
    .default('7')
    .transform((val) => parseInt(val, 10)),
  BACKUP_BUCKET: z.string().optional(),

  // Company Branding (Optional)
  NEXT_PUBLIC_COMPANY_NAME: z.string().optional(),
})

// Type inference from schema
export type Env = z.infer<typeof envSchema>

// Cached validated environment
let validatedEnv: Env | null = null

/**
 * Validate environment variables
 * Throws an error if validation fails
 */
export function validateEnv(): Env {
  if (validatedEnv) {
    return validatedEnv
  }

  try {
    validatedEnv = envSchema.parse(process.env)
    return validatedEnv
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map((err: z.ZodIssue) => {
        return `  - ${err.path.join('.')}: ${err.message}`
      })

      logger.error('❌ Environment validation failed:')
      logger.error(errorMessages.join('\n'))
      logger.error('\n📝 Please check your .env file and ensure all required variables are set.')

      throw new Error('Environment validation failed')
    }
    throw error
  }
}

/**
 * Get validated environment variable
 */
export function getValidatedEnv(): Env {
  if (!validatedEnv) {
    return validateEnv()
  }
  return validatedEnv
}

/**
 * Check if we're in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Check if we're in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * Check if we're in test mode
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test'
}

/**
 * Validate production-specific requirements
 */
export function validateProductionEnv(): void {
  if (!isProduction()) {
    return
  }

  const env = getValidatedEnv()
  const errors: string[] = []

  // Check production-specific requirements
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY is required in production')
  }

  if (!env.NEXT_PUBLIC_SENTRY_DSN) {
    logger.warn('⚠️  SENTRY_DSN is not set. Error tracking will be disabled.')
  }

  if (!env.SESSION_SECRET) {
    errors.push('SESSION_SECRET is required in production')
  }

  if (env.NEXT_PUBLIC_DEBUG_MODE) {
    errors.push('DEBUG_MODE should be disabled in production')
  }

  // Check for secure URLs (HTTPS) - case-insensitive
  if (!env.NEXT_PUBLIC_APP_URL.toLowerCase().startsWith('https://')) {
    errors.push('APP_URL must use HTTPS in production')
  }

  if (!env.NEXT_PUBLIC_SUPABASE_URL.toLowerCase().startsWith('https://')) {
    errors.push('SUPABASE_URL must use HTTPS in production')
  }

  if (errors.length > 0) {
    logger.error('❌ Production environment validation failed:')
    errors.forEach((err) => logger.error(`  - ${err}`))
    throw new Error('Production environment validation failed')
  }

  logger.info('✅ Production environment validation passed')
}

/**
 * Print environment summary (safe for logging)
 */
export function printEnvSummary(): void {
  const env = getValidatedEnv()

  logger.info('📋 Environment Configuration:')
  logger.info(`  - Environment: ${env.NODE_ENV}`)
  logger.info(`  - App URL: ${env.NEXT_PUBLIC_APP_URL}`)
  logger.info(`  - Supabase URL: ${env.NEXT_PUBLIC_SUPABASE_URL}`)
  logger.info(`  - Log Level: ${env.LOG_LEVEL}`)
  logger.info(`  - Analytics: ${env.NEXT_PUBLIC_ENABLE_ANALYTICS ? 'Enabled' : 'Disabled'}`)
  logger.info(`  - Demo Mode: ${env.NEXT_PUBLIC_ENABLE_DEMO_MODE ? 'Enabled' : 'Disabled'}`)
  logger.info(
    `  - Performance Monitoring: ${env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING ? 'Enabled' : 'Disabled'}`
  )
  logger.info(`  - Sentry: ${env.NEXT_PUBLIC_SENTRY_DSN ? 'Configured' : 'Not configured'}`)
  logger.info(`  - CDN: ${env.CDN_URL || 'Not configured'}`)
  logger.info(`  - Backup: ${env.BACKUP_ENABLED ? 'Enabled' : 'Disabled'}`)
}

// Auto-validate on import (only in Node.js environment)
if (typeof window === 'undefined') {
  try {
    validateEnv()
    if (isProduction()) {
      validateProductionEnv()
    }
    printEnvSummary()
  } catch (error) {
    // Error already logged
    if (isProduction()) {
      process.exit(1)
    }
  }
}
