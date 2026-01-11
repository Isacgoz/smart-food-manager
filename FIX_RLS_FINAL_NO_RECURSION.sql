-- =============================================
-- FIX FINAL: Suppression récursion infinie RLS
-- =============================================
-- ERREUR CRITIQUE: "infinite recursion detected in policy for relation 'app_state'"
-- CAUSE: La clause "NOT EXISTS (SELECT 1 FROM app_state WHERE id = auth.uid())"
--        crée une récursion car elle interroge app_state pendant INSERT dans app_state
-- SOLUTION: Policy simple SANS NOT EXISTS, vérification directe company ownership
-- =============================================

-- =============================================
-- ÉTAPE 1: Supprimer policy récursive app_state
-- =============================================
DROP POLICY IF EXISTS "app_state_insert_policy" ON app_state;

-- =============================================
-- ÉTAPE 2: Créer policy SIMPLE sans récursion
-- =============================================
CREATE POLICY "app_state_insert_policy"
  ON app_state
  FOR INSERT
  WITH CHECK (
    -- Vérification simple: company existe ET appartient à auth.uid()
    EXISTS (
      SELECT 1 FROM companies
      WHERE id = company_id
      AND owner_id = auth.uid()
    )
  );

-- Explication:
-- Cette policy est sécurisée ET sans récursion car:
-- ✅ Vérifie que company_id existe dans companies (pas dans app_state)
-- ✅ Vérifie que company.owner_id = auth.uid()
-- ✅ PAS de requête récursive sur app_state
-- ✅ Simple, directe, performante

-- =============================================
-- ÉTAPE 3: Vérifier policy companies aussi
-- =============================================
-- S'assurer que companies_insert_policy est simple

DROP POLICY IF EXISTS "companies_insert_policy" ON companies;

CREATE POLICY "companies_insert_policy"
  ON companies
  FOR INSERT
  WITH CHECK (
    -- Simplement vérifier que owner_id = user connecté
    owner_id = auth.uid()
  );

-- =============================================
-- ÉTAPE 4: Vérification finale
-- =============================================
SELECT
  tablename,
  policyname,
  cmd,
  with_check
FROM pg_policies
WHERE tablename IN ('app_state', 'companies')
AND cmd = 'INSERT'
ORDER BY tablename, policyname;

-- Devrait afficher:
-- app_state   | app_state_insert_policy   | INSERT | EXISTS (SELECT 1 FROM companies ...)
-- companies   | companies_insert_policy   | INSERT | (owner_id = auth.uid())

-- =============================================
-- ÉTAPE 5: Test complet
-- =============================================
/*
-- Après exécution de ce script:

1. Aller sur https://smart-food-manager.vercel.app
2. Cliquer "S'inscrire"
3. Remplir:
   - Nom restaurant: Test Final
   - Email: test-final@example.com
   - Password: Test1234!
   - Plan: BUSINESS
4. Submit

✅ ATTENDU: Compte créé, dashboard accessible
❌ AVANT: "infinite recursion detected"

-- Vérifier données créées:
SELECT
  u.email,
  u.id as user_id,
  c.id as company_id,
  c.name as company_name,
  c.owner_id,
  a.id as app_state_id,
  a.company_id as app_state_company_id
FROM auth.users u
LEFT JOIN companies c ON c.owner_id = u.id
LEFT JOIN app_state a ON a.id = u.id
WHERE u.email = 'test-final@example.com';

-- Devrait afficher UNE ligne avec:
-- - user_id = company.owner_id
-- - company_id = app_state.company_id
-- - Toutes les colonnes non-NULL
*/

-- =============================================
-- SÉCURITÉ GARANTIE
-- =============================================
-- Cette solution est sécurisée car:
--
-- 1. companies INSERT:
--    ✅ User peut créer company SEULEMENT si owner_id = auth.uid()
--    ❌ User ne peut PAS créer company pour autre user
--
-- 2. app_state INSERT:
--    ✅ User peut créer app_state SEULEMENT si company existe ET owner_id = auth.uid()
--    ❌ User ne peut PAS insérer app_state pour company d'un autre user
--    ❌ User ne peut PAS insérer app_state avec company inexistante
--
-- 3. Isolation multi-tenant:
--    ✅ Chaque user voit SEULEMENT ses données
--    ✅ RLS policies SELECT/UPDATE/DELETE maintenues (déjà créées dans FIX_RLS_URGENT.sql)
--
-- 4. Performance:
--    ✅ Requête directe sur companies (table indexée)
--    ✅ PAS de récursion
--    ✅ PAS de sous-requête complexe

-- =============================================
-- TROUBLESHOOTING
-- =============================================
-- Si l'erreur persiste:
--
-- 1. Vérifier que companies table existe:
-- SELECT COUNT(*) FROM companies;
--
-- 2. Vérifier RLS activé sur les deux tables:
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE tablename IN ('app_state', 'companies');
-- -- rowsecurity doit être TRUE pour les deux
--
-- 3. Vérifier toutes les policies:
-- SELECT tablename, policyname, cmd FROM pg_policies
-- WHERE tablename IN ('app_state', 'companies')
-- ORDER BY tablename, cmd, policyname;
-- -- Devrait afficher 8 policies (4 par table)
--
-- 4. Si erreur persiste, désactiver temporairement RLS (DEV ONLY):
-- ALTER TABLE app_state DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
-- -- Tester création compte
-- -- RÉACTIVER IMMÉDIATEMENT:
-- ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- =============================================
-- FIN DU SCRIPT
-- =============================================
-- Après exécution:
-- ✅ Récursion éliminée
-- ✅ Policies simples et sécurisées
-- ✅ Création compte fonctionnelle
-- ✅ Multi-tenant isolé
-- =============================================
