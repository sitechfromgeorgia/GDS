import { createBrowserClient } from '@/lib/supabase'

const supabase = createBrowserClient()

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'unknown'
  checks: {
    database: boolean
    auth: boolean
    storage: boolean
    realtime: boolean
  }
  latency?: number
  error?: string
}

export async function checkBackendHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now()
  const checks = {
    database: false,
    auth: false,
    storage: false,
    realtime: false,
  }

  try {
    // Check Database
    try {
      const { error } = await supabase.from('profiles').select('count').limit(1)
      checks.database = !error
    } catch {
      checks.database = false
    }

    // Check Auth
    try {
      const { error } = await supabase.auth.getSession()
      checks.auth = !error
    } catch {
      checks.auth = false
    }

    // Check Storage (just verify the endpoint is accessible)
    try {
      const { data } = await supabase.storage.listBuckets()
      checks.storage = data !== null
    } catch {
      checks.storage = false
    }

    // Check Realtime (verify channel can be created)
    try {
      const channel = supabase.channel('health-check')
      checks.realtime = channel !== null
      await channel.unsubscribe()
    } catch {
      checks.realtime = false
    }

    const latency = Date.now() - startTime
    const allHealthy = Object.values(checks).every((check) => check === true)

    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      checks,
      latency,
    }
  } catch (error) {
    return {
      status: 'unknown',
      checks,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export function getBackendInfo() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not configured',
    hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    hasServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    environment: process.env.NODE_ENV || 'unknown',
  }
}
