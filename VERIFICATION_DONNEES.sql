-- ============================================
-- VÉRIFICATION COMPLÈTE DES DONNÉES
-- ============================================

-- 1. COMPANIES (Restaurants)
SELECT
  'COMPANIES' as table_name,
  id,
  name,
  legal_name,
  siren,
  siret,
  vat_number,
  address,
  city,
  email,
  phone,
  plan,
  status,
  created_at
FROM companies;

-- 2. USERS (Utilisateurs)
SELECT
  'USERS' as table_name,
  id,
  company_id,
  name,
  email,
  pin,
  password_hash,
  role,
  status,
  created_at
FROM users
ORDER BY role, name;

-- 3. INGREDIENTS (Ingrédients)
SELECT
  'INGREDIENTS' as table_name,
  id,
  company_id,
  name,
  category,
  unit,
  stock,
  min_stock,
  average_cost,
  created_at
FROM ingredients
ORDER BY category, name;

-- Compter ingrédients par catégorie
SELECT
  category,
  COUNT(*) as nb_ingredients,
  SUM(stock * average_cost) as valeur_stock_total
FROM ingredients
GROUP BY category
ORDER BY category;

-- 4. PRODUCTS (Produits)
SELECT
  'PRODUCTS' as table_name,
  id,
  company_id,
  name,
  category,
  price,
  vat_rate,
  image_url,
  recipe,
  created_at
FROM products
ORDER BY category, name;

-- Compter produits par catégorie
SELECT
  category,
  COUNT(*) as nb_products,
  AVG(price) as prix_moyen,
  MIN(price) as prix_min,
  MAX(price) as prix_max
FROM products
GROUP BY category
ORDER BY category;

-- 5. APP_STATE (Si existe)
SELECT
  'APP_STATE' as table_name,
  id,
  jsonb_array_length(data->'users') as nb_users,
  jsonb_array_length(data->'ingredients') as nb_ingredients,
  jsonb_array_length(data->'products') as nb_products,
  jsonb_array_length(data->'orders') as nb_orders,
  updated_at
FROM app_state;

-- 6. RÉCAPITULATIF COMPLET
SELECT
  'RÉCAPITULATIF' as info,
  (SELECT COUNT(*) FROM companies) as nb_companies,
  (SELECT COUNT(*) FROM users) as nb_users,
  (SELECT COUNT(*) FROM ingredients) as nb_ingredients,
  (SELECT COUNT(*) FROM products) as nb_products;

-- ============================================
-- IDENTIFIANTS DE CONNEXION
-- ============================================

-- Email/Password pour login web admin
SELECT
  '=== LOGIN WEB ADMIN ===' as type,
  u.email as identifiant,
  u.password_hash as password_hash_bcrypt,
  'testprod@demo.com / Test1234!' as "⚠️ CREDENTIALS ACTUELS",
  u.role,
  c.name as restaurant
FROM users u
JOIN companies c ON u.company_id = c.id
WHERE u.role = 'OWNER'
LIMIT 1;

-- PINs pour login mobile serveurs
SELECT
  '=== LOGIN MOBILE SERVEURS ===' as type,
  u.name as nom_serveur,
  u.pin as code_pin,
  u.role,
  c.name as restaurant
FROM users u
JOIN companies c ON u.company_id = c.id
WHERE u.role = 'SERVER'
ORDER BY u.name;

-- ============================================
-- VÉRIFICATIONS INTÉGRITÉ
-- ============================================

-- Vérifier si company_id cohérent
SELECT
  'VÉRIFICATION INTÉGRITÉ' as check_type,
  (SELECT COUNT(DISTINCT company_id) FROM users) as company_ids_users,
  (SELECT COUNT(DISTINCT company_id) FROM ingredients) as company_ids_ingredients,
  (SELECT COUNT(DISTINCT company_id) FROM products) as company_ids_products,
  CASE
    WHEN (SELECT COUNT(DISTINCT company_id) FROM users) = 1
     AND (SELECT COUNT(DISTINCT company_id) FROM ingredients) = 1
     AND (SELECT COUNT(DISTINCT company_id) FROM products) = 1
    THEN '✅ OK - Un seul restaurant'
    ELSE '⚠️ ATTENTION - Plusieurs restaurants détectés'
  END as statut;

-- Vérifier produits sans recette
SELECT
  'PRODUITS SANS RECETTE' as warning,
  name,
  price,
  recipe
FROM products
WHERE recipe = '[]'::jsonb OR recipe IS NULL;

-- Vérifier ingrédients avec stock faible
SELECT
  'INGRÉDIENTS STOCK FAIBLE' as warning,
  name,
  stock,
  min_stock,
  unit
FROM ingredients
WHERE stock < min_stock;
