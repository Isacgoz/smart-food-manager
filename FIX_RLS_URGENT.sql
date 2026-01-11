-- =============================================
-- FIX URGENT: Supprimer anciennes RLS policies
-- =============================================
-- Erreur: unrecognized configuration parameter "app.current_company_id"
-- Cause: Anciennes policies avec current_setting() qui n'existe pas
-- Solution: Drop all policies + recréer avec auth.uid()
-- =============================================

-- ÉTAPE 1: Supprimer TOUTES les policies existantes (nettoyage complet)
DROP POLICY IF EXISTS "Users can read their company data" ON app_state;
DROP POLICY IF EXISTS "Users can update their company data" ON app_state;
DROP POLICY IF EXISTS "Users can insert their company data" ON app_state;
DROP POLICY IF EXISTS "Users can delete their company data" ON app_state;
DROP POLICY IF EXISTS "Users can read their companies" ON companies;
DROP POLICY IF EXISTS "Users can update their companies" ON companies;
DROP POLICY IF EXISTS "Users can create companies" ON companies;

-- Supprimer aussi toute policy avec "app.current_company_id" (anciennes versions)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE tablename IN ('app_state', 'companies')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
      pol.policyname, pol.schemaname, pol.tablename);
    RAISE NOTICE 'Dropped policy: % on %.%', pol.policyname, pol.schemaname, pol.tablename;
  END LOOP;
END $$;

-- ÉTAPE 2: S'assurer que RLS est activé
ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 3: Créer policies SIMPLES avec auth.uid() uniquement
-- =============================================
-- Policies pour app_state
-- =============================================

-- SELECT: Users can read their company data
CREATE POLICY "app_state_select_policy"
  ON app_state
  FOR SELECT
  USING (
    company_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

-- INSERT: Users can insert data for their company
CREATE POLICY "app_state_insert_policy"
  ON app_state
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

-- UPDATE: Users can update their company data
CREATE POLICY "app_state_update_policy"
  ON app_state
  FOR UPDATE
  USING (
    company_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

-- DELETE: Users can delete their company data
CREATE POLICY "app_state_delete_policy"
  ON app_state
  FOR DELETE
  USING (
    company_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

-- =============================================
-- Policies pour companies
-- =============================================

-- SELECT: Users can read their own companies
CREATE POLICY "companies_select_policy"
  ON companies
  FOR SELECT
  USING (owner_id = auth.uid());

-- INSERT: Users can create companies
CREATE POLICY "companies_insert_policy"
  ON companies
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- UPDATE: Users can update their companies
CREATE POLICY "companies_update_policy"
  ON companies
  FOR UPDATE
  USING (owner_id = auth.uid());

-- DELETE: Users can delete their companies
CREATE POLICY "companies_delete_policy"
  ON companies
  FOR DELETE
  USING (owner_id = auth.uid());

-- ÉTAPE 4: Vérification
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('app_state', 'companies')
ORDER BY tablename, policyname;

-- ÉTAPE 5: Test d'insertion (décommenter pour tester)
-- INSERT INTO companies (id, name, owner_id, plan)
-- VALUES (auth.uid(), 'Test Company', auth.uid(), 'BUSINESS');

-- =============================================
-- FIN DU SCRIPT
-- =============================================
-- Après exécution:
-- 1. Vérifier que 8 policies sont créées (4 par table)
-- 2. Tester création de compte sur l'app
-- 3. Vérifier isolation multi-tenant
-- =============================================
