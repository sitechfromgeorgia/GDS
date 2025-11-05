'use client'
import { logger } from '@/lib/logger'

import { useState } from 'react'
import { ServiceStatusBanner } from '@/components/ServiceStatusBanner'
import { runVPSDiagnostics } from '@/lib/vps-connection-test'
import { testSupabaseConnection, testAuth } from '@/lib/testConnection'
import { quickConnectivityTest } from '@/lib/service-health'
import type { Session } from '@supabase/supabase-js'

interface TestData {
  count?: number
}

interface TestSuite {
  name: string
  summary: {
    passed: number
    total: number
    duration: number
  }
  tests: Array<{
    name: string
    success: boolean
    duration: number
    error?: string
    data?: unknown
  }>
}

interface DiagnosticResults {
  overall: 'success' | 'partial' | 'failure'
  summary: {
    passedTests: number
    totalTests: number
    totalDuration: number
  }
  suites?: TestSuite[]
  timestamp: Date
  environment?: string
}

interface TestResults {
  connection?: { success: boolean; error?: string; data?: TestData[] }
  auth?: { success: boolean; error?: string; session?: Session | null }
  diagnostics?: DiagnosticResults
  connectivity?: { success: boolean; latency?: number; error?: string }
}

export default function EnhancedTestPage() {
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<TestResults>({})
  const [diagnostics, setDiagnostics] = useState<DiagnosticResults | null>(null)

  const runEnhancedTests = async () => {
    setTesting(true)
    setResults({})
    setDiagnostics(null)

    // Test 1: Quick connectivity
    const connectivityResult = await quickConnectivityTest()
    setResults((prev) => ({ ...prev, connectivity: connectivityResult }))

    // Test 2: Basic connection

    const connectionResult = (await testSupabaseConnection()) as any
    setResults((prev) => ({ ...prev, connection: connectionResult }))

    // Test 3: Auth system
    await new Promise((resolve) => setTimeout(resolve, 500))

    const authResult = (await testAuth()) as any
    setResults((prev) => ({ ...prev, auth: authResult }))

    // Test 4: Comprehensive diagnostics
    try {
      const diagnosticResults = await runVPSDiagnostics()
      setDiagnostics(diagnosticResults)
    } catch (error) {
      logger.error('Diagnostics failed:', error)
    }

    setTesting(false)
  }

  const getOverallStatus = () => {
    const tests = [
      results.connectivity?.success,
      results.connection?.success,
      results.auth?.success,
    ].filter(Boolean)

    const passCount = tests.length
    const totalTests = 3

    if (passCount === totalTests) return 'success'
    if (passCount >= totalTests * 0.7) return 'partial'
    return 'failure'
  }

  const overallStatus = getOverallStatus()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">🔍 Enhanced Supabase VPS Connection Test</h1>
          <p className="text-muted-foreground">
            Comprehensive diagnostics for VPS Backend connectivity at data.greenland77.ge
          </p>
        </div>

        <ServiceStatusBanner />

        {/* Configuration Info */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="font-medium">Supabase URL:</span>
              <code className="block bg-gray-100 p-2 rounded mt-1 text-sm">
                {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not configured'}
              </code>
            </div>
            <div>
              <span className="font-medium">Environment:</span>
              <span className="block mt-1">{process.env.NODE_ENV || 'development'}</span>
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Diagnostic Tests</h2>
          <button
            onClick={runEnhancedTests}
            disabled={testing}
            className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {testing ? 'Running Tests...' : '🚀 Run Comprehensive Tests'}
          </button>
        </div>

        {/* Quick Test Results */}
        {results.connectivity && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Quick Connectivity Test</h3>
            <div className="flex items-center gap-3">
              <div
                className={`w-4 h-4 rounded-full ${results.connectivity.success ? 'bg-green-500' : 'bg-red-500'}`}
              />
              <span className="font-medium">
                {results.connectivity.success ? 'Connected' : 'Connection Failed'}
              </span>
              {results.connectivity.latency && (
                <span className="text-sm text-gray-600">({results.connectivity.latency}ms)</span>
              )}
              {results.connectivity.error && (
                <span className="text-sm text-red-600">Error: {results.connectivity.error}</span>
              )}
            </div>
          </div>
        )}

        {/* Basic Test Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Database Connection */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Database Connection</h3>
            {results.connection ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full ${results.connection.success ? 'bg-green-500' : 'bg-red-500'}`}
                  />
                  <span className="font-medium">
                    {results.connection.success ? 'Connected' : 'Failed'}
                  </span>
                </div>
                {results.connection.error && (
                  <p className="text-sm text-red-600">Error: {results.connection.error}</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500">Not tested</p>
            )}
          </div>

          {/* Authentication */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Authentication System</h3>
            {results.auth ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full ${results.auth.success ? 'bg-green-500' : 'bg-red-500'}`}
                  />
                  <span className="font-medium">{results.auth.success ? 'Working' : 'Failed'}</span>
                </div>
                {results.auth.error && (
                  <p className="text-sm text-red-600">Error: {results.auth.error}</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500">Not tested</p>
            )}
          </div>
        </div>

        {/* Comprehensive Diagnostics Results */}
        {diagnostics && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Comprehensive Diagnostics</h3>

            {/* Overall Status */}
            <div className="mb-6 p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${
                    diagnostics.overall === 'success'
                      ? 'bg-green-500'
                      : diagnostics.overall === 'partial'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                >
                  {diagnostics.overall === 'success'
                    ? '✓'
                    : diagnostics.overall === 'partial'
                      ? '!'
                      : '✗'}
                </div>
                <div>
                  <h4 className="font-semibold text-lg">
                    Overall Status: {diagnostics.overall.toUpperCase()}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {diagnostics.summary.passedTests} of {diagnostics.summary.totalTests} tests
                    passed ({diagnostics.summary.totalDuration}ms total)
                  </p>
                </div>
              </div>
            </div>

            {/* Test Suites */}
            <div className="space-y-4">
              {diagnostics.suites?.map((suite, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">
                    {suite.name} ({suite.summary.passed}/{suite.summary.total})
                  </h4>
                  <div className="space-y-2">
                    {suite.tests?.map((test, testIndex) => (
                      <div key={testIndex} className="flex items-center justify-between text-sm">
                        <span>{test.name}</span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              test.success
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {test.success ? 'PASS' : 'FAIL'}
                          </span>
                          <span className="text-gray-500">{test.duration}ms</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Overall Result Summary */}
        {overallStatus && (
          <div
            className={`p-6 rounded-lg border-2 ${
              overallStatus === 'success'
                ? 'bg-green-50 border-green-200'
                : overallStatus === 'partial'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-red-50 border-red-200'
            }`}
          >
            <h3 className="text-xl font-semibold mb-2">
              {overallStatus === 'success' && '✅ All Tests Passed!'}
              {overallStatus === 'partial' && '⚠️ Some Tests Failed'}
              {overallStatus === 'failure' && '❌ Multiple Test Failures'}
            </h3>
            <p className="mb-4">
              {overallStatus === 'success' &&
                'Frontend is successfully connected to VPS backend. You can proceed with normal operation.'}
              {overallStatus === 'partial' &&
                'Most functionality works, but some issues were detected. Check the details above for specific problems.'}
              {overallStatus === 'failure' &&
                'Critical connection issues detected. Check your configuration and VPS backend status.'}
            </p>

            {overallStatus === 'success' && (
              <div className="space-y-2 text-sm">
                <p>✅ Database connection established</p>
                <p>✅ Authentication system operational</p>
                <p>✅ API endpoints accessible</p>
                <p>✅ VPS backend responding</p>
              </div>
            )}

            {overallStatus !== 'success' && (
              <div className="space-y-2 text-sm">
                <p>🔧 Check environment variables in .env.local</p>
                <p>🔧 Verify VPS backend is running at data.greenland77.ge</p>
                <p>🔧 Ensure CORS configuration allows localhost:3000</p>
                <p>🔧 Verify JWT keys are properly configured</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
