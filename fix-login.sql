-- Script SQL pour créer un compte test dans Supabase Auth
-- À exécuter dans: Supabase Dashboard → SQL Editor

-- 1. Créer l'utilisateur dans auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test@smartfood.com',
  crypt('test1234', gen_salt('bf')), -- Mot de passe hashé
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"restaurant_name":"Restaurant Test - La Bonne Bouffe","plan":"BUSINESS"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING
RETURNING id;

-- Note: Copiez l'ID généré (UUID) pour l'étape suivante

-- 2. Créer l'état initial du restaurant dans app_state
-- REMPLACEZ 'USER_ID_ICI' par l'UUID retourné ci-dessus
INSERT INTO app_state (id, company_id, data, updated_at)
VALUES (
  'USER_ID_ICI', -- REMPLACER par l'UUID de l'étape 1
  '11111111-1111-1111-1111-111111111111', -- company_id (Restaurant La Bonne Bouffe)
  '{
    "restaurant": {
      "id": "USER_ID_ICI",
      "name": "Restaurant Test - La Bonne Bouffe",
      "ownerEmail": "test@smartfood.com",
      "plan": "BUSINESS",
      "createdAt": "2026-01-10T12:00:00.000Z",
      "stockPolicy": "WARN"
    },
    "users": [
      {
        "id": "1",
        "name": "Admin Test",
        "pin": "1234",
        "pinHash": "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4",
        "role": "OWNER",
        "email": "test@smartfood.com"
      }
    ],
    "ingredients": [
      {"id": "ing-1", "name": "Pain burger", "category": "Pains", "unit": "piece", "stock": 100, "minStock": 20, "avgPrice": 0.35},
      {"id": "ing-2", "name": "Steak haché", "category": "Viandes", "unit": "kg", "stock": 15, "minStock": 5, "avgPrice": 12.50}
    ],
    "products": [
      {
        "id": "prod-1",
        "name": "Burger Toasty",
        "category": "Burgers",
        "price": 12.00,
        "tva": 10,
        "recipe": [
          {"ingredientId": "ing-1", "quantity": 1},
          {"ingredientId": "ing-2", "quantity": 0.150}
        ],
        "available": true
      }
    ],
    "tables": [
      {"id": "table-1", "name": "Table 1", "capacity": 4, "location": "Salle", "status": "FREE"}
    ],
    "partners": [],
    "orders": [],
    "supplierOrders": [],
    "movements": [],
    "cashDeclarations": [],
    "expenses": [],
    "_lastUpdatedAt": 1736511600000
  }'::jsonb,
  NOW()
) ON CONFLICT (id) DO UPDATE
SET data = EXCLUDED.data, updated_at = NOW();

-- Vérifier que l'utilisateur a été créé
SELECT id, email, email_confirmed_at FROM auth.users WHERE email = 'test@smartfood.com';
