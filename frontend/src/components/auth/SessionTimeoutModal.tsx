'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface SessionTimeoutModalProps {
  isOpen: boolean
  onExtend: () => void
  onSignOut: () => void
  timeRemaining: number
}

export function SessionTimeoutModal({
  isOpen,
  onExtend,
  onSignOut,
  timeRemaining,
}: SessionTimeoutModalProps) {
  const [countdown, setCountdown] = useState(timeRemaining)

  useEffect(() => {
    if (!isOpen) return

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onSignOut()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen, onSignOut])

  useEffect(() => {
    setCountdown(timeRemaining)
  }, [timeRemaining])

  if (!isOpen) return null

  const minutes = Math.floor(countdown / 60)
  const seconds = countdown % 60

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>სესიის ვადა გასდის</CardTitle>
          <CardDescription>
            თქვენი სესია დასრულდება {minutes}:{seconds.toString().padStart(2, '0')} წუთში
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              გთხოვთ, გააგრძელოთ სესია ან გამოხვიდეთ სისტემიდან უსაფრთხოებისთვის.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button onClick={onSignOut} variant="outline" className="flex-1">
              გამოსვლა
            </Button>
            <Button onClick={onExtend} className="flex-1">
              გაგრძელება
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Simplified hook for session timeout management
export function useSessionTimeout() {
  const [showModal, setShowModal] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)

  const extendSession = () => {
    window.location.reload()
  }

  const handleSignOut = () => {
    // Simplified sign out
    window.location.href = '/'
  }

  const showTimeoutWarning = (remainingSeconds: number) => {
    setTimeRemaining(remainingSeconds)
    setShowModal(true)
  }

  const hideTimeoutWarning = () => {
    setShowModal(false)
  }

  return {
    showModal,
    timeRemaining,
    showTimeoutWarning,
    hideTimeoutWarning,
    extendSession,
    handleSignOut,
  }
}
