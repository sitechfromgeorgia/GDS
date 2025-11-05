'use client'

import { useState } from 'react'
import { testSupabaseConnection, testAuth } from '@/lib/testConnection'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

export default function TestPage() {
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<{
    connection?: { success: boolean; error?: string }
    auth?: { success: boolean; error?: string }
  }>({})

  const runTests = async () => {
    setTesting(true)
    setResults({})

    // Test connection

    const connectionResult = (await testSupabaseConnection()) as any
    setResults((prev) => ({ ...prev, connection: connectionResult }))

    // Test auth
    await new Promise((resolve) => setTimeout(resolve, 500))

    const authResult = (await testAuth()) as any
    setResults((prev) => ({ ...prev, auth: authResult }))

    setTesting(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Supabase Connection Test</h1>
          <p className="text-muted-foreground">ტესტირება VPS Backend-თან კავშირის</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>მიმდინარე კონფიგურაცია</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Supabase URL:</span>
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set'}
              </code>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Anon Key:</span>
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
                  ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...`
                  : 'Not set'}
              </code>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tests</CardTitle>
            <CardDescription>გაუშვით ტესტები კავშირის შესამოწმებლად</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={runTests} disabled={testing} className="w-full">
              {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {testing ? 'ტესტირება...' : 'ტესტების გაშვება'}
            </Button>

            {results.connection && (
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Database Connection</span>
                  {results.connection.success ? (
                    <Badge className="bg-green-500">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      წარმატებული
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="mr-1 h-3 w-3" />
                      წარუმატებელი
                    </Badge>
                  )}
                </div>
                {results.connection.error && (
                  <p className="text-sm text-red-600 mt-2">Error: {results.connection.error}</p>
                )}
              </div>
            )}

            {results.auth && (
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Authentication System</span>
                  {results.auth.success ? (
                    <Badge className="bg-green-500">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      მუშაობს
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="mr-1 h-3 w-3" />
                      არ მუშაობს
                    </Badge>
                  )}
                </div>
                {results.auth.error && (
                  <p className="text-sm text-red-600 mt-2">Error: {results.auth.error}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {results.connection?.success && results.auth?.success && (
          <Card className="border-green-500 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-700">✅ ყველაფერი მუშაობს!</CardTitle>
              <CardDescription>
                Frontend წარმატებით არის დაკავშირებული VPS Backend-თან
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>✓ Database connection established</p>
                <p>✓ Authentication system ready</p>
                <p>✓ API endpoints accessible</p>
                <p className="mt-4 font-medium">შეგიძლიათ დაიწყოთ მუშაობა მთავარ აპლიკაციაზე!</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
