
import { createClient } from '@supabase/supabase-js';
import { logger } from '../shared/services/logger';

// Variables d'environnement sécurisées (Vite)
// Préfixe VITE_ requis pour exposition côté client
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validation au démarrage
if (!SUPABASE_URL || !SUPABASE_KEY) {
  logger.warn('Supabase credentials missing - Mode offline only');
}

export const supabase = (SUPABASE_URL && SUPABASE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

const STORAGE_KEY_PREFIX = 'smart_food_db_';

export const saveState = async (restaurantId: string, state: any) => {
  if (!restaurantId || !state) return;

  try {
    const timestamp = Date.now();
    const payload = { ...state, _lastUpdatedAt: timestamp };
    
    // 1. Sauvegarde locale pour la réactivité (Offline-first)
    const localKey = `${STORAGE_KEY_PREFIX}${restaurantId}`;
    localStorage.setItem(localKey, JSON.stringify(payload));

    // 2. Synchronisation Cloud avec Supabase
    if (supabase) {
      const { error } = await supabase
        .from('app_state')
        .upsert({ 
          id: restaurantId, 
          data: payload, 
          updated_at: new Date(timestamp).toISOString() 
        }, { onConflict: 'id' });
        
      if (error) logger.warn('Cloud sync delay', { error: error.message, restaurantId });
    }
  } catch (err) {
    logger.error('Critical persistence error', err as Error, { restaurantId });
  }
};

export const loadState = async (restaurantId: string) => {
  if (!restaurantId) return null;
  const localKey = `${STORAGE_KEY_PREFIX}${restaurantId}`;

  try {
    // On tente de récupérer la version cloud en priorité pour avoir les dernières commandes
    if (supabase) {
      const { data, error } = await supabase
        .from('app_state')
        .select('data')
        .eq('id', restaurantId)
        .single();
      
      if (!error && data?.data) {
        localStorage.setItem(localKey, JSON.stringify(data.data));
        return data.data;
      }
    }

    const serialized = localStorage.getItem(localKey);
    return serialized ? JSON.parse(serialized) : null;
  } catch (err) {
    return null;
  }
};
