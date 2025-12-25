# 🔄 ROADMAP SYNCHRONISATION WEB ↔ MOBILE

**Objectif** : Unifier le code et appliquer toutes les corrections critiques au mobile
**Durée estimée** : 3-4 jours
**Priorité** : 🔴 CRITIQUE

---

## 🎯 Stratégie : Code Partagé (Shared Logic)

### Principe
- **1 seule implémentation** de la logique métier
- Web et Mobile **importent** le même code
- Différences UI seulement (React vs React Native)

### Architecture Cible

```
/shared                    ← Code TypeScript pur (plateforme-agnostique)
  /services
    - auth.ts              ← Vérification PIN, hash
    - business.ts          ← Déstockage, PMP, validations
    - sync.ts              ← Supabase WebSocket
    - printer.ts           ← ESC/POS (adaptateurs web/mobile)
    - reports.ts           ← Calculs TVA, Z-Report
  /hooks
    - useAutoLock.ts       ← Timer inactivité
  /types
    - index.ts             ← Types communs (User, Order, etc.)
  /utils
    - validation.ts        ← Stock validation, prix
    - pmp.ts               ← Calcul Prix Moyen Pondéré
    - conflicts.ts         ← Merge versions optimiste

/web                       ← Spécifique React Web
  /pages
  /components
  /App.tsx

/mobile                    ← Spécifique React Native
  /screens
  /components
  /App.tsx
```

---

## 📋 SPRINT MOBILE (3-4 jours)

### JOUR 1 : Refactoring Architecture

#### ✅ Tâche 1.1 : Créer `/shared`
```bash
mkdir -p shared/{services,hooks,types,utils}
```

#### ✅ Tâche 1.2 : Déplacer fichiers communs
```bash
# Depuis /web vers /shared
mv services/auth.ts shared/services/
mv services/reports.ts shared/services/
mv hooks/useAutoLock.ts shared/hooks/
mv types.ts shared/types/index.ts
```

#### ✅ Tâche 1.3 : Créer `shared/services/business.ts`
**Contenu** : Extraire logique métier du `store.tsx` web
- `validateStockBeforeOrder()`
- `destockIngredients()`
- `calculatePMP()`
- `createOrderWithBusiness()`

**Signature** :
```typescript
export const validateStockBeforeOrder = (
  items: OrderItem[],
  products: Product[],
  ingredients: Ingredient[]
): { valid: boolean; errors: string[] };

export const destockIngredients = (
  items: OrderItem[],
  products: Product[],
  ingredients: Ingredient[]
): { updatedIngredients: Ingredient[]; movements: StockMovement[] };

export const calculatePMP = (
  ingredient: Ingredient,
  quantityReceived: number,
  unitCost: number
): number;
```

---

### JOUR 2 : Appliquer Corrections au Mobile

#### ✅ Tâche 2.1 : Auth Sécurisée Mobile
**Fichier** : `mobile/store.tsx`

**Remplacer** :
```typescript
// ❌ AVANT (ligne 97)
const loginUser = (pin: string) => {
  const user = data.users.find((u: User) => u.pin === pin);
  if (user) {
    setCurrentUser(user);
    return true;
  }
  return false;
};
```

**Par** :
```typescript
// ✅ APRÈS
import { verifyPIN, verifyPINOffline } from '../../shared/services/auth';

const loginUser = async (pin: string) => {
  if (!restaurant) return false;

  // Vérification serveur prioritaire
  const result = await verifyPIN(restaurant.id, selectedUserId, pin);

  // Fallback offline
  const finalResult = result.success
    ? result
    : await verifyPINOffline(data.users, selectedUserId, pin);

  if (finalResult.success) {
    setCurrentUser(finalResult.user);
    return true;
  }
  return false;
};
```

---

#### ✅ Tâche 2.2 : Déstockage Automatique Mobile
**Fichier** : `mobile/store.tsx`

**Remplacer** `createOrder()` ligne 108 :
```typescript
// ❌ AVANT
const createOrder = async (items: OrderItem[], tableId?: string) => {
  const orderId = generateId();
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const newOrder: Order = {
    id: orderId,
    number: (data.orders || []).length + 1,
    items,
    total,
    status: 'PENDING',
    date: new Date().toISOString(),
    tableId,
    userId: currentUser?.id || 'unknown'
  };

  setData((prev: any) => ({ ...prev, orders: [...prev.orders, newOrder] }));
  return orderId;
};
```

**Par** :
```typescript
// ✅ APRÈS
import {
  validateStockBeforeOrder,
  destockIngredients
} from '../../shared/services/business';

const createOrder = async (items: OrderItem[], tableId?: string) => {
  // 1. VALIDATION STOCK
  const validation = validateStockBeforeOrder(items, data.products, data.ingredients);
  if (!validation.valid) {
    Alert.alert('Stock Insuffisant', validation.errors.join('\n'));
    return null;
  }

  // 2. DÉSTOCKAGE AUTOMATIQUE
  const { updatedIngredients, movements } = destockIngredients(
    items,
    data.products,
    data.ingredients
  );

  // 3. CRÉATION COMMANDE
  const orderId = generateId();
  const now = new Date().toISOString();

  const newOrder: Order = {
    id: orderId,
    number: (data.orders || []).length + 1,
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

  // 4. UPDATE STATE
  setData((prev: any) => ({
    ...prev,
    orders: [...prev.orders, newOrder],
    ingredients: updatedIngredients,
    movements: [...prev.movements, ...movements]
  }));

  // 5. IMPRESSION TICKET (si imprimante Bluetooth)
  if (printerAvailable) {
    printOrder(newOrder, restaurant.name, 'kitchen');
  }

  return orderId;
};
```

---

#### ✅ Tâche 2.3 : Variables Env Mobile
**Fichier** : `mobile/services/storage.ts`

**Remplacer** lignes 6-7 :
```typescript
// ❌ AVANT
const SUPABASE_URL = '';
const SUPABASE_KEY = '';
```

**Par** (utiliser `react-native-dotenv`) :
```typescript
// ✅ APRÈS
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

if (!supabase) {
  console.warn('[MOBILE] Mode offline - Supabase non configuré');
}
```

**Installer** :
```bash
npm install react-native-dotenv
```

**Créer** `.env.mobile` :
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
PRINTER_BLUETOOTH_NAME=TM-T20II
```

---

#### ✅ Tâche 2.4 : Auto-Lock Mobile
**Fichier** : `mobile/App.tsx`

```typescript
import { useAutoLock } from '../shared/hooks/useAutoLock';
import { AppState } from 'react-native';

const MobileApp = () => {
  const { logoutUser } = useMobileStore();

  // Auto-lock après 2 min
  useAutoLock(logoutUser, 120000);

  // Lock quand app passe en arrière-plan
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'background') {
        setTimeout(logoutUser, 30000); // 30s en background → lock
      }
    });
    return () => subscription.remove();
  }, [logoutUser]);

  return <NavigationContainer>...</NavigationContainer>;
};
```

---

#### ✅ Tâche 2.5 : Conflits Temps Réel Mobile
**Fichier** : `mobile/store.tsx`

**Ajouter WebSocket sync** :
```typescript
import { supabase } from './services/storage';

useEffect(() => {
  if (!supabase || !restaurant?.id) return;

  const channel = supabase
    .channel(`mobile_sync_${restaurant.id}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'app_state',
      filter: `id=eq.${restaurant.id}`
    }, (payload: any) => {
      const newData = payload.new.data;
      setData(prev => {
        // Merge intelligent avec versions
        const mergedOrders = mergeOrders(prev.orders, newData.orders);
        return { ...newData, orders: mergedOrders };
      });
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, [restaurant?.id]);
```

---

### JOUR 3 : Fonctionnalités Mobiles Spécifiques

#### ✅ Tâche 3.1 : Impression Bluetooth
**Fichier** : `shared/services/printer.ts`

**Ajouter adaptateur mobile** :
```typescript
import { Platform } from 'react-native';
import BluetoothSerial from 'react-native-bluetooth-serial-next';

export const printOrderMobile = async (
  order: Order,
  restaurantName: string
): Promise<boolean> => {
  if (Platform.OS === 'web') {
    return printToNetwork(ticketData, printerIP);
  }

  // Mobile: Bluetooth
  try {
    const ticket = formatKitchenTicket(order, restaurantName);
    await BluetoothSerial.write(ticket);
    return true;
  } catch (err) {
    console.error('[MOBILE] Print failed:', err);
    return false;
  }
};
```

**Installer** :
```bash
npm install react-native-bluetooth-serial-next
```

---

#### ✅ Tâche 3.2 : Scan QR Code Table
**Fichier** : `mobile/screens/TableScanScreen.tsx`

```typescript
import { BarCodeScanner } from 'expo-barcode-scanner';

const TableScanScreen = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const { setSelectedTable } = useMobileStore();

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ data }) => {
    // QR Code format: "TABLE_12" ou "T-Terrasse-3"
    const tableId = parseTableQR(data);
    setSelectedTable(tableId);
    navigation.navigate('POS');
  };

  return (
    <BarCodeScanner
      onBarCodeScanned={handleBarCodeScanned}
      style={StyleSheet.absoluteFillObject}
    />
  );
};
```

---

#### ✅ Tâche 3.3 : Mode Offline Robuste
**Fichier** : `shared/services/sync.ts`

```typescript
import NetInfo from '@react-native-community/netinfo';

export class OfflineQueue {
  private queue: Array<{ action: string; data: any }> = [];

  async add(action: string, data: any) {
    this.queue.push({ action, data, timestamp: Date.now() });
    await AsyncStorage.setItem('offline_queue', JSON.stringify(this.queue));
  }

  async flush() {
    const isOnline = await NetInfo.fetch().then(state => state.isConnected);
    if (!isOnline || this.queue.length === 0) return;

    for (const item of this.queue) {
      try {
        await supabase.from('app_state').upsert(item.data);
        this.queue = this.queue.filter(q => q !== item);
      } catch (err) {
        console.error('[SYNC] Failed:', err);
        break; // Retry later
      }
    }

    await AsyncStorage.setItem('offline_queue', JSON.stringify(this.queue));
  }
}

// Auto-flush quand réseau revient
NetInfo.addEventListener(state => {
  if (state.isConnected) {
    offlineQueue.flush();
  }
});
```

---

### JOUR 4 : Tests & Validation

#### ✅ Checklist Tests Mobile

**Auth** :
- [ ] Login PIN serveur fonctionne
- [ ] Fallback offline si pas réseau
- [ ] Hash PIN jamais visible

**Déstockage** :
- [ ] Vente burger → stock pain décrément
- [ ] Blocage si stock insuffisant
- [ ] Mouvements tracés

**Sync Temps Réel** :
- [ ] Commande web → apparaît mobile <2s
- [ ] Commande mobile → apparaît web <2s
- [ ] Pas de perte données si 2 devices

**Offline** :
- [ ] Mode avion → app continue
- [ ] Retour réseau → sync auto
- [ ] Queue persist entre redémarrages

**Impression** :
- [ ] Bluetooth imprimante détectée
- [ ] Ticket ESC/POS correct
- [ ] Fallback si imprimante off

**Auto-Lock** :
- [ ] 2min inactivité → lock
- [ ] App background → lock 30s

---

## 📦 Configuration Package.json Mobile

```json
{
  "name": "smart-food-mobile",
  "dependencies": {
    "react-native": "^0.73.0",
    "@react-native-async-storage/async-storage": "^1.21.0",
    "@supabase/supabase-js": "^2.39.3",
    "react-native-bluetooth-serial-next": "^1.1.3",
    "react-native-dotenv": "^3.4.9",
    "@react-native-community/netinfo": "^11.0.0",
    "expo-barcode-scanner": "^12.0.0"
  },
  "devDependencies": {
    "@types/react-native": "^0.73.0"
  }
}
```

---

## 🎯 Résultat Final

### Avant
```
❌ Code dupliqué web ≠ mobile
❌ 14 problèmes critiques mobile
❌ Logique métier manquante
❌ Sync temps réel absent
```

### Après
```
✅ 1 seule source de vérité (/shared)
✅ 14 problèmes résolus web + mobile
✅ Auto-sync bidirectionnel
✅ Mode offline robuste
✅ Fonctionnalités mobiles (BT, QR)
```

---

## 📊 Impact Business

| Cas d'usage | Avant | Après |
|-------------|-------|-------|
| Serveur prend commande tablette | ⚠️ Stock pas mis à jour | ✅ Déstockage auto |
| Cuisinier check écran cuisine | ❌ Pas sync | ✅ Temps réel <2s |
| Gérant clôture journée | ❌ Export manuel | ✅ Z-Report 1 clic |
| Coupure WiFi 10min | ❌ App bloquée | ✅ Queue offline |
| Staff oublie logout | ❌ Session ouverte | ✅ Auto-lock 2min |

---

## 🚀 Déploiement Mobile

### iOS (TestFlight)
```bash
cd mobile
npx expo build:ios
# Upload vers App Store Connect
```

### Android (Google Play)
```bash
cd mobile
npx expo build:android
# Upload vers Play Console
```

### OTA Updates (Expo)
```bash
npx expo publish
# Push instant sans réinstall
```

---

**Document créé** : 2025-12-25
**Prochaine révision** : Après Sprint Mobile (J+4)
