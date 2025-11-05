'use client'

import { useState, useEffect, useCallback } from 'react'
import { DemoUtils } from '@/lib/demo-utils'
import { DEMO_SAMPLE_DATA, DEMO_TOUR_STEPS, DEMO_ANALYTICS_DATA } from '@/lib/demo-data'
import { type DemoSession, type DemoRole, type DemoTourStep } from '@/types/demo'

export function useDemo() {
  const [session, setSession] = useState<DemoSession | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [isActive, setIsActive] = useState(false)

  const startDemo = useCallback((role: DemoRole) => {
    const newSession: DemoSession = {
      id: crypto.randomUUID(),
      role,
      data: DEMO_SAMPLE_DATA[role],
      startedAt: new Date().toISOString(),
      tourSteps: DEMO_TOUR_STEPS[role],
    }
    setSession(newSession)
    setIsActive(true)
    setCurrentStep(0)
    return newSession
  }, [])

  const endDemo = useCallback(() => {
    setSession(null)
    setIsActive(false)
    setCurrentStep(0)
  }, [])

  const nextStep = useCallback(() => {
    if (session && currentStep < session.tourSteps.length - 1) {
      setCurrentStep((prev) => prev + 1)
    }
  }, [session, currentStep])

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }, [currentStep])

  const getCurrentStepData = useCallback(() => {
    if (!session) return null
    return session.tourSteps[currentStep]
  }, [session, currentStep])

  const simulateDataChange = useCallback(() => {
    // Simulate real-time data updates during demo
    if (session?.role === 'admin') {
      // Simulate new orders
      return DemoUtils.generateRandomOrder()
    }
    return null
  }, [session])

  const resetDemo = useCallback(() => {
    if (session) {
      const role = session.role
      endDemo()
      startDemo(role)
    }
  }, [session, startDemo, endDemo])

  // Auto-advance demo steps
  useEffect(() => {
    if (!isActive || !session?.tourSteps[currentStep]?.autoAdvance) {
      return
    }

    const timer = setTimeout(() => {
      nextStep()
    }, session.tourSteps[currentStep].autoAdvance)
    return () => clearTimeout(timer)
  }, [isActive, currentStep, session, nextStep])

  return {
    session,
    currentStep,
    isActive,
    startDemo,
    endDemo,
    nextStep,
    previousStep,
    getCurrentStepData,
    simulateDataChange,
    resetDemo,
    getAnalyticsData: () => DEMO_ANALYTICS_DATA[session?.role || 'admin'],
    // Missing properties
    sessionTimeRemaining: null,
    extendSession: () => {},
    currentRole: session?.role || null,
    switchRole: (role: DemoRole) => startDemo(role),
    sampleData: DEMO_SAMPLE_DATA,
    analyticsData: DEMO_ANALYTICS_DATA,
    isLoading: false,
    startTour: () => {},
    attemptConversion: () => {},
    submitFeedback: () => {},
    checkLimitations: () => [],
    tourActive: false,
    tourStep: 0,
    nextTourStep: () => {},
    previousTourStep: () => {},
    skipTour: () => {},
  }
}
