/**
 * useThrottle Hook
 *
 * Limits the rate at which a value can change. Ensures the value
 * updates at most once per specified interval, regardless of how
 * frequently it changes. Perfect for scroll events or window resize.
 *
 * @param value - The value to throttle
 * @param interval - The minimum interval between updates in milliseconds (default: 300ms)
 * @returns The throttled value
 *
 * @example
 * ```tsx
 * const [scrollPosition, setScrollPosition] = useState(0)
 * const throttledScrollPosition = useThrottle(scrollPosition, 100)
 *
 * useEffect(() => {
 *   const handleScroll = () => {
 *     setScrollPosition(window.scrollY)
 *   }
 *   window.addEventListener('scroll', handleScroll)
 *   return () => window.removeEventListener('scroll', handleScroll)
 * }, [])
 *
 * useEffect(() => {
 *   // This only runs once per 100ms, not on every scroll event
 *   console.log('Scroll position:', throttledScrollPosition)
 * }, [throttledScrollPosition])
 * ```
 */

import { useState, useEffect, useRef } from 'react'

export function useThrottle<T>(value: T, interval: number = 300): T {
  const [throttledValue, setThrottledValue] = useState<T>(value)
  const lastExecuted = useRef<number>(Date.now())

  useEffect(() => {
    const handler = setTimeout(
      () => {
        const now = Date.now()
        const timeSinceLastExecuted = now - lastExecuted.current

        if (timeSinceLastExecuted >= interval) {
          setThrottledValue(value)
          lastExecuted.current = now
        }
      },
      interval - (Date.now() - lastExecuted.current)
    )

    return () => {
      clearTimeout(handler)
    }
  }, [value, interval])

  return throttledValue
}
