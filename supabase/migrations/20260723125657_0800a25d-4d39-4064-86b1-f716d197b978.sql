
CREATE TABLE IF NOT EXISTS public.salary_sheet (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  period_year int NOT NULL,
  period_month int NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  basic_pay numeric(14,2) NOT NULL DEFAULT 0,
  house_rent numeric(14,2) NOT NULL DEFAULT 0,
  conveyance numeric(14,2) NOT NULL DEFAULT 0,
  medical numeric(14,2) NOT NULL DEFAULT 0,
  senior_post numeric(14,2) NOT NULL DEFAULT 0,
  entertainment numeric(14,2) NOT NULL DEFAULT 0,
  qualification numeric(14,2) NOT NULL DEFAULT 0,
  computer numeric(14,2) NOT NULL DEFAULT 0,
  orderly numeric(14,2) NOT NULL DEFAULT 0,
  integrated numeric(14,2) NOT NULL DEFAULT 0,
  night_duty numeric(14,2) NOT NULL DEFAULT 0,
  adhoc_2022 numeric(14,2) NOT NULL DEFAULT 0,
  adhoc_2023 numeric(14,2) NOT NULL DEFAULT 0,
  adhoc_2024 numeric(14,2) NOT NULL DEFAULT 0,
  adhoc_2025 numeric(14,2) NOT NULL DEFAULT 0,
  incentive_child numeric(14,2) NOT NULL DEFAULT 0,
  differential numeric(14,2) NOT NULL DEFAULT 0,
  overtime numeric(14,2) NOT NULL DEFAULT 0,
  telephone numeric(14,2) NOT NULL DEFAULT 0,
  provident_fund numeric(14,2) NOT NULL DEFAULT 0,
  income_tax numeric(14,2) NOT NULL DEFAULT 0,
  pf_loan numeric(14,2) NOT NULL DEFAULT 0,
  housing_car_loan numeric(14,2) NOT NULL DEFAULT 0,
  other_adjustment numeric(14,2) NOT NULL DEFAULT 0,
  salary_advance numeric(14,2) NOT NULL DEFAULT 0,
  kuts_kuowa numeric(14,2) NOT NULL DEFAULT 0,
  kuts_benevolent numeric(14,2) NOT NULL DEFAULT 0,
  special_deduction numeric(14,2) NOT NULL DEFAULT 0,
  gross_pay numeric(14,2) GENERATED ALWAYS AS (
    basic_pay+house_rent+conveyance+medical+senior_post+entertainment+qualification+
    computer+orderly+integrated+night_duty+adhoc_2022+adhoc_2023+adhoc_2024+adhoc_2025+
    incentive_child+differential+overtime+telephone
  ) STORED,
  total_deductions numeric(14,2) GENERATED ALWAYS AS (
    provident_fund+income_tax+pf_loan+housing_car_loan+other_adjustment+salary_advance+
    kuts_kuowa+kuts_benevolent+special_deduction
  ) STORED,
  net_pay numeric(14,2) GENERATED ALWAYS AS (
    (basic_pay+house_rent+conveyance+medical+senior_post+entertainment+qualification+
     computer+orderly+integrated+night_duty+adhoc_2022+adhoc_2023+adhoc_2024+adhoc_2025+
     incentive_child+differential+overtime+telephone)
    -
    (provident_fund+income_tax+pf_loan+housing_car_loan+other_adjustment+salary_advance+
     kuts_kuowa+kuts_benevolent+special_deduction)
  ) STORED,
  earn numeric(14,4) NOT NULL DEFAULT 0,
  without_flag numeric(14,4) NOT NULL DEFAULT 1,
  nafa numeric(14,2) NOT NULL DEFAULT 0,
  salary_switch numeric(14,4) NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'draft',
  paid_at timestamptz,
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(employee_id, period_year, period_month)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.salary_sheet TO anon, authenticated;
GRANT ALL ON public.salary_sheet TO service_role;
ALTER TABLE public.salary_sheet ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public salary_sheet" ON public.salary_sheet;
CREATE POLICY "public salary_sheet" ON public.salary_sheet FOR ALL USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS trg_salary_sheet_updated ON public.salary_sheet;
CREATE TRIGGER trg_salary_sheet_updated BEFORE UPDATE ON public.salary_sheet
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP POLICY IF EXISTS "auth manage salary_records" ON public.salary_records;
DROP POLICY IF EXISTS "public salary_records" ON public.salary_records;
CREATE POLICY "public salary_records" ON public.salary_records FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth manage salary_formulas" ON public.salary_formulas;
DROP POLICY IF EXISTS "public salary_formulas" ON public.salary_formulas;
CREATE POLICY "public salary_formulas" ON public.salary_formulas FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.salary_records TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.salary_formulas TO anon, authenticated;

WITH v(code, basic_pay, house_rent, conveyance, medical, senior_post, entertainment,
       qualification, computer, orderly, integrated, night_duty, adhoc_2022, adhoc_2023,
       adhoc_2024, adhoc_2025, incentive_child, differential, overtime, telephone,
       provident_fund, income_tax, pf_loan, housing_car_loan, other_adjustment,
       salary_advance, kuts_kuowa, kuts_benevolent, special_deduction, earn, without_flag,
       nafa, salary_switch) AS (
  VALUES
('R-207-23',225090,17469,0,4781,1350,700,25000,0,0,0,0,18482,67527,0,0,3500,39058,0,0,13260,6909,0,0,0,0,300,250,0,0,1,0,1),
('R-151-02',176060,15758,5000,4378,1250,600,25000,0,0,0,0,15099,52818,0,0,3000,31909,0,0,11950,4439,0,0,0,0,300,250,0,0,1,0,1),
('R-146-01',155990,15758,5000,3690,1250,600,25000,0,0,0,0,12542,46797,0,0,3000,26504,0,0,11950,3738,0,0,0,0,300,250,0,0,1,0,1),
('R-163-06',162680,15758,4833,3690,1250,600,25000,0,0,0,0,12999,48804,0,0,3500,27620,0,0,11950,4065,40506,0,0,0,300,250,0,0,1,0,1),
('R-144-01',155790,13284,5000,3690,0,500,25000,0,0,0,0,13914,46737,0,0,3500,29405,0,0,10660,3727,35564,0,9156,0,300,250,0,0,1,0,1),
('R-135-00',133140,13284,5000,3690,0,500,25000,0,0,0,0,11627,39942,0,0,3500,24571,0,1620,10660,2653,38544,0,0,0,300,250,0,0,1,0,1),
('R-180-11',133140,13284,5000,3690,0,500,25000,0,0,0,0,11627,39942,0,0,3500,24571,0,1630,10660,2855,0,4167,0,0,300,250,0,0,1,0,1),
('R-204-16',128610,13284,4344,3690,0,500,25000,0,0,0,0,11169,38583,0,0,3000,23604,0,1610,10660,2637,0,0,0,0,300,250,0,0,1,8528,1),
('R-206-16',124080,13284,5000,3000,0,500,25000,0,0,0,0,10712,37224,0,0,2500,22637,0,0,10660,2171,0,0,0,0,300,250,0,0,1,8528,1),
('R-205-16',124080,13284,4672,3000,0,500,25000,0,0,0,0,10712,37224,0,0,3000,22637,0,0,10660,2180,0,0,0,0,300,250,0,0,1,8528,1),
('R-164-06',119550,13284,5000,3000,0,500,25000,0,0,0,0,10254,35865,0,0,3500,21670,0,0,10660,2089,20000,0,0,0,300,250,0,0,1,0,1),
('R-182-11',128610,13284,5000,3000,0,500,25000,0,0,0,0,11169,38583,0,0,0,23604,0,0,10660,2501,33153,8334,0,0,300,250,0,0,1,0,1),
('R-183-11',128610,13284,5000,3000,0,500,25000,0,0,0,0,11169,38583,0,0,3500,23604,0,0,10660,2718,34067,4167,0,0,300,250,0,0,1,0,1),
('R-201-15',115020,13284,5000,3000,0,500,25000,0,0,0,0,9797,34506,0,0,0,20703,0,0,10660,1821,0,8334,0,0,300,250,0,0,1,0,1),
('R-181-11',128610,13284,4833,3000,0,500,25000,0,0,0,0,11169,38583,0,0,0,23604,0,0,10660,2268,29667,0,0,0,300,250,0,0,1,0,1),
('R-184-11',124080,13284,4677,3000,0,500,25000,0,0,0,0,10712,37224,0,0,3000,22637,0,0,10660,2222,30000,4167,0,0,300,250,0,0,1,0,1),
('R-157-04',133140,13284,4667,3000,0,500,25000,0,0,0,0,11627,39942,0,0,3500,24571,0,0,10660,2830,35551,0,0,0,300,250,0,0,1,0,1),
('R-162-06',124080,13284,5000,3000,0,500,25000,0,0,0,0,10488,37224,0,0,0,22165,0,0,10660,2113,0,0,0,0,300,250,0,0,1,0,1),
('R-199-15',101430,13284,5000,3000,0,500,25000,0,0,0,0,7905,30429,0,0,0,16706,0,0,10660,1390,24386,0,0,0,300,250,0,0,1,0,1),
('R-198-15',85070,11141,4194,2516,0,419,20968,0,0,0,0,6630,25521,0,0,0,14011,0,0,8941,6163,24478,0,0,0,300,250,0,0,0.838709677,0,1),
('R-119-92',160320,13284,5000,3816,0,500,5000,0,0,0,0,14372,48096,0,0,2500,30372,0,0,10660,3423,42739,0,0,0,300,250,0,0,1,0,1),
('R-200-15',0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0),
('A-178-05',103740,8715,5000,3000,0,0,0,0,0,0,0,8766,31122,0,0,0,18525,0,0,7960,882,30435,0,0,0,0,0,0,0,1,0,1),
('A-122-90',0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0),
('A-131-94',110050,6650,5000,3000,0,0,0,0,0,0,0,9731,33015,0,0,0,20564,0,0,6350,1071,30000,0,0,0,200,0,0,0,1,0,1),
('A-186-11',89530,6650,5000,3000,0,0,2500,0,0,0,0,7661,26859,0,0,0,16189,0,13200,6350,545,18647,4167,0,0,0,0,0,0,1,0,1),
('C-132-95',0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0),
('A-118-91',106630,6650,5000,3000,0,0,0,0,0,0,0,9386,31989,0,0,0,19835,0,0,6350,937,24899,4167,0,0,0,0,0,0,1,0,1),
('A-130-94',103210,6650,5000,3000,0,0,0,0,0,0,0,9041,30963,0,0,0,19106,0,0,6350,809,25087,4167,0,0,200,0,0,0,1,0,1),
('A-158-04',86700,8715,4839,3000,0,0,0,0,0,0,0,7044,26010,0,0,0,14886,0,0,7960,0,23085,8254,4656,0,0,0,0,0,1,0,1),
('A-152-02',79270,6650,5000,3000,0,0,0,0,0,0,0,6626,23781,0,0,0,14002,0,0,6350,358,40000,0,8292,0,0,0,0,0,1,0,1),
('A-175-06',57450,4091,0,3000,0,0,0,0,0,0,0,4889,20108,0,0,0,10331,0,0,4960,156,18169,0,0,0,0,0,0,1,1,0,1),
('A-165-06',57450,4091,5000,3000,0,0,0,0,0,0,0,4889,20108,0,0,0,10331,0,0,4960,156,17544,0,5148,0,0,0,0,0,1,0,1),
('A-138-00',59710,4091,5000,3000,0,0,0,0,0,0,0,5117,20899,0,0,0,10813,0,0,4960,193,18358,0,0,0,5,0,0,0,1,0,1),
('A-171-05',59710,4091,4839,3000,0,0,0,0,0,0,0,5117,20899,0,0,0,10813,0,0,4960,193,17039,0,0,0,0,0,0,0,1,0,1),
('A-193-12',50670,4091,4839,3000,0,0,0,0,0,0,0,4205,17735,0,0,0,8886,0,0,4960,0,13593,2500,0,0,0,0,0,0,1,0,1),
('A-174-06',59710,4091,5000,3000,0,0,0,0,0,0,0,5117,20899,0,0,0,10813,0,0,4960,196,16597,0,0,0,0,0,0,0,1,0,1),
('A-140-00',51640,3524,2856,3000,0,0,0,0,0,0,0,4413,18074,0,0,0,10106,0,0,4290,0,14793,0,5200,0,5,0,0,0,1,0,1),
('A-187-11',41630,4091,4839,3000,0,0,0,0,0,0,0,3293,14571,0,0,0,6958,0,0,4960,0,12255,2500,0,0,0,0,0,0,1,0,1),
('A-136-00',52110,3321,2856,3000,0,0,0,750,0,0,0,4559,18239,0,0,0,10439,0,0,3900,164,14040,0,5367,0,5,0,0,0,1,0,1),
('A-196-14',26510,2778,2856,3000,0,0,0,0,0,450,0,2150,9279,0,0,0,4922,0,0,1920,5,3776,0,2527,0,0,0,0,0,1,0,1),
('A-169-05',38280,2670,1932,3000,0,0,0,0,0,450,0,3384,13398,0,0,0,7749,0,0,1800,23,6134,0,0,0,0,0,0,0,1,0,1),
('A-160-04',41850,2670,1932,3000,0,0,0,0,0,450,100,3627,14648,0,0,0,8306,0,0,1800,29,6588,3000,0,0,0,0,0,0,1,0,1),
('A-134-96',0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0),
('A-141-00',36000,2579,1932,3000,0,0,0,0,0,0,0,3189,12600,0,0,0,7303,0,0,1700,19,6279,0,833,0,5,0,0,0,1,0,1),
('A-185-11',30890,2474,1932,3000,0,0,0,0,0,450,0,2712,10812,0,0,0,6210,0,0,1600,13,5483,0,0,0,0,0,0,0,1,0,1),
('A-168-05',29890,2474,1932,3000,0,0,0,0,0,450,0,2612,10462,0,0,0,5980,0,0,1600,11,5624,0,0,0,0,0,0,0,1,0,1),
('A-139-00',35890,2474,1868,3000,0,0,0,0,0,450,9500,3215,12562,0,0,0,7361,0,0,1600,27,5971,2500,0,0,5,0,0,0,1,0,1),
('A-127-93',38890,2474,1932,3000,0,0,0,0,0,450,0,3516,13612,0,0,0,8052,0,0,1600,24,6000,0,0,0,5,0,0,0,1,0,1),
('A-189-11',26890,2474,1932,3000,0,0,0,0,0,450,9500,2310,9412,0,0,0,5290,0,0,1600,13,4667,0,0,0,0,0,0,0,1,0,1),
('A-123-92',40890,2474,1932,3000,0,0,0,0,0,450,0,3662,14312,0,0,0,8385,0,0,1600,29,6782,2753,0,0,5,0,0,0,1,0,1),
('A-116-90',39890,2474,1932,3000,0,0,0,0,0,450,0,3570,13962,0,0,0,8175,0,0,1600,25,6564,0,0,0,5,0,0,0,1,0,1),
('A-173-05',28140,2384,1932,3000,0,0,0,0,0,450,9500,2472,9849,0,0,0,5661,0,0,1500,15,5115,0,0,0,0,0,0,0,1,0,1),
('A-190-11',0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0),
('A-192-12',0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0),
('A-161-06',29960,2384,1932,3000,0,0,0,0,0,450,0,2601,10486,0,0,0,5956,0,0,1500,11,5132,0,0,0,0,0,0,0,1,0,1),
('A-197-15',24160,2316,1932,3000,0,0,0,0,0,450,0,2097,8456,0,0,0,4802,0,0,1420,0,0,0,0,0,0,0,0,0,1,0,1),
('A-142-00',31720,2316,1932,3000,0,0,0,0,0,450,9500,2814,11102,0,0,0,6444,0,0,1420,22,5339,2500,0,0,5,0,0,0,1,0,1),
('A-195-14',22480,2316,910,3000,0,0,0,0,0,450,0,1914,7868,0,0,0,4383,0,0,1420,0,0,2500,0,0,0,0,0,1,1,0,1),
('A-170-05',25250,2187,1785,3000,0,0,0,0,0,450,0,2277,8838,0,0,0,5214,0,0,1230,1,4318,0,0,0,0,0,0,0,1,0,1),
('A-172-05',25250,2187,1785,3000,0,0,0,0,0,450,0,2277,8838,0,0,0,5214,0,0,1230,1,4224,0,0,0,0,0,0,0,1,0,1),
('A-188-11',21220,2120,1785,3000,0,0,0,0,0,450,0,1910,7427,0,0,0,4373,0,0,1150,0,3512,0,0,0,0,0,0,0,1,0,1),
('A-194-12',20640,2120,1726,3000,0,0,0,0,0,450,0,1842,7224,0,0,0,4218,0,0,1150,0,3000,2500,0,0,0,0,0,0,1,0,1)
)
INSERT INTO public.salary_sheet (
  employee_id, period_year, period_month,
  basic_pay, house_rent, conveyance, medical, senior_post, entertainment,
  qualification, computer, orderly, integrated, night_duty, adhoc_2022, adhoc_2023,
  adhoc_2024, adhoc_2025, incentive_child, differential, overtime, telephone,
  provident_fund, income_tax, pf_loan, housing_car_loan, other_adjustment,
  salary_advance, kuts_kuowa, kuts_benevolent, special_deduction, earn, without_flag, nafa, salary_switch
)
SELECT e.id, 2026, 6,
  v.basic_pay, v.house_rent, v.conveyance, v.medical, v.senior_post, v.entertainment,
  v.qualification, v.computer, v.orderly, v.integrated, v.night_duty, v.adhoc_2022, v.adhoc_2023,
  v.adhoc_2024, v.adhoc_2025, v.incentive_child, v.differential, v.overtime, v.telephone,
  v.provident_fund, v.income_tax, v.pf_loan, v.housing_car_loan, v.other_adjustment,
  v.salary_advance, v.kuts_kuowa, v.kuts_benevolent, v.special_deduction, v.earn, v.without_flag, v.nafa, v.salary_switch
FROM v JOIN public.employees e ON e.employee_code = v.code
ON CONFLICT (employee_id, period_year, period_month) DO NOTHING;
