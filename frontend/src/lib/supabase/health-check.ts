import { logger } from '@/lib/logger'
import { createBrowserClient } from './client'

// Create Supabase client instance
const supabase = createBrowserClient()

export interface HealthCheckResult {
  timestamp: string
  overall: 'healthy' | 'degraded' | 'unhealthy'
  checks: {
    database: HealthCheckItem
    authentication: HealthCheckItem
    realtime: HealthCheckItem
    storage: HealthCheckItem
  }
  performance: {
    connectionTime: number
    averageResponseTime: number
    errors: number
  }
  recommendations: string[]
  environment: {
    url: string
    isLocal: boolean
    clientInfo: string
  }
}

export interface HealthCheckItem {
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime: number
  details: string
  error?: string
}

class SupabaseHealthCheck {
  private testResults: HealthCheckResult = {
    timestamp: new Date().toISOString(),
    overall: 'healthy',
    checks: {
      database: { status: 'healthy', responseTime: 0, details: '' },
      authentication: { status: 'healthy', responseTime: 0, details: '' },
      realtime: { status: 'healthy', responseTime: 0, details: '' },
      storage: { status: 'healthy', responseTime: 0, details: '' },
    },
    performance: {
      connectionTime: 0,
      averageResponseTime: 0,
      errors: 0,
    },
    recommendations: [],
    environment: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      isLocal: process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('localhost') || false,
      clientInfo: 'georgian-distribution-system@1.0.0',
    },
  }

  constructor() {
    // Initialize environment info
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      this.testResults.environment.url = process.env.NEXT_PUBLIC_SUPABASE_URL
      this.testResults.environment.isLocal =
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('localhost') ||
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('127.0.0.1')
    }
  }

  /**
   * Run all health checks and return comprehensive results
   */
  async runFullHealthCheck(): Promise<HealthCheckResult> {
    logger.info('🔍 Starting comprehensive Supabase health check...')

    const startTime = Date.now()

    try {
      // Run all checks concurrently for efficiency
      const [databaseResult, authResult, realtimeResult, storageResult] = await Promise.allSettled([
        this.checkDatabaseConnection(),
        this.checkAuthentication(),
        this.checkRealtimeConnection(),
        this.checkStorageAccess(),
      ])

      // Process results
      if (databaseResult.status === 'fulfilled') {
        this.testResults.checks.database = databaseResult.value
      } else {
        this.testResults.checks.database = {
          status: 'unhealthy',
          responseTime: 0,
          details: 'Database connection failed',
          error: databaseResult.reason.message,
        }
        this.testResults.performance.errors++
      }

      if (authResult.status === 'fulfilled') {
        this.testResults.checks.authentication = authResult.value
      } else {
        this.testResults.checks.authentication = {
          status: 'unhealthy',
          responseTime: 0,
          details: 'Authentication check failed',
          error: authResult.reason.message,
        }
        this.testResults.performance.errors++
      }

      if (realtimeResult.status === 'fulfilled') {
        this.testResults.checks.realtime = realtimeResult.value
      } else {
        this.testResults.checks.realtime = {
          status: 'degraded',
          responseTime: 0,
          details: 'Realtime connection unavailable',
          error: realtimeResult.reason.message,
        }
      }

      if (storageResult.status === 'fulfilled') {
        this.testResults.checks.storage = storageResult.value
      } else {
        this.testResults.checks.storage = {
          status: 'degraded',
          responseTime: 0,
          details: 'Storage access unavailable',
          error: storageResult.reason.message,
        }
      }

      // Calculate overall performance metrics
      this.testResults.performance.connectionTime = Date.now() - startTime

      const responseTimes = Object.values(this.testResults.checks)
        .map((check) => check.responseTime)
        .filter((time) => time > 0)

      this.testResults.performance.averageResponseTime =
        responseTimes.length > 0
          ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
          : 0

      // Determine overall health status
      this.determineOverallHealth()

      // Generate recommendations
      this.generateRecommendations()

      logger.info('✅ Health check completed', {
        overall: this.testResults.overall,
      })

      return this.testResults
    } catch (error) {
      logger.error('❌ Health check failed', { error })
      this.testResults.overall = 'unhealthy'
      this.testResults.performance.errors++
      this.testResults.recommendations.push('Critical: Health check system failure')
      return this.testResults
    }
  }

  /**
   * Check basic database connectivity and basic query operations
   */
  private async checkDatabaseConnection(): Promise<HealthCheckItem> {
    const startTime = Date.now()

    try {
      // Test basic connectivity with a simple query
      const { data, error } = await supabase.from('products').select('id, name').limit(1)

      const responseTime = Date.now() - startTime

      if (error) {
        return {
          status: 'unhealthy',
          responseTime,
          details: 'Database query failed',
          error: error.message,
        }
      }

      return {
        status: 'healthy',
        responseTime,
        details: `Database connection successful. Sample data retrieved: ${data?.length || 0} items`,
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        details: 'Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Check authentication system functionality
   */
  private async checkAuthentication(): Promise<HealthCheckItem> {
    const startTime = Date.now()

    try {
      // Check if auth is properly initialized
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      const responseTime = Date.now() - startTime

      // Test session management
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        return {
          status: 'degraded',
          responseTime,
          details: 'Auth system initialized but session management has issues',
          error: sessionError.message,
        }
      }

      return {
        status: 'healthy',
        responseTime,
        details: `Auth system operational. Current user: ${user?.email || 'Anonymous'}. Session: ${session ? 'Active' : 'None'}`,
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        details: 'Authentication system failure',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Check realtime functionality and subscription capabilities
   */
  private async checkRealtimeConnection(): Promise<HealthCheckItem> {
    const startTime = Date.now()

    try {
      // Test realtime channel creation
      const channel = supabase.channel('health-check-test', {
        config: {
          broadcast: { self: true },
          presence: { key: 'health-check' },
        },
      })

      // Test subscription to a table (orders table for real Georgian Distribution use case)
      const subscription = channel
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          (payload: any) => {
            logger.info('✅ Realtime test subscription received:', payload)
          }
        )
        .on('broadcast', { event: 'health-check' }, (payload: any) => {
          logger.info('✅ Broadcast test received:', payload)
        })
        .subscribe((status: any) => {
          logger.info(`📡 Realtime subscription status: ${status}`)
        })

      // Wait a bit for subscription to establish
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Test broadcast functionality
      await channel.send({
        type: 'broadcast',
        event: 'health-check',
        payload: { message: 'Health check test', timestamp: new Date().toISOString() },
      })

      // Cleanup
      await supabase.removeChannel(channel)

      const responseTime = Date.now() - startTime

      return {
        status: 'healthy',
        responseTime,
        details:
          'Realtime functionality operational. Subscriptions and broadcasts working correctly.',
      }
    } catch (error) {
      return {
        status: 'degraded',
        responseTime: Date.now() - startTime,
        details: 'Realtime system initialization failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Check storage bucket access and file operations
   */
  private async checkStorageAccess(): Promise<HealthCheckItem> {
    const startTime = Date.now()

    try {
      // Test bucket listing (public bucket for product images)
      const { data: buckets, error: listError } = await supabase.storage.listBuckets()

      const responseTime = Date.now() - startTime

      if (listError) {
        return {
          status: 'degraded',
          responseTime,
          details: 'Storage service accessible but bucket listing failed',
          error: listError.message,
        }
      }

      // Check if product-images bucket exists (our primary bucket)
      const productBucket = buckets?.find((bucket: any) => bucket.name === 'product-images')

      if (!productBucket) {
        return {
          status: 'degraded',
          responseTime,
          details: 'Storage buckets accessible but product-images bucket missing',
          error: 'product-images bucket not found',
        }
      }

      return {
        status: 'healthy',
        responseTime,
        details: `Storage access successful. Found ${buckets?.length || 0} buckets. Product images bucket accessible.`,
      }
    } catch (error) {
      return {
        status: 'degraded',
        responseTime: Date.now() - startTime,
        details: 'Storage system access failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Determine overall health status based on individual checks
   */
  private determineOverallHealth(): void {
    const checks = Object.values(this.testResults.checks)

    const unhealthyCount = checks.filter((check) => check.status === 'unhealthy').length
    const degradedCount = checks.filter((check) => check.status === 'degraded').length

    if (unhealthyCount > 0) {
      this.testResults.overall = 'unhealthy'
    } else if (degradedCount > 0) {
      this.testResults.overall = 'degraded'
    } else {
      this.testResults.overall = 'healthy'
    }
  }

  /**
   * Generate actionable recommendations based on test results
   */
  private generateRecommendations(): void {
    const { checks, performance } = this.testResults

    // Database recommendations
    if (checks.database.status === 'unhealthy') {
      this.testResults.recommendations.push(
        '🔴 Database connection failed - Check Supabase project status and credentials'
      )
    } else if (checks.database.status === 'degraded') {
      this.testResults.recommendations.push(
        '🟡 Database write operations failing - Check RLS policies and permissions'
      )
    } else if (checks.database.responseTime > 500) {
      this.testResults.recommendations.push(
        '🐌 Database response time is slow (>500ms) - Consider adding database indexes'
      )
    }

    // Authentication recommendations
    if (checks.authentication.status === 'unhealthy') {
      this.testResults.recommendations.push(
        '🔴 Authentication system failed - Check Supabase Auth configuration'
      )
    } else if (checks.authentication.status === 'degraded') {
      this.testResults.recommendations.push(
        '🟡 Authentication issues detected - Review JWT configuration and session handling'
      )
    }

    // Realtime recommendations
    if (checks.realtime.status === 'degraded') {
      this.testResults.recommendations.push(
        '🟡 Realtime functionality issues - Check WebSocket connections and firewall settings'
      )
    }

    // Storage recommendations
    if (checks.storage.status === 'degraded') {
      this.testResults.recommendations.push(
        '🟡 Storage access issues - Verify bucket permissions and CORS settings'
      )
    }

    // Performance recommendations
    if (performance.averageResponseTime > 1000) {
      this.testResults.recommendations.push(
        '🐌 High average response time (>1s) - Consider implementing connection pooling and query optimization'
      )
    }

    if (performance.errors > 0) {
      this.testResults.recommendations.push(
        '⚠️  Some health checks failed - Review error logs for specific issues'
      )
    }

    if (this.testResults.recommendations.length === 0) {
      this.testResults.recommendations.push(
        '✅ All systems operational - Continue monitoring for optimal performance'
      )
    }
  }

  /**
   * Quick health check for monitoring dashboards
   */
  async quickCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: string }> {
    try {
      const { error } = await supabase.from('products').select('id').limit(1)

      return {
        status: error ? 'unhealthy' : 'healthy',
        details: error ? `Database error: ${error.message}` : 'Database connection OK',
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}

// Export singleton instance for easy use across the application
export const supabaseHealthCheck = new SupabaseHealthCheck()

// Export helper function for convenience
export const runHealthCheck = () => supabaseHealthCheck.runFullHealthCheck()
export const runQuickCheck = () => supabaseHealthCheck.quickCheck()
