import { useState, useEffect } from 'react';

export interface OnlineStatus {
  isOnline: boolean;
  wasOffline: boolean;
  effectiveType: string | null;
  downlink: number | null;
  rtt: number | null;
}

/**
 * Hook détection statut connexion avec infos réseau
 */
export const useOnlineStatus = (): OnlineStatus => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [networkInfo, setNetworkInfo] = useState<{
    effectiveType: string | null;
    downlink: number | null;
    rtt: number | null;
  }>({
    effectiveType: null,
    downlink: null,
    rtt: null
  });

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        console.log('[Network] Back online');
        // Déclencher sync
        if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.sync.register('sync-orders').catch((err) => {
              console.error('[Network] Sync registration failed:', err);
            });
          });
        }
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      console.warn('[Network] Connection lost');
    };

    const updateNetworkInfo = () => {
      // @ts-ignore - NetworkInformation API pas encore standard
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

      if (connection) {
        setNetworkInfo({
          effectiveType: connection.effectiveType || null,
          downlink: connection.downlink || null,
          rtt: connection.rtt || null
        });
      }
    };

    // Listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Network Information API
    // @ts-ignore
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      connection.addEventListener('change', updateNetworkInfo);
      updateNetworkInfo();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', updateNetworkInfo);
      }
    };
  }, [wasOffline]);

  return {
    isOnline,
    wasOffline,
    ...networkInfo
  };
};
