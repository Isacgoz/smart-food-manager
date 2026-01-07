-- ============================================
-- AUDIT COMPLET FINAL - Smart Food Manager
-- Date: 5 janvier 2026
-- ============================================

-- SECTION 1: ÉTAT DES TABLES
-- ============================================

SELECT '========== SECTION 1: COMPANIES ==========' as section;

SELECT
  id,
  name,
  siren,
  siret,
  address,
  city,
  plan,
  status
FROM companies;

-- ============================================

SELECT '========== SECTION 2: USERS ==========' as section;

SELECT
  id,
  company_id,
  email,
  name,
  role,
  status,
  CASE
    WHEN password_hash IS NOT NULL THEN '✅ Password hash existe'
    ELSE '❌ Pas de password hash'
  END as password_status,
  pin
FROM users
ORDER BY role, email;

-- ============================================

SELECT '========== SECTION 3: APP_STATE ==========' as section;

SELECT
  id as company_id,
  jsonb_array_length(data->'users') as nb_users_json,
  jsonb_array_length(data->'ingredients') as nb_ingredients_json,
  jsonb_array_length(data->'products') as nb_products_json,
  jsonb_array_length(data->'orders') as nb_orders_json,
  updated_at,
  CASE
    WHEN data ? 'users' THEN '✅ Clé users existe'
    ELSE '❌ Clé users manquante'
  END as users_key_check,
  CASE
    WHEN data ? 'products' THEN '✅ Clé products existe'
    ELSE '❌ Clé products manquante'
  END as products_key_check,
  CASE
    WHEN data ? 'ingredients' THEN '✅ Clé ingredients existe'
    ELSE '❌ Clé ingredients manquante'
  END as ingredients_key_check
FROM app_state;

-- ============================================

SELECT '========== SECTION 4: PRODUCTS (Tables individuelles) ==========' as section;

SELECT
  COUNT(*) as total_products,
  COUNT(DISTINCT company_id) as nb_companies_distincts
FROM products;

SELECT
  company_id,
  COUNT(*) as nb_products
FROM products
GROUP BY company_id;

-- ============================================

SELECT '========== SECTION 5: INGREDIENTS (Tables individuelles) ==========' as section;

SELECT
  COUNT(*) as total_ingredients,
  COUNT(DISTINCT company_id) as nb_companies_distincts
FROM ingredients;

SELECT
  company_id,
  COUNT(*) as nb_ingredients
FROM ingredients
GROUP BY company_id;

-- ============================================

SELECT '========== SECTION 6: CORRESPONDANCE USER ↔ APP_STATE ==========' as section;

-- Vérifier chaque user et son app_state
SELECT
  u.email,
  u.company_id as user_company_id,
  u.role,
  CASE
    WHEN EXISTS (SELECT 1 FROM app_state WHERE id = u.company_id)
    THEN '✅ app_state existe pour ce user'
    ELSE '❌ PAS de app_state pour ce user'
  END as app_state_exists,
  (SELECT jsonb_array_length(data->'products') FROM app_state WHERE id = u.company_id) as nb_products_disponibles,
  (SELECT jsonb_array_length(data->'ingredients') FROM app_state WHERE id = u.company_id) as nb_ingredients_disponibles
FROM users u
ORDER BY u.email;

-- ============================================

SELECT '========== SECTION 7: CONTENU APP_STATE (Détail JSON) ==========' as section;

-- Voir les premiers users dans le JSON
SELECT
  'Users dans app_state' as type,
  jsonb_pretty(data->'users') as users_json
FROM app_state
LIMIT 1;

-- Voir les premiers products dans le JSON
SELECT
  'Products dans app_state' as type,
  jsonb_array_elements(data->'products')->>'name' as product_name,
  jsonb_array_elements(data->'products')->>'price' as price,
  jsonb_array_elements(data->'products')->>'category' as category
FROM app_state
LIMIT 10;

-- Voir les premiers ingredients dans le JSON
SELECT
  'Ingredients dans app_state' as type,
  jsonb_array_elements(data->'ingredients')->>'name' as ingredient_name,
  jsonb_array_elements(data->'ingredients')->>'stock' as stock,
  jsonb_array_elements(data->'ingredients')->>'unit' as unit
FROM app_state
LIMIT 10;

-- ============================================

SELECT '========== SECTION 8: VÉRIFICATION TESTPROD@DEMO.COM ==========' as section;

SELECT
  'Status testprod@demo.com' as check_type,
  CASE
    WHEN EXISTS (SELECT 1 FROM users WHERE email = 'testprod@demo.com')
    THEN '✅ User existe'
    ELSE '❌ User n existe pas'
  END as user_exists,
  (SELECT company_id FROM users WHERE email = 'testprod@demo.com') as company_id,
  (SELECT role FROM users WHERE email = 'testprod@demo.com') as role,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM app_state
      WHERE id = (SELECT company_id FROM users WHERE email = 'testprod@demo.com')
    )
    THEN '✅ app_state lié existe'
    ELSE '❌ app_state lié manquant'
  END as app_state_linked;

-- ============================================

SELECT '========== SECTION 9: ROW LEVEL SECURITY (RLS) ==========' as section;

-- Vérifier si RLS est activé
SELECT
  schemaname,
  tablename,
  CASE
    WHEN rowsecurity THEN '⚠️ RLS ACTIVÉ'
    ELSE '✅ RLS DÉSACTIVÉ'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('app_state', 'users', 'products', 'ingredients', 'companies')
ORDER BY tablename;

-- Voir les policies RLS
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('app_state', 'users', 'products', 'ingredients')
ORDER BY tablename, policyname;

-- ============================================

SELECT '========== SECTION 10: DIAGNOSTIC FINAL ==========' as section;

SELECT
  'DIAGNOSTIC' as check_type,
  (SELECT COUNT(*) FROM companies) as nb_companies,
  (SELECT COUNT(*) FROM users) as nb_users_total,
  (SELECT COUNT(*) FROM users WHERE email = 'testprod@demo.com') as testprod_exists,
  (SELECT COUNT(*) FROM app_state) as nb_app_state,
  (SELECT COUNT(*) FROM products) as nb_products_table,
  (SELECT COUNT(*) FROM ingredients) as nb_ingredients_table,
  (SELECT jsonb_array_length(data->'products') FROM app_state LIMIT 1) as nb_products_json,
  (SELECT jsonb_array_length(data->'ingredients') FROM app_state LIMIT 1) as nb_ingredients_json,
  CASE
    WHEN (SELECT COUNT(*) FROM users WHERE email = 'testprod@demo.com') > 0
     AND (SELECT COUNT(*) FROM app_state WHERE id = (SELECT company_id FROM users WHERE email = 'testprod@demo.com')) > 0
    THEN '✅ TOUT EST CONFIGURÉ CORRECTEMENT'
    ELSE '❌ PROBLÈME DE CONFIGURATION'
  END as status_global;

-- ============================================

SELECT '========== SECTION 11: RECOMMANDATIONS ==========' as section;

SELECT
  'RECOMMANDATIONS' as type,
  CASE
    WHEN (SELECT rowsecurity FROM pg_tables WHERE tablename = 'app_state' AND schemaname = 'public')
    THEN '⚠️ RLS activé sur app_state - Peut bloquer accès données'
    ELSE '✅ RLS désactivé - Accès normal'
  END as rls_recommendation,
  CASE
    WHEN (SELECT COUNT(*) FROM users WHERE email = 'testprod@demo.com' AND company_id IS NULL) > 0
    THEN '❌ testprod@demo.com a company_id NULL - À corriger!'
    WHEN (SELECT COUNT(*) FROM users WHERE email = 'testprod@demo.com') = 0
    THEN '❌ testprod@demo.com n existe pas - À créer!'
    ELSE '✅ testprod@demo.com correctement configuré'
  END as user_recommendation,
  CASE
    WHEN (SELECT COUNT(*) FROM app_state) = 0
    THEN '❌ Aucun app_state - Exécuter migration 003!'
    WHEN (SELECT jsonb_array_length(data->'products') FROM app_state LIMIT 1) = 0
    THEN '❌ app_state vide - Ré-exécuter migration 003!'
    ELSE '✅ app_state contient des données'
  END as app_state_recommendation;
