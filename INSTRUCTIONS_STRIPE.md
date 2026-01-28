# Configuration Stripe - Smart Food Manager

## MODE TEST (Configuration immédiate)

### ÉTAPE 1: Créer compte Stripe TEST

1. **Aller sur:** https://dashboard.stripe.com/register
2. **S'inscrire** avec email/mot de passe
3. **IMPORTANT:** Vous serez automatiquement en MODE TEST ✅

### ÉTAPE 2: Récupérer clés TEST

1. **Dashboard Stripe** → **Developers** → **API keys**
2. **Copier les 2 clés TEST:**
   ```
   Publishable key: pk_test_51xxxxx...
   Secret key: sk_test_51xxxxx...
   ```

### ÉTAPE 3: Créer fichier .env local

```bash
cd "smart-food-manager (6)"
cp .env.example .env
```

### ÉTAPE 4: Remplir .env avec clés Stripe

Éditer `.env` et remplacer:

```env
# Stripe TEST keys
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_VOTRE_CLE_ICI
```

### ÉTAPE 5: Créer produits dans Stripe Dashboard

**Navigation:** Dashboard → **Products** → **Add product**

#### Produit 1: SOLO
- **Name:** Smart Food Manager - SOLO
- **Description:** 1 utilisateur, 50 produits, Dashboard + ERP
- **Pricing:**
  - Recurring: Monthly
  - Price: 29 EUR
  - Billing period: Monthly
- **Cliquer:** Save product
- **COPIER Price ID:** `price_xxxxxxxxxxxxx`

#### Produit 2: TEAM
- **Name:** Smart Food Manager - TEAM
- **Description:** 5 utilisateurs, 200 produits, Dashboard + ERP + Gestion équipe
- **Pricing:**
  - Recurring: Monthly
  - Price: 79 EUR
- **COPIER Price ID:** `price_xxxxxxxxxxxxx`

#### Produit 3: BUSINESS
- **Name:** Smart Food Manager - BUSINESS
- **Description:** Utilisateurs illimités, tout inclus
- **Pricing:**
  - Recurring: Monthly
  - Price: 149 EUR
- **COPIER Price ID:** `price_xxxxxxxxxxxxx`

### ÉTAPE 6: Ajouter Price IDs dans .env

Éditer `.env` et ajouter les Price IDs:

```env
VITE_STRIPE_PRICE_SOLO=price_1xxxxxxxxxxxxx
VITE_STRIPE_PRICE_TEAM=price_1xxxxxxxxxxxxx
VITE_STRIPE_PRICE_BUSINESS=price_1xxxxxxxxxxxxx
```

### ÉTAPE 7: Relancer application

```bash
npm run dev
```

---

## TESTS

### Tester le flow complet

1. **Créer compte** ou **Login**
2. **Cliquer** sur le bouton "⚡ Passer Premium" dans la sidebar
3. **Choisir un plan** (SOLO/TEAM/BUSINESS)
4. **Vous serez redirigé** vers Stripe Checkout

### Cartes de test Stripe

**✅ Paiement réussi:**
```
Numéro: 4242 4242 4242 4242
Expiration: N'importe quelle date future (ex: 12/28)
CVC: N'importe quel 3 chiffres (ex: 123)
Code postal: N'importe lequel (ex: 75001)
```

**❌ Paiement refusé:**
```
Numéro: 4000 0000 0000 0002
```

**⏳ Authentification 3D Secure (complète):**
```
Numéro: 4000 0027 6000 3184
```

**Plus de cartes:** https://stripe.com/docs/testing#cards

### Vérifier succès

1. **Après paiement réussi** → Redirection vers `/payment-success`
2. **Badge trial disparaît** → Remplacé par statut "active"
3. **Dashboard Stripe** → Customers → Voir nouveau client + souscription

---

## WEBHOOKS (PRODUCTION OBLIGATOIRE)

**⚠️ En mode TEST actuel:** Mise à jour manuelle immédiate (pas de webhook)

**🔒 Pour PRODUCTION:** Webhooks requis pour sécurité

### Configuration webhook (futur)

1. **Dashboard Stripe** → **Developers** → **Webhooks** → **Add endpoint**
2. **Endpoint URL:** `https://votre-domaine.com/api/stripe/webhook`
3. **Events to send:**
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

4. **Copier Signing secret:** `whsec_xxxxx`

### Backend requis (à créer)

Endpoint Node.js/Express pour vérifier webhooks:

```javascript
// /api/stripe/webhook.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/api/stripe/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    // Mettre à jour restaurant dans Supabase
    await updateSubscription(session.client_reference_id, 'active');
  }

  res.json({ received: true });
});
```

---

## PASSAGE EN PRODUCTION

### Prérequis France

**Documents obligatoires:**
- SIREN (9 chiffres)
- SIRET (14 chiffres)
- Kbis de moins de 3 mois
- Pièce d'identité gérant
- RIB/IBAN

**Où obtenir:**
- SIREN/SIRET: https://www.infogreffe.fr
- Kbis: https://www.infogreffe.fr (commande en ligne)

### Activation mode LIVE

1. **Dashboard Stripe** → **Activate your account**
2. **Remplir formulaire:**
   - Business details (SIREN, SIRET, adresse)
   - Representative info (gérant)
   - Banking details (RIB)
3. **Upload documents** (Kbis, ID)
4. **Attendre validation** (1-3 jours ouvrés)

### Basculer clés LIVE

1. **Dashboard** → **Developers** → **API keys**
2. **Toggle:** Test → **Live** mode
3. **Copier nouvelles clés:**
   ```
   pk_live_51xxxxx...
   sk_live_51xxxxx...
   ```

4. **MAJ .env production:**
   ```env
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_VOTRE_CLE
   ```

5. **Recréer produits en mode LIVE** (copier Price IDs)

---

## SÉCURITÉ

### ✅ Bonnes pratiques implémentées

- Clés TEST/LIVE séparées
- Publishable key côté client uniquement
- Secret key JAMAIS exposée au frontend
- clientReferenceId pour lier restaurants
- Metadata pour traçabilité

### 🔒 À faire en production

- [ ] Backend API pour webhooks
- [ ] Validation signature webhooks
- [ ] Logs transactions Stripe
- [ ] Monitoring échecs paiements
- [ ] Emails notifications clients
- [ ] Gestion renouvellements
- [ ] Gestion dunning (relances)

---

## COÛTS STRIPE

### Mode TEST
**Gratuit** ✅ (transactions simulées)

### Mode PRODUCTION
- **Par transaction:** 1.5% + 0.25€ (cartes européennes)
- **Cartes internationales:** 2.5% + 0.25€
- **Abonnements:** Même tarif
- **Aucun frais fixe mensuel**

**Exemple SOLO (29€):**
```
29€ × 1.5% = 0.435€
+ 0.25€ frais fixes
= 0.685€ par transaction
Net: 28.315€
```

---

## TROUBLESHOOTING

### Problème: "Stripe non initialisé"
**Cause:** VITE_STRIPE_PUBLISHABLE_KEY manquante
**Fix:** Vérifier `.env` et relancer `npm run dev`

### Problème: "Price ID non configuré"
**Cause:** Price IDs pas remplis dans `.env`
**Fix:** Créer produits Stripe et copier Price IDs

### Problème: Paiement test refuse toutes les cartes
**Cause:** Mode LIVE activé par erreur
**Fix:** Dashboard → Toggle "Test mode"

### Problème: Redirect après paiement ne fonctionne pas
**Cause:** URL success/cancel mal configurées
**Fix:** Vérifier `services/stripe.ts` lignes 40-41

---

## FLUX UTILISATEUR COMPLET

```
1. Inscription → Trial 30j gratuit
   ↓
2. Badge "🎁 Essai gratuit: Xj restants" affiché
   ↓
3. Clic "⚡ Passer Premium"
   ↓
4. Page /upgrade → Choix plan
   ↓
5. Clic "Choisir ce plan"
   ↓
6. Redirection Stripe Checkout
   ↓
7. Remplir CB de test (4242 4242...)
   ↓
8. Paiement validé
   ↓
9. Redirect /payment-success
   ↓
10. subscriptionStatus → 'active'
    ↓
11. Badge trial disparaît
    ↓
12. Accès complet garanti
```

---

## COMMANDES UTILES

### Vérifier config Stripe
```bash
grep STRIPE .env
```

### Tester variables d'environnement
```javascript
console.log(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
console.log(import.meta.env.VITE_STRIPE_PRICE_SOLO);
```

### Logs Stripe Dashboard
**Dashboard** → **Developers** → **Logs**
- Voir toutes requêtes API
- Debugger erreurs
- Tracer webhooks

---

## SUPPORT

**Documentation Stripe:**
https://stripe.com/docs

**Stripe Support:**
https://support.stripe.com

**Cartes de test:**
https://stripe.com/docs/testing

**Webhooks guide:**
https://stripe.com/docs/webhooks

---

**Dernière mise à jour:** 2026-01-27
**Version Smart Food Manager:** Pre-Sprint 2 + Stripe Integration
