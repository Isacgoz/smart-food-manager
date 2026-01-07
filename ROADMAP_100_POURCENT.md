# 🎯 ROADMAP VERS 100% PRODUCTION-READY

**Date:** 7 Janvier 2026
**État Actuel:** 82% Prêt
**Objectif:** 100% Production Commerciale Multi-Clients

---

## 📊 ÉTAT ACTUEL DÉTAILLÉ

### ✅ CE QUI EST PRÊT (82%)

#### Infrastructure & Déploiement
- ✅ Application Web déployée (Vercel)
- ✅ Build optimisé (450KB gzippé, 5 chunks)
- ✅ PWA installable (iOS + Android)
- ✅ Service Worker configuré
- ✅ Supabase PostgreSQL configuré
- ✅ Variables environnement production (.env)
- ✅ Headers sécurité (CSP, X-Frame-Options)
- ✅ SSL/HTTPS actif

#### Fonctionnalités Core Métier
- ✅ 15 pages React fonctionnelles
- ✅ Déstockage automatique lors ventes
- ✅ Calcul PMP (Prix Moyen Pondéré) automatique
- ✅ Gestion recettes (fiches techniques)
- ✅ Point de Vente (POS) tactile
- ✅ Écran cuisine temps réel (WebSocket)
- ✅ Gestion tables (FREE/OCCUPIED/DIRTY)
- ✅ Dashboard EBE (Excédent Brut d'Exploitation)
- ✅ Gestion charges fixes/variables (15 catégories)
- ✅ Multi-utilisateurs (OWNER/MANAGER/SERVER/COOK)
- ✅ Clôture caisse (Rapport Z)
- ✅ Historique factures

#### Sécurité
- ✅ Auth bcrypt (10 rounds) + JWT (7 jours)
- ✅ PIN 4 chiffres serveurs (SHA-256)
- ✅ Auto-lock 2 min inactivité
- ✅ RLS (Row Level Security) multi-tenant PostgreSQL
- ✅ Permissions granulaires par rôle
- ✅ Isolation données stricte (company_id)

#### Données & Sync
- ✅ Offline-first (localStorage + Supabase)
- ✅ Sync temps réel WebSocket (<100ms)
- ✅ Versioning optimiste (résolution conflits)
- ✅ 4 migrations SQL (schéma complet)
- ✅ Mouvements stock tracés
- ✅ Audit trail utilisateurs

---

## ❌ CE QUI MANQUE POUR 100% (18%)

### 🔴 BLOQUANTS CRITIQUES (6 items - 40h)

#### 1. Certification NF525 Anti-Fraude TVA (France) ⏱️ 16h + €5-10K
**Pourquoi critique:** OBLIGATOIRE commercialisation logiciel caisse en France

**Ce qui manque:**
- ❌ Audit organisme certifié (LNE, INFOCERT, etc.)
- ❌ Certificat conformité officiel
- ❌ Archivage sécurisé inaltérable 6 ans
- ❌ Journalisation complète modifications
- ❌ Clôture journalière obligatoire (déjà implémenté partiellement)
- ❌ Attestation individuelle de conformité

**Fichiers impactés:**
- `shared/services/invoicing.ts` (déjà 80% conforme)
- `components/Invoice.tsx` (mentions légales OK)
- Nouveau: `services/nf525-archival.ts` (à créer)
- Nouveau: `services/audit-logger.ts` (améliorer logger existant)

**Actions concrètes:**
1. Implémenter archivage immuable (blockchain OU signature électronique)
2. Ajouter horodatage certifié (serveur temps)
3. Créer exports XML comptables normalisés
4. Historique modifications prix (versions)
5. Audit trail complet (qui/quand/quoi)
6. Demander audit organisme (6-8 semaines délai)

**Coût:** 5 000€ - 10 000€ (certification) + 16h dev

---

#### 2. Tests Automatisés Coverage >80% ⏱️ 24h
**Pourquoi critique:** Éviter régressions, confiance déploiements

**État actuel:**
- ⚠️ Vitest configuré (vitest.config.ts OK)
- ⚠️ Structure tests/ vide
- ❌ Coverage actuel: ~5% (estimé)

**Tests critiques manquants:**

**A. Tests Unitaires Logique Métier (12h)**
```typescript
// shared/services/business.ts
describe('Calcul PMP', () => {
  test('Stock vide → PMP = prix unitaire')
  test('Stock existant → Formule pondérée correcte')
  test('Précision Numeric(10,2) maintenue')
  test('Stock négatif géré')
})

describe('Déstockage Auto', () => {
  test('Vente → Stock diminue quantité exacte')
  test('Stock insuffisant → Alerte + blocage')
  test('Recette vide → Pas de déstockage')
  test('Mouvements tracés correctement')
})

describe('Calcul Coûts & Marges', () => {
  test('Coût matière produit correct')
  test('Marge brute = prix - coût')
  test('Taux coût matière <30% OK')
})

// shared/services/expenses.ts
describe('Calcul EBE', () => {
  test('EBE = CA - Coût matière - Charges')
  test('Agrégation charges par catégorie')
  test('Période vide → 0€')
})

// shared/services/invoicing.ts
describe('Facturation NF525', () => {
  test('Numérotation séquentielle inaltérable')
  test('TVA détaillée par taux (5.5%, 10%, 20%)')
  test('Mentions légales complètes')
})
```

**B. Tests Intégration (8h)**
```typescript
describe('Flux Vente Complète', () => {
  test('POS → Validation stock → Commande → Déstockage → Facture')
  test('Stock insuffisant → Vente bloquée')
  test('Commande cuisine → WebSocket → Écran temps réel')
})

describe('Flux Achat Fournisseur', () => {
  test('Commande → Réception → PMP recalculé → Coûts produits MAJ')
})

describe('Flux Clôture Caisse', () => {
  test('Ouverture → Ventes → Clôture → Écarts calculés')
})
```

**C. Tests E2E Interface (4h)**
```typescript
// Playwright
test('Login admin → Dashboard chargé')
test('Créer produit → Sauvegarder → Apparaît dans liste')
test('POS: Ajouter panier → Payer → Facture générée')
```

**Fichiers à créer:**
- `tests/unit/business.test.ts`
- `tests/unit/expenses.test.test.ts`
- `tests/unit/invoicing.test.ts`
- `tests/integration/sale-flow.test.ts`
- `tests/integration/purchase-flow.test.ts`
- `tests/e2e/pos.spec.ts`

**Commandes:**
```bash
npm test -- --coverage
# Target: >80% sur services métier critiques
```

---

#### 3. Multi-Tenant Isolation Validation ⏱️ 4h
**Pourquoi critique:** Fuite données = catastrophe juridique RGPD

**Tests spécifiques manquants:**
```typescript
describe('Isolation Multi-Tenant', () => {
  test('Restaurant A ne voit PAS données Restaurant B', async () => {
    const restaurantA = 'uuid-A'
    const restaurantB = 'uuid-B'

    // Créer commande pour A
    await createOrder(items, restaurantA)

    // Charger state B
    const stateB = await loadState(restaurantB)

    // Vérifier isolation
    expect(stateB.orders).not.toContainEqual(expect.objectContaining({ restaurantId: restaurantA }))
  })

  test('RLS PostgreSQL bloque accès cross-tenant', async () => {
    // Tenter accès direct DB
    const { data, error } = await supabase
      .from('orders')
      .select()
      .eq('company_id', 'autre-restaurant-id')

    expect(error).toBeDefined() // RLS doit bloquer
    expect(data).toBeNull()
  })
})
```

**Vérifications manuelles requises:**
1. Créer 2 restaurants test (A et B)
2. Ajouter données dans A
3. Login dans B
4. Vérifier 0 données de A visibles
5. Tester dans Supabase SQL Editor:
```sql
-- Simuler context restaurant A
SET app.current_company_id = 'uuid-restaurant-A';
SELECT * FROM orders; -- Doit voir seulement orders de A

-- Simuler context restaurant B
SET app.current_company_id = 'uuid-restaurant-B';
SELECT * FROM orders; -- Doit voir seulement orders de B
```

---

#### 4. Migration Données Pilote Complète ⏱️ 4h
**Pourquoi critique:** Données test ≠ données réelles restaurant

**État actuel:**
- ✅ Migrations 001-003 créées
- ⚠️ Migration 003 import données hardcodées
- ❌ Script import CSV restaurant réel

**Ce qui manque:**

**A. Script Import CSV (2h)**
```typescript
// scripts/import-restaurant-data.ts
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as csv from 'csv-parser'

interface ImportData {
  ingredients: Array<{ name, unit, stock, minStock, averageCost }>
  products: Array<{ name, category, price, vatRate, recipe }>
  users: Array<{ name, email, role, pin }>
  suppliers: Array<{ name, email, phone, address }>
}

async function importFromCSV(companyId: string, files: {
  ingredients: string // path to CSV
  products: string
  users: string
}) {
  // 1. Parse CSVs
  const ingredients = await parseCSV(files.ingredients)
  const products = await parseCSV(files.products)
  const users = await parseCSV(files.users)

  // 2. Validate
  validateIngredients(ingredients)
  validateProducts(products)
  validateUsers(users)

  // 3. Transform to app_state format
  const appState = {
    users: transformUsers(users),
    ingredients: transformIngredients(ingredients),
    products: transformProducts(products),
    orders: [],
    tables: [],
    movements: [],
    expenses: [],
    _lastUpdatedAt: Date.now()
  }

  // 4. Upsert to Supabase
  await supabase
    .from('app_state')
    .upsert({ id: companyId, data: appState })
}
```

**B. Templates CSV (1h)**
Créer fichiers templates:
- `templates/import_ingredients.csv`
- `templates/import_products.csv`
- `templates/import_users.csv`
- `templates/import_suppliers.csv`

**C. Documentation Import (1h)**
- Guide pas-à-pas remplissage CSV
- Validation format (unités, prix, etc.)
- Commande CLI:
```bash
npm run import -- --company=uuid --ingredients=data.csv
```

---

#### 5. Monitoring Production & Alertes ⏱️ 8h
**Pourquoi critique:** Bugs production invisibles = perte clients

**Ce qui manque:**

**A. Intégration Sentry (2h)**
```typescript
// services/monitoring.ts
import * as Sentry from '@sentry/react'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_APP_ENV,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay()
  ]
})

// Capturer erreurs métier
export const captureBusinessError = (error: Error, context: any) => {
  Sentry.captureException(error, {
    tags: { type: 'business_logic' },
    extra: context
  })
}
```

**B. Web Vitals Tracking (1h)**
```typescript
// services/analytics.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

function sendToAnalytics(metric) {
  // Envoyer à Google Analytics ou Vercel Analytics
  console.log(metric)
}

getCLS(sendToAnalytics)
getFID(sendToAnalytics)
getFCP(sendToAnalytics)
getLCP(sendToAnalytics)
getTTFB(sendToAnalytics)
```

**C. Alertes Critiques (3h)**
```typescript
// services/alerts.ts
export const criticalAlerts = {
  stockNegative: (ingredient: string, qty: number) => {
    // Email + SMS gérant
    sendAlert({
      level: 'CRITICAL',
      message: `Stock négatif: ${ingredient} (${qty})`,
      recipients: ['manager@restaurant.fr']
    })
  },

  cashDiscrepancy: (expected: number, actual: number, diff: number) => {
    if (Math.abs(diff) > 50) { // >50€ écart
      sendAlert({
        level: 'HIGH',
        message: `Écart caisse: ${diff}€ (théo: ${expected}€, réel: ${actual}€)`
      })
    }
  },

  dbSyncFailed: (error: string) => {
    sendAlert({
      level: 'CRITICAL',
      message: `Sync DB échouée: ${error}`,
      recipients: ['tech@smartfood.fr']
    })
  }
}
```

**D. Dashboard Monitoring (2h)**
- Page admin `/monitoring` (OWNER only)
- Métriques:
  - Uptime dernières 24h
  - Erreurs count (Sentry)
  - Web Vitals moyens
  - Alertes déclenchées
  - Queue offline size (mobile)

---

#### 6. Documentation Utilisateur Complète ⏱️ 8h
**Pourquoi critique:** Support client = coût récurrent

**Ce qui manque:**

**A. Guide Gérant Complet (4h)**
`docs/GUIDE_GERANT.md`:
- Première connexion
- Créer ingrédients (avec screenshots)
- Créer produits + recettes
- Gérer fournisseurs
- Réceptionner commandes
- Faire inventaire
- Lire dashboard
- Exporter données comptable
- Gérer équipe (ajouter serveurs)
- Clôturer caisse
- Résoudre problèmes courants

**B. Guide Serveur Mobile (2h)**
`docs/GUIDE_SERVEUR.md`:
- Installer PWA sur téléphone
- Se connecter avec PIN
- Prendre commande
- Modifier table
- Ajouter notes client ("sans oignon")
- Encaisser (espèces/CB)
- Que faire si offline
- Problèmes fréquents

**C. Guide Cuisinier (1h)**
`docs/GUIDE_CUISINE.md`:
- Lire ticket imprimé
- Statuts commandes (QUEUED → PREPARING → READY)
- Marquer commande prête
- Gérer rush

**D. FAQ Complète (1h)**
`docs/FAQ.md`:
- 30+ questions/réponses
- Catégories: Technique, Métier, Comptabilité, Mobile
- Exemples:
  - "Comment corriger une vente erreur ?"
  - "Stock négatif, que faire ?"
  - "Comment changer un prix ?"
  - "Données perdues après reset téléphone ?"

---

### 🟠 AMÉLIORATIONS IMPORTANTES (8 items - 60h)

#### 7. Backup Automatique ⏱️ 4h
**Impact:** Perte données = catastrophe

**À implémenter:**
```typescript
// services/backup.ts
import { supabase } from './storage'
import * as cron from 'node-cron'

// Backup quotidien 3h du matin
cron.schedule('0 3 * * *', async () => {
  const companies = await supabase.from('companies').select('id')

  for (const company of companies.data) {
    const { data } = await supabase
      .from('app_state')
      .select()
      .eq('id', company.id)
      .single()

    // Export JSON vers S3/Supabase Storage
    const backup = {
      company_id: company.id,
      timestamp: new Date().toISOString(),
      data: data.data
    }

    await supabase.storage
      .from('backups')
      .upload(`${company.id}/${Date.now()}.json`, JSON.stringify(backup))

    // Garder 30 derniers jours seulement
    await cleanOldBackups(company.id, 30)
  }
})
```

**Configuration requise:**
- Créer bucket Supabase `backups` (privé)
- Cron job Vercel OU serveur dédié
- Interface restauration backup (page admin)

---

#### 8. Export Comptable Normalisé ⏱️ 8h
**Impact:** Expert-comptable = client essentiel

**Formats à supporter:**

**A. Export CSV Ventes (2h)**
```typescript
// services/export-accounting.ts
export function exportSalesCSV(startDate: string, endDate: string): string {
  const orders = getOrdersByPeriod(startDate, endDate)

  // Format FEC (Fichier des Écritures Comptables)
  const csv = [
    'Date|Numéro|Compte|Libellé|Débit|Crédit|Lettrage',
    ...orders.map(o =>
      `${o.date}|${o.invoiceNumber}|707000|Vente ${o.items[0].name}|0|${o.total}|`
    )
  ].join('\n')

  return csv
}
```

**B. Export TVA (2h)**
```typescript
export function exportVATReport(period: string): {
  tva_collectee_5_5: number
  tva_collectee_10: number
  tva_collectee_20: number
  base_ht_5_5: number
  base_ht_10: number
  base_ht_20: number
} {
  // Calcul conforme déclaration CA3
}
```

**C. Export Charges (2h)**
```typescript
export function exportExpensesCSV(year: number): string {
  const expenses = getExpensesByYear(year)

  // Format compatible Excel expert-comptable
  const csv = [
    'Date|Catégorie|Type|Montant|Fournisseur|Commentaire',
    ...expenses.map(e =>
      `${e.createdAt}|${e.category}|${e.type}|${e.amount}|${e.supplier}|${e.notes}`
    )
  ].join('\n')

  return csv
}
```

**D. Interface Export Dashboard (2h)**
Page `/exports` avec:
- Sélecteur période
- Boutons export (CSV, Excel, PDF)
- Preview données avant download
- Historique exports générés

---

#### 9. Gestion Erreurs & Edge Cases ⏱️ 12h
**Impact:** Stabilité production

**Cas non gérés actuellement:**

**A. Stock négatif autorisé (4h)**
```typescript
// Actuellement: Alerte mais autorise vente
// Souhaité: 3 modes configurables

enum StockNegativePolicy {
  BLOCK = 'BLOCK',      // Bloquer vente
  WARN = 'WARN',        // Alerter mais autoriser
  SILENT = 'SILENT'     // Autoriser sans alerte
}

// Ajouter dans Company settings
interface CompanySettings {
  stockNegativePolicy: StockNegativePolicy
  allowPartialOrders: boolean // Autoriser commande partielle si stock insuffisant
}
```

**B. Annulation commande avec restock (3h)**
```typescript
// services/order-cancellation.ts
export async function cancelOrder(orderId: string, reason: string) {
  const order = orders.find(o => o.id === orderId)

  // 1. Marquer commande annulée
  order.status = 'CANCELLED'
  order.cancelReason = reason
  order.cancelledAt = new Date()

  // 2. RESTOCKAGE inverse
  const movements: StockMovement[] = []
  order.items.forEach(item => {
    const product = products.find(p => p.id === item.productId)
    product.recipe.forEach(recipeItem => {
      // Inverser déstockage
      const ingredient = ingredients.find(i => i.id === recipeItem.ingredientId)
      ingredient.stock += recipeItem.quantity * item.quantity

      movements.push({
        id: generateId(),
        type: 'CANCELLATION',
        ingredientId: recipeItem.ingredientId,
        quantity: +recipeItem.quantity * item.quantity, // Positif
        date: new Date(),
        documentRef: orderId
      })
    })
  })

  // 3. Trace audit
  logger.audit('CANCEL_ORDER', 'ORDER', orderId, { reason })
}
```

**C. Modification prix avec impact historique (3h)**
```typescript
// Problème actuel: Modifier prix produit change coûts anciennes commandes
// Solution: Versionning prix

interface ProductPriceHistory {
  productId: string
  price: number
  validFrom: Date
  validUntil: Date | null
}

// Lors calcul coût commande historique
function getProductPriceAtDate(productId: string, date: Date): number {
  return priceHistory.find(h =>
    h.productId === productId &&
    h.validFrom <= date &&
    (h.validUntil === null || h.validUntil > date)
  )?.price
}
```

**D. Gestion conflits multi-utilisateurs (2h)**
```typescript
// Cas: 2 serveurs modifient même commande simultanément
// Solution: Lock optimiste déjà implémenté (version) mais améliorer UI

function handleConflict(localOrder: Order, remoteOrder: Order) {
  if (remoteOrder.version > localOrder.version) {
    // Version remote plus récente
    showNotification({
      type: 'warning',
      message: `Commande #${remoteOrder.number} modifiée par ${remoteOrder.userId}. Rechargement...`,
      action: 'Recharger'
    })

    // Fusionner intelligemment ou proposer choix
    return remoteOrder
  }
}
```

---

#### 10. Optimisation Performance Queries ⏱️ 8h
**Impact:** Lenteur = frustration utilisateurs

**Goulots identifiés:**

**A. Query app_state devient lent (>500 restaurants) (3h)**
```typescript
// Problème: Tout le state en 1 JSONB
// Impact: Query >5s si 10K commandes

// Solution 1: Partitionnement temporel
CREATE TABLE app_state_archive (
  id UUID,
  month DATE, -- 2025-01
  data JSONB
)

// Garder seulement 3 derniers mois dans app_state
// Archiver ancien dans app_state_archive

// Solution 2: Indexes JSONB
CREATE INDEX idx_app_state_orders_date
ON app_state USING gin ((data->'orders'));
```

**B. Dashboard calculs lents (>1000 commandes) (3h)**
```typescript
// Problème: useMemo recalcule à chaque render
// Solution: Pré-agréger en backend

// Nouvelle table: daily_stats
CREATE TABLE daily_stats (
  id UUID PRIMARY KEY,
  company_id UUID,
  date DATE,
  total_sales NUMERIC(10,2),
  total_cost NUMERIC(10,2),
  gross_margin NUMERIC(10,2),
  orders_count INTEGER,
  avg_ticket NUMERIC(10,2),
  created_at TIMESTAMPTZ
)

// Trigger: Calculer stats quotidiennes à 00h
// Frontend: Charger stats précalculées au lieu recalculer
```

**C. Recherche produits lente (>500 produits) (2h)**
```typescript
// Ajouter recherche full-text PostgreSQL
CREATE INDEX idx_products_search
ON products USING gin (to_tsvector('french', name || ' ' || category))

// Utiliser dans query
SELECT * FROM products
WHERE to_tsvector('french', name || ' ' || category) @@ to_tsquery('burger')
```

---

#### 11. Internationalisation (i18n) ⏱️ 12h
**Impact:** Expansion hors France

**Librairie:** react-i18next

**A. Setup i18n (2h)**
```typescript
// i18n/config.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import fr from './locales/fr.json'
import en from './locales/en.json'

i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr }, en: { translation: en } },
  lng: 'fr',
  fallbackLng: 'fr',
  interpolation: { escapeValue: false }
})
```

**B. Traduction UI (6h)**
```json
// i18n/locales/fr.json
{
  "pos.cart": "Panier",
  "pos.total": "Total",
  "pos.send": "Envoyer",
  "dashboard.revenue": "Chiffre d'Affaires",
  ...
}

// i18n/locales/en.json
{
  "pos.cart": "Cart",
  "pos.total": "Total",
  "pos.send": "Send",
  "dashboard.revenue": "Revenue",
  ...
}
```

**C. Formats locaux (2h)**
```typescript
// Dates
format(date, 'PP', { locale: fr }) // 7 janvier 2026
format(date, 'PP', { locale: enUS }) // January 7, 2026

// Monnaies
new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(12.5)
// 12,50 €

new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(12.5)
// $12.50
```

**D. Unités métriques/impériales (2h)**
```typescript
// France: kg, L
// USA: lb, gal

enum UnitSystem {
  METRIC = 'METRIC',
  IMPERIAL = 'IMPERIAL'
}

function convertUnit(value: number, from: Unit, to: Unit): number {
  // kg <-> lb
  // L <-> gal
}
```

---

#### 12. Mode Multi-Sites ⏱️ 16h
**Impact:** Chaînes restaurants (>1 établissement)

**Architecture actuelle:** 1 company_id = 1 restaurant
**Souhaité:** 1 company_id = N restaurants (sites)

**Modifications requises:**

**A. Schéma DB (4h)**
```sql
-- Nouvelle table: sites
CREATE TABLE sites (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  name VARCHAR(255), -- "Restaurant Paris 15e"
  address TEXT,
  manager_id UUID, -- Gérant site
  created_at TIMESTAMPTZ
)

-- Modifier tables existantes
ALTER TABLE app_state ADD COLUMN site_id UUID REFERENCES sites(id);
ALTER TABLE orders ADD COLUMN site_id UUID;
ALTER TABLE users ADD COLUMN site_id UUID; -- Serveurs attachés à site
```

**B. UI Sélecteur Site (3h)**
```typescript
// Nouveau: SiteSelectorDropdown
const [currentSite, setCurrentSite] = useState<Site | null>(null)

// Filtrer données par site
const orders = allOrders.filter(o => o.siteId === currentSite.id)
```

**C. Dashboard Consolidé (5h)**
```typescript
// Vue multi-sites (OWNER uniquement)
interface ConsolidatedStats {
  totalRevenue: number // Somme tous sites
  revenuePerSite: { siteId: string, revenue: number }[]
  bestSite: Site
  worstSite: Site
}
```

**D. Gestion Stocks Inter-Sites (4h)**
```typescript
// Transfert stock Site A → Site B
function transferStock(
  ingredientId: string,
  fromSiteId: string,
  toSiteId: string,
  quantity: number
) {
  // Déduire stock Site A
  // Ajouter stock Site B
  // Mouvement type: TRANSFER
}
```

---

### 🟢 NICE TO HAVE (6 items - 40h)

#### 13. Impression Thermique Réseau Auto-Discovery ⏱️ 6h
**Impact:** Simplifier config imprimante

```typescript
// services/printer-discovery.ts
import * as mdns from 'mdns' // Multicast DNS

export async function discoverPrinters(): Promise<Array<{
  name: string
  ip: string
  model: string
}>> {
  const browser = mdns.createBrowser(mdns.tcp('printer'))

  return new Promise((resolve) => {
    const printers = []

    browser.on('serviceUp', (service) => {
      printers.push({
        name: service.name,
        ip: service.addresses[0],
        model: service.txtRecord.model
      })
    })

    setTimeout(() => {
      browser.stop()
      resolve(printers)
    }, 5000) // Scan 5 secondes
  })
}

// UI: Dropdown liste imprimantes détectées
```

---

#### 14. Notifications Push (PWA + Native) ⏱️ 8h
**Impact:** Alertes temps réel même app fermée

**A. PWA Push (4h)**
```typescript
// Service Worker
self.addEventListener('push', (event) => {
  const data = event.data.json()

  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: { url: data.url }
  })
})

// Backend: Envoyer push
import webpush from 'web-push'

webpush.sendNotification(subscription, JSON.stringify({
  title: '🔥 Nouvelle commande',
  body: 'Table 5 - Burger x2',
  url: '/kitchen'
}))
```

**B. Android Native Push (4h)**
```typescript
// Capacitor Push Notifications
import { PushNotifications } from '@capacitor/push-notifications'

await PushNotifications.register()

PushNotifications.addListener('pushNotificationReceived', (notification) => {
  alert(`${notification.title}: ${notification.body}`)
})
```

---

#### 15. QR Code Tables ⏱️ 4h
**Impact:** Client commande directement via QR

```typescript
// Générer QR code par table
import QRCode from 'qrcode'

const url = `https://app.com/order?table=${tableId}&restaurant=${companyId}`
const qrCode = await QRCode.toDataURL(url)

// Client scan → Page commande
// Serveur notifié quand commande validée
```

---

#### 16. Analytics Avancés ⏱️ 10h
**Impact:** Insights business

**Métriques à ajouter:**
- Prévisions ventes (ML simple)
- ABC products (pareto 20/80)
- Panier moyen évolution
- Taux rétention clients
- Heures rush détectées
- Recommandations stock optimal

```typescript
// services/analytics-advanced.ts
export function forecastSales(historicalData: Order[], daysAhead: number): number {
  // Régression linéaire simple
  const trend = calculateTrend(historicalData)
  return trend * daysAhead
}

export function abcAnalysis(products: Product[], orders: Order[]): {
  A: Product[] // 80% CA
  B: Product[] // 15% CA
  C: Product[] // 5% CA
} {
  // Pareto
}
```

---

#### 17. Intégration Comptabilité (Sage, QuickBooks) ⏱️ 8h
**Impact:** Export auto expert-comptable

```typescript
// services/integrations/sage.ts
export async function exportToSage(orders: Order[], period: string) {
  const xml = generateSageXML(orders)

  // Upload FTP Sage
  await ftpClient.upload(xml, `/import/${period}.xml`)
}
```

---

#### 18. Mode Offline 100% ⏱️ 4h
**Impact:** Fonctionner sans connexion >24h

**Améliorations:**
```typescript
// Service Worker: Cache ALL assets
workbox.routing.registerRoute(
  ({ request }) => request.destination === 'script' || request.destination === 'style',
  new workbox.strategies.CacheFirst()
)

// IndexedDB: Stocker gros volumes
import Dexie from 'dexie'

const db = new Dexie('SmartFoodDB')
db.version(1).stores({
  orders: 'id, date',
  products: 'id, name',
  ingredients: 'id, name'
})

// Sync différé robuste (retry exponentiel)
```

---

## 📊 SYNTHÈSE ROADMAP

### Par Priorité

| Priorité | Items | Heures | Coût | Délai |
|----------|-------|--------|------|-------|
| 🔴 **CRITIQUE** | 6 | 56h | 15K€* | 2-3 sem |
| 🟠 **IMPORTANT** | 8 | 60h | 0€ | 2-3 sem |
| 🟢 **NICE TO HAVE** | 6 | 40h | 0€ | 1-2 sem |
| **TOTAL** | **20** | **156h** | **15K€** | **5-8 sem** |

*Certification NF525 uniquement (5-10K€)

### Par Catégorie

| Catégorie | Items | Heures |
|-----------|-------|--------|
| Tests & Qualité | 3 | 28h |
| Sécurité & Conformité | 2 | 20h |
| Performance | 2 | 12h |
| Documentation | 2 | 12h |
| Features Métier | 5 | 44h |
| Intégrations | 3 | 18h |
| Mobile | 2 | 12h |
| Monitoring | 1 | 10h |

### Timeline Recommandée

#### Phase 1 - CRITICAL (Semaines 1-3)
**Objectif:** Prêt certification + pilote sécurisé
- ✅ Tests automatisés >80% coverage
- ✅ Multi-tenant validation complète
- ✅ Documentation utilisateur complète
- ✅ Monitoring + alertes production
- ✅ Backup automatique
- 🔄 NF525 : préparation audit (dev terminé)

**Livrables:**
- Suite tests complète (28h)
- Docs utilisateurs finalisées (8h)
- Monitoring dashboard (8h)
- Backup automatique (4h)
- Multi-tenant testé (4h)
- Dossier NF525 audit (16h)

**Total:** 68h (2-3 semaines @ 30h/sem)

---

#### Phase 2 - IMPORTANT (Semaines 4-6)
**Objectif:** Stabilité production + expérience utilisateur
- ✅ Export comptable normalisé
- ✅ Gestion erreurs & edge cases
- ✅ Optimisation performance queries
- ✅ Import données CSV pilote
- ✅ i18n FR/EN/ES
- ✅ Multi-sites (si chaînes)

**Livrables:**
- Export FEC + TVA (8h)
- Gestion stock négatif + annulations (12h)
- Optimisation DB queries (8h)
- Script import CSV (4h)
- i18n 3 langues (12h)
- Multi-sites (16h optionnel)

**Total:** 44h-60h (2-3 semaines)

---

#### Phase 3 - NICE TO HAVE (Semaines 7-8)
**Objectif:** Différenciation concurrentielle
- ✅ Impression auto-discovery
- ✅ Notifications push
- ✅ QR codes tables
- ✅ Analytics avancés
- ✅ Intégrations comptables
- ✅ Offline 100%

**Total:** 40h (1-2 semaines)

---

## 🎯 JALONS CLÉS

### Jalon 1: Production Pilote Sécurisée (Semaine 3)
**Critères validation:**
- [ ] Tests coverage >80% (services critiques)
- [ ] Multi-tenant validé (2 restaurants test isolés)
- [ ] Monitoring actif (Sentry configuré)
- [ ] Backup quotidien fonctionnel
- [ ] Documentation complète (Gérant + Serveur)
- [ ] 1 restaurant pilote configuré avec vraies données

**Go/No-Go:** Pilote commercial possible

---

### Jalon 2: Production Multi-Clients (Semaine 6)
**Critères validation:**
- [ ] Export comptable testé avec expert-comptable
- [ ] Gestion erreurs robuste (stock négatif, annulations)
- [ ] Performance <2s dashboard (1000+ commandes)
- [ ] i18n FR/EN fonctionnel
- [ ] 3 restaurants pilotes actifs

**Go/No-Go:** Commercialisation restreinte (beta)

---

### Jalon 3: Certification NF525 Obtenue (Semaine 8-16)
**Dépendances:**
- Audit organisme (6-8 semaines délai)
- Tests conformité (2 semaines)
- Corrections suite audit (1-2 semaines)

**Critères validation:**
- [ ] Certificat NF525 reçu
- [ ] Attestation individuelle générée

**Go/No-Go:** Commercialisation ouverte France

---

### Jalon 4: Version 2.0 Complète (Semaine 10)
**Critères validation:**
- [ ] Toutes features nice-to-have livrées
- [ ] Tests E2E passent (Playwright)
- [ ] Lighthouse score >95
- [ ] Support multi-sites testé
- [ ] 10+ restaurants actifs

**Go/No-Go:** Scale-up commercial

---

## 💰 BUDGET DÉTAILLÉ

### Développement Interne
| Phase | Heures | Taux (75€/h) | Total |
|-------|--------|--------------|-------|
| Phase 1 (Critical) | 68h | 75€ | 5 100€ |
| Phase 2 (Important) | 60h | 75€ | 4 500€ |
| Phase 3 (Nice to Have) | 40h | 75€ | 3 000€ |
| **TOTAL DEV** | **168h** | | **12 600€** |

### Certifications & Services
| Item | Coût | Fréquence |
|------|------|-----------|
| Certification NF525 | 5 000€ - 10 000€ | Unique |
| Audit annuel NF525 | 1 000€ - 2 000€ | Annuel |
| Sentry (monitoring) | 29€/mois | Mensuel |
| Supabase Pro (>500 users) | 25€/mois | Mensuel |
| Vercel Pro | 20€/mois | Mensuel |

### Infrastructure Production (estimé 100 restaurants)
| Service | Coût Unitaire | Volume | Total/Mois |
|---------|---------------|--------|------------|
| Supabase | 0.25€/restaurant | 100 | 25€ |
| Vercel | Forfait | - | 20€ |
| Sentry | Forfait | - | 29€ |
| Backup S3 | 0.023€/GB | 50GB | 1.15€ |
| **TOTAL/MOIS** | | | **75€** |

### ROI Estimé

**Hypothèses:**
- Plan TEAM: 79€/mois/restaurant
- Coût acquisition client (CAC): 200€
- Taux conversion beta: 30%
- Taux churn mensuel: 5%

**Scénario 100 restaurants:**
```
Revenus/mois: 100 × 79€ = 7 900€
Coûts/mois: 75€ (infra) + 200€ (support) = 275€
Marge/mois: 7 900€ - 275€ = 7 625€

Break-even dev: 12 600€ / 7 625€ = 1.65 mois
Break-even certif: 10 000€ / 7 625€ = 1.31 mois
Break-even total: 22 600€ / 7 625€ = 2.96 mois

ROI 12 mois: (7 625€ × 12) - 22 600€ = 69 100€
```

---

## ⚠️ RISQUES & MITIGATION

### Risque 1: Certification NF525 Refusée
**Probabilité:** Moyenne (30%)
**Impact:** Critique (bloque commercialisation France)

**Mitigation:**
- Pré-audit interne avec checklist NF525
- Consultation expert certification (1 jour)
- Tests conformité exhaustifs
- Plan B: Vendre hors France (Belgique, Suisse)

---

### Risque 2: Performance Dégradée (>1000 restaurants)
**Probabilité:** Haute (60%)
**Impact:** Moyen (lenteurs utilisateurs)

**Mitigation:**
- Tests charge dès 500 restaurants simulés
- Migration architecture si besoin:
  - app_state JSONB → Tables relationnelles
  - Cache Redis
  - CDN assets statiques
- Budget alloué: 20h refactoring

---

### Risque 3: Bugs Production Critiques
**Probabilité:** Moyenne (40%)
**Impact:** Critique (perte clients)

**Mitigation:**
- Tests coverage >80% AVANT production
- Rollback automatique Vercel
- Monitoring alertes temps réel (Sentry)
- Support 24/7 premier mois pilote
- Budget hotfix: 10h/mois

---

### Risque 4: Concurrence Aggressive
**Probabilité:** Haute (70%)
**Impact:** Moyen (pression prix)

**Mitigation:**
- Différenciation: Déstockage auto (unique)
- Pricing compétitif: 29-79€ vs 59-99€ concurrents
- Lock-in: Export données facile (transparence)
- Roadmap rapide: 1 feature/mois

---

## 📋 CHECKLIST FINALE 100%

### Infrastructure (8/8)
- [x] App web déployée HTTPS
- [x] PWA installable
- [x] Supabase PostgreSQL configuré
- [x] Variables env production
- [ ] Backup automatique quotidien
- [ ] Monitoring Sentry actif
- [x] Headers sécurité (CSP, etc.)
- [x] Service Worker fonctionnel

### Sécurité (6/8)
- [x] Auth bcrypt + JWT
- [x] RLS multi-tenant
- [x] Auto-lock 2min
- [x] Permissions rôles
- [ ] Multi-tenant validé tests
- [ ] Audit trail complet
- [x] PIN hash SHA-256
- [ ] RGPD conformité auditée

### Fonctionnalités (14/15)
- [x] POS caisse
- [x] Déstockage auto
- [x] Calcul PMP
- [x] Dashboard EBE
- [x] Gestion recettes
- [x] Gestion tables
- [x] Clôture caisse Z
- [x] Multi-utilisateurs
- [x] Écran cuisine temps réel
- [x] Gestion charges
- [x] Historique factures
- [x] Upload images
- [ ] Annulation commande avec restock
- [x] Export CSV basique
- [ ] Export comptable FEC

### Conformité Légale (4/6)
- [x] SIREN/SIRET/TVA type Company
- [x] Numérotation factures inaltérable
- [x] Mentions légales complètes
- [x] TVA détaillée par taux
- [ ] Certification NF525 obtenue
- [ ] Archivage sécurisé 6 ans

### Tests & Qualité (2/8)
- [x] Vitest configuré
- [ ] Tests unitaires >80% coverage
- [ ] Tests intégration flux critiques
- [ ] Tests E2E Playwright
- [ ] Tests multi-tenant
- [ ] Tests performance (1000+ commandes)
- [ ] Tests offline prolongé (>24h)
- [ ] Tests edge cases

### Documentation (3/6)
- [x] README.md
- [x] GUIDE_PRODUCTION.md
- [x] TODO_PILOTE.md
- [ ] GUIDE_GERANT.md complet (screenshots)
- [ ] GUIDE_SERVEUR.md
- [ ] FAQ.md (30+ Q&A)

### Performance (5/8)
- [x] Bundle <500KB gzippé
- [x] Code splitting 5 chunks
- [x] Lighthouse >90
- [ ] Dashboard <2s (1000+ commandes)
- [ ] Queries optimisées (indexes)
- [ ] Cache stratégique
- [x] Lazy loading images
- [ ] Web Vitals tracking

### Mobile (4/6)
- [x] PWA installable iOS/Android
- [x] Layout responsive
- [x] Sync temps réel WebSocket
- [ ] Offline queue testée >24h
- [ ] Notifications push
- [ ] Mode 100% offline

### Intégrations (0/5)
- [ ] Export comptable FEC
- [ ] Export TVA CA3
- [ ] Impression auto-discovery
- [ ] Sage/QuickBooks API
- [ ] Paiement TPE (optionnel)

### Monitoring (1/6)
- [ ] Sentry erreurs
- [ ] Web Vitals
- [ ] Alertes critiques email/SMS
- [x] Logs structurés
- [ ] Dashboard monitoring admin
- [ ] Uptime tracking

---

## 🎯 SCORE ACTUEL: 47/76 = 62%

**Pour atteindre 100%:** 29 items restants

**Priorisation recommandée:**

### Sprint 1 (Semaine 1-2): Critical Path
1. Tests automatisés (28h)
2. Monitoring Sentry (8h)
3. Backup automatique (4h)
4. Multi-tenant validation (4h)
**Total: 44h**

### Sprint 2 (Semaine 3-4): Stabilité
1. Documentation complète (12h)
2. Gestion erreurs edge cases (12h)
3. Export comptable (8h)
4. Import CSV pilote (4h)
**Total: 36h**

### Sprint 3 (Semaine 5-6): Performance
1. Optimisation queries (8h)
2. i18n (12h)
3. Offline 100% (4h)
4. Web Vitals tracking (2h)
**Total: 26h**

### Sprint 4 (Semaine 7-8): Certification
1. NF525 préparation audit (16h)
2. Archivage sécurisé (6h)
3. Audit trail complet (4h)
**Total: 26h**

### Sprint 5 (Semaine 9-16): Certification
1. Audit organisme (délai externe)
2. Corrections suite audit (TBD)

---

## 📞 SUPPORT & RESSOURCES

**Questions techniques:**
- GitHub Issues: https://github.com/Isacgoz/smart-food-manager/issues
- Email dev: dev@smartfood.fr

**Certification NF525:**
- LNE: https://www.lne.fr
- INFOCERT: https://www.infocert.fr
- Guide officiel: https://www.economie.gouv.fr/dgfip/logiciels-caisse

**Documentation externe:**
- Supabase Docs: https://supabase.com/docs
- React Testing Library: https://testing-library.com
- Sentry: https://docs.sentry.io

---

**Dernière mise à jour:** 7 Janvier 2026
**Prochaine révision:** Fin Sprint 1 (Semaine 2)
