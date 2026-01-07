-- FIX: Créer utilisateur testprod@demo.com dans Supabase
-- Password: Test1234!

-- 1. Vérifier si l'utilisateur existe déjà
SELECT
  'VERIFICATION USER' as check_type,
  email,
  name,
  role,
  company_id
FROM users
WHERE email = 'testprod@demo.com';

-- 2. Si n'existe pas, créer l'utilisateur
-- Hash bcrypt pour "Test1234!" (généré avec bcrypt rounds=10)
-- Hash: $2b$10$N9qo8uLOickgx2ZMRZoMye1wXhSbhOZ09Nkg7J8Y/Dh6HlKFhXR8u

INSERT INTO users (
  id,
  company_id,
  email,
  password_hash,
  pin,
  name,
  role,
  status,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111', -- company_id du restaurant
  'testprod@demo.com',
  '$2b$10$N9qo8uLOickgx2ZMRZoMye1wXhSbhOZ09Nkg7J8Y/Dh6HlKFhXR8u', -- Hash de "Test1234!"
  NULL, -- Pas de PIN pour admin
  'Admin Test Prod',
  'OWNER',
  'active',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  company_id = '11111111-1111-1111-1111-111111111111',
  password_hash = '$2b$10$N9qo8uLOickgx2ZMRZoMye1wXhSbhOZ09Nkg7J8Y/Dh6HlKFhXR8u',
  role = 'OWNER',
  status = 'active';

-- 3. Vérifier création
SELECT
  'USER CREE' as status,
  email,
  name,
  role,
  company_id,
  CASE
    WHEN company_id = '11111111-1111-1111-1111-111111111111'
    THEN '✅ Bon company_id'
    ELSE '❌ Mauvais company_id'
  END as company_id_check,
  created_at
FROM users
WHERE email = 'testprod@demo.com';

-- 4. Vérifier que app_state existe pour ce company_id
SELECT
  'VERIFICATION APP_STATE' as check_type,
  id as company_id,
  jsonb_array_length(data->'products') as nb_products,
  jsonb_array_length(data->'ingredients') as nb_ingredients,
  jsonb_array_length(data->'users') as nb_users_dans_json,
  updated_at
FROM app_state
WHERE id = '11111111-1111-1111-1111-111111111111';
