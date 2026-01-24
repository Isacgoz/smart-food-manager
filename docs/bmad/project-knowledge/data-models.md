# Smart Food Manager - Modèles de Données

**Généré le**: 2026-01-23

---

## Vue d'Ensemble

Le système utilise une architecture **JSONB** dans Supabase, avec toutes les données d'un restaurant stockées dans un seul document JSON. Cette approche permet:
- Sync offline simplifiée
- Transactions atomiques
- Performance lecture optimale

---

## Entités Principales

### User (Utilisateur)

```typescript
interface User {
  id: string;           // UUID généré
  name: string;         // Nom affiché
  pin: string;          // @deprecated - PIN en clair
  pinHash?: string;     // SHA-256 du PIN (sécurisé)
  role: Role;           // OWNER | MANAGER | SERVER | COOK
}

type Role = 'OWNER' | 'MANAGER' | 'SERVER' | 'COOK';
```

**Relations**:
- Crée des `Order` (userId)
- Encaisse des `Order` (paidByUserId)
- Déclare des `CashDeclaration`

---

### Order (Commande)

```typescript
interface Order {
  id: string;
  number: number;                    // Numéro séquentiel
  invoiceNumber?: string;            // Ex: "2025-000123"
  items: OrderItem[];                // Lignes de commande
  total: number;                     // Total TTC
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  kitchenStatus: KitchenStatus;      // QUEUED | PREPARING | READY | SERVED
  date: string;                      // ISO 8601
  paymentMethod?: 'CASH' | 'CARD';
  tableId?: string;                  // Table associée
  userId: string;                    // Qui a pris la commande
  paidByUserId?: string;             // Qui a encaissé (AUDIT)
  serverId?: string;
  notes?: string;                    // Notes client
  paidAt?: string;
  createdAt?: string;
  updatedAt?: string;
  version?: number;                  // Optimistic locking
}

interface OrderItem {
  productId: string;
  quantity: number;
  price: number;           // Prix TTC unitaire
  name: string;            // Snapshot nom produit
  note?: string;           // "Sans oignon", "Bien cuit"
}

type KitchenStatus = 'QUEUED' | 'PREPARING' | 'READY' | 'SERVED';
```

**Relations**:
- Contient des `OrderItem` (produits commandés)
- Liée à une `Table` (optionnel)
- Créée par un `User`
- Génère des `StockMovement` (déstockage)

---

### Product (Produit)

```typescript
interface Product {
  id: string;
  name: string;
  category: string;        // "Burgers", "Boissons", etc.
  price: number;           // Prix TTC vente
  vatRate: number;         // 5.5 | 10 | 20 (%)
  image?: string;          // URL ou base64
  recipe: RecipeItem[];    // Composition
}

interface RecipeItem {
  ingredientId: string;    // FK vers Ingredient
  quantity: number;        // Quantité par unité produit
}
```

**Relations**:
- Composé de `RecipeItem` (ingrédients)
- Référencé dans `OrderItem`

**Calculs dérivés**:
```typescript
// Coût matière
cost = Σ(ingredient.averageCost × recipeItem.quantity)

// Marge brute
margin = price - cost

// Taux coût matière (objectif <30%)
costRate = (cost / priceHT) × 100
```

---

### Ingredient (Ingrédient)

```typescript
interface Ingredient {
  id: string;
  name: string;
  unit: Unit;              // Unité de stockage
  stock: number;           // Quantité actuelle
  minStock: number;        // Seuil alerte
  averageCost: number;     // PMP (Prix Moyen Pondéré)
}

type Unit = 'kg' | 'g' | 'L' | 'cl' | 'ml' | 'piece';
```

**Relations**:
- Utilisé dans `RecipeItem`
- Tracé via `StockMovement`
- Commandé via `SupplierOrderItem`

**Calcul PMP**:
```typescript
// À chaque réception fournisseur
newPMP = (stock × currentPMP + qtyReceived × unitCost) / (stock + qtyReceived)
```

---

### StockMovement (Mouvement de Stock)

```typescript
interface StockMovement {
  id: string;
  ingredientId: string;    // FK Ingredient
  type: 'SALE' | 'PURCHASE' | 'ADJUSTMENT' | 'WASTE';
  quantity: number;        // Positif (entrée) ou négatif (sortie)
  date: string;
  documentRef?: string;    // ID commande ou bon réception
}
```

**Types de mouvements**:
- `SALE`: Sortie automatique sur vente (négatif)
- `PURCHASE`: Entrée sur réception fournisseur (positif)
- `ADJUSTMENT`: Correction inventaire
- `WASTE`: Perte / casse

---

### Partner (Partenaire)

```typescript
interface Partner {
  id: string;
  name: string;
  type: PartnerType;
  email: string;
  phone: string;
  address: string;
  notes: string;
  loyaltyPoints: number;   // Pour clients fidélité
  totalSpent: number;      // Historique achats
}

type PartnerType = 'CLIENT' | 'SUPPLIER' | 'MAINTENANCE' | 'DELIVERY' | 'MARKETING' | 'OTHER';
```

---

### SupplierOrder (Commande Fournisseur)

```typescript
interface SupplierOrder {
  id: string;
  supplierId: string;      // FK Partner (type=SUPPLIER)
  items: SupplierOrderItem[];
  totalCost: number;
  date: string;
  status: 'PENDING' | 'RECEIVED';
}

interface SupplierOrderItem {
  ingredientId: string;
  quantity: number;
  cost: number;            // Coût total ligne
}
```

**Workflow**:
1. Création commande (PENDING)
2. Réception → status = RECEIVED
3. Mise à jour stock ingrédients
4. Recalcul PMP
5. Création StockMovement (type=PURCHASE)

---

### Table

```typescript
interface Table {
  id: string;
  name: string;            // "Table 1", "Terrasse 3"
  seats: number;           // Capacité
}
```

**Relations**:
- Liée aux `Order` (tableId)

---

### Expense (Charge)

```typescript
interface Expense {
  id: string;
  restaurantId: string;
  category: ExpenseCategory;
  label: string;           // Description libre
  amount: number;
  type: ExpenseType;       // FIXED | VARIABLE
  frequency: 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'ONE_TIME';
  date: string;
  createdAt: string;
  createdBy: string;       // userId
  isPaid: boolean;
  paymentDate?: string;
  notes?: string;
}

type ExpenseType = 'FIXED' | 'VARIABLE';

type ExpenseCategory =
  | 'RENT'           // Loyer
  | 'SALARIES'       // Salaires
  | 'ELECTRICITY'    // Électricité
  | 'WATER'          // Eau
  | 'GAS'            // Gaz
  | 'INTERNET'       // Internet/Téléphone
  | 'INSURANCE'      // Assurances
  | 'MAINTENANCE'    // Réparations
  | 'MARKETING'      // Publicité
  | 'ACCOUNTING'     // Comptabilité
  | 'BANK_FEES'      // Frais bancaires
  | 'WASTE_MANAGEMENT'
  | 'CLEANING'
  | 'LICENSES'
  | 'OTHER';
```

---

### CashDeclaration (Déclaration Caisse)

```typescript
interface CashDeclaration {
  id: string;
  userId: string;          // Qui déclare
  amount: number;          // Montant compté
  date: string;
  type: 'OPENING' | 'CLOSING';
}
```

**Usage**:
- `OPENING`: Fond de caisse au matin
- `CLOSING`: Montant compté en fin de journée
- Écart = `theoreticalCash - closingAmount`

---

### Company (Entreprise)

```typescript
interface Company {
  id: string;
  name: string;            // Nom commercial
  legalName?: string;      // Raison sociale
  siren?: string;          // 9 chiffres (obligatoire FR)
  siret?: string;          // 14 chiffres (obligatoire FR)
  vatNumber?: string;      // TVA intracommunautaire
  address?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  plan: 'SOLO' | 'TEAM' | 'BUSINESS';
  status?: 'active' | 'suspended' | 'trial';
}
```

---

### RestaurantProfile (Profil Restaurant)

```typescript
interface RestaurantProfile {
  id: string;
  name: string;
  ownerEmail: string;
  plan: PlanType;          // STARTER | PRO | BUSINESS
  createdAt: string;
  stockPolicy?: StockPolicy;  // BLOCK | WARN | SILENT
}

type PlanType = 'STARTER' | 'PRO' | 'BUSINESS';
type StockPolicy = 'BLOCK' | 'WARN' | 'SILENT';
```

---

## Calculs Métier Clés

### EBE (Excédent Brut d'Exploitation)

```typescript
interface EBECalculation {
  period: { start: string; end: string };
  revenue: {
    totalSales: number;    // CA TTC
    cash: number;
    card: number;
  };
  expenses: {
    totalExpenses: number;
    fixed: number;
    variable: number;
    byCategory: Record<ExpenseCategory, number>;
  };
  materialCost: number;    // Coût matière consommé
  grossMargin: number;     // CA - Coût matière
  grossMarginRate: number; // % marge brute
  ebe: number;             // Marge brute - Charges
  ebeRate: number;         // % EBE / CA
  isProfitable: boolean;   // EBE > 0
}
```

**Formules**:
```
CA HT = CA TTC / (1 + TVA)
Marge Brute = CA HT - Coût Matière
EBE = Marge Brute - Charges (fixes + variables)
Taux EBE = EBE / CA × 100
```

---

## Diagramme ERD Simplifié

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    User      │       │    Order     │       │   Product    │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id           │◀──────│ userId       │       │ id           │
│ name         │       │ paidByUserId │──────▶│ name         │
│ role         │       │ items[]      │───────│ price        │
│ pinHash      │       │ tableId      │       │ recipe[]     │──┐
└──────────────┘       └──────────────┘       └──────────────┘  │
                              │                                  │
                              ▼                                  │
                       ┌──────────────┐                         │
                       │    Table     │                         │
                       ├──────────────┤                         │
                       │ id           │                         │
                       │ name         │                         │
                       │ seats        │                         │
                       └──────────────┘                         │
                                                                │
┌──────────────┐       ┌──────────────┐       ┌──────────────┐  │
│   Partner    │       │SupplierOrder │       │  Ingredient  │◀─┘
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id           │◀──────│ supplierId   │       │ id           │
│ name         │       │ items[]      │───────│ name         │
│ type         │       │ status       │       │ stock        │
└──────────────┘       └──────────────┘       │ averageCost  │
                                              └──────────────┘
                                                     │
                                                     ▼
                                              ┌──────────────┐
                                              │StockMovement │
                                              ├──────────────┤
                                              │ ingredientId │
                                              │ type         │
                                              │ quantity     │
                                              └──────────────┘
```

---

## Index de Performance Recommandés

```sql
-- Multi-tenant (CRITIQUE)
CREATE INDEX idx_companies_owner ON companies(owner_id);
CREATE INDEX idx_app_state_company ON app_state(company_id);

-- Requêtes fréquentes (dans JSONB)
CREATE INDEX idx_app_state_orders ON app_state
  USING GIN ((data->'orders'));
CREATE INDEX idx_app_state_products ON app_state
  USING GIN ((data->'products'));
```

---

## Validation & Contraintes

### Règles Métier Critiques

1. **Stock ne peut pas être négatif** (selon stockPolicy)
2. **PMP recalculé** à chaque réception
3. **Déstockage automatique** sur vente validée
4. **Numérotation factures** séquentielle inaltérable
5. **Isolation tenant** via company_id

### Validation TypeScript

```typescript
// Exemple validation stock
const validateStockBeforeOrder = (items, products, ingredients): { valid: boolean; errors: string[] }
```
