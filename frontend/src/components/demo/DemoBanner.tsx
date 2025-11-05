'use client'

import { useDemo } from '@/hooks/useDemo'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Info, Zap } from 'lucide-react'

export function DemoBanner() {
  const { session, sessionTimeRemaining, extendSession } = useDemo()

  if (!session) return null

  const timeMs = sessionTimeRemaining ?? 0
  const timeRemaining = Math.ceil(timeMs / (1000 * 60 * 60)) // hours
  const isExpiringSoon = timeRemaining <= 2

  return (
    <Alert
      className={`border-l-4 ${isExpiringSoon ? 'border-orange-500 bg-orange-50' : 'border-blue-500 bg-blue-50'}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isExpiringSoon ? (
            <Clock className="h-5 w-5 text-orange-600" />
          ) : (
            <Info className="h-5 w-5 text-blue-600" />
          )}

          <AlertDescription className="flex items-center gap-4">
            <div>
              <span className="font-semibold">Demo Mode Active</span>
              <span className="mx-2">•</span>
              <span>{timeRemaining} hours remaining</span>
              {isExpiringSoon && (
                <>
                  <span className="mx-2">•</span>
                  <Badge variant="destructive" className="text-xs">
                    Expires Soon
                  </Badge>
                </>
              )}
            </div>
          </AlertDescription>
        </div>

        <div className="flex items-center gap-2">
          {isExpiringSoon && (
            <Button
              size="sm"
              variant="outline"
              onClick={extendSession}
              className="flex items-center gap-1"
            >
              <Zap className="h-3 w-3" />
              Extend Demo
            </Button>
          )}

          <Badge variant="outline" className="text-xs">
            Session: {session.id.slice(-8)}
          </Badge>
        </div>
      </div>
    </Alert>
  )
}
