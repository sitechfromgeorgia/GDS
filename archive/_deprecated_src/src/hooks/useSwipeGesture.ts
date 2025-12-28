import { useRef, useEffect, TouchEvent } from 'react';

export interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  minSwipeDistance?: number; // Minimum distance for a swipe (in pixels)
  hapticFeedback?: boolean; // Enable haptic feedback on swipe
}

interface TouchPosition {
  x: number;
  y: number;
  time: number;
}

/**
 * Hook to handle swipe gestures on mobile devices
 * @param options - Configuration for swipe handlers and behavior
 * @returns ref to attach to the swipeable element
 */
export function useSwipeGesture<T extends HTMLElement = HTMLElement>(
  options: SwipeGestureOptions
) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    minSwipeDistance = 50,
    hapticFeedback = false,
  } = options;

  const touchStart = useRef<TouchPosition | null>(null);
  const touchEnd = useRef<TouchPosition | null>(null);
  const elementRef = useRef<T>(null);

  const triggerHaptic = () => {
    if (
      hapticFeedback &&
      'vibrate' in navigator &&
      typeof navigator.vibrate === 'function'
    ) {
      navigator.vibrate(10); // Short vibration
    }
  };

  const handleTouchStart = (e: TouchEvent) => {
    touchEnd.current = null; // Reset
    touchStart.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
      time: Date.now(),
    };
  };

  const handleTouchMove = (e: TouchEvent) => {
    touchEnd.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
      time: Date.now(),
    };
  };

  const handleTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;

    const deltaX = touchStart.current.x - touchEnd.current.x;
    const deltaY = touchStart.current.y - touchEnd.current.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Determine if horizontal or vertical swipe
    const isHorizontalSwipe = absDeltaX > absDeltaY;

    if (isHorizontalSwipe) {
      // Horizontal swipe
      if (absDeltaX > minSwipeDistance) {
        if (deltaX > 0 && onSwipeLeft) {
          triggerHaptic();
          onSwipeLeft();
        } else if (deltaX < 0 && onSwipeRight) {
          triggerHaptic();
          onSwipeRight();
        }
      }
    } else {
      // Vertical swipe
      if (absDeltaY > minSwipeDistance) {
        if (deltaY > 0 && onSwipeUp) {
          triggerHaptic();
          onSwipeUp();
        } else if (deltaY < 0 && onSwipeDown) {
          triggerHaptic();
          onSwipeDown();
        }
      }
    }

    // Reset
    touchStart.current = null;
    touchEnd.current = null;
  };

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Add event listeners with proper typing
    const handleStart = handleTouchStart as any;
    const handleMove = handleTouchMove as any;
    const handleEnd = handleTouchEnd as any;

    element.addEventListener('touchstart', handleStart, { passive: true });
    element.addEventListener('touchmove', handleMove, { passive: true });
    element.addEventListener('touchend', handleEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleStart);
      element.removeEventListener('touchmove', handleMove);
      element.removeEventListener('touchend', handleEnd);
    };
  }, [
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    minSwipeDistance,
    hapticFeedback,
  ]);

  return elementRef;
}
