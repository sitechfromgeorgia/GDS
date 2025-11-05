// Georgian Distribution System Providers Setup
// Unified providers configuration for Georgian Distribution System

'use client'

import { QueryProvider } from '@/components/providers/QueryProvider'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { Toaster } from '@/components/ui/toaster'
import { GDSNetworkStatus, GDSErrorBoundary } from '@/lib/query/error-handling'
import { ThemeProvider } from 'next-themes'

// Georgian Distribution System Providers wrapper
export function Providers({
  children,
  enableNetworkStatus = true,
  enableErrorBoundary = true,
}: {
  children: React.ReactNode
  enableNetworkStatus?: boolean
  enableErrorBoundary?: boolean
}) {
  const providers = (
    <QueryProvider>
      <AuthProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </AuthProvider>
    </QueryProvider>
  )

  // Wrap with error boundary for Georgian Distribution System specific error handling
  if (enableErrorBoundary) {
    return <GDSErrorBoundary>{providers}</GDSErrorBoundary>
  }

  // Wrap with network status monitoring for Georgian infrastructure
  if (enableNetworkStatus) {
    return (
      <>
        {enableErrorBoundary && <GDSNetworkStatus />}
        {providers}
      </>
    )
  }

  return providers
}

// Georgian Distribution System Provider Configuration
export interface GDSProviderConfig {
  // Provider settings
  query: {
    enablePersistence: boolean
    enableDevtools: boolean
    networkMode: 'good' | 'poor' | 'offline'
  }
  auth: {
    enableAutoRefresh: boolean
    sessionTimeout: number // in minutes
  }
  error: {
    enableBoundary: boolean
    enableLogging: boolean
    enableNotifications: boolean
  }
  network: {
    enableStatusMonitoring: boolean
    retryStrategies: boolean
  }
}

// Default Georgian Distribution System provider configuration
export const GDS_PROVIDER_CONFIG: GDSProviderConfig = {
  query: {
    enablePersistence: process.env.NODE_ENV === 'production',
    enableDevtools: process.env.NODE_ENV === 'development',
    networkMode: 'good', // Will be detected automatically
  },
  auth: {
    enableAutoRefresh: true,
    sessionTimeout: 30, // 30 minutes
  },
  error: {
    enableBoundary: true,
    enableLogging: true,
    enableNotifications: true,
  },
  network: {
    enableStatusMonitoring: true,
    retryStrategies: true,
  },
}

// Georgian Distribution System Provider Factory
export function createGDSProviders(config: Partial<GDSProviderConfig> = {}) {
  const finalConfig = { ...GDS_PROVIDER_CONFIG, ...config }

  return function GDSProviders({ children }: { children: React.ReactNode }) {
    return (
      <Providers
        enableNetworkStatus={finalConfig.network.enableStatusMonitoring}
        enableErrorBoundary={finalConfig.error.enableBoundary}
      >
        {children}
      </Providers>
    )
  }
}

// Export default providers for Georgian Distribution System
export default Providers
