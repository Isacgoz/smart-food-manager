import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { isPWA } from '../shared/hooks/useMobile';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Ne pas afficher si déjà installé
    if (isPWA()) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowPrompt(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Garder deferredPrompt pour permettre install plus tard
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-8 md:w-96 bg-slate-950 text-white rounded-3xl shadow-2xl p-6 z-50 animate-in slide-in-from-bottom-4">
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-xl transition-colors"
      >
        <X size={16} />
      </button>

      <div className="flex items-start gap-4 mb-4">
        <div className="bg-emerald-600 p-3 rounded-2xl">
          <Smartphone size={24} />
        </div>
        <div>
          <h3 className="font-black text-lg uppercase tracking-tight mb-1">Installer l'App</h3>
          <p className="text-sm text-slate-400 font-bold">
            Accédez rapidement depuis votre écran d'accueil
          </p>
        </div>
      </div>

      <button
        onClick={handleInstall}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-2xl font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg"
      >
        <Download size={18} />
        Installer Maintenant
      </button>
    </div>
  );
};

export default PWAInstallPrompt;
