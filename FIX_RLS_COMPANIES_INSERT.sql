-- =============================================
-- FIX: Policy INSERT companies trop restrictive
-- =============================================
-- Erreur: "new row violates row-level security policy for table 'companies'"
-- Cause: Policy INSERT vérifie owner_id = auth.uid() mais bloque pendant signup
-- Solution: Permettre INSERT si owner_id = auth.uid() (condition simple)
-- =============================================

-- ÉTAPE 1: Supprimer l'ancienne policy INSERT
DROP POLICY IF EXISTS "companies_insert_policy" ON companies;

-- ÉTAPE 2: Créer nouvelle policy INSERT permissive
CREATE POLICY "companies_insert_policy"
  ON companies
  FOR INSERT
  WITH CHECK (
    -- Permettre INSERT uniquement si owner_id correspond à l'utilisateur connecté
    owner_id = auth.uid()
  );

-- Explication:
-- Cette policy est simple et sécurisée:
-- - Un utilisateur ne peut créer une company QUE pour lui-même (owner_id = auth.uid())
-- - Impossible de créer une company pour un autre utilisateur
-- - Pas besoin de vérifier d'autres conditions pendant le signup

-- ÉTAPE 3: Vérification
SELECT
  tablename,
  policyname,
  cmd,
  with_check
FROM pg_policies
WHERE tablename = 'companies' AND policyname = 'companies_insert_policy';

-- Devrait afficher: with_check = (owner_id = auth.uid())

-- =============================================
-- TEST APRÈS FIX
-- =============================================
-- 1. Aller sur https://smart-food-manager.vercel.app
-- 2. Cliquer "S'inscrire"
-- 3. Remplir formulaire (nom, email, password, plan)
-- 4. Submit
-- 5. ✅ Devrait fonctionner: compte créé, dashboard accessible

-- Vérifier données créées:
/*
SELECT
  u.email,
  c.name as company_name,
  c.owner_id,
  c.plan,
  a.id as app_state_id
FROM auth.users u
LEFT JOIN companies c ON c.owner_id = u.id
LEFT JOIN app_state a ON a.company_id = c.id
ORDER BY u.created_at DESC
LIMIT 5;
*/

-- =============================================
-- SÉCURITÉ VALIDÉE
-- =============================================
-- Cette policy est sécurisée car:
-- ✅ User ne peut créer company QUE pour lui-même (owner_id = auth.uid())
-- ✅ Impossible de créer company pour autre user
-- ✅ Simple et claire (pas d'effets de bord)
-- ✅ Compatible avec le flow signup
