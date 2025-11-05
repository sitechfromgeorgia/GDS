'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createBrowserClient } from '@/lib/supabase'

// Create Supabase client instance
const supabase = createBrowserClient()

interface PasswordResetFormProps {
  onBack: () => void
}

export function PasswordResetForm({ onBack }: PasswordResetFormProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>შეამოწმეთ ელ. ფოსტა</CardTitle>
          <CardDescription>გამოგიგზავნეთ პაროლის აღდგენის ბმული თქვენს ელ. ფოსტაზე</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              თუ ეს ელ. ფოსტა დარეგისტრირებულია, მიიღებთ პაროლის აღდგენის ბმულს.
            </AlertDescription>
          </Alert>
          <Button onClick={onBack} className="w-full mt-4">
            უკან დაბრუნება
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>პაროლის აღდგენა</CardTitle>
        <CardDescription>შეიყვანეთ თქვენი ელ. ფოსტა პაროლის აღსადგენად</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">ელ. ფოსტა</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
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
              onClick={onBack}
              disabled={loading}
              className="flex-1"
            >
              უკან
            </Button>
            <Button type="submit" disabled={loading || !email} className="flex-1">
              {loading ? 'მიმდინარეობს...' : 'გაგზავნა'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
