// 🚫 API ROUTE DEPRECATED - SUPABASE OPTIMIZATION
//
// This API route has been REMOVED as it duplicated Supabase functionality.
//
// USE: Direct Supabase Auth MFA instead:
// - supabase.auth.mfa.enroll()
// - supabase.auth.mfa.challenge()
// - supabase.auth.mfa.verify()
//
// This endpoint is now handled natively by Supabase Auth with better performance,
// security, and reliability.
//
// 📖 Migration Guide:
// 1. Use supabase.auth.mfa.enroll({ factorType: 'totp' })
// 2. Use supabase.auth.mfa.challenge({ factorId: 'factor-id' })
// 3. Use supabase.auth.mfa.verify({ factorId: 'factor-id', challengeId: 'challenge-id', code: '123456' })

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      error: 'API Deprecated',
      message: 'Use Supabase Auth MFA directly: supabase.auth.mfa.enroll()',
      migration: {
        from: 'GET /api/auth/mfa/setup',
        to: 'supabase.auth.mfa.enroll({ factorType: "totp" })',
        documentation: 'https://supabase.com/docs/guides/auth/auth-mfa',
      },
    },
    { status: 410 } // Gone
  )
}
