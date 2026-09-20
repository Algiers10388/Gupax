import { useState, useEffect, useCallback } from 'react';

export function useWakeLock() {
  const [isLocked, setIsLocked] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [wakeLockSentinel, setWakeLockSentinel] = useState<WakeLockSentinel | null>(null);

  useEffect(() => {
    if ('wakeLock' in navigator) {
      setIsSupported(true);
    }
  }, []);

  const requestLock = useCallback(async () => {
    if ('wakeLock' in navigator) {
      try {
        const sentinel = await navigator.wakeLock.request('screen');
        sentinel.addEventListener('release', () => {
          setIsLocked(false);
          setWakeLockSentinel(null);
        });
        setWakeLockSentinel(sentinel);
        setIsLocked(true);
        return true;
      } catch (err) {
        console.warn('Wake Lock request failed:', err);
        return false;
      }
    }
    return false;
  }, []);

  const releaseLock = useCallback(async () => {
    if (wakeLockSentinel) {
      try {
        await wakeLockSentinel.release();
        setWakeLockSentinel(null);
        setIsLocked(false);
      } catch (err) {
        console.warn('Wake Lock release failed:', err);
      }
    }
  }, [wakeLockSentinel]);

  // Re-acquire lock when app tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isLocked && !wakeLockSentinel) {
        await requestLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isLocked, wakeLockSentinel, requestLock]);

  return {
    isSupported,
    isLocked,
    requestLock,
    releaseLock,
    toggleLock: () => (isLocked ? releaseLock() : requestLock()),
  };
}
