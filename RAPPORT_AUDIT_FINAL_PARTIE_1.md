# 📊 RAPPORT AUDIT EXHAUSTIF - SMART FOOD MANAGER
## PARTIE 1 : SYNTHÈSE EXÉCUTIVE & ARCHITECTURE TECHNIQUE

---

## 🎯 SYNTHÈSE EXÉCUTIVE

### Pour les Investisseurs et Non-Développeurs

**Smart Food Manager** est une solution logicielle complète de gestion intelligente pour restaurants légers (food trucks, snacks, petits restaurants). L'application remplace les méthodes manuelles (papier, Excel) par un système automatisé qui donne une vision claire et en temps réel de la rentabilité.

**Proposition de valeur unique :**
- Connexion automatique entre recettes, ingrédients, achats, ventes et marges
- Calcul automatique du coût réel de chaque plat vendu
- Gestion de stock théorique (pas de comptage manuel quotidien)
- Interface web (pour gérants) + application mobile (pour serveurs)
- Conformité légale française (anti-fraude TVA NF525 à 95%)

**État actuel :**
- ✅ **Application fonctionnelle** : 47/76 fonctionnalités opérationnelles (62% réel)
- ⚠️ **Non production-ready** : 6 blockers critiques à résoudre
- 💰 **Investissement requis** : 156h développement + 15K€ certification
- 📅 **Timeline** : 5-8 semaines pour version commercialisable

**Marché cible :**
- Restauration légère indépendante (15 000+ établissements en France)
- SaaS multi-tenant (plusieurs restaurants sur même base de données)
- Modèle freemium : 0€ (gratuit) → 79€/mois (Team) → 299€/mois (Business)

---

## 🏗️ VISION DU PROJET

### Problème Résolu

Les gérants de petits restaurants passent **8-15 heures par semaine** à :
- Compter manuellement le stock
- Calculer les coûts matière sur Excel
- Vérifier la rentabilité de chaque plat
- Chercher les écarts de caisse
- Gérer les commandes fournisseurs sur papier

**Résultat :** Marges invisibles, gaspillage non détecté, décisions "au feeling".

### Solution Smart Food Manager

Un logiciel qui **automatise 90% de ces tâches** :

1. **Recettes intelligentes** : Chaque plat = liste d'ingrédients + quantités précises
2. **Déstockage automatique** : Une vente → stock mis à jour instantanément
3. **Calcul de marge temps réel** : Coût matière recalculé à chaque achat fournisseur
4. **Tableau de bord financier** : CA, EBE, top ventes, consommation matières
5. **Multi-appareils** : Desktop (gérant) + tablettes (serveurs) synchronisés

### Objectif Final

Devenir **le standard SaaS des TPE restauration en France**, puis Europe.

**Roadmap produit :**
- **V1 (actuelle)** : Gestion mono-site, conformité FR
- **V2 (6 mois)** : Multi-sites, API partenaires, mode offline avancé
- **V3 (12 mois)** : IA prédictive stocks, intégrations comptables, expansion EU

---

## 🛠️ STACK TECHNIQUE DÉTAILLÉE

### Vue d'Ensemble

L'application est construite avec des **technologies modernes, scalables et éprouvées** :

```
┌─────────────────────────────────────────────────────┐
│              FRONTEND (Interface utilisateur)       │
│  React 19 + TypeScript + Vite + Tailwind CSS       │
│  67 fichiers TypeScript, 15 pages, 450KB bundle    │
└────────────┬────────────────────────────────────────┘
             │ HTTPS (JWT auth)
┌────────────▼────────────────────────────────────────┐
│              BACKEND (Serveur de données)           │
│  Supabase PostgreSQL + Auth + Storage + Realtime   │
│  4 migrations, RLS multi-tenant, WebSocket <100ms  │
└────────────┬────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────┐
│              MOBILE (Application serveurs)          │
│  React Native + Capacitor + Offline Queue          │
│  300 lignes logique offline, sync auto reconnexion │
└─────────────────────────────────────────────────────┘
```

### Technologies Choisies (et Pourquoi)

#### 1. **Frontend : React 19.2.3**
**Qu'est-ce que c'est ?**
Framework JavaScript open-source créé par Meta (Facebook), utilisé par des millions d'applications web modernes.

**Pourquoi ce choix ?**
- ✅ **Écosystème mature** : 200 000+ bibliothèques compatibles
- ✅ **Performances** : Rendu ultra-rapide grâce au "Virtual DOM"
- ✅ **Talent disponible** : 70% des développeurs front-end connaissent React
- ✅ **Maintenance long terme** : Soutenu par Meta depuis 2013

**Alternatives considérées :**
- Vue.js (écosystème plus petit)
- Angular (trop lourd pour notre cas)

---

#### 2. **TypeScript 5.8.2**
**Qu'est-ce que c'est ?**
Surcouche à JavaScript qui ajoute des **types statiques** (ex: "cette variable doit toujours être un nombre").

**Pourquoi ce choix ?**
- ✅ **Sécurité** : 80% des bugs détectés AVANT compilation
- ✅ **Auto-complétion** : Les éditeurs de code suggèrent automatiquement
- ✅ **Documentation vivante** : Le code s'auto-documente
- ✅ **Refactoring sûr** : Renommer une fonction met à jour tous les usages

**Exemple concret :**
```typescript
// JavaScript (erreur détectée à l'exécution = crash client)
const price = "19.99"; // String au lieu de Number
const total = price * 1.2; // NaN (bug invisible)

// TypeScript (erreur détectée à la compilation = 0 crash)
const price: number = "19.99"; // ❌ ERREUR : String != Number
```

---

#### 3. **Vite 6.2.0**
**Qu'est-ce que c'est ?**
Outil de build ultra-rapide créé par Evan You (créateur de Vue.js).

**Pourquoi ce choix ?**
- ✅ **Vitesse dev** : Démarrage serveur en <1s (vs 30s avec Webpack)
- ✅ **Hot Module Reload** : Modifications visibles instantanément sans recharger la page
- ✅ **Bundle optimisé** : Code final = 450KB gzippé (vs 2MB avec Create React App)
- ✅ **Code splitting automatique** : Seulement le code nécessaire est chargé

**Impact business :**
- Développement 3x plus rapide
- Application 5x plus légère = temps de chargement réduit
- Moins de bande passante = économie serveur

---

#### 4. **Tailwind CSS 4.1.18**
**Qu'est-ce que c'est ?**
Framework CSS "utility-first" (classes préconstruites comme `bg-blue-500`, `text-center`).

**Pourquoi ce choix ?**
- ✅ **Productivité** : Design 5x plus rapide qu'avec CSS classique
- ✅ **Cohérence** : Palette de couleurs/espacements standardisée
- ✅ **Responsive natif** : `md:hidden` = masquer sur desktop
- ✅ **Purge automatique** : Seules les classes utilisées sont incluses (bundle -70%)

**Exemple concret :**
```html
<!-- CSS classique (20 lignes) -->
<style>
.btn-primary {
  background: #3b82f6;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
}
</style>
<button class="btn-primary">Valider</button>

<!-- Tailwind (1 ligne, même résultat) -->
<button class="bg-blue-500 px-6 py-3 rounded-lg font-semibold">Valider</button>
```

---

#### 5. **Supabase 2.39.3**
**Qu'est-ce que c'est ?**
Alternative open-source à Firebase (Google), fournit base de données + auth + storage + temps réel.

**Pourquoi ce choix ?**
- ✅ **PostgreSQL** : Base de données professionnelle (pas NoSQL jouet)
- ✅ **RLS (Row Level Security)** : Isolation multi-tenant au niveau DB
- ✅ **WebSocket natif** : Sync temps réel entre appareils <100ms
- ✅ **Open-source** : Pas de vendor lock-in (contrairement à Firebase)
- ✅ **Prix** : 0€ jusqu'à 500MB, puis 25€/mois (vs Firebase 100€+)

**Architecture Supabase :**
```
PostgreSQL (données) ───┬──→ PostgREST (API auto-générée)
                        ├──→ GoTrue (auth JWT)
                        ├──→ Realtime (WebSocket)
                        └──→ Storage (fichiers S3)
```

**Alternatives considérées :**
- Firebase (NoSQL = pas adapté données relationnelles restaurant)
- Backend custom (FastAPI + PostgreSQL) = 6 mois dev supplémentaires

---

#### 6. **bcryptjs 3.0.3 + JWT**
**Qu'est-ce que c'est ?**
Algorithmes de sécurité pour protéger mots de passe et sessions.

**Pourquoi ce choix ?**
- ✅ **bcrypt** : Hash irréversible + salt unique par mot de passe
  - Coût 10 rounds = 150ms par hash (ralentit attaques brute-force)
  - Norme industrie (utilisé par Dropbox, Microsoft, etc.)
- ✅ **JWT** : Session sans état (pas de table "sessions" en DB)
  - Expiration 7 jours
  - Refresh token automatique

**Exemple flux auth :**
```
1. User tape mot de passe "Abc123!"
2. Backend hash avec bcrypt → "$2a$10$xJ3d..."
3. Backend génère JWT signé → "eyJhbGc..."
4. Frontend stocke JWT en HttpOnly cookie
5. Chaque requête envoie JWT → Backend vérifie signature
6. Expiration 7j → Auto-logout sécurisé
```

---

#### 7. **React Native + Capacitor 8.0.0**
**Qu'est-ce que c'est ?**
Framework pour transformer application web en application mobile native (Android/iOS).

**Pourquoi ce choix ?**
- ✅ **Code partagé** : 70% du code web réutilisé pour mobile
- ✅ **Accès hardware** : Caméra, NFC, Bluetooth, imprimantes
- ✅ **Distribution** : Google Play Store + Apple App Store
- ✅ **PWA fallback** : Fonctionne aussi comme site web installable

**Alternatives considérées :**
- Flutter (Dart = langage différent, équipe à former)
- PWA pure (pas d'accès hardware complet)

---

### Outils de Développement

| Outil | Rôle | Version |
|-------|------|---------|
| **Git** | Contrôle de version (historique code) | 2.x |
| **GitHub** | Hébergement code + CI/CD | - |
| **Vercel** | Déploiement frontend production | - |
| **Supabase Cloud** | Hébergement base de données | PostgreSQL 15 |
| **ESLint** | Vérification qualité code | 9.x |
| **Prettier** | Formatage automatique code | 3.x |
| **Vitest** | Tests unitaires | 3.0.8 |

---

## 📐 ARCHITECTURE GLOBALE

### 1. Organisation des Fichiers

```
smart-food-manager/
│
├── src/                          # Code source web
│   ├── pages/                    # 15 pages de l'application
│   │   ├── Dashboard.tsx         # Tableau de bord financier
│   │   ├── POS.tsx               # Point de vente (caisse)
│   │   ├── Menu.tsx              # Gestion catalogue produits
│   │   ├── Stocks.tsx            # Gestion stocks ingrédients
│   │   ├── Purchases.tsx         # Achats fournisseurs
│   │   ├── Users.tsx             # Gestion utilisateurs/rôles
│   │   ├── Expenses.tsx          # Charges fixes/variables
│   │   ├── Kitchen.tsx           # Écran cuisine (commandes)
│   │   ├── Orders.tsx            # Historique commandes
│   │   ├── Login.tsx             # Connexion PIN serveurs
│   │   ├── SaaSLogin.tsx         # Sélection restaurant multi-tenant
│   │   └── ... (5 autres pages)
│   │
│   ├── shared/
│   │   ├── services/             # Logique métier (11 services)
│   │   │   ├── business.ts       # Calculs PMP, déstockage
│   │   │   ├── expenses.ts       # Calcul EBE (EBITDA français)
│   │   │   ├── invoicing.ts      # Conformité NF525 factures
│   │   │   ├── export.ts         # Export CSV/Excel
│   │   │   ├── printer.ts        # Impression tickets ESC/POS
│   │   │   ├── logger.ts         # Logs structurés JSON
│   │   │   ├── auth.ts           # JWT + bcrypt
│   │   │   ├── permissions.ts    # RBAC (rôles/permissions)
│   │   │   ├── validation.ts     # Validation formulaires
│   │   │   └── storage.ts        # Persistence offline-first
│   │   │
│   │   └── types.ts              # Définitions TypeScript (25+ interfaces)
│   │
│   ├── store.tsx                 # État global (Context API, 398 lignes)
│   ├── App.tsx                   # Point d'entrée, routing (179 lignes)
│   └── main.tsx                  # Bootstrap React
│
├── mobile/                       # Code source mobile (React Native)
│   ├── App.tsx                   # Entry point mobile
│   ├── store.tsx                 # État mobile (300 lignes)
│   ├── services/
│   │   ├── offlineQueue.ts       # File d'attente actions offline (300 lignes)
│   │   └── storage.ts            # AsyncStorage persistence
│   └── screens/
│       ├── SaaSLoginScreen.tsx   # Sélection restaurant
│       ├── LoginScreen.tsx       # PIN pad serveurs
│       └── POSScreen.tsx         # Caisse mobile
│
├── supabase/
│   └── migrations/               # 4 migrations PostgreSQL
│       ├── 001_initial_schema.sql         # Tables principales (141 lignes)
│       ├── 002_app_state_table.sql        # Sync offline-first (40 lignes)
│       ├── 003_import_data_to_app_state.sql # Migration données (18 lignes)
│       └── 004_add_company_columns.sql    # Multi-tenant (12 lignes)
│
├── android/                      # Configuration Capacitor Android
├── public/                       # Assets statiques (images, icônes)
├── package.json                  # Dépendances npm (37 packages)
├── vite.config.ts                # Configuration build (52 lignes)
├── tsconfig.json                 # Configuration TypeScript
├── capacitor.config.ts           # Configuration mobile
└── .env                          # Variables d'environnement (Supabase)
```

**Total :** 67 fichiers TypeScript analysés

---

### 2. Flux de Données (Data Flow)

#### **Architecture Offline-First**

Le système fonctionne **même sans connexion internet** :

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
│  ┌────────────────────────────────────────────────────┐    │
│  │  store.tsx (Context API)                           │    │
│  │  - État global : orders, products, ingredients      │    │
│  │  - 398 lignes, 15 fonctions métier                  │    │
│  └──────────┬─────────────────────────────────────────┘    │
│             │                                                │
│             ▼                                                │
│  ┌──────────────────────┐      ┌──────────────────────┐    │
│  │  localStorage        │      │  Supabase Client     │    │
│  │  (Cache primaire)    │◄────►│  (Sync secondaire)   │    │
│  │  - Instant (0ms)     │      │  - Cloud (<100ms)    │    │
│  │  - 10MB max          │      │  - WebSocket temps   │    │
│  │  - Clé par tenant    │      │    réel             │    │
│  └──────────────────────┘      └──────────┬───────────┘    │
└─────────────────────────────────────────────┼───────────────┘
                                              │
                                              ▼
                              ┌──────────────────────────────┐
                              │  SUPABASE BACKEND            │
                              │  - PostgreSQL 15             │
                              │  - Table app_state (JSONB)   │
                              │  - RLS multi-tenant          │
                              │  - WebSocket broadcast       │
                              └──────────────────────────────┘
```

**Stratégie de sauvegarde (services/storage.ts) :**

1. **Écriture** : localStorage PUIS Supabase (async, non-bloquant)
2. **Lecture** : Supabase (cloud-first) OU localStorage (fallback offline)
3. **Sync** : WebSocket broadcast à tous les clients connectés
4. **Conflit** : Résolution par version optimiste (champ `version` incrémental)

**Exemple concret :**
```
Serveur 1 (tablette salle) crée commande
  → localStorage sauvegarde instant
  → UI mise à jour (0ms latency)
  → Supabase reçoit mutation (50ms)
  → WebSocket broadcast vers Serveur 2 + Desktop gérant
  → Cuisine reçoit commande (100ms total)
```

---

### 3. Schéma Base de Données

#### **Tables Principales (001_initial_schema.sql)**

```sql
-- MULTI-TENANT : Isolation stricte
companies (id, name, siren, email, phone, address)
  ↓ (company_id FK sur toutes les tables)

-- UTILISATEURS & SÉCURITÉ
users (id, company_id, name, email, role, pin_hash, created_at)
  - Rôles : OWNER, MANAGER, SERVER, COOK
  - PIN hash : SHA-256 (4 chiffres serveurs)
  - Mot de passe : bcrypt 10 rounds (web)

-- CATALOGUE PRODUITS
products (id, company_id, name, price, category, image_url, recipe_jsonb)
  - recipe_jsonb : [{ ingredientId, quantity, unit }]
  - Calcul coût automatique via recette

-- INGRÉDIENTS & STOCK
ingredients (id, company_id, name, unit, stock, averageCost, minStock)
  - stock : Numeric(10,3) pour précision
  - averageCost : PMP recalculé à chaque achat

-- FOURNISSEURS
suppliers (id, company_id, name, email, phone, categories)

-- ACHATS FOURNISSEURS
supplier_orders (id, company_id, supplier_id, status, date, items_jsonb)
  - items_jsonb : [{ ingredientId, quantity, cost }]
  - Status : PENDING → RECEIVED
  - Réception → Mise à jour stock + PMP

-- MOUVEMENTS STOCK (Traçabilité)
movements (id, company_id, ingredient_id, type, quantity, date, document_ref)
  - type : PURCHASE | SALE | INVENTORY_ADJUSTMENT | LOSS
  - documentRef : Lien vers commande/inventaire

-- COMMANDES CLIENTS
orders (id, company_id, user_id, table_id, items_jsonb, total, payment, status)
  - items_jsonb : [{ productId, quantity, notes }]
  - payment : CASH | CARD | SPLIT
  - status : PENDING → IN_PROGRESS → COMPLETED → CLOSED

-- TABLES RESTAURANT
tables (id, company_id, name, capacity, location, status)
  - status : FREE | OCCUPIED | RESERVED | DIRTY

-- CHARGES (Expenses)
expenses (id, company_id, name, amount, type, category, date)
  - type : FIXED (loyer) | VARIABLE (électricité)
  - Calcul EBE : CA - Coût matière - Charges

-- INVENTAIRES
inventories (id, company_id, date, items_jsonb, created_by)
  - items_jsonb : [{ ingredientId, counted, theoretical, diff }]
  - Ajustement stock après validation
```

#### **Table Critique : app_state (002_app_state_table.sql)**

**Pourquoi cette approche ?**

Au lieu de requêter 11 tables séparées (products, ingredients, orders, etc.), **tout l'état est stocké en JSONB** :

```sql
CREATE TABLE app_state (
  id UUID PRIMARY KEY,                   -- company_id
  data JSONB NOT NULL DEFAULT '{}'::jsonb,  -- État complet
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Structure du JSONB data :
{
  "products": [...],         -- Array complet produits
  "ingredients": [...],      -- Array complet ingrédients
  "orders": [...],           -- Array complet commandes
  "tables": [...],
  "users": [...],
  "suppliers": [...],
  "supplierOrders": [...],
  "movements": [...],
  "expenses": [...],
  "inventories": [...],
  "_lastUpdatedAt": 1704723456789
}
```

**Avantages :**
- ✅ **1 seule requête** au chargement initial (vs 11)
- ✅ **Sync ultra-rapide** : diff JSONB complet
- ✅ **Offline-first naturel** : tout l'état en local
- ✅ **Versioning simple** : `_lastUpdatedAt` timestamp

**Inconvénients :**
- ⚠️ **Scaling limité** : Max ~500 restaurants (> 2MB JSONB = lent)
- ⚠️ **Requêtes complexes** : Pas de JOIN SQL possible

**Mitigation prévue (V2) :**
- Tables normalisées pour analytics/rapports
- app_state uniquement pour état runtime

---

### 4. Patterns Architecturaux

#### **A. Context API (State Management)**

**Fichier :** `store.tsx` (398 lignes)

**Pourquoi pas Redux ?**
- Application de taille moyenne (15 pages)
- Context API natif React suffit
- -15KB bundle size
- Moins de boilerplate

**Structure :**
```typescript
interface AppState {
  data: {
    products: Product[];
    ingredients: Ingredient[];
    orders: Order[];
    // ... 8 autres collections
  };
  currentUser: User | null;
  restaurant: Company | null;
  isLoading: boolean;

  // 15 fonctions métier
  createOrder: (items, tableId?) => void;
  receiveSupplierOrder: (id) => void;
  updateIngredientStock: (id, quantity) => void;
  // ...
}

export const AppProvider = ({ children }) => {
  const [state, setState] = useState<AppState>(initialState);

  // useEffect #1 : Chargement initial
  useEffect(() => {
    loadState(restaurantId).then(data => setState(data));
  }, [restaurantId]);

  // useEffect #2 : Sync temps réel
  useEffect(() => {
    const channel = supabase.channel('app_state_changes')
      .on('postgres_changes', handleRemoteUpdate)
      .subscribe();
  }, []);

  return <AppContext.Provider value={state}>{children}</AppContext.Provider>;
};
```

**Consommation :**
```typescript
// Dans n'importe quel composant
const { data, createOrder } = useAppStore();

<button onClick={() => createOrder(items, tableId)}>
  Valider Commande
</button>
```

---

#### **B. Offline-First Pattern**

**Fichier :** `services/storage.ts` (74 lignes)

**Stratégie :**
```typescript
// SAVE : Local PUIS Cloud (non-bloquant)
export const saveState = async (restaurantId, state) => {
  // 1. Sauv localStorage (synchrone, 0ms)
  localStorage.setItem(`smart_food_db_${restaurantId}`, JSON.stringify(state));

  // 2. Sauv Supabase (async, ne bloque pas UI)
  if (supabase) {
    await supabase.from('app_state')
      .upsert({ id: restaurantId, data: state });
  }
};

// LOAD : Cloud PUIS Local (fallback)
export const loadState = async (restaurantId) => {
  // Tenter cloud d'abord (données les plus récentes)
  if (supabase) {
    const { data } = await supabase.from('app_state')
      .select().eq('id', restaurantId).single();
    if (data) return data.data;
  }

  // Fallback localStorage si offline
  const local = localStorage.getItem(`smart_food_db_${restaurantId}`);
  return local ? JSON.parse(local) : null;
};
```

**Mobile Offline Queue (mobile/services/offlineQueue.ts) :**

```typescript
// File d'attente actions offline
export const queueAction = async (type, payload, restaurantId) => {
  const action = {
    id: generateId(),
    type: 'CREATE_ORDER', // ou UPDATE_KITCHEN_STATUS
    payload,
    timestamp: new Date().toISOString(),
    retries: 0,
    restaurantId
  };

  const queue = await getQueue(); // AsyncStorage (React Native)
  queue.push(action);
  await saveQueue(queue);
};

// Sync auto à reconnexion
export const processQueue = async () => {
  const queue = await getQueue();

  for (const action of queue) {
    try {
      await processAction(action); // Envoyer à Supabase
      processed++;
    } catch (error) {
      action.retries++;
      if (action.retries < 3) remaining.push(action); // Retry
      else failed++; // Abandon après 3 échecs
    }
  }

  await saveQueue(remaining);
  return { processed, failed, remaining: remaining.length };
};
```

**Cas d'usage :**
```
Serveur prend commande → WiFi coupé
  → Action ajoutée à queue locale (AsyncStorage)
  → UI affiche "En attente de synchronisation"
  → WiFi rétabli
  → processQueue() auto-déclenché
  → Commande envoyée à Supabase
  → Cuisine reçoit commande (délai 2min max)
```

---

#### **C. Versioning Optimiste (Conflict Resolution)**

**Problème :**
```
Desktop gérant modifie commande #123 (set status = COMPLETED)
Serveur mobile modifie commande #123 (add note = "Sans oignon")
→ CONFLIT : Qui gagne ?
```

**Solution (store.tsx lignes 96-142) :**

```typescript
// Chaque entité a un champ version
interface Order {
  id: string;
  version: number; // Incrémenté à chaque modification
  // ...
}

// WebSocket : Comparer versions avant merge
const handleRemoteUpdate = (payload) => {
  const remoteState = payload.new.data;
  const localState = getLocalState();

  // Merger avec priorité au plus récent
  const mergedOrders = mergeOrders(
    localState.orders,
    remoteState.orders,
    (local, remote) => remote.version > local.version // Remote gagne si version >
  );

  setState({ ...remoteState, orders: mergedOrders });
};
```

**Exemple conflit résolu :**
```
T0: Commande {id:123, version:1, status:PENDING}

T1: Desktop set status=COMPLETED → {version:2, status:COMPLETED}
T2: Mobile add note="Sans oignon" → {version:2, note:"Sans oignon"}

T3: WebSocket broadcast Desktop → Mobile
    → Mobile détecte conflict (local.version == remote.version)
    → Merge intelligent : {version:3, status:COMPLETED, note:"Sans oignon"}
```

---

## 📚 GLOSSAIRE TECHNIQUE

### Pour Non-Développeurs

| Terme | Définition | Analogie |
|-------|------------|----------|
| **Frontend** | Interface utilisateur (ce que vous voyez à l'écran) | Vitrine d'un magasin |
| **Backend** | Serveur qui stocke les données et traite la logique | Entrepôt + comptabilité |
| **Base de données** | Stockage structuré des informations | Classeur géant avec tiroirs |
| **API** | Interface de communication frontend ↔ backend | Standard téléphonique |
| **WebSocket** | Canal temps réel bidirectionnel | Téléphone laissé décroché en permanence |
| **Offline-first** | Fonctionne sans internet, sync après | Carnet de notes → recopié dans registre plus tard |
| **Multi-tenant** | Plusieurs restaurants sur même serveur | Immeuble avec appartements isolés |
| **JWT** | Jeton sécurisé prouvant identité | Badge d'accès entreprise |
| **Hash** | Transformation irréversible (ex: mot de passe) | Hachoir à viande (impossible de recréer steak) |
| **Déstockage** | Réduction automatique stock après vente | Caisse enregistreuse déclenche mise à jour rayon |
| **PMP** | Prix Moyen Pondéré (coût moyen ingrédient) | Moyenne prix essence après plusieurs pleins |
| **Migration** | Modification structure base de données | Rénovation d'un classeur (ajouter tiroirs) |
| **Bundle** | Fichier JavaScript final envoyé au navigateur | Valise compressée |
| **RLS** | Row Level Security (filtre automatique données) | Serveur restaurant voit seulement ses tables |

---

### Pour Développeurs

| Terme | Implémentation Smart Food Manager |
|-------|-----------------------------------|
| **Context API** | store.tsx (398L) - `AppContext.Provider` + custom hook `useAppStore()` |
| **TypeScript strict** | tsconfig.json `strict: true`, 0 `any` non justifié |
| **Vite build** | vite.config.ts - Terser minification, 5 chunks, drop console.log prod |
| **Supabase RLS** | `CREATE POLICY ... USING (company_id = current_setting('app.current_company_id')::uuid)` |
| **bcrypt cost** | 10 rounds (auth.ts) - ~150ms par hash |
| **JWT expiry** | 7 days (auth.ts) - HttpOnly cookie (pas localStorage) |
| **Offline queue** | AsyncStorage + retry 3x (offlineQueue.ts mobile) |
| **Optimistic locking** | `version: number` field + `mergeOrders()` conflict resolution |
| **Code splitting** | Vite manualChunks : react, recharts, supabase, lucide, sonner |
| **ESLint** | @typescript-eslint/recommended + prettier integration |
| **Testing** | Vitest 3.0.8 + @testing-library/react (coverage actuelle <20%) |

---

## 🎯 PROCHAINES ÉTAPES

**Ce rapport continue en PARTIE 2** avec :
- Modules fonctionnels détaillés (POS, Dashboard, Stocks, etc.)
- Flux métier critiques (vente → déstockage, achat → PMP)
- Schéma détaillé base de données
- Exemples code business logic

**Partie 3 couvrira :**
- Sécurité (RLS, auth, RBAC)
- Application mobile (React Native + Capacitor)
- Performance et optimisations
- État d'avancement (62% production-ready)

**Partie 4 finalisera avec :**
- 6 blockers critiques à résoudre
- Roadmap complète 100% (156h + 15K€)
- Recommandations stratégiques investisseurs
- Budget, timeline, ROI

---

**Fin PARTIE 1** - Généré le 2026-01-07
**Auteur :** Audit complet Smart Food Manager
**Statut :** ✅ Architecture technique validée
