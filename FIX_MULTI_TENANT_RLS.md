# 🔧 FIX: Erreur Multi-Tenant RLS

**Date:** 11 Janvier 2026, 16:30
**Erreur:** `unrecognized configuration parameter "app.current_company_id"`

---

## 🐛 PROBLÈME IDENTIFIÉ

L'erreur apparaît lors de la création de compte car:
1. L'insertion dans `app_state` nécessite `company_id` (colonne NOT NULL)
2. Les RLS policies vérifient que `company_id` existe dans `companies`
3. L'ancien code créait l'app_state SANS créer la company d'abord
4. → RLS bloque l'insertion

---

## ✅ CORRECTIONS APPLIQUÉES

### 1. SaaSLogin.tsx (Registration Flow)

**Avant:** ❌
```typescript
// Créer app_state directement
const { error } = await supabase
    .from('app_state')
    .upsert({
        id: data.user.id,
        data: initialState  // Pas de company_id!
    });
```

**Après:** ✅
```typescript
// ÉTAPE 1: Créer company d'abord
const { data: companyData, error: companyError } = await supabase
    .from('companies')
    .insert({
        id: data.user.id,
        name: regName.trim(),
        owner_id: data.user.id,
        plan: regPlan,
        is_active: true
    })
    .select()
    .single();

// ÉTAPE 2: Créer app_state avec company_id
const { error: insertError } = await supabase
    .from('app_state')
    .upsert({
        id: data.user.id,
        company_id: companyData.id, // ✅ Lien vers company
        data: initialState
    });
```

### 2. fix-login-production.sql

**Ajout étape 2:**
```sql
-- 2. Créer company d'abord (REQUIS pour RLS policies)
INSERT INTO companies (id, name, owner_id, plan, is_active)
VALUES (
  'USER_ID_ICI',
  'Restaurant Demo Production',
  'USER_ID_ICI',
  'BUSINESS',
  true
) ON CONFLICT (id) DO NOTHING;

-- 3. Puis créer app_state avec company_id
INSERT INTO app_state (id, company_id, data, updated_at)
VALUES (
  'USER_ID_ICI',
  'USER_ID_ICI', -- company_id = user_id (1:1 mapping)
  '{ ... }'
);
```

---

## 🔍 POURQUOI CETTE ERREUR?

### Architecture Multi-Tenant

1. **Table `companies`**: Représente chaque restaurant
   - `id`: UUID unique
   - `owner_id`: Lien vers `auth.users`
   - `plan`: SOLO/PRO/BUSINESS

2. **Table `app_state`**: Données restaurant
   - `id`: UUID (= user_id)
   - `company_id`: FK vers `companies` (NOT NULL)
   - `data`: JSONB avec tout l'état

3. **RLS Policies**: Sécurité isolation
   ```sql
   -- Users can only see their company data
   USING (
     company_id IN (
       SELECT id FROM companies WHERE owner_id = auth.uid()
     )
   );
   ```

### Flow Correct
```
1. User signup (auth.users)
   ↓
2. Create company (companies table)
   ↓
3. Create app_state (avec company_id)
   ↓
4. RLS vérifie: company.owner_id = auth.uid() ✅
```

### Flow Cassé (Avant fix)
```
1. User signup (auth.users)
   ↓
2. Create app_state (sans company_id) ❌
   ↓
3. RLS vérifie: company_id inexistant
   ↓
4. ERROR: configuration parameter not found
```

---

## 🧪 TESTS À FAIRE

### Test 1: Nouvelle Inscription (UI)
```
1. Aller sur https://smart-food-manager.vercel.app
2. Cliquer "S'inscrire"
3. Remplir:
   - Nom: Test Restaurant
   - Email: test123@example.com
   - Password: Test1234!
   - Plan: BUSINESS
4. Submit

✅ ATTENDU: Compte créé, redirection dashboard
❌ AVANT: Erreur "unrecognized configuration parameter"
```

### Test 2: Vérifier Company Créée (SQL)
```sql
-- Dans Supabase SQL Editor
SELECT
  u.id,
  u.email,
  c.name as company_name,
  c.plan,
  a.id as app_state_id,
  a.company_id
FROM auth.users u
LEFT JOIN companies c ON c.owner_id = u.id
LEFT JOIN app_state a ON a.id = u.id
WHERE u.email = 'test123@example.com';

-- Devrait afficher:
-- id | email | company_name | plan | app_state_id | company_id
-- xxx | test123... | Test Restaurant | BUSINESS | xxx | xxx
```

### Test 3: Isolation Multi-Tenant
```
1. Créer compte A (test-a@example.com)
2. Ajouter 5 produits dans A
3. Logout

4. Créer compte B (test-b@example.com)
5. Dashboard B: Vérifier 0 produits (pas ceux de A)

6. Logout → Login A
7. Dashboard A: Vérifier 5 produits toujours là

✅ ATTENDU: Isolation totale
```

---

## 📊 VÉRIFICATION MIGRATION

### Vérifier RLS Activé
```sql
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('app_state', 'companies');

-- rowsecurity doit être true pour les 2
```

### Vérifier Policies
```sql
SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('app_state', 'companies');

-- Devrait afficher 8 policies (4 par table)
```

### Vérifier Colonnes
```sql
\d app_state;

-- Devrait afficher:
-- id UUID PRIMARY KEY
-- company_id UUID NOT NULL REFERENCES companies(id)
-- data JSONB
-- updated_at TIMESTAMPTZ
```

---

## 🚀 DÉPLOIEMENT

### Commit & Push
```bash
git add pages/SaaSLogin.tsx fix-login-production.sql FIX_MULTI_TENANT_RLS.md
git commit -m "fix(multi-tenant): RLS company creation order

- Create company BEFORE app_state insertion
- Add company_id to app_state upsert
- Fix SQL script order (company → app_state)
- Resolves 'unrecognized configuration parameter' error

Fixes registration flow + RLS policies"
git push origin main
```

### Vérifier Build Vercel
1. https://vercel.com/dashboard
2. Attendre build SUCCESS
3. Tester registration sur app live

---

## 📝 DOCUMENTATION MISE À JOUR

### Guides Affectés
- [x] `FIX_MULTI_TENANT_RLS.md` (ce fichier) - Nouveau
- [x] `pages/SaaSLogin.tsx` - Corrigé
- [x] `fix-login-production.sql` - Corrigé

### À Mettre à Jour
- [ ] `PROMPT_AGENT_IA.md` - Ajouter note sur company creation
- [ ] `AUDIT_COMPLET_ACTIONS.md` - Marquer bug résolu

---

## 🎯 CHECKLIST VALIDATION

- [x] Code SaaSLogin.tsx corrigé
- [x] Script SQL fix-login-production.sql corrigé
- [x] Documentation FIX_MULTI_TENANT_RLS.md créée
- [ ] Commit poussé sur GitHub
- [ ] Build Vercel SUCCESS
- [ ] Test registration fonctionne
- [ ] Test multi-tenant isolation validé
- [ ] Migration 005 exécutée en prod Supabase

---

## 💡 LEÇONS APPRISES

### Ordre d'Insertion Important
Avec RLS policies, l'ordre des insertions est **critique**:
1. Parent table (companies) AVANT
2. Child table (app_state) APRÈS

### RLS Policy Dependencies
Les policies qui référencent d'autres tables nécessitent que ces tables soient peuplées en premier.

### 1:1 Mapping User-Company
Architecture choisie: 1 user = 1 company
- Simplifie les policies
- UUID identiques (user.id = company.id)
- Évolution future: 1 user → N companies (gérant multi-sites)

---

## 🔗 RÉFÉRENCES

- **Migration 005:** `supabase/migrations/005_multi_tenant_support.sql`
- **RLS Policies:** Lignes 86-145 de migration 005
- **Supabase RLS Docs:** https://supabase.com/docs/guides/auth/row-level-security
- **PostgreSQL RLS:** https://www.postgresql.org/docs/current/ddl-rowsecurity.html

---

**Status:** ✅ Corrigé
**Testé:** ⏳ En attente test utilisateur
**Impact:** 🔴 Critical (bloquait inscription)
**Difficulté fix:** 🟢 Simple (ajout company creation)
