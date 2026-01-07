-- Migration 003: Importer données des tables vers app_state
-- À exécuter APRÈS migration 002

-- Récupérer l'ID de ta company
DO $$
DECLARE
  company_uuid UUID;
  app_data JSONB;
BEGIN
  -- Trouver ton restaurant
  SELECT id INTO company_uuid FROM companies WHERE siren = '123456789' LIMIT 1;

  IF company_uuid IS NULL THEN
    RAISE EXCEPTION 'Company not found with SIREN 123456789';
  END IF;

  -- Construire le JSON avec toutes tes données
  SELECT jsonb_build_object(
    'users', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', id::text,
          'name', name,
          'email', email,
          'pin', pin,
          'pinHash', COALESCE(password_hash, ''),
          'role', role,
          'status', status
        )
      )
      FROM users WHERE company_id = company_uuid
    ),
    'ingredients', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', id::text,
          'name', name,
          'category', COALESCE(category, ''),
          'unit', unit,
          'stock', stock,
          'minStock', COALESCE(min_stock, 0),
          'averageCost', COALESCE(average_cost, 0),
          'supplier', ''
        )
      )
      FROM ingredients WHERE company_id = company_uuid
    ),
    'products', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', id::text,
          'name', name,
          'category', COALESCE(category, 'Autres'),
          'price', price,
          'vat', COALESCE(vat_rate, 10.00),
          'image', COALESCE(image_url, ''),
          'recipe', COALESCE(recipe, '[]'::jsonb)
        )
      )
      FROM products WHERE company_id = company_uuid
    ),
    'orders', '[]'::jsonb,
    'tables', '[]'::jsonb,
    'partners', '[]'::jsonb,
    'supplierOrders', '[]'::jsonb,
    'movements', '[]'::jsonb,
    'expenses', '[]'::jsonb,
    'cashDeclarations', '[]'::jsonb,
    '_lastUpdatedAt', EXTRACT(EPOCH FROM NOW()) * 1000
  ) INTO app_data;

  -- Insérer dans app_state
  INSERT INTO app_state (id, data, updated_at)
  VALUES (company_uuid, app_data, NOW())
  ON CONFLICT (id)
  DO UPDATE SET
    data = EXCLUDED.data,
    updated_at = EXCLUDED.updated_at;

  RAISE NOTICE 'Import réussi pour company_id: %', company_uuid;
  RAISE NOTICE 'Users importés: %', jsonb_array_length(app_data->'users');
  RAISE NOTICE 'Ingredients importés: %', jsonb_array_length(app_data->'ingredients');
  RAISE NOTICE 'Products importés: %', jsonb_array_length(app_data->'products');
END $$;

-- Vérifier résultat
SELECT
  id,
  jsonb_array_length(data->'users') as nb_users,
  jsonb_array_length(data->'ingredients') as nb_ingredients,
  jsonb_array_length(data->'products') as nb_products,
  updated_at
FROM app_state;
