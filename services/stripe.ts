import { loadStripe, Stripe } from '@stripe/stripe-js';
import { PlanType } from '../shared/types';

let stripePromise: Promise<Stripe | null>;

export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.error('❌ VITE_STRIPE_PUBLISHABLE_KEY non configurée');
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
};

// Price IDs from .env
const PRICE_IDS: Record<PlanType, string> = {
  SOLO: import.meta.env.VITE_STRIPE_PRICE_SOLO || '',
  TEAM: import.meta.env.VITE_STRIPE_PRICE_TEAM || '',
  BUSINESS: import.meta.env.VITE_STRIPE_PRICE_BUSINESS || '',
};

export const redirectToCheckout = async (
  plan: PlanType,
  restaurantId: string,
  userEmail: string
): Promise<void> => {
  const stripe = await getStripe();

  if (!stripe) {
    throw new Error('Stripe non initialisé');
  }

  const priceId = PRICE_IDS[plan];
  if (!priceId) {
    throw new Error(`Price ID non configuré pour ${plan}`);
  }

  const { error } = await stripe.redirectToCheckout({
    lineItems: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    successUrl: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${window.location.origin}/payment-cancel`,
    customerEmail: userEmail,
    clientReferenceId: restaurantId, // Pour lier au restaurant
    metadata: {
      restaurantId,
      plan,
    },
  });

  if (error) {
    throw new Error(error.message);
  }
};
