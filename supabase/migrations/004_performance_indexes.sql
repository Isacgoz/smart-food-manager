-- Migration 004: Performance Indexes & Optimizations
-- Objectif: Optimiser queries pour production (>100 commandes/jour)

-- 1. Index company_id pour multi-tenant (CRITIQUE)
CREATE INDEX IF NOT EXISTS idx_app_state_company_id 
ON app_state (company_id);

-- 2. Index version pour optimistic locking
CREATE INDEX IF NOT EXISTS idx_app_state_version 
ON app_state (version);

-- 3. Index updated_at pour sync
CREATE INDEX IF NOT EXISTS idx_app_state_updated_at 
ON app_state (updated_at);

-- 4. Index JSONB pour orders (queries fréquentes)
-- Note: GIN index sur JSONB permet recherche rapide dans arrays
CREATE INDEX IF NOT EXISTS idx_orders_jsonb 
ON app_state USING GIN ((data->'orders'));

-- 5. Index JSONB pour expenses
CREATE INDEX IF NOT EXISTS idx_expenses_jsonb 
ON app_state USING GIN ((data->'expenses'));

-- 6. Index JSONB pour products
CREATE INDEX IF NOT EXISTS idx_products_jsonb 
ON app_state USING GIN ((data->'products'));

-- 7. Index JSONB pour ingredients
CREATE INDEX IF NOT EXISTS idx_ingredients_jsonb 
ON app_state USING GIN ((data->'ingredients'));

-- 8. Table daily_stats pour pré-agrégation (NOUVEAU)
CREATE TABLE IF NOT EXISTS daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Ventes
  total_sales DECIMAL(10,2) NOT NULL DEFAULT 0,
  order_count INTEGER NOT NULL DEFAULT 0,
  average_ticket DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Ventes par moyen paiement
  sales_cash DECIMAL(10,2) NOT NULL DEFAULT 0,
  sales_card DECIMAL(10,2) NOT NULL DEFAULT 0,
  sales_other DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Ventes par type
  sales_dine_in DECIMAL(10,2) NOT NULL DEFAULT 0,
  sales_takeaway DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Top produits (JSONB)
  top_products JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Coûts
  material_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  expenses DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Marges
  gross_margin DECIMAL(10,2) NOT NULL DEFAULT 0,
  gross_margin_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  
  -- Métadonnées
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  version VARCHAR(10) NOT NULL DEFAULT '1.0',
  
  -- Contraintes
  UNIQUE(company_id, date)
);

-- Index daily_stats
CREATE INDEX IF NOT EXISTS idx_daily_stats_company_date 
ON daily_stats (company_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_stats_date 
ON daily_stats (date DESC);

-- 9. Fonction trigger pour auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur app_state
DROP TRIGGER IF EXISTS trigger_app_state_updated_at ON app_state;
CREATE TRIGGER trigger_app_state_updated_at
  BEFORE UPDATE ON app_state
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 10. Fonction pour calculer daily_stats (appelée par cron job)
CREATE OR REPLACE FUNCTION calculate_daily_stats(
  p_company_id UUID,
  p_date DATE
)
RETURNS void AS $$
DECLARE
  v_state JSONB;
  v_orders JSONB;
  v_expenses JSONB;
  v_total_sales DECIMAL(10,2) := 0;
  v_order_count INTEGER := 0;
  v_sales_cash DECIMAL(10,2) := 0;
  v_sales_card DECIMAL(10,2) := 0;
  v_sales_dine_in DECIMAL(10,2) := 0;
  v_sales_takeaway DECIMAL(10,2) := 0;
  v_material_cost DECIMAL(10,2) := 0;
  v_total_expenses DECIMAL(10,2) := 0;
BEGIN
  -- Récupérer app_state
  SELECT data INTO v_state
  FROM app_state
  WHERE company_id = p_company_id;
  
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Company % not found', p_company_id;
  END IF;
  
  -- Extraire orders et expenses
  v_orders := v_state->'orders';
  v_expenses := v_state->'expenses';
  
  -- Calculer ventes (simplifié - à améliorer avec vraie logique)
  -- Note: En production, utiliser des queries JSONB plus sophistiquées
  
  -- Insérer ou mettre à jour daily_stats
  INSERT INTO daily_stats (
    company_id,
    date,
    total_sales,
    order_count,
    average_ticket,
    sales_cash,
    sales_card,
    sales_other,
    sales_dine_in,
    sales_takeaway,
    top_products,
    material_cost,
    expenses,
    gross_margin,
    gross_margin_rate
  ) VALUES (
    p_company_id,
    p_date,
    v_total_sales,
    v_order_count,
    CASE WHEN v_order_count > 0 THEN v_total_sales / v_order_count ELSE 0 END,
    v_sales_cash,
    v_sales_card,
    0,
    v_sales_dine_in,
    v_sales_takeaway,
    '[]'::jsonb,
    v_material_cost,
    v_total_expenses,
    v_total_sales - v_material_cost,
    CASE WHEN v_total_sales > 0 THEN ((v_total_sales - v_material_cost) / v_total_sales) * 100 ELSE 0 END
  )
  ON CONFLICT (company_id, date)
  DO UPDATE SET
    total_sales = EXCLUDED.total_sales,
    order_count = EXCLUDED.order_count,
    average_ticket = EXCLUDED.average_ticket,
    sales_cash = EXCLUDED.sales_cash,
    sales_card = EXCLUDED.sales_card,
    sales_dine_in = EXCLUDED.sales_dine_in,
    sales_takeaway = EXCLUDED.sales_takeaway,
    material_cost = EXCLUDED.material_cost,
    expenses = EXCLUDED.expenses,
    gross_margin = EXCLUDED.gross_margin,
    gross_margin_rate = EXCLUDED.gross_margin_rate,
    calculated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 11. Fonction pour nettoyer vieilles données (>6 mois)
CREATE OR REPLACE FUNCTION cleanup_old_daily_stats()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM daily_stats
  WHERE date < CURRENT_DATE - INTERVAL '6 months';
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

-- 12. Commentaires pour documentation
COMMENT ON TABLE daily_stats IS 'Pré-agrégation quotidienne pour dashboard performance';
COMMENT ON FUNCTION calculate_daily_stats IS 'Calcule stats quotidiennes pour un restaurant';
COMMENT ON FUNCTION cleanup_old_daily_stats IS 'Nettoie stats >6 mois (rétention)';

-- 13. Grants pour sécurité
GRANT SELECT, INSERT, UPDATE ON daily_stats TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_daily_stats TO authenticated;

-- 14. RLS sur daily_stats (isolation multi-tenant)
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company daily_stats"
  ON daily_stats FOR SELECT
  USING (company_id::text = current_setting('app.current_company_id', true));

CREATE POLICY "Users can insert own company daily_stats"
  ON daily_stats FOR INSERT
  WITH CHECK (company_id::text = current_setting('app.current_company_id', true));

CREATE POLICY "Users can update own company daily_stats"
  ON daily_stats FOR UPDATE
  USING (company_id::text = current_setting('app.current_company_id', true));

-- 15. Vue matérialisée pour dashboard (optionnel - si besoin perf extrême)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_dashboard_stats AS
SELECT 
  company_id,
  date,
  total_sales,
  order_count,
  average_ticket,
  gross_margin_rate
FROM daily_stats
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY company_id, date DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_dashboard_stats 
ON mv_dashboard_stats (company_id, date);

-- Fonction pour refresh vue matérialisée
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_stats;
END;
$$ LANGUAGE plpgsql;

-- 16. Statistiques PostgreSQL pour optimiseur
ANALYZE app_state;
ANALYZE daily_stats;

-- 17. Vacuum pour récupérer espace
VACUUM ANALYZE app_state;
VACUUM ANALYZE daily_stats;
