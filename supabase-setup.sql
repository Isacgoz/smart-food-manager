-- =============================================
-- Smart Food Manager - Supabase Setup Script
-- =============================================
-- Exécuter dans Supabase SQL Editor
-- https://app.supabase.com → SQL Editor → New Query

-- 1. Créer table app_state (stockage état application)
CREATE TABLE IF NOT EXISTS app_state (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Index pour performance
CREATE INDEX IF NOT EXISTS idx_app_state_updated_at ON app_state(updated_at);
CREATE INDEX IF NOT EXISTS idx_app_state_data ON app_state USING GIN (data);

-- 3. Fonction trigger auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger sur app_state
DROP TRIGGER IF EXISTS update_app_state_updated_at ON app_state;
CREATE TRIGGER update_app_state_updated_at
  BEFORE UPDATE ON app_state
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Enable Row Level Security
ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;

-- 6. Politique RLS (V1: Accès ouvert, V2: Filtrer par user_id)
-- IMPORTANT: En production, remplacer par authentification stricte
CREATE POLICY "Allow all access for development"
ON app_state
FOR ALL
USING (true)
WITH CHECK (true);

-- V2 Production (décommenter après Supabase Auth):
-- DROP POLICY "Allow all access for development" ON app_state;
-- CREATE POLICY "Users can only access their own restaurant data"
-- ON app_state
-- FOR ALL
-- USING (auth.uid()::text = (data->>'createdBy'))
-- WITH CHECK (auth.uid()::text = (data->>'createdBy'));

-- 7. Réplication temps réel (WebSocket)
ALTER PUBLICATION supabase_realtime ADD TABLE app_state;

-- 8. Fonction validation données (sécurité additionnelle)
CREATE OR REPLACE FUNCTION validate_app_state()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier que data contient les champs requis
  IF NEW.data IS NULL THEN
    RAISE EXCEPTION 'data cannot be null';
  END IF;

  IF NOT (NEW.data ? 'users' AND NEW.data ? 'products' AND NEW.data ? 'orders') THEN
    RAISE EXCEPTION 'data must contain users, products, and orders fields';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Trigger validation
DROP TRIGGER IF EXISTS validate_app_state_trigger ON app_state;
CREATE TRIGGER validate_app_state_trigger
  BEFORE INSERT OR UPDATE ON app_state
  FOR EACH ROW
  EXECUTE FUNCTION validate_app_state();

-- 10. Fonction cleanup vieux états (optionnel, pour performance)
CREATE OR REPLACE FUNCTION cleanup_old_states()
RETURNS void AS $$
BEGIN
  -- Archiver états > 90 jours (si nécessaire pour audit)
  -- DELETE FROM app_state WHERE updated_at < NOW() - INTERVAL '90 days';
  NULL; -- Pas de cleanup pour V1
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Vérification Installation
-- =============================================

-- Vérifier table créée
SELECT 'Table app_state created' AS status
WHERE EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'app_state'
);

-- Vérifier RLS activé
SELECT 'RLS enabled' AS status
WHERE (SELECT relrowsecurity FROM pg_class WHERE relname = 'app_state');

-- Lister policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'app_state';

-- =============================================
-- Données de test (optionnel)
-- =============================================

-- Insérer restaurant de démo
INSERT INTO app_state (id, data)
VALUES (
  'demo-restaurant-001',
  '{
    "users": [],
    "products": [],
    "tables": [],
    "orders": [],
    "ingredients": [],
    "movements": [],
    "expenses": [],
    "_lastUpdatedAt": 0
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Vérifier insertion
SELECT id, created_at, updated_at,
       jsonb_pretty(data) as data_preview
FROM app_state
WHERE id = 'demo-restaurant-001';

-- =============================================
-- Instructions Post-Installation
-- =============================================

/*
1. Copier SUPABASE_URL depuis Settings > API > Project URL
   Exemple: https://abcdefghij.supabase.co

2. Copier SUPABASE_ANON_KEY depuis Settings > API > Project API keys > anon public
   Exemple: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

3. Coller dans .env :
   VITE_SUPABASE_URL=https://votre-projet.supabase.co
   VITE_SUPABASE_ANON_KEY=votre-anon-key

4. Redémarrer serveur dev :
   npm run dev

5. Tester connexion dans console navigateur :
   localStorage devrait sync avec Supabase
*/
