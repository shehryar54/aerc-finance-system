
-- salary_records: one row per employee per month
CREATE TABLE public.salary_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  period_year int NOT NULL,
  period_month int NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  working_days int NOT NULL DEFAULT 26,
  basic_pay numeric(18,2) NOT NULL DEFAULT 0,
  allowances jsonb NOT NULL DEFAULT '{}'::jsonb,
  deductions jsonb NOT NULL DEFAULT '{}'::jsonb,
  leaves jsonb NOT NULL DEFAULT '{"casual":0,"sick":0,"earned":0,"unpaid":0}'::jsonb,
  manual_deductions jsonb NOT NULL DEFAULT '{"loan_recovery":0,"income_tax":0,"advance_salary":0,"misc":0}'::jsonb,
  gross_pay numeric(18,2) NOT NULL DEFAULT 0,
  leave_deduction numeric(18,2) NOT NULL DEFAULT 0,
  total_deductions numeric(18,2) NOT NULL DEFAULT 0,
  net_pay numeric(18,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft', -- draft | finalized | paid
  paid_at timestamptz,
  bank_id uuid REFERENCES public.banks(id) ON DELETE SET NULL,
  bank_account_no text,
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, period_year, period_month)
);
CREATE INDEX salary_records_period_idx ON public.salary_records(period_year, period_month);
CREATE INDEX salary_records_employee_idx ON public.salary_records(employee_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.salary_records TO authenticated;
GRANT ALL ON public.salary_records TO service_role;

ALTER TABLE public.salary_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage salary_records" ON public.salary_records FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER trg_salary_records_updated_at BEFORE UPDATE ON public.salary_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- salary_formulas: editable calculation expressions
CREATE TABLE public.salary_formulas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  expression text NOT NULL,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.salary_formulas TO authenticated;
GRANT ALL ON public.salary_formulas TO service_role;

ALTER TABLE public.salary_formulas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage salary_formulas" ON public.salary_formulas FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER trg_salary_formulas_updated_at BEFORE UPDATE ON public.salary_formulas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.salary_formulas (key, label, expression, description) VALUES
  ('daily_salary', 'Daily Salary', 'basic_pay / working_days', 'Basic pay divided by working days in the month'),
  ('leave_deduction', 'Leave Deduction', 'daily_salary * leaves.unpaid', 'Unpaid leave days multiplied by daily salary'),
  ('gross_pay', 'Gross Pay', 'basic_pay + allowances_total', 'Basic pay plus the sum of all allowances'),
  ('total_deductions', 'Total Deductions', 'deductions_total + leave_deduction + manual.loan_recovery + manual.income_tax + manual.advance_salary + manual.misc', 'All statutory, leave and manual deductions combined'),
  ('net_pay', 'Net Pay', 'gross_pay - total_deductions', 'Take-home salary after all deductions');
