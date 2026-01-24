-- =====================================================
-- SMART FOOD MANAGER - CONFIGURATION SUPABASE COMPLÈTE
-- =====================================================
-- Exécuter ce script dans: Supabase Dashboard → SQL Editor
-- Date: 2026-01-17
-- =====================================================

-- =====================================================
-- ÉTAPE 1: CRÉER LES TABLES
-- =====================================================

-- Table companies (multi-tenant)
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_id UUID NOT NULL,
    plan TEXT DEFAULT 'PRO' CHECK (plan IN ('SOLO', 'PRO', 'BUSINESS')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table app_state (données restaurant)
CREATE TABLE IF NOT EXISTS app_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_companies_owner ON companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_app_state_company ON app_state(company_id);

-- =====================================================
-- ÉTAPE 2: FONCTION UPDATED_AT AUTOMATIQUE
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_app_state_updated_at ON app_state;
CREATE TRIGGER update_app_state_updated_at
    BEFORE UPDATE ON app_state
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ÉTAPE 3: ROW LEVEL SECURITY (RLS) - SIMPLE
-- =====================================================

-- Activer RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;

-- Supprimer anciennes policies (au cas où)
DROP POLICY IF EXISTS "companies_select" ON companies;
DROP POLICY IF EXISTS "companies_insert" ON companies;
DROP POLICY IF EXISTS "companies_update" ON companies;
DROP POLICY IF EXISTS "companies_delete" ON companies;

DROP POLICY IF EXISTS "app_state_select" ON app_state;
DROP POLICY IF EXISTS "app_state_insert" ON app_state;
DROP POLICY IF EXISTS "app_state_update" ON app_state;
DROP POLICY IF EXISTS "app_state_delete" ON app_state;

-- =====================================================
-- POLICIES COMPANIES
-- =====================================================

-- SELECT: voir ses propres companies
CREATE POLICY "companies_select" ON companies
    FOR SELECT USING (owner_id = auth.uid());

-- INSERT: créer company si owner_id = son propre id
CREATE POLICY "companies_insert" ON companies
    FOR INSERT WITH CHECK (owner_id = auth.uid());

-- UPDATE: modifier ses propres companies
CREATE POLICY "companies_update" ON companies
    FOR UPDATE USING (owner_id = auth.uid());

-- DELETE: supprimer ses propres companies
CREATE POLICY "companies_delete" ON companies
    FOR DELETE USING (owner_id = auth.uid());

-- =====================================================
-- POLICIES APP_STATE
-- =====================================================

-- SELECT: voir son propre app_state
CREATE POLICY "app_state_select" ON app_state
    FOR SELECT USING (id = auth.uid());

-- INSERT: créer app_state si id = son propre id
CREATE POLICY "app_state_insert" ON app_state
    FOR INSERT WITH CHECK (id = auth.uid());

-- UPDATE: modifier son propre app_state
CREATE POLICY "app_state_update" ON app_state
    FOR UPDATE USING (id = auth.uid());

-- DELETE: supprimer son propre app_state
CREATE POLICY "app_state_delete" ON app_state
    FOR DELETE USING (id = auth.uid());

-- =====================================================
-- ÉTAPE 4: VÉRIFICATION
-- =====================================================

-- Vérifier que tout est bien créé
SELECT
    'Tables créées' as check_type,
    COUNT(*) as count
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('companies', 'app_state');

-- Vérifier RLS activé
SELECT
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('companies', 'app_state');

-- Vérifier policies
SELECT
    tablename,
    policyname,
    cmd as operation
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================
-- Si tout est OK, tu verras:
-- - 2 tables créées
-- - RLS enabled = true pour les 2 tables
-- - 8 policies (4 par table)
-- =====================================================
