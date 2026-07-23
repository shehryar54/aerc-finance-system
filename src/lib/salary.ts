import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Employee } from "@/lib/queries";

export type SalaryRecord = {
  id: string;
  employee_id: string;
  period_year: number;
  period_month: number;
  working_days: number;
  basic_pay: number;
  allowances: Record<string, number>;
  deductions: Record<string, number>;
  leaves: { casual: number; sick: number; earned: number; unpaid: number };
  manual_deductions: {
    loan_recovery: number;
    income_tax: number;
    advance_salary: number;
    misc: number;
  };
  gross_pay: number;
  leave_deduction: number;
  total_deductions: number;
  net_pay: number;
  status: string;
  paid_at: string | null;
  bank_id: string | null;
  bank_account_no: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
};

export type SalaryFormula = {
  id: string;
  key: string;
  label: string;
  expression: string;
  description: string | null;
  updated_at: string;
};

// Human-friendly labels for allowance / deduction JSON keys
export const ALLOWANCE_LABELS: Record<string, string> = {
  house_rent: "House Rent Allowance",
  conveyance: "Conveyance Allowance",
  medical: "Medical Allowance",
  senior_post: "Senior Post Allowance",
  entertainment: "Entertainment Allowance",
  qualification: "Qualification Allowance",
  computer: "Computer Allowance",
  orderly: "Orderly Allowance",
  integrated: "Integrated Allowance",
  night_duty: "Night Duty & Other Allowance",
  adhoc_2022: "Ad-hoc Relief Allowance 2022",
  adhoc_2023: "Ad-hoc Relief Allowance 2023",
  adhoc_2024: "Ad-hoc Relief Allowance 2024",
  adhoc_2025: "Ad-hoc Relief Allowance 2025",
  incentive_child: "Incentive Award / Child Education",
  differential: "Differential Allowance",
  overtime: "Overtime / Leave Encashment",
  telephone: "Telephone Allowance",
};

export const DEDUCTION_LABELS: Record<string, string> = {
  provident_fund: "Provident Fund Subscription",
  withholding_tax: "Withholding Tax",
  pf_loan: "Loan – Provident Fund",
  housing_car_loan: "Deduction – Housing / Car Loan",
  other_adjustment: "Other Adjustment",
  salary_advance: "Salary Advance",
  kuts_membership: "KUTS / KUOWA Membership Fee",
  benevolent_fund: "KUTS Benevolent Fund",
  special: "Special Deduction",
};

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function monthLabel(y: number, m: number) {
  return `${MONTHS[m - 1]} ${y}`;
}

export const sumValues = (o: Record<string, number> | null | undefined) =>
  Object.values(o ?? {}).reduce((a, b) => a + Number(b || 0), 0);

// -------- Formula engine ---------------------------------------------------
// Evaluate a whitelisted arithmetic expression against a scope object.
// Only identifiers / numbers / dot access / basic operators allowed.
const SAFE_EXPR = /^[\s0-9a-zA-Z_.+\-*/(),%]+$/;

export function evalFormula(expression: string, scope: Record<string, unknown>): number {
  if (!SAFE_EXPR.test(expression)) throw new Error(`Unsafe expression: ${expression}`);
  const keys = Object.keys(scope);
  // eslint-disable-next-line no-new-func
  const fn = new Function(...keys, `"use strict"; return (${expression});`);
  const result = fn(...keys.map((k) => scope[k]));
  return Number.isFinite(result) ? Number(result) : 0;
}

export type ComputedTotals = {
  allowances_total: number;
  deductions_total: number;
  daily_salary: number;
  leave_deduction: number;
  gross_pay: number;
  total_deductions: number;
  net_pay: number;
};

export function computeSalary(
  rec: Pick<SalaryRecord, "basic_pay" | "working_days" | "allowances" | "deductions" | "leaves" | "manual_deductions">,
  formulas: SalaryFormula[],
): ComputedTotals {
  const byKey = Object.fromEntries(formulas.map((f) => [f.key, f.expression]));
  const allowances_total = sumValues(rec.allowances);
  const deductions_total = sumValues(rec.deductions);
  const scope: Record<string, unknown> = {
    basic_pay: Number(rec.basic_pay || 0),
    working_days: Math.max(1, Number(rec.working_days || 26)),
    allowances_total,
    deductions_total,
    leaves: rec.leaves ?? { casual: 0, sick: 0, earned: 0, unpaid: 0 },
    manual: rec.manual_deductions ?? { loan_recovery: 0, income_tax: 0, advance_salary: 0, misc: 0 },
  };
  const daily_salary = evalFormula(byKey.daily_salary ?? "basic_pay / working_days", scope);
  scope.daily_salary = daily_salary;
  const leave_deduction = evalFormula(byKey.leave_deduction ?? "daily_salary * leaves.unpaid", scope);
  scope.leave_deduction = leave_deduction;
  const gross_pay = evalFormula(byKey.gross_pay ?? "basic_pay + allowances_total", scope);
  scope.gross_pay = gross_pay;
  const total_deductions = evalFormula(
    byKey.total_deductions ??
      "deductions_total + leave_deduction + manual.loan_recovery + manual.income_tax + manual.advance_salary + manual.misc",
    scope,
  );
  scope.total_deductions = total_deductions;
  const net_pay = evalFormula(byKey.net_pay ?? "gross_pay - total_deductions", scope);
  return {
    allowances_total,
    deductions_total,
    daily_salary,
    leave_deduction: round2(leave_deduction),
    gross_pay: round2(gross_pay),
    total_deductions: round2(total_deductions),
    net_pay: round2(net_pay),
  };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

// -------- Hooks ------------------------------------------------------------

export function useSalaryFormulas() {
  return useQuery({
    queryKey: ["salary_formulas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("salary_formulas").select("*").order("key");
      if (error) throw error;
      return (data ?? []) as SalaryFormula[];
    },
  });
}

export function useUpsertFormula() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Partial<SalaryFormula> & { key: string; label: string; expression: string }) => {
      const { data, error } = await supabase.from("salary_formulas").upsert(row, { onConflict: "key" }).select().single();
      if (error) throw error;
      return data as SalaryFormula;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["salary_formulas"] }),
  });
}

export function useSalaryRecords(opts?: { year?: number; month?: number; employeeId?: string }) {
  const { year, month, employeeId } = opts ?? {};
  return useQuery({
    queryKey: ["salary_records", year, month, employeeId],
    queryFn: async () => {
      let q = supabase.from("salary_records").select("*").order("period_year", { ascending: false }).order("period_month", { ascending: false });
      if (year) q = q.eq("period_year", year);
      if (month) q = q.eq("period_month", month);
      if (employeeId) q = q.eq("employee_id", employeeId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as SalaryRecord[];
    },
  });
}

export function useUpsertSalaryRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Partial<SalaryRecord> & { employee_id: string; period_year: number; period_month: number }) => {
      const { data, error } = await supabase
        .from("salary_records")
        .upsert(row, { onConflict: "employee_id,period_year,period_month" })
        .select()
        .single();
      if (error) throw error;
      return data as SalaryRecord;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["salary_records"] }),
  });
}

export function useDeleteSalaryRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("salary_records").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["salary_records"] }),
  });
}

// Generate salary records for a month from active employees. Copies the
// previous month's components if a record exists, otherwise seeds from the
// employee's basic salary.
export function useGenerateMonthlySalaries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ year, month }: { year: number; month: number }) => {
      const { data: emps, error: eErr } = await supabase
        .from("employees")
        .select("*")
        .eq("status", "active");
      if (eErr) throw eErr;
      const employees = (emps ?? []) as Employee[];

      // previous month for template
      const pm = month === 1 ? 12 : month - 1;
      const py = month === 1 ? year - 1 : year;
      const { data: prev, error: pErr } = await supabase
        .from("salary_records")
        .select("*")
        .eq("period_year", py)
        .eq("period_month", pm);
      if (pErr) throw pErr;
      const prevMap = new Map((prev ?? []).map((r) => [r.employee_id, r as SalaryRecord]));

      const rows = employees.map((e) => {
        const p = prevMap.get(e.id);
        if (p) {
          return {
            employee_id: e.id,
            period_year: year,
            period_month: month,
            working_days: p.working_days,
            basic_pay: p.basic_pay,
            allowances: p.allowances,
            deductions: p.deductions,
            leaves: { casual: 0, sick: 0, earned: 0, unpaid: 0 },
            manual_deductions: { loan_recovery: 0, income_tax: 0, advance_salary: 0, misc: 0 },
            gross_pay: p.gross_pay,
            leave_deduction: 0,
            total_deductions: p.total_deductions,
            net_pay: p.net_pay,
            status: "draft",
          };
        }
        return {
          employee_id: e.id,
          period_year: year,
          period_month: month,
          working_days: 26,
          basic_pay: Number(e.basic_salary || 0),
          allowances: {},
          deductions: {},
          leaves: { casual: 0, sick: 0, earned: 0, unpaid: 0 },
          manual_deductions: { loan_recovery: 0, income_tax: 0, advance_salary: 0, misc: 0 },
          gross_pay: Number(e.basic_salary || 0),
          leave_deduction: 0,
          total_deductions: 0,
          net_pay: Number(e.basic_salary || 0),
          status: "draft",
        };
      });

      const { error: iErr } = await supabase
        .from("salary_records")
        .upsert(rows, { onConflict: "employee_id,period_year,period_month", ignoreDuplicates: true });
      if (iErr) throw iErr;
      return rows.length;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["salary_records"] }),
  });
}

// Simple integer -> words for Pakistan Rupees (basic).
export function amountInWords(n: number): string {
  const num = Math.round(Number(n) || 0);
  if (num === 0) return "Zero Rupees Only";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const two = (n: number): string => (n < 20 ? ones[n] : `${tens[Math.floor(n / 10)]}${n % 10 ? " " + ones[n % 10] : ""}`);
  const three = (n: number): string => (n >= 100 ? `${ones[Math.floor(n / 100)]} Hundred${n % 100 ? " " + two(n % 100) : ""}` : two(n));
  let x = num, out = "";
  const crore = Math.floor(x / 10000000); x %= 10000000;
  const lakh = Math.floor(x / 100000); x %= 100000;
  const thousand = Math.floor(x / 1000); x %= 1000;
  if (crore) out += `${three(crore)} Crore `;
  if (lakh) out += `${three(lakh)} Lakh `;
  if (thousand) out += `${three(thousand)} Thousand `;
  if (x) out += `${three(x)} `;
  return out.trim() + " Rupees Only";
}
