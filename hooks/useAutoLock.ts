import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook auto-lock après inactivité
 * CRITIQUE pour sécurité en environnement restaurant
 */
export const useAutoLock = (
  onLock: () => void,
  timeoutMs: number = 120000 // 2 minutes par défaut
) => {
  const timerRef = useRef<NodeJS.Timeout>();

  const resetTimer = useCallback(() => {
    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Start new timer
    timerRef.current = setTimeout(() => {
      console.log('[AUTO-LOCK] Session verrouillée après inactivité');
      onLock();
    }, timeoutMs);
  }, [onLock, timeoutMs]);

  useEffect(() => {
    // Events qui réinitialisent le timer
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

    const handleActivity = () => {
      resetTimer();
    };

    // Attach listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Init timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [resetTimer]);
};
