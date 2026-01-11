# 🤖 PROMPT AGENT IA - Smart Food Manager

**Date:** 11 Janvier 2026
**Objectif:** Finaliser l'application et la préparer pour le premier restaurant pilote
**Accès:** Complet au projet `/Users/isacelgozmir/Downloads/smart-food-manager (6)/`

---

## 📋 CONTEXTE PROJET

Tu travailles sur **Smart Food Manager**, un système de gestion pour restaurants (food trucks, snacks). L'application est à **82% production-ready** avec 221 tests passants.

### Stack Technique
- **Frontend:** React 19.2.3 + TypeScript + Vite + Tailwind
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Déploiement:** Vercel (automatique sur push main)
- **Monitoring:** Sentry (à configurer)
- **Tests:** Vitest (221 tests - 100% pass)

### Architecture
- **Multi-tenant:** Isolation par `company_id` + RLS Supabase
- **Auth:** Supabase Auth (email) + PIN (mobile/POS)
- **Storage:** Hybride (localStorage + Supabase sync)
- **Conformité:** NF525-ready (certification à venir)

---

## 🎯 TES OBJECTIFS PRINCIPAUX

### 1. Finaliser Tests Application (2h)
- Tester création compte + confirmation email
- Tester connexion (testprod@demo.com)
- Valider isolation multi-tenant (2 restaurants)

### 2. Intégration Solution de Caisse (8-12h)
- Rechercher API compatible NF525
- Intégrer API à l'application
- Maintenir 100% tests passants

### 3. Préparation Restaurant Pilote (4h)
- Valider tous exports comptables
- Documentation utilisateur finale
- Checklist déploiement

---

## 📂 FICHIERS CRITIQUES À LIRE

### Documentation Projet (LIRE EN PREMIER)
```
1. CLAUDE.md (PRIORITÉ MAX)
   - Règles de travail (concision, commits, tests)
   - Architecture complète
   - Principes métiers (déstockage auto, PMP, etc.)
   - Roadmap phases 1-4

2. AUDIT_COMPLET_ACTIONS.md
   - État actuel 82%
   - Plan d'action détaillé
   - Bugs résolus/restants
   - Roadmap sprints

3. AVANCEMENT.md
   - Progression globale
   - Sprint 1: 100% ✅
   - Sprint 2: 91% 🟡

4. CONNEXION_PRODUCTION_GUIDE.md
   - Guide setup compte production
   - Flow confirmation email
   - Tests à effectuer
```

### Code Source Principal
```
5. App.tsx
   - Point d'entrée application
   - Routing principal
   - Auth callback handling

6. pages/SaaSLogin.tsx
   - Authentification Supabase
   - Fallback localStorage

7. pages/AuthCallback.tsx
   - Callback confirmation email
   - RÉCEMMENT CORRIGÉ (import path)

8. pages/POS.tsx
   - Interface point de vente
   - Gestion commandes
   - ZONE INTÉGRATION CAISSE

9. store.tsx
   - State management global
   - Context API
   - Multi-tenant data
```

### Services Critiques
```
10. services/storage.ts
    - Supabase client config
    - Multi-tenant queries

11. services/accounting.ts
    - Exports FEC, CA3
    - Calculs TVA
    - NF525 compliance

12. shared/services/pos-integration.ts (À CRÉER)
    - Intégration API caisse
    - Mapping données
```

### Tests
```
13. tests/integration/multi-tenant.test.ts
    - Tests isolation données
    - À valider en prod

14. tests/services/accounting.test.ts
    - Tests exports comptables
    - 21 tests FEC
```

### Configuration
```
15. .env (Vercel)
    - VITE_SUPABASE_URL
    - VITE_SUPABASE_ANON_KEY
    - VITE_SENTRY_DSN

16. docs/migrations/005_multi_tenant_support.sql
    - Création companies table
    - RLS policies
    - À EXÉCUTER dans Supabase

17. docs/migrations/006_test_companies.sql
    - Données test (Alpha, Beta, Gamma)
    - À EXÉCUTER après 005
```

---

## 🚀 MISSION 1: FINALISER TESTS APPLICATION

### Objectif
Valider que l'application fonctionne end-to-end pour 2 restaurants distincts.

### Étapes Détaillées

#### A. Exécuter Migrations Supabase (15 min)

**IMPORTANT:** Lis d'abord `docs/SUPABASE_SETUP.md`

1. **Ouvrir Supabase Dashboard**
   ```
   https://supabase.com/dashboard
   ```

2. **SQL Editor → New Query**

3. **Exécuter Migration 005**
   ```bash
   # Lire le fichier
   cat docs/migrations/005_multi_tenant_support.sql

   # Copier contenu complet dans SQL Editor
   # Cliquer "Run"
   # Vérifier output: "CREATE TABLE companies..."
   ```

4. **Vérifier création table**
   ```sql
   SELECT * FROM companies;
   -- Devrait être vide pour l'instant

   \d companies
   -- Devrait montrer structure table
   ```

5. **Exécuter Migration 006**
   ```bash
   cat docs/migrations/006_test_companies.sql

   # Copier dans SQL Editor
   # Run
   ```

6. **Vérifier données test**
   ```sql
   SELECT id, name, plan FROM companies;
   -- Devrait afficher: Alpha, Beta, Gamma
   ```

#### B. Créer 2 Comptes Restaurants Test (30 min)

**Compte 1: Restaurant Alpha**
```sql
-- Dans Supabase SQL Editor

-- 1. Créer utilisateur auth
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'alpha@test.com',
  crypt('Alpha1234!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"restaurant_name":"Restaurant Alpha","plan":"BUSINESS"}',
  NOW(),
  NOW()
) RETURNING id;

-- COPIER L'UUID RETOURNÉ: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

-- 2. Créer app_state pour Alpha
INSERT INTO app_state (id, company_id, data, updated_at)
VALUES (
  'UUID_ALPHA_ICI', -- REMPLACER par UUID copié
  (SELECT id FROM companies WHERE name = 'Alpha'),
  '{
    "restaurant": {
      "id": "UUID_ALPHA_ICI",
      "name": "Restaurant Alpha",
      "ownerEmail": "alpha@test.com",
      "plan": "BUSINESS",
      "createdAt": "2026-01-11T15:00:00.000Z",
      "stockPolicy": "WARN"
    },
    "users": [{
      "id": "1",
      "name": "Admin Alpha",
      "pin": "1111",
      "pinHash": "356a192b7913b04c54574d18c28d46e6395428ab",
      "role": "OWNER",
      "email": "alpha@test.com"
    }],
    "ingredients": [
      {"id": "ing-a1", "name": "Pain Alpha", "category": "Pains", "unit": "piece", "stock": 50, "minStock": 10, "avgPrice": 0.35},
      {"id": "ing-a2", "name": "Steak Alpha", "category": "Viandes", "unit": "kg", "stock": 10, "minStock": 3, "avgPrice": 12.50}
    ],
    "products": [
      {
        "id": "prod-a1",
        "name": "Burger Alpha",
        "category": "Burgers",
        "price": 12.00,
        "tva": 10,
        "recipe": [
          {"ingredientId": "ing-a1", "quantity": 1},
          {"ingredientId": "ing-a2", "quantity": 0.150}
        ],
        "available": true
      }
    ],
    "tables": [
      {"id": "table-a1", "name": "Table Alpha 1", "capacity": 4, "location": "Salle", "status": "FREE"}
    ],
    "partners": [],
    "orders": [],
    "supplierOrders": [],
    "movements": [],
    "cashDeclarations": [],
    "expenses": []
  }'::jsonb,
  NOW()
);
```

**Compte 2: Restaurant Beta** (même structure)
```sql
-- Email: beta@test.com
-- Password: Beta1234!
-- PIN: 2222
-- Ingredients: Pain Beta, Steak Beta
-- Products: Burger Beta
-- Tables: Table Beta 1
```

**RÉSULTAT ATTENDU:**
- 2 comptes auth créés
- 2 app_state distincts
- Données isolées par company_id

#### C. Tester Isolation Multi-Tenant (30 min)

**Test 1: Login Restaurant Alpha**
```bash
# Ouvrir navigateur
open https://smart-food-manager.vercel.app

# Login: alpha@test.com / Alpha1234!
```

**Vérifications Alpha:**
1. Dashboard affiche "Restaurant Alpha"
2. Menu → Produits: Voir uniquement "Burger Alpha"
3. Stocks → Ingrédients: "Pain Alpha", "Steak Alpha"
4. Tables → Voir "Table Alpha 1"
5. POS → Créer commande "Burger Alpha"
6. Vérifier déstockage: Pain -1, Steak -0.150kg

**Test 2: Login Restaurant Beta**
```bash
# Nouvelle fenêtre incognito
# Login: beta@test.com / Beta1234!
```

**Vérifications Beta:**
1. Dashboard affiche "Restaurant Beta"
2. Menu → Produits: Voir uniquement "Burger Beta" (PAS Burger Alpha)
3. Stocks → Ingrédients: "Pain Beta", "Steak Beta" (PAS Alpha)
4. Tables → Voir "Table Beta 1" (PAS Table Alpha 1)
5. Commandes → Ne voir AUCUNE commande d'Alpha

**✅ SI SUCCÈS:**
- Isolation totale confirmée
- Multi-tenant fonctionne

**❌ SI ÉCHEC:**
- RLS policies non activées
- Vérifier dans Supabase: `ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;`
- Relire `docs/migrations/005_multi_tenant_support.sql`

#### D. Tester Confirmation Email (20 min)

**Utiliser compte production déjà créé:**
```
Email: testprod@demo.com
Password: TestProd2026!
```

**Lire d'abord:** `CONNEXION_PRODUCTION_GUIDE.md`

**Steps:**
1. Supabase Dashboard → Settings → Authentication
2. ✅ Enable Email Confirmations
3. Redirect URLs: Ajouter
   ```
   https://smart-food-manager.vercel.app/auth/callback
   https://smart-food-manager.vercel.app
   ```

4. SQL Editor → Exécuter `fix-login-production.sql`
5. Remplacer `USER_ID_ICI` dans partie 2
6. Vérifier email reçu (checker spam)
7. Cliquer lien → Vérifier callback page affiche ✅
8. Login testprod@demo.com → Dashboard

**✅ SI SUCCÈS:**
- Email reçu
- Callback redirige
- Login fonctionne

**❌ SI ÉCHEC:**
- Vérifier SMTP Supabase configuré
- Vérifier Redirect URLs
- Lire section DÉPANNAGE dans `GUIDE_CONFIRMATION_EMAIL.md`

---

## 🏪 MISSION 2: INTÉGRATION SOLUTION DE CAISSE

### Objectif
Intégrer une API de caisse certifiée NF525 pour gérer les transactions et la conformité fiscale.

### Recherche Solutions Disponibles

#### Options Recommandées (France)

**1. Zelty API** (Recommandé)
- ✅ Certifié NF525
- ✅ API REST complète
- ✅ Support TPE
- ✅ Facturation automatique
- 💰 Coût: ~50€/mois + 0.5% transaction
- 📄 Doc: https://api.zelty.fr/docs

**2. Sunday API**
- ✅ Certifié NF525
- ✅ Paiement mobile
- ✅ API moderne
- 💰 Coût: 49€/mois
- 📄 Doc: https://developers.sunday.app

**3. Lightspeed Restaurant API**
- ✅ Certifié NF525
- ✅ Multi-sites
- ✅ Hardware inclus
- 💰 Coût: 69€/mois
- 📄 Doc: https://developers.lightspeedhq.com

**4. Tillhub API** (Alternative)
- ✅ Certifié NF525
- ✅ Open API
- ✅ Webhooks
- 💰 Coût: Sur devis
- 📄 Doc: https://api.tillhub.com

### Architecture Intégration

**Créer nouveau service:** `shared/services/pos-integration.ts`

```typescript
/**
 * Integration avec solution de caisse externe (Zelty/Sunday/etc.)
 * Conforme NF525 pour certification française
 */

import { Order, Payment } from '../types';

// Configuration API
const POS_API_URL = import.meta.env.VITE_POS_API_URL;
const POS_API_KEY = import.meta.env.VITE_POS_API_KEY;

interface POSTransaction {
  id: string;
  orderId: string;
  amount: number;
  currency: 'EUR';
  paymentMethod: 'CARD' | 'CASH' | 'MOBILE';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  fiscalData: {
    receiptNumber: string;
    fiscalCode: string; // Hash anti-fraude NF525
    certificationChain: string;
    timestamp: string;
  };
}

/**
 * Envoyer transaction vers caisse certifiée
 */
export async function processPOSPayment(
  order: Order,
  payment: Payment
): Promise<POSTransaction> {
  try {
    const response = await fetch(`${POS_API_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${POS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: order.id,
        amount: order.total,
        currency: 'EUR',
        paymentMethod: payment.method,
        items: order.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          vat: item.tva,
        })),
        restaurant: {
          siret: order.companyId, // À adapter
          name: order.restaurantName,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`POS API error: ${response.status}`);
    }

    const transaction: POSTransaction = await response.json();

    // Sauvegarder données fiscales
    await saveFiscalData(order.id, transaction.fiscalData);

    return transaction;
  } catch (error) {
    console.error('POS payment failed:', error);
    throw error;
  }
}

/**
 * Annuler transaction (remboursement)
 */
export async function refundPOSPayment(
  transactionId: string,
  reason: string
): Promise<void> {
  const response = await fetch(`${POS_API_URL}/transactions/${transactionId}/refund`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${POS_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) {
    throw new Error('Refund failed');
  }
}

/**
 * Sauvegarder données fiscales (conformité NF525)
 */
async function saveFiscalData(
  orderId: string,
  fiscalData: POSTransaction['fiscalData']
): Promise<void> {
  // Stocker dans Supabase pour archivage 6 ans
  const { error } = await supabase
    .from('fiscal_records')
    .insert({
      order_id: orderId,
      receipt_number: fiscalData.receiptNumber,
      fiscal_code: fiscalData.fiscalCode,
      certification_chain: fiscalData.certificationChain,
      timestamp: fiscalData.timestamp,
      created_at: new Date().toISOString(),
    });

  if (error) throw error;
}

/**
 * Vérifier certification active
 */
export async function checkPOSCertification(): Promise<{
  certified: boolean;
  expiresAt: string;
  provider: string;
}> {
  const response = await fetch(`${POS_API_URL}/certification/status`, {
    headers: {
      'Authorization': `Bearer ${POS_API_KEY}`,
    },
  });

  return response.json();
}
```

### Modifier `pages/POS.tsx`

**Intégrer appel API lors du paiement:**

```typescript
import { processPOSPayment, checkPOSCertification } from '../shared/services/pos-integration';

// Dans handlePayment()
const handlePayment = async (method: 'CASH' | 'CARD') => {
  try {
    // 1. Créer commande locale (existant)
    const order = createOrder(cart, method);

    // 2. NOUVEAU: Envoyer vers caisse certifiée
    const posTransaction = await processPOSPayment(order, {
      method,
      amount: order.total,
    });

    // 3. Sauvegarder transaction ID
    order.posTransactionId = posTransaction.id;
    order.fiscalData = posTransaction.fiscalData;

    // 4. Continuer flux normal (déstockage, etc.)
    await saveOrder(order);

    // 5. Afficher reçu avec données fiscales
    showReceipt(order, posTransaction);

  } catch (error) {
    console.error('Payment failed:', error);
    toast.error('Erreur paiement. Caisse non disponible.');
  }
};
```

### Créer Table Supabase `fiscal_records`

**Nouvelle migration:** `docs/migrations/007_fiscal_records.sql`

```sql
-- Table archivage données fiscales NF525
CREATE TABLE fiscal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  order_id TEXT NOT NULL,
  receipt_number TEXT NOT NULL,
  fiscal_code TEXT NOT NULL, -- Hash anti-fraude
  certification_chain TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(order_id)
);

-- Index pour recherche rapide
CREATE INDEX idx_fiscal_records_company ON fiscal_records(company_id);
CREATE INDEX idx_fiscal_records_timestamp ON fiscal_records(timestamp);

-- RLS policies
ALTER TABLE fiscal_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY fiscal_records_isolation ON fiscal_records
  USING (company_id = current_setting('app.current_company_id')::uuid);

-- Retention 6 ans minimum (conformité française)
COMMENT ON TABLE fiscal_records IS 'Archivage données fiscales - Retention 6 ans min (NF525)';
```

### Variables Environnement

**Ajouter dans Vercel:**
```bash
VITE_POS_API_URL=https://api.zelty.fr/v1
VITE_POS_API_KEY=sk_live_xxxxxxxxxx
VITE_POS_PROVIDER=zelty
```

**Ajouter dans `.env.example`:**
```bash
# POS Integration (NF525)
VITE_POS_API_URL=
VITE_POS_API_KEY=
VITE_POS_PROVIDER=zelty
```

### Tests Intégration

**Créer:** `tests/integration/pos-integration.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { processPOSPayment, checkPOSCertification } from '../../shared/services/pos-integration';

describe('POS Integration', () => {
  it('should process payment with fiscal data', async () => {
    const order = {
      id: 'order-123',
      total: 25.50,
      items: [{ name: 'Burger', quantity: 2, price: 12.00, tva: 10 }],
    };

    const payment = { method: 'CARD', amount: 25.50 };

    const transaction = await processPOSPayment(order, payment);

    expect(transaction.fiscalData).toBeDefined();
    expect(transaction.fiscalData.receiptNumber).toMatch(/^FR-\d+/);
    expect(transaction.fiscalData.fiscalCode).toHaveLength(64); // SHA256
  });

  it('should verify active certification', async () => {
    const status = await checkPOSCertification();

    expect(status.certified).toBe(true);
    expect(status.provider).toBe('zelty');
    expect(new Date(status.expiresAt)).toBeInstanceOf(Date);
  });

  it('should maintain 100% test pass rate', () => {
    // Vérifier que tous les autres tests passent toujours
    expect(global.testStats?.passed).toBe(221);
  });
});
```

### Documentation

**Créer:** `docs/INTEGRATION_CAISSE.md`

```markdown
# Intégration Solution de Caisse

## Solution Choisie
- **Provider:** Zelty / Sunday / Lightspeed
- **Certification:** NF525 ✅
- **API Version:** v1

## Configuration
1. Créer compte chez provider
2. Obtenir API key
3. Configurer Vercel env vars
4. Exécuter migration 007
5. Tester avec compte sandbox

## Flux Transaction
1. User valide commande
2. App envoie vers API caisse
3. Caisse retourne données fiscales
4. App sauvegarde fiscal_records
5. Reçu affiché avec hash NF525

## Conformité
- Hash anti-fraude sur chaque transaction
- Archivage 6 ans automatique
- Certification vérifiée à chaque paiement
- Audit trail complet

## Tests
- 100% tests doivent passer
- Sandbox mode disponible
- Mock API pour CI/CD
```

---

## 🚢 MISSION 3: PRÉPARATION RESTAURANT PILOTE

### Objectif
Application prête à être déployée chez le premier restaurant test.

### Checklist Finale

#### A. Validation Technique (1h)

**1. Build & Deploy**
```bash
# Vérifier build local
npm run build

# Vérifier pas d'erreurs TypeScript
npm run type-check

# Vérifier tous les tests
npm test

# Devrait afficher: 221 tests passed (ou plus si nouveaux tests)
```

**2. Exports Comptables**
- Créer 10 commandes test
- 5 achats fournisseurs
- 3 charges diverses
- Exporter FEC → Ouvrir Excel → Vérifier format
- Exporter CA3 → Vérifier calculs TVA
- Exporter Charges → Vérifier catégories

**3. Politique Stock**
- Settings → BLOCK → Tester vente stock insuffisant
- Settings → WARN → Vérifier warning affiché
- Settings → SILENT → Vérifier stock négatif

**4. Annulation Commande**
- Créer commande
- Vérifier déstockage
- Annuler commande
- Vérifier restock automatique

**5. Monitoring**
```javascript
// Console navigateur
throw new Error("Test Sentry");

// Vérifier dans Sentry Dashboard
// Erreur doit apparaître en <1 min
```

#### B. Documentation Utilisateur (1h)

**Vérifier guides complets:**
- [ ] `docs/GUIDE_GERANT.md` (571 lignes) - OK
- [ ] `docs/GUIDE_SERVEUR.md` (250 lignes) - OK
- [ ] `docs/FAQ.md` (400 lignes) - OK

**Créer guide pilote:** `docs/GUIDE_RESTAURANT_PILOTE.md`

```markdown
# Guide Restaurant Pilote

## Bienvenue!
Vous êtes le premier restaurant à tester Smart Food Manager. Merci!

## Configuration Initiale (30 min)
1. Créer compte restaurant
2. Configurer informations (SIRET, TVA, etc.)
3. Ajouter utilisateurs (gérant, serveurs)
4. Importer menu (produits + recettes)
5. Importer fournisseurs
6. Saisir stock initial

## Utilisation Quotidienne
### Matin (10 min)
- Ouvrir session caisse
- Vérifier stock critique
- Consulter réservations

### Service (continu)
- Prise commandes POS
- Impression tickets cuisine
- Encaissement (Cash/CB)

### Soir (15 min)
- Clôture caisse (Z)
- Inventaire rapide
- Vérifier écarts

## Support
- Documentation: docs/
- Email: support@smartfoodmanager.com
- Téléphone: +33 X XX XX XX XX
- Chat: https://smartfoodmanager.com/support

## Feedback
Nous voulons votre avis! Signaler tout bug/suggestion:
- GitHub Issues: https://github.com/.../issues
- Email: feedback@smartfoodmanager.com
- Formulaire: https://forms.gle/xxxxx
```

#### C. Données Démo Restaurant (1h)

**Créer script:** `scripts/create-pilot-restaurant.sql`

```sql
-- Compte restaurant pilote réel
-- À adapter avec vraies données

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'pilot@restaurant.com', -- EMAIL RÉEL
  crypt('PilotSecure2026!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"restaurant_name":"Restaurant Pilote","plan":"BUSINESS"}',
  NOW(),
  NOW()
) RETURNING id;

-- COPIER UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

-- Créer app_state avec VRAI menu du restaurant
INSERT INTO app_state (id, company_id, data, updated_at)
VALUES (
  'UUID_PILOT_ICI',
  (SELECT id FROM companies WHERE name = 'Pilot Restaurant'),
  '{
    "restaurant": {
      "id": "UUID_PILOT_ICI",
      "name": "Restaurant Pilote",
      "ownerEmail": "pilot@restaurant.com",
      "siret": "12345678901234", -- VRAI SIRET
      "tvaNumber": "FR12345678901", -- VRAI TVA
      "address": "123 Rue de la Paix, 75001 Paris",
      "phone": "+33612345678",
      "plan": "BUSINESS",
      "stockPolicy": "WARN"
    },
    "users": [
      {
        "id": "1",
        "name": "Gérant Pilote",
        "pin": "1234",
        "role": "OWNER",
        "email": "pilot@restaurant.com"
      },
      {
        "id": "2",
        "name": "Serveur 1",
        "pin": "5678",
        "role": "SERVER"
      }
    ],
    "ingredients": [
      -- COPIER VRAI MENU DU RESTAURANT
    ],
    "products": [
      -- COPIER VRAI MENU DU RESTAURANT
    ],
    "tables": [
      {"id": "t1", "name": "Table 1", "capacity": 4, "location": "Salle", "status": "FREE"},
      {"id": "t2", "name": "Table 2", "capacity": 4, "location": "Salle", "status": "FREE"},
      {"id": "t3", "name": "Table 3", "capacity": 6, "location": "Terrasse", "status": "FREE"}
      -- etc.
    ],
    "partners": [],
    "orders": [],
    "supplierOrders": [],
    "movements": [],
    "cashDeclarations": [],
    "expenses": []
  }'::jsonb,
  NOW()
);
```

#### D. Formation Restaurant (Préparer supports)

**Créer:** `docs/FORMATION_PILOTE.md`

```markdown
# Formation Restaurant Pilote

## Session 1: Gérant (2h)
- Découverte interface
- Configuration restaurant
- Gestion menu/recettes
- Achats fournisseurs
- Exports comptables
- Paramètres

## Session 2: Serveurs (1h)
- Login PIN
- Prise commande POS
- Gestion tables
- Encaissement
- Clôture caisse

## Session 3: Cuisine (30 min)
- Lecture tickets
- Gestion KDS (futur)

## Support Post-Formation
- Hotline: +33 X XX XX XX XX
- Email: support@...
- Visite sur site: Semaine 2
```

---

## 📊 CRITÈRES DE SUCCÈS

### Tests Techniques
- [ ] 100% tests passent (221+ tests)
- [ ] Build Vercel SUCCESS
- [ ] Migrations Supabase exécutées
- [ ] Multi-tenant validé (2 restaurants isolés)
- [ ] Email confirmation fonctionne
- [ ] Intégration caisse opérationnelle
- [ ] Exports comptables corrects

### Conformité
- [ ] API caisse certifiée NF525
- [ ] Données fiscales archivées
- [ ] Hash anti-fraude sur transactions
- [ ] Audit trail complet

### Documentation
- [ ] Guide gérant complet
- [ ] Guide serveur complet
- [ ] FAQ 30+ questions
- [ ] Guide pilote créé
- [ ] Formation préparée

### Déploiement
- [ ] Environnement production stable
- [ ] Monitoring Sentry actif
- [ ] Backup quotidien configuré
- [ ] Support disponible

---

## ⚠️ CONTRAINTES & RÈGLES

### Commits
**Format ultra-court** (règle CLAUDE.md):
```
✅ feat(pos): caisse API integration
✅ fix(auth): email confirmation flow
✅ test(multi-tenant): isolation validation

❌ feat(pos): Added the POS integration with external API
❌ Fixed the email confirmation issue that was blocking users
```

### Tests
**JAMAIS casser les tests existants:**
```bash
# AVANT chaque commit
npm test

# SI un test échoue
# → Corriger AVANT de commit
# → NE JAMAIS commit avec tests en échec
```

### Documentation
**Commenter POURQUOI, jamais QUOI:**
```typescript
✅ // PMP recalc: stock valuation changes with each reception
❌ // Loop through ingredients
```

### Serveur Dev
**NE JAMAIS lancer** `npm run dev`
**Assumer qu'il tourne déjà** en arrière-plan

---

## 🐛 GESTION ERREURS

### Si Build Échoue
1. Lire erreur complète
2. Vérifier imports paths
3. Vérifier types TypeScript
4. Vérifier `tsconfig.json`
5. `npm run type-check`

### Si Tests Échouent
1. Isoler test: `npm test -- pos-integration.test.ts`
2. Lire assertion failure
3. Vérifier mocks/fixtures
4. Vérifier env variables
5. Lire test context dans `tests/`

### Si Multi-Tenant Leak
1. Vérifier RLS activé: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
2. Vérifier policies: `SELECT * FROM pg_policies WHERE tablename = 'app_state';`
3. Vérifier `company_id` dans requêtes
4. Lire `docs/migrations/005_multi_tenant_support.sql`

### Si Intégration Caisse Échoue
1. Vérifier API key valide
2. Vérifier URL endpoint
3. Vérifier payload format (lire doc API)
4. Tester avec Postman/curl
5. Vérifier logs Supabase/Vercel

---

## 📁 STRUCTURE PROJET

```
smart-food-manager/
├── App.tsx                      # Entry point
├── pages/                       # Pages React
│   ├── SaaSLogin.tsx           # Auth principale
│   ├── AuthCallback.tsx        # Callback email
│   ├── POS.tsx                 # Point de vente (INTÉGRATION CAISSE ICI)
│   ├── Dashboard.tsx
│   ├── Menu.tsx
│   ├── Stocks.tsx
│   └── ...
├── services/                    # Services métier
│   ├── storage.ts              # Supabase client
│   ├── accounting.ts           # Exports FEC/CA3
│   └── ...
├── shared/
│   ├── services/
│   │   └── pos-integration.ts  # À CRÉER (intégration caisse)
│   └── types.ts                # Types TypeScript
├── tests/                       # Tests Vitest
│   ├── integration/
│   │   ├── multi-tenant.test.ts
│   │   └── pos-integration.test.ts # À CRÉER
│   └── services/
│       └── accounting.test.ts
├── docs/                        # Documentation
│   ├── CLAUDE.md               # LIRE EN PREMIER ⭐
│   ├── SUPABASE_SETUP.md
│   ├── GUIDE_GERANT.md
│   ├── GUIDE_SERVEUR.md
│   ├── FAQ.md
│   ├── INTEGRATION_CAISSE.md   # À CRÉER
│   ├── GUIDE_RESTAURANT_PILOTE.md # À CRÉER
│   ├── FORMATION_PILOTE.md     # À CRÉER
│   └── migrations/
│       ├── 005_multi_tenant_support.sql
│       ├── 006_test_companies.sql
│       └── 007_fiscal_records.sql # À CRÉER
├── scripts/
│   └── create-pilot-restaurant.sql # À CRÉER
├── AUDIT_COMPLET_ACTIONS.md    # Plan d'action détaillé
├── AVANCEMENT.md               # Progression globale
├── CONNEXION_PRODUCTION_GUIDE.md
└── package.json

FICHIERS PRIORITAIRES:
1. CLAUDE.md (règles projet)
2. AUDIT_COMPLET_ACTIONS.md (plan d'action)
3. CONNEXION_PRODUCTION_GUIDE.md (tests connexion)
4. docs/SUPABASE_SETUP.md (setup DB)
5. pages/POS.tsx (intégration caisse)
```

---

## 🎯 PLAN D'EXÉCUTION

### Jour 1 (3h)
**Matin:**
- [ ] Lire CLAUDE.md complet (30 min)
- [ ] Lire AUDIT_COMPLET_ACTIONS.md (20 min)
- [ ] Exécuter migrations 005 & 006 (15 min)
- [ ] Créer 2 comptes test (Alpha, Beta) (30 min)

**Après-midi:**
- [ ] Tester isolation multi-tenant (30 min)
- [ ] Tester confirmation email (20 min)
- [ ] Valider exports comptables (30 min)
- [ ] Rapport bugs/issues (15 min)

### Jour 2 (4h)
**Matin:**
- [ ] Recherche solution caisse (1h)
  - Comparer Zelty, Sunday, Lightspeed
  - Lire docs API
  - Choisir provider
- [ ] Créer compte sandbox (30 min)
- [ ] Obtenir API keys (30 min)

**Après-midi:**
- [ ] Créer pos-integration.ts (1h)
- [ ] Migration 007 fiscal_records (30 min)
- [ ] Intégrer dans POS.tsx (1h)

### Jour 3 (3h)
**Matin:**
- [ ] Tests intégration caisse (1h)
- [ ] Vérifier 100% tests passent (30 min)
- [ ] Corriger bugs si nécessaire (1h)

**Après-midi:**
- [ ] Documentation INTEGRATION_CAISSE.md (30 min)

### Jour 4 (2h)
**Matin:**
- [ ] Créer GUIDE_RESTAURANT_PILOTE.md (1h)
- [ ] Créer FORMATION_PILOTE.md (30 min)
- [ ] Script create-pilot-restaurant.sql (30 min)

### Jour 5 (1h)
**Matin:**
- [ ] Tests finaux end-to-end (30 min)
- [ ] Checklist complète (15 min)
- [ ] Rapport final (15 min)

**TOTAL: 13h sur 5 jours**

---

## 📝 RAPPORT FINAL ATTENDU

À la fin de tes missions, créer: `RAPPORT_FINALISATION_AGENT.md`

```markdown
# Rapport Finalisation - Agent IA

**Date:** [Date]
**Durée:** [Heures]

## Missions Accomplies

### ✅ Mission 1: Tests Application
- [ ] Migrations Supabase exécutées
- [ ] 2 comptes test créés (Alpha, Beta)
- [ ] Isolation multi-tenant validée
- [ ] Email confirmation testée
- [ ] Exports comptables validés

**Résultat:** [SUCCÈS / ÉCHEC partiel]
**Bugs trouvés:** [Liste]

### ✅ Mission 2: Intégration Caisse
- [ ] Solution choisie: [Zelty/Sunday/Lightspeed]
- [ ] API intégrée dans pos-integration.ts
- [ ] Migration 007 fiscal_records créée
- [ ] Tests intégration écrits
- [ ] 100% tests passent: [OUI / NON - X tests échouent]

**Résultat:** [SUCCÈS / ÉCHEC partiel]
**Difficultés:** [Liste]

### ✅ Mission 3: Préparation Pilote
- [ ] Guide restaurant pilote créé
- [ ] Guide formation créé
- [ ] Script pilot restaurant créé
- [ ] Checklist complète validée

**Résultat:** [SUCCÈS / ÉCHEC partiel]

## Statistiques

| Métrique | Avant | Après |
|----------|-------|-------|
| Tests passants | 221 | X |
| Production-ready | 82% | X% |
| Fichiers créés | - | X |
| Commits | - | X |
| Bugs résolus | - | X |

## Problèmes Non Résolus

1. [Problème 1]
   - Description
   - Tentatives de résolution
   - Recommandation

2. [Problème 2]
   ...

## Recommandations

### Court terme (1 sem)
- [Action 1]
- [Action 2]

### Moyen terme (1 mois)
- [Action 1]
- [Action 2]

## Fichiers Créés/Modifiés

- `shared/services/pos-integration.ts` (nouveau)
- `docs/migrations/007_fiscal_records.sql` (nouveau)
- `tests/integration/pos-integration.test.ts` (nouveau)
- `docs/INTEGRATION_CAISSE.md` (nouveau)
- `docs/GUIDE_RESTAURANT_PILOTE.md` (nouveau)
- `docs/FORMATION_PILOTE.md` (nouveau)
- `scripts/create-pilot-restaurant.sql` (nouveau)
- `pages/POS.tsx` (modifié - intégration API)
- `.env.example` (modifié - POS vars)

## Prochaines Étapes

1. [Étape prioritaire 1]
2. [Étape prioritaire 2]
3. [Étape prioritaire 3]

---

**Agent IA:** [Nom/Version]
**Durée totale:** [X heures]
**Date fin:** [Date]
```

---

## 🚀 COMMANDES UTILES

### Tests
```bash
# Tous les tests
npm test

# Tests spécifiques
npm test -- multi-tenant
npm test -- pos-integration
npm test -- accounting

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

### Build
```bash
# Dev (NE PAS LANCER - déjà en cours)
# npm run dev

# Build production
npm run build

# Type check
npm run type-check

# Lint
npm run lint
```

### Git
```bash
# Status
git status

# Add files
git add .

# Commit (format court!)
git commit -m "feat(pos): caisse integration"

# Push
git push origin main

# Logs
git log --oneline -10
```

### Supabase
```bash
# Migrations locales (si CLI installé)
supabase db push

# Reset (DANGER)
supabase db reset

# Logs
supabase functions logs
```

---

## 💡 CONSEILS FINAUX

### Efficacité
1. **Lire CLAUDE.md en PREMIER** (30 min investis = 3h gagnées)
2. Tester AVANT de commit (évite rollbacks)
3. Commits fréquents (toutes les 30 min)
4. Documentation au fur et à mesure (pas à la fin)

### Qualité
1. **100% tests passants** (non négociable)
2. Types TypeScript stricts (pas de `any`)
3. Gestion erreurs complète (try/catch + Sentry)
4. Logs structurés (JSON format)

### Sécurité
1. **Isolation multi-tenant** (critical)
2. API keys dans env vars (jamais en dur)
3. Validation inputs (côté serveur)
4. HTTPS uniquement (Vercel auto)

### Performance
1. Code splitting (React.lazy)
2. Indexes DB (JSONB paths)
3. Cache queries (si >1s)
4. Monitoring (Sentry + Web Vitals)

---

## 📞 CONTACTS & RESSOURCES

### Documentation Externe
- **Supabase:** https://supabase.com/docs
- **Vite:** https://vitejs.dev/guide/
- **Vitest:** https://vitest.dev/guide/
- **React:** https://react.dev/reference/react
- **TypeScript:** https://www.typescriptlang.org/docs/

### APIs Caisse
- **Zelty:** https://api.zelty.fr/docs
- **Sunday:** https://developers.sunday.app
- **Lightspeed:** https://developers.lightspeedhq.com

### NF525
- **AFNOR:** https://www.afnor.org/certification/nf525/
- **Loi Anti-Fraude TVA:** https://www.economie.gouv.fr/dgfip/

### Support Projet
- **GitHub Issues:** https://github.com/[user]/smart-food-manager/issues
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Sentry Dashboard:** https://sentry.io/organizations/[org]/

---

## ✅ CHECKLIST DÉMARRAGE

Avant de commencer, vérifier:

- [ ] J'ai lu CLAUDE.md en entier (30 min)
- [ ] J'ai lu AUDIT_COMPLET_ACTIONS.md (20 min)
- [ ] J'ai lu CONNEXION_PRODUCTION_GUIDE.md (10 min)
- [ ] J'ai accès à Supabase Dashboard
- [ ] J'ai accès à Vercel Dashboard
- [ ] J'ai accès à GitHub repo
- [ ] Node.js v20+ installé
- [ ] npm install exécuté sans erreur
- [ ] npm test passe 221 tests ✅
- [ ] Je comprends l'architecture multi-tenant
- [ ] Je comprends les règles de commit (ultra-courts)
- [ ] Je sais qu'il ne faut JAMAIS casser les tests

---

**BON COURAGE! 🚀**

Tu as toutes les informations nécessaires. En cas de blocage:
1. Relire CLAUDE.md
2. Relire AUDIT_COMPLET_ACTIONS.md
3. Chercher dans docs/
4. Lire tests existants (exemples)
5. Consulter git history (`git log`)

**Objectif final:** Application prête pour 1er restaurant pilote dans 5 jours max.
