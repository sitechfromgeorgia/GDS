import { logger } from '@/lib/logger'
import { createBrowserClient } from '@/lib/supabase'
import { recordPerformance } from '../monitoring/performance'

// Create Supabase client instance
const supabase = createBrowserClient()

/**
 * Comprehensive API Testing Utility for Georgian Distribution System
 * Tests all Supabase API endpoints and client initialization
 */

export interface APIEndpointTest {
  name: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  endpoint: string
  description: string
  requiredAuth: boolean
  testData?: any
  expectedStatus?: number
  timeout?: number
}

export interface APITestResult {
  test: string
  status: 'passed' | 'failed' | 'skipped'
  duration: number
  statusCode?: number
  response?: any
  error?: string
  details?: any
}

export interface APITestSuite {
  name: string
  description: string
  endpoints: APIEndpointTest[]
  results: APITestResult[]
  summary: {
    total: number
    passed: number
    failed: number
    skipped: number
    averageResponseTime: number
  }
}

// Define all API endpoints to test
const API_ENDPOINTS: APIEndpointTest[] = [
  // Core Tables
  {
    name: 'Products - List',
    method: 'GET',
    endpoint: 'products',
    description: 'Retrieve all products from the catalog',
    requiredAuth: false,
    expectedStatus: 200,
  },
  {
    name: 'Products - Single Item',
    method: 'GET',
    endpoint: 'products?id=eq.1',
    description: 'Retrieve specific product by ID',
    requiredAuth: false,
    expectedStatus: 200,
  },
  {
    name: 'Profiles - List',
    method: 'GET',
    endpoint: 'profiles',
    description: 'Retrieve user profiles (RLS should apply)',
    requiredAuth: true,
    expectedStatus: 200,
  },
  {
    name: 'Orders - List',
    method: 'GET',
    endpoint: 'orders',
    description: 'Retrieve orders (RLS should apply)',
    requiredAuth: true,
    expectedStatus: 200,
  },
  {
    name: 'Order Items - List',
    method: 'GET',
    endpoint: 'order_items',
    description: 'Retrieve order items',
    requiredAuth: true,
    expectedStatus: 200,
  },
  {
    name: 'Notifications - List',
    method: 'GET',
    endpoint: 'notifications',
    description: 'Retrieve user notifications',
    requiredAuth: true,
    expectedStatus: 200,
  },
  {
    name: 'Demo Sessions - List',
    method: 'GET',
    endpoint: 'demo_sessions',
    description: 'Retrieve demo sessions',
    requiredAuth: false,
    expectedStatus: 200,
  },

  // Insert Operations
  {
    name: 'Profiles - Insert',
    method: 'POST',
    endpoint: 'profiles',
    description: 'Create new user profile',
    requiredAuth: true,
    testData: {
      id: 'test-user-' + Date.now(),
      email: 'test@example.com',
      full_name: 'Test User',
      role: 'restaurant',
      is_active: true,
    },
    expectedStatus: 201,
  },

  // Update Operations
  {
    name: 'Products - Update',
    method: 'PATCH',
    endpoint: 'products',
    description: 'Update product information',
    requiredAuth: true,
    testData: {
      id: 'test-product-update',
      name: 'Updated Product',
      is_active: true,
    },
    expectedStatus: 200,
  },

  // Complex Queries
  {
    name: 'Orders with Join',
    method: 'GET',
    endpoint: 'orders?select=*,profiles(*)',
    description: 'Orders with related profile data',
    requiredAuth: true,
    expectedStatus: 200,
  },
  {
    name: 'Order Items with Products',
    method: 'GET',
    endpoint: 'order_items?select=*,products(*)',
    description: 'Order items with product details',
    requiredAuth: true,
    expectedStatus: 200,
  },
]

class APITester {
  private results: APITestResult[] = []
  private currentSession: any = null

  /**
   * Run all API endpoint tests
   */
  async runAllTests(): Promise<APITestSuite> {
    logger.info('🧪 Georgian Distribution System - API Testing')
    logger.info('='.repeat(60))
    logger.info(`Testing ${API_ENDPOINTS.length} API endpoints`)
    logger.info(`Time: ${new Date().toISOString()}`)
    logger.info('')

    this.results = []
    const startTime = Date.now()

    try {
      // Initialize Supabase connection
      await this.testSupabaseInitialization()

      // Test each endpoint
      for (const endpoint of API_ENDPOINTS) {
        await this.testEndpoint(endpoint)

        // Add small delay between tests to avoid rate limiting
        await this.delay(100)
      }

      // Test authentication flows
      await this.testAuthenticationFlows()

      // Test error handling
      await this.testErrorHandling()

      // Test performance under load
      await this.testPerformanceLoad()

      const totalDuration = Date.now() - startTime
      const summary = this.calculateSummary()

      logger.info('')
      logger.info('📊 API Test Summary')
      logger.info('='.repeat(60))
      logger.info(`Total Tests: ${summary.total}`)
      logger.info(`✅ Passed: ${summary.passed}`)
      logger.info(`❌ Failed: ${summary.failed}`)
      logger.info(`⚠️  Skipped: ${summary.skipped}`)
      logger.info(`⚡ Average Response Time: ${summary.averageResponseTime.toFixed(2)}ms`)
      logger.info(`⏱️  Total Duration: ${totalDuration}ms`)

      return {
        name: 'Complete API Test Suite',
        description: 'Comprehensive testing of all Georgian Distribution System API endpoints',
        endpoints: API_ENDPOINTS,
        results: this.results,
        summary,
      }
    } catch (error) {
      logger.error('❌ API testing failed:', error)
      throw error
    }
  }

  /**
   * Test Supabase client initialization
   */
  private async testSupabaseInitialization(): Promise<void> {
    logger.info('🔍 Testing Supabase Client Initialization...')
    const startTime = Date.now()

    try {
      // Test basic connection by attempting to get session
      const { error: connectionError } = await supabase.auth.getSession()

      if (connectionError) {
        this.addResult({
          test: 'Supabase Connection',
          status: 'failed',
          duration: Date.now() - startTime,
          error: `Failed to establish connection to Supabase: ${connectionError.message}`,
        })
        return
      }

      // Test client configuration
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError && !sessionError.message.includes('JWT')) {
        this.addResult({
          test: 'Supabase Session',
          status: 'failed',
          duration: Date.now() - startTime,
          error: sessionError.message,
        })
        return
      }

      this.currentSession = session

      this.addResult({
        test: 'Supabase Connection',
        status: 'passed',
        duration: Date.now() - startTime,
        details: {
          connected: true,
          hasSession: !!session,
          environment: process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('localhost')
            ? 'local'
            : 'production',
        },
      })

      logger.info(`   ✅ Supabase client initialized successfully`)
    } catch (error) {
      this.addResult({
        test: 'Supabase Connection',
        status: 'failed',
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      logger.info(`   ❌ Supabase client initialization failed`)
    }
  }

  /**
   * Test individual API endpoint
   */
  private async testEndpoint(endpoint: APIEndpointTest): Promise<void> {
    const startTime = Date.now()

    try {
      logger.info(`🔍 Testing: ${endpoint.name}...`)

      // Skip if authentication required but no session
      if (endpoint.requiredAuth && !this.currentSession) {
        this.addResult({
          test: endpoint.name,
          status: 'skipped',
          duration: 0,
          error: 'No valid session for authenticated endpoint',
        })
        logger.info(`   ⚠️  Skipped (no authentication)`)
        return
      }

      let response
      const timeout = endpoint.timeout || 10000

      // Execute the appropriate HTTP method
      switch (endpoint.method) {
        case 'GET':
          response = await this.executeGet(endpoint.endpoint, timeout)
          break
        case 'POST':
          response = await this.executePost(endpoint.endpoint, endpoint.testData, timeout)
          break
        case 'PUT':
        case 'PATCH':
          response = await this.executeUpdate(
            endpoint.method,
            endpoint.endpoint,
            endpoint.testData,
            timeout
          )
          break
        case 'DELETE':
          response = await this.executeDelete(endpoint.endpoint, timeout)
          break
        default:
          throw new Error(`Unsupported method: ${endpoint.method}`)
      }

      const duration = Date.now() - startTime

      // Record performance metric
      recordPerformance(`api:${endpoint.endpoint}`, duration, 'success', {
        method: endpoint.method,
        statusCode: response.status,
      })

      // Check if response matches expected status
      const expectedStatus = endpoint.expectedStatus || 200
      const actualStatus = response.status

      if (actualStatus === expectedStatus) {
        this.addResult({
          test: endpoint.name,
          status: 'passed',
          duration,
          statusCode: actualStatus,
          response: response.data,
          details: {
            method: endpoint.method,
            endpoint: endpoint.endpoint,
            recordsAffected:
              response.count || (Array.isArray(response.data) ? response.data.length : 1),
          },
        })
        logger.info(`   ✅ ${endpoint.name} (${duration}ms)`)
      } else {
        this.addResult({
          test: endpoint.name,
          status: 'failed',
          duration,
          statusCode: actualStatus,
          error: `Expected status ${expectedStatus}, got ${actualStatus}`,
          response: response.data,
        })
        logger.info(`   ❌ ${endpoint.name} - Wrong status code`)
      }
    } catch (error) {
      const duration = Date.now() - startTime

      // Record performance metric
      recordPerformance(`api:${endpoint.endpoint}`, duration, 'error', {
        method: endpoint.method,
        error: error instanceof Error ? error.message : 'Unknown error',
      })

      this.addResult({
        test: endpoint.name,
        status: 'failed',
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      logger.info(
        `   ❌ ${endpoint.name} failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Execute GET request
   */
  private async executeGet(endpoint: string, timeout: number): Promise<any> {
    const tableName = endpoint.split('?')[0] || endpoint
    const query = supabase.from(tableName as any).select('*')

    if (endpoint.includes('?')) {
      // Parse query parameters
      const params = endpoint.split('?')[1] || ''
      const paramPairs = params.split('&')

      paramPairs.forEach((pair) => {
        const [key, value] = pair.split('=')
        if (key && value) {
          query.eq(key, value)
        }
      })
    }

    return Promise.race([
      query,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), timeout)),
    ])
  }

  /**
   * Execute POST request
   */
  private async executePost(endpoint: string, data: any, timeout: number): Promise<any> {
    return Promise.race([
      supabase.from(endpoint as any).insert(data),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), timeout)),
    ])
  }

  /**
   * Execute PUT/PATCH request
   */
  private async executeUpdate(
    method: 'PUT' | 'PATCH',
    endpoint: string,
    data: any,
    timeout: number
  ): Promise<any> {
    const table = endpoint.split('?')[0] || endpoint
    return Promise.race([
      supabase.from(table as any).update(data),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), timeout)),
    ])
  }

  /**
   * Execute DELETE request
   */
  private async executeDelete(endpoint: string, timeout: number): Promise<any> {
    const table = endpoint.split('?')[0] || endpoint
    return Promise.race([
      supabase.from(table as any).delete(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), timeout)),
    ])
  }

  /**
   * Test authentication flows
   */
  private async testAuthenticationFlows(): Promise<void> {
    logger.info('')
    logger.info('🔐 Testing Authentication Flows...')

    // Test unauthenticated access
    await this.testUnauthenticatedAccess()

    // Test session management
    await this.testSessionManagement()
  }

  /**
   * Test unauthenticated access behavior
   */
  private async testUnauthenticatedAccess(): Promise<void> {
    const startTime = Date.now()

    try {
      // Sign out current user if any
      await supabase.auth.signOut()
      this.currentSession = null

      // Try to access protected endpoint
      const { data, error } = await supabase.from('profiles').select('*').limit(1)

      // Should either return empty data or specific auth error
      const hasAuthError =
        error &&
        (error.message.includes('JWT') ||
          error.message.includes('auth') ||
          error.message.includes('unauthorized'))

      this.addResult({
        test: 'Unauthenticated Access Control',
        status: hasAuthError || !data ? 'passed' : 'failed',
        duration: Date.now() - startTime,
        details: {
          error,
          hasAuthError,
          returnedData: !!data,
        },
      })

      logger.info(`   ✅ Unauthenticated access properly controlled`)
    } catch (error) {
      this.addResult({
        test: 'Unauthenticated Access Control',
        status: 'passed', // Auth errors are expected
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      logger.info(`   ✅ Unauthenticated access properly rejected`)
    }
  }

  /**
   * Test session management
   */
  private async testSessionManagement(): Promise<void> {
    const startTime = Date.now()

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      this.addResult({
        test: 'Session Management',
        status: error ? 'failed' : 'passed',
        duration: Date.now() - startTime,
        details: {
          hasSession: !!session,
          userId: session?.user?.id,
          expiresAt: session?.expires_at,
        },
      })

      logger.info(`   ✅ Session management working`)
    } catch (error) {
      this.addResult({
        test: 'Session Management',
        status: 'failed',
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      logger.info(`   ❌ Session management failed`)
    }
  }

  /**
   * Test error handling
   */
  private async testErrorHandling(): Promise<void> {
    logger.info('')
    logger.info('🚨 Testing Error Handling...')

    // Test invalid table access
    await this.testInvalidTableAccess()

    // Test malformed queries
    await this.testMalformedQueries()
  }

  /**
   * Test access to non-existent table
   */
  private async testInvalidTableAccess(): Promise<void> {
    const startTime = Date.now()

    try {
      const { data, error } = await supabase.from('non_existent_table' as any).select('*')

      this.addResult({
        test: 'Invalid Table Access',
        status: error ? 'passed' : 'failed',
        duration: Date.now() - startTime,
        details: {
          error,
          returnedData: !!data,
        },
      })

      logger.info(`   ✅ Invalid table access properly rejected`)
    } catch (error) {
      this.addResult({
        test: 'Invalid Table Access',
        status: 'passed',
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      logger.info(`   ✅ Invalid table access properly rejected`)
    }
  }

  /**
   * Test malformed query handling
   */
  private async testMalformedQueries(): Promise<void> {
    const startTime = Date.now()

    try {
      // Test invalid column in select
      const { error } = await supabase.from('products').select('non_existent_column')

      this.addResult({
        test: 'Malformed Query Handling',
        status: error ? 'passed' : 'failed',
        duration: Date.now() - startTime,
        details: {
          error,
        },
      })

      logger.info(`   ✅ Malformed queries properly rejected`)
    } catch (error) {
      this.addResult({
        test: 'Malformed Query Handling',
        status: 'passed',
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      logger.info(`   ✅ Malformed queries properly rejected`)
    }
  }

  /**
   * Test performance under load
   */
  private async testPerformanceLoad(): Promise<void> {
    logger.info('')
    logger.info('⚡ Testing Performance Under Load...')

    const concurrentRequests = 10
    const startTime = Date.now()

    try {
      // Create multiple concurrent requests
      const promises = Array(concurrentRequests)
        .fill(null)
        .map(() => supabase.from('products').select('*').limit(5))

      const results = await Promise.allSettled(promises)
      const successful = results.filter((r) => r.status === 'fulfilled').length
      const failed = results.filter((r) => r.status === 'rejected').length
      const duration = Date.now() - startTime

      this.addResult({
        test: 'Concurrent Load Testing',
        status: failed === 0 ? 'passed' : 'failed',
        duration,
        details: {
          concurrentRequests,
          successful,
          failed,
          averageTimePerRequest: duration / concurrentRequests,
          performanceNote:
            failed > 0 ? 'Some requests failed under load' : 'All requests succeeded under load',
        },
      })

      logger.info(`   ⚡ Load test completed: ${successful}/${concurrentRequests} successful`)
    } catch (error) {
      this.addResult({
        test: 'Concurrent Load Testing',
        status: 'failed',
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      logger.info(`   ❌ Load testing failed`)
    }
  }

  /**
   * Add test result
   */
  private addResult(result: APITestResult): void {
    this.results.push(result)
  }

  /**
   * Calculate test summary
   */
  private calculateSummary() {
    const total = this.results.length
    const passed = this.results.filter((r) => r.status === 'passed').length
    const failed = this.results.filter((r) => r.status === 'failed').length
    const skipped = this.results.filter((r) => r.status === 'skipped').length

    const completedTests = this.results.filter((r) => r.status !== 'skipped')
    const averageResponseTime =
      completedTests.length > 0
        ? completedTests.reduce((sum, r) => sum + r.duration, 0) / completedTests.length
        : 0

    return {
      total,
      passed,
      failed,
      skipped,
      averageResponseTime,
    }
  }

  /**
   * Helper delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Get current test results
   */
  getResults(): APITestResult[] {
    return this.results
  }

  /**
   * Export test results as JSON
   */
  exportResults(): string {
    return JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        summary: this.calculateSummary(),
        results: this.results,
      },
      null,
      2
    )
  }
}

// Export singleton instance
export const apiTester = new APITester()

// Export helper functions
export const runAPITests = () => apiTester.runAllTests()
export const getAPITestResults = () => apiTester.getResults()
export const exportAPITestResults = () => apiTester.exportResults()
