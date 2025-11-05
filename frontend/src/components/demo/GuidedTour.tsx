'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, ChevronLeft, ChevronRight, SkipForward } from 'lucide-react'
import { type DemoTourStep } from '@/types/demo'

interface GuidedTourProps {
  step: DemoTourStep
  onNext: () => void
  onPrevious: () => void
  onSkip: () => void
}

export function GuidedTour({ step, onNext, onPrevious, onSkip }: GuidedTourProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [step.id])

  const getPlacementStyles = (placement: string) => {
    const baseStyles = 'absolute z-50 w-80'

    switch (placement) {
      case 'top':
        return `${baseStyles} bottom-full left-1/2 transform -translate-x-1/2 mb-2`
      case 'bottom':
        return `${baseStyles} top-full left-1/2 transform -translate-x-1/2 mt-2`
      case 'left':
        return `${baseStyles} right-full top-1/2 transform -translate-y-1/2 mr-2`
      case 'right':
        return `${baseStyles} left-full top-1/2 transform -translate-y-1/2 ml-2`
      case 'center':
        return 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'
      default:
        return `${baseStyles} top-full left-1/2 transform -translate-x-1/2 mt-2`
    }
  }

  const getArrowStyles = (placement: string) => {
    switch (placement) {
      case 'top':
        return 'absolute top-full left-1/2 transform -translate-x-1/2 border-l-8 border-r-8 border-t-8 border-transparent border-t-white'
      case 'bottom':
        return 'absolute bottom-full left-1/2 transform -translate-x-1/2 border-l-8 border-r-8 border-b-8 border-transparent border-b-white'
      case 'left':
        return 'absolute left-full top-1/2 transform -translate-y-1/2 border-t-8 border-b-8 border-l-8 border-transparent border-l-white'
      case 'right':
        return 'absolute right-full top-1/2 transform -translate-y-1/2 border-t-8 border-b-8 border-r-8 border-transparent border-r-white'
      default:
        return ''
    }
  }

  if (!isVisible) return null

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-30 z-40 pointer-events-none" />

      {/* Tour Card */}
      <div className={getPlacementStyles(step.placement ?? 'bottom')}>
        {(step.placement ?? 'bottom') !== 'center' && (
          <div className={getArrowStyles(step.placement ?? 'bottom')} />
        )}

        <Card className="shadow-2xl border-2 border-blue-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{step.title}</CardTitle>
                {step.required && (
                  <Badge variant="secondary" className="text-xs">
                    Required
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={onSkip} className="h-6 w-6 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">{step.content}</p>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onSkip}
                className="flex items-center gap-1"
              >
                <SkipForward className="h-3 w-3" />
                Skip Tour
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPrevious}
                  disabled={step.id === 0}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="h-3 w-3" />
                  Previous
                </Button>

                <Button onClick={onNext} size="sm" className="flex items-center gap-1">
                  Next
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
