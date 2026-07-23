import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/queries";
import type { Role } from "@/lib/role";
import { ROLE_LABELS } from "@/lib/role";

export type Vendor = {
  id: string;
  name: string;
  contact_number: string | null;
  email: string | null;
  address: string | null;
  bank_name: string | null;
  bank_account_no: string | null;
  account_title: string | null;
  ntn: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type AccountHead = {
  id: string;
  name: string;
  code: string | null;
  type: "expense" | "asset" | "liability" | "income" | "equity" | "bank";
  bank_id: string | null;
  status: string;
};

export type VoucherStatus =
  | "draft"
  | "pending_director"
  | "pending_vc"
  | "approved"
  | "paid"
  | "rejected";

export type PaymentVoucher = {
  id: string;
  voucher_no: string;
  voucher_date: string;
  vendor_id: string | null;
  debit_head_id: string;
  credit_head_id: string;
  amount: number;
  purpose: string;
  description: string | null;
  payment_method: string;
  reference_no: string | null;
  remarks: string | null;
  status: VoucherStatus;
  requires_vc: boolean;
  director_approved_at: string | null;
  director_approved_by: string | null;
  vc_approved_at: string | null;
  vc_approved_by: string | null;
  paid_at: string | null;
  paid_by: string | null;
  rejected_at: string | null;
  rejected_by: string | null;
  rejection_reason: string | null;
  bank_tx_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type VoucherApproval = {
  id: string;
  voucher_id: string;
  action: string;
  actor_role: Role;
  actor_name: string | null;
  remarks: string | null;
  created_at: string;
};

// ---------- Vendors ----------
export function useVendors() {
  return useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vendors" as never).select("*").order("name");
      if (error) throw error;
      return (data ?? []) as unknown as Vendor[];
    },
  });
}

export function useUpsertVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: Partial<Vendor> & { id?: string }) => {
      if (v.id) {
        const { error } = await supabase.from("vendors" as never).update(v as never).eq("id", v.id);
        if (error) throw error;
        await logActivity("Vendor Updated", "vendor", v.id, v.name ?? "");
      } else {
        const { error } = await supabase.from("vendors" as never).insert(v as never);
        if (error) throw error;
        await logActivity("Vendor Added", "vendor", null, v.name ?? "");
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendors"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}

export function useDeleteVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vendors" as never).delete().eq("id", id);
      if (error) throw error;
      await logActivity("Vendor Removed", "vendor", id, "");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendors"] }),
  });
}

// ---------- Account heads ----------
export function useAccountHeads() {
  return useQuery({
    queryKey: ["account_heads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("account_heads" as never).select("*").eq("status", "active").order("name");
      if (error) throw error;
      return (data ?? []) as unknown as AccountHead[];
    },
  });
}

// ---------- Vouchers ----------
export function useVouchers() {
  return useQuery({
    queryKey: ["vouchers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_vouchers" as never)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as PaymentVoucher[];
    },
  });
}

export function useVoucher(id?: string) {
  return useQuery({
    queryKey: ["voucher", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("payment_vouchers" as never).select("*").eq("id", id as string).maybeSingle();
      if (error) throw error;
      return data as unknown as PaymentVoucher | null;
    },
  });
}

export function useVoucherApprovals(voucherId?: string) {
  return useQuery({
    queryKey: ["voucher_approvals", voucherId],
    enabled: !!voucherId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("voucher_approvals" as never)
        .select("*")
        .eq("voucher_id", voucherId as string)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as unknown as VoucherApproval[];
    },
  });
}

type CreateVoucherInput = {
  voucher_date: string;
  vendor_id: string | null;
  debit_head_id: string;
  credit_head_id: string;
  amount: number;
  purpose: string;
  description?: string | null;
  payment_method: string;
  reference_no?: string | null;
  remarks?: string | null;
  submit?: boolean; // if true, go straight to pending
};

export function useCreateVoucher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateVoucherInput & { actor_role: Role }) => {
      const status: VoucherStatus = input.submit
        ? input.amount > 100000
          ? "pending_director" // director first, then VC
          : "pending_director"
        : "draft";
      const { data, error } = await supabase
        .from("payment_vouchers" as never)
        .insert({
          voucher_date: input.voucher_date,
          vendor_id: input.vendor_id,
          debit_head_id: input.debit_head_id,
          credit_head_id: input.credit_head_id,
          amount: input.amount,
          purpose: input.purpose,
          description: input.description ?? null,
          payment_method: input.payment_method,
          reference_no: input.reference_no ?? null,
          remarks: input.remarks ?? null,
          status,
        } as never)
        .select()
        .single();
      if (error) throw error;
      const v = data as unknown as PaymentVoucher;
      if (input.submit) {
        await supabase.from("voucher_approvals" as never).insert({
          voucher_id: v.id,
          action: "submitted",
          actor_role: input.actor_role,
          actor_name: ROLE_LABELS[input.actor_role],
        } as never);
      }
      await logActivity(input.submit ? "Voucher Submitted" : "Voucher Drafted", "voucher", v.id, `${v.voucher_no} — ${input.purpose}`);
      return v;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vouchers"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}

export function useUpdateVoucher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<PaymentVoucher> & { id: string }) => {
      const { error } = await supabase.from("payment_vouchers" as never).update(input as never).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["vouchers"] });
      qc.invalidateQueries({ queryKey: ["voucher", v.id] });
    },
  });
}

export function useDeleteVoucher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payment_vouchers" as never).delete().eq("id", id);
      if (error) throw error;
      await logActivity("Voucher Deleted", "voucher", id, "");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vouchers"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}

// Approval actions
export function useVoucherAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      voucher: PaymentVoucher;
      action: "submit" | "director_approve" | "vc_approve" | "reject" | "pay";
      role: Role;
      remarks?: string;
    }) => {
      const { voucher, action, role, remarks } = args;
      const now = new Date().toISOString();
      const actorName = ROLE_LABELS[role];
      let patch: Partial<PaymentVoucher> = {};
      let logAction = action;

      if (action === "submit") {
        if (voucher.status !== "draft") throw new Error("Only drafts can be submitted");
        patch = { status: "pending_director" };
      } else if (action === "director_approve") {
        if (role !== "director" && role !== "admin") throw new Error("Only Director can approve at this step");
        if (voucher.status !== "pending_director") throw new Error("Voucher is not awaiting Director approval");
        patch = {
          director_approved_at: now,
          director_approved_by: actorName,
          status: voucher.requires_vc ? "pending_vc" : "approved",
        };
      } else if (action === "vc_approve") {
        if (role !== "vice_chancellor" && role !== "admin") throw new Error("Only Vice Chancellor can approve at this step");
        if (voucher.status !== "pending_vc") throw new Error("Voucher is not awaiting VC approval");
        patch = { vc_approved_at: now, vc_approved_by: actorName, status: "approved" };
      } else if (action === "reject") {
        if (voucher.status === "paid") throw new Error("Paid vouchers cannot be rejected");
        patch = { status: "rejected", rejected_at: now, rejected_by: actorName, rejection_reason: remarks ?? null };
      } else if (action === "pay") {
        if (voucher.status !== "approved") throw new Error("Voucher must be fully approved before payment");
        patch = { status: "paid", paid_by: actorName };
      }

      const { error } = await supabase.from("payment_vouchers" as never).update(patch as never).eq("id", voucher.id);
      if (error) throw error;
      await supabase.from("voucher_approvals" as never).insert({
        voucher_id: voucher.id,
        action: logAction,
        actor_role: role,
        actor_name: actorName,
        remarks: remarks ?? null,
      } as never);
      await logActivity(`Voucher ${logAction}`, "voucher", voucher.id, voucher.voucher_no);
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["vouchers"] });
      qc.invalidateQueries({ queryKey: ["voucher", v.voucher.id] });
      qc.invalidateQueries({ queryKey: ["voucher_approvals", v.voucher.id] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["banks"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}

export const STATUS_LABELS: Record<VoucherStatus, string> = {
  draft: "Draft",
  pending_director: "Pending Director",
  pending_vc: "Pending Vice Chancellor",
  approved: "Approved",
  paid: "Paid",
  rejected: "Rejected",
};

export const STATUS_TONES: Record<VoucherStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  pending_director: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  pending_vc: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  approved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  paid: "bg-primary/15 text-primary",
  rejected: "bg-destructive/15 text-destructive",
};
