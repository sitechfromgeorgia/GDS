import { z } from 'zod'

// Environment variable validation schema
const rawEnvSchema = z.object({
  // Supabase Configuration (Required)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  // Service role key is server-only and should NOT be in client bundle
  // It's validated separately in admin.ts when actually needed
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // Application Configuration (Required)
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL'),
  NEXT_PUBLIC_ENVIRONMENT: z.enum(['development', 'production']),

  // Feature Flags (Optional with defaults)
  NEXT_PUBLIC_ENABLE_ANALYTICS: z.string().optional(),
  NEXT_PUBLIC_ENABLE_DEMO_MODE: z.string().optional(),
  NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING: z.string().optional(),

  // API Configuration (Optional with defaults)
  NEXT_PUBLIC_API_TIMEOUT: z.string().optional(),
  NEXT_PUBLIC_MAX_RETRIES: z.string().optional(),

  // Development Options (Optional with defaults)
  NEXT_PUBLIC_DEBUG_MODE: z.string().optional(),
  NEXT_PUBLIC_MOCK_DATA: z.string().optional(),
  NEXT_PUBLIC_ENABLE_SW: z.string().optional(),

  // Performance Monitoring (Optional)
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
})

// Type definition for validated environment variables
export type RawEnvVars = z.infer<typeof rawEnvSchema>

// Transform environment variables with proper types
const envSchema = rawEnvSchema.transform((raw) => ({
  ...raw,
  NEXT_PUBLIC_ENABLE_ANALYTICS: raw.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  NEXT_PUBLIC_ENABLE_DEMO_MODE: raw.NEXT_PUBLIC_ENABLE_DEMO_MODE === 'true',
  NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING:
    raw.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING === 'true',
  NEXT_PUBLIC_API_TIMEOUT: parseInt(raw.NEXT_PUBLIC_API_TIMEOUT || '30000', 10),
  NEXT_PUBLIC_MAX_RETRIES: parseInt(raw.NEXT_PUBLIC_MAX_RETRIES || '3', 10),
  NEXT_PUBLIC_DEBUG_MODE: raw.NEXT_PUBLIC_DEBUG_MODE === 'true',
  NEXT_PUBLIC_MOCK_DATA: raw.NEXT_PUBLIC_MOCK_DATA === 'true',
  NEXT_PUBLIC_ENABLE_SW: raw.NEXT_PUBLIC_ENABLE_SW === 'true',
}))

// Type definition for validated environment variables
export type EnvVars = z.infer<typeof envSchema>

// Cache for validated environment variables
let cachedEnv: EnvVars | null = null

/**
 * Validates and returns environment variables with type safety
 * @throws {Error} If required environment variables are missing or invalid
 * @returns {EnvVars} Validated and typed environment variables
 */
export function getEnv(): EnvVars {
  if (cachedEnv) {
    return cachedEnv
  }

  try {
    // Get raw environment variables
    const rawEnv = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
      NEXT_PUBLIC_ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS,
      NEXT_PUBLIC_ENABLE_DEMO_MODE: process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE,
      NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING:
        process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING,
      NEXT_PUBLIC_API_TIMEOUT: process.env.NEXT_PUBLIC_API_TIMEOUT,
      NEXT_PUBLIC_MAX_RETRIES: process.env.NEXT_PUBLIC_MAX_RETRIES,
      NEXT_PUBLIC_DEBUG_MODE: process.env.NEXT_PUBLIC_DEBUG_MODE,
      NEXT_PUBLIC_MOCK_DATA: process.env.NEXT_PUBLIC_MOCK_DATA,
      NEXT_PUBLIC_ENABLE_SW: process.env.NEXT_PUBLIC_ENABLE_SW,
      NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    }

    // Validate using Zod schema (already transformed)
    const validatedEnv = envSchema.parse(rawEnv)

    // Cache the validated environment
    cachedEnv = validatedEnv

    return validatedEnv
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues
        .map((err: any) => `${err.path.join('.')}: ${err.message}`)
        .join('\n')

      throw new Error(
        `Environment variable validation failed:\n${errorMessages}\n\n` +
          'Please check your .env file and ensure all required variables are properly configured.'
      )
    }

    throw new Error(`Unexpected error validating environment variables: ${error}`)
  }
}

/**
 * Gets a specific environment variable with type safety
 * @param key - The environment variable key
 * @returns The value of the environment variable
 * @throws {Error} If the variable is not found or invalid
 */
export function getEnvVar<K extends keyof EnvVars>(key: K): EnvVars[K] {
  const env = getEnv()
  return env[key]
}

/**
 * Gets environment variable with default value
 * @param key - The environment variable key
 * @param defaultValue - Default value if variable is not set
 * @returns The value of the environment variable or default
 */
export function getEnvVarWithDefault<K extends keyof EnvVars>(
  key: K,
  defaultValue: EnvVars[K]
): EnvVars[K] {
  try {
    return getEnvVar(key)
  } catch {
    return defaultValue
  }
}

/**
 * Gets only client-safe environment variables (NEXT_PUBLIC_*)
 * These are safe to expose to the client-side
 * @returns Client-safe environment variables
 */
export function getClientSafeEnv() {
  const env = getEnv()
  return {
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    appUrl: env.NEXT_PUBLIC_APP_URL,
    environment: env.NEXT_PUBLIC_ENVIRONMENT,
    enableAnalytics: env.NEXT_PUBLIC_ENABLE_ANALYTICS,
    enableDemoMode: env.NEXT_PUBLIC_ENABLE_DEMO_MODE,
    enablePerformanceMonitoring: env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING,
    apiTimeout: env.NEXT_PUBLIC_API_TIMEOUT,
    maxRetries: env.NEXT_PUBLIC_MAX_RETRIES,
    debugMode: env.NEXT_PUBLIC_DEBUG_MODE,
    mockData: env.NEXT_PUBLIC_MOCK_DATA,
    enableSW: env.NEXT_PUBLIC_ENABLE_SW,
    sentryDsn: env.NEXT_PUBLIC_SENTRY_DSN,
  }
}

/**
 * Environment-specific getters
 */
export const env = {
  /** Current environment ('development' | 'production') */
  get environment(): 'development' | 'production' {
    return getEnvVar('NEXT_PUBLIC_ENVIRONMENT')
  },

  /** Is development environment */
  get isDevelopment(): boolean {
    return this.environment === 'development'
  },

  /** Is production environment */
  get isProduction(): boolean {
    return this.environment === 'production'
  },

  /** Supabase configuration */
  get supabase() {
    return {
      url: getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
      anonKey: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    }
  },

  /** Application configuration */
  get app() {
    return {
      url: getEnvVar('NEXT_PUBLIC_APP_URL'),
      environment: this.environment,
    }
  },

  /** Feature flags */
  get features() {
    return {
      analytics: getEnvVar('NEXT_PUBLIC_ENABLE_ANALYTICS'),
      demoMode: getEnvVar('NEXT_PUBLIC_ENABLE_DEMO_MODE'),
      performanceMonitoring: getEnvVar('NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING'),
    }
  },

  /** Debug settings */
  get debug() {
    return {
      enabled: getEnvVar('NEXT_PUBLIC_DEBUG_MODE'),
      mockData: getEnvVar('NEXT_PUBLIC_MOCK_DATA'),
      serviceWorker: getEnvVar('NEXT_PUBLIC_ENABLE_SW'),
    }
  },
} as const

/**
 * Clear cached environment variables (useful for testing)
 * @internal
 */
export function clearEnvCache(): void {
  cachedEnv = null
}

// Export default for convenience
export default getEnv
