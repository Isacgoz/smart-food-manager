-- =============================================
-- Migration 008: Fix RLS Policies
-- =============================================
-- Problème: Conflits entre policies 002 et 005
-- Solution: Simplifier avec auth.uid() = id
-- =============================================

-- Step 1: Drop ALL existing policies on app_state
DROP POLICY IF EXISTS "Companies can only access their own app_state" ON app_state;
DROP POLICY IF EXISTS "Users can read their company data" ON app_state;
DROP POLICY IF EXISTS "Users can update their company data" ON app_state;
DROP POLICY IF EXISTS "Users can insert their company data" ON app_state;
DROP POLICY IF EXISTS "Users can delete their company data" ON app_state;

-- Step 2: Drop existing policies on companies
DROP POLICY IF EXISTS "Users can read their companies" ON companies;
DROP POLICY IF EXISTS "Users can update their companies" ON companies;
DROP POLICY IF EXISTS "Users can create companies" ON companies;

-- Step 3: Make company_id nullable temporarily for backwards compatibility
ALTER TABLE app_state ALTER COLUMN company_id DROP NOT NULL;

-- Step 4: Create SIMPLE RLS policy for app_state
-- Règle: user.id = app_state.id (1 user = 1 restaurant)
CREATE POLICY "app_state_access_policy"
  ON app_state
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Step 5: Create SIMPLE RLS policy for companies
CREATE POLICY "companies_owner_access"
  ON companies
  FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Step 6: Allow INSERT for new users (no existing row)
CREATE POLICY "app_state_insert_new"
  ON app_state
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Step 7: Allow users to create their own company
CREATE POLICY "companies_insert_own"
  ON companies
  FOR INSERT
  WITH CHECK (owner_id = auth.uid() OR id = auth.uid());

-- Step 8: Sync company_id with id for existing rows
UPDATE app_state SET company_id = id WHERE company_id IS NULL;

-- Step 9: Verify RLS is enabled
ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Verification
-- =============================================
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename IN ('app_state', 'companies');
