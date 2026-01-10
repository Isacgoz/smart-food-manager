# 🔧 RÉSOLUTION PROBLÈME DE CONNEXION

**Date:** 10 Janvier 2026, 13:00
**Problème:** Impossible de se connecter aux comptes existants
**Cause:** Mode localStorage désactivé (Supabase configuré partiellement)

---

## 🔍 DIAGNOSTIC

L'application a 2 modes de fonctionnement:

### Mode 1: LocalStorage (Fallback - Mode actuel recommandé)
- ✅ Fonctionne sans Supabase
- ✅ Données en local navigateur
- ⚠️ Perte données si localStorage vidé

### Mode 2: Supabase (Production)
- ❌ Nécessite VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
- ✅ Données cloud
- ✅ Synchronisation multi-devices

**État actuel:** Variables Supabase partiellement configurées → App bloquée

---

## ✅ SOLUTION 1: MODE FALLBACK LOCALHOST (IMMÉDIAT)

### Étape 1: Vider variables Supabase Vercel

1. Allez sur https://vercel.com/dashboard
2. Projet `smart-food-manager` → Settings → Environment Variables
3. **Supprimez** temporairement:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Cliquez "Redeploy" sur le dernier déploiement

**Résultat:** App revient en mode localStorage, connexion fonctionne

---

### Étape 2: Créer compte test en local

#### Option A: Script automatique (Recommandé)

1. **Ouvrir l'app:**
   - URL: https://smart-food-manager.vercel.app (après redeploy)
   - Ou: http://localhost:5173 (en dev local)

2. **Ouvrir DevTools (F12) → Console**

3. **Copier-coller ce code:**

```javascript
// Compte test complet
const account = {
  "email": "test@smartfood.com",
  "password": "test1234",
  "profile": {
    "id": "dGVzdEBzbWFydGZvb2QuY29t",
    "name": "Restaurant Test - La Bonne Bouffe",
    "ownerEmail": "test@smartfood.com",
    "plan": "BUSINESS",
    "createdAt": "2026-01-10T11:53:09.792Z",
    "stockPolicy": "WARN"
  }
};

// État initial avec données
const state = {
  "users": [
    {
      "id": "1",
      "name": "Admin Test",
      "pin": "1234",
      "pinHash": "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4",
      "role": "OWNER",
      "email": "test@smartfood.com"
    },
    {
      "id": "2",
      "name": "Serveur 1",
      "pin": "2222",
      "pinHash": "ed968e840d10d2d313a870bc131a4e2c311d7ad09bdf32b3418c8ca9fb1d89e9",
      "role": "SERVER",
      "email": "serveur1@smartfood.com"
    }
  ],
  "ingredients": [
    { "id": "ing-1", "name": "Pain burger", "category": "Pains", "unit": "piece", "stock": 100, "minStock": 20, "avgPrice": 0.35 },
    { "id": "ing-2", "name": "Pain panini", "category": "Pains", "unit": "piece", "stock": 80, "minStock": 15, "avgPrice": 0.40 },
    { "id": "ing-3", "name": "Steak haché", "category": "Viandes", "unit": "kg", "stock": 15, "minStock": 5, "avgPrice": 12.50 },
    { "id": "ing-4", "name": "Poulet pané", "category": "Viandes", "unit": "kg", "stock": 10, "minStock": 3, "avgPrice": 8.90 },
    { "id": "ing-5", "name": "Cheddar", "category": "Fromages", "unit": "kg", "stock": 5, "minStock": 2, "avgPrice": 15.80 },
    { "id": "ing-6", "name": "Mozzarella", "category": "Fromages", "unit": "kg", "stock": 4, "minStock": 2, "avgPrice": 14.50 },
    { "id": "ing-7", "name": "Chèvre", "category": "Fromages", "unit": "kg", "stock": 3, "minStock": 1, "avgPrice": 18.00 },
    { "id": "ing-8", "name": "Tomate", "category": "Légumes", "unit": "kg", "stock": 8, "minStock": 3, "avgPrice": 3.50 },
    { "id": "ing-9", "name": "Salade", "category": "Légumes", "unit": "kg", "stock": 5, "minStock": 2, "avgPrice": 2.80 },
    { "id": "ing-10", "name": "Oignon", "category": "Légumes", "unit": "kg", "stock": 6, "minStock": 2, "avgPrice": 2.20 },
    { "id": "ing-11", "name": "Sauce poivre", "category": "Sauces", "unit": "L", "stock": 3, "minStock": 1, "avgPrice": 12.00 },
    { "id": "ing-12", "name": "Pesto", "category": "Sauces", "unit": "L", "stock": 2, "minStock": 1, "avgPrice": 15.00 }
  ],
  "products": [
    {
      "id": "prod-1", "name": "Burger Toasty", "category": "Burgers", "price": 12.00, "tva": 10,
      "description": "Steak grillé, cheddar, sauce poivre",
      "recipe": [
        { "ingredientId": "ing-1", "quantity": 1 },
        { "ingredientId": "ing-3", "quantity": 0.150 },
        { "ingredientId": "ing-5", "quantity": 0.030 },
        { "ingredientId": "ing-8", "quantity": 0.050 },
        { "ingredientId": "ing-11", "quantity": 0.020 }
      ],
      "available": true
    },
    {
      "id": "prod-2", "name": "Panini Italien", "category": "Paninis", "price": 8.50, "tva": 10,
      "description": "Tomate, pesto, mozzarella",
      "recipe": [
        { "ingredientId": "ing-2", "quantity": 1 },
        { "ingredientId": "ing-8", "quantity": 0.080 },
        { "ingredientId": "ing-6", "quantity": 0.060 },
        { "ingredientId": "ing-12", "quantity": 0.015 }
      ],
      "available": true
    }
  ],
  "tables": [
    { "id": "table-1", "name": "Table 1", "capacity": 4, "location": "Salle", "status": "FREE" },
    { "id": "table-2", "name": "Table 2", "capacity": 4, "location": "Salle", "status": "FREE" },
    { "id": "table-3", "name": "Terrasse 1", "capacity": 6, "location": "Terrasse", "status": "FREE" }
  ],
  "partners": [
    {
      "id": "partner-1", "name": "Boulangerie Dupont", "type": "SUPPLIER",
      "email": "contact@boulangerie-dupont.fr", "phone": "0102030405"
    }
  ],
  "orders": [],
  "supplierOrders": [],
  "movements": [],
  "cashDeclarations": [],
  "expenses": [
    { "id": "exp-1", "category": "RENT", "amount": 1500, "description": "Loyer mensuel", "date": new Date().toISOString(), "createdAt": new Date().toISOString() }
  ],
  "_lastUpdatedAt": Date.now()
};

// Sauvegarder compte SaaS
const saasDB = JSON.parse(localStorage.getItem('SMART_FOOD_SAAS_MASTER_DB') || '[]');
const existing = saasDB.findIndex(u => u.email === account.email);
if (existing >= 0) {
  saasDB[existing] = account;
  console.log('✅ Compte mis à jour');
} else {
  saasDB.push(account);
  console.log('✅ Nouveau compte créé');
}
localStorage.setItem('SMART_FOOD_SAAS_MASTER_DB', JSON.stringify(saasDB));

// Sauvegarder état restaurant
const storageKey = 'smart_food_db_' + account.profile.id;
localStorage.setItem(storageKey, JSON.stringify(state));
localStorage.setItem('restaurant_profile', JSON.stringify(account.profile));

console.log('\n✅ Compte test créé avec succès!');
console.log('\n📧 Connexion:');
console.log('   Email: test@smartfood.com');
console.log('   Mot de passe: test1234');
console.log('\n💡 Rechargez la page (F5) et connectez-vous!');
```

4. **Appuyez sur Entrée**
5. **Rechargez la page (F5)**
6. **Connectez-vous:**
   - Email: `test@smartfood.com`
   - Mot de passe: `test1234`

---

#### Option B: Création compte manuel simple

Si le script ne fonctionne pas, créez un compte basique:

```javascript
// Version minimaliste (copiez dans Console)
const minAccount = {
  email: "admin@test.com",
  password: "admin1234",
  profile: {
    id: btoa("admin@test.com").replace(/=/g, ''),
    name: "Mon Restaurant",
    ownerEmail: "admin@test.com",
    plan: "BUSINESS",
    createdAt: new Date().toISOString()
  }
};

const saasDB = JSON.parse(localStorage.getItem('SMART_FOOD_SAAS_MASTER_DB') || '[]');
saasDB.push(minAccount);
localStorage.setItem('SMART_FOOD_SAAS_MASTER_DB', JSON.stringify(saasDB));

console.log('✅ Compte créé: admin@test.com / admin1234');
console.log('Rechargez la page (F5)');
```

---

## ✅ SOLUTION 2: CONFIGURER SUPABASE COMPLET (LONG TERME)

### Prérequis
- Compte Supabase actif
- Projet Supabase créé
- Tables `app_state` et `companies` créées

### Étapes

#### 1. Récupérer credentials Supabase

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Settings → API
4. Copiez:
   - **Project URL** (VITE_SUPABASE_URL)
   - **anon public key** (VITE_SUPABASE_ANON_KEY)

#### 2. Configurer Vercel

1. Vercel → Projet → Settings → Environment Variables
2. Ajoutez:
   ```
   VITE_SUPABASE_URL = https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. Redeploy

#### 3. Créer utilisateur Supabase

```sql
-- Via Supabase SQL Editor
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test@smartfood.com',
  crypt('test1234', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
);
```

---

## 🚨 DÉPANNAGE

### Erreur: "Email ou mot de passe invalide"

**Cause:** Compte n'existe pas dans localStorage

**Solution:**
1. F12 → Console
2. Tapez: `localStorage.getItem('SMART_FOOD_SAAS_MASTER_DB')`
3. Si `null` → Aucun compte créé, utilisez Option A ou B ci-dessus

---

### Erreur: Page blanche après login

**Cause:** Données restaurant manquantes

**Solution:**
```javascript
// Dans Console (F12)
const profile = JSON.parse(localStorage.getItem('restaurant_profile'));
console.log('Profile:', profile);

// Si null, créer profil
const newProfile = {
  id: "test-restaurant-id",
  name: "Mon Restaurant",
  ownerEmail: "test@smartfood.com",
  plan: "BUSINESS",
  createdAt: new Date().toISOString()
};
localStorage.setItem('restaurant_profile', JSON.stringify(newProfile));
location.reload();
```

---

### Erreur: "Cannot read property 'email'"

**Cause:** Structure compte incorrect

**Solution:** Vider localStorage et recréer
```javascript
// ATTENTION: Supprime TOUTES les données
localStorage.clear();
location.reload();
// Puis refaire Option A ou B
```

---

## 📋 CHECKLIST RAPIDE

Pour se connecter MAINTENANT (mode fallback):

- [ ] 1. Vercel: Supprimer variables VITE_SUPABASE_*
- [ ] 2. Vercel: Redeploy
- [ ] 3. Ouvrir app en production
- [ ] 4. F12 → Console
- [ ] 5. Coller script Option A
- [ ] 6. Entrée
- [ ] 7. F5 (Recharger)
- [ ] 8. Login: test@smartfood.com / test1234

**Temps:** 5 minutes

---

## 🎯 RECOMMANDATION

**Court terme (AUJOURD'HUI):**
→ Utiliser **SOLUTION 1 - Option A** (mode localStorage)

**Long terme (Semaine prochaine):**
→ Configurer **SOLUTION 2** (Supabase complet) après tests

---

## 📞 BESOIN D'AIDE?

Si ça ne fonctionne toujours pas:

1. Envoie-moi une capture d'écran de:
   - La page de connexion (avec erreur si présente)
   - Console DevTools (F12 → Console)
   - Variables Vercel (Settings → Environment Variables)

2. Ou teste en local:
```bash
cd "/Users/isacelgozmir/Downloads/smart-food-manager (6)"
npm run dev
# Ouvrir http://localhost:5173
# Utiliser Option A dans Console
```

---

**Dernière mise à jour:** 10 Janvier 2026, 13:00
