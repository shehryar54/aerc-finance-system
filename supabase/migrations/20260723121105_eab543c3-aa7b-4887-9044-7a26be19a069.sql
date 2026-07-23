
-- ============ ENUMS ============
CREATE TYPE public.voucher_status AS ENUM (
  'draft', 'pending_director', 'pending_vc', 'approved', 'paid', 'rejected'
);

CREATE TYPE public.account_head_type AS ENUM (
  'expense', 'asset', 'liability', 'income', 'equity', 'bank'
);

CREATE TYPE public.approval_role AS ENUM (
  'payroll_officer', 'director', 'vice_chancellor', 'admin'
);

-- ============ VENDORS ============
CREATE TABLE public.vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_number text,
  email text,
  address text,
  bank_name text,
  bank_account_no text,
  account_title text,
  ntn text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendors TO authenticated, anon;
GRANT ALL ON public.vendors TO service_role;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vendors_all" ON public.vendors FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER trg_vendors_updated_at BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ ACCOUNT HEADS ============
CREATE TABLE public.account_heads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE,
  type public.account_head_type NOT NULL,
  bank_id uuid REFERENCES public.banks(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.account_heads TO authenticated, anon;
GRANT ALL ON public.account_heads TO service_role;
ALTER TABLE public.account_heads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "account_heads_all" ON public.account_heads FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER trg_account_heads_updated_at BEFORE UPDATE ON public.account_heads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed default expense heads
INSERT INTO public.account_heads (name, code, type) VALUES
  ('Office Supplies', 'EXP-001', 'expense'),
  ('Fuel & Vehicle', 'EXP-002', 'expense'),
  ('Repairs & Maintenance', 'EXP-003', 'expense'),
  ('Utilities (Electricity/Internet)', 'EXP-004', 'expense'),
  ('Travel & Conveyance', 'EXP-005', 'expense'),
  ('Printing & Stationery', 'EXP-006', 'expense'),
  ('Professional Fees', 'EXP-007', 'expense'),
  ('Miscellaneous', 'EXP-999', 'expense');

-- Auto-create an account head for each existing bank
INSERT INTO public.account_heads (name, code, type, bank_id)
  SELECT 'Bank: ' || b.name, 'BNK-' || substr(b.id::text, 1, 8), 'bank', b.id
  FROM public.banks b;

-- Trigger to auto-create bank account head when a new bank is added
CREATE OR REPLACE FUNCTION public.on_bank_insert_create_head()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  INSERT INTO public.account_heads (name, code, type, bank_id)
  VALUES ('Bank: ' || NEW.name, 'BNK-' || substr(NEW.id::text, 1, 8), 'bank', NEW.id);
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_bank_after_insert AFTER INSERT ON public.banks
  FOR EACH ROW EXECUTE FUNCTION public.on_bank_insert_create_head();

-- ============ PAYMENT VOUCHERS ============
CREATE SEQUENCE IF NOT EXISTS public.voucher_seq;

CREATE TABLE public.payment_vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_no text NOT NULL UNIQUE,
  voucher_date date NOT NULL DEFAULT CURRENT_DATE,
  vendor_id uuid REFERENCES public.vendors(id) ON DELETE SET NULL,
  debit_head_id uuid NOT NULL REFERENCES public.account_heads(id),
  credit_head_id uuid NOT NULL REFERENCES public.account_heads(id),
  amount numeric(18,2) NOT NULL CHECK (amount > 0),
  purpose text NOT NULL,
  description text,
  payment_method text NOT NULL DEFAULT 'bank_transfer',
  reference_no text,
  remarks text,
  status public.voucher_status NOT NULL DEFAULT 'draft',
  requires_vc boolean NOT NULL DEFAULT false,
  director_approved_at timestamptz,
  director_approved_by text,
  vc_approved_at timestamptz,
  vc_approved_by text,
  paid_at timestamptz,
  paid_by text,
  rejected_at timestamptz,
  rejected_by text,
  rejection_reason text,
  bank_tx_id uuid REFERENCES public.bank_transactions(id) ON DELETE SET NULL,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_vouchers TO authenticated, anon;
GRANT ALL ON public.payment_vouchers TO service_role;
ALTER TABLE public.payment_vouchers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vouchers_all" ON public.payment_vouchers FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER trg_vouchers_updated_at BEFORE UPDATE ON public.payment_vouchers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto voucher number + requires_vc flag
CREATE OR REPLACE FUNCTION public.on_voucher_before_insert()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_seq bigint;
  v_ym text;
BEGIN
  IF NEW.voucher_no IS NULL OR NEW.voucher_no = '' THEN
    v_seq := nextval('public.voucher_seq');
    v_ym := to_char(COALESCE(NEW.voucher_date, CURRENT_DATE), 'YYYYMM');
    NEW.voucher_no := 'VCH-' || v_ym || '-' || lpad(v_seq::text, 4, '0');
  END IF;
  NEW.requires_vc := (NEW.amount > 100000);
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_voucher_before_insert BEFORE INSERT ON public.payment_vouchers
  FOR EACH ROW EXECUTE FUNCTION public.on_voucher_before_insert();

-- ============ VOUCHER APPROVALS LOG ============
CREATE TABLE public.voucher_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id uuid NOT NULL REFERENCES public.payment_vouchers(id) ON DELETE CASCADE,
  action text NOT NULL, -- submitted, director_approved, vc_approved, paid, rejected
  actor_role public.approval_role NOT NULL,
  actor_name text,
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.voucher_approvals TO authenticated, anon;
GRANT ALL ON public.voucher_approvals TO service_role;
ALTER TABLE public.voucher_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "voucher_approvals_all" ON public.voucher_approvals FOR ALL USING (true) WITH CHECK (true);

-- ============ Auto bank tx on paid ============
CREATE OR REPLACE FUNCTION public.on_voucher_status_change()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_bank_id uuid;
  v_tx_id uuid;
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS DISTINCT FROM 'paid') AND NEW.bank_tx_id IS NULL THEN
    SELECT bank_id INTO v_bank_id FROM public.account_heads WHERE id = NEW.credit_head_id;
    IF v_bank_id IS NOT NULL THEN
      INSERT INTO public.bank_transactions (bank_id, date, description, reference_no, debit, credit, remarks)
        VALUES (v_bank_id, COALESCE(NEW.voucher_date, CURRENT_DATE),
                'Voucher ' || NEW.voucher_no || ' — ' || NEW.purpose,
                NEW.voucher_no, NEW.amount, 0, NEW.remarks)
        RETURNING id INTO v_tx_id;
      NEW.bank_tx_id := v_tx_id;
    END IF;
    NEW.paid_at := COALESCE(NEW.paid_at, now());
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_voucher_status_change BEFORE UPDATE ON public.payment_vouchers
  FOR EACH ROW WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION public.on_voucher_status_change();
