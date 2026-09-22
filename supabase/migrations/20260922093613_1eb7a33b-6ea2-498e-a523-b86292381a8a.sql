-- 1. Dynamic ad-hoc / custom allowances on salary_sheet
ALTER TABLE public.salary_sheet
  ADD COLUMN IF NOT EXISTS custom_allowances jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Drop generated expressions (keeps existing data as plain columns)
ALTER TABLE public.salary_sheet ALTER COLUMN gross_pay DROP EXPRESSION IF EXISTS;
ALTER TABLE public.salary_sheet ALTER COLUMN total_deductions DROP EXPRESSION IF EXISTS;
ALTER TABLE public.salary_sheet ALTER COLUMN net_pay DROP EXPRESSION IF EXISTS;

ALTER TABLE public.salary_sheet ALTER COLUMN gross_pay SET DEFAULT 0;
ALTER TABLE public.salary_sheet ALTER COLUMN total_deductions SET DEFAULT 0;
ALTER TABLE public.salary_sheet ALTER COLUMN net_pay SET DEFAULT 0;

CREATE OR REPLACE FUNCTION public.salary_sheet_recalc()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_custom numeric(18,2) := 0;
BEGIN
  IF NEW.custom_allowances IS NULL THEN
    NEW.custom_allowances := '{}'::jsonb;
  END IF;

  SELECT COALESCE(SUM(COALESCE((value)::text::numeric, 0)), 0)
    INTO v_custom
    FROM jsonb_each(NEW.custom_allowances)
    WHERE jsonb_typeof(value) = 'number';

  NEW.gross_pay :=
      COALESCE(NEW.basic_pay,0) + COALESCE(NEW.house_rent,0) + COALESCE(NEW.conveyance,0)
    + COALESCE(NEW.medical,0) + COALESCE(NEW.senior_post,0) + COALESCE(NEW.entertainment,0)
    + COALESCE(NEW.qualification,0) + COALESCE(NEW.computer,0) + COALESCE(NEW.orderly,0)
    + COALESCE(NEW.integrated,0) + COALESCE(NEW.night_duty,0)
    + COALESCE(NEW.adhoc_2022,0) + COALESCE(NEW.adhoc_2023,0)
    + COALESCE(NEW.adhoc_2024,0) + COALESCE(NEW.adhoc_2025,0)
    + COALESCE(NEW.incentive_child,0) + COALESCE(NEW.differential,0)
    + COALESCE(NEW.overtime,0) + COALESCE(NEW.telephone,0)
    + v_custom;

  NEW.total_deductions :=
      COALESCE(NEW.provident_fund,0) + COALESCE(NEW.income_tax,0) + COALESCE(NEW.pf_loan,0)
    + COALESCE(NEW.housing_car_loan,0) + COALESCE(NEW.other_adjustment,0)
    + COALESCE(NEW.salary_advance,0) + COALESCE(NEW.kuts_kuowa,0)
    + COALESCE(NEW.kuts_benevolent,0) + COALESCE(NEW.special_deduction,0);

  NEW.net_pay := NEW.gross_pay - NEW.total_deductions;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_salary_sheet_recalc ON public.salary_sheet;
CREATE TRIGGER trg_salary_sheet_recalc
  BEFORE INSERT OR UPDATE ON public.salary_sheet
  FOR EACH ROW EXECUTE FUNCTION public.salary_sheet_recalc();

-- One-time recalculation of existing rows
UPDATE public.salary_sheet SET updated_at = now();

-- 2. HEC / NAM reporting code on account heads
ALTER TABLE public.account_heads
  ADD COLUMN IF NOT EXISTS hec_code text;

UPDATE public.account_heads SET hec_code = 'A01101' WHERE code = 'EXP-SAL' AND hec_code IS NULL;
UPDATE public.account_heads SET hec_code = 'G06201' WHERE code = 'LIA-EMP' AND hec_code IS NULL;
UPDATE public.account_heads SET hec_code = 'E01101' WHERE code = 'EQ-OPB' AND hec_code IS NULL;
UPDATE public.account_heads SET hec_code = 'F01101' WHERE type = 'bank' AND hec_code IS NULL;
UPDATE public.account_heads SET hec_code = 'A03000' WHERE type = 'expense' AND hec_code IS NULL;
UPDATE public.account_heads SET hec_code = 'C02000' WHERE type = 'income' AND hec_code IS NULL;
UPDATE public.account_heads SET hec_code = 'G00000' WHERE type = 'liability' AND hec_code IS NULL;
UPDATE public.account_heads SET hec_code = 'F00000' WHERE type = 'asset' AND hec_code IS NULL;
UPDATE public.account_heads SET hec_code = 'E00000' WHERE type = 'equity' AND hec_code IS NULL;