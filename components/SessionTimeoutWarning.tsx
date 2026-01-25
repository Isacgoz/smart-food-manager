import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock } from 'lucide-react';

interface SessionTimeoutWarningProps {
  show: boolean;
  onExtend: () => void;
  onLogout: () => void;
}

export const SessionTimeoutWarning: React.FC<SessionTimeoutWarningProps> = ({
  show,
  onExtend,
  onLogout
}) => {
  const [countdown, setCountdown] = useState(120); // 2 minutes en secondes

  useEffect(() => {
    if (!show) {
      setCountdown(120);
      return;
    }

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [show, onLogout]);

  if (!show) return null;

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-amber-500/50 rounded-[32px] p-8 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500/20 rounded-full mb-4">
            <AlertTriangle size={32} className="text-amber-500" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">
            Session inactive
          </h2>
          <p className="text-slate-400 text-sm mb-4">
            Votre session va expirer pour des raisons de sécurité.
          </p>

          <div className="bg-slate-800 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Clock size={24} className="text-amber-500" />
              <span className="text-5xl font-black text-white font-mono">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Déconnexion automatique
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onLogout}
            className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors font-bold text-sm"
          >
            Déconnexion
          </button>
          <button
            onClick={onExtend}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors font-bold text-sm"
          >
            Rester connecté
          </button>
        </div>

        <p className="text-xs text-slate-500 text-center mt-4">
          Sécurité: Les sessions inactives sont déconnectées après 30 minutes.
        </p>
      </div>
    </div>
  );
};
