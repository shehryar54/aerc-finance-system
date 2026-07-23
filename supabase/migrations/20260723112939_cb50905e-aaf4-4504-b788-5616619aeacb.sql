
-- Allowance types
CREATE TABLE public.allowance_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text,
  amount_type text NOT NULL DEFAULT 'fixed', -- fixed | percent_of_basic
  amount numeric(18,2) NOT NULL DEFAULT 0,
  taxable boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.allowance_types TO anon, authenticated, service_role;
ALTER TABLE public.allowance_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allowance_types all access" ON public.allowance_types FOR ALL USING (true) WITH CHECK (true);

-- Deduction types
CREATE TABLE public.deduction_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text,
  amount_type text NOT NULL DEFAULT 'fixed',
  amount numeric(18,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.deduction_types TO anon, authenticated, service_role;
ALTER TABLE public.deduction_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deduction_types all access" ON public.deduction_types FOR ALL USING (true) WITH CHECK (true);

-- Loans
CREATE TABLE public.loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  loan_type text NOT NULL DEFAULT 'general',
  principal numeric(18,2) NOT NULL DEFAULT 0,
  monthly_installment numeric(18,2) NOT NULL DEFAULT 0,
  remaining_balance numeric(18,2) NOT NULL DEFAULT 0,
  start_date date,
  end_date date,
  status text NOT NULL DEFAULT 'active',
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.loans TO anon, authenticated, service_role;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "loans all access" ON public.loans FOR ALL USING (true) WITH CHECK (true);

-- Provident fund
CREATE TABLE public.pf_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  period date NOT NULL,
  employee_share numeric(18,2) NOT NULL DEFAULT 0,
  employer_share numeric(18,2) NOT NULL DEFAULT 0,
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.pf_contributions TO anon, authenticated, service_role;
ALTER TABLE public.pf_contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pf_contributions all access" ON public.pf_contributions FOR ALL USING (true) WITH CHECK (true);

-- Tax slabs (Pakistan-style progressive)
CREATE TABLE public.tax_slabs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fiscal_year text NOT NULL,
  min_income numeric(18,2) NOT NULL,
  max_income numeric(18,2),
  base_tax numeric(18,2) NOT NULL DEFAULT 0,
  rate_percent numeric(6,3) NOT NULL DEFAULT 0,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.tax_slabs TO anon, authenticated, service_role;
ALTER TABLE public.tax_slabs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tax_slabs all access" ON public.tax_slabs FOR ALL USING (true) WITH CHECK (true);

-- Payroll runs
CREATE TABLE public.payroll_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period date NOT NULL,
  status text NOT NULL DEFAULT 'draft', -- draft | processed | paid
  employees_count int NOT NULL DEFAULT 0,
  total_gross numeric(18,2) NOT NULL DEFAULT 0,
  total_allowances numeric(18,2) NOT NULL DEFAULT 0,
  total_deductions numeric(18,2) NOT NULL DEFAULT 0,
  total_tax numeric(18,2) NOT NULL DEFAULT 0,
  total_net numeric(18,2) NOT NULL DEFAULT 0,
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.payroll_runs TO anon, authenticated, service_role;
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payroll_runs all access" ON public.payroll_runs FOR ALL USING (true) WITH CHECK (true);

-- Organisation settings (single row)
CREATE TABLE public.org_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_name text NOT NULL DEFAULT 'Finance Hub',
  address text,
  currency text NOT NULL DEFAULT 'PKR',
  fiscal_year_start text NOT NULL DEFAULT '07-01',
  contact_email text,
  contact_phone text,
  logo_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.org_settings TO anon, authenticated, service_role;
ALTER TABLE public.org_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_settings all access" ON public.org_settings FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.org_settings (organisation_name, currency, contact_email) VALUES ('Applied Economics Research Centre', 'PKR', 'aerc@uok.edu.pk');

-- Seed default allowance/deduction types
INSERT INTO public.allowance_types (name, code, amount_type, amount, taxable) VALUES
  ('House Rent Allowance', 'HRA', 'percent_of_basic', 45, true),
  ('Medical Allowance', 'MED', 'percent_of_basic', 10, false),
  ('Conveyance Allowance', 'CONV', 'fixed', 5000, true),
  ('Utility Allowance', 'UTIL', 'percent_of_basic', 5, true);

INSERT INTO public.deduction_types (name, code, amount_type, amount) VALUES
  ('Provident Fund', 'PF', 'percent_of_basic', 8.33),
  ('EOBI', 'EOBI', 'fixed', 370),
  ('Benevolent Fund', 'BF', 'fixed', 200);

-- Seed Pakistan salaried tax slabs FY2024-25 (illustrative)
INSERT INTO public.tax_slabs (fiscal_year, min_income, max_income, base_tax, rate_percent, sort_order) VALUES
  ('2024-25', 0, 600000, 0, 0, 1),
  ('2024-25', 600000, 1200000, 0, 5, 2),
  ('2024-25', 1200000, 2200000, 30000, 15, 3),
  ('2024-25', 2200000, 3200000, 180000, 25, 4),
  ('2024-25', 3200000, 4100000, 430000, 30, 5),
  ('2024-25', 4100000, NULL, 700000, 35, 6);

-- updated_at trigger for new tables
CREATE TRIGGER trg_set_updated_at_allowance BEFORE UPDATE ON public.allowance_types FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_set_updated_at_deduction BEFORE UPDATE ON public.deduction_types FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_set_updated_at_loans BEFORE UPDATE ON public.loans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_set_updated_at_payroll BEFORE UPDATE ON public.payroll_runs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_set_updated_at_org BEFORE UPDATE ON public.org_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
