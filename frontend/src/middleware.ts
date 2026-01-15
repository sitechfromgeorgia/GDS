import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Initialize Supabase Client
  // This approach is required for Server Components to work with Cookies
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // 2. Performance Monitoring Start
  const start = performance.now()

  // 3. Auth Session Check (with graceful error handling)
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (error) {
    // Auth service unavailable - fail closed (redirect to login)
    console.error('[Middleware] Auth check failed:', error)
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('error', 'auth_unavailable')
    return NextResponse.redirect(redirectUrl)
  }

  // 4. Route Protection
  const path = request.nextUrl.pathname

  // Protect Dashboard Routes
  if (path.startsWith('/dashboard')) {
    if (!user) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      redirectUrl.searchParams.set('next', path)
      return NextResponse.redirect(redirectUrl)
    }

    // Role-based protection for Admin
    if (path.startsWith('/dashboard/admin')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/dashboard' // Or 403 page
        return NextResponse.redirect(redirectUrl)
      }
    }
  }

  // 5. Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')

  // 6. Performance Headers
  const end = performance.now()
  const duration = Math.round(end - start)
  response.headers.set('X-Response-Time', `${duration}ms`)

  return response
}

export const config = {
  // Use Node.js runtime instead of Edge Runtime to fix EvalError
  // Edge Runtime doesn't allow eval()/new Function() used by some dependencies
  // Node.js runtime is stable in Next.js 15.5+
  runtime: 'nodejs',
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api/health (health checks)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/health|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}


