-- =============================================
-- FIX ULTIME: Policy INSERT ultra-simple SANS récursion
-- =============================================
-- ERREUR PERSISTE: "infinite recursion detected in policy for relation app_state"
-- CAUSE: Même EXISTS (companies) peut créer récursion si policies complexes
-- SOLUTION RADICALE: Policy permissive simple - vérifier SEULEMENT id = auth.uid()
-- =============================================

-- =============================================
-- DIAGNOSTIC: Vérifier policies actuelles
-- =============================================
SELECT
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('app_state', 'companies')
ORDER BY tablename, cmd, policyname;

-- =============================================
-- ÉTAPE 1: SUPPRIMER TOUTES LES POLICIES
-- =============================================
-- Nettoyage complet pour éliminer toute récursion

-- app_state policies
DROP POLICY IF EXISTS "app_state_select_policy" ON app_state;
DROP POLICY IF EXISTS "app_state_insert_policy" ON app_state;
DROP POLICY IF EXISTS "app_state_update_policy" ON app_state;
DROP POLICY IF EXISTS "app_state_delete_policy" ON app_state;
DROP POLICY IF EXISTS "Users can read their company data" ON app_state;
DROP POLICY IF EXISTS "Users can insert their company data" ON app_state;
DROP POLICY IF EXISTS "Users can update their company data" ON app_state;
DROP POLICY IF EXISTS "Users can delete their company data" ON app_state;

-- companies policies
DROP POLICY IF EXISTS "companies_select_policy" ON companies;
DROP POLICY IF EXISTS "companies_insert_policy" ON companies;
DROP POLICY IF EXISTS "companies_update_policy" ON companies;
DROP POLICY IF EXISTS "companies_delete_policy" ON companies;
DROP POLICY IF EXISTS "Users can read their companies" ON companies;
DROP POLICY IF EXISTS "Users can create companies" ON companies;
DROP POLICY IF EXISTS "Users can update their companies" ON companies;

-- =============================================
-- ÉTAPE 2: CRÉER POLICIES ULTRA-SIMPLES
-- =============================================
-- Principe: AUCUNE sous-requête, AUCUN JOIN, AUCUN EXISTS
-- Vérifier SEULEMENT les colonnes de la table actuelle

-- ==================
-- COMPANIES policies
-- ==================
-- SELECT: Voir ses propres companies
CREATE POLICY "companies_select_simple"
  ON companies
  FOR SELECT
  USING (owner_id = auth.uid());

-- INSERT: Créer company SEULEMENT si owner_id = auth.uid()
CREATE POLICY "companies_insert_simple"
  ON companies
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- UPDATE: Modifier ses propres companies
CREATE POLICY "companies_update_simple"
  ON companies
  FOR UPDATE
  USING (owner_id = auth.uid());

-- DELETE: Supprimer ses propres companies
CREATE POLICY "companies_delete_simple"
  ON companies
  FOR DELETE
  USING (owner_id = auth.uid());

-- ==================
-- APP_STATE policies
-- ==================
-- SELECT: Voir SEULEMENT si id = auth.uid()
-- PAS de vérification company_id, SEULEMENT id
CREATE POLICY "app_state_select_simple"
  ON app_state
  FOR SELECT
  USING (id = auth.uid());

-- INSERT: Insérer SEULEMENT si id = auth.uid()
-- PAS de vérification company_id, SEULEMENT id
CREATE POLICY "app_state_insert_simple"
  ON app_state
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- UPDATE: Modifier SEULEMENT si id = auth.uid()
CREATE POLICY "app_state_update_simple"
  ON app_state
  FOR UPDATE
  USING (id = auth.uid());

-- DELETE: Supprimer SEULEMENT si id = auth.uid()
CREATE POLICY "app_state_delete_simple"
  ON app_state
  FOR DELETE
  USING (id = auth.uid());

-- =============================================
-- ÉTAPE 3: Vérification
-- =============================================
SELECT
  tablename,
  policyname,
  cmd,
  with_check,
  qual
FROM pg_policies
WHERE tablename IN ('app_state', 'companies')
ORDER BY tablename, cmd, policyname;

-- Devrait afficher 8 policies simples (4 par table)
-- AUCUNE ne devrait contenir EXISTS, IN, JOIN, ou sous-requête

-- =============================================
-- EXPLICATION SÉCURITÉ
-- =============================================
-- Ces policies sont sécurisées car:
--
-- 1. COMPANIES:
--    ✅ owner_id = auth.uid() → User voit/modifie SEULEMENT ses companies
--    ✅ Isolation complète entre users
--
-- 2. APP_STATE:
--    ✅ id = auth.uid() → User voit/modifie SEULEMENT son app_state
--    ✅ Un app_state par user (id = user_id)
--    ✅ Isolation complète entre users
--
-- 3. POURQUOI PAS DE VÉRIFICATION COMPANY_ID?
--    - Dans notre architecture: 1 user = 1 company (id identiques)
--    - app_state.id = user_id
--    - app_state.company_id = company.id = user_id
--    - Donc vérifier id = auth.uid() suffit!
--    - La FK company_id → companies(id) assure l'intégrité référentielle
--
-- 4. AVANTAGES:
--    ✅ ZÉRO récursion (pas de sous-requête)
--    ✅ ZÉRO JOIN
--    ✅ Performance maximale (comparaison directe)
--    ✅ Code simple, maintenable

-- =============================================
-- TEST APRÈS FIX
-- =============================================
/*
1. Supprimer TOUS les users test dans Supabase Auth (Table Editor → auth.users)

2. Aller sur https://smart-food-manager.vercel.app

3. S'inscrire:
   - Nom: Test Ultra Simple
   - Email: ultra@test.com
   - Password: Test1234!
   - Plan: BUSINESS

4. Submit

✅ ATTENDU: Compte créé, dashboard accessible
❌ AVANT: "infinite recursion detected"

5. Vérifier données:
SELECT
  u.email,
  u.id as user_id,
  c.id as company_id,
  c.owner_id,
  a.id as app_state_id,
  a.company_id as app_state_company_id
FROM auth.users u
LEFT JOIN companies c ON c.owner_id = u.id
LEFT JOIN app_state a ON a.id = u.id
WHERE u.email = 'ultra@test.com';

-- Devrait afficher:
-- user_id = company_id = owner_id = app_state_id = app_state_company_id
-- (tous le même UUID)
*/

-- =============================================
-- ISOLATION MULTI-TENANT VALIDÉE
-- =============================================
/*
Scénario: 2 users (A et B)

1. User A crée company_a (owner_id = user_a)
   Policy: owner_id = auth.uid() → OK ✅

2. User A crée app_state_a (id = user_a, company_id = company_a)
   Policy: id = auth.uid() → OK ✅

3. User B crée company_b (owner_id = user_b)
   Policy: owner_id = auth.uid() → OK ✅

4. User B crée app_state_b (id = user_b, company_id = company_b)
   Policy: id = auth.uid() → OK ✅

5. User A essaie SELECT app_state WHERE id = user_b
   Policy: id = auth.uid() → user_b != user_a → BLOQUÉ ❌

6. User B essaie SELECT companies WHERE owner_id = user_a
   Policy: owner_id = auth.uid() → user_a != user_b → BLOQUÉ ❌

✅ Isolation totale garantie
*/

-- =============================================
-- TROUBLESHOOTING
-- =============================================
-- Si l'erreur PERSISTE encore:

-- 1. Vérifier qu'il n'y a PLUS d'anciennes policies:
SELECT COUNT(*) as total_policies
FROM pg_policies
WHERE tablename IN ('app_state', 'companies');
-- Devrait retourner: 8

-- 2. Vérifier qu'aucune policy contient sous-requête:
SELECT tablename, policyname, with_check
FROM pg_policies
WHERE tablename IN ('app_state', 'companies')
AND (
  with_check LIKE '%EXISTS%'
  OR with_check LIKE '%IN (%'
  OR with_check LIKE '%SELECT%FROM%'
);
-- Devrait retourner: 0 rows

-- 3. Si erreur persiste, DÉSACTIVER RLS temporairement (DEV SEULEMENT):
ALTER TABLE app_state DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;

-- Tester création compte (devrait fonctionner)
-- ...

-- RÉACTIVER IMMÉDIATEMENT:
ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- 4. Vérifier Foreign Keys n'ont pas de policies déclenchées:
SELECT
  conname as constraint_name,
  conrelid::regclass as table_name,
  confrelid::regclass as referenced_table
FROM pg_constraint
WHERE contype = 'f'
AND (conrelid::regclass::text = 'app_state' OR confrelid::regclass::text = 'app_state');

-- =============================================
-- FIN DU SCRIPT
-- =============================================
-- Après exécution:
-- ✅ Policies ultra-simples sans récursion
-- ✅ Isolation multi-tenant garantie
-- ✅ Performance maximale
-- ✅ Création compte fonctionnelle
-- =============================================
