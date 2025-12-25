# 🎯 ROADMAP PRODUCTION - Smart Food Manager
**Version** : 1.0.0-beta → 1.0.0-prod
**Durée estimée** : 5 sprints critiques
**Objectif** : Transformer le prototype en système de production fiable et sécurisé

---

## 📊 AUDIT INITIAL - Points Bloquants Identifiés

### 🔴 CRITIQUE (Bloque le déploiement)
1. **Auth client-side** : PIN vérifiés côté navigateur → faille sécurité majeure
2. **Déstockage manuel** : Violation du principe métier n°2 (aucun déstockage auto)
3. **Clés API exposées** : SUPABASE_KEY et GEMINI_API_KEY dans le code source
4. **Stock négatif** : Aucune validation, peut vendre sans ingrédients
5. **Calcul PMP absent** : Prix moyen pondéré non implémenté

### ⚠️ MAJEUR (Risque opérationnel)
6. **Conflits temps réel** : Last-Write-Wins → perte données commandes
7. **Permissions UI** : Routes accessibles via URL directe
8. **Pagination absente** : Crash prévisible avec volume de prod
9. **Impression non testée** : Protocole ESC/POS non implémenté
10. **Pas d'auto-lock** : Sessions non verrouillées après inactivité

### 🟡 IMPORTANT (Expérience dégradée)
11. **Logs absents** : Impossible de débugger en production
12. **Offline partiel** : localStorage seulement, pas de queue de sync
13. **Pas de retry** : Échecs Supabase non gérés
14. **Export incomplet** : Pas de TVA, pas de Z-Report structuré

---

## 🏗️ SPRINT 1 : Sécurisation & Identité (FONDATION)
**Durée** : 3-5 jours
**Priorité** : CRITIQUE ⚠️
**Objectif** : Rendre l'app impossible à pirater par un staff malveillant

### Tâches techniques

#### 1.1 Migration Auth → Supabase RPC
**Fichiers** : `pages/Login.tsx`, `store.tsx`, **nouveau** `services/auth.ts`

**Action** :
- Créer fonction SQL Supabase :
```sql
CREATE OR REPLACE FUNCTION verify_staff_pin(
  p_restaurant_id UUID,
  p_user_id TEXT,
  p_pin TEXT
) RETURNS JSON AS $$
DECLARE
  v_user RECORD;
BEGIN
  SELECT * INTO v_user FROM users
  WHERE restaurant_id = p_restaurant_id
    AND id = p_user_id
    AND pin_hash = crypt(p_pin, pin_hash);

  IF NOT FOUND THEN
    RETURN json_build_object('success', false);
  END IF;

  RETURN json_build_object(
    'success', true,
    'user', row_to_json(v_user)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

- Remplacer [Login.tsx:29](Login.tsx#L29) :
```typescript
const { data, error } = await supabase.rpc('verify_staff_pin', {
  p_restaurant_id: restaurant.id,
  p_user_id: selectedUser.id,
  p_pin: pin
});
if (data?.success) login(data.user);
```

**Validation** :
- [ ] PIN jamais visible dans Network Tab
- [ ] Console Chrome vide de toute donnée sensible
- [ ] Inspection localStorage ne révèle aucun PIN

---

#### 1.2 Auto-Verrouillage (2 min d'inactivité)
**Fichier** : **nouveau** `hooks/useAutoLock.ts`, `App.tsx`

**Action** :
```typescript
// hooks/useAutoLock.ts
export const useAutoLock = (timeoutMs: number = 120000) => {
  const { logout } = useStore();
  const timerRef = useRef<NodeJS.Timeout>();

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(logout, timeoutMs);
  }, [logout, timeoutMs]);

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resetTimer]);
};
```

**Validation** :
- [ ] Retour écran PIN après 2 min sans interaction
- [ ] Timer reset après chaque tap/click
- [ ] Fonctionne en arrière-plan (tab inactive)

---

#### 1.3 Permissions granulaires (Masquage routes)
**Fichiers** : `App.tsx`, `components/Layout.tsx`

**Action** :
```typescript
// App.tsx
const ROLE_ROUTES: Record<Role, string[]> = {
  OWNER: ['dashboard', 'kitchen', 'stocks', 'purchases', 'partners', 'menu', 'pos', 'users', 'orders', 'backup'],
  MANAGER: ['dashboard', 'kitchen', 'stocks', 'purchases', 'menu', 'pos', 'orders', 'backup'],
  SERVER: ['pos', 'kitchen', 'orders'],
  COOK: ['kitchen']
};

const renderView = () => {
  if (!ROLE_ROUTES[currentUser.role].includes(currentView)) {
    return <div className="p-10 text-center">
      <Lock size={48} className="mx-auto text-red-500 mb-4" />
      <p className="font-black">Accès refusé pour votre rôle</p>
    </div>;
  }
  // ... render normal
};
```

**Validation** :
- [ ] SERVER ne voit que POS/Kitchen/Orders dans menu
- [ ] Taper `/dashboard` manuellement affiche "Accès refusé"
- [ ] COOK isolé sur écran Kitchen uniquement

---

#### 1.4 Variables d'environnement sécurisées
**Fichiers** : `.env.production`, `vite.config.ts`, `services/storage.ts`

**Action** :
```bash
# .env.production (JAMAIS commité)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

```typescript
// services/storage.ts
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing Supabase credentials');
}
```

```bash
# .gitignore (ajouter)
.env.local
.env.production
```

**Validation** :
- [ ] Build Vercel utilise variables d'environnement dashboard
- [ ] `grep -r "supabase.co" dist/` retourne vide
- [ ] Console log aucune clé API

---

### Critères de validation Sprint 1
- ✅ Impossible de se connecter avec mauvais PIN (testé 10x)
- ✅ App se verrouille après 2 min d'inactivité
- ✅ Serveur ne peut pas accéder Dashboard même via URL
- ✅ Build production ne contient aucune clé en clair
- ✅ Tests sécurité OWASP basiques passés

---

## 🏗️ SPRINT 2 : Fiabilité Opérationnelle (LE LIVE)
**Durée** : 4-6 jours
**Priorité** : CRITIQUE 🔥
**Objectif** : Communication instantanée sans perte de commandes

### Tâches techniques

#### 2.1 Temps Réel Supabase (WebSockets robustes)
**Fichiers** : `store.tsx`, **nouveau** `services/realtime.ts`

**Action** :
- Créer service dédié :
```typescript
// services/realtime.ts
export const subscribeToOrders = (
  restaurantId: string,
  onUpdate: (orders: Order[]) => void
) => {
  const channel = supabase
    .channel(`orders_${restaurantId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'orders',
      filter: `restaurant_id=eq.${restaurantId}`
    }, (payload) => {
      console.log('[REALTIME] Order update:', payload);
      onUpdate(payload.new);
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[REALTIME] Connected');
      }
    });

  return () => supabase.removeChannel(channel);
};
```

- Intégrer dans [store.tsx:84](store.tsx#L84) :
```typescript
useEffect(() => {
  if (!supabase || !restaurant.id) return;

  return subscribeToOrders(restaurant.id, (newOrder) => {
    setData(prev => ({
      ...prev,
      orders: prev.orders.map(o => o.id === newOrder.id ? newOrder : o)
    }));
  });
}, [restaurant.id]);
```

**Validation** :
- [ ] Ouvrir 2 navigateurs, créer commande dans l'un → apparaît dans l'autre en <1s
- [ ] Déconnecter WiFi 30s puis reconnecter → sync automatique
- [ ] Écran Kitchen se met à jour sans F5

---

#### 2.2 Gestion des conflits (Optimistic Locking)
**Fichiers** : `types.ts`, `store.tsx`

**Action** :
```typescript
// types.ts - Ajouter version
export interface Order {
  // ... existing fields
  version: number; // Incrément à chaque modification
  updatedAt: string;
}

// store.tsx - Modifier updateKitchenStatus
updateKitchenStatus: (id: string, status: KitchenStatus) => {
  const order = data.orders.find(o => o.id === id);
  if (!order) return;

  const newVersion = order.version + 1;

  supabase.rpc('update_order_status', {
    p_order_id: id,
    p_new_status: status,
    p_expected_version: order.version
  }).then(({ data, error }) => {
    if (error?.code === 'VERSION_CONFLICT') {
      notify("Conflit détecté, actualisation...", "warning");
      // Recharger l'order depuis la DB
    }
  });
}
```

**SQL Supabase** :
```sql
CREATE OR REPLACE FUNCTION update_order_status(
  p_order_id TEXT,
  p_new_status TEXT,
  p_expected_version INT
) RETURNS JSON AS $$
DECLARE
  v_current_version INT;
BEGIN
  SELECT version INTO v_current_version FROM orders WHERE id = p_order_id;

  IF v_current_version != p_expected_version THEN
    RAISE EXCEPTION 'VERSION_CONFLICT';
  END IF;

  UPDATE orders SET
    kitchen_status = p_new_status,
    version = version + 1,
    updated_at = NOW()
  WHERE id = p_order_id;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql;
```

**Validation** :
- [ ] 2 serveurs modifient même commande → message d'alerte
- [ ] Premier qui valide gagne, deuxième recharge
- [ ] Aucune perte de changement en cas de conflit

---

#### 2.3 Reconnexion automatique WebSocket
**Fichier** : `services/realtime.ts`

**Action** :
```typescript
let reconnectAttempts = 0;
const MAX_RETRIES = 5;

const setupRealtimeWithRetry = () => {
  const channel = supabase
    .channel(`orders_${restaurantId}`)
    .on(...)
    .subscribe((status, err) => {
      if (status === 'CHANNEL_ERROR') {
        console.error('[REALTIME] Error:', err);
        if (reconnectAttempts < MAX_RETRIES) {
          reconnectAttempts++;
          setTimeout(() => {
            console.log(`[REALTIME] Retry ${reconnectAttempts}/${MAX_RETRIES}`);
            setupRealtimeWithRetry();
          }, Math.min(1000 * 2 ** reconnectAttempts, 30000));
        }
      } else if (status === 'SUBSCRIBED') {
        reconnectAttempts = 0; // Reset counter
      }
    });
};
```

**Validation** :
- [ ] Couper réseau 1 min → reconnexion auto dès retour
- [ ] Logs console montrent tentatives de retry
- [ ] Pas de crash après 5 échecs consécutifs

---

### Critères de validation Sprint 2
- ✅ 2 tablettes synchronisées en temps réel (<2s latence)
- ✅ Modifications concurrentes gérées sans crash
- ✅ Reconnexion automatique après coupure réseau
- ✅ Kitchen Display System (KDS) fonctionnel en conditions réelles
- ✅ Testé avec 50 commandes simultanées

---

## 🏗️ SPRINT 3 : Intégrité Financière & Audit (L'ARGENT)
**Durée** : 5-7 jours
**Priorité** : CRITIQUE 💰
**Objectif** : Zéro perte financière, traçabilité totale

### Tâches techniques

#### 3.1 Z-Report (Clôture de journée)
**Fichiers** : `pages/Dashboard.tsx`, **nouveau** `types.ts` (ZReport)

**Action** :
```typescript
// types.ts
export interface ZReport {
  id: string;
  restaurantId: string;
  date: string;
  openingCash: number;
  closingCash: number;
  theoreticalCash: number;
  variance: number;
  totalCash: number;
  totalCard: number;
  totalSales: number;
  orderCount: number;
  cancelledOrders: number;
  vatBreakdown: { rate: number, base: number, vat: number }[];
  staffBreakdown: { userId: string, cash: number, card: number }[];
  generatedBy: string;
  generatedAt: string;
}

// pages/Dashboard.tsx - Ajouter bouton "Générer Z-Report"
const generateZReport = () => {
  const today = new Date().toISOString().split('T')[0];
  const completedToday = orders.filter(o =>
    o.status === 'COMPLETED' && o.date.startsWith(today)
  );

  const vatBreakdown = products.reduce((acc, p) => {
    const sales = completedToday.flatMap(o => o.items)
      .filter(i => i.productId === p.id);
    const totalHT = sales.reduce((s, i) => s + (i.price / (1 + p.vatRate)), 0);
    const existingRate = acc.find(v => v.rate === p.vatRate);

    if (existingRate) {
      existingRate.base += totalHT;
      existingRate.vat += totalHT * p.vatRate;
    } else {
      acc.push({
        rate: p.vatRate,
        base: totalHT,
        vat: totalHT * p.vatRate
      });
    }
    return acc;
  }, [] as ZReport['vatBreakdown']);

  const report: ZReport = {
    id: generateId(),
    restaurantId: restaurant.id,
    date: today,
    openingCash: stats.openingAmount,
    closingCash: parseFloat(closingCash),
    theoreticalCash: stats.theoreticalCash,
    variance: parseFloat(closingCash) - stats.theoreticalCash,
    totalCash: stats.cashTotal,
    totalCard: stats.cardTotal,
    totalSales: stats.revenue,
    orderCount: completedToday.length,
    cancelledOrders: orders.filter(o => o.status === 'CANCELLED' && o.date.startsWith(today)).length,
    vatBreakdown,
    staffBreakdown: stats.collectors,
    generatedBy: currentUser?.id || 'system',
    generatedAt: new Date().toISOString()
  };

  // Sauvegarder dans Supabase
  supabase.from('z_reports').insert(report);

  // Télécharger PDF
  downloadZReportPDF(report);
};
```

**Validation** :
- [ ] Bouton "Clôturer Journée" génère PDF téléchargeable
- [ ] TVA calculée correctement (5.5%, 10%, 20%)
- [ ] Écarts caisse tracés avec montant exact
- [ ] Export CSV pour comptable

---

#### 3.2 Journal d'Audit (Annulations)
**Fichiers** : `types.ts`, `store.tsx`, **nouveau** `pages/AuditLog.tsx`

**Action** :
```typescript
// types.ts
export interface AuditLog {
  id: string;
  restaurantId: string;
  timestamp: string;
  userId: string;
  action: 'ORDER_CANCEL' | 'STOCK_ADJUST' | 'PRICE_CHANGE' | 'USER_DELETE';
  entityType: 'order' | 'product' | 'ingredient' | 'user';
  entityId: string;
  reason?: string;
  metadata: Record<string, any>;
}

// store.tsx - Modifier cancelOrder (à créer)
cancelOrder: (orderId: string, reason: string) => {
  const order = data.orders.find(o => o.id === orderId);
  if (!order) return;

  // Log audit
  const auditLog: AuditLog = {
    id: generateId(),
    restaurantId: restaurant.id,
    timestamp: new Date().toISOString(),
    userId: currentUser?.id || 'system',
    action: 'ORDER_CANCEL',
    entityType: 'order',
    entityId: orderId,
    reason,
    metadata: {
      orderNumber: order.number,
      total: order.total,
      items: order.items.map(i => i.name)
    }
  };

  supabase.from('audit_logs').insert(auditLog);

  setData(p => ({
    ...p,
    orders: p.orders.map(o => o.id === orderId ? {...o, status: 'CANCELLED'} : o)
  }));

  notify("Commande annulée et tracée", "warning");
}
```

**Validation** :
- [ ] Annuler commande → modal demande raison obligatoire
- [ ] Log enregistré dans Supabase `audit_logs`
- [ ] Page Audit affiche historique filtrable par user/date
- [ ] Impossible d'annuler sans raison (button disabled)

---

#### 3.3 Calcul TVA par taux
**Fichiers** : `pages/Dashboard.tsx`

**Action** : Voir code Z-Report section 3.1

**Validation** :
- [ ] Burger 20% → TVA calculée sur prix HT correct
- [ ] Boisson 5.5% → séparé dans rapport
- [ ] Total TVA = somme des lignes par taux
- [ ] Export Excel avec onglets par taux

---

### Critères de validation Sprint 3
- ✅ Z-Report PDF généré quotidiennement
- ✅ Écarts caisse <1% tracés et expliqués
- ✅ Aucune annulation sans justification
- ✅ TVA validée par expert-comptable
- ✅ Audit trail complet sur 90 jours

---

## 🏗️ SPRINT 4 : Expérience Utilisateur & Impression (LE DÉTAIL)
**Durée** : 4-5 jours
**Priorité** : MAJEUR 🎨
**Objectif** : Fluidité maximale pendant le rush

### Tâches techniques

#### 4.1 Impression Thermique (ESC/POS)
**Fichiers** : **nouveau** `services/printer.ts`, `store.tsx`

**Action** :
```typescript
// services/printer.ts
import { Order } from '../types';

const ESC = '\x1B';
const GS = '\x1D';

export const formatTicket = (order: Order, restaurant: string): string => {
  let ticket = '';

  // Header
  ticket += `${ESC}@`; // Initialize
  ticket += `${ESC}a\x01`; // Center align
  ticket += `${ESC}E\x01`; // Bold
  ticket += `${restaurant}\n`;
  ticket += `${ESC}E\x00`; // Bold off
  ticket += `${ESC}a\x00`; // Left align
  ticket += '================================\n';

  // Order info
  ticket += `BON N° ${order.number}\n`;
  ticket += `TABLE: ${order.tableId || 'COMPTOIR'}\n`;
  ticket += `${new Date(order.date).toLocaleTimeString()}\n`;
  ticket += '--------------------------------\n';

  // Items
  order.items.forEach(item => {
    ticket += `${ESC}E\x01${item.quantity}x ${item.name}${ESC}E\x00\n`;
    if (item.note) {
      ticket += `${ESC}a\x02  >> ${item.note}${ESC}a\x00\n`; // Right align note
    }
  });

  ticket += '================================\n';
  ticket += `${GS}V\x00`; // Cut paper

  return ticket;
};

export const printToNetwork = async (ticket: string, printerIP: string) => {
  try {
    const response = await fetch(`http://${printerIP}:9100`, {
      method: 'POST',
      body: ticket
    });
    return response.ok;
  } catch (err) {
    console.error('Print error:', err);
    return false;
  }
};
```

**Validation** :
- [ ] Ticket imprimé avec bon format sur Epson TM-T20II
- [ ] Notes en gras et indentées
- [ ] Coupe automatique du papier
- [ ] Fallback modal si imprimante HS

---

#### 4.2 Toasts de confirmation
**Fichiers** : `store.tsx`, **nouveau** `components/Toast.tsx`

**Action** :
```typescript
// components/Toast.tsx
export const Toast: React.FC<{ notification: Notification, onClose: () => void }> = ({ notification, onClose }) => {
  const icons = {
    success: <CheckCircle className="text-emerald-500" />,
    error: <AlertCircle className="text-red-500" />,
    warning: <AlertTriangle className="text-orange-500" />,
    info: <Info className="text-blue-500" />
  };

  return (
    <div className="fixed top-4 right-4 bg-white p-4 rounded-2xl shadow-2xl border-2 border-slate-900 animate-in slide-in-from-top-5 duration-300 z-[999]">
      <div className="flex items-center gap-3">
        {icons[notification.type]}
        <span className="font-black text-sm">{notification.message}</span>
        <button onClick={onClose} className="ml-4">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
```

**Validation** :
- [ ] Toast vert après commande envoyée
- [ ] Toast rouge si erreur réseau
- [ ] Disparaît après 5s automatiquement
- [ ] Max 3 toasts empilés

---

#### 4.3 Validation Stock avant vente
**Fichiers** : `pages/POS.tsx`, `store.tsx`

**Action** :
```typescript
// store.tsx - Modifier createOrder
createOrder: async (items: OrderItem[], tableId?: string) => {
  // Vérifier stock disponible
  const missingIngredients: string[] = [];

  items.forEach(item => {
    const product = data.products.find(p => p.id === item.productId);
    if (!product) return;

    product.recipe.forEach(recipeItem => {
      const ingredient = data.ingredients.find(i => i.id === recipeItem.ingredientId);
      if (!ingredient) return;

      const required = recipeItem.quantity * item.quantity;
      if (ingredient.stock < required) {
        missingIngredients.push(ingredient.name);
      }
    });
  });

  if (missingIngredients.length > 0) {
    notify(`Stock insuffisant: ${missingIngredients.join(', ')}`, 'error');
    return null;
  }

  // ... reste du code createOrder
}
```

**Validation** :
- [ ] Vendre burger avec 0 pain → erreur "Stock insuffisant: Pain"
- [ ] Button "Commander" disabled si ingrédient manquant
- [ ] Alerte visuelle rouge sur carte produit

---

#### 4.4 Optimisation UI (Debouncing)
**Fichiers** : `store.tsx`

**Action** :
```typescript
// Remplacer sauvegarde immédiate par debounced
import { debounce } from 'lodash'; // ou custom

const debouncedSave = useCallback(
  debounce((restaurantId: string, data: any) => {
    saveState(restaurantId, data);
  }, 1000),
  []
);

useEffect(() => {
  if (!isLoading && restaurant.id) {
    debouncedSave(restaurant.id, data);
  }
}, [data, isLoading, restaurant.id]);
```

**Validation** :
- [ ] Ajouter 10 produits rapidement → 1 seul appel Supabase
- [ ] Network tab montre batching correct
- [ ] Pas de lag UI lors de modifications

---

### Critères de validation Sprint 4
- ✅ Tickets cuisine imprimés en <2s
- ✅ Toutes actions confirmées visuellement
- ✅ Impossible de vendre produit sans stock
- ✅ UI fluide même avec 100+ commandes/jour
- ✅ Testé avec serveur non-tech (validation UX)

---

## 🏗️ SPRINT 5 : Déploiement & Maintenance (LA PROD)
**Durée** : 3-4 jours
**Priorité** : CRITIQUE 🚀
**Objectif** : Mise en ligne sécurisée et monitorée

### Tâches techniques

#### 5.1 Configuration Variables d'Environnement
**Fichiers** : `.env.production`, Vercel Dashboard

**Action** :
```bash
# Vercel Dashboard → Settings → Environment Variables
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
VITE_PRINTER_IP=192.168.1.100
```

**Validation** :
- [ ] Build production utilise variables Vercel
- [ ] Staging utilise variables différentes de prod
- [ ] Logs Vercel montrent variables chargées

---

#### 5.2 PWA (Installation Tablette)
**Fichiers** : **nouveau** `manifest.json`, `vite.config.ts`, `index.html`

**Action** :
```json
// public/manifest.json
{
  "name": "Smart Food Manager",
  "short_name": "Smart Food",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#10b981",
  "orientation": "landscape",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Smart Food Manager',
        short_name: 'Smart Food',
        theme_color: '#10b981'
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 // 1h
              }
            }
          }
        ]
      }
    })
  ]
});
```

**Validation** :
- [ ] iPad affiche "Ajouter à l'écran d'accueil"
- [ ] App lancée en plein écran (pas de barre Safari)
- [ ] Icône visible sur home screen
- [ ] Service Worker cache API calls

---

#### 5.3 Monitoring & Logs (Sentry)
**Fichiers** : **nouveau** `services/monitoring.ts`, `main.tsx`

**Action** :
```typescript
// services/monitoring.ts
import * as Sentry from '@sentry/react';

export const initMonitoring = () => {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 1.0,
    beforeSend(event, hint) {
      // Ne pas logger les erreurs réseau bénignes
      if (event.exception?.values?.[0]?.type === 'NetworkError') {
        return null;
      }
      return event;
    }
  });
};

export const logCriticalError = (error: Error, context: Record<string, any>) => {
  Sentry.captureException(error, {
    level: 'error',
    tags: { critical: true },
    contexts: { custom: context }
  });
};
```

```typescript
// main.tsx
import { initMonitoring } from './services/monitoring';

initMonitoring();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
    <App />
  </Sentry.ErrorBoundary>
);
```

**Validation** :
- [ ] Crash app → alerte email Sentry
- [ ] Dashboard Sentry montre erreurs temps réel
- [ ] Logs incluent user ID et restaurant ID
- [ ] Performance tracking <100ms p95

---

#### 5.4 Backup automatique quotidien
**Fichiers** : **nouveau** `supabase/functions/daily-backup/index.ts`

**Action** :
```typescript
// Supabase Edge Function (Cron job)
import { createClient } from '@supabase/supabase-js';

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Exporter toutes les données restaurant
  const { data: restaurants } = await supabase.from('restaurants').select('*');

  for (const restaurant of restaurants || []) {
    const { data: fullData } = await supabase
      .from('app_state')
      .select('*')
      .eq('id', restaurant.id)
      .single();

    // Upload vers S3
    await fetch(`https://s3.amazonaws.com/backups/${restaurant.id}/${new Date().toISOString()}.json`, {
      method: 'PUT',
      body: JSON.stringify(fullData)
    });
  }

  return new Response('Backup completed', { status: 200 });
});

// Configurer Cron: 0 3 * * * (3h du matin)
```

**Validation** :
- [ ] Backup S3 créé chaque nuit à 3h
- [ ] Fichiers JSON téléchargeables depuis dashboard
- [ ] Restauration testée avec succès
- [ ] Rétention 90 jours

---

#### 5.5 Documentation déploiement
**Fichier** : **nouveau** `DEPLOYMENT.md`

**Action** :
```markdown
# Guide Déploiement Production

## Prérequis
- Compte Vercel (gratuit)
- Projet Supabase (tier Pro recommandé)
- Domaine personnalisé (optionnel)

## Étapes

### 1. Supabase Setup
- Créer projet sur supabase.com
- Exécuter migrations SQL dans `supabase/migrations/`
- Activer Row Level Security (RLS)
- Copier URL + anon key

### 2. Vercel Deploy
- Connecter repo GitHub
- Configurer variables env (voir .env.example)
- Build command: `npm run build`
- Output directory: `dist`

### 3. Configuration Réseau
- IP imprimante fixe via DHCP
- Port 9100 ouvert sur firewall
- Tablettes sur même VLAN

### 4. Tests Pre-Prod
- Checklist validation (voir ROADMAP_PRODUCTION.md)
- Test charge 100 commandes/h
- Simulation coupure réseau

## Rollback
git revert HEAD
vercel --prod
```

**Validation** :
- [ ] Junior dev peut déployer en suivant doc
- [ ] Rollback testé et fonctionnel
- [ ] Hotfix déployable en <5min

---

### Critères de validation Sprint 5
- ✅ App déployée sur Vercel avec custom domain
- ✅ PWA installée sur 3 tablettes test
- ✅ Monitoring Sentry actif et alertant
- ✅ Backup quotidien fonctionnel et testé
- ✅ Documentation complète pour maintenance

---

## 📋 CHECKLIST FINALE PRÉ-PRODUCTION

### Sécurité
- [ ] Aucune clé API dans code source
- [ ] PIN vérifiés côté serveur uniquement
- [ ] HTTPS forcé (HSTS activé)
- [ ] Row Level Security Supabase activé
- [ ] Auto-lock après 2 min inactivité
- [ ] Permissions rôles testées (SERVER ne peut pas accéder Dashboard)

### Métier
- [ ] Déstockage automatique implémenté et testé
- [ ] Calcul PMP fonctionnel
- [ ] Stock ne peut pas devenir négatif
- [ ] Vente bloquée si ingrédient manquant
- [ ] Recettes correctement configurées (3 produits test)

### Financier
- [ ] Z-Report PDF générable
- [ ] TVA calculée par taux (5.5%, 10%, 20%)
- [ ] Écarts caisse tracés avec variance
- [ ] Audit log annulations complet
- [ ] Export comptable CSV validé

### Technique
- [ ] Temps réel <2s latence
- [ ] Reconnexion auto après coupure
- [ ] Gestion conflits sans perte données
- [ ] Impression tickets cuisine OK
- [ ] PWA installable sur iPad
- [ ] Logs Sentry actifs
- [ ] Backup quotidien testé

### UX
- [ ] Toasts confirmation sur toutes actions
- [ ] UI fluide avec 100+ commandes
- [ ] Pas de lag lors modifications
- [ ] Validé par serveur non-tech
- [ ] Mode landscape tablette optimal

### Performance
- [ ] Pagination commandes (50/page)
- [ ] Debouncing sauvegardes
- [ ] Cache Service Worker
- [ ] Lighthouse score >90
- [ ] Taille bundle <500KB

---

## 🚨 POINTS BLOQUANTS ABSOLUS

**Ne PAS déployer en production si** :
1. ❌ Auth encore côté client
2. ❌ Déstockage non implémenté
3. ❌ Clés API dans le code
4. ❌ Pas de Z-Report fonctionnel
5. ❌ Temps réel non testé avec 2 devices

---

## 📊 MÉTRIQUES DE SUCCÈS POST-DÉPLOIEMENT

**Jour J+7** :
- Uptime >99%
- 0 perte de commande
- Écarts caisse <2%
- Temps réponse API <500ms
- 0 erreur critique Sentry

**Jour J+30** :
- 0 incident sécurité
- Satisfaction staff >4/5
- Réduction erreurs caisse -70%
- Adoption PWA 100% équipe

---

## 🔄 ROADMAP POST-V1

**Phase 2 (V1.1)** :
- KDS écran sans papier
- Mode offline complet (queue sync)
- Multi-sites (chaînes)
- API webhooks partenaires

**Phase 3 (V1.2)** :
- Prédictions stock (ML)
- Intégration comptable (Pennylane)
- Module RH (plannings)
- Certification fiscale NF525

---

## 📞 SUPPORT & MAINTENANCE

**Incidents Critiques** :
- Hotline : +33 X XX XX XX XX
- Email : support@smartfood.app
- Slack : #incidents-prod

**Monitoring** :
- Sentry : errors.smartfood.app
- Uptime : status.smartfood.app
- Supabase : dashboard.supabase.com

**Escalade** :
1. Support L1 (chat) : <30min
2. Support L2 (dev) : <2h
3. Support L3 (CTO) : <4h

---

**Document généré par audit Claude Code**
**Version** : 1.0.0
**Date** : 2025-12-25
**Prochaine révision** : Après Sprint 3
