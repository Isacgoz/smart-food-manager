-- =============================================
-- FIX TEMPORAIRE: Désactiver RLS pour débloquer
-- =============================================
-- ERREUR PERSISTE: "infinite recursion detected in policy for relation app_state"
-- CAUSE PROBABLE: Trigger, fonction, ou extension Supabase créant récursion
-- SOLUTION TEMPORAIRE: Désactiver RLS pour permettre développement
-- ⚠️ CRITIQUE: Réactiver avant production!
-- =============================================

-- =============================================
-- DIAGNOSTIC COMPLET
-- =============================================

-- 1. Vérifier triggers sur app_state et companies
SELECT
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgtype,
  tgenabled,
  pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger
WHERE tgrelid::regclass::text IN ('app_state', 'companies')
AND tgname NOT LIKE 'RI_%'
ORDER BY table_name, trigger_name;

-- 2. Vérifier fonctions appelées par les triggers
SELECT
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname LIKE '%app_state%' OR p.proname LIKE '%compan%'
ORDER BY p.proname;

-- 3. Lister TOUTES les policies actuelles
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
ORDER BY tablename, cmd, policyname;

-- 4. Vérifier extensions Supabase
SELECT
  extname as extension_name,
  extversion as version
FROM pg_extension
WHERE extname IN ('supabase_vault', 'pgsodium', 'pg_graphql', 'pgcrypto', 'uuid-ossp');

-- =============================================
-- ÉTAPE 1: DÉSACTIVER RLS TEMPORAIREMENT
-- =============================================
-- ⚠️ Ceci désactive TOUTE sécurité RLS
-- Utiliser SEULEMENT en développement

ALTER TABLE app_state DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;

-- Vérifier désactivation
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('app_state', 'companies');

-- Devrait afficher: rowsecurity = false pour les deux

-- =============================================
-- ÉTAPE 2: TESTER CRÉATION COMPTE
-- =============================================
/*
1. Aller sur https://smart-food-manager.vercel.app
2. S'inscrire:
   - Nom: Test Sans RLS
   - Email: no-rls@test.com
   - Password: Test1234!
3. Submit

✅ DEVRAIT FONCTIONNER (pas de RLS)

4. Vérifier données:
SELECT
  u.email,
  c.name as company,
  a.id as app_state_id
FROM auth.users u
LEFT JOIN companies c ON c.owner_id = u.id
LEFT JOIN app_state a ON a.id = u.id
WHERE u.email = 'no-rls@test.com';
*/

-- =============================================
-- ÉTAPE 3: INVESTIGUER CAUSE RÉCURSION
-- =============================================

-- Vérifier si trigger update_updated_at_column existe
SELECT
  tgname,
  tgrelid::regclass,
  pg_get_triggerdef(oid)
FROM pg_trigger
WHERE tgname = 'update_companies_updated_at'
OR tgname LIKE '%update%'
ORDER BY tgrelid::regclass;

-- Vérifier si fonction update_updated_at_column interroge app_state
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'update_updated_at_column';

-- =============================================
-- SOLUTION PERMANENTE (après investigation)
-- =============================================

-- Option A: Si trigger cause récursion, le désactiver temporairement
-- ALTER TABLE companies DISABLE TRIGGER update_companies_updated_at;
-- ALTER TABLE app_state DISABLE TRIGGER ALL;

-- Option B: Si policies toujours problème, les supprimer complètement
-- DROP POLICY IF EXISTS "app_state_select_simple" ON app_state;
-- DROP POLICY IF EXISTS "app_state_insert_simple" ON app_state;
-- DROP POLICY IF EXISTS "app_state_update_simple" ON app_state;
-- DROP POLICY IF EXISTS "app_state_delete_simple" ON app_state;
-- DROP POLICY IF EXISTS "companies_select_simple" ON companies;
-- DROP POLICY IF EXISTS "companies_insert_simple" ON companies;
-- DROP POLICY IF EXISTS "companies_update_simple" ON companies;
-- DROP POLICY IF EXISTS "companies_delete_simple" ON companies;

-- Option C: Si extension Supabase cause problème, investiguer pgsodium/vault

-- =============================================
-- RÉACTIVER RLS (APRÈS avoir résolu le problème)
-- =============================================
/*
-- ⚠️ NE PAS EXÉCUTER AVANT D'AVOIR RÉSOLU LA CAUSE

ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Puis recréer policies simples (si supprimées):

-- companies policies
CREATE POLICY "companies_select_simple" ON companies FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "companies_insert_simple" ON companies FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "companies_update_simple" ON companies FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "companies_delete_simple" ON companies FOR DELETE USING (owner_id = auth.uid());

-- app_state policies
CREATE POLICY "app_state_select_simple" ON app_state FOR SELECT USING (id = auth.uid());
CREATE POLICY "app_state_insert_simple" ON app_state FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "app_state_update_simple" ON app_state FOR UPDATE USING (id = auth.uid());
CREATE POLICY "app_state_delete_simple" ON app_state FOR DELETE USING (id = auth.uid());
*/

-- =============================================
-- ALTERNATIVE: Mode développement SANS RLS
-- =============================================
-- Pour développer sans RLS activé (NON recommandé production):

-- 1. Garder RLS désactivé sur app_state et companies
-- 2. Implémenter isolation côté application (vérifier company_id dans code)
-- 3. Activer RLS uniquement sur tables sensibles (auth.users déjà protégé par Supabase)

-- =============================================
-- CHECKLIST APRÈS FIX
-- =============================================
/*
- [ ] Création compte fonctionne sans RLS
- [ ] Diagnostic exécuté (triggers, fonctions)
- [ ] Cause récursion identifiée
- [ ] Fix appliqué (désactiver trigger/policy problématique)
- [ ] RLS réactivé avec policies simples
- [ ] Tests multi-tenant isolation
- [ ] Prêt pour production
*/

-- =============================================
-- NOTES IMPORTANTES
-- =============================================
/*
1. SÉCURITÉ:
   - Sans RLS, AUCUNE isolation multi-tenant côté DB
   - Isolation doit être faite côté application (vérifier company_id)
   - OK pour développement, DANGER en production

2. CAUSES PROBABLES RÉCURSION:
   - Trigger update_updated_at_column sur companies
   - Extension Supabase (pgsodium, vault)
   - Policies complexes non supprimées
   - Foreign keys avec ON UPDATE CASCADE
   - Fonction trigger interrogeant app_state

3. PROCHAINES ÉTAPES:
   - Exécuter ÉTAPE 1 (désactiver RLS)
   - Tester création compte (ÉTAPE 2)
   - Analyser résultats diagnostic
   - Identifier et désactiver source récursion
   - Réactiver RLS avec fix appliqué
*/

-- =============================================
-- FIN DU SCRIPT
-- =============================================
-- Status: RLS désactivé temporairement
-- Risque: Aucune isolation DB (isolation app requise)
-- Objectif: Débloquer développement + investiguer
-- Action requise: Résoudre cause récursion + réactiver RLS
-- =============================================
