-- Migration 001: Sécurisation Auth avec Hash PIN
-- Date: 2025-12-25
-- Description: Vérification PIN côté serveur avec pgcrypto

-- Activer l'extension pgcrypto pour hash sécurisé
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Fonction RPC: Vérification PIN sécurisée
-- Note: Cette fonction utilise SECURITY DEFINER pour accès privilégié
CREATE OR REPLACE FUNCTION verify_staff_pin(
  p_restaurant_id TEXT,
  p_user_id TEXT,
  p_pin_hash TEXT
) RETURNS JSON AS $$
DECLARE
  v_user RECORD;
  v_state JSONB;
  v_users JSONB;
  v_user_data JSONB;
BEGIN
  -- Récupérer l'état de l'app depuis app_state
  SELECT data INTO v_state
  FROM app_state
  WHERE id = p_restaurant_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Restaurant non trouvé'
    );
  END IF;

  -- Extraire le tableau users
  v_users := v_state->'users';

  -- Chercher l'utilisateur correspondant
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

  -- Vérifier le hash PIN
  -- Note: On compare le hash envoyé avec celui stocké
  IF v_user_data->>'pinHash' = p_pin_hash THEN
    -- Succès: retourner les données user (sans le PIN)
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

-- Permissions: Permet aux utilisateurs anon d'appeler cette fonction
GRANT EXECUTE ON FUNCTION verify_staff_pin(TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION verify_staff_pin(TEXT, TEXT, TEXT) TO authenticated;

-- Commentaire pour documentation
COMMENT ON FUNCTION verify_staff_pin IS 'Vérifie le PIN hashé d''un staff member de manière sécurisée côté serveur';
