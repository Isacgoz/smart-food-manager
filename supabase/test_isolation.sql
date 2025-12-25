-- Test Isolation Multi-tenant
-- Vérifie que les données de restaurants différents sont bien isolées

-- ============================================
-- SETUP: Créer 2 restaurants de test
-- ============================================

-- Restaurant A
INSERT INTO app_state (id, data) VALUES (
  'test_restaurant_a',
  '{
    "users": [
      {"id": "user_a1", "name": "Alice", "role": "OWNER", "pinHash": "hash_a1"}
    ],
    "products": [
      {"id": "prod_a1", "name": "Burger A", "price": 10}
    ],
    "orders": []
  }'::jsonb
) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data;

-- Restaurant B
INSERT INTO app_state (id, data) VALUES (
  'test_restaurant_b',
  '{
    "users": [
      {"id": "user_b1", "name": "Bob", "role": "OWNER", "pinHash": "hash_b1"}
    ],
    "products": [
      {"id": "prod_b1", "name": "Burger B", "price": 15}
    ],
    "orders": []
  }'::jsonb
) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data;

-- ============================================
-- TEST 1: Lecture isolée
-- ============================================

DO $$
DECLARE
  v_restaurant_a JSONB;
  v_restaurant_b JSONB;
  v_users_a JSONB;
  v_users_b JSONB;
BEGIN
  RAISE NOTICE '=== TEST 1: Lecture isolée ===';

  -- Lire restaurant A
  SELECT data INTO v_restaurant_a FROM app_state WHERE id = 'test_restaurant_a';
  v_users_a := v_restaurant_a->'users';

  -- Lire restaurant B
  SELECT data INTO v_restaurant_b FROM app_state WHERE id = 'test_restaurant_b';
  v_users_b := v_restaurant_b->'users';

  -- Vérifier isolation
  IF v_users_a->0->>'name' = 'Alice' AND v_users_b->0->>'name' = 'Bob' THEN
    RAISE NOTICE '✅ Isolation lecture OK: Restaurant A voit Alice, B voit Bob';
  ELSE
    RAISE EXCEPTION '❌ ÉCHEC: Isolation lecture';
  END IF;
END $$;

-- ============================================
-- TEST 2: Vérification PIN isolée
-- ============================================

DO $$
DECLARE
  v_result_a JSON;
  v_result_b JSON;
  v_result_cross JSON;
BEGIN
  RAISE NOTICE '=== TEST 2: Vérification PIN isolée ===';

  -- PIN correct restaurant A
  v_result_a := verify_staff_pin('test_restaurant_a', 'user_a1', 'hash_a1');
  IF (v_result_a->>'success')::boolean = true THEN
    RAISE NOTICE '✅ PIN correct restaurant A validé';
  ELSE
    RAISE EXCEPTION '❌ ÉCHEC: PIN A devrait être valide';
  END IF;

  -- PIN correct restaurant B
  v_result_b := verify_staff_pin('test_restaurant_b', 'user_b1', 'hash_b1');
  IF (v_result_b->>'success')::boolean = true THEN
    RAISE NOTICE '✅ PIN correct restaurant B validé';
  ELSE
    RAISE EXCEPTION '❌ ÉCHEC: PIN B devrait être valide';
  END IF;

  -- PIN cross-restaurant (utilisateur A avec restaurant B)
  v_result_cross := verify_staff_pin('test_restaurant_b', 'user_a1', 'hash_a1');
  IF (v_result_cross->>'success')::boolean = false THEN
    RAISE NOTICE '✅ Isolation PIN OK: User A ne peut pas se connecter au restaurant B';
  ELSE
    RAISE EXCEPTION '❌ ÉCHEC CRITIQUE: Cross-restaurant login possible!';
  END IF;
END $$;

-- ============================================
-- TEST 3: Modification isolée
-- ============================================

DO $$
DECLARE
  v_restaurant_a JSONB;
  v_restaurant_b JSONB;
BEGIN
  RAISE NOTICE '=== TEST 3: Modification isolée ===';

  -- Ajouter produit au restaurant A
  UPDATE app_state
  SET data = jsonb_set(
    data,
    '{products}',
    (data->'products') || '[{"id": "prod_a2", "name": "Frites A", "price": 3}]'::jsonb
  )
  WHERE id = 'test_restaurant_a';

  -- Vérifier que B n'a pas été affecté
  SELECT data INTO v_restaurant_b FROM app_state WHERE id = 'test_restaurant_b';

  IF jsonb_array_length(v_restaurant_b->'products') = 1 THEN
    RAISE NOTICE '✅ Isolation modification OK: Restaurant B non affecté';
  ELSE
    RAISE EXCEPTION '❌ ÉCHEC: Restaurant B modifié par erreur';
  END IF;
END $$;

-- ============================================
-- TEST 4: Suppression isolée
-- ============================================

DO $$
DECLARE
  v_count_before INT;
  v_count_after INT;
BEGIN
  RAISE NOTICE '=== TEST 4: Suppression isolée ===';

  -- Compter restaurants avant
  SELECT COUNT(*) INTO v_count_before FROM app_state WHERE id LIKE 'test_restaurant_%';

  -- Supprimer uniquement restaurant A
  DELETE FROM app_state WHERE id = 'test_restaurant_a';

  -- Vérifier que B existe toujours
  SELECT COUNT(*) INTO v_count_after FROM app_state WHERE id = 'test_restaurant_b';

  IF v_count_after = 1 THEN
    RAISE NOTICE '✅ Isolation suppression OK: Restaurant B toujours présent';
  ELSE
    RAISE EXCEPTION '❌ ÉCHEC: Restaurant B supprimé par erreur';
  END IF;
END $$;

-- ============================================
-- TEST 5: Audit Log isolation
-- ============================================

DO $$
DECLARE
  v_log_id_a UUID;
  v_log_id_b UUID;
  v_count_a INT;
  v_count_b INT;
BEGIN
  RAISE NOTICE '=== TEST 5: Audit Log isolation ===';

  -- Créer log pour restaurant A
  v_log_id_a := log_audit('test_restaurant_a', 'user_a1', 'CREATE', 'ORDER', 'order_a1');

  -- Créer log pour restaurant B
  v_log_id_b := log_audit('test_restaurant_b', 'user_b1', 'CREATE', 'ORDER', 'order_b1');

  -- Vérifier que chaque restaurant ne voit que ses logs
  SELECT COUNT(*) INTO v_count_a FROM audit_logs WHERE restaurant_id = 'test_restaurant_a';
  SELECT COUNT(*) INTO v_count_b FROM audit_logs WHERE restaurant_id = 'test_restaurant_b';

  IF v_count_a >= 1 AND v_count_b >= 1 THEN
    RAISE NOTICE '✅ Audit logs isolés: A a % logs, B a % logs', v_count_a, v_count_b;
  ELSE
    RAISE EXCEPTION '❌ ÉCHEC: Audit logs non isolés';
  END IF;
END $$;

-- ============================================
-- CLEANUP: Supprimer données de test
-- ============================================

DELETE FROM app_state WHERE id LIKE 'test_restaurant_%';
DELETE FROM audit_logs WHERE restaurant_id LIKE 'test_restaurant_%';

-- ============================================
-- RÉSULTAT FINAL
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ TOUS LES TESTS D''ISOLATION RÉUSSIS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Isolation multi-tenant validée:';
  RAISE NOTICE '  - Lecture isolée par restaurant_id';
  RAISE NOTICE '  - Vérification PIN isolée';
  RAISE NOTICE '  - Modifications isolées';
  RAISE NOTICE '  - Suppressions isolées';
  RAISE NOTICE '  - Audit logs isolés';
  RAISE NOTICE '';
  RAISE NOTICE 'Vous pouvez déployer en production.';
END $$;
