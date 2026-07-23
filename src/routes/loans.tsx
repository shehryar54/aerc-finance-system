import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useEmployees, useLoans, useUpsertLoan, useDeleteLoan, type Loan } from "@/lib/queries";
import { formatMoney, formatDate } from "@/lib/format";

export const Route = createFileRoute("/loans")({
  head: () => ({ meta: [
    { title: "Loans — Finance Hub" },
    { name: "description", content: "Manage employee loans, installments and outstanding balances." },
    { property: "og:title", content: "Loans — Finance Hub" },
    { property: "og:description", content: "Track employee loan advances, repayments and status." },
  ]}),
  component: LoansPage,
});

function LoansPage() {
  const q = useLoans();
  const empQ = useEmployees();
  const upsert = useUpsertLoan();
  const del = useDeleteLoan();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Loan | undefined>();
  const [toDelete, setToDelete] = useState<Loan | undefined>();
  const empty = { employee_id: "", loan_type: "general", principal: "" as string | number, monthly_installment: "" as string | number, remaining_balance: "" as string | number, start_date: "", end_date: "", status: "active", remarks: "" };
  const [form, setForm] = useState(empty);

  const empMap = useMemo(() => new Map((empQ.data ?? []).map((e) => [e.id, e])), [empQ.data]);

  const openNew = () => { setEditing(undefined); setForm(empty); setOpen(true); };
  const openEdit = (l: Loan) => { setEditing(l); setForm({ employee_id: l.employee_id, loan_type: l.loan_type, principal: l.principal, monthly_installment: l.monthly_installment, remaining_balance: l.remaining_balance, start_date: l.start_date ?? "", end_date: l.end_date ?? "", status: l.status, remarks: l.remarks ?? "" }); setOpen(true); };
  const save = async () => {
    if (!form.employee_id) return toast.error("Employee is required");
    try {
      await upsert.mutateAsync({
        id: editing?.id, employee_id: form.employee_id, loan_type: form.loan_type,
        principal: Number(form.principal) || 0, monthly_installment: Number(form.monthly_installment) || 0,
        remaining_balance: Number(form.remaining_balance) || Number(form.principal) || 0,
        start_date: form.start_date || null, end_date: form.end_date || null,
        status: form.status, remarks: form.remarks || null,
      });
      toast.success(editing ? "Loan updated" : "Loan added");
      setOpen(false);
    } catch (e) { toast.error((e as Error).message); }
  };

  const rows = q.data ?? [];
  const totalOutstanding = rows.reduce((s, l) => s + Number(l.remaining_balance), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div><h1 className="text-2xl font-semibold tracking-tight">Loans</h1><p className="text-sm text-muted-foreground mt-1">Employee loan advances and monthly deductions. Total outstanding: <b>{formatMoney(totalOutstanding)}</b>.</p></div>
        <Button onClick={openNew}><Plus className="h-4 w-4" /> Add Loan</Button>
      </div>
      <Card className="glass-card"><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Employee</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Principal</TableHead>
            <TableHead className="text-right">Installment</TableHead><TableHead className="text-right">Remaining</TableHead>
            <TableHead>Start</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground">No loans recorded yet.</TableCell></TableRow>
            ) : rows.map((l) => {
              const e = empMap.get(l.employee_id);
              return (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{e?.full_name ?? "—"}<div className="text-xs text-muted-foreground">{e?.employee_code}</div></TableCell>
                  <TableCell className="capitalize">{l.loan_type}</TableCell>
                  <TableCell className="text-right">{formatMoney(l.principal)}</TableCell>
                  <TableCell className="text-right">{formatMoney(l.monthly_installment)}</TableCell>
                  <TableCell className="text-right">{formatMoney(l.remaining_balance)}</TableCell>
                  <TableCell>{formatDate(l.start_date)}</TableCell>
                  <TableCell><Badge variant={l.status === "active" ? "secondary" : "outline"} className="capitalize">{l.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(l)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setToDelete(l)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Edit Loan" : "Add Loan"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <Label>Employee</Label>
              <Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>{(empQ.data ?? []).map((e) => <SelectItem key={e.id} value={e.id}>{e.full_name} — {e.employee_code}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Loan Type</Label>
              <Select value={form.loan_type} onValueChange={(v) => setForm({ ...form, loan_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="house">House Building</SelectItem>
                  <SelectItem value="vehicle">Vehicle</SelectItem>
                  <SelectItem value="advance">Salary Advance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="closed">Closed</SelectItem><SelectItem value="defaulted">Defaulted</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Principal</Label><Input type="number" step="0.01" value={form.principal} onChange={(e) => setForm({ ...form, principal: e.target.value })} /></div>
            <div><Label>Monthly Installment</Label><Input type="number" step="0.01" value={form.monthly_installment} onChange={(e) => setForm({ ...form, monthly_installment: e.target.value })} /></div>
            <div><Label>Remaining Balance</Label><Input type="number" step="0.01" value={form.remaining_balance} onChange={(e) => setForm({ ...form, remaining_balance: e.target.value })} /></div>
            <div><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
            <div><Label>End Date</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Remarks</Label><Input value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={upsert.isPending}>{upsert.isPending ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Remove this loan?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { if (!toDelete) return; await del.mutateAsync(toDelete.id); toast.success("Removed"); setToDelete(undefined); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
