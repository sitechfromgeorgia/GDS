/**
 * Comprehensive VPS Connection Testing Suite
 * Tests all aspects of Supabase connectivity and functionality
 */

import { createBrowserClient } from '@/lib/supabase'
import { logger } from './logger'
import { handleSupabaseError } from './error-handler'

// Create Supabase client instance
const supabase = createBrowserClient()

export interface TestResult {
  name: string
  success: boolean
  duration: number
  error?: string
  details?: Record<string, unknown>
  category:
    | 'connection'
    | 'authentication'
    | 'database'
    | 'storage'
    | 'realtime'
    | 'cors'
    | 'environment'
}

export interface TestSuite {
  name: string
  category: TestResult['category']
  tests: TestResult[]
  summary: {
    total: number
    passed: number
    failed: number
    duration: number
  }
}

/**
 * Run comprehensive connection diagnostics
 */
export async function runVPSDiagnostics(): Promise<{
  timestamp: Date
  overall: 'success' | 'partial' | 'failure'
  suites: TestSuite[]
  summary: {
    totalTests: number
    passedTests: number
    failedTests: number
    totalDuration: number
  }
}> {
  const startTime = Date.now()
  const suites: TestSuite[] = []

  // Test Suite 1: Environment Configuration
  const envSuite = await testEnvironmentConfiguration()
  suites.push(envSuite)

  // Test Suite 2: Backend Accessibility
  const backendSuite = await testBackendAccessibility()
  suites.push(backendSuite)

  // Test Suite 3: Authentication System
  const authSuite = await testAuthenticationSystem()
  suites.push(authSuite)

  // Test Suite 4: Database Operations
  const databaseSuite = await testDatabaseOperations()
  suites.push(databaseSuite)

  // Test Suite 5: Storage Services
  const storageSuite = await testStorageServices()
  suites.push(storageSuite)

  // Test Suite 6: Real-time Features
  const realtimeSuite = await testRealtimeFeatures()
  suites.push(realtimeSuite)

  // Test Suite 7: CORS Configuration
  const corsSuite = await testCORSConfiguration()
  suites.push(corsSuite)

  const totalDuration = Date.now() - startTime
  const allResults = suites.flatMap((suite) => suite.tests)
  const passed = allResults.filter((test) => test.success).length
  const failed = allResults.filter((test) => !test.success).length

  // Determine overall status
  let overall: 'success' | 'partial' | 'failure'
  if (failed === 0) {
    overall = 'success'
  } else if (passed > failed) {
    overall = 'partial'
  } else {
    overall = 'failure'
  }

  return {
    timestamp: new Date(),
    overall,
    suites,
    summary: {
      totalTests: allResults.length,
      passedTests: passed,
      failedTests: failed,
      totalDuration,
    },
  }
}

/**
 * Test Environment Configuration
 */
async function testEnvironmentConfiguration(): Promise<TestSuite> {
  const tests: TestResult[] = []
  const startTime = Date.now()

  // Test 1.1: Environment variables presence
  try {
    const start = Date.now()
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY

    tests.push({
      name: 'Environment Variables',
      success: hasUrl && hasAnonKey,
      duration: Date.now() - start,
      category: 'environment',
      details: {
        hasUrl,
        hasAnonKey,
        hasServiceKey,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      },
    })
  } catch (error) {
    tests.push({
      name: 'Environment Variables',
      success: false,
      duration: Date.now() - startTime,
      category: 'environment',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }

  // Test 1.2: JWT Key validation
  try {
    const start = performance.now()
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // Basic JWT structure validation
    const isValidAnon = anonKey && anonKey.split('.').length === 3
    const isValidService = serviceKey && serviceKey.split('.').length === 3
    const keysMatch = anonKey === serviceKey // Critical security issue

    tests.push({
      name: 'JWT Key Configuration',
      success: Boolean(isValidAnon && isValidService && !keysMatch),
      duration: Math.round(performance.now() - start),
      category: 'environment',
      details: {
        isValidAnon,
        isValidService,
        keysMatch,
        securityIssue: keysMatch
          ? 'CRITICAL: ANON_KEY and SERVICE_ROLE_KEY are identical!'
          : undefined,
      },
      error: keysMatch ? 'Security vulnerability: JWT keys are identical' : undefined,
    })
  } catch (error) {
    tests.push({
      name: 'JWT Key Configuration',
      success: false,
      duration: Date.now() - startTime,
      category: 'environment',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }

  return {
    name: 'Environment Configuration',
    category: 'environment',
    tests,
    summary: {
      total: tests.length,
      passed: tests.filter((t) => t.success).length,
      failed: tests.filter((t) => !t.success).length,
      duration: Date.now() - startTime,
    },
  }
}

/**
 * Test Backend Accessibility
 */
async function testBackendAccessibility(): Promise<TestSuite> {
  const tests: TestResult[] = []
  const startTime = Date.now()
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://akxmacfsltzhbnunoepb.supabase.co'
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Test 2.1: REST API accessibility
  try {
    const start = Date.now()
    const response = await fetch(`${baseUrl}/rest/v1/`, {
      headers: {
        apikey: anonKey || '',
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
    })
    const duration = Date.now() - start

    tests.push({
      name: 'REST API Endpoint',
      success: response.ok,
      duration,
      category: 'connection',
      details: {
        status: response.status,
        statusText: response.statusText,
        url: `${baseUrl}/rest/v1/`,
      },
      error: !response.ok ? `HTTP ${response.status}: ${response.statusText}` : undefined,
    })
  } catch (error) {
    tests.push({
      name: 'REST API Endpoint',
      success: false,
      duration: Date.now() - startTime,
      category: 'connection',
      error: error instanceof Error ? error.message : 'Network error',
    })
  }

  // Test 2.2: Auth service accessibility
  try {
    const start = Date.now()
    const response = await fetch(`${baseUrl}/auth/v1/health`, {
      headers: {
        apikey: anonKey || '',
      },
    })
    const duration = Date.now() - start

    tests.push({
      name: 'Auth Service Health',
      success: response.ok,
      duration,
      category: 'connection',
      details: {
        status: response.status,
        statusText: response.statusText,
        url: `${baseUrl}/auth/v1/health`,
      },
      error: !response.ok ? `HTTP ${response.status}: ${response.statusText}` : undefined,
    })
  } catch (error) {
    tests.push({
      name: 'Auth Service Health',
      success: false,
      duration: Date.now() - startTime,
      category: 'connection',
      error: error instanceof Error ? error.message : 'Network error',
    })
  }

  // Test 2.3: Storage API accessibility
  try {
    const start = Date.now()
    const response = await fetch(`${baseUrl}/storage/v1/bucket`, {
      headers: {
        apikey: anonKey || '',
        Authorization: `Bearer ${anonKey}`,
      },
    })
    const duration = Date.now() - start

    tests.push({
      name: 'Storage API Endpoint',
      success: response.ok,
      duration,
      category: 'connection',
      details: {
        status: response.status,
        statusText: response.statusText,
        url: `${baseUrl}/storage/v1/bucket`,
      },
      error: !response.ok ? `HTTP ${response.status}: ${response.statusText}` : undefined,
    })
  } catch (error) {
    tests.push({
      name: 'Storage API Endpoint',
      success: false,
      duration: Date.now() - startTime,
      category: 'connection',
      error: error instanceof Error ? error.message : 'Network error',
    })
  }

  return {
    name: 'Backend Accessibility',
    category: 'connection',
    tests,
    summary: {
      total: tests.length,
      passed: tests.filter((t) => t.success).length,
      failed: tests.filter((t) => !t.success).length,
      duration: Date.now() - startTime,
    },
  }
}

/**
 * Test Authentication System
 */
async function testAuthenticationSystem(): Promise<TestSuite> {
  const tests: TestResult[] = []
  const startTime = Date.now()

  // Test 3.1: Auth service connectivity
  try {
    const start = performance.now()
    const { data, error } = await supabase.auth.getSession()
    const duration = Math.round(performance.now() - start)

    tests.push({
      name: 'Auth Service Connectivity',
      success: !error,
      duration,
      category: 'authentication',
      details: {
        hasSession: !!data.session,
        sessionValid: data.session?.access_token ? true : false,
      },
      error: error?.message,
    })
  } catch (error) {
    tests.push({
      name: 'Auth Service Connectivity',
      success: false,
      duration: Date.now() - startTime,
      category: 'authentication',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }

  // Test 3.2: JWT token validation
  try {
    const start = performance.now()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const duration = Math.round(performance.now() - start)

    const hasValidToken = session?.access_token && session.access_token.split('.').length === 3

    tests.push({
      name: 'JWT Token Structure',
      success: Boolean(hasValidToken),
      duration,
      category: 'authentication',
      details: {
        hasAccessToken: !!session?.access_token,
        tokenLength: session?.access_token?.length || 0,
        tokenStructureValid: Boolean(hasValidToken),
      },
      error: !hasValidToken ? 'Invalid or missing JWT token structure' : undefined,
    })
  } catch (error) {
    tests.push({
      name: 'JWT Token Structure',
      success: false,
      duration: Date.now() - startTime,
      category: 'authentication',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }

  return {
    name: 'Authentication System',
    category: 'authentication',
    tests,
    summary: {
      total: tests.length,
      passed: tests.filter((t) => t.success).length,
      failed: tests.filter((t) => !t.success).length,
      duration: Date.now() - startTime,
    },
  }
}

/**
 * Test Database Operations
 */
async function testDatabaseOperations(): Promise<TestSuite> {
  const tests: TestResult[] = []
  const startTime = Date.now()

  // Test 4.1: Database connection
  try {
    const start = performance.now()
    const { data, error, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .limit(1)
    const duration = Math.round(performance.now() - start)

    tests.push({
      name: 'Database Connection',
      success: !error,
      duration,
      category: 'database',
      details: {
        hasData: !!data,
        recordCount: count,
        queryDuration: duration,
      },
      error: error?.message,
    })
  } catch (error) {
    tests.push({
      name: 'Database Connection',
      success: false,
      duration: Date.now() - startTime,
      category: 'database',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }

  // Test 4.2: RLS Policy enforcement
  try {
    const start = performance.now()
    // Try to access admin data (should be controlled by RLS)
    const { error } = await supabase.from('profiles').select('*').eq('role', 'admin').limit(1)
    const duration = Math.round(performance.now() - start)

    // Error is expected due to RLS, but CORS error indicates configuration issue
    const isCORSError = error?.message?.includes('CORS') || error?.message?.includes('fetch')
    const isRLSError = error?.code === '42501' || error?.message?.includes('permission')

    tests.push({
      name: 'RLS Policy Enforcement',
      success: !isCORSError, // Should not be CORS error
      duration,
      category: 'database',
      details: {
        isCORSError,
        isRLSError,
        errorCode: error?.code,
        errorMessage: error?.message,
      },
      error: isCORSError ? 'CORS error suggests backend misconfiguration' : undefined,
    })
  } catch (error) {
    tests.push({
      name: 'RLS Policy Enforcement',
      success: false,
      duration: Date.now() - startTime,
      category: 'database',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }

  return {
    name: 'Database Operations',
    category: 'database',
    tests,
    summary: {
      total: tests.length,
      passed: tests.filter((t) => t.success).length,
      failed: tests.filter((t) => !t.success).length,
      duration: Date.now() - startTime,
    },
  }
}

/**
 * Test Storage Services
 */
async function testStorageServices(): Promise<TestSuite> {
  const tests: TestResult[] = []
  const startTime = Date.now()

  // Test 5.1: Storage buckets access
  try {
    const start = performance.now()
    const { data, error } = await supabase.storage.listBuckets()
    const duration = Math.round(performance.now() - start)

    tests.push({
      name: 'Storage Buckets Access',
      success: !error && !!data,
      duration,
      category: 'storage',
      details: {
        bucketCount: data?.length || 0,
        buckets: data?.map((b: any) => b.name) || [],
      },
      error: error?.message,
    })
  } catch (error) {
    tests.push({
      name: 'Storage Buckets Access',
      success: false,
      duration: Date.now() - startTime,
      category: 'storage',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }

  return {
    name: 'Storage Services',
    category: 'storage',
    tests,
    summary: {
      total: tests.length,
      passed: tests.filter((t) => t.success).length,
      failed: tests.filter((t) => !t.success).length,
      duration: Date.now() - startTime,
    },
  }
}

/**
 * Test Real-time Features
 */
async function testRealtimeFeatures(): Promise<TestSuite> {
  const tests: TestResult[] = []
  const startTime = Date.now()

  // Test 6.1: WebSocket connection
  try {
    const start = performance.now()
    const channel = supabase.channel('test-channel')
    let connected = false
    let errorMessage = ''

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        errorMessage = 'Connection timeout'
        reject(new Error('Connection timeout'))
      }, 5000)

      channel.subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          clearTimeout(timeout)
          connected = true
          resolve(undefined)
        }
        if (status === 'CHANNEL_ERROR') {
          clearTimeout(timeout)
          errorMessage = `Channel error: ${status}`
          reject(new Error(`Channel error: ${status}`))
        }
      })
    })

    const duration = Math.round(performance.now() - start)
    await channel.unsubscribe()

    tests.push({
      name: 'WebSocket Connection',
      success: connected,
      duration,
      category: 'realtime',
      details: {
        connected,
        connectionTime: duration,
      },
      error: errorMessage || undefined,
    })
  } catch (error) {
    tests.push({
      name: 'WebSocket Connection',
      success: false,
      duration: Date.now() - startTime,
      category: 'realtime',
      error: error instanceof Error ? error.message : 'Connection failed',
    })
  }

  return {
    name: 'Real-time Features',
    category: 'realtime',
    tests,
    summary: {
      total: tests.length,
      passed: tests.filter((t) => t.success).length,
      failed: tests.filter((t) => !t.success).length,
      duration: Date.now() - startTime,
    },
  }
}

/**
 * Test CORS Configuration
 */
async function testCORSConfiguration(): Promise<TestSuite> {
  const tests: TestResult[] = []
  const startTime = Date.now()
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://akxmacfsltzhbnunoepb.supabase.co'
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Test 7.1: CORS preflight handling
  try {
    const start = performance.now()
    const response = await fetch(`${baseUrl}/rest/v1/profiles?select=count&limit=1`, {
      method: 'OPTIONS',
      headers: {
        apikey: anonKey || '',
        Authorization: `Bearer ${anonKey}`,
        Origin: 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'apikey, authorization',
      },
    })
    const duration = Math.round(performance.now() - start)

    const hasCORSHeaders =
      response.headers.get('access-control-allow-origin') ||
      response.headers.get('Access-Control-Allow-Origin')

    tests.push({
      name: 'CORS Preflight Response',
      success: response.status < 400, // Should not be 4xx/5xx
      duration,
      category: 'cors',
      details: {
        status: response.status,
        statusText: response.statusText,
        hasCORSHeaders,
        allowedOrigin: response.headers.get('access-control-allow-origin'),
        allowedMethods: response.headers.get('access-control-allow-methods'),
      },
      error: response.status >= 400 ? `HTTP ${response.status}: ${response.statusText}` : undefined,
    })
  } catch (error) {
    tests.push({
      name: 'CORS Preflight Response',
      success: false,
      duration: Date.now() - startTime,
      category: 'cors',
      error: error instanceof Error ? error.message : 'Network error',
    })
  }

  return {
    name: 'CORS Configuration',
    category: 'cors',
    tests,
    summary: {
      total: tests.length,
      passed: tests.filter((t) => t.success).length,
      failed: tests.filter((t) => !t.success).length,
      duration: Date.now() - startTime,
    },
  }
}
