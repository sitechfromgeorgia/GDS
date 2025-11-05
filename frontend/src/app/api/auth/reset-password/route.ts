// 🚫 API ROUTE DEPRECATED - SUPABASE OPTIMIZATION
//
// This API route has been REMOVED as it duplicated Supabase functionality.
//
// USE: Direct Supabase Auth instead:
// - supabase.auth.resetPasswordForEmail()
// - supabase.auth.updateUser()
//
// This endpoint is now handled natively by Supabase Auth with better performance,
// security, and reliability.
//
// 📖 Migration Guide:
// 1. For password reset: Use supabase.auth.resetPasswordForEmail(email, { redirectTo })
// 2. For password update: Use supabase.auth.updateUser({ password: newPassword })

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      error: 'API Deprecated',
      message: 'Use Supabase Auth password reset directly: supabase.auth.resetPasswordForEmail()',
      migration: {
        from: 'POST /api/auth/reset-password',
        to: 'supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl })',
        documentation: 'https://supabase.com/docs/guides/auth/auth-email',
      },
    },
    { status: 410 } // Gone
  )
}
