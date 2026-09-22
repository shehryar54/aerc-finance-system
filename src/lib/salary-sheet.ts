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
  custom_allowances: Record<string, number> | null;
  status: "draft" | "finalized" | "paid";
  paid_at: string | null;
  remarks: string | null;
};

/** Distinct dynamic Ad-hoc / custom allowance names present in the given rows. */
export function customAllowanceKeys(rows: SalarySheetRow[]): string[] {
  const set = new Set<string>();
  for (const r of rows) {
    for (const k of Object.keys(r.custom_allowances ?? {})) set.add(k);
  }
  return Array.from(set).sort();
}

export const customValue = (row: Partial<SalarySheetRow>, key: string) =>
  Number((row.custom_allowances ?? {})[key] ?? 0);

export const customTotal = (row: Partial<SalarySheetRow>) =>
  Object.values(row.custom_allowances ?? {}).reduce((a, v) => a + Number(v || 0), 0);

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
  const gross = EARNING_FIELDS.reduce((a, f) => a + Number(row[f.key] || 0), 0) + customTotal(row);
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

// Generate salary sheet rows for a month. Basic Pay and every component are
// derived from the employee's most recent earlier salary-sheet record; employees
// with no salary history start with a blank row that can be filled in-place.
export function useGenerateSalarySheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ year, month }: { year: number; month: number }) => {
      const { data: existing, error: e1 } = await (supabase as any)
        .from("salary_sheet")
        .select("employee_id")
        .eq("period_year", year)
        .eq("period_month", month);
      if (e1) throw e1;
      const have = new Set((existing ?? []).map((r: any) => r.employee_id));

      const { data: emps, error: e2 } = await supabase
        .from("employees")
        .select("id, status")
        .eq("status", "active");
      if (e2) throw e2;

      // Most recent prior row per employee (source of Basic Pay & all components)
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
            employee_id: e.id, period_year: year, period_month: month, status: "draft",
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

// ---------- Dynamic Ad-hoc management ----------

/** Legacy fixed ad-hoc columns that can take part in a merge. */
export const LEGACY_ADHOC_KEYS = ["adhoc_2022", "adhoc_2023", "adhoc_2024", "adhoc_2025"] as const;

async function rowsFromMonth(year: number, month: number) {
  const { data, error } = await (supabase as any)
    .from("salary_sheet")
    .select("*")
    .or(`period_year.gt.${year},and(period_year.eq.${year},period_month.gte.${month})`);
  if (error) throw error;
  return (data ?? []) as SalarySheetRow[];
}

async function applyPatches(patches: { id: string; patch: Record<string, unknown> }[]) {
  for (const p of patches) {
    const { error } = await (supabase as any).from("salary_sheet").update(p.patch).eq("id", p.id);
    if (error) throw error;
  }
  return patches.length;
}

/** Merge selected ad-hoc columns (legacy and/or custom) into one new named Ad-hoc,
 *  from the given month onward. Earlier months are left untouched. */
export function useMergeAdhoc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      year, month, sources, targetName,
    }: { year: number; month: number; sources: string[]; targetName: string }) => {
      const name = targetName.trim();
      if (!name) throw new Error("Enter a name for the merged Ad-hoc");
      if (sources.length < 2) throw new Error("Select at least two Ad-hoc columns to merge");

      const rows = await rowsFromMonth(year, month);
      const patches = rows.map((r) => {
        const custom = { ...(r.custom_allowances ?? {}) };
        let sum = 0;
        const patch: Record<string, unknown> = {};
        for (const s of sources) {
          if ((LEGACY_ADHOC_KEYS as readonly string[]).includes(s)) {
            sum += Number((r as any)[s] || 0);
            patch[s] = 0;
          } else {
            sum += Number(custom[s] || 0);
            delete custom[s];
          }
        }
        custom[name] = Number((custom[name] ?? 0)) + sum;
        patch.custom_allowances = custom;
        return { id: r.id, patch };
      });
      return applyPatches(patches);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["salary_sheet"] });
      qc.invalidateQueries({ queryKey: ["salary_sheet_emp"] });
    },
  });
}

/** Create a new Ad-hoc allowance from the given month onward, either as a
 *  percentage of each employee's Basic Pay or as one fixed amount. */
export function useCreateAdhoc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      year, month, name, mode, value,
    }: {
      year: number; month: number; name: string;
      mode: "percent_of_basic" | "fixed"; value: number;
    }) => {
      const label = name.trim();
      if (!label) throw new Error("Enter a name for the new Ad-hoc");
      if (!Number.isFinite(value) || value < 0) throw new Error("Enter a valid amount");
      if (mode === "percent_of_basic" && value > 100) throw new Error("Percentage cannot exceed 100");

      const rows = await rowsFromMonth(year, month);
      if (rows.length === 0) throw new Error("No salary rows exist for this month — generate them first");
      if (rows.some((r) => Object.keys(r.custom_allowances ?? {}).includes(label))) {
        throw new Error(`An Ad-hoc named "${label}" already exists for this period`);
      }
      const patches = rows.map((r) => {
        const amount = mode === "percent_of_basic"
          ? Math.round(Number(r.basic_pay || 0) * value) / 100
          : value;
        return {
          id: r.id,
          patch: { custom_allowances: { ...(r.custom_allowances ?? {}), [label]: amount } },
        };
      });
      return applyPatches(patches);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["salary_sheet"] });
      qc.invalidateQueries({ queryKey: ["salary_sheet_emp"] });
    },
  });
}

/** Remove a dynamic Ad-hoc from the given month onward. */
export function useRemoveAdhoc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ year, month, name }: { year: number; month: number; name: string }) => {
      const rows = await rowsFromMonth(year, month);
      const patches = rows
        .filter((r) => Object.keys(r.custom_allowances ?? {}).includes(name))
        .map((r) => {
          const custom = { ...(r.custom_allowances ?? {}) };
          delete custom[name];
          return { id: r.id, patch: { custom_allowances: custom } };
        });
      return applyPatches(patches);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["salary_sheet"] });
      qc.invalidateQueries({ queryKey: ["salary_sheet_emp"] });
    },
  });
}
