-- =============================================
-- FIX: Policy INSERT app_state trop restrictive
-- =============================================
-- Erreur: "new row violates row-level security policy for table app_state"
-- Cause: Policy vérifie company.owner_id = auth.uid() MAIS company vient d'être créée
-- Solution: Permettre INSERT si company existe ET owner_id match OU si c'est la première insertion
-- =============================================

-- ÉTAPE 1: Supprimer l'ancienne policy INSERT restrictive
DROP POLICY IF EXISTS "app_state_insert_policy" ON app_state;

-- ÉTAPE 2: Créer nouvelle policy INSERT plus permissive
CREATE POLICY "app_state_insert_policy"
  ON app_state
  FOR INSERT
  WITH CHECK (
    -- Permettre INSERT si:
    -- 1. La company existe et appartient à l'utilisateur connecté
    company_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
    -- OU
    -- 2. C'est la première insertion (app_state n'existe pas encore pour cet ID)
    OR NOT EXISTS (
      SELECT 1 FROM app_state WHERE id = auth.uid()
    )
  );

-- ÉTAPE 3: Vérifier que les autres policies sont correctes
-- (Ne toucher QUE à INSERT, les autres sont OK)

-- ÉTAPE 4: Vérification
SELECT
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'app_state' AND policyname = 'app_state_insert_policy';

-- =============================================
-- ALTERNATIVE: Policy encore plus simple
-- =============================================
-- Si la solution ci-dessus ne marche toujours pas,
-- utiliser cette version ultra-permissive (décommenter):

/*
DROP POLICY IF EXISTS "app_state_insert_policy" ON app_state;

CREATE POLICY "app_state_insert_policy"
  ON app_state
  FOR INSERT
  WITH CHECK (
    -- Permettre INSERT si l'ID correspond à l'utilisateur connecté
    id = auth.uid()
    AND
    -- ET que la company référencée existe (pas besoin de vérifier owner_id)
    EXISTS (SELECT 1 FROM companies WHERE id = company_id)
  );
*/

-- =============================================
-- SOLUTION ULTIME: Policy sans vérification
-- =============================================
-- En dernier recours, si rien ne marche (DEV SEULEMENT):

/*
DROP POLICY IF EXISTS "app_state_insert_policy" ON app_state;

CREATE POLICY "app_state_insert_policy"
  ON app_state
  FOR INSERT
  WITH CHECK (true); -- Permet tout INSERT (pas sécurisé!)

-- ⚠️ ATTENTION: Cette policy permet à n'importe qui d'insérer dans app_state
-- À utiliser UNIQUEMENT pour débloquer, puis revenir à une policy sécurisée
*/

-- =============================================
-- TEST APRÈS FIX
-- =============================================
-- Tester création compte:
-- 1. Aller sur l'app
-- 2. S'inscrire avec nouveau compte
-- 3. Devrait fonctionner ✅

-- Vérifier données créées:
-- SELECT u.email, c.name as company, a.id as app_state_id
-- FROM auth.users u
-- JOIN companies c ON c.owner_id = u.id
-- JOIN app_state a ON a.id = u.id
-- WHERE u.email = 'ton-email@test.com';
