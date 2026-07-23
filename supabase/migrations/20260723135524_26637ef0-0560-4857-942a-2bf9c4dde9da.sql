
INSERT INTO public.account_heads (name, code, type) VALUES
  ('Salary Expense', 'EXP-SAL', 'expense'),
  ('Employee Payable', 'LIA-EMP', 'liability'),
  ('Opening Balance Equity', 'EQ-OPB', 'liability')
ON CONFLICT (code) DO NOTHING;

-- Bank tx trigger
CREATE OR REPLACE FUNCTION public.post_bank_tx_to_ledger()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_head uuid;
BEGIN
  IF TG_OP='DELETE' THEN
    DELETE FROM public.ledger_entries WHERE source_type='bank_tx' AND source_id=OLD.id;
    RETURN OLD;
  END IF;
  SELECT id INTO v_head FROM public.account_heads WHERE bank_id = NEW.bank_id LIMIT 1;
  IF v_head IS NULL THEN RETURN NEW; END IF;

  DELETE FROM public.ledger_entries WHERE source_type='bank_tx' AND source_id = NEW.id;

  IF NEW.reference_no IS NOT NULL AND EXISTS (SELECT 1 FROM public.payment_vouchers WHERE voucher_no = NEW.reference_no) THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.ledger_entries(entry_date, voucher_no, particulars, account_head_id, debit, credit, source_type, source_id, remarks)
  VALUES (NEW.date, NEW.reference_no, NEW.description, v_head, NEW.credit, NEW.debit, 'bank_tx', NEW.id, NEW.remarks);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_bank_tx_ledger ON public.bank_transactions;
CREATE TRIGGER trg_bank_tx_ledger AFTER INSERT OR UPDATE OR DELETE ON public.bank_transactions
FOR EACH ROW EXECUTE FUNCTION public.post_bank_tx_to_ledger();

-- Voucher trigger
CREATE OR REPLACE FUNCTION public.post_voucher_to_ledger()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP='DELETE' THEN
    DELETE FROM public.ledger_entries WHERE source_type='voucher' AND source_id=OLD.id;
    RETURN OLD;
  END IF;
  DELETE FROM public.ledger_entries WHERE source_type='voucher' AND source_id = NEW.id;
  IF NEW.status='paid' THEN
    INSERT INTO public.ledger_entries(entry_date, voucher_no, particulars, account_head_id, debit, credit, source_type, source_id, remarks)
    VALUES
      (COALESCE(NEW.voucher_date,CURRENT_DATE), NEW.voucher_no, NEW.purpose, NEW.debit_head_id, NEW.amount, 0, 'voucher', NEW.id, NEW.remarks),
      (COALESCE(NEW.voucher_date,CURRENT_DATE), NEW.voucher_no, NEW.purpose, NEW.credit_head_id, 0, NEW.amount, 'voucher', NEW.id, NEW.remarks);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_voucher_ledger ON public.payment_vouchers;
CREATE TRIGGER trg_voucher_ledger AFTER INSERT OR UPDATE OR DELETE ON public.payment_vouchers
FOR EACH ROW EXECUTE FUNCTION public.post_voucher_to_ledger();

-- Salary trigger
CREATE OR REPLACE FUNCTION public.post_salary_to_ledger()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_exp uuid; v_pay uuid; v_date date; v_ref text; v_particulars text; v_emp text;
BEGIN
  IF TG_OP='DELETE' THEN
    DELETE FROM public.ledger_entries WHERE source_type='salary' AND source_id=OLD.id;
    RETURN OLD;
  END IF;
  SELECT id INTO v_exp FROM public.account_heads WHERE code='EXP-SAL' LIMIT 1;
  SELECT id INTO v_pay FROM public.account_heads WHERE code='LIA-EMP' LIMIT 1;
  IF v_exp IS NULL OR v_pay IS NULL THEN RETURN NEW; END IF;
  SELECT COALESCE(full_name, employee_code) INTO v_emp FROM public.employees WHERE id = NEW.employee_id;
  v_date := make_date(NEW.period_year, NEW.period_month, 1);
  v_ref := 'SAL-'||to_char(v_date,'YYYYMM');
  v_particulars := 'Salary '||to_char(v_date,'Mon YYYY')||' — '||COALESCE(v_emp,'Employee');
  DELETE FROM public.ledger_entries WHERE source_type='salary' AND source_id=NEW.id;
  INSERT INTO public.ledger_entries(entry_date, voucher_no, particulars, account_head_id, debit, credit, source_type, source_id)
  VALUES
    (v_date, v_ref, v_particulars, v_exp, COALESCE(NEW.gross_pay,0), 0, 'salary', NEW.id),
    (v_date, v_ref, v_particulars, v_pay, 0, COALESCE(NEW.net_pay,0), 'salary', NEW.id);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_salary_ledger ON public.salary_sheet;
CREATE TRIGGER trg_salary_ledger AFTER INSERT OR UPDATE OR DELETE ON public.salary_sheet
FOR EACH ROW EXECUTE FUNCTION public.post_salary_to_ledger();

-- Bank opening
CREATE OR REPLACE FUNCTION public.post_bank_opening_to_ledger()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_head uuid; v_eq uuid;
BEGIN
  SELECT id INTO v_head FROM public.account_heads WHERE bank_id = NEW.id LIMIT 1;
  SELECT id INTO v_eq   FROM public.account_heads WHERE code='EQ-OPB' LIMIT 1;
  IF v_head IS NULL OR v_eq IS NULL THEN RETURN NEW; END IF;
  DELETE FROM public.ledger_entries WHERE source_type='opening' AND source_id=NEW.id;
  IF COALESCE(NEW.opening_balance,0) <> 0 THEN
    INSERT INTO public.ledger_entries(entry_date, voucher_no, particulars, account_head_id, debit, credit, source_type, source_id)
    VALUES
      (CURRENT_DATE,'OPB','Opening balance — '||NEW.name, v_head, NEW.opening_balance, 0,'opening',NEW.id),
      (CURRENT_DATE,'OPB','Opening balance — '||NEW.name, v_eq,   0, NEW.opening_balance,'opening',NEW.id);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_bank_opening_ledger ON public.banks;
CREATE TRIGGER trg_bank_opening_ledger AFTER INSERT OR UPDATE OF opening_balance ON public.banks
FOR EACH ROW EXECUTE FUNCTION public.post_bank_opening_to_ledger();

-- Backfill
DELETE FROM public.ledger_entries WHERE source_type IN ('bank_tx','voucher','salary','opening');

INSERT INTO public.ledger_entries(entry_date, voucher_no, particulars, account_head_id, debit, credit, source_type, source_id)
SELECT CURRENT_DATE,'OPB','Opening balance — '||b.name, ah.id, b.opening_balance, 0,'opening',b.id
FROM public.banks b JOIN public.account_heads ah ON ah.bank_id=b.id WHERE COALESCE(b.opening_balance,0)<>0;
INSERT INTO public.ledger_entries(entry_date, voucher_no, particulars, account_head_id, debit, credit, source_type, source_id)
SELECT CURRENT_DATE,'OPB','Opening balance — '||b.name,(SELECT id FROM public.account_heads WHERE code='EQ-OPB'),0,b.opening_balance,'opening',b.id
FROM public.banks b WHERE COALESCE(b.opening_balance,0)<>0;

INSERT INTO public.ledger_entries(entry_date, voucher_no, particulars, account_head_id, debit, credit, source_type, source_id, remarks)
SELECT t.date, t.reference_no, t.description, ah.id, t.credit, t.debit,'bank_tx',t.id,t.remarks
FROM public.bank_transactions t JOIN public.account_heads ah ON ah.bank_id=t.bank_id
WHERE NOT (t.reference_no IS NOT NULL AND EXISTS (SELECT 1 FROM public.payment_vouchers v WHERE v.voucher_no=t.reference_no));

INSERT INTO public.ledger_entries(entry_date, voucher_no, particulars, account_head_id, debit, credit, source_type, source_id, remarks)
SELECT v.voucher_date, v.voucher_no, v.purpose, v.debit_head_id, v.amount, 0,'voucher',v.id,v.remarks
FROM public.payment_vouchers v WHERE v.status='paid';
INSERT INTO public.ledger_entries(entry_date, voucher_no, particulars, account_head_id, debit, credit, source_type, source_id, remarks)
SELECT v.voucher_date, v.voucher_no, v.purpose, v.credit_head_id, 0, v.amount,'voucher',v.id,v.remarks
FROM public.payment_vouchers v WHERE v.status='paid';

INSERT INTO public.ledger_entries(entry_date, voucher_no, particulars, account_head_id, debit, credit, source_type, source_id)
SELECT make_date(s.period_year,s.period_month,1),
       'SAL-'||to_char(make_date(s.period_year,s.period_month,1),'YYYYMM'),
       'Salary '||to_char(make_date(s.period_year,s.period_month,1),'Mon YYYY')||' — '||COALESCE(e.full_name,e.employee_code),
       (SELECT id FROM public.account_heads WHERE code='EXP-SAL'),
       COALESCE(s.gross_pay,0),0,'salary',s.id
FROM public.salary_sheet s JOIN public.employees e ON e.id=s.employee_id;

INSERT INTO public.ledger_entries(entry_date, voucher_no, particulars, account_head_id, debit, credit, source_type, source_id)
SELECT make_date(s.period_year,s.period_month,1),
       'SAL-'||to_char(make_date(s.period_year,s.period_month,1),'YYYYMM'),
       'Salary '||to_char(make_date(s.period_year,s.period_month,1),'Mon YYYY')||' — '||COALESCE(e.full_name,e.employee_code),
       (SELECT id FROM public.account_heads WHERE code='LIA-EMP'),
       0,COALESCE(s.net_pay,0),'salary',s.id
FROM public.salary_sheet s JOIN public.employees e ON e.id=s.employee_id;
