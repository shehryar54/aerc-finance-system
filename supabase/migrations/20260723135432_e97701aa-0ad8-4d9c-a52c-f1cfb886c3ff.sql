
DO $$ BEGIN ALTER TYPE account_head_type ADD VALUE IF NOT EXISTS 'expense'; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE account_head_type ADD VALUE IF NOT EXISTS 'liability'; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE account_head_type ADD VALUE IF NOT EXISTS 'income'; EXCEPTION WHEN others THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  voucher_no text,
  particulars text NOT NULL,
  account_head_id uuid NOT NULL REFERENCES public.account_heads(id) ON DELETE RESTRICT,
  debit numeric(18,2) NOT NULL DEFAULT 0,
  credit numeric(18,2) NOT NULL DEFAULT 0,
  folio text,
  source_type text NOT NULL DEFAULT 'manual',
  source_id uuid,
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ledger_account_date ON public.ledger_entries(account_head_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_ledger_source ON public.ledger_entries(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_ledger_date ON public.ledger_entries(entry_date);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ledger_entries TO anon, authenticated;
GRANT ALL ON public.ledger_entries TO service_role;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ledger_all" ON public.ledger_entries;
CREATE POLICY "ledger_all" ON public.ledger_entries FOR ALL USING (true) WITH CHECK (true);
