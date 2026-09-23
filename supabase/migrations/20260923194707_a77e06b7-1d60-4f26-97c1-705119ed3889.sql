UPDATE public.account_heads SET hec_code = v.hec FROM (VALUES
 ('EXP-001','A03901'),('EXP-002','A03807'),('EXP-003','A13001'),('EXP-004','A03303'),
 ('EXP-005','A03805'),('EXP-006','A03902'),('EXP-007','A03919'),('EXP-999','A03970')
) AS v(code, hec) WHERE public.account_heads.code = v.code;