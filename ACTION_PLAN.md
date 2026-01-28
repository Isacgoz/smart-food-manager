# 🎯 ACTIONS REQUISES - Intégration Stripe

## ✅ FAIT (Par Claude)

- ✅ Packages Stripe installés
- ✅ Service Stripe client créé
- ✅ Pages paiement (Success/Cancel/Upgrade)
- ✅ Routes configurées
- ✅ Bouton upgrade sidebar
- ✅ Guide INSTRUCTIONS_STRIPE.md
- ✅ Corrections imports + error handling

## 🚀 À FAIRE (Votre côté)

### ÉTAPE 1: Créer compte Stripe TEST (5 min)

```
1. Aller sur: https://dashboard.stripe.com/register
2. Email + mot de passe
3. Mode TEST automatique ✅
```

### ÉTAPE 2: Récupérer clés API (2 min)

```
Dashboard → Developers → API keys

Copier:
- Publishable key: pk_test_51xxxxx...
- Secret key: sk_test_51xxxxx... (pas utilisé frontend)
```

### ÉTAPE 3: Créer produits Stripe (10 min)

```
Dashboard → Products → Add product

Produit 1: SOLO
- Name: Smart Food Manager - SOLO
- Price: 29 EUR (recurring monthly)
→ COPIER Price ID: price_xxxxx

Produit 2: TEAM
- Name: Smart Food Manager - TEAM
- Price: 79 EUR (recurring monthly)
→ COPIER Price ID: price_xxxxx

Produit 3: BUSINESS
- Name: Smart Food Manager - BUSINESS
- Price: 149 EUR (recurring monthly)
→ COPIER Price ID: price_xxxxx
```

### ÉTAPE 4: Configurer .env (3 min)

```bash
cd "smart-food-manager (6)"

# Si .env n'existe pas
cp .env.example .env

# Éditer .env et remplacer:
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_VOTRE_CLE_ICI
VITE_STRIPE_PRICE_SOLO=price_xxxxxxxxxxxxx
VITE_STRIPE_PRICE_TEAM=price_xxxxxxxxxxxxx
VITE_STRIPE_PRICE_BUSINESS=price_xxxxxxxxxxxxx
```

### ÉTAPE 5: Relancer app (1 min)

```bash
npm run dev
```

### ÉTAPE 6: Tester flow complet (5 min)

```
1. Créer compte ou login
2. Cliquer "⚡ Passer Premium" (sidebar)
3. Page /upgrade s'affiche avec 3 plans
4. Cliquer "Choisir ce plan"
5. Redirection Stripe Checkout
6. Carte test: 4242 4242 4242 4242
7. Date: 12/28, CVC: 123
8. Valider paiement
9. Redirection /payment-success
10. Badge trial disparaît (refresh si besoin)
```

---

## 🎯 RÉSULTAT ATTENDU

Après paiement TEST réussi:
- ✅ Page "Paiement réussi"
- ✅ subscriptionStatus: 'trial' → 'active'
- ✅ Badge "Essai gratuit" disparaît
- ✅ Nouvelle ligne dans Dashboard Stripe → Customers

---

## 📚 DOCUMENTATION COMPLÈTE

Tout est dans: [INSTRUCTIONS_STRIPE.md](INSTRUCTIONS_STRIPE.md)
- Cartes de test
- Webhooks production
- Passage mode LIVE
- Troubleshooting

---

## ⚠️ IMPORTANT MODE TEST

**Ce qui fonctionne:**
- ✅ Redirect Stripe Checkout
- ✅ Paiement simulé avec cartes test
- ✅ Mise à jour localStorage après paiement
- ✅ Badge trial disparaît après paiement

**Ce qui manque (PRODUCTION):**
- ❌ Backend API pour webhooks Stripe
- ❌ Mise à jour Supabase automatique
- ❌ Emails confirmation clients
- ❌ Gestion renouvellements/dunning

→ Pour PRODUCTION: Créer API backend + webhooks (voir INSTRUCTIONS_STRIPE.md)

---

## 🐛 TROUBLESHOOTING RAPIDE

**Problème:** "Stripe non initialisé"
→ VITE_STRIPE_PUBLISHABLE_KEY manquante dans .env

**Problème:** "Price ID non configuré"
→ VITE_STRIPE_PRICE_* manquants dans .env

**Problème:** Badge trial toujours là après paiement
→ Rafraîchir page (Ctrl+R ou Cmd+R)

**Problème:** Carte test refusée
→ Vérifier mode TEST activé dans Dashboard Stripe

---

## 📊 COMMITS

```
31b9080 - feat(payments): Stripe integration TEST mode
4a73a4d - fix(payments): correct imports + error handling
```

---

**Temps total estimé:** ~30 minutes
**Dernière mise à jour:** 2026-01-27
