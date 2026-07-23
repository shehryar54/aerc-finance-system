import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, Trash2, Printer, CheckCircle2, XCircle, Wallet, Send, FileText, Filter } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { formatMoney, formatDate } from "@/lib/format";
import {
  useVouchers, useAccountHeads, useVendors, useVoucherAction, useDeleteVoucher, useVoucherApprovals,
  STATUS_LABELS, STATUS_TONES, type PaymentVoucher, type VoucherStatus,
} from "@/lib/vouchers";
import { VoucherCreateDialog } from "@/components/vouchers/voucher-create-dialog";
import { VoucherPrintDialog } from "@/components/vouchers/voucher-print-dialog";
import { useRole } from "@/lib/role";

export const Route = createFileRoute("/vouchers")({
  head: () => ({ meta: [
    { title: "Payment Vouchers — Finance Hub" },
    { name: "description", content: "Create, approve and pay vendor payment vouchers with a role-based approval workflow." },
    { property: "og:title", content: "Payment Vouchers — Finance Hub" },
    { property: "og:description", content: "Draft, approve and pay vouchers with Director / VC approval routing." },
  ]}),
  component: VouchersPage,
});

function VouchersPage() {
  const vq = useVouchers();
  const heads = useAccountHeads().data ?? [];
  const vendors = useVendors().data ?? [];
  const action = useVoucherAction();
  const del = useDeleteVoucher();
  const { role } = useRole();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<VoucherStatus | "all">("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [printVoucher, setPrintVoucher] = useState<PaymentVoucher | null>(null);
  const [rejectVoucher, setRejectVoucher] = useState<PaymentVoucher | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [toDelete, setToDelete] = useState<PaymentVoucher | null>(null);

  const approvalsQ = useVoucherApprovals(printVoucher?.id);

  const rows = vq.data ?? [];
  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim();
    return rows.filter((v) => {
      if (statusFilter !== "all" && v.status !== statusFilter) return false;
      if (!s) return true;
      const vendor = vendors.find((vn) => vn.id === v.vendor_id)?.name ?? "";
      return [v.voucher_no, v.purpose, v.reference_no, vendor].some((f) => (f ?? "").toLowerCase().includes(s));
    });
  }, [rows, search, statusFilter, vendors]);

  const stats = useMemo(() => {
    const pending = rows.filter((r) => r.status === "pending_director" || r.status === "pending_vc").length;
    const approved = rows.filter((r) => r.status === "approved").length;
    const paid = rows.filter((r) => r.status === "paid").length;
    const paidAmount = rows.filter((r) => r.status === "paid").reduce((s, r) => s + Number(r.amount), 0);
    return { pending, approved, paid, paidAmount };
  }, [rows]);

  const doAction = async (voucher: PaymentVoucher, kind: "submit" | "director_approve" | "vc_approve" | "pay") => {
    try {
      await action.mutateAsync({ voucher, action: kind, role });
      toast.success("Done");
    } catch (e) { toast.error((e as Error).message); }
  };

  const confirmReject = async () => {
    if (!rejectVoucher) return;
    try {
      await action.mutateAsync({ voucher: rejectVoucher, action: "reject", role, remarks: rejectReason });
      toast.success("Voucher rejected");
      setRejectVoucher(null); setRejectReason("");
    } catch (e) { toast.error((e as Error).message); }
  };

  const canDirector = role === "director" || role === "admin";
  const canVC = role === "vice_chancellor" || role === "admin";
  const canPay = role === "payroll_officer" || role === "admin";

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Payment Vouchers</h1>
          <p className="text-sm text-muted-foreground mt-1">Amounts &gt; Rs. 100,000 require Director and Vice Chancellor approval; smaller amounts require only Director.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> New Voucher</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Pending Approvals" value={stats.pending.toString()} tone="amber" />
        <StatCard label="Approved (unpaid)" value={stats.approved.toString()} tone="emerald" />
        <StatCard label="Paid Vouchers" value={stats.paid.toString()} tone="primary" />
        <StatCard label="Total Paid" value={formatMoney(stats.paidAmount)} tone="primary" />
      </div>

      <Card className="glass-card"><CardContent className="p-3 flex flex-col md:flex-row gap-2 items-stretch md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search voucher #, purpose, vendor…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as VoucherStatus | "all")}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {(Object.keys(STATUS_LABELS) as VoucherStatus[]).map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </CardContent></Card>

      <Card className="glass-card"><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Voucher #</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Purpose</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                <div className="flex flex-col items-center gap-2"><FileText className="h-6 w-6" /> No vouchers match your filters.</div>
              </TableCell></TableRow>
            ) : filtered.map((v) => {
              const vendor = vendors.find((x) => x.id === v.vendor_id);
              return (
                <TableRow key={v.id}>
                  <TableCell className="font-mono text-xs">{v.voucher_no}</TableCell>
                  <TableCell>{formatDate(v.voucher_date)}</TableCell>
                  <TableCell>{vendor?.name ?? "—"}</TableCell>
                  <TableCell className="max-w-[260px] truncate" title={v.purpose}>{v.purpose}</TableCell>
                  <TableCell className="text-right font-semibold">{formatMoney(v.amount)}</TableCell>
                  <TableCell><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_TONES[v.status]}`}>{STATUS_LABELS[v.status]}</span></TableCell>
                  <TableCell className="text-right space-x-1">
                    {v.status === "draft" && (
                      <Button size="sm" variant="secondary" onClick={() => doAction(v, "submit")}><Send className="h-3.5 w-3.5" /> Submit</Button>
                    )}
                    {v.status === "pending_director" && canDirector && (
                      <Button size="sm" onClick={() => doAction(v, "director_approve")}><CheckCircle2 className="h-3.5 w-3.5" /> Approve</Button>
                    )}
                    {v.status === "pending_vc" && canVC && (
                      <Button size="sm" onClick={() => doAction(v, "vc_approve")}><CheckCircle2 className="h-3.5 w-3.5" /> VC Approve</Button>
                    )}
                    {v.status === "approved" && canPay && (
                      <Button size="sm" onClick={() => doAction(v, "pay")}><Wallet className="h-3.5 w-3.5" /> Mark Paid</Button>
                    )}
                    {(v.status === "pending_director" || v.status === "pending_vc" || v.status === "approved") && (canDirector || canVC) && (
                      <Button size="sm" variant="ghost" onClick={() => setRejectVoucher(v)}><XCircle className="h-3.5 w-3.5 text-destructive" /></Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => setPrintVoucher(v)}><Printer className="h-3.5 w-3.5" /></Button>
                    {(v.status === "draft" || v.status === "rejected") && (
                      <Button size="icon" variant="ghost" onClick={() => setToDelete(v)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent></Card>

      <VoucherCreateDialog open={createOpen} onOpenChange={setCreateOpen} />

      <VoucherPrintDialog
        open={!!printVoucher}
        onOpenChange={(o) => !o && setPrintVoucher(null)}
        voucher={printVoucher}
        vendor={vendors.find((v) => v.id === printVoucher?.vendor_id) ?? null}
        debitHead={heads.find((h) => h.id === printVoucher?.debit_head_id) ?? null}
        creditHead={heads.find((h) => h.id === printVoucher?.credit_head_id) ?? null}
        approvals={approvalsQ.data ?? []}
      />

      <AlertDialog open={!!rejectVoucher} onOpenChange={(o) => { if (!o) { setRejectVoucher(null); setRejectReason(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject voucher {rejectVoucher?.voucher_no}?</AlertDialogTitle>
            <AlertDialogDescription>Provide a short reason. This will be logged on the approval trail.</AlertDialogDescription>
          </AlertDialogHeader>
          <Input placeholder="Reason for rejection" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReject} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Reject</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete voucher {toDelete?.voucher_no}?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { if (!toDelete) return; await del.mutateAsync(toDelete.id); toast.success("Deleted"); setToDelete(null); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone: "amber" | "emerald" | "primary" }) {
  const toneClasses = {
    amber: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    emerald: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    primary: "bg-primary/10 text-primary",
  }[tone];
  return (
    <Card className="glass-card"><CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div><div className="text-xs text-muted-foreground">{label}</div><div className="text-lg font-semibold mt-1">{value}</div></div>
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${toneClasses}`}><FileText className="h-5 w-5" /></div>
      </div>
    </CardContent></Card>
  );
}
