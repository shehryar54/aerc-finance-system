import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type LedgerEntry = {
  id: string;
  entry_date: string;
  voucher_no: string | null;
  particulars: string;
  account_head_id: string;
  debit: number;
  credit: number;
  folio: string | null;
  source_type: string;
  source_id: string | null;
  remarks: string | null;
  created_at: string;
};

export type LedgerFilters = {
  accountHeadId?: string | "all";
  from?: string;
  to?: string;
  search?: string;
  sourceType?: string | "all";
};

export function useLedgerEntries(filters: LedgerFilters = {}) {
  return useQuery({
    queryKey: ["ledger_entries", filters],
    queryFn: async () => {
      let q = supabase
        .from("ledger_entries")
        .select("*")
        .order("entry_date", { ascending: true })
        .order("created_at", { ascending: true });
      if (filters.accountHeadId && filters.accountHeadId !== "all") q = q.eq("account_head_id", filters.accountHeadId);
      if (filters.sourceType && filters.sourceType !== "all") q = q.eq("source_type", filters.sourceType);
      if (filters.from) q = q.gte("entry_date", filters.from);
      if (filters.to) q = q.lte("entry_date", filters.to);
      const { data, error } = await q;
      if (error) throw error;
      let rows = (data ?? []) as LedgerEntry[];
      if (filters.search) {
        const s = filters.search.toLowerCase();
        rows = rows.filter(
          (r) =>
            r.particulars.toLowerCase().includes(s) ||
            (r.voucher_no ?? "").toLowerCase().includes(s) ||
            (r.remarks ?? "").toLowerCase().includes(s),
        );
      }
      return rows;
    },
  });
}

export function useCreateLedgerEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      entry_date: string;
      voucher_no?: string | null;
      particulars: string;
      account_head_id: string;
      debit: number;
      credit: number;
      remarks?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("ledger_entries")
        .insert({ ...payload, source_type: "manual" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ledger_entries"] }),
  });
}

export function useDeleteLedgerEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ledger_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ledger_entries"] }),
  });
}

export function useUpdateLedgerEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<LedgerEntry> & { id: string }) => {
      const { error } = await supabase.from("ledger_entries").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ledger_entries"] }),
  });
}

/** Compute running balance for a linear list (assumed already sorted). */
export function withRunningBalance(rows: LedgerEntry[]) {
  let bal = 0;
  return rows.map((r) => {
    bal += Number(r.debit) - Number(r.credit);
    return { ...r, running: bal };
  });
}

export const SOURCE_LABELS: Record<string, string> = {
  manual: "Manual",
  voucher: "Voucher",
  bank_tx: "Bank",
  salary: "Salary",
  opening: "Opening",
};
