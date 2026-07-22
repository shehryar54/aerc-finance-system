
-- =========== updated_at helper ===========
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- =========== BANKS ===========
CREATE TABLE public.banks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  account_title text,
  account_number text,
  branch text,
  opening_balance numeric(18,2) NOT NULL DEFAULT 0,
  current_balance numeric(18,2) NOT NULL DEFAULT 0,
  opening_effective_date date,
  opening_remarks text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.banks TO anon, authenticated;
GRANT ALL ON public.banks TO service_role;
ALTER TABLE public.banks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "banks all access" ON public.banks FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER trg_banks_updated BEFORE UPDATE ON public.banks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========== BANK TRANSACTIONS ===========
CREATE TABLE public.bank_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_id uuid NOT NULL REFERENCES public.banks(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  description text NOT NULL,
  reference_no text,
  credit numeric(18,2) NOT NULL DEFAULT 0,
  debit numeric(18,2) NOT NULL DEFAULT 0,
  balance_after_transaction numeric(18,2) NOT NULL DEFAULT 0,
  remarks text,
  status text NOT NULL DEFAULT 'completed',
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bank_transactions TO anon, authenticated;
GRANT ALL ON public.bank_transactions TO service_role;
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tx all access" ON public.bank_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_tx_bank_date ON public.bank_transactions(bank_id, date DESC);

-- Recalculate current_balance for a bank
CREATE OR REPLACE FUNCTION public.recalc_bank_balance(p_bank uuid)
RETURNS void LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_opening numeric(18,2); v_credit numeric(18,2); v_debit numeric(18,2);
BEGIN
  SELECT opening_balance INTO v_opening FROM public.banks WHERE id = p_bank;
  SELECT COALESCE(SUM(credit),0), COALESCE(SUM(debit),0)
    INTO v_credit, v_debit
    FROM public.bank_transactions WHERE bank_id = p_bank;
  UPDATE public.banks
    SET current_balance = COALESCE(v_opening,0) + v_credit - v_debit,
        updated_at = now()
    WHERE id = p_bank;
END; $$;

-- Trigger to update balance_after_transaction and bank current_balance
CREATE OR REPLACE FUNCTION public.on_bank_tx_change()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_bank uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN v_bank := OLD.bank_id;
  ELSE v_bank := NEW.bank_id; END IF;
  PERFORM public.recalc_bank_balance(v_bank);
  IF TG_OP <> 'DELETE' THEN
    UPDATE public.banks SET current_balance = current_balance WHERE id = v_bank;
    -- set balance_after_transaction to current bank balance snapshot
    UPDATE public.bank_transactions
      SET balance_after_transaction = (SELECT current_balance FROM public.banks WHERE id = v_bank)
      WHERE id = NEW.id;
  END IF;
  RETURN NULL;
END; $$;

CREATE TRIGGER trg_bank_tx_change
AFTER INSERT OR UPDATE OR DELETE ON public.bank_transactions
FOR EACH ROW EXECUTE FUNCTION public.on_bank_tx_change();

-- Recalculate when opening_balance changes
CREATE OR REPLACE FUNCTION public.on_bank_opening_change()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.opening_balance IS DISTINCT FROM OLD.opening_balance THEN
    PERFORM public.recalc_bank_balance(NEW.id);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_bank_opening_change
AFTER UPDATE OF opening_balance ON public.banks
FOR EACH ROW EXECUTE FUNCTION public.on_bank_opening_change();

-- =========== EMPLOYEES ===========
CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_code text NOT NULL UNIQUE,
  full_name text NOT NULL,
  father_name text,
  cnic text,
  email text,
  phone text,
  department text,
  designation text,
  bps int,
  joining_date date,
  basic_salary numeric(18,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  bank_id uuid REFERENCES public.banks(id) ON DELETE SET NULL,
  bank_account_no text,
  address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO anon, authenticated;
GRANT ALL ON public.employees TO service_role;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "employees all access" ON public.employees FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER trg_employees_updated BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========== ACTIVITY LOG ===========
CREATE TABLE public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  entity text,
  entity_id uuid,
  description text,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_log TO anon, authenticated;
GRANT ALL ON public.activity_log TO service_role;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity all access" ON public.activity_log FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_activity_created ON public.activity_log(created_at DESC);

-- =========== SEED BANKS ===========
INSERT INTO public.banks (name, account_title, branch, opening_balance, current_balance, status)
VALUES
  ('National Bank', 'AERC Operations', 'Main Branch', 0, 0, 'active'),
  ('Sindh Bank', 'AERC Payroll', 'City Branch', 0, 0, 'active'),
  ('Internal AERC Bank', 'AERC Internal', 'Head Office', 0, 0, 'active')
ON CONFLICT (name) DO NOTHING;
