'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring'
import { getPerformanceMonitor, CoreWebVitals } from '@/lib/performance-monitoring'

interface PerformanceContextType {
  isEnabled: boolean
  togglePerformanceMonitoring: () => void
  getCoreWebVitals: () => CoreWebVitals | null
  getPerformanceSummary: () => {
    avgLoadTime: number
    avgResourceLoadTime: number
    avgFID: number
    avgLCP: number
    totalInteractions: number
    totalErrors: number
  }
  sendPerformanceData: (endpoint?: string) => Promise<void>
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined)

export const PerformanceProvider = ({ children }: { children: ReactNode }) => {
  const [isEnabled, setIsEnabled] = useState(true)
  const { getCoreWebVitals, getPerformanceSummary, sendPerformanceData } =
    usePerformanceMonitoring()

  const togglePerformanceMonitoring = () => {
    setIsEnabled(!isEnabled)
    if (isEnabled) {
      getPerformanceMonitor().disable()
    } else {
      getPerformanceMonitor().enable()
    }
  }

  // Initialize performance monitoring
  useEffect(() => {
    if (isEnabled) {
      getPerformanceMonitor().enable()
    }

    // Cleanup on unmount
    return () => {
      getPerformanceMonitor().disable()
    }
  }, [isEnabled])

  return (
    <PerformanceContext.Provider
      value={{
        isEnabled,
        togglePerformanceMonitoring,
        getCoreWebVitals,
        getPerformanceSummary,
        sendPerformanceData,
      }}
    >
      {children}
    </PerformanceContext.Provider>
  )
}

export const usePerformance = () => {
  const context = useContext(PerformanceContext)
  if (context === undefined) {
    throw new Error('usePerformance must be used within a PerformanceProvider')
  }
  return context
}
