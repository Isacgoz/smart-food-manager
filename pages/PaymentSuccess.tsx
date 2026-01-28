import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { RestaurantProfile } from '../shared/types';

export const PaymentSuccess: React.FC = () => {
  const { restaurant } = useStore();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    // Mise à jour du restaurant profile dans localStorage (MODE TEST)
    // En production: webhook Stripe mettra à jour Supabase
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');

    if (sessionId && restaurant) {
      const now = new Date();
      const subscriptionEnds = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const updatedProfile: RestaurantProfile = {
        ...restaurant,
        subscriptionStatus: 'active',
        subscriptionEndsAt: subscriptionEnds.toISOString(),
        trialEndsAt: undefined,
      };

      // Mise à jour localStorage
      localStorage.setItem('smart_food_last_restaurant', JSON.stringify(updatedProfile));

      // Forcer rechargement après 2 secondes pour appliquer changements
      setTimeout(() => {
        setProcessing(false);
      }, 2000);
    } else {
      setProcessing(false);
    }
  }, [restaurant]);

  if (processing) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-white font-bold">Confirmation de votre paiement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 rounded-3xl border border-slate-800 p-8 text-center">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-black text-white mb-3">Paiement réussi !</h1>

        <p className="text-slate-400 mb-6">
          Votre abonnement <span className="text-emerald-400 font-bold">{restaurant?.plan}</span> est maintenant actif.
        </p>

        <div className="bg-slate-950 rounded-xl p-4 mb-6">
          <p className="text-xs text-slate-500 mb-2">Prochain renouvellement</p>
          <p className="text-white font-bold">
            {restaurant?.subscriptionEndsAt
              ? new Date(restaurant.subscriptionEndsAt).toLocaleDateString('fr-FR')
              : 'Non défini'}
          </p>
        </div>

        <button
          onClick={() => {
            window.location.href = '/';
            window.location.reload();
          }}
          className="w-full bg-emerald-500 text-white font-black py-3 rounded-xl hover:bg-emerald-600 transition-all"
        >
          Retour au Dashboard
        </button>

        <p className="text-xs text-slate-500 mt-4 text-center">
          💡 Mode TEST: Rechargez la page si le badge trial est toujours visible
        </p>
      </div>
    </div>
  );
};
