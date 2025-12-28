import { useCallback } from 'react';

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning';

/**
 * Hook to trigger haptic feedback on mobile devices
 * @returns Object with haptic trigger functions
 */
export function useHaptic() {
  const isSupported =
    typeof navigator !== 'undefined' &&
    'vibrate' in navigator &&
    typeof navigator.vibrate === 'function';

  const triggerHaptic = useCallback(
    (pattern: HapticPattern = 'light') => {
      if (!isSupported) return;

      const patterns: Record<HapticPattern, number | number[]> = {
        light: 10,
        medium: 20,
        heavy: 30,
        success: [10, 50, 10],
        error: [20, 100, 20, 100, 20],
        warning: [15, 50, 15],
      };

      const vibrationPattern = patterns[pattern];
      navigator.vibrate(vibrationPattern);
    },
    [isSupported]
  );

  return {
    isSupported,
    triggerHaptic,
    light: () => triggerHaptic('light'),
    medium: () => triggerHaptic('medium'),
    heavy: () => triggerHaptic('heavy'),
    success: () => triggerHaptic('success'),
    error: () => triggerHaptic('error'),
    warning: () => triggerHaptic('warning'),
  };
}
