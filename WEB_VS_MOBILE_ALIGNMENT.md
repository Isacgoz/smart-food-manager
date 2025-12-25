# 🔄 Analyse Alignement Web ↔ Mobile

## État Actuel : Résumé

### ✅ Ce qui est ALIGNÉ

| Fonctionnalité | Web | Mobile | Sync Temps Réel |
|----------------|-----|--------|-----------------|
| **Types partagés** | ✅ | ✅ | N/A |
| **Logique métier** (`/shared/services/business.ts`) | ✅ | ✅ | N/A |
| **Auth PIN offline** (`/shared/services/auth.ts`) | ✅ | ✅ | N/A |
| **Multi-tenant** (restaurantId) | ✅ | ✅ | ✅ |
| **Supabase sync** (WebSocket) | ✅ | ✅ | ✅ |
| **Login restaurant** (SaaS) | ✅ | ✅ | N/A |
| **Login serveur** (PIN) | ✅ | ✅ | N/A |
| **Prise commande POS** | ✅ | ✅ | ✅ |
| **Déstockage automatique** | ✅ | ✅ | ✅ |
| **Gestion tables** | ✅ | ✅ | ✅ |
| **Écran Cuisine (KDS)** | ✅ | ❌ | - |
| **Offline-first** (LocalStorage/AsyncStorage) | ✅ PWA | ✅ AsyncStorage | - |

### ❌ Ce qui MANQUE sur Mobile (vs Web)

#### 1. **Module EBE & Charges** 🔴 CRITIQUE
**Web** :
- ✅ Page `/expenses` complète
- ✅ Types `Expense`, `EBECalculation`
- ✅ Service `expenses.ts` (calculs EBE)
- ✅ Dashboard avec indicateurs EBE

**Mobile** :
- ❌ Pas de types `Expense` (réexportés mais pas utilisés)
- ❌ Pas de store `expenses[]`
- ❌ Pas de service expenses
- ❌ Pas d'écran Charges

**Impact** :
- Serveur mobile **NE PEUT PAS** consulter charges/rentabilité
- Pas grave si rôle serveur = juste POS
- **MAIS** : Manager mobile voudra voir EBE

**Recommandation** :
- ✅ **OK pour serveur** : Pas besoin charges
- ⚠️ **À ajouter si Manager mobile** : Écran Dashboard avec EBE read-only

---

#### 2. **PWA/Offline Mode Avancé** 🟡 MOYEN
**Web** :
- ✅ Service Worker + Cache API
- ✅ Background Sync (queue commandes)
- ✅ IndexedDB pour pending orders
- ✅ UI NetworkStatus sophistiquée

**Mobile** :
- ✅ AsyncStorage (équivalent LocalStorage)
- ✅ Sync Supabase (mais pas queue offline)
- ❌ Pas de Background Sync natif
- ❌ Pas d'UI statut connexion

**Impact** :
- Mobile **PEUT** fonctionner offline (AsyncStorage)
- **MAIS** : Si perte connexion pendant commande, **pas de queue automatique**
- Commande risque d'être perdue si app fermée avant sync

**Recommandation** :
- 🔧 Ajouter queue offline mobile (voir solution ci-dessous)

---

#### 3. **Analytics Avancées** 🟢 FAIBLE PRIORITÉ
**Web** :
- ✅ `analytics.ts` (ABC, comparaisons périodes, etc.)
- ✅ Dashboard détaillé

**Mobile** :
- ❌ Pas d'analytics
- ❌ Dashboard simplifié ou absent

**Impact** :
- Serveur mobile n'a pas besoin de stats avancées
- Stats = rôle manager/owner (usage desktop prioritaire)

**Recommandation** :
- ✅ **OK pour V1 mobile** : Stats uniquement sur web

---

#### 4. **Écran Cuisine (KDS)** 🟡 MOYEN
**Web** :
- ✅ Page `/kitchen` complète
- ✅ Mise à jour statut commandes
- ✅ WebSocket temps réel

**Mobile** :
- ❌ Pas d'écran KDS

**Impact** :
- Cuisinier **NE PEUT PAS** utiliser mobile pour voir commandes
- Besoin tablette fixe (web PWA) OU app mobile KDS

**Recommandation** :
- 📱 Ajouter écran KDS mobile (optionnel pour rôle COOK)

---

## Alignement Offline : Détails Techniques

### Architecture Actuelle

#### **Web (PWA)**
```
User offline → Commande créée
  ↓
IndexedDB.add('pending-orders', order)
  ↓
Service Worker enregistre sync tag
  ↓
[User attend reconnexion...]
  ↓
Event 'online' détecté
  ↓
Service Worker sync → POST Supabase
  ↓
IndexedDB.delete('pending-orders', order.id)
```

#### **Mobile (React Native)**
```
User offline → Commande créée
  ↓
AsyncStorage.setItem('data', { orders: [...] })
  ↓
[User attend reconnexion...]
  ↓
App relancée OU polling manuel
  ↓
Supabase.upsert(data) ⚠️ SI APP OUVERTE
  ↓
AsyncStorage updated
```

**Problème Mobile** :
- ❌ Si app **fermée** après création commande offline
- ❌ Et user **ne rouvre pas l'app** avant que gérant web supprime commande
- 🔥 **Commande perdue** (pas dans Supabase, écrasée par sync descendant)

---

### Solution Recommandée : Queue Offline Mobile

#### Option A : AsyncStorage Queue (Simple) ⭐ RECOMMANDÉ

**Principe** :
```typescript
// mobile/services/offlineQueue.ts

interface QueuedAction {
  id: string;
  type: 'CREATE_ORDER' | 'UPDATE_ORDER' | 'UPDATE_KITCHEN_STATUS';
  payload: any;
  timestamp: string;
  retries: number;
}

export const queueAction = async (action: Omit<QueuedAction, 'id' | 'timestamp' | 'retries'>) => {
  const queue = await getQueue();
  queue.push({
    ...action,
    id: generateId(),
    timestamp: new Date().toISOString(),
    retries: 0
  });
  await AsyncStorage.setItem('offline_queue', JSON.stringify(queue));
};

export const processQueue = async () => {
  const queue = await getQueue();

  for (const action of queue) {
    try {
      // Envoyer à Supabase selon type
      if (action.type === 'CREATE_ORDER') {
        await supabase.from('app_state').upsert({ /* ... */ });
      }

      // Supprimer de la queue
      await removeFromQueue(action.id);
    } catch (error) {
      // Incrémenter retries
      action.retries += 1;
      if (action.retries > 3) {
        // Alerter user ou logger
        await removeFromQueue(action.id);
      }
    }
  }
};
```

**Usage** :
```typescript
// Dans createOrder()
if (!isOnline) {
  await queueAction({
    type: 'CREATE_ORDER',
    payload: { order, ingredients, products }
  });
}

// Au retour online (AppState listener)
AppState.addEventListener('change', (state) => {
  if (state === 'active' && isOnline) {
    processQueue();
  }
});
```

**Avantages** :
- ✅ Simple (AsyncStorage uniquement)
- ✅ Fonctionne même app fermée (AsyncStorage persistant)
- ✅ Retry automatique

**Inconvénients** :
- ⚠️ Nécessite app ouverte pour process queue
- ⚠️ Pas de Background Task natif React Native

---

#### Option B : Background Fetch API (Avancé)

**React Native Background Fetch** :
```bash
npm install react-native-background-fetch
```

**Principe** :
```typescript
import BackgroundFetch from 'react-native-background-fetch';

BackgroundFetch.configure({
  minimumFetchInterval: 15, // minutes
  stopOnTerminate: false,
  startOnBoot: true
}, async (taskId) => {
  console.log('[BackgroundFetch] Start');
  await processQueue();
  BackgroundFetch.finish(taskId);
});
```

**Avantages** :
- ✅ Fonctionne app fermée
- ✅ Sync périodique automatique

**Inconvénients** :
- ⚠️ Dépendance native (iOS/Android config)
- ⚠️ Consommation batterie
- ⚠️ Limites OS (max 15min interval)

---

## Recommandations par Rôle Mobile

### **Serveur (SERVER)** - Priorité 1 ✅
**Fonctionnalités nécessaires** :
- ✅ Login PIN ← **Déjà OK**
- ✅ Prise commande POS ← **Déjà OK**
- ✅ Gestion tables ← **Déjà OK**
- ✅ Offline avec queue ← **À AJOUTER** (Option A)

**À ajouter** :
1. 🔧 Queue offline AsyncStorage
2. 🔧 UI badge connexion (simple)
3. 🔧 Notification sync réussie

---

### **Cuisinier (COOK)** - Priorité 2 ⚠️
**Fonctionnalités nécessaires** :
- ❌ Écran KDS ← **MANQUE**
- ❌ Mise à jour statut commandes ← **MANQUE**

**À ajouter** :
1. 📱 Nouveau screen `KitchenScreen.tsx`
2. 🔧 Liste commandes par statut (QUEUED, PREPARING, READY)
3. 🔧 Boutons action rapide (Préparer, Prêt, Servi)

---

### **Manager (MANAGER)** - Priorité 3 🔵
**Fonctionnalités souhaitables** :
- ❌ Dashboard EBE ← **MANQUE**
- ❌ Consultation charges ← **MANQUE**
- ❌ Statistiques ← **MANQUE**

**À ajouter** :
1. 📊 Screen Dashboard read-only (EBE, CA, marges)
2. 📋 Screen Expenses read-only (liste charges)

---

## Plan d'Action Mobile

### **Phase Mobile 1 : Offline Robuste** (2-3h) 🔴 URGENT
- [ ] Créer `mobile/services/offlineQueue.ts`
- [ ] Implémenter `queueAction()` et `processQueue()`
- [ ] Modifier `createOrder()` pour utiliser queue si offline
- [ ] Ajouter listener AppState pour auto-process
- [ ] Tester : Créer commande offline → Fermer app → Rouvrir → Vérifier sync

### **Phase Mobile 2 : UI Connexion** (1h) 🟡 IMPORTANT
- [ ] Créer composant `NetworkBadge.tsx` (simple)
- [ ] Hook `useNetInfo` (react-native-community/netinfo)
- [ ] Badge coin haut-droit : 🟢 Online / 🔴 Offline
- [ ] Notification toast "Synchronisation réussie"

### **Phase Mobile 3 : Écran Cuisine** (3-4h) 🟢 OPTIONNEL
- [ ] Créer `screens/KitchenScreen.tsx`
- [ ] Tabs : En attente / En cours / Prêt
- [ ] Boutons action rapide
- [ ] WebSocket temps réel (déjà dans store)
- [ ] Filtrage par rôle (si COOK, rediriger vers KDS au lieu de POS)

### **Phase Mobile 4 : Dashboard Manager** (4-5h) 🔵 FUTUR
- [ ] Créer `screens/DashboardScreen.tsx`
- [ ] Réutiliser `calculateEBE()` du web
- [ ] Affichage read-only indicateurs
- [ ] Graphiques simples (react-native-chart-kit)

---

## Comparaison Stockage Offline

| Aspect | Web PWA | Mobile React Native |
|--------|---------|---------------------|
| **Storage principal** | LocalStorage | AsyncStorage |
| **Capacité** | ~10 MB | ~6 MB (Android), illimité iOS |
| **Queue offline** | IndexedDB (illimité) | AsyncStorage (limité) |
| **Background Sync** | Service Worker ✅ | Background Fetch (lib externe) |
| **Persistance** | Permanent (cache) | Permanent |
| **Multi-tab sync** | BroadcastChannel ✅ | N/A (single instance) |
| **Encryption** | Pas natif | react-native-encrypted-storage |

---

## Checklist Alignement Final

### Must-Have (V1 Mobile) ✅
- [x] Types partagés
- [x] Logique métier partagée
- [x] Auth PIN offline
- [x] POS commandes
- [x] Sync Supabase WebSocket
- [ ] **Queue offline robuste** ← **À FAIRE**
- [ ] **UI statut connexion** ← **À FAIRE**

### Should-Have (V1.5 Mobile) ⚠️
- [ ] Écran Cuisine (KDS)
- [ ] Gestion rôles (redirection auto selon rôle)
- [ ] Notifications push (commandes)

### Nice-to-Have (V2 Mobile) 🔵
- [ ] Dashboard Manager
- [ ] Consultation charges
- [ ] Statistiques basiques
- [ ] Export CSV mobile

---

## Code Exemple : Queue Offline Mobile

```typescript
// mobile/services/offlineQueue.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './storage';

const QUEUE_KEY = 'offline_queue';

interface QueuedAction {
  id: string;
  type: 'CREATE_ORDER' | 'UPDATE_KITCHEN_STATUS';
  payload: any;
  timestamp: string;
  retries: number;
}

export const getQueue = async (): Promise<QueuedAction[]> => {
  const json = await AsyncStorage.getItem(QUEUE_KEY);
  return json ? JSON.parse(json) : [];
};

export const queueAction = async (type: QueuedAction['type'], payload: any) => {
  const queue = await getQueue();
  queue.push({
    id: `queue_${Date.now()}`,
    type,
    payload,
    timestamp: new Date().toISOString(),
    retries: 0
  });
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  console.log('[Queue] Action queued:', type);
};

export const processQueue = async () => {
  const queue = await getQueue();
  if (queue.length === 0) return;

  console.log('[Queue] Processing', queue.length, 'actions');
  const remaining: QueuedAction[] = [];

  for (const action of queue) {
    try {
      // Exécuter selon type
      if (action.type === 'CREATE_ORDER') {
        const { restaurantId, order, updatedIngredients, movements } = action.payload;

        // Charger state actuel
        const { data } = await supabase
          .from('app_state')
          .select('data')
          .eq('id', restaurantId)
          .single();

        if (data) {
          const currentState = data.data;

          // Merger commande
          const updatedOrders = [...currentState.orders, order];
          const updatedState = {
            ...currentState,
            orders: updatedOrders,
            ingredients: updatedIngredients,
            movements: [...currentState.movements, ...movements],
            _lastUpdatedAt: Date.now()
          };

          // Upsert
          await supabase
            .from('app_state')
            .update({ data: updatedState })
            .eq('id', restaurantId);

          console.log('[Queue] Action synced:', action.id);
        }
      }
    } catch (error) {
      console.error('[Queue] Sync failed:', action.id, error);
      action.retries += 1;

      if (action.retries < 3) {
        remaining.push(action);
      } else {
        console.error('[Queue] Max retries, dropping:', action.id);
      }
    }
  }

  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  console.log('[Queue] Remaining:', remaining.length);
};
```

**Usage dans store.tsx** :
```typescript
import { queueAction, processQueue } from './services/offlineQueue';
import NetInfo from '@react-native-community/netinfo';

// Dans createOrder()
const createOrder = async (items, tableId) => {
  const order = { /* ... */ };
  const { updatedIngredients, movements } = destockIngredients(/* ... */);

  // Vérifier connexion
  const netInfo = await NetInfo.fetch();

  if (!netInfo.isConnected) {
    // Offline : Queue
    await queueAction('CREATE_ORDER', {
      restaurantId: restaurant.id,
      order,
      updatedIngredients,
      movements
    });

    // Mettre à jour state local immédiatement
    setData(prev => ({
      ...prev,
      orders: [...prev.orders, order],
      ingredients: updatedIngredients,
      movements: [...prev.movements, ...movements]
    }));

    notify('Commande enregistrée (sera synchronisée)');
  } else {
    // Online : Direct
    await saveState(restaurant.id, { /* ... */ });
  }
};

// Listener reconnexion
useEffect(() => {
  const unsubscribe = NetInfo.addEventListener(state => {
    if (state.isConnected) {
      processQueue();
    }
  });

  return unsubscribe;
}, []);
```

---

## Conclusion

### ✅ **Alignement Actuel : 70%**

**Excellent pour** :
- Types & logique métier partagés
- Sync temps réel Supabase
- Fonctionnalités POS core

**À améliorer** :
- ⚠️ Queue offline mobile (critique)
- ⚠️ UI statut connexion
- 🔵 Écran KDS (optionnel rôle COOK)
- 🔵 Dashboard mobile (optionnel rôle MANAGER)

### 🎯 **Priorité Immédiate**

**Pour usage Serveur mobile robuste** :
1. **Queue offline AsyncStorage** (2-3h dev)
2. **Badge connexion simple** (1h dev)
3. **Tests offline** : Créer 5 commandes offline → Sync → Vérifier

**Résultat attendu** :
- ✅ Serveur mobile fonctionne 100% offline
- ✅ Sync automatique garantie
- ✅ Pas de perte données si app fermée

---

**Veux-tu que je code la queue offline mobile maintenant ?**
