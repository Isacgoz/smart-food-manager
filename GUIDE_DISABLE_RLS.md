# 🚨 DÉSACTIVATION TEMPORAIRE RLS

**Erreur persiste après TOUS les fixes:** `infinite recursion detected in policy for relation "app_state"`

**Décision:** Désactiver RLS temporairement pour **débloquer le développement** + **investiguer la cause**.

---

## ⚠️ AVERTISSEMENT CRITIQUE

**Désactiver RLS = AUCUNE sécurité database!**

- ❌ **Pas d'isolation** multi-tenant côté DB
- ❌ **Tous les users** peuvent voir toutes les données
- ✅ **OK pour développement** local
- 🔴 **DANGER en production**

**Utiliser UNIQUEMENT pour:**
1. Débloquer création compte
2. Investiguer cause récursion
3. Développer features
4. Tester application

**RÉACTIVER avant mise en production!**

---

## ⚡ SOLUTION TEMPORAIRE (5 minutes)

### Étape 1: Diagnostic + Désactivation RLS

**Dans Supabase SQL Editor:**

1. Ouvre **[FIX_DISABLE_RLS_TEMP.sql](FIX_DISABLE_RLS_TEMP.sql)**
2. Copie **TOUT** le contenu
3. Colle dans SQL Editor
4. Clique **"Run"**

**Output attendu:**
```
SELECT (diagnostic triggers)
SELECT (diagnostic fonctions)
SELECT (diagnostic policies)
SELECT (diagnostic extensions)
ALTER TABLE (disable RLS)
SELECT (vérification rowsecurity = false)
```

### Étape 2: Tester Création Compte

```
1. https://smart-food-manager.vercel.app
2. S'inscrire
3. Email: test-no-rls@example.com
4. Password: Test1234!

✅ DEVRAIT FONCTIONNER (pas de RLS = pas de policies)
```

### Étape 3: Vérifier Données Créées

```sql
SELECT
  u.email,
  u.id as user_id,
  c.id as company_id,
  c.owner_id,
  a.id as app_state_id
FROM auth.users u
LEFT JOIN companies c ON c.owner_id = u.id
LEFT JOIN app_state a ON a.id = u.id
WHERE u.email = 'test-no-rls@example.com';

-- Devrait afficher: user, company, app_state créés
```

---

## 🔍 INVESTIGATION CAUSE RÉCURSION

### Résultats Diagnostic à Analyser

Le script FIX_DISABLE_RLS_TEMP.sql retourne plusieurs diagnostics:

#### 1. Triggers
```sql
-- Query 1: Liste triggers sur app_state/companies
-- Chercher triggers qui:
-- - Appellent des fonctions
-- - Modifient d'autres tables
-- - Exécutent SELECT sur app_state/companies
```

**Suspect probable:** `update_companies_updated_at` trigger

#### 2. Fonctions
```sql
-- Query 2: Fonctions liées à app_state/companies
-- Chercher fonctions qui:
-- - Interrogent app_state ou companies
-- - Sont appelées par triggers
-- - Font des UPDATE/INSERT
```

**Suspect probable:** `update_updated_at_column()` function

#### 3. Policies
```sql
-- Query 3: Toutes les policies
-- Vérifier qu'il reste SEULEMENT 8 policies simples
-- Si plus, des anciennes policies persistent!
```

#### 4. Extensions
```sql
-- Query 4: Extensions Supabase
-- Vérifier si pgsodium, vault, etc. sont actives
-- Certaines extensions peuvent créer policies automatiques
```

---

## 🔧 CAUSES PROBABLES & FIXES

### Cause 1: Trigger `update_updated_at_column`

**Diagnostic:**
```sql
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'update_updated_at_column';
```

**Si fonction interroge app_state ou companies:**
```sql
-- Désactiver trigger temporairement
ALTER TABLE companies DISABLE TRIGGER update_companies_updated_at;
```

### Cause 2: Anciennes Policies Non Supprimées

**Diagnostic:**
```sql
SELECT COUNT(*) FROM pg_policies
WHERE tablename IN ('app_state', 'companies');
-- Si > 8, il reste des anciennes policies
```

**Fix:**
```sql
-- Supprimer TOUTES policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE tablename IN ('app_state', 'companies')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;
```

### Cause 3: Extension Supabase (pgsodium/vault)

**Diagnostic:**
```sql
SELECT * FROM pg_extension WHERE extname = 'pgsodium';
```

**Si récursion vient de l'extension:**
```sql
-- Pas de fix simple, investiguer docs Supabase
-- Potentiellement désactiver extension (DANGER)
```

### Cause 4: Foreign Key Cascade

**Diagnostic:**
```sql
SELECT
  conname,
  conrelid::regclass as table,
  confrelid::regclass as ref_table,
  confupdtype,
  confdeltype
FROM pg_constraint
WHERE contype = 'f'
AND (conrelid::regclass::text = 'app_state' OR confrelid::regclass::text = 'app_state');
```

**Si CASCADE détecté:**
```sql
-- Modifier FK pour enlever CASCADE
ALTER TABLE app_state
DROP CONSTRAINT app_state_company_id_fkey,
ADD CONSTRAINT app_state_company_id_fkey
  FOREIGN KEY (company_id) REFERENCES companies(id)
  ON DELETE RESTRICT;  -- Pas de CASCADE
```

---

## 🔄 WORKFLOW COMPLET

### Phase 1: Déblocage (MAINTENANT)
```
1. ✅ Exécuter FIX_DISABLE_RLS_TEMP.sql
2. ✅ RLS désactivé
3. ✅ Création compte fonctionne
4. ✅ Développement peut continuer
```

### Phase 2: Investigation (APRÈS déblocage)
```
1. Analyser résultats diagnostic
2. Identifier cause récursion (trigger/policy/extension)
3. Tester fix de la cause
4. Valider création compte avec fix
```

### Phase 3: Réactivation RLS (AVANT production)
```
1. Appliquer fix cause récursion
2. Réactiver RLS:
   ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;
   ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
3. Recréer 8 policies simples
4. Tester création compte
5. Tester isolation multi-tenant
```

---

## 📊 MODES D'OPÉRATION

### Mode 1: DEV sans RLS (ACTUEL)
```
✅ Création compte fonctionne
✅ Développement rapide
❌ Pas d'isolation DB
⚠️ Isolation APPLICATION requise
```

**Code SaaSLogin.tsx doit vérifier company_id:**
```typescript
// Dans toutes les queries
const { data } = await supabase
  .from('app_state')
  .select('*')
  .eq('id', currentUser.id)  // ✅ Filtrer par user
  .single();
```

### Mode 2: PROD avec RLS (OBJECTIF)
```
✅ Isolation DB automatique
✅ Sécurité maximale
❌ Nécessite fix récursion
```

---

## ⚠️ SÉCURITÉ SANS RLS

**Isolation doit être faite côté application:**

### Vérifier company_id PARTOUT

**Exemple queries sécurisées:**
```typescript
// ✅ BON: Filtrer par user id
const { data: appState } = await supabase
  .from('app_state')
  .select('*')
  .eq('id', auth.uid())
  .single();

// ❌ DANGER: Pas de filtre
const { data: allStates } = await supabase
  .from('app_state')
  .select('*');  // Retourne TOUS les restaurants!

// ✅ BON: Filtrer companies
const { data: companies } = await supabase
  .from('companies')
  .select('*')
  .eq('owner_id', auth.uid());
```

### Vérifier dans store.tsx

```typescript
// S'assurer que toutes les queries filtrent par user/company
const loadData = async () => {
  const user = supabase.auth.getUser();

  // ✅ Filtrer app_state
  const { data } = await supabase
    .from('app_state')
    .select('*')
    .eq('id', user.id)
    .single();

  return data;
};
```

---

## 📄 FICHIERS

### Scripts
- **[FIX_DISABLE_RLS_TEMP.sql](FIX_DISABLE_RLS_TEMP.sql)** - **EXÉCUTER**
- [FIX_RLS_ULTRA_SIMPLE.sql](FIX_RLS_ULTRA_SIMPLE.sql) - Policies simples (pour réactivation)

### Documentation
- [GUIDE_DISABLE_RLS.md](GUIDE_DISABLE_RLS.md) - Ce guide
- [SOLUTION_FINALE_RLS.md](SOLUTION_FINALE_RLS.md) - Historique fixes

---

## ✅ CHECKLIST

### Immédiat
- [ ] **FIX_DISABLE_RLS_TEMP.sql exécuté**
- [ ] RLS désactivé (rowsecurity = false)
- [ ] Création compte testée
- [ ] Données créées vérifiées

### Investigation
- [ ] Résultats diagnostic analysés
- [ ] Triggers listés
- [ ] Fonctions examinées
- [ ] Policies comptées
- [ ] Extensions vérifiées
- [ ] Cause récursion identifiée

### Fix & Réactivation (AVANT PROD)
- [ ] Fix cause appliqué
- [ ] RLS réactivé
- [ ] 8 policies simples recréées
- [ ] Création compte testée avec RLS
- [ ] Isolation multi-tenant validée

---

## 🎯 RÉSUMÉ

**Situation actuelle:**
- RLS policies créent récursion infinie
- Cause exacte inconnue (trigger/fonction/extension?)
- Bloque création compte

**Solution temporaire:**
- Désactiver RLS sur app_state + companies
- Création compte fonctionne
- Développement peut continuer

**Actions requises:**
1. ⏳ Exécuter FIX_DISABLE_RLS_TEMP.sql
2. ⏳ Analyser résultats diagnostic
3. ⏳ Identifier et corriger cause
4. ⏳ Réactiver RLS avant production

---

**EXÉCUTE [FIX_DISABLE_RLS_TEMP.sql](FIX_DISABLE_RLS_TEMP.sql) POUR DÉBLOQUER!**

Après ça, création de compte fonctionnera. On investigera la cause récursion en parallèle. 🚀
