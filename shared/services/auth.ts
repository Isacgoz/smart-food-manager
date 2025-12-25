import { supabase } from './storage';
import { User } from '../types';

/**
 * Hash PIN côté client avant envoi (sécurité transport)
 * Note: Le vrai hash sécurisé est fait côté Supabase avec pgcrypto
 */
const hashPIN = async (pin: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Vérifie le PIN côté serveur via Supabase RPC
 * CRITIQUE: Ne jamais vérifier le PIN côté client
 */
export const verifyPIN = async (
  restaurantId: string,
  userId: string,
  pin: string
): Promise<{ success: boolean; user?: User; error?: string }> => {
  if (!supabase) {
    return { success: false, error: 'Supabase non configuré' };
  }

  try {
    const hashedPin = await hashPIN(pin);

    // Appel RPC sécurisé côté serveur
    const { data, error } = await supabase.rpc('verify_staff_pin', {
      p_restaurant_id: restaurantId,
      p_user_id: userId,
      p_pin_hash: hashedPin
    });

    if (error) {
      console.error('[AUTH] RPC Error:', error);
      return { success: false, error: 'Erreur serveur' };
    }

    if (!data || !data.success) {
      return { success: false, error: 'PIN incorrect' };
    }

    return { success: true, user: data.user };
  } catch (err) {
    console.error('[AUTH] Exception:', err);
    return { success: false, error: 'Erreur réseau' };
  }
};

/**
 * Fallback offline: vérification locale avec hash stocké
 * Utilisé uniquement si Supabase inaccessible
 */
export const verifyPINOffline = async (
  users: User[],
  userId: string,
  pin: string
): Promise<{ success: boolean; user?: User }> => {
  const hashedPin = await hashPIN(pin);
  const user = users.find(u => u.id === userId);

  if (!user) {
    return { success: false };
  }

  // Comparaison hash local (stocké depuis dernière sync)
  if ((user as any).pinHash === hashedPin) {
    return { success: true, user };
  }

  return { success: false };
};

/**
 * Créer/Modifier un utilisateur avec hash PIN
 */
export const hashUserPIN = async (pin: string): Promise<string> => {
  return await hashPIN(pin);
};
