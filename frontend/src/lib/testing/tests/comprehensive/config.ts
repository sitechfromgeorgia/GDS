/**
 * Comprehensive Test Configuration
 * Environment setup and test parameters for Georgian Distribution System
 */

export interface TestEnvironment {
  name: string
  supabaseUrl: string
  supabaseAnonKey: string
  supabaseServiceKey?: string
  description: string
  isProduction: boolean
}

export interface TestCredentials {
  admin: {
    email: string
    password: string
  }
  restaurant: {
    email: string
    password: string
  }
  driver: {
    email: string
    password: string
  }
  demo: {
    email: string
    password: string
  }
}

export interface TestTimeouts {
  connection: number
  api: number
  auth: number
  realtime: number
  businessLogic: number
  overall: number
}

export interface TestThresholds {
  performance: {
    apiResponseTime: number // ms
    realtimeLatency: number // ms
    overallScore: number // percentage
  }
  quality: {
    minTestCoverage: number // percentage
    maxErrorRate: number // percentage
    maxSkippedTests: number // percentage
  }
}

export class TestConfig {
  private static instance: TestConfig
  private environment: TestEnvironment
  private credentials: TestCredentials
  private timeouts: TestTimeouts
  private thresholds: TestThresholds

  private constructor() {
    this.environment = this.loadEnvironment()
    this.credentials = this.loadCredentials()
    this.timeouts = this.loadTimeouts()
    this.thresholds = this.loadThresholds()
  }

  public static getInstance(): TestConfig {
    if (!TestConfig.instance) {
      TestConfig.instance = new TestConfig()
    }
    return TestConfig.instance
  }

  /**
   * Load environment configuration
   */
  private loadEnvironment(): TestEnvironment {
    const env = process.env.TEST_ENVIRONMENT || 'development'

    const environments: Record<string, TestEnvironment> = {
      development: {
        name: 'development',
        supabaseUrl:
          process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://data.greenland77.ge',
        supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        description: 'Self-hosted Supabase development environment',
        isProduction: false,
      },
      production: {
        name: 'production',
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL_PROD || 'https://data.greenland77.ge',
        supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD || '',
        supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY_PROD,
        description: 'Self-hosted Supabase production environment',
        isProduction: true,
      },
      staging: {
        name: 'staging',
        supabaseUrl:
          process.env.NEXT_PUBLIC_SUPABASE_URL_STAGING || 'https://staging.greenland77.ge',
        supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING || '',
        supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY_STAGING,
        description: 'Staging environment for testing',
        isProduction: false,
      },
    }

    return (environments[env] || environments.development) as TestEnvironment
  }

  /**
   * Load test credentials
   */
  private loadCredentials(): TestCredentials {
    return {
      admin: {
        email: process.env.TEST_ADMIN_EMAIL || 'admin@test.ge',
        password: process.env.TEST_ADMIN_PASSWORD || 'admin123',
      },
      restaurant: {
        email: process.env.TEST_RESTAURANT_EMAIL || 'restaurant@test.ge',
        password: process.env.TEST_RESTAURANT_PASSWORD || 'restaurant123',
      },
      driver: {
        email: process.env.TEST_DRIVER_EMAIL || 'driver@test.ge',
        password: process.env.TEST_DRIVER_PASSWORD || 'driver123',
      },
      demo: {
        email: process.env.TEST_DEMO_EMAIL || 'demo@test.ge',
        password: process.env.TEST_DEMO_PASSWORD || 'demo123',
      },
    }
  }

  /**
   * Load timeout configurations
   */
  private loadTimeouts(): TestTimeouts {
    return {
      connection: parseInt(process.env.TEST_CONNECTION_TIMEOUT || '10000'),
      api: parseInt(process.env.TEST_API_TIMEOUT || '30000'),
      auth: parseInt(process.env.TEST_AUTH_TIMEOUT || '20000'),
      realtime: parseInt(process.env.TEST_REALTIME_TIMEOUT || '15000'),
      businessLogic: parseInt(process.env.TEST_BUSINESS_LOGIC_TIMEOUT || '45000'),
      overall: parseInt(process.env.TEST_OVERALL_TIMEOUT || '300000'),
    }
  }

  /**
   * Load performance and quality thresholds
   */
  private loadThresholds(): TestThresholds {
    return {
      performance: {
        apiResponseTime: parseInt(process.env.TEST_API_RESPONSE_THRESHOLD || '1000'),
        realtimeLatency: parseInt(process.env.TEST_REALTIME_LATENCY_THRESHOLD || '100'),
        overallScore: parseInt(process.env.TEST_OVERALL_SCORE_THRESHOLD || '80'),
      },
      quality: {
        minTestCoverage: parseInt(process.env.TEST_MIN_COVERAGE || '70'),
        maxErrorRate: parseInt(process.env.TEST_MAX_ERROR_RATE || '5'),
        maxSkippedTests: parseInt(process.env.TEST_MAX_SKIPPED || '10'),
      },
    }
  }

  /**
   * Get current environment
   */
  public getEnvironment(): TestEnvironment {
    return this.environment
  }

  /**
   * Get test credentials
   */
  public getCredentials(): TestCredentials {
    return this.credentials
  }

  /**
   * Get timeout configurations
   */
  public getTimeouts(): TestTimeouts {
    return this.timeouts
  }

  /**
   * Get performance and quality thresholds
   */
  public getThresholds(): TestThresholds {
    return this.thresholds
  }

  /**
   * Check if current environment is production
   */
  public isProduction(): boolean {
    return this.environment.isProduction
  }

  /**
   * Validate configuration
   */
  public validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Check required environment variables
    if (!this.environment.supabaseUrl) {
      errors.push('NEXT_PUBLIC_SUPABASE_URL is required')
    }

    if (!this.environment.supabaseAnonKey) {
      errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
    }

    // Check credentials format
    Object.entries(this.credentials).forEach(([role, creds]) => {
      if (!creds.email || !creds.email.includes('@')) {
        errors.push(`Invalid email for ${role} role`)
      }
      if (!creds.password || creds.password.length < 6) {
        errors.push(`Invalid password for ${role} role (must be at least 6 characters)`)
      }
    })

    // Check timeouts are reasonable
    Object.entries(this.timeouts).forEach(([key, value]) => {
      if (value < 1000) {
        errors.push(`${key} timeout too low: ${value}ms (minimum 1000ms)`)
      }
      if (value > 300000) {
        errors.push(`${key} timeout too high: ${value}ms (maximum 300000ms)`)
      }
    })

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Get configuration summary
   */
  public getSummary(): string {
    const validation = this.validate()

    return `
Test Configuration Summary
==========================
Environment: ${this.environment.name}
Production: ${this.environment.isProduction ? 'Yes' : 'No'}
Supabase URL: ${this.environment.supabaseUrl}

Credentials Configured:
- Admin: ${this.credentials.admin.email}
- Restaurant: ${this.credentials.restaurant.email}
- Driver: ${this.credentials.driver.email}
- Demo: ${this.credentials.demo.email}

Timeouts:
- Connection: ${this.timeouts.connection}ms
- API: ${this.timeouts.api}ms
- Auth: ${this.timeouts.auth}ms
- Real-time: ${this.timeouts.realtime}ms
- Business Logic: ${this.timeouts.businessLogic}ms
- Overall: ${this.timeouts.overall}ms

Thresholds:
- API Response Time: <${this.thresholds.performance.apiResponseTime}ms
- Real-time Latency: <${this.thresholds.performance.realtimeLatency}ms
- Overall Score: >${this.thresholds.performance.overallScore}%

Configuration Valid: ${validation.valid ? '✅' : '❌'}
${validation.errors.length > 0 ? 'Errors:\n' + validation.errors.map((e) => `  - ${e}`).join('\n') : ''}
    `.trim()
  }

  /**
   * Export configuration for external use
   */
  public export(): any {
    return {
      environment: this.environment,
      credentials: this.credentials,
      timeouts: this.timeouts,
      thresholds: this.thresholds,
      validation: this.validate(),
    }
  }
}

// Export singleton instance
export const testConfig = TestConfig.getInstance()

// Export convenience functions
export const getTestEnvironment = () => testConfig.getEnvironment()
export const getTestCredentials = () => testConfig.getCredentials()
export const getTestTimeouts = () => testConfig.getTimeouts()
export const getTestThresholds = () => testConfig.getThresholds()
export const isProductionEnvironment = () => testConfig.isProduction()
export const validateTestConfig = () => testConfig.validate()

// Export types (already exported as interfaces above)
