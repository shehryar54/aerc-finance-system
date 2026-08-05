-- Restore the opening balance that was accidentally zeroed for National Bank,
-- which is what pushed its running balance negative.
UPDATE public.banks
SET opening_balance = 2000000000.00,
    opening_remarks = COALESCE(opening_remarks, 'Restored opening balance (was reset to 0 in error)')
WHERE name = 'National Bank' AND opening_balance = 0;

-- Recalculate all bank balances from opening + transactions
DO $$
DECLARE b RECORD;
BEGIN
  FOR b IN SELECT id FROM public.banks LOOP
    PERFORM public.recalc_bank_balance(b.id);
  END LOOP;
END $$;