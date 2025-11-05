'use client'
import { ReactNode } from 'react'
import { DemoBanner } from '@/components/demo/DemoBanner'
import { RoleSwitcher } from '@/components/demo/RoleSwitcher'
import { DemoLimitations } from '@/components/demo/DemoLimitations'
import { ConversionPrompt } from '@/components/demo/ConversionPrompt'
import { GuidedTour } from '@/components/demo/GuidedTour'
import { useDemo } from '@/hooks/useDemo'

interface DemoLayoutProps {
  children: ReactNode
}

export default function DemoLayout({ children }: DemoLayoutProps) {
  const { tourActive, tourStep, nextTourStep, previousTourStep, skipTour, getCurrentStepData } =
    useDemo()
  const currentStepData = getCurrentStepData()

  return (
    <div className="min-h-screen bg-gray-50">
      <DemoBanner />
      <RoleSwitcher />

      <div className="demo-welcome">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="dashboard-main">{children}</div>
        </main>
      </div>

      <DemoLimitations />
      <ConversionPrompt />

      {tourActive && currentStepData && (
        <GuidedTour
          step={currentStepData}
          onNext={nextTourStep}
          onPrevious={previousTourStep}
          onSkip={skipTour}
        />
      )}
    </div>
  )
}
