import { useCallback } from 'react';

export function useHaptics() {
  const triggerHaptic = useCallback((pattern: number | number[] = 50) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignore if forbidden by browser
      }
    }
  }, []);

  const shareSuccessHaptic = useCallback(() => {
    triggerHaptic([40, 60, 40]);
  }, [triggerHaptic]);

  const blockFoundHaptic = useCallback(() => {
    triggerHaptic([100, 50, 100, 50, 200]);
  }, [triggerHaptic]);

  return {
    triggerHaptic,
    shareSuccessHaptic,
    blockFoundHaptic,
  };
}
