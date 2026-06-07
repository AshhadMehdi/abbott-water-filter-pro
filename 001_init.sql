-- Migration: 001_init.sql
-- Abbott Water Filters - AquaOps protocol schema
BEGIN;

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enumerations
DO $$ BEGIN
    CREATE TYPE role_enum AS ENUM ('Manager','Technician','Sales Staff');
EXCEPTION WHEN duplicate_object THEN null; END$$;

DO $$ BEGIN
    CREATE TYPE shift_enum AS ENUM ('Morning','Evening','Night');
EXCEPTION WHEN duplicate_object THEN null; END$$;

DO $$ BEGIN
    CREATE TYPE job_type_enum AS ENUM ('New Installation','Filter Replacement','Repair','Inspection');
EXCEPTION WHEN duplicate_object THEN null; END$$;

DO $$ BEGIN
    CREATE TYPE job_status_enum AS ENUM ('Scheduled','In Progress','Completed','Cancelled');
EXCEPTION WHEN duplicate_object THEN null; END$$;

DO $$ BEGIN
    CREATE TYPE inventory_category_enum AS ENUM ('Filter Cartridge','Membrane','Housing','Fittings','Tubing','Tank','Tools','Other');
EXCEPTION WHEN duplicate_object THEN null; END$$;

DO $$ BEGIN
    CREATE TYPE inventory_unit_enum AS ENUM ('Pcs','Sets','Meters');
EXCEPTION WHEN duplicate_object THEN null; END$$;

DO $$ BEGIN
    CREATE TYPE feedback_type_enum AS ENUM ('Compliment','Suggestion','Complaint');
EXCEPTION WHEN duplicate_object THEN null; END$$;

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id TEXT UNIQUE,
    name TEXT NOT NULL,
    role role_enum,
    phone TEXT,
    shift shift_enum,
    area TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT UNIQUE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    area TEXT,
    filter_model TEXT,
    lifespan_months INTEGER DEFAULT 6,
    install_date DATE DEFAULT current_date,
    due_date DATE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT customers_phone_format CHECK (phone ~ '^92[0-9]{10}$')
);

-- Jobs
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id TEXT UNIQUE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    technician_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    job_type job_type_enum,
    scheduled_date DATE,
    scheduled_time TIME,
    status job_status_enum DEFAULT 'Scheduled',
    labor_charge NUMERIC(10,2) DEFAULT 0.00,
    parts_cost NUMERIC(10,2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inventory
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_name TEXT NOT NULL,
    category inventory_category_enum,
    current_stock NUMERIC(10,2) DEFAULT 0.00,
    reorder_level NUMERIC(10,2) DEFAULT 0.00,
    unit inventory_unit_enum,
    supplier TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Customer feedback
CREATE TABLE IF NOT EXISTS customer_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT,
    phone TEXT,
    rating INTEGER CHECK (rating >=1 AND rating <=5),
    type feedback_type_enum,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- WhatsApp logs
CREATE TABLE IF NOT EXISTS whatsapp_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT,
    template_used TEXT,
    sent_at TIMESTAMPTZ DEFAULT now(),
    sent_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Trigger function to compute due_date = install_date + lifespan_months
CREATE OR REPLACE FUNCTION compute_customer_due_date()
RETURNS trigger AS $$
BEGIN
    IF (NEW.install_date IS NOT NULL AND NEW.lifespan_months IS NOT NULL) THEN
        NEW.due_date := (NEW.install_date + (NEW.lifespan_months * INTERVAL '1 month'))::date;
    ELSE
        NEW.due_date := NULL;
    END IF;
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger
DROP TRIGGER IF EXISTS trg_compute_due_date ON customers;
CREATE TRIGGER trg_compute_due_date
BEFORE INSERT OR UPDATE OF install_date, lifespan_months ON customers
FOR EACH ROW EXECUTE FUNCTION compute_customer_due_date();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customers_due_date ON customers(due_date);
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled_date ON jobs(scheduled_date);

-- Row Level Security (RLS) draft - enable and example policies
-- NOTE: These are templates for Supabase-style RLS using auth.uid()
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- Allow users to select their own profile (example)
CREATE POLICY profiles_select_own ON profiles FOR SELECT USING (auth.uid() = id);
-- Managers can insert/update/delete profiles; users can update their own profile
CREATE POLICY profiles_manage_manager ON profiles FOR ALL USING (exists (select 1 from auth.users u where auth.uid() = u.id and exists (select 1 from profiles p2 where p2.id = auth.uid() and p2.role = 'Manager')));
CREATE POLICY profiles_update_own ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY profiles_insert_for_manager ON profiles FOR INSERT WITH CHECK (exists (select 1 from profiles p2 where p2.id = auth.uid() and p2.role = 'Manager'));

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- Example: allow managers to select all, others only if created_by matches their profile
CREATE POLICY customers_select ON customers FOR SELECT USING (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'Manager') OR created_by = auth.uid()
);
-- Insert: Managers and Sales Staff can create customers
CREATE POLICY customers_insert ON customers FOR INSERT WITH CHECK (
    exists (select 1 from profiles p where p.id = auth.uid() and (p.role = 'Manager' OR p.role = 'Sales Staff'))
);
-- Update: Managers or creator can update
CREATE POLICY customers_update ON customers FOR UPDATE USING (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'Manager') OR created_by = auth.uid()
) WITH CHECK (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'Manager') OR created_by = auth.uid()
);
-- Delete: only managers
CREATE POLICY customers_delete ON customers FOR DELETE USING (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'Manager')
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY jobs_select ON jobs FOR SELECT USING (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'Manager')
    OR technician_id = auth.uid()
    OR (exists (select 1 from customers c where c.id = jobs.customer_id and c.created_by = auth.uid()))
);

-- Customer feedback and whatsapp logs RLS
ALTER TABLE customer_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY feedback_select ON customer_feedback FOR SELECT USING (true);
CREATE POLICY feedback_insert ON customer_feedback FOR INSERT WITH CHECK (auth.role() IS NOT NULL);

ALTER TABLE whatsapp_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY whatsapp_select ON whatsapp_logs FOR SELECT USING (exists (select 1 from profiles p where p.id = auth.uid() and (p.role = 'Manager' OR p.role = 'Technician')));
CREATE POLICY whatsapp_insert ON whatsapp_logs FOR INSERT WITH CHECK (exists (select 1 from profiles p where p.id = auth.uid() and (p.role = 'Manager' OR p.role = 'Technician' OR p.role = 'Sales Staff')));
-- Insert jobs: managers and technicians can create jobs (technician allowed if technician_id = auth.uid())
CREATE POLICY jobs_insert ON jobs FOR INSERT WITH CHECK (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'Manager')
    OR technician_id = auth.uid()
);
-- Update jobs: managers or assigned technician
CREATE POLICY jobs_update ON jobs FOR UPDATE USING (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'Manager') OR technician_id = auth.uid()
) WITH CHECK (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'Manager') OR technician_id = auth.uid()
);
-- Delete: only managers
CREATE POLICY jobs_delete ON jobs FOR DELETE USING (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'Manager')
);

-- Inventory RLS
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY inventory_select ON inventory FOR SELECT USING (true);
CREATE POLICY inventory_manage ON inventory FOR ALL USING (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'Manager'));

-- Commit migration
COMMIT;

-- End of migration
