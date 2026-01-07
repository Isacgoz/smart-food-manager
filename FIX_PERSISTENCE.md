# 🔧 FIX: Problème Persistance Données (Produits/Users)

## ❌ Problème Identifié

**Symptôme:** Produits et utilisateurs créés disparaissent au rechargement de l'app.

**Cause racine:** Table `app_state` manquante dans Supabase.

**Impact actuel:**
- ✅ Données sauvegardées dans **localStorage** (temporaire)
- ❌ Données **NON sauvegardées** dans Supabase (cloud)
- ⚠️ Si localStorage vidé → **perte de données**

---

## ✅ Solution (5 minutes)

### Étape 1: Créer table `app_state` dans Supabase

1. **Ouvrir Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/qtbdtnerpdclyqwhkcjz
   ```

2. **Aller dans SQL Editor**
   - Menu gauche → **SQL Editor**
   - Cliquer **New query**

3. **Copier-coller ce SQL**
   ```sql
   -- Migration 002: Table app_state pour synchronisation état application
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

4. **Cliquer "Run"** (bouton en bas à droite)

5. **Vérifier résultat**
   - Message: ✅ "Success. No rows returned"
   - C'est normal, la table est créée vide

### Étape 2: Désactiver temporairement RLS pour test

**IMPORTANT:** La policy RLS actuelle nécessite `current_setting('app.current_company_id')` qui n'est pas encore implémenté. Pour tester rapidement:

1. **Retourner dans SQL Editor**

2. **Exécuter cette commande temporaire:**
   ```sql
   -- TEMPORAIRE: Désactiver RLS pour permettre l'insertion
   ALTER TABLE app_state DISABLE ROW LEVEL SECURITY;
   ```

3. **Cliquer "Run"**

**Note:** On réactivera RLS avec une policy correcte plus tard, mais pour l'instant il faut que ça fonctionne.

### Étape 3: Tester la persistance

1. **Recharger ton app web**
   ```
   https://smart-food-manager-alpha.vercel.app
   ```

2. **Créer un produit test**
   - Menu → Produits
   - Ajouter "Pizza Test"
   - Prix: 12.00€

3. **Vérifier dans Supabase**
   - Table Editor → `app_state`
   - Tu devrais voir 1 ligne avec ton company_id
   - Colonne `data` contient le JSON avec tes produits

4. **Tester persistance**
   - Fermer complètement l'onglet navigateur
   - Rouvrir https://smart-food-manager-alpha.vercel.app
   - Login
   - **✅ Pizza Test devrait être là!**

---

## 🔍 Vérification Supabase

Après avoir créé des produits, vérifie dans SQL Editor:

```sql
-- Voir les données sauvegardées
SELECT
  id,
  data->>'products' as products_json,
  updated_at
FROM app_state;
```

Tu devrais voir ton tableau de produits en JSON.

---

## ⚠️ Problème RLS à corriger plus tard

La policy actuelle:
```sql
USING (id = current_setting('app.current_company_id')::uuid)
```

Ne fonctionne pas car `current_setting('app.current_company_id')` n'est pas défini.

**Solutions possibles (à implémenter après test):**

### Option A: Policy basée sur auth.uid() (recommandé)
```sql
-- 1. Ajouter user_id dans companies
ALTER TABLE companies ADD COLUMN owner_user_id UUID REFERENCES auth.users(id);

-- 2. Policy simple
CREATE POLICY "Users access their company app_state"
  ON app_state
  FOR ALL
  USING (
    id IN (
      SELECT id FROM companies WHERE owner_user_id = auth.uid()
    )
  );
```

### Option B: Désactiver RLS temporairement (pilote uniquement)
```sql
-- Pour phase de test avec 1 seul restaurant
ALTER TABLE app_state DISABLE ROW LEVEL SECURITY;
```

**Pour le pilote avec 1 restaurant:** Option B suffit.
**Pour production multi-tenant:** Option A obligatoire.

---

## 📋 Checklist

- [ ] Migration 002 exécutée (table `app_state` créée)
- [ ] RLS désactivé temporairement
- [ ] Produit test créé
- [ ] Produit visible après rechargement
- [ ] Vérification SQL montre les données
- [ ] Marquer tâche Phase 2 TODO_PILOTE.md complète

---

## 🐛 Dépannage

### "relation app_state does not exist"
→ Tu n'as pas exécuté la migration 002. Retourne Étape 1.

### "permission denied for table app_state"
→ RLS activé mais policy incorrecte. Exécute:
```sql
ALTER TABLE app_state DISABLE ROW LEVEL SECURITY;
```

### Produits toujours pas visibles après fix
1. Ouvre Console Développeur (F12)
2. Va dans onglet **Application** → **Local Storage**
3. Supprime clé `smart_food_db_<ton_restaurant_id>`
4. Recharge page
5. Crée nouveau produit
6. Vérifie Supabase Table Editor

### Error "JSONB value is too large"
→ Trop de données. Rare, mais si ça arrive:
```sql
ALTER TABLE app_state ALTER COLUMN data TYPE JSONB;
```

---

## 🎯 Après le fix

Une fois que ça fonctionne:

1. **Créer tes vrais produits** (15-20)
2. **Créer utilisateurs serveurs** (3-5)
3. **Tester connexion serveur** (login PIN)
4. **Continuer TODO_PILOTE.md Phase 2**

---

## 📞 Besoin d'aide?

Si le fix ne fonctionne pas:
1. Copie l'erreur exacte de la console navigateur
2. Screenshot du message Supabase SQL Editor
3. Partage avec moi pour debug
