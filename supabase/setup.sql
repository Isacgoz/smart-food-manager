-- Smart Food Manager - Setup Complet Supabase
-- Date: 2025-12-25
-- Phase 1: Sécurité et Multi-tenant

-- ============================================
-- 1. EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 2. TABLE APP_STATE (État application)
-- ============================================

CREATE TABLE IF NOT EXISTS app_state (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_app_state_id ON app_state(id);
CREATE INDEX IF NOT EXISTS idx_app_state_updated ON app_state(updated_at DESC);

-- Index JSONB pour recherches rapides
CREATE INDEX IF NOT EXISTS idx_app_state_users ON app_state USING GIN ((data->'users'));
CREATE INDEX IF NOT EXISTS idx_app_state_orders ON app_state USING GIN ((data->'orders'));

-- Trigger auto-update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_app_state_updated_at
  BEFORE UPDATE ON app_state
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;

-- Policy: Lecture (SELECT)
-- Un restaurant peut lire UNIQUEMENT ses propres données
CREATE POLICY "Restaurant can read own data"
  ON app_state
  FOR SELECT
  USING (true); -- Temporaire: autoriser lecture (à affiner avec auth)

-- Policy: Écriture (INSERT)
CREATE POLICY "Restaurant can insert own data"
  ON app_state
  FOR INSERT
  WITH CHECK (true); -- Temporaire: autoriser insertion

-- Policy: Mise à jour (UPDATE)
CREATE POLICY "Restaurant can update own data"
  ON app_state
  FOR UPDATE
  USING (true)
  WITH CHECK (true); -- Temporaire: autoriser MAJ

-- Policy: Suppression (DELETE)
CREATE POLICY "Restaurant can delete own data"
  ON app_state
  FOR DELETE
  USING (true); -- Temporaire: autoriser suppression

-- NOTE: Les policies ci-dessus sont permissives pour MVP.
-- En production, ajouter vérification company_id via JWT claims.

-- ============================================
-- 4. FONCTION AUTH: Vérification PIN
-- ============================================

CREATE OR REPLACE FUNCTION verify_staff_pin(
  p_restaurant_id TEXT,
  p_user_id TEXT,
  p_pin_hash TEXT
) RETURNS JSON AS $$
DECLARE
  v_state JSONB;
  v_users JSONB;
  v_user_data JSONB;
BEGIN
  -- Récupérer état restaurant
  SELECT data INTO v_state
  FROM app_state
  WHERE id = p_restaurant_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Restaurant non trouvé'
    );
  END IF;

  -- Extraire utilisateurs
  v_users := v_state->'users';

  -- Chercher utilisateur
  SELECT * INTO v_user_data
  FROM jsonb_array_elements(v_users) elem
  WHERE elem->>'id' = p_user_id
  LIMIT 1;

  IF v_user_data IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Utilisateur non trouvé'
    );
  END IF;

  -- Vérifier hash PIN
  IF v_user_data->>'pinHash' = p_pin_hash THEN
    RETURN json_build_object(
      'success', true,
      'user', json_build_object(
        'id', v_user_data->>'id',
        'name', v_user_data->>'name',
        'role', v_user_data->>'role',
        'pinHash', v_user_data->>'pinHash'
      )
    );
  END IF;

  -- PIN incorrect
  RETURN json_build_object(
    'success', false,
    'error', 'PIN incorrect'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissions fonction
GRANT EXECUTE ON FUNCTION verify_staff_pin(TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION verify_staff_pin(TEXT, TEXT, TEXT) TO authenticated;

-- ============================================
-- 5. FONCTION: Audit Log (traçabilité)
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id TEXT NOT NULL,
  user_id TEXT,
  action TEXT NOT NULL, -- CREATE, UPDATE, DELETE, LOGIN, LOGOUT
  entity_type TEXT, -- ORDER, PRODUCT, INGREDIENT, USER
  entity_id TEXT,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherches
CREATE INDEX IF NOT EXISTS idx_audit_restaurant ON audit_logs(restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action, created_at DESC);

-- RLS pour audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurant can read own audit logs"
  ON audit_logs
  FOR SELECT
  USING (true); -- Temporaire

CREATE POLICY "System can insert audit logs"
  ON audit_logs
  FOR INSERT
  WITH CHECK (true);

-- Fonction helper pour créer log
CREATE OR REPLACE FUNCTION log_audit(
  p_restaurant_id TEXT,
  p_user_id TEXT,
  p_action TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id TEXT DEFAULT NULL,
  p_changes JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO audit_logs (
    restaurant_id,
    user_id,
    action,
    entity_type,
    entity_id,
    changes
  ) VALUES (
    p_restaurant_id,
    p_user_id,
    p_action,
    p_entity_type,
    p_entity_id,
    p_changes
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION log_audit(TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION log_audit(TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) TO authenticated;

-- ============================================
-- 6. VALIDATION: Stock négatif
-- ============================================

CREATE OR REPLACE FUNCTION validate_stock_update()
RETURNS TRIGGER AS $$
DECLARE
  v_ingredients JSONB;
  v_ingredient JSONB;
BEGIN
  -- Extraire ingrédients de data
  v_ingredients := NEW.data->'ingredients';

  -- Vérifier chaque ingrédient
  FOR v_ingredient IN SELECT * FROM jsonb_array_elements(v_ingredients)
  LOOP
    IF (v_ingredient->>'stock')::numeric < 0 THEN
      RAISE EXCEPTION 'Stock négatif détecté pour ingrédient %', v_ingredient->>'name'
        USING HINT = 'Stock ne peut pas être négatif';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger validation stock
CREATE TRIGGER validate_stock_before_update
  BEFORE INSERT OR UPDATE ON app_state
  FOR EACH ROW
  EXECUTE FUNCTION validate_stock_update();

-- ============================================
-- 7. COMMENTAIRES
-- ============================================

COMMENT ON TABLE app_state IS 'État JSONB de chaque restaurant (multi-tenant)';
COMMENT ON TABLE audit_logs IS 'Logs audit pour traçabilité et conformité';
COMMENT ON FUNCTION verify_staff_pin IS 'Vérifie PIN hashé serveur-side';
COMMENT ON FUNCTION log_audit IS 'Créer entrée audit log';
COMMENT ON FUNCTION validate_stock_update IS 'Empêche stock négatif via trigger';

-- ============================================
-- FIN SETUP
-- ============================================

-- Vérification finale
DO $$
BEGIN
  RAISE NOTICE 'Setup Supabase terminé avec succès';
  RAISE NOTICE 'Tables créées: app_state, audit_logs';
  RAISE NOTICE 'RLS activé sur toutes les tables';
  RAISE NOTICE 'Fonctions créées: verify_staff_pin, log_audit, validate_stock_update';
END $$;
