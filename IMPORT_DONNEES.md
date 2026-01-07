# 📥 Import des Données SQL vers App

## Situation Actuelle

Tu as créé via SQL direct:
- ✅ 20 ingrédients dans table `ingredients`
- ✅ 10 produits dans table `products`
- ✅ 4 users dans table `users`

**Problème:** L'app ne les voit pas car elle charge depuis table `app_state` (qui n'existe pas encore).

---

## Solution en 3 Étapes (10 minutes)

### Étape 1: Créer table app_state

1. **Ouvrir Supabase SQL Editor**
   ```
   https://supabase.com/dashboard/project/qtbdtnerpdclyqwhkcjz/sql
   ```

2. **Copier-coller migration 002**
   ```sql
   -- Migration 002: Table app_state
   CREATE TABLE app_state (
     id UUID PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
     data JSONB NOT NULL DEFAULT '{}'::jsonb,
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );

   CREATE INDEX idx_app_state_id ON app_state(id);

   ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "Companies can only access their own app_state"
     ON app_state
     FOR ALL
     USING (id = current_setting('app.current_company_id')::uuid);

   CREATE OR REPLACE FUNCTION update_app_state_timestamp()
   RETURNS TRIGGER AS $$
   BEGIN
     NEW.updated_at = NOW();
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;

   CREATE TRIGGER app_state_updated_at
     BEFORE UPDATE ON app_state
     FOR EACH ROW
     EXECUTE FUNCTION update_app_state_timestamp();
   ```

3. **Cliquer RUN**

4. **Vérifier**: Message "Success. No rows returned"

---

### Étape 2: Désactiver RLS temporairement

**Important:** La policy RLS actuelle ne fonctionne pas encore. Pour le pilote:

```sql
ALTER TABLE app_state DISABLE ROW LEVEL SECURITY;
```

**Cliquer RUN**

---

### Étape 3: Importer tes données SQL

**Copier-coller ce script complet:**

```sql
-- Migration 003: Importer données vers app_state
DO $$
DECLARE
  company_uuid UUID;
  app_data JSONB;
BEGIN
  -- Trouver ton restaurant (SIREN 123456789)
  SELECT id INTO company_uuid FROM companies WHERE siren = '123456789' LIMIT 1;

  IF company_uuid IS NULL THEN
    RAISE EXCEPTION 'Company not found with SIREN 123456789';
  END IF;

  -- Construire JSON avec toutes tes données
  SELECT jsonb_build_object(
    'users', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', id::text,
          'name', name,
          'email', email,
          'pin', pin,
          'pinHash', COALESCE(password_hash, ''),
          'role', role,
          'status', status
        )
      )
      FROM users WHERE company_id = company_uuid
    ),
    'ingredients', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', id::text,
          'name', name,
          'category', COALESCE(category, ''),
          'unit', unit,
          'stock', stock,
          'minStock', COALESCE(min_stock, 0),
          'averageCost', COALESCE(average_cost, 0),
          'supplier', ''
        )
      )
      FROM ingredients WHERE company_id = company_uuid
    ),
    'products', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', id::text,
          'name', name,
          'category', COALESCE(category, 'Autres'),
          'price', price,
          'vat', COALESCE(vat_rate, 10.00),
          'image', COALESCE(image_url, ''),
          'recipe', COALESCE(recipe, '[]'::jsonb)
        )
      )
      FROM products WHERE company_id = company_uuid
    ),
    'orders', '[]'::jsonb,
    'tables', '[]'::jsonb,
    'partners', '[]'::jsonb,
    'supplierOrders', '[]'::jsonb,
    'movements', '[]'::jsonb,
    'expenses', '[]'::jsonb,
    'cashDeclarations', '[]'::jsonb,
    '_lastUpdatedAt', EXTRACT(EPOCH FROM NOW()) * 1000
  ) INTO app_data;

  -- Insérer dans app_state
  INSERT INTO app_state (id, data, updated_at)
  VALUES (company_uuid, app_data, NOW())
  ON CONFLICT (id)
  DO UPDATE SET
    data = EXCLUDED.data,
    updated_at = EXCLUDED.updated_at;

  RAISE NOTICE 'Import réussi pour company_id: %', company_uuid;
  RAISE NOTICE 'Users importés: %', jsonb_array_length(app_data->'users');
  RAISE NOTICE 'Ingredients importés: %', jsonb_array_length(app_data->'ingredients');
  RAISE NOTICE 'Products importés: %', jsonb_array_length(app_data->'products');
END $$;

-- Vérifier résultat
SELECT
  id,
  jsonb_array_length(data->'users') as nb_users,
  jsonb_array_length(data->'ingredients') as nb_ingredients,
  jsonb_array_length(data->'products') as nb_products,
  updated_at
FROM app_state;
```

**Cliquer RUN**

**Tu devrais voir:**
```
id: <ton company UUID>
nb_users: 4
nb_ingredients: 20
nb_products: 10
updated_at: 2026-01-04 XX:XX:XX
```

---

## Étape 4: Vider localStorage et tester

1. **Ouvrir l'app**
   ```
   https://smart-food-manager-alpha.vercel.app
   ```

2. **Ouvrir Console Développeur** (F12)

3. **Onglet Console**, taper:**
   ```javascript
   localStorage.clear()
   location.reload()
   ```

4. **Login:**
   - Email: `testprod@demo.com`
   - Password: `Test1234!`

5. **Vérifier:**
   - ✅ Menu → Produits → Tu devrais voir tes 10 produits
   - ✅ Menu → Stocks → Tu devrais voir tes 20 ingrédients
   - ✅ Menu → Utilisateurs → Tu devrais voir 4 users

---

## Vérifications Détaillées

### Voir le JSON brut dans Supabase

```sql
-- Voir structure complète
SELECT data FROM app_state WHERE id = (
  SELECT id FROM companies WHERE siren = '123456789'
);

-- Voir juste les produits
SELECT data->'products' FROM app_state WHERE id = (
  SELECT id FROM companies WHERE siren = '123456789'
);

-- Compter les éléments
SELECT
  jsonb_array_length(data->'users') as users,
  jsonb_array_length(data->'ingredients') as ingredients,
  jsonb_array_length(data->'products') as products,
  jsonb_array_length(data->'orders') as orders
FROM app_state;
```

---

## Troubleshooting

### ❌ "relation app_state does not exist"
→ Migration 002 pas exécutée. Retour Étape 1.

### ❌ "Company not found with SIREN 123456789"
→ Vérifier SIREN dans table companies:
```sql
SELECT id, name, siren FROM companies;
```
Modifier SIREN dans script migration 003 si différent.

### ❌ "nb_users: null"
→ Aucun user dans table `users` avec ce company_id. Vérifier:
```sql
SELECT id, company_id, name FROM users;
```

### ✅ Import réussi mais app vide

1. Vérifier localStorage vidé:
   ```javascript
   // Dans Console navigateur (F12)
   Object.keys(localStorage).filter(k => k.startsWith('smart_food_db_'))
   // Doit retourner: []
   ```

2. Vérifier network request:
   - F12 → Onglet Network
   - Recharger page
   - Chercher requête vers Supabase `app_state`
   - Status doit être 200

3. Vérifier console errors:
   - F12 → Console
   - Chercher erreurs rouges

---

## Après Import Réussi

**Tu peux maintenant:**

1. ✅ **Créer produits/users via l'app** → Persistés dans Supabase
2. ✅ **Fermer navigateur** → Données toujours là
3. ✅ **Tester sur mobile** → Mêmes données
4. ✅ **Continuer Phase 2** → Ajouter recettes produits

**Prochaines étapes:**

- [ ] Ajouter recettes aux produits (lier ingrédients)
- [ ] Upload images produits (Supabase Storage)
- [ ] Tester login serveurs (PIN 1111, 2222, 3333)
- [ ] Installer PWA mobile
- [ ] Test complet workflow commande

---

## Note Importante: Double Stockage

**Actuellement l'app utilise:**
- `app_state` table (JSONB blob avec tout)

**Les tables individuelles existent mais ne sont PAS utilisées:**
- `products` table
- `ingredients` table
- `users` table

**Pour le pilote:** app_state suffit (simple, rapide).

**Pour production future:** Migrer vers tables individuelles (meilleure scalabilité).

---

## Résumé Commandes

```bash
# 1. Créer app_state
# Copier migration 002 → RUN

# 2. Désactiver RLS
ALTER TABLE app_state DISABLE ROW LEVEL SECURITY;

# 3. Importer données
# Copier migration 003 → RUN

# 4. Vider localStorage
localStorage.clear()
location.reload()

# 5. Vérifier
# Login → Menu → Produits/Stocks/Users
```

**Temps total: 10 minutes** ⏱️
