-- Migration 009: Audit Log pour traçabilité sécurité
-- Créer table audit_log pour tracer connexions et actions sensibles

CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    user_id TEXT, -- User ID de l'app (pas Supabase auth.uid)
    auth_user_id UUID, -- Supabase auth.uid si applicable
    event_type TEXT NOT NULL, -- LOGIN, LOGOUT, LOGIN_FAILED, PASSWORD_RESET, etc.
    event_data JSONB, -- Détails spécifiques à l'événement
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherches rapides
CREATE INDEX idx_audit_log_company ON audit_log(company_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_auth_user ON audit_log(auth_user_id);
CREATE INDEX idx_audit_log_event_type ON audit_log(event_type);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);

-- RLS: Chaque company voit seulement ses logs
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company audit logs"
    ON public.audit_log
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT owner_id FROM companies WHERE id = company_id
        )
    );

CREATE POLICY "Authenticated users can insert audit logs"
    ON public.audit_log
    FOR INSERT
    WITH CHECK (true); -- Tout utilisateur authentifié peut logger

-- Fonction de nettoyage automatique (garder 6 mois)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM audit_log
    WHERE created_at < NOW() - INTERVAL '6 months';
END;
$$ LANGUAGE plpgsql;

-- Commentaires
COMMENT ON TABLE audit_log IS 'Historique des événements de sécurité et actions sensibles';
COMMENT ON COLUMN audit_log.event_type IS 'LOGIN, LOGOUT, LOGIN_FAILED, PASSWORD_RESET, DATA_EXPORT, etc.';
COMMENT ON COLUMN audit_log.event_data IS 'Détails JSON de l''événement (email, raison échec, etc.)';
