-- Smart Food Manager - Schema PostgreSQL Production
-- Migration 001: Tables principales + RLS multi-tenant

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- COMPANIES (Multi-tenant isolation)
-- ============================================
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  legal_name TEXT,
  siren TEXT UNIQUE,
  siret TEXT,
  vat_number TEXT,
  address TEXT,
  postal_code TEXT,
  city TEXT,
  country TEXT DEFAULT 'France',
  phone TEXT,
  email TEXT,
  plan TEXT NOT NULL DEFAULT 'SOLO' CHECK (plan IN ('SOLO', 'TEAM', 'BUSINESS')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial')),
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USERS (Authentication + Roles)
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  password_hash TEXT, -- bcrypt hash
  pin TEXT, -- Pour login serveur mobile
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('OWNER', 'MANAGER', 'SERVER', 'COOK')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- INGREDIENTS
-- ============================================
CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  unit TEXT NOT NULL, -- kg, L, piece
  stock NUMERIC(10,3) DEFAULT 0 CHECK (stock >= 0),
  min_stock NUMERIC(10,3) DEFAULT 0,
  average_cost NUMERIC(10,2) DEFAULT 0, -- PMP (Prix Moyen Pondéré)
  last_purchase_price NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, name)
);

CREATE INDEX idx_ingredients_company ON ingredients(company_id);

-- ============================================
-- SUPPLIERS
-- ============================================
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, name)
);

CREATE INDEX idx_suppliers_company ON suppliers(company_id);

-- ============================================
-- PRODUCTS (Menu items)
-- ============================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  vat_rate NUMERIC(5,2) DEFAULT 10.00,
  image_url TEXT,
  recipe JSONB DEFAULT '[]', -- [{ingredientId: UUID, quantity: number}]
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, name)
);

CREATE INDEX idx_products_company ON products(company_id);
CREATE INDEX idx_products_category ON products(company_id, category);

-- ============================================
-- TABLES (Restaurant tables)
-- ============================================
CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  capacity INT DEFAULT 2,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'FREE' CHECK (status IN ('FREE', 'OCCUPIED', 'RESERVED', 'DIRTY')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, name)
);

CREATE INDEX idx_tables_company ON tables(company_id);
CREATE INDEX idx_tables_status ON tables(company_id, status);

-- ============================================
-- ORDERS (Client orders/invoices)
-- ============================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL, -- Numérotation séquentielle inaltérable
  table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
  server_id UUID REFERENCES users(id) ON DELETE SET NULL,
  items JSONB NOT NULL DEFAULT '[]', -- [{productId, quantity, price, name}]
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  vat_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'unpaid')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  UNIQUE(company_id, invoice_number)
);

CREATE INDEX idx_orders_company ON orders(company_id);
CREATE INDEX idx_orders_status ON orders(company_id, status);
CREATE INDEX idx_orders_created ON orders(company_id, created_at DESC);

-- ============================================
-- PURCHASES (Supplier orders)
-- ============================================
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  items JSONB NOT NULL DEFAULT '[]', -- [{ingredientId, quantity, cost}]
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'validated')),
  validated_at TIMESTAMPTZ,
  validated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_purchases_company ON purchases(company_id);
CREATE INDEX idx_purchases_status ON purchases(company_id, status);

-- ============================================
-- STOCK_MOVEMENTS (Audit trail)
-- ============================================
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'sale', 'adjustment', 'waste')),
  quantity NUMERIC(10,3) NOT NULL, -- Positif = entrée, Négatif = sortie
  reference_id UUID, -- ID de la commande/achat associé
  reference_type TEXT, -- 'order', 'purchase', 'inventory'
  cost_per_unit NUMERIC(10,2),
  reason TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_movements_company ON stock_movements(company_id);
CREATE INDEX idx_movements_ingredient ON stock_movements(ingredient_id);
CREATE INDEX idx_movements_created ON stock_movements(created_at DESC);

-- ============================================
-- EXPENSES (Fixed + Variable costs)
-- ============================================
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('fixed', 'variable')),
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  frequency TEXT CHECK (frequency IN ('monthly', 'quarterly', 'yearly', 'one-time')),
  date DATE NOT NULL,
  category TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expenses_company ON expenses(company_id);
CREATE INDEX idx_expenses_date ON expenses(company_id, date DESC);

-- ============================================
-- CASH_SESSIONS (Z de caisse)
-- ============================================
CREATE TABLE cash_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  opened_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  closed_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  opening_cash NUMERIC(10,2) NOT NULL DEFAULT 0,
  expected_cash NUMERIC(10,2),
  actual_cash NUMERIC(10,2),
  cash_difference NUMERIC(10,2),
  card_total NUMERIC(10,2) DEFAULT 0,
  total_revenue NUMERIC(10,2) DEFAULT 0,
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed'))
);

CREATE INDEX idx_cash_sessions_company ON cash_sessions(company_id);
CREATE INDEX idx_cash_sessions_status ON cash_sessions(company_id, status);

-- ============================================
-- ROW LEVEL SECURITY (RLS) Multi-tenant
-- ============================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their company's data
CREATE POLICY company_isolation_users ON users
  FOR ALL USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY company_isolation_ingredients ON ingredients
  FOR ALL USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY company_isolation_suppliers ON suppliers
  FOR ALL USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY company_isolation_products ON products
  FOR ALL USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY company_isolation_tables ON tables
  FOR ALL USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY company_isolation_orders ON orders
  FOR ALL USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY company_isolation_purchases ON purchases
  FOR ALL USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY company_isolation_movements ON stock_movements
  FOR ALL USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY company_isolation_expenses ON expenses
  FOR ALL USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY company_isolation_sessions ON cash_sessions
  FOR ALL USING (company_id = current_setting('app.current_company_id')::UUID);

-- Companies: Users can only see their own company
CREATE POLICY company_self_access ON companies
  FOR ALL USING (id = current_setting('app.current_company_id')::UUID);

-- ============================================
-- TRIGGERS (Auto-update timestamps)
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON ingredients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON tables FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON purchases FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- FUNCTIONS (Business Logic)
-- ============================================

-- Function: Generate next invoice number (inalterable sequence)
CREATE OR REPLACE FUNCTION generate_invoice_number(company_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  year_prefix TEXT := TO_CHAR(NOW(), 'YYYY');
  next_num INT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '[0-9]+$') AS INT)), 0) + 1
  INTO next_num
  FROM orders
  WHERE company_id = company_uuid
    AND invoice_number LIKE year_prefix || '-%';

  RETURN year_prefix || '-' || LPAD(next_num::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate PMP (Prix Moyen Pondéré) after purchase
CREATE OR REPLACE FUNCTION update_ingredient_pmp()
RETURNS TRIGGER AS $$
DECLARE
  purchase_item JSONB;
  ingredient RECORD;
  new_stock NUMERIC;
  new_pmp NUMERIC;
BEGIN
  -- Only on validation
  IF NEW.status = 'validated' AND OLD.status = 'draft' THEN
    -- Loop through purchase items
    FOR purchase_item IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
      -- Get current ingredient state
      SELECT * INTO ingredient FROM ingredients
      WHERE id = (purchase_item->>'ingredientId')::UUID
        AND company_id = NEW.company_id;

      IF FOUND THEN
        -- Calculate new stock
        new_stock := ingredient.stock + (purchase_item->>'quantity')::NUMERIC;

        -- Calculate new PMP
        IF new_stock > 0 THEN
          new_pmp := (
            (ingredient.stock * ingredient.average_cost) +
            ((purchase_item->>'quantity')::NUMERIC * (purchase_item->>'cost')::NUMERIC / (purchase_item->>'quantity')::NUMERIC)
          ) / new_stock;
        ELSE
          new_pmp := ingredient.average_cost;
        END IF;

        -- Update ingredient
        UPDATE ingredients SET
          stock = new_stock,
          average_cost = new_pmp,
          last_purchase_price = (purchase_item->>'cost')::NUMERIC / (purchase_item->>'quantity')::NUMERIC,
          updated_at = NOW()
        WHERE id = ingredient.id;

        -- Create stock movement
        INSERT INTO stock_movements (company_id, ingredient_id, type, quantity, reference_id, reference_type, cost_per_unit, created_by)
        VALUES (
          NEW.company_id,
          ingredient.id,
          'purchase',
          (purchase_item->>'quantity')::NUMERIC,
          NEW.id,
          'purchase',
          (purchase_item->>'cost')::NUMERIC / (purchase_item->>'quantity')::NUMERIC,
          NEW.validated_by
        );
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pmp
AFTER UPDATE ON purchases
FOR EACH ROW EXECUTE FUNCTION update_ingredient_pmp();

-- ============================================
-- SEED DATA (Optional - pour tests)
-- ============================================

-- Créer une entreprise de test (à supprimer en production)
-- INSERT INTO companies (id, name, siren, plan)
-- VALUES ('00000000-0000-0000-0000-000000000001', 'Restaurant Demo', '123456789', 'TEAM');

-- Créer un utilisateur admin (à supprimer en production)
-- INSERT INTO users (company_id, email, password_hash, name, role)
-- VALUES ('00000000-0000-0000-0000-000000000001', 'admin@demo.fr', '$2b$10$...', 'Admin Demo', 'OWNER');
