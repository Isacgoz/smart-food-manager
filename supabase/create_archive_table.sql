-- Smart Food Manager - Table Archivage NF525
-- Date: 2025-12-25
-- Conformité: Archivage sécurisé 6 ans (obligation légale France)

-- ============================================
-- 1. TABLE ARCHIVES (Factures + Z-Reports)
-- ============================================

CREATE TABLE IF NOT EXISTS archives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id TEXT NOT NULL,

  -- Type document
  type TEXT NOT NULL CHECK (type IN ('INVOICE', 'ZREPORT')),

  -- Référence
  reference TEXT NOT NULL, -- Numéro facture ou Z
  sequence_number INTEGER NOT NULL,

  -- Contenu document (JSONB)
  data JSONB NOT NULL,

  -- Hash cryptographique (NF525)
  hash TEXT NOT NULL,
  previous_hash TEXT,

  -- Dates
  document_date DATE NOT NULL,
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Métadonnées
  archived_by TEXT, -- user_id
  file_path TEXT, -- Chemin fichier PDF stocké

  -- Conformité
  is_locked BOOLEAN DEFAULT true, -- Immutable
  retention_until DATE, -- Date expiration (6 ans)

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. INDEX POUR PERFORMANCES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_archives_restaurant ON archives(restaurant_id, document_date DESC);
CREATE INDEX IF NOT EXISTS idx_archives_type ON archives(type, restaurant_id);
CREATE INDEX IF NOT EXISTS idx_archives_reference ON archives(reference);
CREATE INDEX IF NOT EXISTS idx_archives_sequence ON archives(restaurant_id, type, sequence_number);
CREATE INDEX IF NOT EXISTS idx_archives_retention ON archives(retention_until) WHERE retention_until IS NOT NULL;

-- Index JSONB pour recherches rapides
CREATE INDEX IF NOT EXISTS idx_archives_data_gin ON archives USING GIN (data);

-- ============================================
-- 3. CONTRAINTES UNICITÉ
-- ============================================

-- Numéro facture unique par restaurant
CREATE UNIQUE INDEX IF NOT EXISTS idx_archives_invoice_number
  ON archives(restaurant_id, reference)
  WHERE type = 'INVOICE';

-- Séquence Z unique par restaurant
CREATE UNIQUE INDEX IF NOT EXISTS idx_archives_z_sequence
  ON archives(restaurant_id, sequence_number)
  WHERE type = 'ZREPORT';

-- ============================================
-- 4. FONCTION: Archiver document
-- ============================================

CREATE OR REPLACE FUNCTION archive_document(
  p_restaurant_id TEXT,
  p_type TEXT,
  p_reference TEXT,
  p_sequence_number INTEGER,
  p_data JSONB,
  p_hash TEXT,
  p_previous_hash TEXT DEFAULT NULL,
  p_document_date DATE DEFAULT CURRENT_DATE,
  p_archived_by TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_archive_id UUID;
  v_retention_date DATE;
BEGIN
  -- Calcul date rétention (6 ans)
  v_retention_date := p_document_date + INTERVAL '6 years';

  -- Insertion archive
  INSERT INTO archives (
    restaurant_id,
    type,
    reference,
    sequence_number,
    data,
    hash,
    previous_hash,
    document_date,
    archived_by,
    retention_until,
    is_locked
  ) VALUES (
    p_restaurant_id,
    p_type,
    p_reference,
    p_sequence_number,
    p_data,
    p_hash,
    p_previous_hash,
    p_document_date,
    p_archived_by,
    v_retention_date,
    true -- Immutable
  ) RETURNING id INTO v_archive_id;

  RAISE NOTICE 'Document archivé: % (séquence %, rétention jusqu''au %)',
    p_reference, p_sequence_number, v_retention_date;

  RETURN v_archive_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION archive_document(TEXT, TEXT, TEXT, INTEGER, JSONB, TEXT, TEXT, DATE, TEXT) TO authenticated;

-- ============================================
-- 5. TRIGGER: Empêcher modification/suppression
-- ============================================

CREATE OR REPLACE FUNCTION prevent_archive_modification()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.is_locked = true THEN
      RAISE EXCEPTION 'Archive verrouillée: modification interdite (conformité NF525)';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF OLD.retention_until > CURRENT_DATE THEN
      RAISE EXCEPTION 'Archive en rétention: suppression interdite jusqu''au %', OLD.retention_until;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_archive_modification
  BEFORE UPDATE OR DELETE ON archives
  FOR EACH ROW
  EXECUTE FUNCTION prevent_archive_modification();

-- ============================================
-- 6. FONCTION: Vérifier intégrité chaîne hashes
-- ============================================

CREATE OR REPLACE FUNCTION verify_archive_chain(
  p_restaurant_id TEXT,
  p_type TEXT
) RETURNS JSON AS $$
DECLARE
  v_archives RECORD;
  v_expected_hash TEXT := NULL;
  v_errors TEXT[] := '{}';
  v_expected_sequence INTEGER := 1;
BEGIN
  -- Parcourir archives par séquence
  FOR v_archives IN
    SELECT * FROM archives
    WHERE restaurant_id = p_restaurant_id
      AND type = p_type
    ORDER BY sequence_number ASC
  LOOP
    -- Vérifier séquence continue
    IF v_archives.sequence_number != v_expected_sequence THEN
      v_errors := array_append(v_errors,
        format('Séquence brisée: attendu %s, trouvé %s', v_expected_sequence, v_archives.sequence_number)
      );
    END IF;

    -- Vérifier chaînage hash
    IF v_expected_hash IS NOT NULL AND v_archives.previous_hash != v_expected_hash THEN
      v_errors := array_append(v_errors,
        format('Chaîne hash brisée à séquence %s', v_archives.sequence_number)
      );
    END IF;

    v_expected_hash := v_archives.hash;
    v_expected_sequence := v_expected_sequence + 1;
  END LOOP;

  RETURN json_build_object(
    'valid', array_length(v_errors, 1) IS NULL,
    'errors', v_errors
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION verify_archive_chain(TEXT, TEXT) TO authenticated;

-- ============================================
-- 7. FONCTION: Purge archives expirées
-- ============================================

CREATE OR REPLACE FUNCTION purge_expired_archives()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM archives
  WHERE retention_until < CURRENT_DATE
    AND is_locked = false;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RAISE NOTICE 'Archives expirées supprimées: %', v_deleted;

  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cron job (via pg_cron ou externe)
-- SELECT cron.schedule('purge-archives', '0 2 * * 0', 'SELECT purge_expired_archives()');

-- ============================================
-- 8. RLS (Row Level Security)
-- ============================================

ALTER TABLE archives ENABLE ROW LEVEL SECURITY;

-- Lecture: Restaurant peut lire ses propres archives
CREATE POLICY "Restaurant can read own archives"
  ON archives
  FOR SELECT
  USING (true); -- Temporaire (filtrer par JWT en production)

-- Insertion: Restaurant peut créer archives
CREATE POLICY "Restaurant can insert archives"
  ON archives
  FOR INSERT
  WITH CHECK (true); -- Temporaire

-- Modification: INTERDITE (trigger empêche déjà)
CREATE POLICY "No one can update locked archives"
  ON archives
  FOR UPDATE
  USING (is_locked = false)
  WITH CHECK (is_locked = false);

-- Suppression: Seulement archives expirées
CREATE POLICY "Can delete only expired archives"
  ON archives
  FOR DELETE
  USING (retention_until < CURRENT_DATE);

-- ============================================
-- 9. COMMENTAIRES
-- ============================================

COMMENT ON TABLE archives IS 'Archivage sécurisé factures et Z-reports (conformité NF525 - 6 ans)';
COMMENT ON COLUMN archives.hash IS 'Hash SHA-256 du document (chaînage cryptographique)';
COMMENT ON COLUMN archives.previous_hash IS 'Hash document précédent (blockchain-like)';
COMMENT ON COLUMN archives.retention_until IS 'Date expiration rétention légale (6 ans)';
COMMENT ON COLUMN archives.is_locked IS 'Document immutable (NF525)';
COMMENT ON FUNCTION archive_document IS 'Archiver document avec hash et rétention 6 ans';
COMMENT ON FUNCTION verify_archive_chain IS 'Vérifier intégrité chaîne cryptographique';
COMMENT ON FUNCTION purge_expired_archives IS 'Purger archives expirées (> 6 ans)';

-- ============================================
-- FIN SETUP ARCHIVAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ TABLE ARCHIVES CRÉÉE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Conformité NF525:';
  RAISE NOTICE '  - Archivage sécurisé 6 ans';
  RAISE NOTICE '  - Chaînage cryptographique (hash SHA-256)';
  RAISE NOTICE '  - Documents immutables';
  RAISE NOTICE '  - Vérification intégrité via verify_archive_chain()';
  RAISE NOTICE '';
END $$;
