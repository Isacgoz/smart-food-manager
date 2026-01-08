# 🎯 PLAN FINAL VERS 100% PRODUCTION-READY

**Date:** 8 Janvier 2026 18:45
**État Actuel:** 75% → **Objectif: 100%**
**Temps Restant Estimé:** 72 heures (~3-4 semaines)

---

## 📊 ÉTAT ACTUEL CONFIRMÉ

### ✅ CE QUI EST FAIT (75%)

**Infrastructure & Déploiement:**
- ✅ Vercel deployment READY (build 26s)
- ✅ Supabase PostgreSQL + RLS actif
- ✅ Multi-tenant isolation configurée
- ✅ Variables env Vercel (6 configurées)
- ✅ Bucket backups + policies storage
- ✅ Migration 005 & 006 exécutées
- ✅ Company "Restaurant La Bonne Bouffe" migrée

**Code & Tests:**
- ✅ 221/221 tests passent
- ✅ Build optimisé (450KB gzipped)
- ✅ PWA installable
- ✅ Service Worker configuré

**Bugs Résolus:**
- ✅ Build Vercel (duplicate rollupOptions)
- ✅ Registration button (type="button")
- ✅ Import backup.ts (path corrigé)

---

## ❌ CE QUI MANQUE POUR 100% (25% restant)

### 🎯 SPRINT FINAL - 3 Phases Critiques

---

## PHASE 1: STABILITÉ & TESTS (32h) 🔴 URGENT

### A. Tests Multi-Tenant Isolation (4h) ⚠️ CRITIQUE RGPD

**Objectif:** Garantir étanchéité données entre restaurants

**Tasks:**
```typescript
// tests/integration/multi-tenant-isolation.test.ts

describe('Isolation Multi-Tenant RLS', () => {
  beforeAll(async () => {
    // Créer 2 companies test
    restaurantA = await createCompany('Restaurant Alpha', 'PRO')
    restaurantB = await createCompany('Food Truck Beta', 'TEAM')
  })

  test('Restaurant A ne voit PAS données Restaurant B', async () => {
    // Login Restaurant A
    const sessionA = await loginRestaurant(restaurantA.id)

    // Créer commande dans A
    const orderA = await createOrder({
      restaurantId: restaurantA.id,
      items: [{ product: 'Burger', quantity: 2 }]
    }, sessionA)

    // Login Restaurant B
    const sessionB = await loginRestaurant(restaurantB.id)

    // Charger commandes B
    const ordersB = await loadOrders(sessionB)

    // CRITIQUE: B ne doit PAS voir commande de A
    expect(ordersB).not.toContainEqual(
      expect.objectContaining({ id: orderA.id })
    )
  })

  test('RLS PostgreSQL bloque accès direct', async () => {
    const { data, error } = await supabase
      .from('app_state')
      .select()
      .eq('company_id', restaurantB.id)
      // Login avec token restaurantA

    expect(error).toBeDefined()
    expect(error.message).toContain('policy')
  })

  test('WebSocket temps réel respecte isolation', async () => {
    // Souscription A
    const channelA = supabase
      .channel(`orders:${restaurantA.id}`)
      .on('INSERT', handleOrderA)

    // Souscription B
    const channelB = supabase
      .channel(`orders:${restaurantB.id}`)
      .on('INSERT', handleOrderB)

    // Créer commande dans A
    await createOrder({ restaurantId: restaurantA.id })

    // CRITIQUE: channelB ne doit PAS recevoir event
    await sleep(500)
    expect(handleOrderB).not.toHaveBeenCalled()
  })
})
```

**Vérifications manuelles SQL:**
```sql
-- Supabase SQL Editor

-- 1. Vérifier RLS activé
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('app_state', 'companies');
-- Résultat attendu: rowsecurity = true (t)

-- 2. Vérifier policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public';
-- Résultat attendu: 8+ policies

-- 3. Test isolation direct
-- Simuler context restaurant A
SELECT set_config('request.jwt.claims', '{"company_id": "11111111-1111-1111-1111-111111111111"}', true);
SELECT * FROM app_state; -- Doit voir seulement A

-- Simuler context restaurant B
SELECT set_config('request.jwt.claims', '{"company_id": "22222222-2222-2222-2222-222222222222"}', true);
SELECT * FROM app_state; -- Doit voir seulement B
```

**Fichiers à créer:**
- `tests/integration/multi-tenant-isolation.test.ts`
- `tests/security/rls-policies.test.ts`

**Temps:** 4h

---

### B. Documentation Utilisateur Complète (12h)

**Objectif:** Pilote commercial impossible sans docs

#### B1. GUIDE_GERANT.md (6h)

**Structure:**
```markdown
# Guide Gérant - Smart Food Manager

## 1. Première Connexion (10 min)
- Créer compte restaurant
- Configurer infos établissement
- Ajouter logo (upload)
- Configurer TVA (5.5%, 10%, 20%)

## 2. Gestion Ingrédients (15 min)
### Créer un ingrédient
[Screenshot: Page Ingrédients]
1. Cliquer "Nouvel Ingrédient"
2. Remplir formulaire:
   - Nom: "Pain à Burger"
   - Unité: "pièce"
   - Stock initial: 100
   - Seuil min: 20
   - Coût moyen: 0.35€
3. Sauvegarder

### Import CSV (optionnel)
[Screenshot: Bouton Import CSV]
1. Télécharger template CSV
2. Remplir Excel
3. Import → Validation automatique
4. Confirmer

## 3. Création Produits & Recettes (20 min)
### Créer un produit
[Screenshot: Page Produits]
1. "Nouveau Produit"
2. Informations:
   - Nom: "Burger Classique"
   - Catégorie: "Burgers"
   - Prix: 12.50€
   - TVA: 10%

### Associer recette
[Screenshot: Onglet Recette]
1. Ajouter ingrédients:
   - Pain: 1 pièce
   - Steak haché: 150g
   - Fromage: 1 tranche
   - Oignons: 20g
2. Coût matière calculé automatiquement: 3.20€
3. Marge brute: 9.30€ (73%)

## 4. Gestion Utilisateurs (10 min)
[Screenshot: Page Users]
- OWNER: Accès total
- MANAGER: Dashboard + Stocks
- SERVER: POS uniquement
- COOK: Écran cuisine

### Créer serveur
1. Nom: "Marie Dupont"
2. PIN: 1234 (4 chiffres)
3. Rôle: SERVER

## 5. Utilisation POS (Point de Vente)
[Screenshot: Interface POS]
1. Login PIN serveur
2. Sélectionner table OU "À emporter"
3. Ajouter produits au panier
4. "Envoyer Cuisine" → Ticket imprimé
5. "Encaisser" → Espèces OU Carte
6. Rendu monnaie calculé

## 6. Dashboard & Indicateurs
[Screenshot: Dashboard]
- CA journalier temps réel
- EBE (Excédent Brut Exploitation)
- Top 5 ventes
- Alertes stock bas
- Graphiques tendances

## 7. Clôture Caisse
[Screenshot: Clôture]
1. Fin service → "Clôturer Caisse"
2. Compter espèces réelles
3. Comparer théorique vs réel
4. Écart tracé automatiquement
5. Export PDF Rapport Z

## 8. Exports Comptables
- Ventes CSV (import expert-comptable)
- TVA détaillée CA3
- Mouvements stock
- Factures PDF

## 9. Problèmes Fréquents

### Stock négatif
**Symptôme:** "Stock insuffisant pour Burger"
**Solution:**
1. Vérifier recette (quantités correctes?)
2. Faire inventaire
3. Ajuster stock si besoin

### Écart caisse important
**Symptôme:** Écart >50€ clôture
**Solution:**
1. Vérifier paiements CB enregistrés
2. Compter à nouveau espèces
3. Vérifier remboursements

### Produit pas affiché POS
**Symptôme:** Produit invisible sur écran serveur
**Solution:**
1. Vérifier catégorie assignée
2. Produit pas archivé
3. Actualiser page (F5)
```

**Temps:** 6h (rédaction + screenshots + tests)

---

#### B2. GUIDE_SERVEUR.md (3h)

**Structure:**
```markdown
# Guide Serveur - Smart Food Manager

## Installation PWA (1 min)
[Screenshot: Bouton Install]
iOS:
1. Safari → "Ajouter à l'écran d'accueil"
2. Icône Smart Food Manager

Android:
1. Chrome → Menu → "Installer l'application"

## Login PIN (30 sec)
[Screenshot: Login]
1. Entrer votre PIN 4 chiffres
2. Accès POS direct

## Prendre Commande Table (2 min)
[Screenshot: Sélection table]
1. Cliquer table (ex: "Table 5")
2. Statut passe OCCUPIED
3. Sélectionner produits par catégorie
4. Ajouter quantités
5. Notes spéciales: "Sans oignon", "Bien cuit"
6. "Envoyer Cuisine" → Ticket imprimé

## Commande À Emporter (1 min)
1. "Nouvelle Commande"
2. Type: "À emporter"
3. Même process que table

## Encaisser (1 min)
[Screenshot: Paiement]
1. Cliquer "Encaisser"
2. Espèces:
   - Montant reçu: 20€
   - Rendu calculé: 7.50€
3. Carte bancaire:
   - Valider TPE
   - Ticket CB

## Modifier/Annuler Commande (30 sec)
Avant envoi cuisine:
1. Panier → Poubelle sur ligne
2. Modifier quantité

Après envoi:
1. Appeler gérant (annulation restreinte)

## Mode Offline
Si WiFi coupé:
- ⚠️ "Mode Hors Ligne" affiché
- Commandes sauvegardées localement
- Sync automatique à reconnexion
```

**Temps:** 3h

---

#### B3. FAQ.md (3h)

**30+ Questions/Réponses:**
```markdown
# FAQ - Smart Food Manager

## Technique

**Q: Puis-je utiliser sur tablette Android?**
R: Oui, installation PWA via Chrome

**Q: Fonctionne sans Internet?**
R: Oui, mode offline + sync différée

**Q: Quelle imprimante compatible?**
R: Toute imprimante thermique ESC/POS (réseau ou USB)

## Métier

**Q: Comment calculer mon prix de vente?**
R: Formule: Coût matière × 3.5 = Prix HT (marge 70%)

**Q: PMP c'est quoi?**
R: Prix Moyen Pondéré, recalculé après chaque achat fournisseur

**Q: Stock théorique vs inventaire?**
R:
- Théorique: calculé automatiquement (achats - ventes)
- Inventaire: comptage réel (ajuste théorique)

**Q: Comment gérer casse/vol?**
R: Inventaire → Déclarer écart → Stock ajusté

## Comptabilité

**Q: Export compatible avec mon expert-comptable?**
R: Oui, CSV format FEC (Fichier Écritures Comptables)

**Q: TVA automatique?**
R: Oui, configurée par produit (5.5%, 10%, 20%)

**Q: Clôture journalière obligatoire?**
R: Non pour pilote, OUI si certification NF525

## Multi-tenant

**Q: Plusieurs restaurants sur un compte?**
R: Oui, prévu architecture (pas encore UI de switch)

**Q: Données isolées entre restaurants?**
R: Oui, RLS PostgreSQL garantit étanchéité

## Limites actuelles

**Q: Gestion stocks par dépôt?**
R: Non, prévu V2

**Q: Multi-sites?**
R: Non, prévu V2

**Q: Réservations en ligne?**
R: Non, prévu V2
```

**Temps:** 3h

---

### C. Monitoring Sentry Production (8h)

**Objectif:** Visibilité erreurs temps réel

#### C1. Installation & Config (3h)

```bash
# Installation
npm install @sentry/react @sentry/tracing

# Configuration
```

**Fichier `src/services/monitoring.ts`:**
```typescript
import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'

export const initSentry = () => {
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [
        new BrowserTracing(),
        new Sentry.Replay({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],
      tracesSampleRate: 0.1, // 10% transactions
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0, // 100% erreurs
      environment: import.meta.env.MODE,
      beforeSend(event, hint) {
        // Filtrer erreurs non critiques
        if (event.exception?.values?.[0]?.value?.includes('manifest.json')) {
          return null // Ignorer
        }
        return event
      },
    })
  }
}

export const captureException = Sentry.captureException
export const captureMessage = Sentry.captureMessage
export const setUser = Sentry.setUser
```

**Fichier `src/main.tsx`:**
```typescript
import { initSentry } from './services/monitoring'

initSentry()

// Wrapper ErrorBoundary
ReactDOM.createRoot(document.getElementById('root')!).render(
  <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
    <App />
  </Sentry.ErrorBoundary>
)
```

**Env vars Vercel:**
```
VITE_SENTRY_DSN=https://xxxxx@o123456.ingest.sentry.io/7654321
```

**Temps:** 3h

---

#### C2. Instrumentation Code Métier (5h)

**Capturer erreurs critiques:**

```typescript
// shared/services/business.ts
import { captureException, captureMessage } from '../../services/monitoring'

export const calculatePMP = (
  currentStock: number,
  currentPMP: number,
  receivedQty: number,
  unitPrice: number
): number => {
  try {
    if (currentStock < 0) {
      captureMessage('Stock négatif détecté avant calcul PMP', {
        level: 'warning',
        extra: { currentStock, receivedQty, unitPrice }
      })
    }

    const totalValue = (currentStock * currentPMP) + (receivedQty * unitPrice)
    const totalQty = currentStock + receivedQty

    if (totalQty === 0) {
      throw new Error('Division par zéro PMP')
    }

    const newPMP = totalValue / totalQty

    if (newPMP < 0 || !isFinite(newPMP)) {
      throw new Error(`PMP invalide: ${newPMP}`)
    }

    return newPMP

  } catch (error) {
    captureException(error, {
      tags: { module: 'business', function: 'calculatePMP' },
      extra: { currentStock, currentPMP, receivedQty, unitPrice }
    })
    throw error // Re-throw après capture
  }
}
```

**Capturer échecs sync:**
```typescript
// services/storage.ts
export const syncToSupabase = async (state: AppState) => {
  try {
    const { error } = await supabase
      .from('app_state')
      .upsert({
        id: state.restaurant.id,
        company_id: state.restaurant.id,
        data: state
      })

    if (error) {
      captureException(error, {
        tags: { module: 'sync', operation: 'upsert' },
        extra: { restaurantId: state.restaurant.id }
      })
      throw error
    }

  } catch (error) {
    captureException(error)
    throw error
  }
}
```

**Dashboard Sentry:**
- Créer compte sentry.io
- Projet "smart-food-manager"
- Configurer alertes Slack/Email
- Dashboard métriques erreurs

**Temps:** 5h

---

### D. Export Comptable Normalisé (8h)

**Objectif:** Expert-comptable peut importer données

#### D1. Export FEC (Fichier Écritures Comptables) (4h)

```typescript
// shared/services/fec-export.ts

interface FECLine {
  JournalCode: string        // VE (ventes)
  JournalLib: string          // "Ventes"
  EcritureNum: string         // Numéro facture
  EcritureDate: string        // YYYYMMDD
  CompteNum: string           // 707000 (ventes)
  CompteLib: string           // "Ventes marchandises"
  CompAuxNum: string          // Code client (optionnel)
  CompAuxLib: string          // Nom client
  PieceRef: string            // Référence pièce
  PieceDate: string           // YYYYMMDD
  EcritureLib: string         // Libellé
  Debit: string               // Montant débit
  Credit: string              // Montant crédit
  EcritureLet: string         // Lettrage (vide)
  DateLet: string             // Date lettrage (vide)
  ValidDate: string           // Date validation
  Montantdevise: string       // Montant devise étrangère (vide)
  Idevise: string             // Code devise (vide)
}

export const generateFEC = (
  invoices: Invoice[],
  startDate: Date,
  endDate: Date
): string => {
  const lines: FECLine[] = []

  invoices
    .filter(inv => inv.date >= startDate && inv.date <= endDate)
    .forEach(invoice => {
      const date = format(invoice.date, 'yyyyMMdd')

      // Ligne crédit vente (707000)
      lines.push({
        JournalCode: 'VE',
        JournalLib: 'Ventes',
        EcritureNum: invoice.number,
        EcritureDate: date,
        CompteNum: '707000',
        CompteLib: 'Ventes marchandises',
        CompAuxNum: '',
        CompAuxLib: invoice.customerName || 'Client comptoir',
        PieceRef: invoice.number,
        PieceDate: date,
        EcritureLib: `Vente ${invoice.number}`,
        Debit: '',
        Credit: invoice.totalHT.toFixed(2),
        EcritureLet: '',
        DateLet: '',
        ValidDate: date,
        Montantdevise: '',
        Idevise: ''
      })

      // Ligne débit client (411000)
      lines.push({
        JournalCode: 'VE',
        JournalLib: 'Ventes',
        EcritureNum: invoice.number,
        EcritureDate: date,
        CompteNum: '411000',
        CompteLib: 'Clients',
        CompAuxNum: invoice.customerId || 'COMPTOIR',
        CompAuxLib: invoice.customerName || 'Client comptoir',
        PieceRef: invoice.number,
        PieceDate: date,
        EcritureLib: `Vente ${invoice.number}`,
        Debit: invoice.totalTTC.toFixed(2),
        Credit: '',
        EcritureLet: '',
        DateLet: '',
        ValidDate: date,
        Montantdevise: '',
        Idevise: ''
      })

      // Lignes TVA (par taux)
      Object.entries(invoice.vatDetails).forEach(([rate, amount]) => {
        const vatAccount = rate === '20' ? '445710' :
                          rate === '10' ? '445711' :
                          '445712' // 5.5%

        lines.push({
          JournalCode: 'VE',
          JournalLib: 'Ventes',
          EcritureNum: invoice.number,
          EcritureDate: date,
          CompteNum: vatAccount,
          CompteLib: `TVA collectée ${rate}%`,
          CompAuxNum: '',
          CompAuxLib: '',
          PieceRef: invoice.number,
          PieceDate: date,
          EcritureLib: `TVA ${rate}% vente ${invoice.number}`,
          Debit: '',
          Credit: amount.toFixed(2),
          EcritureLet: '',
          DateLet: '',
          ValidDate: date,
          Montantdevise: '',
          Idevise: ''
        })
      })
    })

  // CSV avec séparateur pipe |
  const headers = Object.keys(lines[0]).join('|')
  const rows = lines.map(line => Object.values(line).join('|'))

  return [headers, ...rows].join('\n')
}
```

**UI Export:**
```tsx
// components/ExportComptable.tsx

const ExportComptable = () => {
  const [startDate, setStartDate] = useState(startOfMonth(new Date()))
  const [endDate, setEndDate] = useState(endOfMonth(new Date()))

  const handleExportFEC = () => {
    const fec = generateFEC(invoices, startDate, endDate)
    downloadCSV(fec, `FEC_${format(startDate, 'yyyyMM')}.txt`)
  }

  return (
    <div>
      <h2>Export Comptable</h2>
      <DateRangePicker
        start={startDate}
        end={endDate}
        onChange={(s, e) => { setStartDate(s); setEndDate(e) }}
      />
      <button onClick={handleExportFEC}>
        Télécharger FEC (Expert-Comptable)
      </button>
    </div>
  )
}
```

**Temps:** 4h

---

#### D2. Export TVA Déclaration CA3 (2h)

```typescript
// shared/services/tva-export.ts

interface TVASummary {
  period: string
  totalHT: number
  tva55: { base: number, tva: number }
  tva10: { base: number, tva: number }
  tva20: { base: number, tva: number }
  totalTVA: number
  totalTTC: number
}

export const generateTVASummary = (
  invoices: Invoice[],
  month: Date
): TVASummary => {
  const filtered = invoices.filter(inv =>
    isSameMonth(inv.date, month)
  )

  const summary: TVASummary = {
    period: format(month, 'yyyy-MM'),
    totalHT: 0,
    tva55: { base: 0, tva: 0 },
    tva10: { base: 0, tva: 0 },
    tva20: { base: 0, tva: 0 },
    totalTVA: 0,
    totalTTC: 0
  }

  filtered.forEach(inv => {
    inv.items.forEach(item => {
      const baseHT = item.quantity * item.unitPrice
      const tva = baseHT * (item.vatRate / 100)

      if (item.vatRate === 5.5) {
        summary.tva55.base += baseHT
        summary.tva55.tva += tva
      } else if (item.vatRate === 10) {
        summary.tva10.base += baseHT
        summary.tva10.tva += tva
      } else if (item.vatRate === 20) {
        summary.tva20.base += baseHT
        summary.tva20.tva += tva
      }

      summary.totalHT += baseHT
      summary.totalTVA += tva
    })
  })

  summary.totalTTC = summary.totalHT + summary.totalTVA

  return summary
}

// Export CSV CA3
export const exportCA3CSV = (summary: TVASummary): string => {
  return `
Période,${summary.period}
Base HT 5.5%,${summary.tva55.base.toFixed(2)}
TVA 5.5%,${summary.tva55.tva.toFixed(2)}
Base HT 10%,${summary.tva10.base.toFixed(2)}
TVA 10%,${summary.tva10.tva.toFixed(2)}
Base HT 20%,${summary.tva20.base.toFixed(2)}
TVA 20%,${summary.tva20.tva.toFixed(2)}
Total HT,${summary.totalHT.toFixed(2)}
Total TVA,${summary.totalTVA.toFixed(2)}
Total TTC,${summary.totalTTC.toFixed(2)}
`.trim()
}
```

**Temps:** 2h

---

#### D3. Export Mouvements Stock (2h)

```typescript
// shared/services/stock-export.ts

export const exportStockMovements = (
  movements: StockMovement[],
  startDate: Date,
  endDate: Date
): string => {
  const filtered = movements.filter(m =>
    m.date >= startDate && m.date <= endDate
  )

  const csv = [
    ['Date', 'Ingrédient', 'Type', 'Quantité', 'Coût Unitaire', 'Valeur', 'Référence'].join(';')
  ]

  filtered.forEach(m => {
    csv.push([
      format(m.date, 'yyyy-MM-dd HH:mm'),
      m.ingredientName,
      m.type, // PURCHASE, SALE, ADJUSTMENT
      m.quantity.toFixed(3),
      m.unitCost.toFixed(2),
      (m.quantity * m.unitCost).toFixed(2),
      m.reference || ''
    ].join(';'))
  })

  return csv.join('\n')
}
```

**Temps:** 2h

---

## PHASE 2: PERFORMANCE & OPTIMISATION (24h) 🟡 IMPORTANT

### A. Optimisation Queries Supabase (8h)

**Problème actuel:**
- Queries chargent TOUT app_state (peut devenir >1MB)
- Pas de pagination
- Pas d'indexes JSONB

**Solutions:**

#### A1. Indexes JSONB (2h)

```sql
-- Supabase SQL Editor

-- Index sur restaurant.id dans JSONB
CREATE INDEX idx_app_state_restaurant_id
ON app_state USING GIN ((data->'restaurant'));

-- Index sur products array
CREATE INDEX idx_app_state_products
ON app_state USING GIN ((data->'products'));

-- Index sur orders récentes
CREATE INDEX idx_app_state_orders_date
ON app_state USING GIN ((data->'orders'));

-- Vérifier performance
EXPLAIN ANALYZE
SELECT data->'products'
FROM app_state
WHERE company_id = 'uuid-test';
```

**Temps:** 2h

---

#### A2. Table Pré-agrégée daily_stats (4h)

**Objectif:** Dashboard rapide sans recalculer

```sql
-- Migration 007: daily_stats table
CREATE TABLE daily_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id),
  date DATE NOT NULL,
  revenue_ht NUMERIC(10,2) DEFAULT 0,
  revenue_ttc NUMERIC(10,2) DEFAULT 0,
  cost_materials NUMERIC(10,2) DEFAULT 0,
  gross_margin NUMERIC(10,2) DEFAULT 0,
  orders_count INTEGER DEFAULT 0,
  customers_count INTEGER DEFAULT 0,
  avg_ticket NUMERIC(10,2) DEFAULT 0,
  top_products JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, date)
);

CREATE INDEX idx_daily_stats_company_date ON daily_stats(company_id, date DESC);
```

**Service calcul stats:**
```typescript
// shared/services/stats-aggregator.ts

export const aggregateDailyStats = async (
  companyId: string,
  date: Date
): Promise<DailyStats> => {
  const { data: appState } = await supabase
    .from('app_state')
    .select('data')
    .eq('company_id', companyId)
    .single()

  const orders = appState.data.orders.filter(o =>
    isSameDay(new Date(o.date), date)
  )

  const stats = {
    company_id: companyId,
    date: format(date, 'yyyy-MM-dd'),
    revenue_ht: orders.reduce((sum, o) => sum + o.totalHT, 0),
    revenue_ttc: orders.reduce((sum, o) => sum + o.totalTTC, 0),
    cost_materials: orders.reduce((sum, o) => sum + (o.costMaterials || 0), 0),
    gross_margin: 0, // calculé après
    orders_count: orders.length,
    customers_count: new Set(orders.map(o => o.customerId)).size,
    avg_ticket: 0, // calculé après
    top_products: calculateTopProducts(orders)
  }

  stats.gross_margin = stats.revenue_ht - stats.cost_materials
  stats.avg_ticket = stats.orders_count > 0 ? stats.revenue_ttc / stats.orders_count : 0

  // Upsert dans daily_stats
  await supabase
    .from('daily_stats')
    .upsert(stats)

  return stats
}
```

**Cron quotidien:**
```javascript
// api/cron/aggregate-stats.js
export default async function handler(req, res) {
  if (req.query.secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Agréger stats J-1 pour toutes companies
  const yesterday = subDays(new Date(), 1)

  const { data: companies } = await supabase
    .from('companies')
    .select('id')
    .eq('is_active', true)

  for (const company of companies) {
    await aggregateDailyStats(company.id, yesterday)
  }

  res.json({ success: true, date: yesterday, companies: companies.length })
}
```

**vercel.json:**
```json
{
  "crons": [
    {
      "path": "/api/cron/backup",
      "schedule": "0 3 * * *"
    },
    {
      "path": "/api/cron/aggregate-stats",
      "schedule": "0 4 * * *"
    }
  ]
}
```

**Temps:** 4h

---

#### A3. Pagination Queries (2h)

```typescript
// services/storage.ts

export const loadOrdersPaginated = async (
  companyId: string,
  page: number = 1,
  limit: number = 50
): Promise<{ orders: Order[], hasMore: boolean }> => {
  const { data, error } = await supabase
    .from('app_state')
    .select('data->orders')
    .eq('company_id', companyId)
    .single()

  if (error) throw error

  const allOrders = data.orders as Order[]
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit

  return {
    orders: allOrders.slice(startIndex, endIndex),
    hasMore: endIndex < allOrders.length
  }
}
```

**Temps:** 2h

---

### B. Mode Offline 100% (8h)

**Objectif:** App fonctionne >24h sans réseau

#### B1. Service Worker Cache Complet (4h)

```typescript
// public/sw.js (améliorer existant)

const CACHE_VERSION = 'v2'
const CACHE_NAME = `smart-food-${CACHE_VERSION}`

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/js/index-*.js',
  '/assets/css/index-*.css',
  // Icônes
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  // Fonts
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
]

// Cache-first strategy
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(event.request).then((networkResponse) => {
        // Cache dynamique pour assets
        if (event.request.destination === 'image' ||
            event.request.destination === 'font') {
          const cache = await caches.open(CACHE_NAME)
          cache.put(event.request, networkResponse.clone())
        }

        return networkResponse
      }).catch(() => {
        // Fallback offline
        if (event.request.destination === 'document') {
          return caches.match('/offline.html')
        }
      })
    })
  )
})
```

**Temps:** 4h

---

#### B2. IndexedDB Gros Volumes (Dexie.js) (4h)

**Problème:** localStorage limité 5-10MB

**Solution:** IndexedDB illimité

```typescript
// services/offline-db.ts
import Dexie, { Table } from 'dexie'

class OfflineDB extends Dexie {
  orders!: Table<Order>
  products!: Table<Product>
  syncQueue!: Table<SyncQueueItem>

  constructor() {
    super('SmartFoodDB')
    this.version(1).stores({
      orders: 'id, date, restaurantId',
      products: 'id, name, category',
      syncQueue: '++id, timestamp, synced'
    })
  }
}

export const db = new OfflineDB()

// Sauvegarder commande offline
export const saveOrderOffline = async (order: Order) => {
  await db.orders.add(order)
  await db.syncQueue.add({
    type: 'CREATE_ORDER',
    payload: order,
    timestamp: Date.now(),
    synced: false
  })
}

// Sync différée
export const syncPendingChanges = async () => {
  const pending = await db.syncQueue.where('synced').equals(false).toArray()

  for (const item of pending) {
    try {
      if (item.type === 'CREATE_ORDER') {
        await supabase.from('orders').insert(item.payload)
      }
      // Marquer synced
      await db.syncQueue.update(item.id!, { synced: true })
    } catch (error) {
      console.error('Sync failed:', error)
      // Retry plus tard
    }
  }
}
```

**Temps:** 4h

---

### C. Web Vitals Tracking (8h)

```typescript
// services/web-vitals.ts
import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals'

const sendToAnalytics = (metric) => {
  if (import.meta.env.PROD) {
    // Envoyer à Vercel Analytics
    fetch('/api/analytics/vitals', {
      method: 'POST',
      body: JSON.stringify(metric)
    })
  }
}

export const initWebVitals = () => {
  onCLS(sendToAnalytics)
  onFID(sendToAnalytics)
  onFCP(sendToAnalytics)
  onLCP(sendToAnalytics)
  onTTFB(sendToAnalytics)
}
```

**Objectifs:**
- LCP (Largest Contentful Paint): <2.5s
- FID (First Input Delay): <100ms
- CLS (Cumulative Layout Shift): <0.1
- FCP (First Contentful Paint): <1.8s
- TTFB (Time to First Byte): <600ms

**Temps:** 8h

---

## PHASE 3: CERTIFICATION NF525 (16h + 6-8 semaines) 🔴 BLOQUANT COMMERCIAL

### A. Archivage Immuable 6 ans (8h)

```typescript
// services/nf525-archival.ts

interface ArchiveEntry {
  id: string
  type: 'INVOICE' | 'Z_REPORT'
  data: Invoice | ZReport
  hash: string  // SHA-256
  previousHash: string
  timestamp: number
  signature: string  // Signature électronique
}

class BlockchainArchival {
  private chain: ArchiveEntry[] = []

  async addEntry(type: ArchiveEntry['type'], data: any): Promise<void> {
    const previousHash = this.chain.length > 0
      ? this.chain[this.chain.length - 1].hash
      : '0'

    const entry: ArchiveEntry = {
      id: crypto.randomUUID(),
      type,
      data,
      hash: '',
      previousHash,
      timestamp: Date.now(),
      signature: ''
    }

    // Hash SHA-256
    entry.hash = await this.calculateHash(entry)

    // Signature électronique (certificat qualifié requis)
    entry.signature = await this.signEntry(entry)

    this.chain.push(entry)

    // Sauvegarder immuable Supabase
    await this.persistEntry(entry)
  }

  private async calculateHash(entry: Omit<ArchiveEntry, 'hash' | 'signature'>): Promise<string> {
    const data = JSON.stringify(entry)
    const buffer = new TextEncoder().encode(data)
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  private async signEntry(entry: ArchiveEntry): Promise<string> {
    // Certificat électronique qualifié requis (eIDAS)
    // Prestataire: DocuSign, Adobe Sign, etc.
    const signature = await signWithQualifiedCertificate(entry)
    return signature
  }

  private async persistEntry(entry: ArchiveEntry): Promise<void> {
    // Table immuable append-only
    await supabase
      .from('nf525_archive')
      .insert({
        id: entry.id,
        type: entry.type,
        data: entry.data,
        hash: entry.hash,
        previous_hash: entry.previousHash,
        timestamp: entry.timestamp,
        signature: entry.signature
      })
  }

  async verifyChain(): Promise<boolean> {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i]
      const previous = this.chain[i - 1]

      // Vérifier hash précédent
      if (current.previousHash !== previous.hash) {
        return false
      }

      // Recalculer hash et vérifier
      const calculatedHash = await this.calculateHash({
        id: current.id,
        type: current.type,
        data: current.data,
        previousHash: current.previousHash,
        timestamp: current.timestamp
      })

      if (calculatedHash !== current.hash) {
        return false
      }

      // Vérifier signature
      const validSignature = await verifySignature(current)
      if (!validSignature) {
        return false
      }
    }

    return true
  }
}

export const archival = new BlockchainArchival()
```

**Migration SQL:**
```sql
-- Migration 008: NF525 Archivage
CREATE TABLE nf525_archive (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id),
  type TEXT NOT NULL CHECK (type IN ('INVOICE', 'Z_REPORT')),
  data JSONB NOT NULL,
  hash TEXT NOT NULL,
  previous_hash TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  signature TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Immuable: pas de UPDATE/DELETE
  CONSTRAINT no_update CHECK (false)
);

-- Interdire UPDATE/DELETE
CREATE RULE no_update_nf525 AS ON UPDATE TO nf525_archive DO INSTEAD NOTHING;
CREATE RULE no_delete_nf525 AS ON DELETE TO nf525_archive DO INSTEAD NOTHING;

-- Index
CREATE INDEX idx_nf525_company ON nf525_archive(company_id, timestamp DESC);
CREATE INDEX idx_nf525_type ON nf525_archive(type);
```

**Temps:** 8h

---

### B. Audit Trail Complet (4h)

```typescript
// services/audit-logger.ts

interface AuditLog {
  id: string
  userId: string
  userName: string
  action: string
  entity: string
  entityId: string
  changes: {
    before: any
    after: any
  }
  ipAddress: string
  userAgent: string
  timestamp: number
}

export const logAudit = async (log: Omit<AuditLog, 'id' | 'timestamp'>) => {
  const entry: AuditLog = {
    ...log,
    id: crypto.randomUUID(),
    timestamp: Date.now()
  }

  await supabase
    .from('audit_logs')
    .insert(entry)
}

// Exemple utilisation
export const updateProductPrice = async (
  productId: string,
  oldPrice: number,
  newPrice: number,
  userId: string
) => {
  // Mise à jour
  await supabase
    .from('products')
    .update({ price: newPrice })
    .eq('id', productId)

  // Log audit NF525
  await logAudit({
    userId,
    userName: getCurrentUser().name,
    action: 'UPDATE_PRICE',
    entity: 'PRODUCT',
    entityId: productId,
    changes: {
      before: { price: oldPrice },
      after: { price: newPrice }
    },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  })
}
```

**Temps:** 4h

---

### C. Demande Certification Organisme (4h préparation + 6-8 semaines audit)

**Actions:**
1. Préparer dossier technique (16h dev ci-dessus)
2. Contacter organisme (LNE, INFOCERT, Bureau Veritas)
3. Payer frais (5-10K€)
4. Audit sur site (1-2 jours)
5. Tests conformité
6. Corrections si nécessaire
7. Certificat délivré

**Temps préparation:** 4h
**Délai certification:** 6-8 semaines

---

## 📅 PLANNING SPRINT FINAL

### Semaine 1 (9-15 Jan): Phase 1 Stabilité
- **Lun-Mar:** Tests Multi-Tenant (4h)
- **Mer-Jeu:** Documentation (12h)
- **Ven:** Monitoring Sentry (8h)
- **Sam:** Export Comptable (8h)
**Total:** 32h

### Semaine 2 (16-22 Jan): Phase 2 Performance
- **Lun-Mar:** Optimisation Queries (8h)
- **Mer-Jeu:** Mode Offline 100% (8h)
- **Ven-Sam:** Web Vitals (8h)
**Total:** 24h

### Semaine 3 (23-29 Jan): Phase 3 NF525 Préparation
- **Lun-Mar:** Archivage Immuable (8h)
- **Mer:** Audit Trail (4h)
- **Jeu-Ven:** Dossier technique certification (4h)
**Total:** 16h

### Semaines 4-11 (Fév-Mars): Certification NF525
- Audit organisme externe (6-8 semaines)
- Tests conformité
- Corrections

---

## 🎯 JALONS CRITIQUES

### Jalon 1: Production Pilote (15 Jan) ✅
- ✅ Tests Multi-Tenant
- ✅ Documentation complète
- ✅ Monitoring actif
- ✅ 1 restaurant pilote avec vraies données
**Go/No-Go:** Lancer pilote commercial

### Jalon 2: Production Multi-Clients (22 Jan)
- ✅ Performance optimisée
- ✅ Mode offline 100%
- ✅ Exports comptables validés
- ✅ 3 restaurants pilotes actifs
**Go/No-Go:** Ouverture commercialisation beta

### Jalon 3: Certification NF525 (Mar)
- ✅ Audit organisme complété
- ✅ Certificat obtenu
- ✅ Attestations individuelles générées
**Go/No-Go:** Commercialisation ouverte France

---

## 💰 BUDGET RESTANT

| Phase | Heures | Taux 75€/h | Total |
|-------|--------|------------|-------|
| Phase 1 Stabilité | 32h | 75€ | 2 400€ |
| Phase 2 Performance | 24h | 75€ | 1 800€ |
| Phase 3 NF525 Prep | 16h | 75€ | 1 200€ |
| **Total Dev** | **72h** | | **5 400€** |
| Certification NF525 | - | - | 5-10K€ |
| **TOTAL PROJET** | | | **10-15K€** |

---

## ✅ CHECKLIST FINALE 100%

### Sprint 1 (Déjà fait) ✅
- [x] Build Vercel READY
- [x] Multi-tenant RLS actif
- [x] Migrations DB exécutées
- [x] Variables env configurées
- [x] Bucket backups créé
- [x] 221 tests passent

### Sprint 2 - Semaine 1
- [ ] Tests isolation 2 restaurants
- [ ] GUIDE_GERANT.md (6h)
- [ ] GUIDE_SERVEUR.md (3h)
- [ ] FAQ.md (3h)
- [ ] Sentry production (8h)
- [ ] Export FEC (4h)
- [ ] Export TVA CA3 (2h)
- [ ] Export Stock (2h)

### Sprint 3 - Semaine 2
- [ ] Indexes JSONB (2h)
- [ ] Table daily_stats (4h)
- [ ] Pagination queries (2h)
- [ ] Service Worker cache (4h)
- [ ] IndexedDB Dexie (4h)
- [ ] Web Vitals tracking (8h)

### Sprint 4 - Semaine 3
- [ ] Archivage blockchain (8h)
- [ ] Audit trail complet (4h)
- [ ] Dossier technique NF525 (4h)
- [ ] Demande certification (contact organisme)

### Sprint 5 - Semaines 4-11
- [ ] Audit organisme
- [ ] Tests conformité
- [ ] Certificat NF525 obtenu

---

## 🚀 PROCHAINE ACTION IMMÉDIATE

**DEMAIN MATIN (9 Jan):**
1. Créer tests/integration/multi-tenant-isolation.test.ts
2. Commencer GUIDE_GERANT.md (rédaction + screenshots)

**Objectif Semaine:** Phase 1 complète (32h)

**Fin Sprint Final:** 100% Production-Ready Commercial ✅

---

**Dernière mise à jour:** 8 Janvier 2026 18:45
**Prochaine révision:** Vendredi 10 Janvier 2026
