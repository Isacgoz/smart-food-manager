import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { User, Product, Order, Table, OrderItem, RestaurantProfile, Ingredient, StockMovement, KitchenStatus } from './types';
import { loadState, saveState, supabase } from './services/storage';
import { verifyPIN, verifyPINOffline, hashUserPIN } from '../shared/services/auth';
import {
  validateStockBeforeOrder,
  destockIngredients,
  generateId,
  mergeOrders,
  calculatePMP
} from '../shared/services/business';
import { queueAction, processQueue, getQueueSize } from './services/offlineQueue';

const INITIAL_STATE = {
  users: [] as User[],
  products: [] as Product[],
  tables: [] as Table[],
  orders: [] as Order[],
  ingredients: [] as Ingredient[],
  movements: [] as StockMovement[],
  _lastUpdatedAt: Date.now()
};

interface MobileContextType {
  restaurant: RestaurantProfile | null;
  currentUser: User | null;
  isLoading: boolean;

  users: User[];
  products: Product[];
  tables: Table[];
  orders: Order[];
  ingredients: Ingredient[];
  movements: StockMovement[];

  loginRestaurant: (profile: RestaurantProfile) => void;
  logoutRestaurant: () => void;
  loginUser: (userId: string, pin: string) => Promise<boolean>;
  logoutUser: () => void;
  createOrder: (items: OrderItem[], tableId?: string) => Promise<string | null>;
  updateKitchenStatus: (orderId: string, status: KitchenStatus) => void;
  addUser: (u: Partial<User>) => Promise<void>;
  refreshData: () => Promise<void>;
  notify: (message: string) => void;
}

const MobileContext = createContext<MobileContextType | undefined>(undefined);

export const MobileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [restaurant, setRestaurant] = useState<RestaurantProfile | null>(null);
  const [data, setData] = useState(INITIAL_STATE);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isLoadedRef = useRef(false);

  // Chargement initial
  useEffect(() => {
      const init = async () => {
          try {
              const savedProfile = await AsyncStorage.getItem('smart_food_mobile_restaurant');
              if (savedProfile) {
                  const profile = JSON.parse(savedProfile);
                  setRestaurant(profile);
                  await loadRestaurantData(profile.id);
              }
          } catch(e) {
              console.error("[MOBILE] Init Error", e);
          } finally {
              setIsLoading(false);
          }
      };
      init();
  }, []);

  // Charger données restaurant
  const loadRestaurantData = async (id: string) => {
      setIsLoading(true);
      const loaded = await loadState(id);
      if (loaded) {
          setData(prev => ({ ...prev, ...loaded }));
      }
      isLoadedRef.current = true;
      setIsLoading(false);
  };

  // Écoute temps réel (WebSocket Supabase)
  useEffect(() => {
    if (!supabase || !restaurant?.id) return;

    console.log('[MOBILE] Setting up realtime sync for', restaurant.id);

    const channel = supabase
      .channel(`mobile_sync_${restaurant.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'app_state',
        filter: `id=eq.${restaurant.id}`
      }, (payload: any) => {
        console.log('[MOBILE] Realtime update received');
        const newData = payload.new.data;

        setData(prev => {
          // Ignorer si local plus récent
          if (newData._lastUpdatedAt <= prev._lastUpdatedAt) {
            return prev;
          }

          // Merge intelligent des commandes
          const mergedOrders = mergeOrders(prev.orders, newData.orders || []);

          return {
            ...newData,
            orders: mergedOrders
          };
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [restaurant?.id]);

  // Auto-sync queue on reconnection
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      if (state.isConnected && restaurant?.id) {
        console.log('[MOBILE] Reconnected - processing queue');
        const result = await processQueue();
        if (result.processed > 0) {
          notify(`${result.processed} commande(s) synchronisée(s)`);
        }
        if (result.failed > 0) {
          notify(`Erreur sync: ${result.failed} action(s) échouée(s)`);
        }
      }
    });

    return () => unsubscribe();
  }, [restaurant?.id]);

  // Sauvegarde automatique
  useEffect(() => {
    if (!isLoading && isLoadedRef.current && restaurant?.id) {
      saveState(restaurant.id, data);
    }
  }, [data, isLoading, restaurant]);

  // --- ACTIONS ---

  const loginRestaurant = async (profile: RestaurantProfile) => {
      setRestaurant(profile);
      await AsyncStorage.setItem('smart_food_mobile_restaurant', JSON.stringify(profile));
      await loadRestaurantData(profile.id);
  };

  const logoutRestaurant = async () => {
      setCurrentUser(null);
      setRestaurant(null);
      setData(INITIAL_STATE);
      isLoadedRef.current = false;
      await AsyncStorage.removeItem('smart_food_mobile_restaurant');
  };

  // Auth serveur sécurisée
  const loginUser = async (userId: string, pin: string): Promise<boolean> => {
    if (!restaurant) return false;

    try {
      // Vérification serveur prioritaire
      const result = await verifyPIN(restaurant.id, userId, pin);

      // Fallback offline
      const finalResult = result.success
        ? result
        : await verifyPINOffline(data.users, userId, pin);

      if (finalResult.success && finalResult.user) {
        setCurrentUser(finalResult.user);
        return true;
      }

      return false;
    } catch (err) {
      console.error('[MOBILE] Login error:', err);
      return false;
    }
  };

  const logoutUser = () => setCurrentUser(null);

  // Création commande avec TOUTE la logique métier + queue offline
  const createOrder = async (items: OrderItem[], tableId?: string): Promise<string | null> => {
    if (!restaurant) return null;

    // 1. VALIDATION STOCK
    const validation = validateStockBeforeOrder(items, data.products, data.ingredients);
    if (!validation.valid) {
      notify(validation.errors.join('\n'));
      return null;
    }

    const orderId = generateId();

    // 2. DÉSTOCKAGE AUTOMATIQUE
    const { updatedIngredients, movements } = destockIngredients(
      items,
      data.products,
      data.ingredients,
      orderId
    );

    // 3. CRÉATION COMMANDE
    const now = new Date().toISOString();
    const newOrder: Order = {
      id: orderId,
      number: data.orders.length + 1,
      items,
      total: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      status: 'PENDING',
      kitchenStatus: 'QUEUED',
      date: now,
      tableId,
      userId: currentUser?.id || 'unknown',
      version: 1,
      updatedAt: now
    };

    // 4. CHECK NETWORK & QUEUE OR SYNC
    const netInfo = await NetInfo.fetch();

    if (!netInfo.isConnected) {
      // OFFLINE: Queue action
      await queueAction('CREATE_ORDER', {
        order: newOrder,
        updatedIngredients,
        movements
      }, restaurant.id);

      // Update local state immediately
      setData(prev => ({
        ...prev,
        _lastUpdatedAt: Date.now(),
        orders: [...prev.orders, newOrder],
        ingredients: updatedIngredients,
        movements: [...prev.movements, ...movements]
      }));

      notify('Commande enregistrée (sync en attente)');
    } else {
      // ONLINE: Direct update
      setData(prev => ({
        ...prev,
        _lastUpdatedAt: Date.now(),
        orders: [...prev.orders, newOrder],
        ingredients: updatedIngredients,
        movements: [...prev.movements, ...movements]
      }));

      notify('Commande créée - Stock mis à jour');
    }

    return orderId;
  };

  // Update statut cuisine avec versioning + queue offline
  const updateKitchenStatus = useCallback(async (orderId: string, status: KitchenStatus) => {
    if (!restaurant) return;

    const netInfo = await NetInfo.fetch();

    if (!netInfo.isConnected) {
      // OFFLINE: Queue
      await queueAction('UPDATE_KITCHEN_STATUS', { orderId, status }, restaurant.id);
    }

    // Update local state (online ou offline)
    setData(prev => {
      const order = prev.orders.find(o => o.id === orderId);
      if (!order) return prev;

      const currentVersion = order.version || 1;
      const now = new Date().toISOString();

      return {
        ...prev,
        _lastUpdatedAt: Date.now(),
        orders: prev.orders.map(o =>
          o.id === orderId
            ? { ...o, kitchenStatus: status, version: currentVersion + 1, updatedAt: now }
            : o
        )
      };
    });
  }, [restaurant]);

  // Ajouter utilisateur avec PIN hashé
  const addUser = async (u: Partial<User>) => {
    const pinHash = u.pin ? await hashUserPIN(u.pin) : undefined;
    const newUser: User = {
      id: generateId(),
      name: u.name || '',
      pin: u.pin || '',
      pinHash,
      role: u.role || 'SERVER'
    };

    setData(prev => ({
      ...prev,
      _lastUpdatedAt: Date.now(),
      users: [...prev.users, newUser]
    }));
  };

  const notify = (message: string) => {
    // TODO: Utiliser React Native Toast/Alert
    console.log('[MOBILE NOTIFY]', message);
  };

  return (
    <MobileContext.Provider value={{
      restaurant,
      ...data,
      currentUser,
      isLoading,
      loginRestaurant,
      logoutRestaurant,
      loginUser,
      logoutUser,
      createOrder,
      updateKitchenStatus,
      addUser,
      refreshData: () => restaurant ? loadRestaurantData(restaurant.id) : Promise.resolve(),
      notify
    }}>
      {children}
    </MobileContext.Provider>
  );
};

export const useMobileStore = () => {
  const context = useContext(MobileContext);
  if (!context) throw new Error('useMobileStore must be used within MobileProvider');
  return context;
};
