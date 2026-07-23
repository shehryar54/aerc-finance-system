import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const monthLabel = (y: number, m: number) => `${MONTHS[m - 1]} ${y}`;

export type SalarySheetRow = {
  id: string;
  employee_id: string;
  period_year: number;
  period_month: number;
  basic_pay: number;
  house_rent: number;
  conveyance: number;
  medical: number;
  senior_post: number;
  entertainment: number;
  qualification: number;
  computer: number;
  orderly: number;
  integrated: number;
  night_duty: number;
  adhoc_2022: number;
  adhoc_2023: number;
  adhoc_2024: number;
  adhoc_2025: number;
  incentive_child: number;
  differential: number;
  overtime: number;
  telephone: number;
  provident_fund: number;
  income_tax: number;
  pf_loan: number;
  housing_car_loan: number;
  other_adjustment: number;
  salary_advance: number;
  kuts_kuowa: number;
  kuts_benevolent: number;
  special_deduction: number;
  gross_pay: number;
  total_deductions: number;
  net_pay: number;
  earn: number;
  without_flag: number;
  nafa: number;
  salary_switch: number;
  status: "draft" | "finalized" | "paid";
  paid_at: string | null;
  remarks: string | null;
};

export const EARNING_FIELDS: { key: keyof SalarySheetRow; label: string }[] = [
  { key: "basic_pay", label: "Basic Pay" },
  { key: "house_rent", label: "House Rent" },
  { key: "conveyance", label: "Conveyance" },
  { key: "medical", label: "Medical" },
  { key: "senior_post", label: "Senior Post" },
  { key: "entertainment", label: "Entertainment" },
  { key: "qualification", label: "Qualification" },
  { key: "computer", label: "Computer" },
  { key: "orderly", label: "Orderly" },
  { key: "integrated", label: "Integrated" },
  { key: "night_duty", label: "Night Duty" },
  { key: "adhoc_2022", label: "Ad-hoc 2022" },
  { key: "adhoc_2023", label: "Ad-hoc 2023" },
  { key: "adhoc_2024", label: "Ad-hoc 2024" },
  { key: "adhoc_2025", label: "Ad-hoc 2025" },
  { key: "incentive_child", label: "Incentive / Child" },
  { key: "differential", label: "Differential" },
  { key: "overtime", label: "Overtime" },
  { key: "telephone", label: "Telephone" },
];

export const DEDUCTION_FIELDS: { key: keyof SalarySheetRow; label: string }[] = [
  { key: "provident_fund", label: "Provident Fund" },
  { key: "income_tax", label: "Income Tax" },
  { key: "pf_loan", label: "PF Loan" },
  { key: "housing_car_loan", label: "Housing / Car Loan" },
  { key: "other_adjustment", label: "Other Adjustment" },
  { key: "salary_advance", label: "Salary Advance" },
  { key: "kuts_kuowa", label: "KUTS / KUOWA" },
  { key: "kuts_benevolent", label: "KUTS Benevolent" },
  { key: "special_deduction", label: "Special Deduction" },
];

export const EDITABLE_KEYS = [
  ...EARNING_FIELDS.map((f) => f.key),
  ...DEDUCTION_FIELDS.map((f) => f.key),
] as (keyof SalarySheetRow)[];

export function computeTotals(row: Partial<SalarySheetRow>) {
  const gross = EARNING_FIELDS.reduce((a, f) => a + Number(row[f.key] || 0), 0);
  const deductions = DEDUCTION_FIELDS.reduce((a, f) => a + Number(row[f.key] || 0), 0);
  return { gross_pay: gross, total_deductions: deductions, net_pay: gross - deductions };
}

export function useSalarySheet(year: number, month: number) {
  return useQuery({
    queryKey: ["salary_sheet", year, month],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("salary_sheet")
        .select("*")
        .eq("period_year", year)
        .eq("period_month", month)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SalarySheetRow[];
    },
  });
}

export function useSalarySheetForEmployee(employeeId?: string) {
  return useQuery({
    queryKey: ["salary_sheet_emp", employeeId],
    enabled: !!employeeId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("salary_sheet")
        .select("*")
        .eq("employee_id", employeeId!)
        .order("period_year", { ascending: false })
        .order("period_month", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SalarySheetRow[];
    },
  });
}

export function useUpdateSalarySheetCell() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<SalarySheetRow> }) => {
      const { data, error } = await (supabase as any)
        .from("salary_sheet")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data as SalarySheetRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["salary_sheet"] });
      qc.invalidateQueries({ queryKey: ["salary_sheet_emp"] });
    },
  });
}

export function useDeleteSalarySheetRow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("salary_sheet").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["salary_sheet"] });
      qc.invalidateQueries({ queryKey: ["salary_sheet_emp"] });
    },
  });
}

// Generate salary sheet rows for a month. If a previous month has data, seed
// this month by cloning those values. Otherwise seed from the employee's basic_salary.
export function useGenerateSalarySheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ year, month }: { year: number; month: number }) => {
      // Existing rows this month
      const { data: existing, error: e1 } = await (supabase as any)
        .from("salary_sheet")
        .select("employee_id")
        .eq("period_year", year)
        .eq("period_month", month);
      if (e1) throw e1;
      const have = new Set((existing ?? []).map((r: any) => r.employee_id));

      // All active employees
      const { data: emps, error: e2 } = await supabase
        .from("employees")
        .select("id, basic_salary, status")
        .eq("status", "active");
      if (e2) throw e2;

      // Most recent prior row per employee (for cloning)
      const { data: prior, error: e3 } = await (supabase as any)
        .from("salary_sheet")
        .select("*")
        .order("period_year", { ascending: false })
        .order("period_month", { ascending: false });
      if (e3) throw e3;
      const priorByEmp = new Map<string, SalarySheetRow>();
      for (const r of (prior ?? []) as SalarySheetRow[]) {
        if (r.period_year > year || (r.period_year === year && r.period_month >= month)) continue;
        if (!priorByEmp.has(r.employee_id)) priorByEmp.set(r.employee_id, r);
      }

      const toInsert: any[] = [];
      for (const e of emps ?? []) {
        if (have.has(e.id)) continue;
        const p = priorByEmp.get(e.id);
        if (p) {
          const {
            id: _id, gross_pay: _g, total_deductions: _t, net_pay: _n,
            created_at: _c, updated_at: _u, paid_at: _pa, status: _s,
            period_year: _py, period_month: _pm,
            ...clone
          } = p as any;
          toInsert.push({ ...clone, period_year: year, period_month: month, status: "draft", paid_at: null });
        } else {
          toInsert.push({
            employee_id: e.id, period_year: year, period_month: month,
            basic_pay: Number(e.basic_salary || 0), status: "draft",
          });
        }
      }
      if (toInsert.length === 0) return 0;
      const { error } = await (supabase as any).from("salary_sheet").insert(toInsert);
      if (error) throw error;
      return toInsert.length;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["salary_sheet"] }),
  });
}
