'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase'

const supabase = createBrowserClient()

export default function DiagnosticPage() {
  const [results, setResults] = useState({
    envVars: false,
    supabaseConnection: false,
    databaseAccess: false,
    authService: false,
    error: null as string | null,
  })

  useEffect(() => {
    async function runDiagnostics() {
      const newResults = { ...results }

      // Check environment variables
      newResults.envVars = !!(
        process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )

      try {
        // Check Supabase connection
        const { data, error } = await supabase.from('profiles').select('count').limit(1)

        if (error) {
          newResults.error = error.message
          newResults.supabaseConnection = false
          newResults.databaseAccess = false
        } else {
          newResults.supabaseConnection = true
          newResults.databaseAccess = true
        }

        // Check auth service
        const { data: session } = await supabase.auth.getSession()
        newResults.authService = true
      } catch (err: any) {
        newResults.error = err.message
        newResults.supabaseConnection = false
      }

      setResults(newResults)
    }

    runDiagnostics()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔧 System Diagnostics</h1>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <DiagnosticItem
            label="Environment Variables Loaded"
            status={results.envVars}
            detail={`URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30)}...`}
          />

          <DiagnosticItem
            label="Supabase Connection"
            status={results.supabaseConnection}
            detail={results.error || 'Connected successfully'}
          />

          <DiagnosticItem
            label="Database Access (RLS)"
            status={results.databaseAccess}
            detail={results.error || 'Can query database'}
          />

          <DiagnosticItem
            label="Auth Service"
            status={results.authService}
            detail="Auth API responding"
          />

          {results.error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded">
              <h3 className="font-semibold text-red-800 mb-2">Error Details:</h3>
              <pre className="text-sm text-red-700 whitespace-pre-wrap">{results.error}</pre>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
            <h3 className="font-semibold text-blue-800 mb-2">Configuration:</h3>
            <pre className="text-xs text-blue-700">
              {`NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 50)}...
Environment: ${process.env.NEXT_PUBLIC_ENVIRONMENT}
Node ENV: ${process.env.NODE_ENV}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}

function DiagnosticItem({
  label,
  status,
  detail,
}: {
  label: string
  status: boolean | null
  detail?: string
}) {
  return (
    <div className="flex items-start gap-4 p-4 border rounded">
      <div className="text-2xl">{status === null ? '⏳' : status ? '✅' : '❌'}</div>
      <div className="flex-1">
        <div className="font-semibold">{label}</div>
        {detail && <div className="text-sm text-gray-600 mt-1">{detail}</div>}
      </div>
    </div>
  )
}
