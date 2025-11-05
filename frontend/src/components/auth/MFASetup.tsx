'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createBrowserClient } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { QRCodeSVG } from 'qrcode.react'

// Create Supabase client instance
const supabase = createBrowserClient()

interface MFASetupProps {
  onComplete: () => void
  onCancel: () => void
}

export function MFASetup({ onComplete, onCancel }: MFASetupProps) {
  const [step, setStep] = useState<'enroll' | 'verify'>('enroll')
  const [qrCode, setQrCode] = useState<string>('')
  const [secret, setSecret] = useState<string>('')
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    if (step === 'enroll') {
      enrollMFA()
    }
  }, [step])

  const enrollMFA = async () => {
    if (!user) return

    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      })

      if (error) throw error

      if (data.totp) {
        setQrCode(data.totp.uri)
        setSecret(data.totp.secret)
      } else {
        throw new Error('TOTP data not returned')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enroll MFA')
    } finally {
      setLoading(false)
    }
  }

  const verifyMFA = async () => {
    if (!user || !verificationCode) return

    setLoading(true)
    setError('')

    try {
      // First, get the enrolled factors to find the factor ID
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors()

      if (factorsError) throw factorsError

      const totpFactor = factors.totp[0] // Get the first TOTP factor

      if (!totpFactor) {
        throw new Error('No TOTP factor found')
      }

      // Challenge the factor first
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id,
      })

      if (challengeError) throw challengeError

      // Then verify with the challenge
      const { data, error } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challenge.id,
        code: verificationCode,
      })

      if (error) throw error

      // MFA setup successful
      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify MFA code')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (step === 'enroll') {
      setStep('verify')
    } else {
      verifyMFA()
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>ორმაგი ავტორიზაცია</CardTitle>
        <CardDescription>
          {step === 'enroll'
            ? 'დააყენეთ ავტორიზაციის აპი თქვენს ტელეფონზე'
            : 'შეიყვანეთ კოდი ავტორიზაციის აპიდან'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 'enroll' && qrCode && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <QRCodeSVG value={qrCode} size={200} />
              </div>
              <Alert>
                <AlertDescription>
                  დაასკანერეთ QR კოდი თქვენს ავტორიზაციის აპში (Google Authenticator, Authy,
                  1Password და სხვ.)
                </AlertDescription>
              </Alert>
              <div className="text-sm text-gray-600">
                <p>ან შეიყვანეთ საიდუმლო კოდი ხელით:</p>
                <code className="bg-gray-100 px-2 py-1 rounded text-xs break-all">{secret}</code>
              </div>
            </div>
          )}

          {step === 'verify' && (
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
          )}

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
            <Button
              type="submit"
              disabled={loading || (step === 'verify' && !verificationCode)}
              className="flex-1"
            >
              {loading ? 'იტვირთება...' : step === 'enroll' ? 'შემდეგი' : 'დადასტურება'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
