# 📊 RAPPORT AUDIT EXHAUSTIF - SMART FOOD MANAGER
## PARTIE 2 : MODULES FONCTIONNELS & FLUX MÉTIER

---

## 📦 MODULES FONCTIONNELS DÉTAILLÉS

L'application est composée de **15 pages** et **11 services métier**. Chaque module est interconnecté pour automatiser la gestion complète du restaurant.

---

### 🎯 MODULE 1 : DASHBOARD (Tableau de Bord)

**Fichier :** `src/pages/Dashboard.tsx` (492 lignes)
**Rôle :** Vision financière temps réel du restaurant
**Accès :** OWNER, MANAGER uniquement

#### Fonctionnalités

**A. Indicateurs Clés (KPI Cards)**
```typescript
// Calculs automatiques
const metrics = {
  totalSales: orders.reduce((sum, o) => sum + o.total, 0),      // CA total
  totalOrders: orders.length,                                    // Nombre commandes
  averageTicket: totalSales / totalOrders,                       // Panier moyen
  completedOrders: orders.filter(o => o.status === 'CLOSED').length
};
```

**Affichage :**
```
┌────────────────┬────────────────┬────────────────┬────────────────┐
│ Chiffre        │ Commandes      │ Panier         │ Commandes      │
│ d'Affaires     │ Total          │ Moyen          │ Terminées      │
│ 15 842,50€     │ 347            │ 45,67€         │ 298            │
│ +12% vs hier   │ +8% vs hier    │ -2% vs hier    │ 85% complété   │
└────────────────┴────────────────┴────────────────┴────────────────┘
```

**B. Graphique Évolution CA (Recharts)**
```typescript
// Données par jour sur 30 jours
const salesData = last30Days.map(date => ({
  date: format(date, 'dd/MM'),
  sales: orders
    .filter(o => isSameDay(o.createdAt, date))
    .reduce((sum, o) => sum + o.total, 0)
}));

<LineChart data={salesData}>
  <Line type="monotone" dataKey="sales" stroke="#10b981" />
  <XAxis dataKey="date" />
  <YAxis />
  <Tooltip />
</LineChart>
```

**C. Top Produits Vendus**
```typescript
// Aggrégation ventes par produit
const topProducts = products.map(product => ({
  name: product.name,
  quantity: orders
    .flatMap(o => o.items)
    .filter(item => item.productId === product.id)
    .reduce((sum, item) => sum + item.quantity, 0),
  revenue: orders
    .flatMap(o => o.items)
    .filter(item => item.productId === product.id)
    .reduce((sum, item) => sum + (item.price * item.quantity), 0)
}))
.sort((a, b) => b.revenue - a.revenue)
.slice(0, 10); // Top 10
```

**Affichage :**
```
Produit               Quantité    CA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🍔 Burger Classique    127      3 175€
🍟 Frites              98       1 470€
🥤 Coca-Cola           89         445€
```

**D. Alertes Stock Bas**
```typescript
// Ingrédients sous seuil minimum
const lowStockAlerts = ingredients.filter(ing =>
  ing.stock < ing.minStock && ing.minStock > 0
);

// Affichage badge rouge si alertes
{lowStockAlerts.length > 0 && (
  <div className="bg-red-50 border-l-4 border-red-500 p-4">
    ⚠️ {lowStockAlerts.length} ingrédient(s) en rupture
    <ul>
      {lowStockAlerts.map(ing => (
        <li key={ing.id}>
          {ing.name}: {ing.stock}{ing.unit} (min: {ing.minStock})
        </li>
      ))}
    </ul>
  </div>
)}
```

**E. Export Données**
```typescript
// services/export.ts
export const exportToCSV = (orders, startDate, endDate) => {
  const csv = orders.map(order => ({
    Date: format(order.createdAt, 'dd/MM/yyyy HH:mm'),
    'N° Commande': order.number,
    Client: order.customerName || 'Anonyme',
    Total: order.total.toFixed(2),
    Paiement: order.paymentMethod,
    Statut: order.status
  }));

  const blob = new Blob([toCSV(csv)], { type: 'text/csv' });
  saveAs(blob, `commandes_${format(startDate, 'yyyy-MM-dd')}.csv`);
};
```

**Technologies utilisées :**
- **Recharts 2.15.1** : Graphiques interactifs (10KB gzippé)
- **date-fns 4.1.0** : Manipulation dates (vs Moment.js 70KB)
- **file-saver 2.0.5** : Download fichiers côté client

---

### 🛒 MODULE 2 : POS (Point de Vente / Caisse)

**Fichier :** `src/pages/POS.tsx` (857 lignes)
**Rôle :** Interface de prise de commande (serveurs)
**Accès :** OWNER, MANAGER, SERVER

#### Architecture UI

```
┌────────────────────────────────────────────────────────────┐
│ HEADER : Table sélectionnée | Serveur | Total panier       │
├───────────────────┬────────────────────────────────────────┤
│ CATALOGUE         │ PANIER                                 │
│                   │                                        │
│ [Catégories]      │ Burger x2        19,80€  [🗑️]        │
│ 🍔 Burgers (12)   │ Frites           7,50€   [🗑️]        │
│ 🍟 Sides (8)      │ Coca             2,50€   [🗑️]        │
│ 🥤 Boissons (15)  │                                        │
│                   │ ─────────────────────────────          │
│ [Produits]        │ Total HT:       26,20€                 │
│ ┌─────┬─────┐     │ TVA 10%:         2,62€                 │
│ │ 🍔  │ 🍔  │     │ Total TTC:      28,82€                 │
│ │Clas │Chee │     │                                        │
│ │9,90€│11€  │     │ [💳 Payer]  [🖨️ Imprimer]            │
│ └─────┴─────┘     │                                        │
└───────────────────┴────────────────────────────────────────┘
```

#### Flux de Prise de Commande

**Étape 1 : Sélection Table (optionnel)**
```typescript
const [selectedTable, setSelectedTable] = useState<Table | null>(null);

// Filtrer tables disponibles
const availableTables = tables.filter(t => t.status === 'FREE');

<div className="grid grid-cols-4 gap-2">
  {availableTables.map(table => (
    <button
      onClick={() => setSelectedTable(table)}
      className={cn(
        "p-4 rounded-lg border-2",
        selectedTable?.id === table.id
          ? "border-green-500 bg-green-50"
          : "border-gray-300"
      )}
    >
      {table.name}
      <span className="text-sm text-gray-500">
        {table.capacity} couverts
      </span>
    </button>
  ))}
</div>
```

**Étape 2 : Ajout Produits au Panier**
```typescript
const [cart, setCart] = useState<CartItem[]>([]);

const addToCart = (product: Product) => {
  // Vérifier stock disponible AVANT ajout
  const stockCheck = validateStockAvailability(product, 1, ingredients);

  if (!stockCheck.available) {
    notify(`Stock insuffisant: ${stockCheck.missingIngredients.join(', ')}`, 'error');
    return;
  }

  // Trouver si produit déjà dans panier
  const existingIndex = cart.findIndex(item => item.productId === product.id);

  if (existingIndex >= 0) {
    // Incrémenter quantité
    const updated = [...cart];
    updated[existingIndex].quantity += 1;
    setCart(updated);
  } else {
    // Ajouter nouveau
    setCart([...cart, {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      notes: ''
    }]);
  }
};
```

**Étape 3 : Notes Personnalisées**
```typescript
const updateNotes = (index: number, notes: string) => {
  const updated = [...cart];
  updated[index].notes = notes;
  setCart(updated);
};

// UI
<textarea
  placeholder="Notes (ex: sans oignon, cuisson à point)"
  value={item.notes}
  onChange={(e) => updateNotes(index, e.target.value)}
  className="w-full text-sm border rounded p-2"
/>
```

**Étape 4 : Calcul Total avec TVA**
```typescript
const calculateTotals = (cart: CartItem[]) => {
  const subtotalHT = cart.reduce((sum, item) =>
    sum + (item.price * item.quantity), 0
  );

  // TVA restauration France : 10% (consommation sur place)
  const tva = subtotalHT * 0.10;
  const totalTTC = subtotalHT + tva;

  return { subtotalHT, tva, totalTTC };
};
```

**Étape 5 : Paiement**
```typescript
const handlePayment = async (method: 'CASH' | 'CARD') => {
  const { totalTTC } = calculateTotals(cart);

  // Créer commande (déclenche déstockage automatique)
  const order = await createOrder(
    cart,
    selectedTable?.id,
    method,
    currentUser.id
  );

  // Imprimer ticket cuisine
  if (order) {
    await printKitchenTicket(order);
  }

  // Reset panier
  setCart([]);
  setSelectedTable(null);

  notify('Commande validée !', 'success');
};
```

#### Gestion Espèces (Cash Drawer)

**Dialogue Rendu Monnaie :**
```typescript
const [cashReceived, setCashReceived] = useState<number>(0);
const change = cashReceived - totalTTC;

<div className="space-y-4">
  <div>
    <label>Total à payer</label>
    <input
      type="number"
      value={totalTTC.toFixed(2)}
      disabled
      className="text-2xl font-bold"
    />
  </div>

  <div>
    <label>Montant reçu</label>
    <input
      type="number"
      value={cashReceived}
      onChange={(e) => setCashReceived(parseFloat(e.target.value))}
      className="text-2xl"
      autoFocus
    />
  </div>

  {change > 0 && (
    <div className="bg-green-100 p-4 rounded-lg">
      <p className="text-lg">À rendre</p>
      <p className="text-3xl font-bold text-green-700">
        {change.toFixed(2)}€
      </p>
    </div>
  )}

  {change < 0 && (
    <div className="bg-red-100 p-4 rounded-lg">
      ❌ Montant insuffisant ({Math.abs(change).toFixed(2)}€ manquants)
    </div>
  )}
</div>
```

#### Raccourcis Clavier (Productivité)

```typescript
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    // F1-F12 : Produits favoris
    if (e.key >= 'F1' && e.key <= 'F12') {
      const index = parseInt(e.key.slice(1)) - 1;
      const favoriteProduct = favoriteProducts[index];
      if (favoriteProduct) addToCart(favoriteProduct);
    }

    // Enter : Valider paiement
    if (e.key === 'Enter' && cart.length > 0) {
      handlePayment('CARD');
    }

    // Escape : Vider panier
    if (e.key === 'Escape') {
      setCart([]);
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [cart, favoriteProducts]);
```

**Affichage aide :**
```
Raccourcis :
F1-F12  : Produits favoris
Enter   : Paiement CB
Escape  : Vider panier
```

---

### 🍳 MODULE 3 : CUISINE (Kitchen Display)

**Fichier :** `src/pages/Kitchen.tsx` (384 lignes)
**Rôle :** Affichage commandes temps réel pour cuisine
**Accès :** OWNER, MANAGER, SERVER, COOK

#### Interface

```
┌────────────────────────────────────────────────────────────┐
│ CUISINE - 5 commandes en attente                    [🔄]  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│ │ #2025-00047  │  │ #2025-00048  │  │ #2025-00049  │    │
│ │ Table 5      │  │ À emporter   │  │ Table 12     │    │
│ │ 14:23        │  │ 14:25        │  │ 14:27        │    │
│ │              │  │              │  │              │    │
│ │ 2x Burger    │  │ 1x Burger    │  │ 3x Frites    │    │
│ │   SANS OIGN. │  │ 1x Frites    │  │ 2x Coca      │    │
│ │ 1x Frites    │  │              │  │              │    │
│ │              │  │              │  │              │    │
│ │ [✅ Prêt]   │  │ [✅ Prêt]   │  │ [✅ Prêt]   │    │
│ └──────────────┘  └──────────────┘  └──────────────┘    │
└────────────────────────────────────────────────────────────┘
```

#### Statuts Commande

```typescript
type KitchenStatus =
  | 'PENDING'      // ⏳ En attente (vient d'arriver)
  | 'IN_PROGRESS'  // 🔥 En préparation
  | 'READY'        // ✅ Prête (servir)
  | 'SERVED';      // ✔️ Servie

const statusColors = {
  PENDING: 'bg-yellow-100 border-yellow-500',
  IN_PROGRESS: 'bg-orange-100 border-orange-500',
  READY: 'bg-green-100 border-green-500',
  SERVED: 'bg-gray-100 border-gray-300'
};
```

#### Mise à Jour Statut

```typescript
const updateKitchenStatus = async (orderId: string, status: KitchenStatus) => {
  // Mettre à jour via store
  await updateOrder(orderId, {
    kitchenStatus: status,
    updatedAt: new Date().toISOString()
  });

  // Notification serveur (via WebSocket)
  if (status === 'READY') {
    broadcastNotification({
      type: 'ORDER_READY',
      orderId,
      tableName: order.table?.name
    });
  }
};
```

#### Temps Écoulé (Alerte Retard)

```typescript
const getElapsedTime = (createdAt: string) => {
  const now = new Date();
  const created = new Date(createdAt);
  const diffMinutes = Math.floor((now - created) / 1000 / 60);

  if (diffMinutes > 20) return { text: `${diffMinutes} min`, color: 'text-red-600' };
  if (diffMinutes > 10) return { text: `${diffMinutes} min`, color: 'text-orange-600' };
  return { text: `${diffMinutes} min`, color: 'text-gray-600' };
};

// Affichage
<span className={getElapsedTime(order.createdAt).color}>
  {getElapsedTime(order.createdAt).text}
</span>
```

#### Impression Ticket Cuisine

**Format ESC/POS (services/printer.ts) :**
```typescript
export const printKitchenTicket = async (order: Order) => {
  const ticket = `
    ================================
           CUISINE
    ================================

    Commande : ${order.number}
    Table    : ${order.table?.name || 'À emporter'}
    Heure    : ${format(order.createdAt, 'HH:mm')}
    Serveur  : ${order.user.name}

    --------------------------------
    ${order.items.map(item => `
    ${item.quantity}x ${item.name}
    ${item.notes ? `   ⚠️  ${item.notes.toUpperCase()}` : ''}
    `).join('\n')}
    --------------------------------

    ${order.items.some(item => item.notes) ? '⚠️  ATTENTION MODIFICATIONS\n' : ''}

    ================================
  `;

  // Envoi à imprimante réseau (IP locale)
  await fetch(`http://${printerIP}:9100`, {
    method: 'POST',
    body: escPosEncode(ticket) // Conversion ESC/POS
  });
};
```

**Protocole ESC/POS :**
- `\x1B\x40` : Initialiser imprimante
- `\x1B\x45\x01` : Gras ON (modifications)
- `\x1B\x45\x00` : Gras OFF
- `\x1B\x61\x01` : Centrer texte
- `\x1D\x56\x00` : Couper papier

---

### 🪑 MODULE 4 : TABLES (Gestion Tables)

**Fichier :** `src/pages/Tables.tsx` (421 lignes)
**Rôle :** Vue d'ensemble statut tables restaurant
**Accès :** OWNER, MANAGER, SERVER

#### Plan de Salle

```
SALLE PRINCIPALE
┌─────┬─────┬─────┬─────┐
│  1  │  2  │  3  │  4  │
│ 🟢  │ 🔴  │ 🔴  │ 🟢  │
│ 4p  │ 2p  │ 4p  │ 6p  │
└─────┴─────┴─────┴─────┘

TERRASSE
┌─────┬─────┬─────┐
│  5  │  6  │  7  │
│ 🟡  │ 🟢  │ 🔴  │
│ 2p  │ 4p  │ 8p  │
└─────┴─────┴─────┘

Légende :
🟢 Libre (FREE)
🔴 Occupée (OCCUPIED)
🟡 À nettoyer (DIRTY)
🔵 Réservée (RESERVED)
```

#### Gestion Statuts

```typescript
const changeTableStatus = async (tableId: string, newStatus: TableStatus) => {
  await updateTable(tableId, { status: newStatus });

  // Logs pour traçabilité
  logger.info('Table status changed', {
    tableId,
    from: table.status,
    to: newStatus,
    userId: currentUser.id
  });
};

// Menu contextuel
<DropdownMenu>
  <DropdownMenuItem onClick={() => changeTableStatus(table.id, 'OCCUPIED')}>
    🔴 Marquer occupée
  </DropdownMenuItem>
  <DropdownMenuItem onClick={() => changeTableStatus(table.id, 'DIRTY')}>
    🟡 À nettoyer
  </DropdownMenuItem>
  <DropdownMenuItem onClick={() => changeTableStatus(table.id, 'FREE')}>
    🟢 Libérer
  </DropdownMenuItem>
</DropdownMenu>
```

#### Session Table (Durée Occupation)

```typescript
// Ouvrir session quand commande créée
const openTableSession = async (tableId: string, orderId: string) => {
  const session: TableSession = {
    id: generateId(),
    tableId,
    orderId,
    openedAt: new Date().toISOString(),
    closedAt: null,
    status: 'OPEN'
  };

  await createTableSession(session);
  await changeTableStatus(tableId, 'OCCUPIED');
};

// Fermer session quand paiement validé
const closeTableSession = async (sessionId: string) => {
  const session = sessions.find(s => s.id === sessionId);
  const duration = new Date() - new Date(session.openedAt);
  const durationMinutes = Math.floor(duration / 1000 / 60);

  await updateTableSession(sessionId, {
    closedAt: new Date().toISOString(),
    status: 'CLOSED',
    durationMinutes
  });

  await changeTableStatus(session.tableId, 'DIRTY');
};
```

#### Historique Occupation

```typescript
// Rapport occupation tables
const getOccupationReport = (startDate: Date, endDate: Date) => {
  const sessions = tableSessions.filter(s =>
    s.closedAt &&
    isWithinInterval(new Date(s.closedAt), { start: startDate, end: endDate })
  );

  return tables.map(table => {
    const tableSessions = sessions.filter(s => s.tableId === table.id);
    const totalMinutes = tableSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    const avgDuration = totalMinutes / tableSessions.length;

    return {
      tableName: table.name,
      totalReservations: tableSessions.length,
      totalMinutes,
      avgDuration: Math.round(avgDuration),
      revenue: tableSessions.reduce((sum, s) => {
        const order = orders.find(o => o.id === s.orderId);
        return sum + (order?.total || 0);
      }, 0)
    };
  });
};
```

---

### 📋 MODULE 5 : MENU (Catalogue Produits)

**Fichier :** `src/pages/Menu.tsx` (586 lignes)
**Rôle :** Gestion produits vendus + recettes
**Accès :** OWNER, MANAGER

#### Création Produit

**Formulaire :**
```typescript
interface ProductForm {
  name: string;
  category: string;
  price: number;
  description?: string;
  imageUrl?: string;
  available: boolean;
  recipe: RecipeItem[]; // ⚠️ CRITIQUE
}

interface RecipeItem {
  ingredientId: string;
  quantity: number;
  unit: string;
}
```

**UI Composition Recette :**
```
┌──────────────────────────────────────────────────┐
│ BURGER CLASSIQUE                                 │
├──────────────────────────────────────────────────┤
│ Nom        : Burger Classique                    │
│ Catégorie  : [Burgers ▼]                         │
│ Prix vente : 9,90€                                │
│ Image      : [📤 Upload]                         │
│                                                   │
│ RECETTE (Composition) :                          │
│ ┌────────────────────────────────────────────┐  │
│ │ Pain burger      1      pièce      [🗑️]  │  │
│ │ Steak haché      150    g          [🗑️]  │  │
│ │ Fromage cheddar  1      tranche    [🗑️]  │  │
│ │ Oignons          20     g          [🗑️]  │  │
│ │ Tomate           50     g          [🗑️]  │  │
│ │ Sauce burger     30     mL         [🗑️]  │  │
│ └────────────────────────────────────────────┘  │
│ [+ Ajouter ingrédient]                           │
│                                                   │
│ COÛT MATIÈRE CALCULÉ : 3,24€                     │
│ MARGE BRUTE         : 6,66€ (67,3%)              │
│ TAUX COÛT MATIÈRE   : 32,7%                      │
│                                                   │
│ [💾 Enregistrer]  [❌ Annuler]                  │
└──────────────────────────────────────────────────┘
```

#### Calcul Automatique Coût Matière

**Fichier :** `shared/services/business.ts` (lignes 45-67)

```typescript
/**
 * Calcule le coût matière d'un produit selon sa recette
 * Utilise le PMP (Prix Moyen Pondéré) de chaque ingrédient
 */
export const calculateProductCost = (
  recipe: RecipeItem[],
  ingredients: Ingredient[]
): number => {
  let totalCost = 0;

  recipe.forEach(recipeItem => {
    const ingredient = ingredients.find(i => i.id === recipeItem.ingredientId);

    if (!ingredient) {
      logger.warn('Ingredient not found in recipe', { ingredientId: recipeItem.ingredientId });
      return;
    }

    // Convertir quantité recette en unité de stock
    const quantityInStockUnit = convertUnit(
      recipeItem.quantity,
      recipeItem.unit,
      ingredient.unit
    );

    // Coût = PMP × Quantité
    const ingredientCost = ingredient.averageCost * quantityInStockUnit;
    totalCost += ingredientCost;
  });

  return totalCost;
};
```

**Exemple calcul Burger Classique :**
```
Ingrédient         Qté recette   PMP      Coût
──────────────────────────────────────────────
Pain burger        1 pièce       0,35€    0,35€
Steak haché        150g          8,50€/kg 1,28€
Fromage cheddar    1 tranche     0,42€    0,42€
Oignons            20g           2,20€/kg 0,04€
Tomate             50g           3,80€/kg 0,19€
Sauce burger       30mL          6,50€/L  0,20€
──────────────────────────────────────────────
TOTAL COÛT MATIÈRE                        2,48€

Prix vente HT : 9,90€
Marge brute   : 9,90 - 2,48 = 7,42€
Taux CM       : (2,48 / 9,90) × 100 = 25,1% ✅ (objectif <30%)
```

#### Gestion Images Produits

```typescript
const uploadProductImage = async (file: File): Promise<string> => {
  // Upload vers Supabase Storage
  const fileName = `${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(fileName, file);

  if (error) throw error;

  // Récupérer URL publique
  const { data: urlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
};
```

#### Catégories Prédéfinies

```typescript
const PRODUCT_CATEGORIES = [
  '🍔 Burgers',
  '🍕 Pizzas',
  '🥗 Salades',
  '🍟 Accompagnements',
  '🥤 Boissons Froides',
  '☕ Boissons Chaudes',
  '🍰 Desserts',
  '🍺 Alcools',
  '🎉 Menus'
] as const;
```

---

### 📦 MODULE 6 : STOCKS (Gestion Ingrédients)

**Fichier :** `src/pages/Stocks.tsx` (497 lignes)
**Rôle :** Suivi stock théorique ingrédients
**Accès :** OWNER, MANAGER

#### Vue Liste Stocks

```
Ingrédient          Stock     Unité   PMP      Valeur   Seuil
────────────────────────────────────────────────────────────────
Pain burger         45        pièce   0,35€    15,75€   20  ⚠️
Steak haché         12,5      kg      8,50€    106,25€  10  ✅
Fromage cheddar     28        tranche 0,42€    11,76€   15  ✅
Oignons             3,2       kg      2,20€    7,04€    5   ⚠️
Tomate              8,7       kg      3,80€    33,06€   5   ✅
Sauce burger        2,1       L       6,50€    13,65€   3   ⚠️
────────────────────────────────────────────────────────────────
VALEUR TOTALE STOCK                           187,51€
```

**Filtres :**
- ✅ Tous
- ⚠️ Stock bas (< seuil)
- ❌ Rupture (= 0)
- 📊 Par catégorie

#### Historique Mouvements

```typescript
// Table movements (migration 001)
interface Movement {
  id: string;
  companyId: string;
  ingredientId: string;
  type: 'PURCHASE' | 'SALE' | 'INVENTORY_ADJUSTMENT' | 'LOSS';
  quantity: number;     // + ou -
  date: string;
  documentRef?: string; // ID commande/BR/inventaire
  notes?: string;
  userId: string;
}
```

**Affichage Timeline :**
```
📅 07/01/2026 14:32 - Pain burger
   Type      : VENTE (Commande #2025-00047)
   Quantité  : -2 pièces
   Stock     : 47 → 45

📅 07/01/2026 09:15 - Pain burger
   Type      : ACHAT (BR-2026-0012)
   Quantité  : +50 pièces
   Stock     : -3 → 47
   PMP       : 0,32€ → 0,35€
```

#### Conversion d'Unités

**Fichier :** `shared/services/business.ts` (lignes 12-43)

```typescript
const CONVERSION_RULES: Record<string, Record<string, number>> = {
  // Poids
  'kg': { 'g': 1000, 'mg': 1000000 },
  'g': { 'kg': 0.001, 'mg': 1000 },

  // Volume
  'L': { 'mL': 1000, 'cL': 100 },
  'mL': { 'L': 0.001, 'cL': 0.1 },

  // Comptage (pas de conversion)
  'pièce': {},
  'tranche': {},
  'unité': {}
};

export const convertUnit = (
  quantity: number,
  fromUnit: string,
  toUnit: string
): number => {
  // Même unité = pas de conversion
  if (fromUnit === toUnit) return quantity;

  // Vérifier règle conversion existe
  const rule = CONVERSION_RULES[fromUnit]?.[toUnit];

  if (!rule) {
    throw new Error(`Conversion impossible: ${fromUnit} → ${toUnit}`);
  }

  return quantity * rule;
};
```

**Exemples :**
```typescript
convertUnit(1.5, 'kg', 'g')      // 1500
convertUnit(500, 'mL', 'L')      // 0.5
convertUnit(2, 'L', 'cL')        // 200
convertUnit(10, 'pièce', 'kg')   // ❌ Erreur (impossible)
```

---

### 🛍️ MODULE 7 : ACHATS (Commandes Fournisseurs)

**Fichier :** `src/pages/Purchases.tsx` (628 lignes)
**Rôle :** Gestion achats + mise à jour stock + PMP
**Accès :** OWNER, MANAGER

#### Workflow Achat

```
1. CRÉATION COMMANDE FOURNISSEUR
   ↓
2. STATUT "PENDING" (en attente livraison)
   ↓
3. RÉCEPTION (validation bon de livraison)
   ↓
4. STATUT "RECEIVED"
   ├─→ Mise à jour stock ingrédients
   ├─→ Recalcul PMP
   ├─→ Création mouvements (traçabilité)
   └─→ Mise à jour coût recettes produits
```

#### Formulaire Commande

```typescript
interface SupplierOrder {
  id: string;
  supplierId: string;
  status: 'PENDING' | 'RECEIVED' | 'CANCELLED';
  orderDate: string;
  receivedDate?: string;
  items: SupplierOrderItem[];
  totalCost: number;
  notes?: string;
}

interface SupplierOrderItem {
  ingredientId: string;
  quantity: number;
  unitCost: number;  // Prix unitaire
  totalCost: number; // quantity × unitCost
}
```

**UI Création :**
```
┌──────────────────────────────────────────────────┐
│ NOUVELLE COMMANDE FOURNISSEUR                    │
├──────────────────────────────────────────────────┤
│ Fournisseur : [Metro ▼]                          │
│ Date        : 07/01/2026                         │
│                                                   │
│ ARTICLES :                                        │
│ ┌────────────────────────────────────────────┐  │
│ │ Pain burger   50   pièce   0,35€   17,50€ │  │
│ │ Steak haché   10   kg      8,50€   85,00€ │  │
│ │ Fromage       30   tranche 0,42€   12,60€ │  │
│ └────────────────────────────────────────────┘  │
│ [+ Ajouter article]                              │
│                                                   │
│ TOTAL COMMANDE : 115,10€                         │
│                                                   │
│ [💾 Créer (En attente)] [❌ Annuler]            │
└──────────────────────────────────────────────────┘
```

#### Réception avec Recalcul PMP

**CRITIQUE : Fonction métier clé**
**Fichier :** `store.tsx` (lignes 327-376)

```typescript
const receiveSupplierOrder = useCallback(async (orderId: string) => {
  const order = data.supplierOrders.find(o => o.id === orderId);

  if (!order || order.status === 'RECEIVED') return;

  const updatedIngredients = [...data.ingredients];
  const movements: Movement[] = [];

  // Pour chaque article de la commande
  order.items.forEach(item => {
    const ingredientIndex = updatedIngredients.findIndex(
      i => i.id === item.ingredientId
    );

    if (ingredientIndex === -1) return;

    const ingredient = updatedIngredients[ingredientIndex];

    // CALCUL PMP (Prix Moyen Pondéré)
    const currentStock = ingredient.stock;
    const currentPMP = ingredient.averageCost;
    const quantityReceived = item.quantity;
    const unitCost = item.totalCost / item.quantity;

    // Formule officielle PMP
    const newPMP = currentStock === 0
      ? unitCost  // Si stock vide, PMP = prix achat
      : ((currentStock * currentPMP) + (quantityReceived * unitCost))
        / (currentStock + quantityReceived);

    // Mise à jour ingrédient
    updatedIngredients[ingredientIndex] = {
      ...ingredient,
      stock: ingredient.stock + quantityReceived,
      averageCost: newPMP
    };

    // Tracer mouvement
    movements.push({
      id: generateId(),
      companyId: restaurant.id,
      ingredientId: item.ingredientId,
      type: 'PURCHASE',
      quantity: quantityReceived,
      date: new Date().toISOString(),
      documentRef: orderId,
      userId: currentUser.id
    });
  });

  // Mettre à jour commande
  const updatedOrder = {
    ...order,
    status: 'RECEIVED' as const,
    receivedDate: new Date().toISOString()
  };

  // Sauvegarder état complet
  const newState = {
    ...data,
    ingredients: updatedIngredients,
    supplierOrders: data.supplierOrders.map(o =>
      o.id === orderId ? updatedOrder : o
    ),
    movements: [...data.movements, ...movements]
  };

  await saveState(restaurant.id, newState);
  setData(newState);

  logger.audit('RECEIVE_SUPPLIER_ORDER', 'SUPPLIER_ORDER', orderId, {
    itemsCount: order.items.length,
    totalCost: order.totalCost
  });

  notify('Commande réceptionnée, stocks mis à jour', 'success');
}, [data, restaurant, currentUser]);
```

**Exemple concret PMP :**

```
AVANT RÉCEPTION :
  Steak haché : 5kg en stock, PMP = 7,80€/kg

RÉCEPTION :
  Commande : 10kg à 8,50€/kg (prix unitaire)

CALCUL PMP :
  Nouveau PMP = ((5 × 7,80) + (10 × 8,50)) / (5 + 10)
              = (39 + 85) / 15
              = 124 / 15
              = 8,27€/kg

APRÈS RÉCEPTION :
  Steak haché : 15kg en stock, PMP = 8,27€/kg
```

**Impact cascade :**
```
PMP steak haché : 7,80€ → 8,27€
  ↓
Coût matière Burger Classique : 2,48€ → 2,55€ (+0,07€)
  ↓
Marge brute Burger : 7,42€ → 7,35€ (-0,07€)
  ↓
Taux coût matière : 25,1% → 25,8% (+0,7 points)
```

---

### 💰 MODULE 8 : CHARGES (Expenses)

**Fichier :** `src/pages/Expenses.tsx` (442 lignes)
**Rôle :** Gestion charges fixes/variables + calcul EBE
**Accès :** OWNER, MANAGER

#### Types de Charges

```typescript
interface Expense {
  id: string;
  companyId: string;
  name: string;
  amount: number;
  type: 'FIXED' | 'VARIABLE';
  category: ExpenseCategory;
  date: string;
  recurring?: {
    frequency: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
    nextDate: string;
  };
  notes?: string;
}

type ExpenseCategory =
  | 'RENT'           // Loyer
  | 'UTILITIES'      // Eau, électricité, gaz
  | 'SALARIES'       // Salaires
  | 'INSURANCE'      // Assurances
  | 'MARKETING'      // Publicité
  | 'MAINTENANCE'    // Entretien
  | 'TAXES'          // Taxes (hors TVA)
  | 'OTHER';
```

**Exemples :**
```
FIXES (prévisibles) :
- Loyer local      : 1 200€/mois
- Assurance        : 850€/an → 71€/mois
- Abonnement WiFi  : 35€/mois

VARIABLES (dépendent activité) :
- Électricité      : 180€ (janvier)
- Publicité Facebook : 120€ (campagne)
- Réparation frigo : 350€ (ponctuel)
```

#### Calcul EBE (Excédent Brut d'Exploitation)

**EBE = EBITDA français** (indicateur rentabilité opérationnelle)

**Fichier :** `shared/services/expenses.ts` (lignes 45-89)

```typescript
/**
 * Calcule l'EBE sur une période donnée
 * EBE = CA - Coût matière - Charges
 */
export const calculateEBE = (
  orders: Order[],
  expenses: Expense[],
  products: Product[],
  ingredients: Ingredient[],
  startDate: Date,
  endDate: Date
) => {
  // 1. Filtrer commandes période
  const periodOrders = orders.filter(o =>
    isWithinInterval(new Date(o.createdAt), { start: startDate, end: endDate }) &&
    o.status === 'CLOSED'
  );

  // 2. CA total
  const totalSales = periodOrders.reduce((sum, o) => sum + o.total, 0);

  // 3. Coût matière consommé
  const materialCost = calculateMaterialCost(periodOrders, products, ingredients);

  // 4. Charges période
  const periodExpenses = expenses.filter(e =>
    isWithinInterval(new Date(e.date), { start: startDate, end: endDate })
  );

  const expensesByType = {
    fixed: periodExpenses.filter(e => e.type === 'FIXED').reduce((sum, e) => sum + e.amount, 0),
    variable: periodExpenses.filter(e => e.type === 'VARIABLE').reduce((sum, e) => sum + e.amount, 0),
    total: periodExpenses.reduce((sum, e) => sum + e.amount, 0)
  };

  // 5. CALCUL EBE
  const grossMargin = totalSales - materialCost;
  const ebe = grossMargin - expensesByType.total;

  return {
    totalSales,
    materialCost,
    grossMargin,
    expenses: expensesByType,
    ebe,
    ebeMargin: (ebe / totalSales) * 100 // Pourcentage
  };
};
```

**Exemple Janvier 2026 :**
```
CHIFFRE D'AFFAIRES         : 15 842€
- Coût matière             :  4 210€ (26,6%)
────────────────────────────────────
= MARGE BRUTE              : 11 632€ (73,4%)

- Charges fixes            :  1 850€
  (Loyer 1200 + Assurance 71 + Abonnements 579)
- Charges variables        :    680€
  (Électricité 180 + Pub 120 + Entretien 380)
────────────────────────────────────
= CHARGES TOTALES          :  2 530€

════════════════════════════════════
= EBE (EBITDA)             :  9 102€ (57,5%)
════════════════════════════════════
```

**Interprétation :**
- **EBE positif** : Activité rentable avant amortissements/intérêts
- **Marge EBE 57,5%** : Excellente rentabilité (>30% = bon)
- **Seuil rentabilité** : CA minimal pour EBE = 0 → ~4 380€/mois

---

### 📊 MODULE 9 : COMMANDES (Historique)

**Fichier :** `src/pages/Orders.tsx` (514 lignes)
**Rôle :** Consultation historique commandes
**Accès :** OWNER, MANAGER

#### Filtres Avancés

```typescript
interface OrderFilters {
  status?: OrderStatus[];
  paymentMethod?: PaymentMethod[];
  userId?: string;
  tableId?: string;
  dateRange?: { start: Date; end: Date };
  minAmount?: number;
  maxAmount?: number;
  searchQuery?: string; // N° commande, nom client
}
```

**UI Filtres :**
```
┌──────────────────────────────────────────────────┐
│ Période   : [01/01/2026] → [07/01/2026]    [🔍] │
│ Statut    : ☑️ Terminées  ☑️ Annulées  ☐ En cours │
│ Paiement  : ☑️ Espèces   ☑️ CB                   │
│ Serveur   : [Tous ▼]                             │
│ Montant   : [10€] → [200€]                       │
│ Recherche : [N° commande ou client...]           │
└──────────────────────────────────────────────────┘
```

#### Affichage Liste

```
Date/Heure       N°           Table    Serveur   Total    Paiement   Statut
──────────────────────────────────────────────────────────────────────────────
07/01 14:32     2025-00047   Table 5  Marie     28,80€   CB         ✅ Terminée
07/01 14:25     2025-00048   Emporter Lucas     19,40€   Espèces    ✅ Terminée
07/01 14:18     2025-00046   Table 3  Sophie    67,20€   CB         ✅ Terminée
07/01 13:52     2025-00045   Table 12 Marie     42,10€   Espèces    ❌ Annulée
```

**Détail Commande (Modal) :**
```
COMMANDE #2025-00047
────────────────────────────────────────
Date         : 07/01/2026 14:32
Table        : Table 5 (Salle principale)
Serveur      : Marie Dubois
Durée service: 32 minutes

ARTICLES :
  2x Burger Classique  (9,90€)    19,80€
     Notes: Sans oignon
  1x Frites            (7,50€)     7,50€
  1x Coca-Cola         (2,50€)     2,50€
                                 ───────
                     TOTAL HT :   26,20€
                     TVA 10% :     2,62€
                     TOTAL TTC:   28,82€

PAIEMENT : Carte Bancaire
STATUT   : ✅ Terminée (payée à 14:35)

[🖨️ Réimprimer ticket] [❌ Annuler commande]
```

#### Remboursements / Annulations

```typescript
const refundOrder = async (orderId: string, reason: string) => {
  const order = orders.find(o => o.id === orderId);

  // Rembourser stock (inversion déstockage)
  const movements: Movement[] = [];

  order.items.forEach(item => {
    const product = products.find(p => p.id === item.productId);

    product.recipe.forEach(recipeItem => {
      const quantityToRestock = recipeItem.quantity * item.quantity;

      // Ajouter au stock
      const ingredientIndex = ingredients.findIndex(i => i.id === recipeItem.ingredientId);
      ingredients[ingredientIndex].stock += quantityToRestock;

      // Tracer mouvement
      movements.push({
        type: 'REFUND',
        ingredientId: recipeItem.ingredientId,
        quantity: quantityToRestock,
        documentRef: orderId,
        notes: `Remboursement: ${reason}`
      });
    });
  });

  // Mettre à jour commande
  await updateOrder(orderId, {
    status: 'REFUNDED',
    refundReason: reason,
    refundedAt: new Date().toISOString(),
    refundedBy: currentUser.id
  });

  logger.audit('REFUND_ORDER', 'ORDER', orderId, { reason });
  notify('Commande remboursée, stock restauré', 'success');
};
```

---

## 🔄 FLUX MÉTIER CRITIQUES

### FLUX 1 : VENTE → DÉSTOCKAGE AUTOMATIQUE

**Principe n°2 métier : Jamais de déstockage manuel**

```
┌─────────────────────────────────────────────────────────────┐
│ SERVEUR crée commande POS                                   │
│   Items: [2x Burger Classique, 1x Frites, 1x Coca]         │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ VALIDATION stock disponible (AVANT création)                │
│   Pour chaque produit:                                      │
│     - Lire recette                                          │
│     - Calculer ingrédients nécessaires                      │
│     - Vérifier stock >= nécessaire                          │
│   Si insuffisant → BLOQUER + Alerter                        │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ CRÉATION commande (store.createOrder)                       │
│   - Générer ID unique                                       │
│   - Calculer total TTC                                      │
│   - Enregistrer items + notes + serveur + table             │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ DÉSTOCKAGE AUTOMATIQUE (lignes 227-276 store.tsx)          │
│   Pour chaque item commandé:                                │
│     Pour chaque ingrédient de la recette:                   │
│       1. Calculer quantité = recette.qty × item.qty         │
│       2. Déduire stock: ingredient.stock -= quantité        │
│       3. Créer mouvement (traçabilité)                      │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ SAUVEGARDE état (localStorage + Supabase)                   │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ IMPRESSION ticket cuisine (ESC/POS)                         │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ BROADCAST WebSocket → Autres terminaux synchronisés         │
└─────────────────────────────────────────────────────────────┘
```

**Exemple concret :**

```
COMMANDE : 2x Burger Classique

BURGER CLASSIQUE RECETTE :
  - Pain burger   : 1 pièce
  - Steak haché   : 150g
  - Fromage       : 1 tranche
  - Oignons       : 20g
  - Tomate        : 50g
  - Sauce burger  : 30mL

QUANTITÉ COMMANDÉE : 2 burgers

DÉSTOCKAGE AUTOMATIQUE :
  Pain burger   : -2 pièces    (1 × 2)
  Steak haché   : -300g        (150g × 2)
  Fromage       : -2 tranches  (1 × 2)
  Oignons       : -40g         (20g × 2)
  Tomate        : -100g        (50g × 2)
  Sauce burger  : -60mL        (30mL × 2)

MOUVEMENTS CRÉÉS :
  6 lignes dans table movements (type: SALE, documentRef: order.id)

TEMPS TOTAL : <100ms (transaction atomique)
```

---

### FLUX 2 : ACHAT → MISE À JOUR STOCK → PMP

```
┌─────────────────────────────────────────────────────────────┐
│ GÉRANT crée commande fournisseur                            │
│   Fournisseur: Metro                                        │
│   Items: [10kg steak haché @ 8,50€/kg]                      │
│   Statut: PENDING                                           │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ LIVRAISON physique reçue                                    │
│   → Gérant valide bon de réception                          │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ CLIC "Réceptionner" (store.receiveSupplierOrder)            │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ RECALCUL PMP (Prix Moyen Pondéré)                           │
│   Formule:                                                  │
│   PMP_new = (stock_actuel × PMP_actuel + qty_reçue × prix) │
│             ──────────────────────────────────────────────  │
│                    (stock_actuel + qty_reçue)               │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ MISE À JOUR stock ingrédient                                 │
│   - stock = stock + quantité reçue                          │
│   - averageCost = nouveau PMP                               │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ CRÉATION mouvement (traçabilité)                            │
│   Type: PURCHASE                                            │
│   DocumentRef: supplier_order.id                            │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ RECALCUL COÛT tous les produits utilisant cet ingrédient    │
│   → Marge brute mise à jour                                 │
│   → Taux coût matière ajusté                                │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ SAUVEGARDE + SYNC + AUDIT LOG                               │
└─────────────────────────────────────────────────────────────┘
```

**Exemple PMP détaillé :**

```
ÉTAT INITIAL :
  Steak haché: 5kg en stock, PMP = 7,80€/kg

RÉCEPTION :
  Quantité  : 10kg
  Prix achat: 8,50€/kg

CALCUL :
  Stock total futur = 5 + 10 = 15kg

  Valeur stock actuel = 5kg × 7,80€ = 39,00€
  Valeur réception    = 10kg × 8,50€ = 85,00€
  Valeur totale       = 39 + 85 = 124,00€

  PMP nouveau = 124€ / 15kg = 8,27€/kg

APRÈS RÉCEPTION :
  Steak haché: 15kg en stock, PMP = 8,27€/kg

CASCADE :
  Burger Classique (150g steak):
    Coût avant : 150g × 7,80€ = 1,17€
    Coût après : 150g × 8,27€ = 1,24€ (+0,07€)

  Marge burger :
    Avant : 9,90€ - 2,48€ = 7,42€
    Après : 9,90€ - 2,55€ = 7,35€ (-0,07€)
```

---

**FIN PARTIE 2**

**Prochaine PARTIE 3 couvrira :**
- Sécurité complète (RLS, bcrypt, JWT, RBAC, auto-lock)
- Application mobile (React Native + Capacitor + offline queue)
- Performance et optimisations (build, cache, WebSocket)
- État d'avancement précis (47/76 = 62% réel)
- Base de données détaillée (schémas, policies, indexes)

**Partie 4 finalisera avec :**
- 6 blockers critiques
- 29 items restants roadmap
- Budget 156h + 15K€
- Recommandations investisseurs

**Tokens utilisés PARTIE 2 :** ~11500
**Total cumulé :** ~21300/200000 (178700 restants)
