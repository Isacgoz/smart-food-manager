-- Migration 002: Table app_state pour synchronisation état application
-- Cette table stocke tout l'état de l'app (products, users, orders, etc.) en JSONB

CREATE TABLE app_state (
  id UUID PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide par company_id
CREATE INDEX idx_app_state_id ON app_state(id);

-- Row Level Security (RLS) - Isolation multi-tenant
ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;

-- Policy: Chaque company ne voit que ses données
CREATE POLICY "Companies can only access their own app_state"
  ON app_state
  FOR ALL
  USING (id = current_setting('app.current_company_id')::uuid);

-- Fonction trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_app_state_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER app_state_updated_at
  BEFORE UPDATE ON app_state
  FOR EACH ROW
  EXECUTE FUNCTION update_app_state_timestamp();

-- Commentaires
COMMENT ON TABLE app_state IS 'État complet application par restaurant (offline-first sync)';
COMMENT ON COLUMN app_state.id IS 'company_id (FK vers companies)';
COMMENT ON COLUMN app_state.data IS 'État JSON: {users, products, ingredients, orders, etc.}';
COMMENT ON COLUMN app_state.updated_at IS 'Timestamp dernière modification pour sync conflits';
