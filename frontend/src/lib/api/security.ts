import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/server-auth'
import { compareCSRFTokens, extractCSRFTokenFromHeaders } from '@/lib/csrf-utils'
import { getCSRFCookie } from '@/lib/csrf-cookie'
import { validateRequestOrigin, requiresCSRFProtection } from '@/lib/csrf-origin-validation'

export type ApiValidationResult =
  | { valid: true; session: any; user: any }
  | { valid: false; response: NextResponse }

export async function validateApiRequest(
  request: NextRequest,
  options: { requireAuth?: boolean; requireCsrf?: boolean } = {
    requireAuth: true,
    requireCsrf: true,
  }
): Promise<ApiValidationResult> {
  // 1. CSRF Check (for mutation methods)
  if (options.requireCsrf && requiresCSRFProtection(request.method)) {
    // Validate Origin
    const originValidation = validateRequestOrigin(request)
    if (!originValidation.valid) {
      return {
        valid: false,
        response: NextResponse.json(
          { error: 'Invalid origin', reason: originValidation.reason },
          { status: 403 }
        ),
      }
    }

    // Validate Token
    const csrfToken = extractCSRFTokenFromHeaders(request.headers)
    const csrfCookie = getCSRFCookie(request)

    if (!csrfToken || !csrfCookie || !compareCSRFTokens(csrfToken, csrfCookie)) {
      return {
        valid: false,
        response: NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 }),
      }
    }
  }

  // 2. Auth Check
  if (options.requireAuth) {
    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return {
        valid: false,
        response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      }
    }

    return { valid: true, session, user: session.user }
  }

  return { valid: true, session: null, user: null }
}
