# 🔧 SOLUTION IMMÉDIATE - PROBLÈME DE CONNEXION

**Problème identifié:** Supabase configuré mais aucun compte créé dans Supabase Auth
**Solution:** Désactiver temporairement Supabase pour utiliser le mode localStorage

---

## ✅ SOLUTION RAPIDE (2 minutes)

### Étape 1: Désactiver Supabase en local

Un fichier `.env.local` a été créé qui désactive Supabase.

**Vérifiez:**
```bash
cat .env.local
```

Devrait afficher:
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### Étape 2: Redémarrer le serveur dev

```bash
cd "/Users/isacelgozmir/Downloads/smart-food-manager (6)"
npm run dev
```

### Étape 3: Ouvrir l'app

http://localhost:5173

### Étape 4: Créer le compte (Console navigateur)

**Ouvrez DevTools (F12) → Console**, puis copiez-collez:

```javascript
// Compte test complet
const account = {
  email: "admin@test.com",
  password: "admin1234",
  profile: {
    id: btoa("admin@test.com").replace(/=/g, ''),
    name: "Restaurant Test",
    ownerEmail: "admin@test.com",
    plan: "BUSINESS",
    createdAt: new Date().toISOString(),
    stockPolicy: "WARN"
  }
};

// État initial
const state = {
  users: [{
    id: "1",
    name: "Admin",
    pin: "1234",
    pinHash: "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4",
    role: "OWNER",
    email: "admin@test.com"
  }],
  ingredients: [
    {id: "ing-1", name: "Pain burger", category: "Pains", unit: "piece", stock: 100, minStock: 20, avgPrice: 0.35},
    {id: "ing-2", name: "Steak haché", category: "Viandes", unit: "kg", stock: 15, minStock: 5, avgPrice: 12.50},
    {id: "ing-3", name: "Cheddar", category: "Fromages", unit: "kg", stock: 5, minStock: 2, avgPrice: 15.80},
    {id: "ing-4", name: "Tomate", category: "Légumes", unit: "kg", stock: 8, minStock: 3, avgPrice: 3.50}
  ],
  products: [{
    id: "prod-1",
    name: "Burger Classique",
    category: "Burgers",
    price: 12.00,
    tva: 10,
    description: "Steak, cheddar, tomate",
    recipe: [
      {ingredientId: "ing-1", quantity: 1},
      {ingredientId: "ing-2", quantity: 0.150},
      {ingredientId: "ing-3", quantity: 0.030},
      {ingredientId: "ing-4", quantity: 0.050}
    ],
    available: true
  }],
  tables: [
    {id: "table-1", name: "Table 1", capacity: 4, location: "Salle", status: "FREE"},
    {id: "table-2", name: "Table 2", capacity: 4, location: "Salle", status: "FREE"}
  ],
  partners: [],
  orders: [],
  supplierOrders: [],
  movements: [],
  cashDeclarations: [],
  expenses: [],
  _lastUpdatedAt: Date.now()
};

// Sauvegarder
const saasDB = JSON.parse(localStorage.getItem('SMART_FOOD_SAAS_MASTER_DB') || '[]');
const idx = saasDB.findIndex(u => u.email === account.email);
if (idx >= 0) saasDB[idx] = account;
else saasDB.push(account);
localStorage.setItem('SMART_FOOD_SAAS_MASTER_DB', JSON.stringify(saasDB));

const storageKey = 'smart_food_db_' + account.profile.id;
localStorage.setItem(storageKey, JSON.stringify(state));
localStorage.setItem('restaurant_profile', JSON.stringify(account.profile));

console.log('✅ Compte créé: admin@test.com / admin1234');
console.log('Rechargez (F5) et connectez-vous!');
```

### Étape 5: Se connecter

- Email: `admin@test.com`
- Mot de passe: `admin1234`

---

## 🚀 SOLUTION ALTERNATIVE: Compte Supabase

Si tu veux utiliser Supabase (production):

### Étape 1: Créer utilisateur dans Supabase

1. Va sur https://supabase.com/dashboard
2. Projet → SQL Editor
3. Colle et exécute le contenu de `fix-login.sql`
4. Note l'UUID généré
5. Remplace `USER_ID_ICI` dans la 2ème requête
6. Exécute la 2ème requête

### Étape 2: Vérifier

```sql
SELECT id, email FROM auth.users WHERE email = 'test@smartfood.com';
```

### Étape 3: Se connecter

- Email: `test@smartfood.com`
- Mot de passe: `test1234`

---

## 🎯 POUR VERCEL (PRODUCTION)

### Option A: Désactiver Supabase temporairement

1. Vercel → Settings → Environment Variables
2. **Supprimer** (ou vider):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Redeploy

Puis utiliser Étape 4 ci-dessus pour créer compte localStorage

### Option B: Utiliser Supabase

Exécuter `fix-login.sql` puis se connecter avec `test@smartfood.com / test1234`

---

## 📋 RÉSUMÉ

**CAUSE DU PROBLÈME:**
- Supabase configuré dans `.env`
- App tente connexion Supabase Auth
- Aucun compte créé dans Supabase
- Résultat: "Email ou mot de passe invalide"

**SOLUTION CHOISIE:**
- `.env.local` créé → désactive Supabase en local
- Mode fallback localStorage activé
- Compte créé via console navigateur

**IDENTIFIANTS:**
- Email: `admin@test.com`
- Mot de passe: `admin1234`
- PIN: `1234`

---

**Fichiers créés:**
- `.env.local` (désactive Supabase local)
- `fix-login.sql` (SQL pour créer compte Supabase)
- `SOLUTION_CONNEXION_IMMEDIATE.md` (ce fichier)

**Prochaine étape:** Tester la connexion!
