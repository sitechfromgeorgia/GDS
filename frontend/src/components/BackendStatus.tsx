'use client'

import { useEffect, useState } from 'react'
import {
  checkBackendHealth,
  getBackendInfo,
  type HealthCheckResult,
} from '@/lib/healthCheck.client'
import { Badge } from '@/components/ui/badge'
import { Wifi, WifiOff, AlertCircle } from 'lucide-react'

export function BackendStatus() {
  const [health, setHealth] = useState<HealthCheckResult | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    const checkHealth = async () => {
      setIsChecking(true)
      const result = await checkBackendHealth()
      setHealth(result)
      setIsChecking(false)
    }

    checkHealth()
    const interval = setInterval(checkHealth, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [])

  if (!health && !isChecking) return null

  const backendInfo = getBackendInfo()
  const isHealthy = health?.status === 'healthy'

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white shadow-lg rounded-lg p-3 border">
        <div className="flex items-center gap-2">
          {isHealthy ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : health?.status === 'unhealthy' ? (
            <WifiOff className="h-4 w-4 text-red-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          )}

          <div className="text-xs">
            <div className="font-medium">Backend Status</div>
            <div className="text-muted-foreground">{backendInfo.url.replace('https://', '')}</div>
          </div>

          <Badge
            variant={isHealthy ? 'default' : 'destructive'}
            className={isHealthy ? 'bg-green-500' : ''}
          >
            {health?.latency ? `${health.latency}ms` : '...'}
          </Badge>
        </div>
      </div>
    </div>
  )
}
