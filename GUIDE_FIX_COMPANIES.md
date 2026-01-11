# 🔧 FIX: Policy INSERT Companies

**Erreur:** `new row violates row-level security policy for table 'companies'`

**Cause:** La policy INSERT de `companies` bloque la création lors du signup.

---

## ⚡ SOLUTION IMMÉDIATE (1 minute)

### Exécuter le Script

**Dans Supabase SQL Editor:**

1. Ouvre **[FIX_RLS_COMPANIES_INSERT.sql](FIX_RLS_COMPANIES_INSERT.sql)**
2. Copie le contenu
3. Colle dans SQL Editor
4. Clique **"Run"**

**Output attendu:**
```
DROP POLICY
CREATE POLICY
SELECT 1
```

---

## 🔍 EXPLICATION

### Le Problème

Lors du signup, le flow est:
```typescript
1. supabase.auth.signUp() → auth.uid() disponible
2. INSERT INTO companies (owner_id = auth.uid()) ← BLOQUE ICI
3. INSERT INTO app_state (company_id = ...)
```

L'ancienne policy `companies_insert_policy` était trop restrictive ou mal configurée.

### La Solution

**Nouvelle policy ultra-simple:**
```sql
CREATE POLICY "companies_insert_policy"
  ON companies
  FOR INSERT
  WITH CHECK (
    owner_id = auth.uid()
  );
```

**Sécurité:**
- ✅ User peut créer company SEULEMENT pour lui-même
- ✅ Impossible de créer company pour autre user
- ✅ Simple, clair, fonctionne

---

## ✅ TESTER

```
1. https://smart-food-manager.vercel.app
2. S'inscrire
3. Email: test-companies@example.com
4. Password: Test1234!
5. Submit

✅ ATTENDU: Compte créé, dashboard accessible
```

---

## 📊 VÉRIFICATION (SQL)

```sql
-- Vérifier policy active
SELECT policyname, cmd, with_check
FROM pg_policies
WHERE tablename = 'companies'
AND policyname = 'companies_insert_policy';

-- Vérifier données créées
SELECT
  u.email,
  c.name as company,
  c.owner_id,
  a.company_id
FROM auth.users u
JOIN companies c ON c.owner_id = u.id
JOIN app_state a ON a.company_id = c.id
WHERE u.email = 'test-companies@example.com';
```

---

## 🎯 RÉCAPITULATIF DES FIXES

| Fix | Erreur | Fichier | Status |
|-----|--------|---------|--------|
| 1 | "unrecognized parameter" | FIX_RLS_URGENT.sql | ✅ |
| 2 | RLS policy app_state | FIX_RLS_INSERT_POLICY.sql | ✅ |
| 3 | RLS policy companies | FIX_RLS_COMPANIES_INSERT.sql | ⏳ |

**Après fix 3:** Création compte devrait être **100% fonctionnelle** ✅

---

## 📄 FICHIERS

- **[FIX_RLS_COMPANIES_INSERT.sql](FIX_RLS_COMPANIES_INSERT.sql)** - Exécuter maintenant
- [FIX_RLS_INSERT_POLICY.sql](FIX_RLS_INSERT_POLICY.sql) - Déjà fait ✅
- [FIX_RLS_URGENT.sql](FIX_RLS_URGENT.sql) - Déjà fait ✅

---

## 🚀 CHECKLIST FINALE

- [x] FIX_RLS_URGENT.sql exécuté
- [x] FIX_RLS_INSERT_POLICY.sql exécuté
- [ ] **FIX_RLS_COMPANIES_INSERT.sql exécuté** ← TOI
- [ ] Test création compte OK

---

**Va exécuter [FIX_RLS_COMPANIES_INSERT.sql](FIX_RLS_COMPANIES_INSERT.sql) dans Supabase maintenant!**

Après ça, tout devrait fonctionner. 🚀
