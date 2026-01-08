-- =============================================
-- Migration 006: Test Companies for Development
-- =============================================
-- Description: Create 3 test companies for multi-tenant testing
-- Date: 2026-01-08
-- Author: Claude Code
--
-- IMPORTANT: Only run in DEVELOPMENT/STAGING environments!
-- DO NOT run in production unless for testing purposes.
-- =============================================

-- Step 1: Create test companies (only if they don't exist)
INSERT INTO companies (id, name, owner_id, plan, settings) VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'Restaurant Test Alpha',
    NULL,  -- No real owner for test data
    'PRO',
    '{"test": true, "demo_data": true}'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Food Truck Beta',
    NULL,
    'TEAM',
    '{"test": true, "demo_data": true}'::jsonb
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Snack Gamma',
    NULL,
    'SOLO',
    '{"test": true, "demo_data": true}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- Step 2: Create sample app_state for test companies
INSERT INTO app_state (id, company_id, data) VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    '{
      "restaurant": {
        "id": "11111111-1111-1111-1111-111111111111",
        "name": "Restaurant Test Alpha",
        "plan": "PRO"
      },
      "users": [
        {
          "id": "1",
          "name": "Admin Alpha",
          "pin": "1111",
          "role": "OWNER"
        }
      ],
      "products": [
        {
          "id": "burger-alpha",
          "name": "Burger Alpha Test",
          "price": 12.50,
          "category": "Burgers"
        }
      ],
      "ingredients": [
        {
          "id": "pain-alpha",
          "name": "Pain Test",
          "quantity": 50,
          "unit": "pièce",
          "averageCost": 0.35
        }
      ],
      "orders": [],
      "tables": [],
      "expenses": [],
      "_lastUpdatedAt": 0
    }'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    '{
      "restaurant": {
        "id": "22222222-2222-2222-2222-222222222222",
        "name": "Food Truck Beta",
        "plan": "TEAM"
      },
      "users": [
        {
          "id": "1",
          "name": "Chef Beta",
          "pin": "2222",
          "role": "OWNER"
        }
      ],
      "products": [
        {
          "id": "taco-beta",
          "name": "Taco Beta Special",
          "price": 8.90,
          "category": "Mexican"
        }
      ],
      "ingredients": [],
      "orders": [],
      "tables": [],
      "expenses": [],
      "_lastUpdatedAt": 0
    }'::jsonb
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333',
    '{
      "restaurant": {
        "id": "33333333-3333-3333-3333-333333333333",
        "name": "Snack Gamma",
        "plan": "SOLO"
      },
      "users": [
        {
          "id": "1",
          "name": "Proprio Gamma",
          "pin": "3333",
          "role": "OWNER"
        }
      ],
      "products": [],
      "ingredients": [],
      "orders": [],
      "tables": [],
      "expenses": [],
      "_lastUpdatedAt": 0
    }'::jsonb
  )
ON CONFLICT (id) DO UPDATE
SET data = EXCLUDED.data;

-- Step 3: Verification queries
SELECT
  c.id,
  c.name,
  c.plan,
  c.settings->>'test' as is_test,
  a.data->'restaurant'->>'name' as app_state_restaurant,
  jsonb_array_length(a.data->'products') as product_count
FROM companies c
LEFT JOIN app_state a ON a.company_id = c.id
WHERE c.settings->>'test' = 'true'
ORDER BY c.name;

-- =============================================
-- Test Companies Created
-- =============================================
-- Use these UUIDs for testing:
-- - Alpha: 11111111-1111-1111-1111-111111111111 (PRO)
-- - Beta:  22222222-2222-2222-2222-222222222222 (TEAM)
-- - Gamma: 33333333-3333-3333-3333-333333333333 (SOLO)
--
-- Test scenarios:
-- 1. RLS: Create real user, try to access Alpha data (should fail)
-- 2. Backup: Run cron, verify 3 backup files created
-- 3. Performance: Query with/without company_id index
-- =============================================
