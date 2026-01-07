-- Script Simple: Récupérer Company ID

-- 1. Voir l'ID du restaurant
SELECT
  'RESTAURANT ID' as info,
  id as company_id,
  name,
  siren,
  siret,
  address,
  city,
  email
FROM companies
WHERE siren = '123456789';

-- 2. Voir tous les users de ce restaurant
SELECT
  u.name,
  u.email,
  u.pin,
  u.role,
  u.company_id
FROM users u
JOIN companies c ON u.company_id = c.id
WHERE c.siren = '123456789'
ORDER BY
  CASE u.role
    WHEN 'OWNER' THEN 1
    WHEN 'MANAGER' THEN 2
    WHEN 'SERVER' THEN 3
    WHEN 'COOK' THEN 4
  END,
  u.name;

-- 3. Compter les données de ce restaurant
SELECT
  c.name as restaurant,
  c.id as company_id,
  (SELECT COUNT(*) FROM users WHERE company_id = c.id) as nb_users,
  (SELECT COUNT(*) FROM ingredients WHERE company_id = c.id) as nb_ingredients,
  (SELECT COUNT(*) FROM products WHERE company_id = c.id) as nb_products
FROM companies c
WHERE c.siren = '123456789';
