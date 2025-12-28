'use client'
import { logger } from '@/lib/logger'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createBrowserClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const router = useRouter()
  const { signIn } = useAuth()

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const [logs, setLogs] = useState<string[]>([])

  const addLog = (msg: string) =>
    setLogs((prev) => [...prev, `${new Date().toISOString().split('T')[1]} ${msg}`])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setEmailError('')
    setPasswordError('')
    setLogs([])
    addLog('Submit started')

    // Validation
    let hasErrors = false

    if (!email.trim()) {
      setEmailError('ელ. ფოსტა აუცილებელია')
      hasErrors = true
    } else if (!validateEmail(email)) {
      setEmailError('გთხოვთ შეიყვანოთ სწორი ელ. ფოსტა')
      hasErrors = true
    }

    if (!password.trim()) {
      setPasswordError('პაროლი აუცილებელია')
      hasErrors = true
    } else if (password.length < 6) {
      setPasswordError('პაროლი უნდა იყოს მინიმუმ 6 სიმბოლო')
      hasErrors = true
    }

    if (hasErrors) {
      addLog('Validation failed')
      setLoading(false)
      return
    }

    try {
      // Attempt to sign in with Supabase
      addLog('Calling signIn...')

      const supabase = createBrowserClient() // Create client once here

      const isDev = process.env.NODE_ENV === 'development'

      const testEmails = [
        'test-restaurant-browser@example.com',
        'test-driver-browser@example.com',
        'test-admin-browser@example.com',
      ]

      if (testEmails.includes(email)) {
        addLog('Using Test Login API (Dev/Test User)...')
        const res = await fetch('/api/auth/test-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Test login failed')
        addLog('Test login API success')

        if (data.session) {
          // NOTE: We do NOT call setSession for test users because the mock token
          // is not a valid JWT and will throw an 'Invalid JWT structure' error.
          // Instead, we rely on the TEST_AUTH_BYPASS cookie (handled in middleware)
          // and the local zustand store update below.
          addLog('Skipping supabase.auth.setSession for test user (using cookie bypass)')
          /*
          addLog('Setting session manually...')
          const { error: setSessionError } = await supabase.auth.setSession(data.session)
          if (setSessionError) addLog(`SetSession error: ${setSessionError.message}`)
          else addLog('SetSession success')
          */

          // Manually set bypass cookie removed to rely on API response
          addLog(`Bypass cookie should be set by API for ${email}`)

          // Update global auth store to reflect logged-in state immediately
          // This is crucial because auth-init might have already run and won't re-check
          const { setUser, setProfile, setSessionInfo } = useAuthStore.getState()

          const sessionUser = data.session.user
          const role = sessionUser.user_metadata?.role || 'restaurant'

          const mockUser = {
            id:
              role === 'restaurant'
                ? '00000000-0000-0000-0000-000000000001'
                : role === 'driver'
                  ? '00000000-0000-0000-0000-000000000002'
                  : '00000000-0000-0000-0000-000000000003',
            email: email,
            role: 'authenticated',
            app_metadata: { provider: 'email' },
            user_metadata: { role: role },
            aud: 'authenticated',
            created_at: new Date().toISOString(),
          }

          setUser(mockUser as any)

          setProfile({
            id: mockUser.id,
            role: role,
            full_name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
            email: email,
            restaurant_name: null,
            phone: null,
            address: null,
            google_maps_link: null,
            base_salary: 0,
            per_delivery_rate: 0,
            bonus_amount: 0,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

          setSessionInfo({
            lastActivity: Date.now(),
            expiresAt: Date.now() + 3600 * 1000,
            deviceId: 'mock-device-id',
          })
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }

      addLog('signIn returned')

      // Set Remember Me preference
      if (rememberMe) {
        // Remember for 30 days
        localStorage.setItem('remember-me', 'true')
        document.cookie = `remember-me=true; max-age=${30 * 24 * 60 * 60}; path=/; SameSite=Lax`
      } else {
        // Session expires when browser closes
        localStorage.setItem('remember-me', 'false')
        document.cookie = `remember-me=false; path=/; SameSite=Lax`
      }

      // Wait for session to be persisted in cookies (prevent race condition)
      // This ensures middleware can read the session when we redirect
      addLog('Waiting for cookie persistence...')
      await new Promise((resolve) => setTimeout(resolve, 1000))
      addLog(`Cookies: ${document.cookie}`)

      // Verify session is readable before redirecting
      addLog('Verifying session...')
      // Reuse the same client instance
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (!testEmails.includes(email)) {
        if (sessionError) {
          addLog(`Session error: ${sessionError.message}`)
        }
        if (!session) {
          addLog('No session found')
        }

        if (sessionError || !session) {
          throw new Error('Session verification failed. Please try again.')
        }
      } else {
        addLog('Skipping strict session check for test user')
      }

      addLog('Session verified. Redirecting...')

      // Force router to refresh middleware check
      router.refresh()

      // Now safe to redirect
      router.push('/dashboard')
      addLog('Redirect called')
    } catch (err: any) {
      logger.error('Login error:', err)
      addLog(`Catch: ${err.message}`)
      setError(err.message || 'შესვლისას მოხდა შეცდომა')
    } finally {
      setLoading(false)
      addLog('Finally block')
    }
  }

  const handleForgotPassword = async () => {
    try {
      // For now, redirect to the welcome page or show a message
      router.push('/welcome?forgot=true')
    } catch (err) {
      logger.error('Password reset error:', err)
      setError('პაროლის აღდგენის დროს მოხდა შეცდომა')
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>რეგისტრაცია</CardTitle>
        <CardDescription>შეიყვანეთ თქვენი მონაცემები სისტემაში შესასვლელად</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">ელ. ფოსტა</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="your@email.com"
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? 'email-error' : undefined}
              className={emailError ? 'border-destructive' : ''}
            />
            {emailError && (
              <p id="email-error" className="text-sm text-destructive">
                {emailError}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">პაროლი</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="შეიყვანეთ პაროლი"
              aria-invalid={Boolean(passwordError)}
              aria-describedby={passwordError ? 'password-error' : undefined}
              className={passwordError ? 'border-destructive' : ''}
            />
            {passwordError && (
              <p id="password-error" className="text-sm text-destructive">
                {passwordError}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember-me"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              disabled={loading}
            />
            <Label htmlFor="remember-me" className="text-sm font-normal cursor-pointer">
              დამიმახსოვრე 30 დღის განმავლობაში
            </Label>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="bg-gray-100 p-2 text-xs font-mono border rounded mt-4 h-32 overflow-auto">
            <p>Debug Log:</p>
            {logs.map((log, i) => (
              <p key={i}>{log}</p>
            ))}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                მიმდინარეობს...
              </>
            ) : (
              'შესვლა'
            )}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Button
            type="button"
            variant="link"
            onClick={handleForgotPassword}
            className="text-sm"
            aria-label="დაგავიწყდათ პაროლი? გახსენით პაროლის აღდგენის ფორმა"
          >
            დაგავიწყდათ პაროლი?
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
