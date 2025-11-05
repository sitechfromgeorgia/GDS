'use client'

/**
 * Root Error Boundary
 *
 * Catches unhandled errors in the application and displays a user-friendly error page.
 * This component is automatically used by Next.js for the root layout.
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */

import { useEffect } from 'react'
import { logger } from '@/lib/logger'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to monitoring service
    logger.error('Application error occurred', error, {
      digest: error.digest,
      path: window.location.pathname,
    })
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">რაღაც შეცდომა მოხდა</CardTitle>
          <CardDescription>
            ბოდიში, მოხდა მოულოდნელი შეცდომა. გთხოვთ, სცადოთ თავიდან.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {process.env.NODE_ENV === 'development' && (
            <div className="rounded-md bg-muted p-4">
              <p className="text-sm font-mono text-muted-foreground break-all">{error.message}</p>
              {error.digest && (
                <p className="mt-2 text-xs text-muted-foreground">Error ID: {error.digest}</p>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button onClick={reset} className="flex-1" variant="default">
            <RefreshCw className="mr-2 h-4 w-4" />
            სცადე თავიდან
          </Button>
          <Button onClick={() => (window.location.href = '/')} variant="outline" className="flex-1">
            <Home className="mr-2 h-4 w-4" />
            მთავარი გვერდი
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
