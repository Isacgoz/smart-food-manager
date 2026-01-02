# Guide Setup Supabase - Smart Food Manager

## 📋 Prérequis

- Compte Supabase : https://supabase.com (gratuit jusqu'à 500MB DB)
- Projet déjà créé avec credentials dans `.env`

---

## 🚀 Étape 1 : Appliquer Migration SQL

### Via Dashboard Supabase (Recommandé)

1. **Ouvrir SQL Editor** :
   - Aller sur https://supabase.com/dashboard
   - Sélectionner ton projet `qtbdtnerpdclyqwhkcjz`
   - Menu gauche → **SQL Editor**
   - Cliquer **+ New query**

2. **Copier le contenu** de `supabase/migrations/001_initial_schema.sql`

3. **Exécuter la migration** :
   - Coller tout le SQL dans l'éditeur
   - Cliquer **Run** (en bas à droite)
   - Attendre la confirmation (devrait prendre ~5-10 secondes)

4. **Vérifier tables créées** :
   - Menu gauche → **Table Editor**
   - Tu devrais voir 11 tables :
     - companies
     - users
     - ingredients
     - suppliers
     - products
     - tables
     - orders
     - purchases
     - stock_movements
     - expenses
     - cash_sessions

---

## 🔐 Étape 2 : Configuration RLS (Row Level Security)

**Déjà fait !** Les policies RLS sont incluses dans la migration.

**Vérification** :
- Menu **Authentication** → **Policies**
- Chaque table doit avoir 1 policy `company_isolation_*`

**Important** : RLS garantit que chaque restaurant ne voit QUE ses données.

---

## 👤 Étape 3 : Créer Premier Restaurant + Utilisateur

### Via SQL Editor

```sql
-- 1. Créer entreprise
INSERT INTO companies (id, name, legal_name, siren, siret, address, city, plan)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Restaurant La Bonne Bouffe',
  'SARL La Bonne Bouffe',
  '123456789',
  '12345678900012',
  '12 Rue de la Paix',
  'Paris',
  'TEAM'
) RETURNING id, name;

-- 2. Créer utilisateur propriétaire (mot de passe temporaire: "demo123")
-- Hash bcrypt de "demo123": $2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
INSERT INTO users (company_id, email, password_hash, pin, name, role)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'admin@labonnebouffe.fr',
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  '1234',
  'Admin Restaurant',
  'OWNER'
) RETURNING id, name, email;
```

**Note** : En production, les mots de passe seront hashés côté serveur via API.

---

## 📊 Étape 4 : Tester Connexion depuis l'App

### Dans le code (déjà configuré)

Le fichier `services/storage.ts` utilise déjà Supabase avec :
```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

### Test rapide

Créer un fichier de test `test-supabase.ts` :

```typescript
import { supabase } from './services/storage';

async function testConnection() {
  if (!supabase) {
    console.error('❌ Supabase non configuré');
    return;
  }

  // Test 1: Lire companies
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Erreur:', error.message);
  } else {
    console.log('✅ Connexion OK:', data);
  }
}

testConnection();
```

Exécuter :
```bash
npx ts-node test-supabase.ts
```

**Résultat attendu** : `✅ Connexion OK: [{ id: '111...', name: 'Restaurant La Bonne Bouffe', ... }]`

---

## 🔄 Étape 5 : Migration Données LocalStorage → Supabase

**Action requise** : Script de migration à créer pour transférer les données existantes.

### Script `migrate-to-supabase.ts`

```typescript
import { supabase } from './services/storage';

async function migrate(restaurantId: string) {
  const localKey = `smart_food_db_${restaurantId}`;
  const localData = localStorage.getItem(localKey);

  if (!localData) {
    console.log('❌ Pas de données locales');
    return;
  }

  const state = JSON.parse(localData);

  // 1. Migrer ingredients
  for (const ing of state.ingredients || []) {
    await supabase.from('ingredients').insert({
      company_id: restaurantId,
      name: ing.name,
      category: ing.category,
      unit: ing.unit,
      stock: ing.stock,
      min_stock: ing.minStock,
      average_cost: ing.averageCost
    });
  }

  // 2. Migrer products
  for (const prod of state.products || []) {
    await supabase.from('products').insert({
      company_id: restaurantId,
      name: prod.name,
      category: prod.category,
      price: prod.price,
      vat_rate: prod.vatRate,
      image_url: prod.imageUrl,
      recipe: prod.recipe,
      available: prod.available
    });
  }

  // ... (continuer pour autres entités)

  console.log('✅ Migration terminée');
}

// Usage
migrate('11111111-1111-1111-1111-111111111111');
```

---

## 🔧 Configuration API Backend (Prochaine étape)

Pour gérer l'authentification et les mutations sécurisées, créer un backend Node.js/Express ou utiliser Supabase Edge Functions.

### Option 1 : Supabase Edge Functions (Recommandé)

Créer `supabase/functions/auth/index.ts` :

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as bcrypt from 'https://deno.land/x/bcrypt/mod.ts';

serve(async (req) => {
  const { email, password } = await req.json();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // Clé admin
  );

  // Vérifier user
  const { data: user } = await supabase
    .from('users')
    .select('*, companies(*)')
    .eq('email', email)
    .single();

  if (!user) {
    return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });
  }

  // Vérifier password
  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });
  }

  // Créer JWT token
  const token = await createJWT(user);

  return new Response(JSON.stringify({ user, token }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

Déployer :
```bash
npx supabase functions deploy auth
```

### Option 2 : Backend Node.js/Express (Alternative)

Créer `backend/` avec Express + Supabase client.

---

## 📱 Étape 6 : Activer Real-time (Optionnel)

Pour sync temps réel entre devices :

1. **Dashboard Supabase** → **Database** → **Replication**
2. Activer pour tables :
   - `orders` (commandes cuisine temps réel)
   - `tables` (statuts tables live)
   - `cash_sessions` (sessions caisse)

3. **Dans le code** :

```typescript
supabase
  .channel('orders')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
    console.log('Nouvelle commande:', payload.new);
    // Mettre à jour state React
  })
  .subscribe();
```

---

## ✅ Checklist Validation

- [ ] Migration SQL exécutée sans erreur
- [ ] 11 tables créées visibles dans Table Editor
- [ ] RLS policies actives (Authentication → Policies)
- [ ] Premier restaurant + user créés
- [ ] Test connexion Supabase OK
- [ ] Données localStorage migrées (optionnel pour phase test)
- [ ] Edge Function auth déployée (phase production)
- [ ] Real-time activé (optionnel)

---

## 🆘 Troubleshooting

### Erreur "relation does not exist"
- Vérifier que la migration SQL a bien été exécutée
- Vérifier l'ordre des `CREATE TABLE` (dépendances FK)

### Erreur "RLS policy violation"
- Vérifier que `current_setting('app.current_company_id')` est défini
- En développement, temporairement désactiver RLS :
  ```sql
  ALTER TABLE ingredients DISABLE ROW LEVEL SECURITY;
  ```

### Performance lente
- Ajouter indexes manquants
- Vérifier plan gratuit Supabase (500MB limit)

---

## 📚 Ressources

- [Supabase Docs](https://supabase.com/docs)
- [RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Edge Functions](https://supabase.com/docs/guides/functions)
