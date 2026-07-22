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
