'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createBrowserClient } from '@/lib/supabase'
import { AuthSecurity } from '@/lib/security'

// Create Supabase client instance
const supabase = createBrowserClient()

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check if we have the required tokens in URL
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')

    if (!accessToken || !refreshToken) {
      setError('Invalid reset link. Please request a new password reset.')
      return
    }

    // Set the session with the tokens from URL
    supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
  }, [searchParams])

  const validatePasswords = () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return false
    }

    const validation = AuthSecurity.validatePasswordStrength(password)
    if (!validation.valid) {
      setError(validation.errors.join(', '))
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!validatePasswords()) {
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) throw error

      setSuccess(true)

      // Redirect to login after a delay
      setTimeout(() => {
        router.push('/')
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>პაროლი წარმატებით შეიცვალა</CardTitle>
            <CardDescription>
              თქვენი პაროლი წარმატებით განახლდა. მალე გადამისამართდებით ავტორიზაციის გვერდზე.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                გთხოვთ, დაიმახსოვრეთ თქვენი ახალი პაროლი უსაფრთხოებისთვის.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>ახალი პაროლის დაყენება</CardTitle>
          <CardDescription>შეიყვანეთ თქვენი ახალი პაროლი</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">ახალი პაროლი</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={8}
              />
              <p className="text-sm text-gray-600 mt-1">
                პაროლი უნდა შეიცავდეს მინიმუმ 8 სიმბოლოს, დიდ და პატარა ასოებს, ციფრებს და სპეციალურ
                სიმბოლოს
              </p>
            </div>

            <div>
              <Label htmlFor="confirmPassword">დაადასტურეთ პაროლი</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                minLength={8}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'მიმდინარეობს...' : 'პაროლის განახლება'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
