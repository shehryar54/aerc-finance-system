import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatMoney } from "@/lib/format";
import { useVendors, useAccountHeads, useCreateVoucher, type AccountHead } from "@/lib/vouchers";
import { useRole, ROLE_LABELS } from "@/lib/role";

export function VoucherCreateDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const vendors = useVendors().data ?? [];
  const heads = useAccountHeads().data ?? [];
  const create = useCreateVoucher();
  const { role } = useRole();

  const debitHeads = useMemo(() => heads.filter((h) => h.type === "expense" || h.type === "asset"), [heads]);
  const creditHeads = useMemo(() => heads.filter((h) => h.type === "bank" || h.type === "liability"), [heads]);

  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    voucher_date: today,
    vendor_id: null as string | null,
    debit_head_id: "",
    credit_head_id: "",
    amount: 0,
    purpose: "",
    description: "",
    payment_method: "bank_transfer",
    reference_no: "",
    remarks: "",
  });

  const requiresVc = form.amount > 100000;

  const submit = async (asDraft: boolean) => {
    if (!form.debit_head_id) return toast.error("Select a debit account head");
    if (!form.credit_head_id) return toast.error("Select a credit source");
    if (!form.amount || form.amount <= 0) return toast.error("Amount must be greater than zero");
    if (!form.purpose.trim()) return toast.error("Purpose is required");
    try {
      await create.mutateAsync({
        ...form,
        vendor_id: form.vendor_id || null,
        submit: !asDraft,
        actor_role: role,
      });
      toast.success(asDraft ? "Voucher saved as draft" : "Voucher submitted for approval");
      onOpenChange(false);
      setForm({ ...form, amount: 0, purpose: "", description: "", reference_no: "", remarks: "" });
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>New Voucher</DialogTitle>
          <p className="text-sm text-muted-foreground">Create a General Voucher. Amount decides approval route automatically.</p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase text-muted-foreground tracking-wider">Date</Label>
              <Input type="date" value={form.voucher_date} onChange={(e) => setForm({ ...form, voucher_date: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs uppercase text-muted-foreground tracking-wider">Amount (Rs.)</Label>
              <Input type="number" min={0} step="0.01" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} placeholder="0" />
            </div>

            <div>
              <Label className="text-xs uppercase text-muted-foreground tracking-wider">Debit — Account Head (Expense / Asset)</Label>
              <HeadSelect value={form.debit_head_id} onChange={(v) => setForm({ ...form, debit_head_id: v })} options={debitHeads} placeholder="— Select account —" />
            </div>
            <div>
              <Label className="text-xs uppercase text-muted-foreground tracking-wider">Credit — Paid From (Source)</Label>
              <HeadSelect value={form.credit_head_id} onChange={(v) => setForm({ ...form, credit_head_id: v })} options={creditHeads} placeholder="— Select account —" />
            </div>

            <div>
              <Label className="text-xs uppercase text-muted-foreground tracking-wider">Vendor (Optional)</Label>
              <Select value={form.vendor_id ?? "none"} onValueChange={(v) => setForm({ ...form, vendor_id: v === "none" ? null : v })}>
                <SelectTrigger><SelectValue placeholder="— None —" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase text-muted-foreground tracking-wider">Payment Method</Label>
              <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="online">Online / IBFT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label className="text-xs uppercase text-muted-foreground tracking-wider">Purpose *</Label>
              <Input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder="e.g. Payment for office supplies — Aug 2026" />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs uppercase text-muted-foreground tracking-wider">Description</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs uppercase text-muted-foreground tracking-wider">Reference #</Label>
              <Input value={form.reference_no} onChange={(e) => setForm({ ...form, reference_no: e.target.value })} placeholder="Cheque / IBFT #" />
            </div>
            <div>
              <Label className="text-xs uppercase text-muted-foreground tracking-wider">Remarks</Label>
              <Input value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
            </div>
          </div>

          <div className="rounded-xl border bg-muted/30 p-4 space-y-3 h-fit">
            <div className="font-semibold">Approval preview</div>
            <div>
              <div className="text-xs text-muted-foreground">Threshold</div>
              <div className="text-lg font-semibold">Rs. 100,000</div>
            </div>
            <div className={`rounded-md p-3 text-sm ${form.amount > 0 ? (requiresVc ? "bg-orange-500/10 text-orange-700 dark:text-orange-400" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400") : "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"}`}>
              {form.amount <= 0 ? "Enter an amount to preview the route." : requiresVc ? (
                <>Draft → <b>Director</b> → <b>Vice Chancellor</b> → Approved → Paid</>
              ) : (
                <>Draft → <b>Director</b> → Approved → Paid</>
              )}
            </div>
            <div className="border-t pt-3">
              <div className="text-xs uppercase text-muted-foreground tracking-wider mb-2">Journal preview</div>
              {form.debit_head_id && form.credit_head_id && form.amount > 0 ? (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between"><span>Dr {heads.find(h => h.id === form.debit_head_id)?.name}</span><span className="font-mono">{formatMoney(form.amount)}</span></div>
                  <div className="flex justify-between text-muted-foreground"><span>&nbsp;&nbsp;Cr {heads.find(h => h.id === form.credit_head_id)?.name}</span><span className="font-mono">{formatMoney(form.amount)}</span></div>
                </div>
              ) : <div className="text-sm text-muted-foreground">Pick accounts and amount.</div>}
            </div>
            <div className="border-t pt-3 text-xs text-muted-foreground">
              Acting as: <span className="font-medium text-foreground">{ROLE_LABELS[role]}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => submit(true)} disabled={create.isPending}>Save as draft</Button>
          <Button onClick={() => submit(false)} disabled={create.isPending}>{create.isPending ? "Submitting…" : "Submit for approval"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HeadSelect({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: AccountHead[]; placeholder: string }) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {options.map((h) => (
          <SelectItem key={h.id} value={h.id}>
            <span className="text-xs text-muted-foreground mr-2">{h.code}</span>{h.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
