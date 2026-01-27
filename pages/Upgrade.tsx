import React, { useState } from 'react';
import { useStore } from '../storage';
import { PlanType } from '../shared/types';
import { redirectToCheckout } from '../services/stripe';
import { PLANS } from '../services/subscription';

export const Upgrade: React.FC = () => {
  const { restaurant } = useStore();
  const [loading, setLoading] = useState<PlanType | null>(null);

  const handleUpgrade = async (plan: PlanType) => {
    if (!restaurant) return;

    setLoading(plan);
    try {
      await redirectToCheckout(plan, restaurant.id, restaurant.ownerEmail);
    } catch (error) {
      console.error('Erreur Stripe:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de la redirection vers le paiement');
      setLoading(null);
    }
  };

  const plans: { id: PlanType; name: string; price: number; popular?: boolean; features: string[] }[] = [
    {
      id: 'SOLO',
      name: 'Solo',
      price: 29,
      features: [
        '1 utilisateur',
        '50 produits max',
        '10 tables max',
        'Dashboard complet',
        'ERP intégré',
        'Support email',
      ],
    },
    {
      id: 'TEAM',
      name: 'Team',
      price: 79,
      popular: true,
      features: [
        '5 utilisateurs',
        '200 produits max',
        '30 tables max',
        'Dashboard avancé',
        'ERP complet',
        'Gestion équipe',
        'Support prioritaire',
      ],
    },
    {
      id: 'BUSINESS',
      name: 'Business',
      price: 149,
      features: [
        'Utilisateurs illimités',
        'Produits illimités',
        'Tables illimitées',
        'Analytics avancés',
        'API complète',
        'Multi-sites',
        'Support 24/7',
      ],
    },
  ];

  return (
    <div className="p-8 bg-slate-100 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black text-slate-900 mb-3">Choisissez votre plan</h1>
          <p className="text-slate-600 text-lg">
            Votre plan actuel: <span className="font-bold text-emerald-600">{restaurant?.plan}</span>
            {restaurant?.subscriptionStatus === 'trial' && ' (Essai gratuit)'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = restaurant?.plan === plan.id;
            const planInfo = PLANS[plan.id];

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-3xl border-2 p-8 transition-all ${
                  plan.popular
                    ? 'border-emerald-500 shadow-2xl scale-105'
                    : 'border-slate-200 hover:border-emerald-300 hover:shadow-xl'
                } ${isCurrentPlan ? 'opacity-60' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-1 rounded-full text-xs font-black uppercase">
                      Populaire
                    </span>
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-slate-600 text-white px-4 py-1 rounded-full text-xs font-black uppercase">
                      Plan actuel
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h2 className="text-2xl font-black text-slate-900 mb-2">{plan.name}</h2>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-black text-emerald-600">{plan.price}€</span>
                    <span className="text-slate-500 font-bold">/mois</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-700">
                      <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isCurrentPlan || loading !== null}
                  className={`w-full py-3 rounded-xl font-black uppercase tracking-wider transition-all ${
                    isCurrentPlan
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : loading === plan.id
                      ? 'bg-emerald-400 text-white cursor-wait'
                      : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {isCurrentPlan
                    ? 'Plan actuel'
                    : loading === plan.id
                    ? 'Redirection...'
                    : 'Choisir ce plan'}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <svg className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-black text-blue-900 mb-2">Mode TEST</h3>
              <p className="text-blue-700 text-sm mb-3">
                Vous êtes en mode TEST. Utilisez les cartes de test Stripe pour simuler des paiements.
              </p>
              <div className="bg-white rounded-lg p-3 font-mono text-sm">
                <p className="text-slate-600 mb-1"><strong>Carte de test:</strong> 4242 4242 4242 4242</p>
                <p className="text-slate-600 mb-1"><strong>Expiration:</strong> N'importe quelle date future</p>
                <p className="text-slate-600"><strong>CVC:</strong> N'importe quel code 3 chiffres</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
