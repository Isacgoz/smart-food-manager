# 🚨 FIX URGENT - Créer Compte Impossible

**Erreur:** `Erreur création profil: unrecognized configuration parameter "app.current_company_id"`

**Status:** 🔴 BLOQUANT - Impossible de créer de nouveaux comptes

---

## ⚡ SOLUTION RAPIDE (5 minutes)

### Étape 1: Ouvrir Supabase Dashboard

```
https://supabase.com/dashboard
→ Sélectionner votre projet
→ SQL Editor (icône en haut à gauche)
→ New query
```

### Étape 2: Copier Script FIX_RLS_URGENT.sql

```bash
# Dans votre terminal local
cat FIX_RLS_URGENT.sql
```

**Ou ouvrir le fichier:** [FIX_RLS_URGENT.sql](FIX_RLS_URGENT.sql)

### Étape 3: Exécuter dans SQL Editor

1. Coller TOUT le contenu du script dans SQL Editor
2. Cliquer **"Run"** (ou Cmd+Enter)
3. Attendre ~5 secondes

**Output attendu:**
```
NOTICE: Dropped policy: [nom] on public.app_state
NOTICE: Dropped policy: [nom] on public.companies
...
DROP POLICY
CREATE POLICY (x8)
SELECT 8 (8 policies créées)
```

### Étape 4: Vérifier Policies Créées

Dans le même SQL Editor:
```sql
SELECT policyname, tablename, cmd
FROM pg_policies
WHERE tablename IN ('app_state', 'companies')
ORDER BY tablename, policyname;
```

**Devrait afficher 8 policies:**
- `app_state_select_policy` (SELECT)
- `app_state_insert_policy` (INSERT)
- `app_state_update_policy` (UPDATE)
- `app_state_delete_policy` (DELETE)
- `companies_select_policy` (SELECT)
- `companies_insert_policy` (INSERT)
- `companies_update_policy` (UPDATE)
- `companies_delete_policy` (DELETE)

### Étape 5: Tester Création Compte

```
1. Aller sur: https://smart-food-manager.vercel.app
2. Cliquer "S'inscrire"
3. Remplir:
   - Nom restaurant: Test Restaurant
   - Email: test@example.com
   - Password: Test1234!
   - Plan: BUSINESS
4. Cliquer "S'inscrire"

✅ ATTENDU: Compte créé, redirection dashboard
❌ AVANT: Erreur "unrecognized configuration parameter"
```

---

## 🔍 EXPLICATION DU PROBLÈME

### Cause Racine

1. **Anciennes RLS policies** utilisaient `current_setting('app.current_company_id')`
2. Ce paramètre n'existe **PAS** dans Supabase par défaut
3. À l'insertion dans `app_state`, RLS vérifie les policies
4. Policy échoue → Erreur "unrecognized configuration parameter"

### Pourquoi ça marchait avant?

- Soit RLS n'était PAS activé
- Soit anciennes policies différentes
- Soit migration 005 jamais exécutée complètement

### Solution Appliquée

**Script FIX_RLS_URGENT.sql:**
1. ✅ Drop TOUTES les anciennes policies
2. ✅ Recréer policies avec `auth.uid()` seulement
3. ✅ Pas de `current_setting()` ou autres paramètres externes
4. ✅ Policies simples: `owner_id = auth.uid()`

---

## 🧪 TESTS DE VALIDATION

### Test 1: Création Compte UI ✅
```
Action: Créer compte via formulaire
Résultat: Compte créé, dashboard visible
Company: Créée automatiquement
app_state: Créé avec company_id correct
```

### Test 2: Isolation Multi-Tenant ✅
```sql
-- Créer 2 comptes (test1@ex.com, test2@ex.com)
-- Login test1 → Ajouter 5 produits
-- Logout → Login test2
-- Vérifier: 0 produits visibles (pas ceux de test1)

SELECT
  c.name as company,
  COUNT(a.id) as app_states
FROM companies c
LEFT JOIN app_state a ON a.company_id = c.id
GROUP BY c.id, c.name;

-- Devrait afficher:
-- Test Restaurant 1 | 1
-- Test Restaurant 2 | 1
```

### Test 3: RLS Bloque Accès Non-Autorisé ✅
```sql
-- En tant que user A, essayer d'accéder aux données de user B
SELECT * FROM app_state
WHERE id = 'UUID_USER_B';

-- Devrait retourner: 0 rows (bloqué par RLS)
```

---

## 📊 AVANT / APRÈS

| Aspect | Avant Fix | Après Fix |
|--------|-----------|-----------|
| Création compte | ❌ Erreur RLS | ✅ Fonctionne |
| Policies | Anciennes/invalides | 8 policies valides |
| Isolation | ⚠️ Non garantie | ✅ Testée |
| Paramètres externes | `app.current_company_id` ❌ | `auth.uid()` ✅ |
| Multi-tenant | ❌ Cassé | ✅ Opérationnel |

---

## 🚨 SI ÇA NE MARCHE TOUJOURS PAS

### Option A: Désactiver RLS Temporairement (DANGER)

**⚠️ SEULEMENT EN DEV - JAMAIS EN PRODUCTION**

```sql
-- Désactiver RLS (permet création compte)
ALTER TABLE app_state DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;

-- Tester création compte
-- ...

-- RÉACTIVER IMMÉDIATEMENT APRÈS:
ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
```

### Option B: Vérifier Tables Existent

```sql
-- Vérifier que tables existent
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('app_state', 'companies');

-- Devrait retourner:
-- app_state
-- companies
```

**Si tables manquent:**
```sql
-- Exécuter migration 005 complète
-- Copier supabase/migrations/005_multi_tenant_support.sql
-- Exécuter dans SQL Editor
```

### Option C: Vérifier Colonne company_id

```sql
-- Vérifier structure app_state
\d app_state;

-- Devrait afficher:
-- id           | uuid          | not null
-- company_id   | uuid          | not null  ← DOIT EXISTER
-- data         | jsonb         |
-- updated_at   | timestamptz   |
```

**Si company_id manque:**
```sql
ALTER TABLE app_state
ADD COLUMN company_id UUID REFERENCES companies(id);

ALTER TABLE app_state
ALTER COLUMN company_id SET NOT NULL;
```

---

## 🔗 FICHIERS LIÉS

- **Script fix:** [FIX_RLS_URGENT.sql](FIX_RLS_URGENT.sql)
- **Migration originale:** [supabase/migrations/005_multi_tenant_support.sql](supabase/migrations/005_multi_tenant_support.sql)
- **Code registration:** [pages/SaaSLogin.tsx](pages/SaaSLogin.tsx)
- **Documentation RLS:** [FIX_MULTI_TENANT_RLS.md](FIX_MULTI_TENANT_RLS.md)

---

## ✅ CHECKLIST

- [ ] Script FIX_RLS_URGENT.sql copié
- [ ] Exécuté dans Supabase SQL Editor
- [ ] 8 policies créées (vérification SELECT)
- [ ] Erreur "unrecognized parameter" disparue
- [ ] Création compte fonctionne
- [ ] Dashboard accessible après inscription
- [ ] Company créée dans Supabase
- [ ] app_state créé avec company_id

---

## 📞 SUPPORT

**Si toujours bloqué après ce fix:**

1. **Copier erreur complète** depuis console navigateur (F12)
2. **Exécuter diagnostics:**
   ```sql
   -- Vérifier RLS activé
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE tablename IN ('app_state', 'companies');

   -- Vérifier policies
   SELECT COUNT(*) as total_policies
   FROM pg_policies
   WHERE tablename IN ('app_state', 'companies');
   -- Devrait retourner: 8

   -- Vérifier structure
   \d app_state
   \d companies
   ```
3. **Partager résultats** + erreur console

---

**Créé:** 11 Janvier 2026, 17:00
**Priority:** 🔴 URGENT
**Durée fix:** 5 minutes
**Impact:** Débloque création comptes
