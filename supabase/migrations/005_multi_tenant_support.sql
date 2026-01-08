-- =============================================
-- Migration 005: Multi-Tenant Support
-- =============================================
-- Description: Add company_id to app_state for multi-tenant isolation
-- Date: 2026-01-08
-- Author: Claude Code
--
-- Impact:
-- - Enables RLS (Row Level Security) policies
-- - Required for backup cron functionality
-- - Foundation for multi-tenant architecture
-- =============================================

-- Step 1: Create companies table first (if not exists)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT DEFAULT 'PRO' CHECK (plan IN ('SOLO', 'PRO', 'TEAM', 'BUSINESS')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  settings JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_companies_owner ON companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_companies_plan ON companies(plan);
CREATE INDEX IF NOT EXISTS idx_companies_active ON companies(is_active);

-- Step 2: Add company_id to app_state
ALTER TABLE app_state
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- Index for multi-tenant queries
CREATE INDEX IF NOT EXISTS idx_app_state_company ON app_state(company_id);

-- Step 3: Migrate existing data (1 user = 1 company approach)
-- For each existing app_state row without company_id, create a company
DO $$
DECLARE
  state_record RECORD;
  new_company_id UUID;
  company_name TEXT;
BEGIN
  -- Loop through app_state rows without company_id
  FOR state_record IN
    SELECT id, data
    FROM app_state
    WHERE company_id IS NULL
  LOOP
    -- Extract restaurant name from JSONB data
    company_name := COALESCE(
      state_record.data->'restaurant'->>'name',
      'Restaurant ' || LEFT(state_record.id::TEXT, 8)
    );

    -- Create company for this user
    INSERT INTO companies (id, name, owner_id, plan)
    VALUES (
      state_record.id,  -- Use same UUID as user for simplicity
      company_name,
      state_record.id,  -- owner_id = user id
      COALESCE(state_record.data->'restaurant'->>'plan', 'PRO')
    )
    ON CONFLICT (id) DO NOTHING
    RETURNING id INTO new_company_id;

    -- Update app_state with company_id
    UPDATE app_state
    SET company_id = COALESCE(new_company_id, state_record.id)
    WHERE id = state_record.id;

    RAISE NOTICE 'Migrated app_state % to company %', state_record.id, company_name;
  END LOOP;
END $$;

-- Step 4: Make company_id NOT NULL after migration
ALTER TABLE app_state
ALTER COLUMN company_id SET NOT NULL;

-- Step 5: Enable Row Level Security
ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Step 6: RLS Policies for app_state
-- Policy 1: Users can only see their company's data
CREATE POLICY "Users can read their company data"
  ON app_state
  FOR SELECT
  USING (
    company_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

-- Policy 2: Users can update their company's data
CREATE POLICY "Users can update their company data"
  ON app_state
  FOR UPDATE
  USING (
    company_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

-- Policy 3: Users can insert data for their company
CREATE POLICY "Users can insert their company data"
  ON app_state
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

-- Policy 4: Users can delete their company's data
CREATE POLICY "Users can delete their company data"
  ON app_state
  FOR DELETE
  USING (
    company_id IN (
      SELECT id FROM companies WHERE owner_id = auth.uid()
    )
  );

-- Step 7: RLS Policies for companies
-- Policy 1: Users can read their own companies
CREATE POLICY "Users can read their companies"
  ON companies
  FOR SELECT
  USING (owner_id = auth.uid());

-- Policy 2: Users can update their companies
CREATE POLICY "Users can update their companies"
  ON companies
  FOR UPDATE
  USING (owner_id = auth.uid());

-- Policy 3: Users can insert new companies
CREATE POLICY "Users can create companies"
  ON companies
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Step 8: Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for companies.updated_at
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 9: Verification queries (commented for production)
-- SELECT COUNT(*) as total_companies FROM companies;
-- SELECT COUNT(*) as app_states_with_company FROM app_state WHERE company_id IS NOT NULL;
-- SELECT c.name, COUNT(a.id) as state_count
-- FROM companies c
-- LEFT JOIN app_state a ON a.company_id = c.id
-- GROUP BY c.id, c.name;

-- =============================================
-- Migration Complete
-- =============================================
-- Next steps:
-- 1. Test RLS policies with multiple test users
-- 2. Verify backup cron can access companies table
-- 3. Update app code to use company_id in queries
-- =============================================
