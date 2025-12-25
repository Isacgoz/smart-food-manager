import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Variables d'environnement sécurisées (React Native)
// À configurer dans .env.mobile ou via Expo Config
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const STORAGE_KEY_PREFIX = 'smart_food_mobile_db_';

// Validation au démarrage
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('[MOBILE STORAGE] Supabase credentials missing - Mode offline only');
}

export const supabase = (SUPABASE_URL && SUPABASE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

export const saveState = async (restaurantId: string, state: any) => {
  if(!restaurantId) return;
  try {
    if (!state || !state.users || state.users.length === 0) return;

    // 1. Local Storage (Mobile)
    const jsonValue = JSON.stringify(state);
    await AsyncStorage.setItem(`${STORAGE_KEY_PREFIX}${restaurantId}`, jsonValue);

    // 2. Cloud Sync (Supabase)
    if (supabase) {
      await supabase
        .from('app_state')
        .upsert({ id: restaurantId, data: state, updated_at: new Date() });
    }
  } catch (e) {
    console.error('Error saving data', e);
  }
};

export const loadState = async (restaurantId: string) => {
  if(!restaurantId) return null;
  try {
    // 1. Priorité au Cloud pour avoir les données du Web
    if (supabase) {
      const { data: dbData, error } = await supabase
        .from('app_state')
        .select('data')
        .eq('id', restaurantId)
        .single();
      
      if (!error && dbData && dbData.data) {
        console.log("Mobile: Data loaded from Supabase");
        // Update local cache
        await AsyncStorage.setItem(`${STORAGE_KEY_PREFIX}${restaurantId}`, JSON.stringify(dbData.data));
        return dbData.data;
      }
    }

    // 2. Fallback Local
    const jsonValue = await AsyncStorage.getItem(`${STORAGE_KEY_PREFIX}${restaurantId}`);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error('Error loading data', e);
    return null;
  }
};
