# Smart Food Manager - Architecture Technique

**Généré le**: 2026-01-23

---

## Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Web App   │  │  Mobile App │  │   KDS/POS   │              │
│  │   (React)   │  │ (React Nat) │  │  (Tablets)  │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│         └────────────────┼────────────────┘                      │
│                          │                                       │
│                    ┌─────▼─────┐                                 │
│                    │ Supabase  │                                 │
│                    │  Client   │                                 │
│                    └─────┬─────┘                                 │
└──────────────────────────┼──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                       SUPABASE                                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  PostgreSQL │  │    Auth     │  │  Realtime   │              │
│  │  + RLS      │  │  (JWT)      │  │ (WebSocket) │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Architecture Frontend

### Pattern: Component-Based + Context API

```
┌─────────────────────────────────────────────────────────────────┐
│                         App.tsx                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    AppProvider (Context)                     ││
│  │  ┌───────────────────────────────────────────────────────┐  ││
│  │  │                    State                               │  ││
│  │  │  - users, orders, products, ingredients                │  ││
│  │  │  - tables, partners, expenses, movements               │  ││
│  │  │  - currentUser, restaurant, notifications              │  ││
│  │  └───────────────────────────────────────────────────────┘  ││
│  │  ┌───────────────────────────────────────────────────────┐  ││
│  │  │                    Actions                             │  ││
│  │  │  - createOrder, payOrder, updateKitchenStatus          │  ││
│  │  │  - addProduct, receiveSupplierOrder, etc.              │  ││
│  │  └───────────────────────────────────────────────────────┘  ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│              ┌───────────────┼───────────────┐                   │
│              ▼               ▼               ▼                   │
│        ┌──────────┐   ┌──────────┐   ┌──────────┐               │
│        │  Layout  │   │  Pages   │   │Components│               │
│        └──────────┘   └──────────┘   └──────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

### Structure des Fichiers

```
/
├── App.tsx                 # Routing + Layout
├── store.tsx               # Context API (State Management)
├── types.ts                # Types racine
├── index.tsx               # Entry point
│
├── pages/                  # 18 pages
│   ├── POS.tsx             # Point of Sale
│   ├── Dashboard.tsx       # KPIs financiers
│   ├── Kitchen.tsx         # Kitchen Display
│   ├── Orders.tsx          # Historique commandes
│   ├── Menu.tsx            # Produits & recettes
│   ├── Stocks.tsx          # Gestion stock
│   ├── Purchases.tsx       # Achats fournisseurs
│   ├── Expenses.tsx        # Charges
│   ├── Users.tsx           # Gestion équipe
│   ├── Tables.tsx          # Tables restaurant
│   ├── Settings.tsx        # Configuration
│   ├── Exports.tsx         # Export données
│   ├── Login.tsx           # Auth PIN
│   └── SaaSLogin.tsx       # Auth Supabase
│
├── components/             # Composants partagés
│   ├── Layout.tsx          # Layout desktop
│   ├── MobileLayout.tsx    # Layout mobile
│   ├── ErrorBoundary.tsx   # Gestion erreurs
│   └── NetworkStatus.tsx   # Indicateur online
│
├── services/               # Services backend
│   ├── storage.ts          # LocalStorage + Supabase
│   ├── auth.ts             # Authentication
│   ├── printer.ts          # ESC/POS
│   └── ...
│
└── shared/                 # Code partagé
    ├── types.ts            # Types partagés
    ├── services/           # Logique métier
    │   ├── business.ts     # Stock, PMP, destock
    │   ├── invoicing.ts    # Facturation NF525
    │   ├── expenses.ts     # Calcul EBE
    │   └── ...
    └── hooks/              # Custom hooks
        ├── useToast.ts
        ├── useMobile.ts
        └── ...
```

---

## Flux de Données Critiques

### 1. Flux Vente → Déstockage

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│   POS   │───▶│ Create  │───▶│ Validate│───▶│ Destock │
│  (UI)   │    │  Order  │    │  Stock  │    │  Ingred │
└─────────┘    └─────────┘    └─────────┘    └────┬────┘
                                                  │
     ┌────────────────────────────────────────────┘
     ▼
┌─────────┐    ┌─────────┐    ┌─────────┐
│ Create  │───▶│ Update  │───▶│  Save   │
│Movement │    │  State  │    │ Supabase│
└─────────┘    └─────────┘    └─────────┘
```

**Code clé**: `store.tsx:createOrder()` + `shared/services/business.ts:destockIngredients()`

### 2. Flux Réception → PMP

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Supplier   │───▶│   Receive   │───▶│  Calculate  │
│   Order     │    │    Order    │    │     PMP     │
└─────────────┘    └─────────────┘    └──────┬──────┘
                                             │
    ┌────────────────────────────────────────┘
    ▼
┌─────────────┐    ┌─────────────┐
│   Update    │───▶│   Create    │
│   Stock     │    │  Movement   │
└─────────────┘    └─────────────┘
```

**Formule PMP**:
```
newPMP = (stock × PMP_ancien + qté_reçue × prix_unit) / (stock + qté_reçue)
```

### 3. Flux Sync Temps Réel

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Salle     │         │  Supabase   │         │   Cuisine   │
│   (POS)     │         │  Realtime   │         │   (KDS)     │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │                       │                       │
       │   CREATE ORDER        │                       │
       │──────────────────────▶│                       │
       │                       │   BROADCAST           │
       │                       │──────────────────────▶│
       │                       │                       │
       │                       │   UPDATE STATUS       │
       │                       │◀──────────────────────│
       │   BROADCAST           │                       │
       │◀──────────────────────│                       │
```

---

## Architecture Base de Données

### Tables Supabase

```sql
-- Multi-tenant isolation
CREATE TABLE companies (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    owner_id UUID NOT NULL,      -- FK auth.users
    plan TEXT DEFAULT 'PRO',     -- SOLO | PRO | BUSINESS
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

-- State JSONB (offline-first)
CREATE TABLE app_state (
    id UUID PRIMARY KEY,         -- = company_id pour simplicité
    company_id UUID REFERENCES companies(id),
    data JSONB NOT NULL,         -- Tout le state restaurant
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

### Row Level Security (RLS)

```sql
-- Chaque user ne voit que ses propres companies
CREATE POLICY "companies_select" ON companies
    FOR SELECT USING (owner_id = auth.uid());

-- Chaque user ne voit que son propre app_state
CREATE POLICY "app_state_select" ON app_state
    FOR SELECT USING (id = auth.uid());
```

### Structure JSONB app_state.data

```json
{
  "_lastUpdatedAt": 1706045123456,
  "users": [{ "id", "name", "pin", "pinHash", "role" }],
  "orders": [{ "id", "number", "items", "total", "status", "kitchenStatus", ... }],
  "products": [{ "id", "name", "category", "price", "vatRate", "recipe" }],
  "ingredients": [{ "id", "name", "unit", "stock", "minStock", "averageCost" }],
  "tables": [{ "id", "name", "seats" }],
  "partners": [{ "id", "name", "type", ... }],
  "supplierOrders": [{ "id", "supplierId", "items", "status" }],
  "movements": [{ "id", "ingredientId", "type", "quantity", "date" }],
  "cashDeclarations": [{ "id", "userId", "amount", "date", "type" }],
  "expenses": [{ "id", "category", "amount", "type", "frequency", ... }]
}
```

---

## Sécurité

### Authentication Flow

```
1. User entre email/password sur SaaSLogin
2. Supabase Auth valide et retourne JWT
3. JWT stocké en session (httpOnly cookie recommandé)
4. Chaque requête Supabase inclut JWT
5. RLS filtre par auth.uid()
```

### PIN Authentication (Serveurs)

```
1. Server sélectionne son profil
2. Entre PIN 4 chiffres
3. PIN hashé avec SHA-256 (offline verification)
4. Comparaison pinHash local
5. Si match → login OK
```

### Isolation Multi-tenant

- **Niveau DB**: RLS sur `owner_id = auth.uid()`
- **Niveau App**: Filtrage par `restaurant.id` dans Context
- **Niveau Storage**: Clé unique `smart_food_db_{restaurantId}`

---

## Performance

### Optimisations Build

```javascript
// vite.config.ts
build: {
  target: 'es2020',
  minify: 'terser',
  rollupOptions: {
    output: {
      manualChunks: {
        'react-vendor': ['react', 'react-dom'],
        'chart-vendor': ['recharts'],
        'supabase-vendor': ['@supabase/supabase-js'],
        'icons-vendor': ['lucide-react'],
        'toast-vendor': ['react-hot-toast']
      }
    }
  }
}
```

### Métriques

| Métrique | Valeur |
|----------|--------|
| Bundle gzip | ~450 KB |
| Initial Load | <2s |
| Lighthouse | 92/100 |
| Chunk Strategy | 5 vendors séparés |

---

## Monitoring

### Sentry Integration

```typescript
// services/sentry.ts
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_APP_ENV,
  tracesSampleRate: 0.1,        // 10% performance
  replaysSessionSampleRate: 0.1, // 10% replays
  replaysOnErrorSampleRate: 1.0  // 100% on error
});
```

### Événements Trackés

- Erreurs runtime
- Stock négatif
- Écarts de caisse
- Échecs sync Supabase
- Web Vitals (LCP, FID, CLS)

---

## Points d'Extension

### Pour ajouter une nouvelle page

1. Créer `pages/NewPage.tsx`
2. Ajouter case dans `App.tsx` switch
3. Ajouter nav item dans `Layout.tsx`
4. Configurer permissions dans routing

### Pour ajouter un nouveau type de données

1. Définir interface dans `shared/types.ts`
2. Ajouter au state initial dans `store.tsx`
3. Créer actions CRUD dans store
4. Implémenter la persistence

### Pour ajouter une nouvelle intégration

1. Créer service dans `services/`
2. Exposer via Context si nécessaire
3. Ajouter tests unitaires
4. Documenter configuration
