'use client'
<<<<<<< HEAD
import { logger } from '@/lib/logger'
=======
>>>>>>> 4f46816d3369e63516557dedd905a7027f3ba306

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setEmailError('')
    setPasswordError('')

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
      setLoading(false)
      return
    }

    try {
      // Attempt to sign in with Supabase
      await signIn(email, password)
      
      // Redirect to dashboard on successful login
      router.push('/dashboard')
    } catch (err: any) {
<<<<<<< HEAD
      logger.error('Login error:', err)
=======
      console.error('Login error:', err)
>>>>>>> 4f46816d3369e63516557dedd905a7027f3ba306
      setError(err.message || 'შესვლისას მოხდა შეცდომა')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    try {
      // For now, redirect to the welcome page or show a message
      router.push('/welcome?forgot=true')
    } catch (err) {
<<<<<<< HEAD
      logger.error('Password reset error:', err)
=======
      console.error('Password reset error:', err)
>>>>>>> 4f46816d3369e63516557dedd905a7027f3ba306
      setError('პაროლის აღდგენის დროს მოხდა შეცდომა')
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>რეგისტრაცია</CardTitle>
        <CardDescription>
          შეიყვანეთ თქვენი მონაცემები სისტემაში შესასვლელად
        </CardDescription>
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
              aria-invalid={!!emailError}
              aria-describedby={emailError ? "email-error" : undefined}
              className={emailError ? "border-destructive" : ""}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="შეიყვანეთ პაროლი"
              aria-invalid={!!passwordError}
              aria-describedby={passwordError ? "password-error" : undefined}
              className={passwordError ? "border-destructive" : ""}
            />
            {passwordError && (
              <p id="password-error" className="text-sm text-destructive">
                {passwordError}
              </p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

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