import { useCallback } from 'react'
import { useHaptic } from './useHaptic'

export interface TouchInteractionOptions {
  hapticFeedback?: boolean
  hapticPattern?: 'light' | 'medium' | 'heavy'
  onPress?: () => void
  onLongPress?: () => void
  longPressDuration?: number // in milliseconds
}

/**
 * Hook to handle touch interactions with haptic feedback
 * Provides press and long press handlers with optional haptic feedback
 */
export function useTouchInteraction(options: TouchInteractionOptions = {}) {
  const {
    hapticFeedback = false,
    hapticPattern = 'light',
    onPress,
    onLongPress,
    longPressDuration = 500,
  } = options

  const { triggerHaptic } = useHaptic()

  const handlePress = useCallback(() => {
    if (hapticFeedback) {
      triggerHaptic(hapticPattern)
    }
    onPress?.()
  }, [hapticFeedback, hapticPattern, onPress, triggerHaptic])

  const handleLongPress = useCallback(() => {
    if (hapticFeedback) {
      triggerHaptic('medium')
    }
    onLongPress?.()
  }, [hapticFeedback, onLongPress, triggerHaptic])

  // Touch handlers
  let pressTimer: NodeJS.Timeout | null = null

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (onLongPress) {
        pressTimer = setTimeout(() => {
          handleLongPress()
        }, longPressDuration)
      }
    },
    [onLongPress, longPressDuration, handleLongPress]
  )

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (pressTimer) {
        clearTimeout(pressTimer)
        pressTimer = null
      }
      handlePress()
    },
    [handlePress]
  )

  const handleTouchMove = useCallback(() => {
    // Cancel long press if user moves finger
    if (pressTimer) {
      clearTimeout(pressTimer)
      pressTimer = null
    }
  }, [])

  return {
    handlePress,
    handleLongPress,
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
      onTouchMove: handleTouchMove,
    },
  }
}
