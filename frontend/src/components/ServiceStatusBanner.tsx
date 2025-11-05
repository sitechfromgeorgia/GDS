'use client'
import { logger } from '@/lib/logger'

import { useState, useEffect } from 'react'
import { quickConnectivityTest } from '@/lib/service-health'

export function ServiceStatusBanner() {
  const [status, setStatus] = useState<'healthy' | 'degraded' | 'down'>('healthy')
  const [loading, setLoading] = useState(false)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  const checkStatus = async () => {
    setLoading(true)
    try {
      const result = await quickConnectivityTest()
      setStatus(result.success ? 'healthy' : 'down')
      setLastCheck(new Date())
    } catch (error) {
      logger.error('Service check failed:', error)
      setStatus('down')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkStatus()
    // Check status every 30 seconds
    const interval = setInterval(checkStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  // Don't show banner if everything is healthy
  if (status === 'healthy') {
    return null
  }

  const getBannerContent = () => {
    switch (status) {
      case 'degraded':
        return {
          className: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          title: '⚠️ Some services are experiencing issues',
          description: 'Functionality may be limited. Our team is working to restore full service.',
        }
      case 'down':
        return {
          className: 'bg-red-50 border-red-200 text-red-800',
          title: '🚨 Backend services are currently unavailable',
          description: "We're working to restore service. Some features may not work properly.",
        }
      default:
        return {
          className: 'bg-gray-50 border-gray-200 text-gray-800',
          title: 'Service status update',
          description: 'Checking service status...',
        }
    }
  }

  const content = getBannerContent()

  return (
    <div className={`p-3 border rounded-md mb-4 ${content.className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-medium">{content.title}</h3>
          <p className="text-sm mt-1">{content.description}</p>
          {lastCheck && (
            <p className="text-xs mt-1 opacity-75">Last check: {lastCheck.toLocaleTimeString()}</p>
          )}
        </div>
        <button
          onClick={checkStatus}
          disabled={loading}
          className="ml-4 px-3 py-1 text-sm border border-current rounded hover:bg-current hover:text-white transition-colors"
        >
          {loading ? 'Checking...' : 'Refresh'}
        </button>
      </div>
    </div>
  )
}
