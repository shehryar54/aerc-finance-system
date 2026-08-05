import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Bank = {
  id: string;
  name: string;
  account_title: string | null;
  account_number: string | null;
  branch: string | null;
  opening_balance: number;
  current_balance: number;
  opening_effective_date: string | null;
  opening_remarks: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type BankTransaction = {
  id: string;
  bank_id: string;
  date: string;
  description: string;
  reference_no: string | null;
  credit: number;
  debit: number;
  balance_after_transaction: number;
  remarks: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
};

export type Employee = {
  id: string;
  employee_code: string;
  full_name: string;
  father_name: string | null;
  cnic: string | null;
  email: string | null;
  phone: string | null;
  department: string | null;
  designation: string | null;
  bps: number | null;
  joining_date: string | null;
  basic_salary: number;
  status: string;
  bank_id: string | null;
  bank_account_no: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
};

export type Activity = {
  id: string;
  action: string;
  entity: string | null;
  entity_id: string | null;
  description: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
};

// ---------- Banks ----------
export function useBanks() {
  return useQuery({
    queryKey: ["banks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("banks" as never).select("*").order("name");
      if (error) throw error;
      return (data ?? []) as unknown as Bank[];
    },
  });
}

export function useUpdateOpeningBalance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: string; opening_balance: number; opening_effective_date?: string; opening_remarks?: string }) => {
      const { error } = await supabase.from("banks" as never).update({
        opening_balance: args.opening_balance,
        opening_effective_date: args.opening_effective_date,
        opening_remarks: args.opening_remarks,
      } as never).eq("id", args.id);
      if (error) throw error;
      await logActivity("Opening Balance Updated", "bank", args.id, `Opening balance set to ${args.opening_balance}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["banks"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}

// ---------- Transactions ----------
export function useTransactions(bankId?: string) {
  return useQuery({
    queryKey: ["transactions", bankId ?? "all"],
    queryFn: async () => {
      let q = supabase.from("bank_transactions" as never).select("*").order("date", { ascending: false }).order("created_at", { ascending: false }).limit(500);
      if (bankId) q = q.eq("bank_id", bankId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as BankTransaction[];
    },
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tx: Partial<BankTransaction>) => {
      const { error } = await supabase.from("bank_transactions" as never).insert(tx as never);
      if (error) throw error;
      const kind = (tx.credit ?? 0) > 0 ? "Credit" : "Debit";
      await logActivity(`${kind} Recorded`, "bank_transaction", null, tx.description ?? "");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["banks"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}

export function useTransferFunds() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { fromBankId: string; toBankId: string; amount: number; description: string; reference?: string }) => {
      const ref = args.reference || `TRF-${Date.now()}`;
      // Guard: never let a transfer push the source bank into a negative balance.
      const { data: src, error: eSrc } = await supabase
        .from("banks" as never).select("name,current_balance").eq("id", args.fromBankId).single();
      if (eSrc) throw eSrc;
      const available = Number((src as unknown as Bank | null)?.current_balance ?? 0);
      if (args.amount > available) {
        throw new Error(
          `Insufficient balance in ${(src as unknown as Bank).name}. Available: ${available.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        );
      }
      const { error: e1 } = await supabase.from("bank_transactions" as never).insert({
        bank_id: args.fromBankId, description: `Transfer out: ${args.description}`, reference_no: ref, debit: args.amount, credit: 0,
      } as never);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("bank_transactions" as never).insert({
        bank_id: args.toBankId, description: `Transfer in: ${args.description}`, reference_no: ref, credit: args.amount, debit: 0,
      } as never);
      if (e2) throw e2;
      await logActivity("Bank Transfer", "bank", null, `${args.description} — ${args.amount}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["banks"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}

// ---------- Employees ----------
export function useEmployees() {
  return useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase.from("employees" as never).select("*").order("employee_code");
      if (error) throw error;
      return (data ?? []) as unknown as Employee[];
    },
  });
}

export function useUpsertEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (emp: Partial<Employee> & { id?: string }) => {
      if (emp.id) {
        const { error } = await supabase.from("employees" as never).update(emp as never).eq("id", emp.id);
        if (error) throw error;
        await logActivity("Employee Updated", "employee", emp.id, emp.full_name ?? "");
      } else {
        const { error } = await supabase.from("employees" as never).insert(emp as never);
        if (error) throw error;
        await logActivity("Employee Added", "employee", null, emp.full_name ?? "");
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("employees" as never).delete().eq("id", id);
      if (error) throw error;
      await logActivity("Employee Removed", "employee", id, "");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employees"] }),
  });
}

// ---------- Activity ----------
export async function logActivity(action: string, entity: string | null, entity_id: string | null, description: string) {
  await supabase.from("activity_log" as never).insert({ action, entity, entity_id, description } as never);
}

export function useActivity(limit = 15) {
  return useQuery({
    queryKey: ["activity", limit],
    queryFn: async () => {
      const { data, error } = await supabase.from("activity_log" as never).select("*").order("created_at", { ascending: false }).limit(limit);
      if (error) throw error;
      return (data ?? []) as unknown as Activity[];
    },
  });
}

// ---------- Generic CRUD helpers for new modules ----------
export type AllowanceType = { id: string; name: string; code: string | null; amount_type: string; amount: number; taxable: boolean; status: string; created_at: string; updated_at: string; };
export type DeductionType = { id: string; name: string; code: string | null; amount_type: string; amount: number; status: string; created_at: string; updated_at: string; };
export type Loan = { id: string; employee_id: string; loan_type: string; principal: number; monthly_installment: number; remaining_balance: number; start_date: string | null; end_date: string | null; status: string; remarks: string | null; created_at: string; updated_at: string; };
export type PfContribution = { id: string; employee_id: string; period: string; employee_share: number; employer_share: number; remarks: string | null; created_at: string; };
export type TaxSlab = { id: string; fiscal_year: string; min_income: number; max_income: number | null; base_tax: number; rate_percent: number; sort_order: number; created_at: string; };
export type PayrollRun = { id: string; period: string; status: string; employees_count: number; total_gross: number; total_allowances: number; total_deductions: number; total_tax: number; total_net: number; remarks: string | null; created_at: string; updated_at: string; };
export type OrgSettings = { id: string; organisation_name: string; address: string | null; currency: string; fiscal_year_start: string; contact_email: string | null; contact_phone: string | null; logo_url: string | null; updated_at: string; };

function useList<T>(table: string, opts?: { orderBy?: string; ascending?: boolean }) {
  return useQuery({
    queryKey: [table],
    queryFn: async () => {
      let q = supabase.from(table as never).select("*") as never;
      if (opts?.orderBy) q = (q as never as { order: (c: string, o: { ascending: boolean }) => unknown }).order(opts.orderBy, { ascending: opts.ascending ?? true }) as never;
      const { data, error } = await (q as { then: unknown } as Promise<{ data: T[] | null; error: Error | null }>);
      if (error) throw error;
      return (data ?? []) as T[];
    },
  });
}

function useUpsert<T extends { id?: string }>(table: string, entity: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Partial<T> & { id?: string }) => {
      if (row.id) {
        const { error } = await supabase.from(table as never).update(row as never).eq("id", row.id);
        if (error) throw error;
        await logActivity(`${entity} Updated`, entity, row.id, "");
      } else {
        const { error } = await supabase.from(table as never).insert(row as never);
        if (error) throw error;
        await logActivity(`${entity} Added`, entity, null, "");
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: [table] }); qc.invalidateQueries({ queryKey: ["activity"] }); },
  });
}

function useRemove(table: string, entity: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table as never).delete().eq("id", id);
      if (error) throw error;
      await logActivity(`${entity} Removed`, entity, id, "");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: [table] }); qc.invalidateQueries({ queryKey: ["activity"] }); },
  });
}

export const useAllowanceTypes = () => useList<AllowanceType>("allowance_types", { orderBy: "name" });
export const useUpsertAllowanceType = () => useUpsert<AllowanceType>("allowance_types", "allowance_type");
export const useDeleteAllowanceType = () => useRemove("allowance_types", "allowance_type");

export const useDeductionTypes = () => useList<DeductionType>("deduction_types", { orderBy: "name" });
export const useUpsertDeductionType = () => useUpsert<DeductionType>("deduction_types", "deduction_type");
export const useDeleteDeductionType = () => useRemove("deduction_types", "deduction_type");

export const useLoans = () => useList<Loan>("loans", { orderBy: "created_at", ascending: false });
export const useUpsertLoan = () => useUpsert<Loan>("loans", "loan");
export const useDeleteLoan = () => useRemove("loans", "loan");

export const usePfContributions = () => useList<PfContribution>("pf_contributions", { orderBy: "period", ascending: false });
export const useUpsertPf = () => useUpsert<PfContribution>("pf_contributions", "pf_contribution");
export const useDeletePf = () => useRemove("pf_contributions", "pf_contribution");

export const useTaxSlabs = () => useList<TaxSlab>("tax_slabs", { orderBy: "sort_order" });
export const useUpsertTaxSlab = () => useUpsert<TaxSlab>("tax_slabs", "tax_slab");
export const useDeleteTaxSlab = () => useRemove("tax_slabs", "tax_slab");

export const usePayrollRuns = () => useList<PayrollRun>("payroll_runs", { orderBy: "period", ascending: false });
export const useDeletePayrollRun = () => useRemove("payroll_runs", "payroll_run");

export function useOrgSettings() {
  return useQuery({
    queryKey: ["org_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("org_settings" as never).select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data as unknown as OrgSettings | null;
    },
  });
}
export function useUpdateOrgSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: Partial<OrgSettings> & { id: string }) => {
      const { error } = await supabase.from("org_settings" as never).update(s as never).eq("id", s.id);
      if (error) throw error;
      await logActivity("Settings Updated", "settings", s.id, "");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["org_settings"] }); qc.invalidateQueries({ queryKey: ["activity"] }); },
  });
}

// Generate a payroll run computing gross/tax/net from current employees + types + slabs
export function useGeneratePayrollRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { period: string; remarks?: string }) => {
      const [{ data: emps }, { data: allow }, { data: ded }, { data: slabs }] = await Promise.all([
        supabase.from("employees" as never).select("id, basic_salary, status").eq("status", "active"),
        supabase.from("allowance_types" as never).select("*").eq("status", "active"),
        supabase.from("deduction_types" as never).select("*").eq("status", "active"),
        supabase.from("tax_slabs" as never).select("*").order("sort_order"),
      ]);
      const employees = (emps ?? []) as unknown as { id: string; basic_salary: number }[];
      const allowances = (allow ?? []) as unknown as AllowanceType[];
      const deductions = (ded ?? []) as unknown as DeductionType[];
      const taxSlabs = (slabs ?? []) as unknown as TaxSlab[];

      let totalGross = 0, totalAllow = 0, totalDed = 0, totalTax = 0, totalNet = 0;
      for (const e of employees) {
        const basic = Number(e.basic_salary) || 0;
        const allowSum = allowances.reduce((s, a) => s + (a.amount_type === "percent_of_basic" ? basic * Number(a.amount) / 100 : Number(a.amount)), 0);
        const dedSum = deductions.reduce((s, d) => s + (d.amount_type === "percent_of_basic" ? basic * Number(d.amount) / 100 : Number(d.amount)), 0);
        const gross = basic + allowSum;
        const annual = gross * 12;
        let tax = 0;
        for (const sl of taxSlabs) {
          const max = sl.max_income ?? Infinity;
          if (annual > sl.min_income) {
            const taxable = Math.min(annual, max) - sl.min_income;
            tax = Number(sl.base_tax) + taxable * Number(sl.rate_percent) / 100;
          }
        }
        const monthlyTax = tax / 12;
        const net = gross - dedSum - monthlyTax;
        totalGross += basic; totalAllow += allowSum; totalDed += dedSum; totalTax += monthlyTax; totalNet += net;
      }

      const { error } = await supabase.from("payroll_runs" as never).insert({
        period: args.period, status: "processed", employees_count: employees.length,
        total_gross: totalGross, total_allowances: totalAllow, total_deductions: totalDed,
        total_tax: totalTax, total_net: totalNet, remarks: args.remarks ?? null,
      } as never);
      if (error) throw error;
      await logActivity("Payroll Run Generated", "payroll_run", null, `${args.period}: ${employees.length} employees`);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payroll_runs"] }); qc.invalidateQueries({ queryKey: ["activity"] }); },
  });
}
