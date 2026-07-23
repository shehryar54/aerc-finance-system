
-- Fix payroll access: salary_records and salary_formulas were locked to
-- authenticated only, but this app runs unauthenticated (localStorage role).
-- Align them with the rest of the schema (public access).

DROP POLICY IF EXISTS "auth manage salary_records" ON public.salary_records;
DROP POLICY IF EXISTS "salary_records read" ON public.salary_records;
DROP POLICY IF EXISTS "salary_records write" ON public.salary_records;

CREATE POLICY "salary_records_all" ON public.salary_records
  FOR ALL TO public USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.salary_records TO anon, authenticated;
GRANT ALL ON public.salary_records TO service_role;

DROP POLICY IF EXISTS "auth manage salary_formulas" ON public.salary_formulas;
DROP POLICY IF EXISTS "salary_formulas read" ON public.salary_formulas;
DROP POLICY IF EXISTS "salary_formulas write" ON public.salary_formulas;

CREATE POLICY "salary_formulas_all" ON public.salary_formulas
  FOR ALL TO public USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.salary_formulas TO anon, authenticated;
GRANT ALL ON public.salary_formulas TO service_role;
