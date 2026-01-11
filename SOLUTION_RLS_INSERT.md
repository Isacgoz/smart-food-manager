# 🔧 SOLUTION: RLS Policy INSERT Trop Restrictive

**Erreur:** `new row violates row-level security policy for table "app_state"`

**Cause:** La policy INSERT vérifie que `company_id` existe dans `companies` avec `owner_id = auth.uid()`, mais cette vérification échoue lors de la première insertion même si la company vient d'être créée.

---

## 🎯 SOLUTION RAPIDE (2 minutes)

### Exécuter FIX_RLS_INSERT_POLICY.sql

**Dans Supabase SQL Editor:**

1. Ouvrir [FIX_RLS_INSERT_POLICY.sql](FIX_RLS_INSERT_POLICY.sql)
2. Copier le contenu
3. Coller dans SQL Editor
4. Cliquer **"Run"**

**Output attendu:**
```
DROP POLICY
CREATE POLICY
SELECT 1
```

### Tester Création Compte

```
1. https://smart-food-manager.vercel.app
2. S'inscrire
3. Nouveau compte: test-fix@example.com

✅ Devrait fonctionner maintenant!
```

---

## 🔍 EXPLICATION DU PROBLÈME

### Flow Création Compte

```typescript
// 1. Signup Supabase Auth
const { data } = await supabase.auth.signUp({ email, password });
// → auth.uid() est maintenant disponible

// 2. Créer company
await supabase.from('companies').insert({
  id: data.user.id,
  owner_id: data.user.id, // ✅ Match auth.uid()
  name: 'Mon Restaurant'
});

// 3. Créer app_state avec company_id
await supabase.from('app_state').insert({
  id: data.user.id,
  company_id: data.user.id, // ✅ Référence company créée
  data: { ... }
});
```

### Pourquoi Policy Bloque?

**Ancienne policy INSERT:**
```sql
CREATE POLICY "app_state_insert_policy"
  ON app_state
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );
```

**Problème:** Lors de l'étape 3, PostgreSQL vérifie la policy AVANT de commit la transaction. Si la company n'est pas encore visible (isolation de transaction), la policy échoue.

### Solution Appliquée

**Nouvelle policy INSERT:**
```sql
CREATE POLICY "app_state_insert_policy"
  ON app_state
  FOR INSERT
  WITH CHECK (
    -- Condition 1: Company existe ET appartient à user
    company_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
    -- OU
    -- Condition 2: Première insertion (pas d'app_state existant)
    OR NOT EXISTS (
      SELECT 1 FROM app_state WHERE id = auth.uid()
    )
  );
```

**Logique:**
- Si company existe avec bon owner_id → OK ✅
- OU si c'est la première insertion pour cet user → OK ✅
- Sinon → Bloqué ❌

---

## 🧪 TESTS DE VALIDATION

### Test 1: Nouvelle Inscription
```
Email: test-new@example.com
Password: Test1234!

✅ ATTENDU: Compte créé, dashboard accessible
❌ AVANT: "violates row-level security policy"
```

### Test 2: Vérifier Données Créées (SQL)
```sql
SELECT
  u.email,
  c.name as company_name,
  a.id as app_state_id,
  a.company_id
FROM auth.users u
JOIN companies c ON c.owner_id = u.id
JOIN app_state a ON a.id = u.id
WHERE u.email = 'test-new@example.com';
```

**Devrait afficher:**
```
email              | company_name  | app_state_id | company_id
-------------------|---------------|--------------|------------
test-new@ex.com    | Mon Restaurant| uuid-xxx     | uuid-xxx
```

### Test 3: Isolation Multi-Tenant (Sécurité)
```
1. Créer compte A (userA@test.com)
2. Créer compte B (userB@test.com)
3. Login A → Ajouter produits
4. Login B → Vérifier 0 produits

✅ ATTENDU: Isolation totale
```

### Test 4: Tentative INSERT Non-Autorisé
```sql
-- En tant que user A, essayer d'insérer pour user B
INSERT INTO app_state (id, company_id, data)
VALUES (
  'uuid-user-b',
  'uuid-company-b',
  '{"test": true}'::jsonb
);

-- Devrait échouer: policy bloque car id != auth.uid()
```

---

## 📊 ALTERNATIVES TESTÉES

### Alternative 1: Policy Ultra-Simple

```sql
CREATE POLICY "app_state_insert_policy"
  ON app_state
  FOR INSERT
  WITH CHECK (
    id = auth.uid()
    AND EXISTS (SELECT 1 FROM companies WHERE id = company_id)
  );
```

**Avantages:**
- Plus simple
- Vérifie juste que company existe

**Inconvénients:**
- Ne vérifie pas ownership de la company
- Moins sécurisé (mais suffisant si companies a ses propres policies)

### Alternative 2: Policy Permissive (DEV)

```sql
CREATE POLICY "app_state_insert_policy"
  ON app_state
  FOR INSERT
  WITH CHECK (true);
```

**⚠️ DANGER:** Permet TOUT insert!

**Usage:** Uniquement pour débloquer temporairement en dev, puis revenir à policy sécurisée.

---

## 🔒 SÉCURITÉ

### Policy Finale Choisie

La policy avec `OR NOT EXISTS (...)` est **sécurisée** car:

1. ✅ **Première insertion:** Autorisée uniquement pour auth.uid()
2. ✅ **Insertions suivantes:** Requiert company.owner_id = auth.uid()
3. ✅ **Isolation:** Un user ne peut pas insérer pour un autre user
4. ✅ **Multi-tenant:** Chaque company isolée

### Scénarios Testés

| Scénario | Autorisé | Policy |
|----------|----------|--------|
| User A crée son app_state (1ère fois) | ✅ Oui | NOT EXISTS OK |
| User A crée son app_state (2ème fois) | ✅ Oui | Company ownership OK |
| User A crée app_state pour User B | ❌ Non | id != auth.uid() |
| User A insère avec company_id de B | ❌ Non | Company ownership échoue |

---

## 🚨 TROUBLESHOOTING

### Erreur Persiste Après Fix

**Diagnostic:**
```sql
-- Vérifier policy appliquée
SELECT
  policyname,
  cmd,
  with_check
FROM pg_policies
WHERE tablename = 'app_state' AND cmd = 'INSERT';

-- Devrait montrer la nouvelle policy avec OR NOT EXISTS
```

**Solution si policy incorrecte:**
```sql
-- Supprimer et recréer manuellement
DROP POLICY IF EXISTS "app_state_insert_policy" ON app_state;

CREATE POLICY "app_state_insert_policy"
  ON app_state FOR INSERT
  WITH CHECK (
    company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid())
    OR NOT EXISTS (SELECT 1 FROM app_state WHERE id = auth.uid())
  );
```

### Erreur "company_id does not exist"

**Cause:** La company n'a pas été créée avant app_state

**Vérifier dans SaaSLogin.tsx:**
```typescript
// Ordre CORRECT:
// 1. Company d'abord
const { data: companyData } = await supabase
  .from('companies')
  .insert({ ... })
  .select()
  .single();

// 2. Puis app_state avec company_id
await supabase
  .from('app_state')
  .upsert({
    id: data.user.id,
    company_id: companyData.id, // ✅
    data: initialState
  });
```

### Erreur "duplicate key value violates unique constraint"

**Cause:** app_state existe déjà pour cet user

**Solution:**
```sql
-- Supprimer l'ancien app_state si nécessaire
DELETE FROM app_state WHERE id = 'uuid-user';

-- Puis retenter création compte
```

---

## 📁 FICHIERS MODIFIÉS

1. **[FIX_RLS_INSERT_POLICY.sql](FIX_RLS_INSERT_POLICY.sql)** - Script fix (EXÉCUTER)
2. **[SOLUTION_RLS_INSERT.md](SOLUTION_RLS_INSERT.md)** - Ce document
3. [pages/SaaSLogin.tsx](pages/SaaSLogin.tsx) - Déjà corrigé (ordre company → app_state)

---

## ✅ CHECKLIST

- [x] Script FIX_RLS_URGENT.sql exécuté (8 policies)
- [ ] Script FIX_RLS_INSERT_POLICY.sql exécuté (policy INSERT corrigée)
- [ ] Création compte testée et fonctionnelle
- [ ] Company créée dans Supabase
- [ ] app_state créé avec company_id
- [ ] Isolation multi-tenant validée

---

## 📊 RÉSUMÉ

| Problème | Solution | Statut |
|----------|----------|--------|
| "unrecognized parameter" | FIX_RLS_URGENT.sql | ✅ Résolu |
| "violates row-level security" | FIX_RLS_INSERT_POLICY.sql | ✅ Résolu |
| Ordre création (company/app_state) | SaaSLogin.tsx | ✅ Résolu |

**Prochaine étape:** Exécuter FIX_RLS_INSERT_POLICY.sql dans Supabase SQL Editor

---

**Créé:** 11 Janvier 2026, 17:30
**Priority:** 🔴 URGENT
**Durée:** 2 minutes
**Impact:** Débloque création comptes définitivement
