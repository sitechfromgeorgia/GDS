/**
 * Health Check API Endpoint
 * Provides detailed service health status for monitoring and load balancers
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  uptime: number
  version: string
  services: {
    database: ServiceHealth
    auth: ServiceHealth
    storage: ServiceHealth
    api: ServiceHealth
  }
  checks: {
    memory: MemoryCheck
    environment: EnvironmentCheck
  }
}

interface ServiceHealth {
  status: 'up' | 'down' | 'degraded'
  latency?: number
  message?: string
}

interface MemoryCheck {
  used: number
  total: number
  percentage: number
}

interface EnvironmentCheck {
  nodeEnv: string
  configured: boolean
}

export async function GET() {
  const startTime = Date.now()

  try {
    // Check environment variables
    const envCheck: EnvironmentCheck = {
      nodeEnv: process.env.NODE_ENV || 'unknown',
      configured: Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ),
    }

    // Check memory usage
    const memUsage = process.memoryUsage()
    const memCheck: MemoryCheck = {
      used: Math.round(memUsage.heapUsed / 1024 / 1024),
      total: Math.round(memUsage.heapTotal / 1024 / 1024),
      percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
    }

    // Initialize service checks
    const services: HealthCheckResponse['services'] = {
      database: { status: 'down', message: 'Not checked' },
      auth: { status: 'down', message: 'Not checked' },
      storage: { status: 'down', message: 'Not checked' },
      api: { status: 'up', latency: Date.now() - startTime },
    }

    // Check database connectivity (use admin client to bypass RLS for health checks)
    try {
      const supabase = createAdminClient()
      const dbStart = Date.now()

      // Use a simpler query that doesn't require count
      const { data, error } = await supabase.from('profiles').select('id').limit(1)

      const dbLatency = Date.now() - dbStart

      if (!error) {
        services.database = {
          status: 'up',
          latency: dbLatency,
          message: `Connected - query successful (${data?.length ?? 0} rows)`,
        }
      } else {
        services.database = {
          status: 'down',
          message: error.message || `Error code: ${error.code}`,
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      services.database = {
        status: 'down',
        message: `Exception: ${errorMsg}`,
      }
    }

    // Check auth service (use admin client)
    try {
      const supabase = createAdminClient()
      const authStart = Date.now()
      const { error } = await supabase.auth.getSession()
      const authLatency = Date.now() - authStart

      services.auth = {
        status: error ? 'degraded' : 'up',
        latency: authLatency,
        message: error ? error.message : 'Service available',
      }
    } catch (error) {
      services.auth = {
        status: 'down',
        message: error instanceof Error ? error.message : 'Unknown error',
      }
    }

    // Check storage service (use admin client)
    try {
      const supabase = createAdminClient()
      const storageStart = Date.now()
      const { data, error } = await supabase.storage.listBuckets()
      const storageLatency = Date.now() - storageStart

      if (!error && data) {
        services.storage = {
          status: 'up',
          latency: storageLatency,
          message: `${data.length} buckets available`,
        }
      } else {
        services.storage = {
          status: 'down',
          message: error?.message || 'Unable to list buckets',
        }
      }
    } catch (error) {
      services.storage = {
        status: 'down',
        message: error instanceof Error ? error.message : 'Unknown error',
      }
    }

    // Determine overall health status
    const serviceStatuses = Object.values(services).map((s) => s.status)
    const upCount = serviceStatuses.filter((s) => s === 'up').length
    const downCount = serviceStatuses.filter((s) => s === 'down').length

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy'
    if (downCount === 0) {
      overallStatus = 'healthy'
    } else if (upCount >= 2) {
      overallStatus = 'degraded'
    } else {
      overallStatus = 'unhealthy'
    }

    const response: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      services,
      checks: {
        memory: memCheck,
        environment: envCheck,
      },
    }

    // Return appropriate HTTP status code
    const httpStatus = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 503 : 500

    return NextResponse.json(response, { status: httpStatus })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Health check failed',
      },
      { status: 500 }
    )
  }
}
