import { createClient } from '@/lib/auth/server-auth'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    // Mock login for test users in development
    const testUsers = {
      'test-restaurant-browser@example.com': 'restaurant',
      'test-driver-browser@example.com': 'driver',
      'test-admin-browser@example.com': 'admin',
    }

    if (process.env.NODE_ENV === 'development' && email in testUsers) {
      const role = testUsers[email as keyof typeof testUsers]
      const mockSession = {
        access_token: `mock-access-token-${role}`,
        refresh_token: `mock-refresh-token-${role}`,
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: `test-${role}-id`,
          email: email,
          role: 'authenticated',
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          user_metadata: { role: role },
        },
      }

      const response = NextResponse.json({ success: true, session: mockSession })
      // Set the cookie value to the role name instead of just 'true'
      // Remove httpOnly to allow client-side verification and potential fallback
      response.cookies.set('TEST_AUTH_BYPASS', role, { httpOnly: false, path: '/' })
      return response
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json({ success: true, session: data.session })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
