-- =====================================================
-- SMART FOOD MANAGER - MIGRATION NF525 COMPLIANCE
-- =====================================================
-- Conformité certification NF525 (loi anti-fraude TVA)
-- Date: 2026-01-23
-- =====================================================

-- =====================================================
-- 1. TABLE: invoice_sequences (Numérotation inaltérable)
-- =====================================================
-- Génération côté SERVEUR pour garantir séquence continue

CREATE TABLE IF NOT EXISTS invoice_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    last_sequence INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, year)
);

-- Fonction pour obtenir prochain numéro (atomique)
CREATE OR REPLACE FUNCTION get_next_invoice_number(p_company_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_year INTEGER;
    v_sequence INTEGER;
    v_invoice_number TEXT;
BEGIN
    v_year := EXTRACT(YEAR FROM NOW());

    -- Insérer ou mettre à jour la séquence (UPSERT atomique)
    INSERT INTO invoice_sequences (company_id, year, last_sequence)
    VALUES (p_company_id, v_year, 1)
    ON CONFLICT (company_id, year)
    DO UPDATE SET
        last_sequence = invoice_sequences.last_sequence + 1,
        updated_at = NOW()
    RETURNING last_sequence INTO v_sequence;

    -- Formater: YYYY-NNNNN
    v_invoice_number := v_year || '-' || LPAD(v_sequence::TEXT, 5, '0');

    RETURN v_invoice_number;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. TABLE: archived_invoices (Archivage 6 ans)
-- =====================================================
-- Stockage IMMUTABLE des factures pour conformité fiscale

CREATE TABLE IF NOT EXISTS archived_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,

    -- Numérotation NF525
    invoice_number TEXT NOT NULL,
    year INTEGER NOT NULL,
    sequence INTEGER NOT NULL,

    -- Horodatage SERVEUR (pas client)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    server_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Données facture (JSON immutable)
    order_id TEXT NOT NULL,
    customer_info JSONB,
    lines JSONB NOT NULL,
    subtotal_ht NUMERIC(10,2) NOT NULL,
    total_vat NUMERIC(10,2) NOT NULL,
    total_ttc NUMERIC(10,2) NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('CASH', 'CARD')),

    -- Mentions légales obligatoires
    restaurant_info JSONB NOT NULL,

    -- Hash intégrité (SHA-256)
    content_hash TEXT NOT NULL,
    previous_hash TEXT,

    -- Métadonnées audit
    created_by UUID,
    ip_address INET,
    user_agent TEXT,

    -- Contraintes
    UNIQUE(company_id, invoice_number),
    UNIQUE(company_id, year, sequence)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_archived_invoices_company ON archived_invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_archived_invoices_date ON archived_invoices(created_at);
CREATE INDEX IF NOT EXISTS idx_archived_invoices_order ON archived_invoices(order_id);

-- =====================================================
-- 3. TABLE: daily_z_reports (Z de caisse)
-- =====================================================
-- Rapport de clôture journalière obligatoire

CREATE TABLE IF NOT EXISTS daily_z_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,

    -- Date du rapport
    report_date DATE NOT NULL,
    report_number TEXT NOT NULL,

    -- Horodatage serveur
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,

    -- Totaux journée
    total_sales NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_cash NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_card NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_vat NUMERIC(10,2) NOT NULL DEFAULT 0,

    -- Comptage
    orders_count INTEGER NOT NULL DEFAULT 0,
    cancelled_count INTEGER NOT NULL DEFAULT 0,
    cancelled_amount NUMERIC(10,2) NOT NULL DEFAULT 0,

    -- Caisse
    opening_cash NUMERIC(10,2),
    closing_cash NUMERIC(10,2),
    cash_difference NUMERIC(10,2),

    -- Détail TVA par taux
    vat_breakdown JSONB,

    -- Hash intégrité
    content_hash TEXT NOT NULL,
    previous_z_hash TEXT,

    -- Utilisateur clôture
    closed_by UUID,

    -- Contraintes
    UNIQUE(company_id, report_date)
);

-- =====================================================
-- 4. TABLE: price_audit_log (Historique prix)
-- =====================================================
-- Traçabilité modifications prix (NF525 requirement)

CREATE TABLE IF NOT EXISTS price_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- Entité modifiée
    entity_type TEXT NOT NULL CHECK (entity_type IN ('PRODUCT', 'INGREDIENT')),
    entity_id TEXT NOT NULL,
    entity_name TEXT NOT NULL,

    -- Valeurs
    old_price NUMERIC(10,2),
    new_price NUMERIC(10,2) NOT NULL,

    -- Audit
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    changed_by UUID,
    reason TEXT,

    -- Métadonnées
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_price_audit_company ON price_audit_log(company_id);
CREATE INDEX IF NOT EXISTS idx_price_audit_entity ON price_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_price_audit_date ON price_audit_log(changed_at);

-- =====================================================
-- 5. TABLE: user_audit_log (Actions utilisateurs)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    user_id UUID NOT NULL,
    user_name TEXT,
    user_role TEXT,

    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,

    details JSONB,

    performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_user_audit_company ON user_audit_log(company_id);
CREATE INDEX IF NOT EXISTS idx_user_audit_user ON user_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_audit_date ON user_audit_log(performed_at);

-- =====================================================
-- 6. ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE invoice_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE archived_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_z_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_audit_log ENABLE ROW LEVEL SECURITY;

-- Policies pour invoice_sequences
CREATE POLICY "invoice_sequences_select" ON invoice_sequences
    FOR SELECT USING (company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid()));
CREATE POLICY "invoice_sequences_insert" ON invoice_sequences
    FOR INSERT WITH CHECK (company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid()));
CREATE POLICY "invoice_sequences_update" ON invoice_sequences
    FOR UPDATE USING (company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid()));

-- Policies pour archived_invoices (lecture seule après création)
CREATE POLICY "archived_invoices_select" ON archived_invoices
    FOR SELECT USING (company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid()));
CREATE POLICY "archived_invoices_insert" ON archived_invoices
    FOR INSERT WITH CHECK (company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid()));
-- PAS de policy UPDATE/DELETE (immutable)

-- Policies pour daily_z_reports
CREATE POLICY "daily_z_reports_select" ON daily_z_reports
    FOR SELECT USING (company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid()));
CREATE POLICY "daily_z_reports_insert" ON daily_z_reports
    FOR INSERT WITH CHECK (company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid()));
CREATE POLICY "daily_z_reports_update" ON daily_z_reports
    FOR UPDATE USING (company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid()));

-- Policies pour price_audit_log
CREATE POLICY "price_audit_log_select" ON price_audit_log
    FOR SELECT USING (company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid()));
CREATE POLICY "price_audit_log_insert" ON price_audit_log
    FOR INSERT WITH CHECK (company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid()));

-- Policies pour user_audit_log
CREATE POLICY "user_audit_log_select" ON user_audit_log
    FOR SELECT USING (company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid()));
CREATE POLICY "user_audit_log_insert" ON user_audit_log
    FOR INSERT WITH CHECK (company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid()));

-- =====================================================
-- 7. TRIGGERS
-- =====================================================

-- Trigger updated_at pour invoice_sequences
DROP TRIGGER IF EXISTS update_invoice_sequences_updated_at ON invoice_sequences;
CREATE TRIGGER update_invoice_sequences_updated_at
    BEFORE UPDATE ON invoice_sequences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FIN MIGRATION NF525
-- =====================================================
-- À exécuter dans Supabase Dashboard → SQL Editor
--
-- Tables créées:
-- - invoice_sequences (numérotation atomique)
-- - archived_invoices (archivage 6 ans)
-- - daily_z_reports (Z de caisse)
-- - price_audit_log (historique prix)
-- - user_audit_log (actions utilisateurs)
-- =====================================================
