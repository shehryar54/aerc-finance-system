
-- Fix stack-depth recursion: on_bank_tx_change updates bank_transactions which re-fires the trigger.
CREATE OR REPLACE FUNCTION public.on_bank_tx_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE v_bank uuid;
BEGIN
  -- Prevent trigger recursion (we self-UPDATE bank_transactions.balance_after_transaction below)
  IF pg_trigger_depth() > 1 THEN
    RETURN NULL;
  END IF;

  IF TG_OP = 'DELETE' THEN v_bank := OLD.bank_id;
  ELSE v_bank := NEW.bank_id; END IF;

  PERFORM public.recalc_bank_balance(v_bank);

  IF TG_OP <> 'DELETE' THEN
    UPDATE public.bank_transactions
      SET balance_after_transaction = (SELECT current_balance FROM public.banks WHERE id = v_bank)
      WHERE id = NEW.id;
  END IF;
  RETURN NULL;
END;
$function$;
