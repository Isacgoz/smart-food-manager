
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
  User, Order, OrderItem, KitchenStatus, RestaurantProfile, CashDeclaration,
  Product, Ingredient, Partner, SupplierOrder, StockMovement, Notification, Table, Expense, PinResetRequest
} from './shared/types';
import { loadState, saveState, supabase } from './services/storage';
import { hashUserPIN } from './shared/services/auth';
import { useToast } from './shared/hooks/useToast';
import { archiveInvoice, getLastInvoiceHash, logPriceChange, RestaurantLegalInfo } from './services/nf525';

// Génération ID sécurisée avec crypto
const generateId = () => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
};

// Génère un PIN aléatoire sécurisé (4-6 chiffres)
const generateSecurePin = () => {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 900000 + 100000).slice(0, 6);
};

interface AppContextType {
  restaurant: RestaurantProfile;
  currentUser: User | null;
  orders: Order[];
  users: User[];
  ingredients: Ingredient[];
  products: Product[];
  tables: Table[];
  partners: Partner[];
  supplierOrders: SupplierOrder[];
  movements: StockMovement[];
  notifications: Notification[];
  cashDeclarations: CashDeclaration[];
  expenses: Expense[];
  pinResetRequests: PinResetRequest[];
  isLoading: boolean;

  login: (user: User) => void;
  logout: () => void;
  logoutRestaurant: () => void;
  payOrder: (orderId: string, method: 'CASH' | 'CARD') => void;
  createOrder: (items: OrderItem[], tableId?: string, customerId?: string) => Promise<string>;
  updateKitchenStatus: (orderId: string, status: KitchenStatus) => void;
  declareCash: (userId: string, amount: number, type: 'OPENING' | 'CLOSING') => void;
  notify: (message: string, type?: Notification['type']) => void;
  removeNotification: (id: string) => void;

  addUser: (u: any) => void;
  updateUser: (id: string, u: any) => void;
  deleteUser: (id: string) => void;
  addProduct: (p: Product) => void;
  updateProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  addIngredient: (i: any) => void;
  updateIngredient: (id: string, i: any) => void;
  addTable: (t: any) => void;
  deleteTable: (id: string) => void;
  addPartner: (p: any) => void;
  deletePartner: (id: string) => void;
  createSupplierOrder: (o: any) => void;
  receiveSupplierOrder: (id: string) => void;
  addExpense: (e: Omit<Expense, 'id' | 'createdAt'>) => void;
  updateExpense: (id: string, e: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  createPinResetRequest: (userId: string) => void;
  approvePinResetRequest: (requestId: string) => void;
  rejectPinResetRequest: (requestId: string) => void;
  exportData: () => string;
  importData: (json: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode, restaurant: RestaurantProfile, onRestaurantLogout: () => void }> = ({ children, restaurant, onRestaurantLogout }) => {
  const { notify: toast } = useToast();
  const [data, setData] = useState({
    users: [] as User[],
    orders: [] as Order[],
    ingredients: [] as Ingredient[],
    products: [] as Product[],
    tables: [] as Table[],
    partners: [] as Partner[],
    supplierOrders: [] as SupplierOrder[],
    movements: [] as StockMovement[],
    cashDeclarations: [] as CashDeclaration[],
    expenses: [] as Expense[],
    pinResetRequests: [] as PinResetRequest[],
    _lastUpdatedAt: Date.now()
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Chargement initial
  useEffect(() => {
    const init = async () => {
      const loaded = await loadState(restaurant.id);
      if (loaded) setData(prev => ({ ...prev, ...loaded }));
      setIsLoading(false);
    };
    init();
  }, [restaurant.id]);

  // Écoute du temps réel (Sync entre Cuisine et Salle)
  useEffect(() => {
    if (!supabase || !restaurant.id) return;

    const channel = supabase
      .channel(`db_sync_${restaurant.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'app_state',
        filter: `id=eq.${restaurant.id}`
      }, (payload: any) => {
        const newData = payload.new.data;
        setData(prev => {
          // Gestion intelligente des conflits
          if (newData._lastUpdatedAt <= (prev as any)._lastUpdatedAt) {
            return prev; // Ignorer si local plus récent
          }

          // Merge intelligent: garder version la plus récente de chaque commande
          const mergedOrders = [...prev.orders];
          newData.orders?.forEach((newOrder: Order) => {
            const localIndex = mergedOrders.findIndex(o => o.id === newOrder.id);
            if (localIndex === -1) {
              mergedOrders.push(newOrder); // Nouvelle commande
            } else {
              const local = mergedOrders[localIndex];
              const localVersion = local.version || 0;
              const remoteVersion = newOrder.version || 0;

              // Garder version la plus récente
              if (remoteVersion > localVersion) {
                mergedOrders[localIndex] = newOrder;
              }
            }
          });

          return {
            ...newData,
            orders: mergedOrders
          };
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [restaurant.id]);

  // Sauvegarde automatique
  useEffect(() => {
    if (!isLoading && restaurant.id) saveState(restaurant.id, data);
  }, [data, isLoading, restaurant.id]);

  const notify = useCallback((message: string, type: Notification['type'] = 'info') => {
    toast(message, type);
    const id = generateId();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  }, [toast]);

  const payOrder = useCallback(async (orderId: string, method: 'CASH' | 'CARD') => {
    const order = data.orders.find(o => o.id === orderId);
    if (!order) return;

    // Archivage NF525 si infos légales disponibles
    if (restaurant.siret && restaurant.siren) {
      const legalInfo: RestaurantLegalInfo = {
        name: restaurant.name,
        legal_name: restaurant.legalName,
        siret: restaurant.siret,
        siren: restaurant.siren,
        vat_number: restaurant.vatNumber || `FR${restaurant.siren}`,
        address: restaurant.address || '',
        postal_code: restaurant.postalCode,
        city: restaurant.city
      };

      const previousHash = await getLastInvoiceHash(restaurant.id);
      const archived = await archiveInvoice(
        restaurant.id,
        { ...order, paymentMethod: method },
        data.products,
        legalInfo,
        previousHash || undefined
      );

      if (archived) {
        setData(prev => ({
          ...prev,
          _lastUpdatedAt: Date.now(),
          orders: prev.orders.map(o => o.id === orderId ? {
            ...o,
            status: 'COMPLETED',
            paymentMethod: method,
            paidByUserId: currentUser?.id,
            invoiceNumber: archived.invoice_number,
            paidAt: new Date().toISOString()
          } : o)
        }));
        notify(`Facture ${archived.invoice_number} archivée`, "success");
        return;
      }
    }

    // Fallback si archivage NF525 impossible
    setData(prev => ({
      ...prev,
      _lastUpdatedAt: Date.now(),
      orders: prev.orders.map(o => o.id === orderId ? {
        ...o,
        status: 'COMPLETED',
        paymentMethod: method,
        paidByUserId: currentUser?.id,
        paidAt: new Date().toISOString()
      } : o)
    }));
    notify("Paiement validé", "success");
  }, [currentUser, notify, data.orders, data.products, restaurant]);

  const createOrder = useCallback(async (items: OrderItem[], tableId?: string, customerId?: string) => {
    // VALIDATION: Vérifier stock disponible AVANT création commande
    const missingIngredients: string[] = [];
    const insufficientStock: { name: string, required: number, available: number }[] = [];

    items.forEach(item => {
      const product = data.products.find(p => p.id === item.productId);
      if (!product || !product.recipe) return;

      product.recipe.forEach(recipeItem => {
        const ingredient = data.ingredients.find(i => i.id === recipeItem.ingredientId);
        if (!ingredient) {
          missingIngredients.push(recipeItem.ingredientId);
          return;
        }

        const required = recipeItem.quantity * item.quantity;
        if (ingredient.stock < required) {
          insufficientStock.push({
            name: ingredient.name,
            required,
            available: ingredient.stock
          });
        }
      });
    });

    if (missingIngredients.length > 0) {
      notify(`Ingrédients manquants dans la recette`, 'error');
      return null;
    }

    if (insufficientStock.length > 0) {
      const details = insufficientStock.map(i =>
        `${i.name} (besoin: ${i.required}, dispo: ${i.available})`
      ).join(', ');
      notify(`Stock insuffisant: ${details}`, 'error');
      return null;
    }

    const orderId = generateId();
    const now = new Date().toISOString();
    const newOrder: Order = {
      id: orderId,
      number: data.orders.length + 1,
      items,
      total: items.reduce((s, i) => s + (i.price * i.quantity), 0),
      status: 'PENDING',
      kitchenStatus: 'QUEUED',
      date: now,
      tableId,
      userId: currentUser?.id || 'system',
      version: 1,
      updatedAt: now
    };

    // DÉSTOCKAGE AUTOMATIQUE (Principe métier n°2)
    const movements: StockMovement[] = [];
    const updatedIngredients = [...data.ingredients];

    items.forEach(item => {
      const product = data.products.find(p => p.id === item.productId);
      if (!product || !product.recipe) return;

      product.recipe.forEach(recipeItem => {
        const ingredientIndex = updatedIngredients.findIndex(i => i.id === recipeItem.ingredientId);
        if (ingredientIndex === -1) return;

        const quantityToDeduct = recipeItem.quantity * item.quantity;
        const currentStock = updatedIngredients[ingredientIndex].stock;
        const finalStock = currentStock - quantityToDeduct;

        // Alerte si stock devient négatif (race condition détectée)
        if (finalStock < 0) {
          notify(`⚠️ Stock négatif: ${updatedIngredients[ingredientIndex].name} (${finalStock.toFixed(2)} ${updatedIngredients[ingredientIndex].unit})`, 'warning');
        }

        // Déstockage (autorisé même si négatif, avec alerte)
        updatedIngredients[ingredientIndex] = {
          ...updatedIngredients[ingredientIndex],
          stock: finalStock
        };

        // Mouvement de stock tracé
        movements.push({
          id: generateId(),
          ingredientId: recipeItem.ingredientId,
          type: 'SALE',
          quantity: -quantityToDeduct,
          date: new Date().toISOString(),
          documentRef: orderId
        });
      });
    });

    setData(prev => ({
      ...prev,
      _lastUpdatedAt: Date.now(),
      orders: [...prev.orders, newOrder],
      ingredients: updatedIngredients,
      movements: [...prev.movements, ...movements]
    }));

    notify("Commande créée - Stock mis à jour", "success");
    return orderId;
  }, [data.orders.length, data.products, data.ingredients, data.movements, currentUser, notify]);

  const value = useMemo(() => ({
    restaurant, ...data, currentUser, isLoading, notifications,
    login: (u: User) => setCurrentUser(u),
    logout: () => setCurrentUser(null),
    logoutRestaurant: onRestaurantLogout,
    payOrder, createOrder,
    updateKitchenStatus: (id: string, s: KitchenStatus) => {
      setData(p => {
        const order = p.orders.find(o => o.id === id);
        if (!order) return p;

        const currentVersion = order.version || 1;
        const now = new Date().toISOString();

        return {
          ...p,
          _lastUpdatedAt: Date.now(),
          orders: p.orders.map(o =>
            o.id === id
              ? {...o, kitchenStatus: s, version: currentVersion + 1, updatedAt: now}
              : o
          )
        };
      });
    },
    declareCash: (userId: string, amount: number, type: 'OPENING' | 'CLOSING') => setData(p => ({...p, _lastUpdatedAt: Date.now(), cashDeclarations: [...p.cashDeclarations, {id: generateId(), userId, amount, date: new Date().toISOString(), type}]})),
    addUser: async (u: any) => {
      const pinHash = u.pin ? await hashUserPIN(u.pin) : undefined;
      setData(p => ({...p, _lastUpdatedAt: Date.now(), users: [...p.users, { ...u, id: generateId(), pinHash }]}));
    },
    updateUser: async (id: string, u: any) => {
      const pinHash = u.pin ? await hashUserPIN(u.pin) : undefined;
      const updates = pinHash ? { ...u, pinHash } : u;
      setData(p => ({...p, _lastUpdatedAt: Date.now(), users: p.users.map(user => user.id === id ? {...user, ...updates} : user)}));
    },
    deleteUser: (id: string) => setData(p => ({...p, _lastUpdatedAt: Date.now(), users: p.users.filter(u => u.id !== id)})),
    addProduct: (prod: Product) => setData(p => ({...p, _lastUpdatedAt: Date.now(), products: [...p.products, { ...prod, id: generateId() }]})),
    updateProduct: async (prod: Product) => {
      const oldProduct = data.products.find(p => p.id === prod.id);
      if (oldProduct && oldProduct.price !== prod.price) {
        // NF525: Log changement prix
        await logPriceChange(
          restaurant.id,
          'PRODUCT',
          prod.id,
          prod.name,
          oldProduct.price,
          prod.price,
          currentUser?.id
        );
      }
      setData(p => ({...p, _lastUpdatedAt: Date.now(), products: p.products.map(pr => pr.id === prod.id ? prod : pr)}));
    },
    deleteProduct: (id: string) => setData(p => ({...p, _lastUpdatedAt: Date.now(), products: p.products.filter(pr => pr.id !== id)})),
    addIngredient: (ing: any) => setData(p => ({...p, _lastUpdatedAt: Date.now(), ingredients: [...p.ingredients, { ...ing, id: generateId(), stock: 0, averageCost: 0 }]})),
    updateIngredient: async (id: string, ing: any) => {
      const oldIngredient = data.ingredients.find(i => i.id === id);
      if (oldIngredient && ing.averageCost !== undefined && oldIngredient.averageCost !== ing.averageCost) {
        // NF525: Log changement coût
        await logPriceChange(
          restaurant.id,
          'INGREDIENT',
          id,
          oldIngredient.name,
          oldIngredient.averageCost,
          ing.averageCost,
          currentUser?.id
        );
      }
      setData(p => ({...p, _lastUpdatedAt: Date.now(), ingredients: p.ingredients.map(i => i.id === id ? {...i, ...ing} : i)}));
    },
    addTable: (t: any) => setData(p => ({...p, _lastUpdatedAt: Date.now(), tables: [...p.tables, { ...t, id: generateId() }]})),
    deleteTable: (id: string) => setData(p => ({...p, _lastUpdatedAt: Date.now(), tables: p.tables.filter(t => t.id !== id)})),
    addPartner: (part: any) => setData(p => ({...p, _lastUpdatedAt: Date.now(), partners: [...p.partners, { ...part, id: generateId() }]})),
    deletePartner: (id: string) => setData(p => ({...p, _lastUpdatedAt: Date.now(), partners: p.partners.filter(pa => pa.id !== id)})),
    createSupplierOrder: (o: any) => setData(p => ({...p, _lastUpdatedAt: Date.now(), supplierOrders: [...p.supplierOrders, { ...o, id: generateId(), status: 'PENDING' }]})),
    addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => setData(p => ({...p, _lastUpdatedAt: Date.now(), expenses: [...p.expenses, { ...expense, id: generateId(), createdAt: new Date().toISOString() }]})),
    updateExpense: (id: string, expense: Partial<Expense>) => setData(p => ({...p, _lastUpdatedAt: Date.now(), expenses: p.expenses.map(e => e.id === id ? {...e, ...expense} : e)})),
    deleteExpense: (id: string) => setData(p => ({...p, _lastUpdatedAt: Date.now(), expenses: p.expenses.filter(e => e.id !== id)})),
    createPinResetRequest: (userId: string) => {
      const user = data.users.find(u => u.id === userId);
      if (!user) return;

      const request: PinResetRequest = {
        id: generateId(),
        userId,
        userName: user.name,
        userRole: user.role,
        requestedAt: new Date().toISOString(),
        status: 'PENDING'
      };

      setData(p => ({...p, _lastUpdatedAt: Date.now(), pinResetRequests: [...p.pinResetRequests, request]}));
      notify(`🔔 ${user.name} demande une réinitialisation de PIN`, 'warning');
    },
    approvePinResetRequest: async (requestId: string) => {
      const request = data.pinResetRequests.find(r => r.id === requestId);
      if (!request || request.status !== 'PENDING') return;

      const newPin = generateSecurePin().slice(0, 4);
      const user = data.users.find(u => u.id === request.userId);
      if (!user) return;

      const pinHash = await hashUserPIN(newPin);

      setData(p => ({
        ...p,
        _lastUpdatedAt: Date.now(),
        pinResetRequests: p.pinResetRequests.map(r =>
          r.id === requestId
            ? {...r, status: 'APPROVED', approvedBy: currentUser?.id, approvedAt: new Date().toISOString(), newPin}
            : r
        ),
        users: p.users.map(u => u.id === request.userId ? {...u, pin: newPin, pinHash} : u)
      }));

      // Envoi email si l'utilisateur a un email configuré
      if (user.email && supabase) {
        try {
          const { error } = await supabase.functions.invoke('send-pin-reset', {
            body: { email: user.email, userName: user.name, newPin, restaurantName: restaurant.name }
          });
          if (!error) {
            notify(`✅ Nouveau PIN envoyé par email à ${user.email}`, 'success');
            return;
          }
        } catch (e) {
          // Fallback: afficher PIN au gérant
        }
      }

      notify(`✅ Nouveau PIN généré pour ${request.userName}: ${newPin}`, 'success');
    },
    rejectPinResetRequest: (requestId: string) => {
      const request = data.pinResetRequests.find(r => r.id === requestId);
      if (!request || request.status !== 'PENDING') return;

      setData(p => ({
        ...p,
        _lastUpdatedAt: Date.now(),
        pinResetRequests: p.pinResetRequests.map(r =>
          r.id === requestId
            ? {...r, status: 'REJECTED', approvedBy: currentUser?.id, approvedAt: new Date().toISOString()}
            : r
        )
      }));

      notify(`❌ Demande de réinitialisation refusée pour ${request.userName}`, 'info');
    },
    receiveSupplierOrder: (id: string) => {
      setData(p => {
        const order = p.supplierOrders.find(o => o.id === id);
        if (!order || order.status === 'RECEIVED') return p;

        // Calcul PMP et mise à jour stock
        const updatedIngredients = [...p.ingredients];
        const movements: StockMovement[] = [];

        order.items.forEach(item => {
          const index = updatedIngredients.findIndex(i => i.id === item.ingredientId);
          if (index === -1) return;

          const ingredient = updatedIngredients[index];
          const currentStock = ingredient.stock;
          const currentPMP = ingredient.averageCost;
          const quantityReceived = item.quantity;
          const unitCost = item.cost / item.quantity;

          // Formule PMP: (stock_actuel * PMP_ancien + qté_reçue * prix_unitaire) / (stock_actuel + qté_reçue)
          const newPMP = currentStock === 0
            ? unitCost
            : ((currentStock * currentPMP) + (quantityReceived * unitCost)) / (currentStock + quantityReceived);

          updatedIngredients[index] = {
            ...ingredient,
            stock: currentStock + quantityReceived,
            averageCost: newPMP
          };

          // Mouvement tracé
          movements.push({
            id: generateId(),
            ingredientId: item.ingredientId,
            type: 'PURCHASE',
            quantity: quantityReceived,
            date: new Date().toISOString(),
            documentRef: id
          });
        });

        return {
          ...p,
          _lastUpdatedAt: Date.now(),
          supplierOrders: p.supplierOrders.map(o => o.id === id ? {...o, status: 'RECEIVED'} : o),
          ingredients: updatedIngredients,
          movements: [...p.movements, ...movements]
        };
      });
      notify("Réception validée - Stock & PMP mis à jour", "success");
    },
    notify,
    removeNotification: (id: string) => setNotifications(prev => prev.filter(n => n.id !== id)),
    exportData: () => JSON.stringify(data),
    importData: (json: string) => {
      try {
        const parsed = JSON.parse(json);
        setData({...parsed, _lastUpdatedAt: Date.now()});
        return true;
      } catch(e) { return false; }
    }
  } as any), [restaurant, data, currentUser, isLoading, notifications, payOrder, createOrder, onRestaurantLogout, notify]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useStore = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useStore error');
  return context;
};
