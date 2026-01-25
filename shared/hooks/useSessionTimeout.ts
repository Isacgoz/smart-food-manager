import { useEffect, useCallback, useRef, useState } from 'react';

const TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE = 2 * 60 * 1000; // Avertir 2 minutes avant

interface UseSessionTimeoutOptions {
  onTimeout: () => void;
  onWarning?: () => void;
}

export const useSessionTimeout = ({ onTimeout, onWarning }: UseSessionTimeoutOptions) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const [showWarning, setShowWarning] = useState(false);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    setShowWarning(false);
  }, []);

  const resetTimeout = useCallback(() => {
    clearTimers();

    // Warning 2min avant expiration
    warningRef.current = setTimeout(() => {
      setShowWarning(true);
      onWarning?.();
    }, TIMEOUT_DURATION - WARNING_BEFORE);

    // Timeout final
    timeoutRef.current = setTimeout(() => {
      onTimeout();
    }, TIMEOUT_DURATION);
  }, [clearTimers, onTimeout, onWarning]);

  const extendSession = useCallback(() => {
    resetTimeout();
  }, [resetTimeout]);

  useEffect(() => {
    // Events qui réinitialisent le timer
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      if (!showWarning) {
        resetTimeout();
      }
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Initialiser
    resetTimeout();

    return () => {
      clearTimers();
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [resetTimeout, clearTimers, showWarning]);

  return { showWarning, extendSession, clearTimers };
};
