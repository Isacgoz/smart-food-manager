import React, { useEffect, useState } from 'react';
import { useOnlineStatus } from '../shared/hooks/useOnlineStatus';
import { WifiOff, Wifi, RefreshCw, Download } from 'lucide-react';
import { usePWA } from '../shared/hooks/usePWA';

const NetworkStatus: React.FC = () => {
  const { isOnline, wasOffline, effectiveType, rtt } = useOnlineStatus();
  const { isInstallable, isInstalled, promptInstall, dismissPrompt } = usePWA();
  const [showReconnected, setShowReconnected] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // Afficher notification reconnexion
    if (isOnline && wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  useEffect(() => {
    // Afficher prompt installation après 30s si installable
    if (isInstallable && !isInstalled) {
      const timer = setTimeout(() => setShowInstallPrompt(true), 30000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled]);

  const handleInstall = async () => {
    await promptInstall();
    setShowInstallPrompt(false);
  };

  const handleDismissInstall = () => {
    dismissPrompt();
    setShowInstallPrompt(false);
  };

  // Badge offline permanent
  if (!isOnline) {
    return (
      <div className="fixed top-4 right-4 z-[300] animate-in slide-in-from-top duration-300">
        <div className="bg-red-600 text-white px-6 py-3 rounded-[20px] shadow-2xl flex items-center gap-3">
          <WifiOff size={20} className="animate-pulse" />
          <div>
            <div className="font-black text-sm uppercase tracking-tight">Mode Hors-ligne</div>
            <div className="text-xs opacity-80">Données synchronisées à la reconnexion</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Notification reconnexion */}
      {showReconnected && (
        <div className="fixed top-4 right-4 z-[300] animate-in slide-in-from-top duration-300">
          <div className="bg-emerald-600 text-white px-6 py-3 rounded-[20px] shadow-2xl flex items-center gap-3">
            <Wifi size={20} />
            <div>
              <div className="font-black text-sm uppercase tracking-tight">Connexion rétablie</div>
              <div className="text-xs opacity-80 flex items-center gap-2">
                <RefreshCw size={12} className="animate-spin" />
                Synchronisation en cours...
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Badge connexion (discret, coin inférieur droit) */}
      {isOnline && effectiveType && (
        <div className="fixed bottom-4 right-4 z-[100] print:hidden">
          <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full shadow-sm flex items-center gap-2 text-xs font-bold">
            <div className={`w-2 h-2 rounded-full ${
              effectiveType === '4g' ? 'bg-emerald-500' :
              effectiveType === '3g' ? 'bg-yellow-500' :
              effectiveType === '2g' ? 'bg-orange-500' :
              'bg-slate-400'
            }`} />
            {effectiveType.toUpperCase()}
            {rtt && <span className="text-slate-400">• {rtt}ms</span>}
          </div>
        </div>
      )}

      {/* Prompt installation PWA */}
      {showInstallPrompt && isInstallable && !isInstalled && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[400] flex items-end justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-t-[40px] shadow-2xl max-w-md w-full animate-in slide-in-from-bottom duration-300">
            <div className="text-center">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Download size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-950 mb-3 tracking-tighter uppercase">
                Installer l'Application
              </h3>
              <p className="text-slate-600 font-bold mb-8 leading-relaxed">
                Installez Smart Food Manager sur votre appareil pour un accès rapide et un fonctionnement hors-ligne.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={handleInstall}
                  className="flex-1 bg-emerald-600 text-white py-4 rounded-[24px] font-black text-lg hover:bg-emerald-700 transition-all shadow-xl uppercase tracking-tight"
                >
                  Installer
                </button>
                <button
                  onClick={handleDismissInstall}
                  className="px-6 py-4 rounded-[24px] border-2 border-slate-200 font-black text-slate-700 hover:bg-slate-50 transition-all uppercase tracking-tight"
                >
                  Plus tard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NetworkStatus;
