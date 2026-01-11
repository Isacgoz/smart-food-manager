-- Script SQL pour créer compte production dans Supabase Auth
-- Email: testprod@demo.com
-- Mot de passe: TestProd2026!
-- À exécuter dans: Supabase Dashboard → SQL Editor

-- IMPORTANT: Ce script crée un compte SANS confirmation email immédiate
-- L'utilisateur devra confirmer son email via le lien envoyé par Supabase

-- 1. Créer l'utilisateur dans auth.users (avec email NON confirmé)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  confirmation_sent_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  recovery_token,
  email_change,
  email_change_token_new
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'testprod@demo.com',
  crypt('TestProd2026!', gen_salt('bf')),
  NULL, -- Email PAS confirmé (NULL = nécessite confirmation)
  encode(gen_random_bytes(32), 'hex'), -- Token de confirmation
  NOW(), -- Email de confirmation envoyé maintenant
  '{"provider":"email","providers":["email"]}',
  '{"restaurant_name":"Restaurant Demo Production","plan":"BUSINESS"}',
  NOW(),
  NOW(),
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING
RETURNING id, email, confirmation_token;

-- Note: Copiez l'UUID et le confirmation_token retournés

-- 2. Créer company d'abord (REQUIS pour RLS policies)
-- REMPLACEZ 'USER_ID_ICI' par l'UUID retourné ci-dessus
INSERT INTO companies (id, name, owner_id, plan, is_active)
VALUES (
  'USER_ID_ICI', -- REMPLACER par l'UUID de l'étape 1
  'Restaurant Demo Production',
  'USER_ID_ICI', -- owner_id = user_id
  'BUSINESS',
  true
) ON CONFLICT (id) DO NOTHING;

-- 3. Créer l'état initial du restaurant dans app_state
-- REMPLACEZ 'USER_ID_ICI' par l'UUID retourné en étape 1
INSERT INTO app_state (id, company_id, data, updated_at)
VALUES (
  'USER_ID_ICI', -- REMPLACER par l'UUID de l'étape 1
  'USER_ID_ICI', -- company_id = même UUID (1 user = 1 company)
  '{
    "restaurant": {
      "id": "USER_ID_ICI",
      "name": "Restaurant Demo Production",
      "ownerEmail": "testprod@demo.com",
      "plan": "BUSINESS",
      "createdAt": "2026-01-10T14:00:00.000Z",
      "stockPolicy": "WARN"
    },
    "users": [
      {
        "id": "1",
        "name": "Admin Production",
        "pin": "1234",
        "pinHash": "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4",
        "role": "OWNER",
        "email": "testprod@demo.com"
      }
    ],
    "ingredients": [
      {"id": "ing-1", "name": "Pain burger", "category": "Pains", "unit": "piece", "stock": 100, "minStock": 20, "avgPrice": 0.35},
      {"id": "ing-2", "name": "Pain panini", "category": "Pains", "unit": "piece", "stock": 80, "minStock": 15, "avgPrice": 0.40},
      {"id": "ing-3", "name": "Steak haché", "category": "Viandes", "unit": "kg", "stock": 15, "minStock": 5, "avgPrice": 12.50},
      {"id": "ing-4", "name": "Poulet pané", "category": "Viandes", "unit": "kg", "stock": 10, "minStock": 3, "avgPrice": 8.90},
      {"id": "ing-5", "name": "Cheddar", "category": "Fromages", "unit": "kg", "stock": 5, "minStock": 2, "avgPrice": 15.80},
      {"id": "ing-6", "name": "Mozzarella", "category": "Fromages", "unit": "kg", "stock": 4, "minStock": 2, "avgPrice": 14.50},
      {"id": "ing-7", "name": "Tomate", "category": "Légumes", "unit": "kg", "stock": 8, "minStock": 3, "avgPrice": 3.50},
      {"id": "ing-8", "name": "Salade", "category": "Légumes", "unit": "kg", "stock": 5, "minStock": 2, "avgPrice": 2.80},
      {"id": "ing-9", "name": "Oignon", "category": "Légumes", "unit": "kg", "stock": 6, "minStock": 2, "avgPrice": 2.20},
      {"id": "ing-10", "name": "Sauce poivre", "category": "Sauces", "unit": "L", "stock": 3, "minStock": 1, "avgPrice": 12.00}
    ],
    "products": [
      {
        "id": "prod-1",
        "name": "Burger Toasty",
        "category": "Burgers",
        "price": 12.00,
        "tva": 10,
        "description": "Steak grillé, cheddar, sauce poivre",
        "recipe": [
          {"ingredientId": "ing-1", "quantity": 1},
          {"ingredientId": "ing-3", "quantity": 0.150},
          {"ingredientId": "ing-5", "quantity": 0.030},
          {"ingredientId": "ing-7", "quantity": 0.050},
          {"ingredientId": "ing-10", "quantity": 0.020}
        ],
        "available": true
      },
      {
        "id": "prod-2",
        "name": "Panini Italien",
        "category": "Paninis",
        "price": 8.50,
        "tva": 10,
        "description": "Tomate, mozzarella, pesto",
        "recipe": [
          {"ingredientId": "ing-2", "quantity": 1},
          {"ingredientId": "ing-7", "quantity": 0.080},
          {"ingredientId": "ing-6", "quantity": 0.060}
        ],
        "available": true
      }
    ],
    "tables": [
      {"id": "table-1", "name": "Table 1", "capacity": 4, "location": "Salle", "status": "FREE"},
      {"id": "table-2", "name": "Table 2", "capacity": 4, "location": "Salle", "status": "FREE"},
      {"id": "table-3", "name": "Terrasse 1", "capacity": 6, "location": "Terrasse", "status": "FREE"}
    ],
    "partners": [],
    "orders": [],
    "supplierOrders": [],
    "movements": [],
    "cashDeclarations": [],
    "expenses": [],
    "_lastUpdatedAt": 1736518800000
  }'::jsonb,
  NOW()
) ON CONFLICT (id) DO UPDATE
SET data = EXCLUDED.data, updated_at = NOW();

-- 3. Vérifier que l'utilisateur a été créé (email NON confirmé)
SELECT
  id,
  email,
  email_confirmed_at,
  confirmation_sent_at,
  CASE
    WHEN email_confirmed_at IS NULL THEN 'Email NON confirmé - Attente confirmation'
    ELSE 'Email confirmé'
  END as status
FROM auth.users
WHERE email = 'testprod@demo.com';

-- 4. Pour confirmer l'email manuellement (UNIQUEMENT POUR TESTS)
-- Décommenter et exécuter APRÈS avoir créé le compte:
/*
UPDATE auth.users
SET
  email_confirmed_at = NOW(),
  confirmation_token = ''
WHERE email = 'testprod@demo.com';
*/
