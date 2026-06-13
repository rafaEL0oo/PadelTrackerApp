import { useEffect, useRef } from 'react';

export function useWakeLock(enabled: boolean) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return;

    async function requestWakeLock() {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      } catch {
        // Wake lock not available
      }
    }

    requestWakeLock();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && enabled) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      wakeLockRef.current?.release();
    };
  }, [enabled]);
}

export function useVibrate() {
  return (pattern: number | number[] = 50) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };
}

export function useDebouncedClick(cooldownMs = 500) {
  const lastClickRef = useRef(0);

  return (callback: () => void) => {
    const now = Date.now();
    if (now - lastClickRef.current < cooldownMs) return;
    lastClickRef.current = now;
    callback();
  };
}
