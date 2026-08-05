import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
import { useDeductionTypes, useUpsertDeductionType, useDeleteDeductionType, type DeductionType } from "@/lib/queries";
import { Money, SensitiveToggle } from "@/lib/privacy";

export const Route = createFileRoute("/deductions")({
  head: () => ({ meta: [
    { title: "Deductions — Finance Hub" },
    { name: "description", content: "Configure salary deduction types applied in payroll." },
    { property: "og:title", content: "Deductions — Finance Hub" },
    { property: "og:description", content: "Master deduction rules for PF, EOBI, benevolent fund and more." },
  ]}),
  component: DeductionsPage,
});

function DeductionsPage() {
  const q = useDeductionTypes();
  const upsert = useUpsertDeductionType();
  const del = useDeleteDeductionType();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DeductionType | undefined>();
  const [toDelete, setToDelete] = useState<DeductionType | undefined>();
  const [form, setForm] = useState({ name: "", code: "", amount_type: "fixed", amount: "" as string | number, status: "active" });

  const openNew = () => { setEditing(undefined); setForm({ name: "", code: "", amount_type: "fixed", amount: "", status: "active" }); setOpen(true); };
  const openEdit = (a: DeductionType) => { setEditing(a); setForm({ name: a.name, code: a.code ?? "", amount_type: a.amount_type, amount: a.amount, status: a.status }); setOpen(true); };
  const save = async () => {
    if (!form.name.trim()) return toast.error("Name is required");
    try {
      await upsert.mutateAsync({ id: editing?.id, name: form.name, code: form.code || null, amount_type: form.amount_type, amount: Number(form.amount) || 0, status: form.status });
      toast.success(editing ? "Deduction updated" : "Deduction added");
      setOpen(false);
    } catch (e) { toast.error((e as Error).message); }
  };

  const rows = q.data ?? [];
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div><h1 className="text-2xl font-semibold tracking-tight">Deductions</h1><p className="text-sm text-muted-foreground mt-1">Master list of deductions applied during payroll processing.</p></div>
        <div className="flex gap-2"><SensitiveToggle /><Button onClick={openNew}><Plus className="h-4 w-4" /> Add Deduction</Button></div>
      </div>
      <Card className="glass-card"><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Name</TableHead><TableHead>Code</TableHead><TableHead>Type</TableHead>
            <TableHead className="text-right">Amount / %</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No deductions yet.</TableCell></TableRow>
            ) : rows.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.name}</TableCell>
                <TableCell className="font-mono text-xs">{a.code ?? "—"}</TableCell>
                <TableCell className="capitalize">{a.amount_type.replace("_", " ")}</TableCell>
                <TableCell className="text-right">{a.amount_type === "percent_of_basic" ? `${a.amount}%` : <Money value={a.amount} />}</TableCell>
                <TableCell><Badge variant={a.status === "active" ? "secondary" : "outline"} className="capitalize">{a.status}</Badge></TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(a)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setToDelete(a)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Deduction" : "Add Deduction"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Code</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
            <div>
              <Label>Amount Type</Label>
              <Select value={form.amount_type} onValueChange={(v) => setForm({ ...form, amount_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="fixed">Fixed amount</SelectItem><SelectItem value="percent_of_basic">% of basic salary</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>{form.amount_type === "percent_of_basic" ? "Percent" : "Amount"}</Label><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={upsert.isPending}>{upsert.isPending ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Remove deduction "{toDelete?.name}"?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { if (!toDelete) return; await del.mutateAsync(toDelete.id); toast.success("Removed"); setToDelete(undefined); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
