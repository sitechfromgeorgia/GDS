'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createBrowserClient } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

// Create Supabase client instance
const supabase = createBrowserClient()

interface MFAVerificationProps {
  onComplete: () => void
  onCancel: () => void
}

export function MFAVerification({ onComplete, onCancel }: MFAVerificationProps) {
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { user } = useAuth()

  const verifyMFA = async () => {
    if (!user || !verificationCode) return

    setLoading(true)
    setError('')

    try {
      // Get the enrolled factors
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors()

      if (factorsError) throw factorsError

      const totpFactor = factors.totp[0] // Get the first TOTP factor

      if (!totpFactor) {
        throw new Error('No TOTP factor found')
      }

      // Challenge the factor
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id,
      })

      if (challengeError) throw challengeError

      // Verify the code
      const { data, error } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challenge.id,
        code: verificationCode,
      })

      if (error) throw error

      // MFA verification successful
      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify MFA code')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    verifyMFA()
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>ორმაგი ავტორიზაცია</CardTitle>
        <CardDescription>შეიყვანეთ კოდი თქვენი ავტორიზაციის აპიდან</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="code">დამადასტურებელი კოდი</Label>
            <Input
              id="code"
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="000000"
              maxLength={6}
              required
              disabled={loading}
            />
            <p className="text-sm text-gray-600 mt-1">
              შეიყვანეთ 6-ციფრიანი კოდი თქვენი ავტორიზაციის აპიდან
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="flex-1"
            >
              გაუქმება
            </Button>
            <Button type="submit" disabled={loading || !verificationCode} className="flex-1">
              {loading ? 'მიმდინარეობს...' : 'დადასტურება'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
