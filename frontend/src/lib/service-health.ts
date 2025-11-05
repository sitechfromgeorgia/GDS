/**
 * Service health monitoring for Supabase VPS backend
 */

import { createBrowserClient } from '@/lib/supabase'
import { logger } from './logger'
import { handleSupabaseError } from './error-handler'
import { Database } from '@/types/database'
import { PostgrestSingleResponse } from '@supabase/supabase-js'

// Create Supabase client instance
const supabase = createBrowserClient()

export interface ServiceStatus {
  database: boolean
  auth: boolean
  storage: boolean
  realtime: boolean
  overall: 'healthy' | 'degraded' | 'down'
  details: {
    database?: string
    auth?: string
    storage?: string
    realtime?: string
  }
  latency?: number
  lastCheck?: Date
}

export async function checkServiceHealth(): Promise<ServiceStatus> {
  const startTime = Date.now()
  const results = {
    database: false,
    auth: false,
    storage: false,
    realtime: false,
    details: {
      database: undefined as string | undefined,
      auth: undefined as string | undefined,
      storage: undefined as string | undefined,
      realtime: undefined as string | undefined,
    },
  }

  try {
    // Test Database - Try to access profiles table
    try {
      const queryResult = await supabase
        .from('profiles')
        .select('count', { count: 'exact' })
        .limit(1)
        .single()

      if (!queryResult.error && typeof queryResult.count === 'number') {
        results.database = true
        results.details.database = `Connected (${queryResult.count} profiles)`
        logger.test('Database Health Check', 'PASS', { count: queryResult.count })
      } else {
        results.details.database = `Error: ${queryResult.error?.message}`
        logger.test('Database Health Check', 'FAIL', { error: queryResult.error?.message })
      }
    } catch (error) {
      results.details.database = `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      logger.test('Database Health Check', 'FAIL', {
        error: error instanceof Error ? error.message : 'Unknown',
      })
    }

    // Test Auth - Check if auth service is responsive
    try {
      const { error } = await supabase.auth.getSession()

      if (!error) {
        results.auth = true
        results.details.auth = 'Service available'
        logger.test('Auth Health Check', 'PASS')
      } else {
        results.details.auth = `Error: ${error.message}`
        logger.test('Auth Health Check', 'FAIL', { error: error.message })
      }
    } catch (error) {
      results.details.auth = `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      logger.test('Auth Health Check', 'FAIL', {
        error: error instanceof Error ? error.message : 'Unknown',
      })
    }

    // Test Storage - Check if storage buckets are accessible
    try {
      const { data, error } = await supabase.storage.listBuckets()

      if (!error && data) {
        results.storage = true
        results.details.storage = `${data.length} buckets available`
        logger.test('Storage Health Check', 'PASS', { bucketCount: data.length })
      } else {
        results.details.storage = `Error: ${error?.message}`
        logger.test('Storage Health Check', 'FAIL', { error: error?.message })
      }
    } catch (error) {
      results.details.storage = `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      logger.test('Storage Health Check', 'FAIL', {
        error: error instanceof Error ? error.message : 'Unknown',
      })
    }

    // Test Realtime - Check WebSocket connection
    try {
      const channel = supabase.channel('health-check')
      let realtimeSuccess = false

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Realtime connection timeout'))
        }, 5000)

        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            clearTimeout(timeout)
            realtimeSuccess = true
            resolve()
          }
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            clearTimeout(timeout)
            reject(new Error(`Realtime status: ${status}`))
          }
        })
      })

      if (realtimeSuccess) {
        results.realtime = true
        results.details.realtime = 'WebSocket connected'
        logger.test('Realtime Health Check', 'PASS')
      }

      await channel.unsubscribe()
    } catch (error) {
      results.details.realtime = `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      logger.test('Realtime Health Check', 'FAIL', {
        error: error instanceof Error ? error.message : 'Unknown',
      })
    }

    // Calculate overall status
    const healthyCount = Object.values(results).filter((v) => v === true).length
    let overall: 'healthy' | 'degraded' | 'down'

    if (healthyCount === 4) {
      overall = 'healthy'
    } else if (healthyCount >= 2) {
      overall = 'degraded'
    } else {
      overall = 'down'
    }

    const latency = Date.now() - startTime
    logger.performance.log('Service Health Check', latency, {
      healthyServices: healthyCount,
      overall,
    })

    return {
      ...results,
      overall,
      latency,
      lastCheck: new Date(),
    }
  } catch (error) {
    logger.error('Service health check failed', error as Error, { results })
    return {
      ...results,
      overall: 'down',
      latency: Date.now() - startTime,
      lastCheck: new Date(),
      details: {
        ...results.details,
        database: 'Check failed',
      },
    }
  }
}

/**
 * Quick connectivity test - lightweight version
 */
export async function quickConnectivityTest(): Promise<{
  success: boolean
  latency?: number
  error?: string
}> {
  const startTime = Date.now()

  try {
    const { error } = await supabase.from('profiles').select('count').limit(1).single()
    const latency = Date.now() - startTime

    if (error) {
      return {
        success: false,
        latency,
        error: error.message,
      }
    }

    return {
      success: true,
      latency,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Backend accessibility test via direct HTTP request
 */
export async function testBackendAccessibility(): Promise<{
  api: boolean
  auth: boolean
  storage: boolean
  realtime: boolean
  details: Record<string, string>
}> {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://akxmacfsltzhbnunoepb.supabase.co'
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const results = {
    api: false,
    auth: false,
    storage: false,
    realtime: false,
    details: {} as Record<string, string>,
  }

  try {
    // Test REST API
    const apiResponse = await fetch(`${baseUrl}/rest/v1/profiles?select=count&limit=1`, {
      headers: {
        apikey: anonKey || '',
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
    })
    results.api = apiResponse.ok
    results.details.api = `HTTP ${apiResponse.status}`
  } catch (error) {
    results.details.api = `Error: ${error instanceof Error ? error.message : 'Unknown'}`
  }

  try {
    // Test Auth endpoint
    const authResponse = await fetch(`${baseUrl}/auth/v1/health`, {
      headers: {
        apikey: anonKey || '',
      },
    })
    results.auth = authResponse.ok
    results.details.auth = `HTTP ${authResponse.status}`
  } catch (error) {
    results.details.auth = `Error: ${error instanceof Error ? error.message : 'Unknown'}`
  }

  try {
    // Test Storage API
    const storageResponse = await fetch(`${baseUrl}/storage/v1/bucket`, {
      headers: {
        apikey: anonKey || '',
        Authorization: `Bearer ${anonKey}`,
      },
    })
    results.storage = storageResponse.ok
    results.details.storage = `HTTP ${storageResponse.status}`
  } catch (error) {
    results.details.storage = `Error: ${error instanceof Error ? error.message : 'Unknown'}`
  }

  // Realtime test is handled by WebSocket, mark as not directly testable via HTTP
  results.realtime = false
  results.details.realtime = 'WebSocket test required'

  return results
}
