import { useMediaQuery } from './useMediaQuery';

/**
 * Tailwind CSS breakpoints
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export type Breakpoint = keyof typeof breakpoints;

/**
 * Hook to get current responsive breakpoint state
 * Returns boolean flags for each breakpoint and device type
 */
export function useResponsive() {
  const isSm = useMediaQuery(`(min-width: ${breakpoints.sm})`);
  const isMd = useMediaQuery(`(min-width: ${breakpoints.md})`);
  const isLg = useMediaQuery(`(min-width: ${breakpoints.lg})`);
  const isXl = useMediaQuery(`(min-width: ${breakpoints.xl})`);
  const is2Xl = useMediaQuery(`(min-width: ${breakpoints['2xl']})`);

  // Device type detection
  const isMobile = !isSm; // < 640px
  const isTablet = isSm && !isLg; // >= 640px and < 1024px
  const isDesktop = isLg; // >= 1024px

  // Touch device detection
  const isTouchDevice =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  return {
    // Breakpoint flags
    isSm,
    isMd,
    isLg,
    isXl,
    is2Xl,

    // Device type flags
    isMobile,
    isTablet,
    isDesktop,
    isTouchDevice,

    // Helper methods
    isBreakpoint: (breakpoint: Breakpoint) => {
      switch (breakpoint) {
        case 'sm':
          return isSm;
        case 'md':
          return isMd;
        case 'lg':
          return isLg;
        case 'xl':
          return isXl;
        case '2xl':
          return is2Xl;
        default:
          return false;
      }
    },
  };
}
