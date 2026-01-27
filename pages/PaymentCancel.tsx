import React from 'react';

export const PaymentCancel: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 rounded-3xl border border-slate-800 p-8 text-center">
        <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h1 className="text-2xl font-black text-white mb-3">Paiement annulé</h1>

        <p className="text-slate-400 mb-6">
          Aucun montant n'a été débité. Vous pouvez réessayer à tout moment.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-emerald-500 text-white font-black py-3 rounded-xl hover:bg-emerald-600 transition-all"
          >
            Retour au Dashboard
          </button>

          <button
            onClick={() => window.history.back()}
            className="w-full bg-slate-800 text-white font-black py-3 rounded-xl hover:bg-slate-700 transition-all"
          >
            Réessayer
          </button>
        </div>
      </div>
    </div>
  );
};
