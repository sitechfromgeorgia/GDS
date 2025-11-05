'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { createBrowserClient } from '@/lib/supabase'

// Georgian Distribution System specific query configuration
const georgianQueryConfig = {
  defaultOptions: {
    queries: {
      // Georgian-specific cache times
      staleTime: 1000 * 60 * 2, // 2 minutes - faster for Georgian data
      gcTime: 1000 * 60 * 30, // 30 minutes - Georgian users may have slower connections
      retry: (failureCount: number, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as any).status
          if (status >= 400 && status < 500) {
            return false
          }
        }
        // Retry up to 3 times for network errors
        return failureCount < 3
      },
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true as boolean | ((query: any) => boolean | 'always'),
      // Georgian-specific error handling
      meta: {
        errorMessage: {
          ka: 'მონაცემების ჩატვირთვის შეცდომა',
          en: 'Data loading error',
        },
      },
    },
    mutations: {
      retry: 1,
      // Georgian-specific mutation settings
      meta: {
        errorMessage: {
          ka: 'ოპერაციის შესრულების შეცდომა',
          en: 'Operation execution error',
        },
      },
    },
  },
}

// Create QueryClient with Georgian Distribution System settings
function createQueryClient() {
  const client = new QueryClient(georgianQueryConfig)
  return client
}

// Main QueryProvider Component
export function QueryProvider({
  children,
  enableDevtools = false,
  enablePersistence = true,
}: {
  children: React.ReactNode
  enableDevtools?: boolean
  enablePersistence?: boolean
}) {
  const [queryClient] = useState(() => createQueryClient())

  // Initialize Supabase real-time integration with React Query
  const initializeRealTimeIntegration = () => {
    const supabase = createBrowserClient()

    // Set up real-time query invalidation
    queryClient.setDefaultOptions({
      queries: {
        ...queryClient.getDefaultOptions().queries,
        // Configure real-time updates
        refetchOnMount: (query: any) => {
          // Only refetch if data is stale and we're not offline
          if (navigator.onLine && query.state.dataUpdatedAt) {
            const timeSinceLastUpdate = Date.now() - query.state.dataUpdatedAt
            return timeSinceLastUpdate > georgianQueryConfig.defaultOptions.queries.staleTime!
          }
          return false
        },
      },
    })

    return supabase
  }

  // Initialize on mount
  useState(() => {
    initializeRealTimeIntegration()
  })

  // Georgian Distribution System specific providers
  const providers = <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>

  return providers
}

// Query utility for Georgian Distribution System
export const gdsQueryUtils = {
  // Georgian-specific query key factory
  makeKey: (entity: string, id?: string, filters?: Record<string, any>) => {
    const key = ['gds', entity]
    if (id) key.push(id)
    if (filters) {
      Object.keys(filters)
        .sort()
        .forEach((k) => {
          key.push(`${k}:${JSON.stringify(filters[k])}`)
        })
    }
    return key
  },

  // Georgian-specific stale time calculator
  calculateStaleTime: (entityType: 'orders' | 'products' | 'users' | 'analytics') => {
    const baseTimes: Record<string, number> = {
      orders: 1000 * 60 * 1, // 1 minute - orders change frequently
      products: 1000 * 60 * 5, // 5 minutes - products change less often
      users: 1000 * 60 * 10, // 10 minutes - users change rarely
      analytics: 1000 * 60 * 2, // 2 minutes - analytics should be relatively fresh
    }
    return baseTimes[entityType] || georgianQueryConfig.defaultOptions.queries.staleTime!
  },

  // Georgian-specific cache keys
  cacheKeys: {
    orders: 'gds-orders',
    products: 'gds-products',
    users: 'gds-users',
    analytics: 'gds-analytics',
    profiles: 'gds-profiles',
  },
}

export default QueryProvider
