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
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAllowanceTypes, useUpsertAllowanceType, useDeleteAllowanceType, type AllowanceType } from "@/lib/queries";
import { Money, SensitiveToggle } from "@/lib/privacy";

export const Route = createFileRoute("/allowances")({
  head: () => ({ meta: [
    { title: "Allowances — Finance Hub" },
    { name: "description", content: "Configure salary allowance types, formulas and taxability." },
    { property: "og:title", content: "Allowances — Finance Hub" },
    { property: "og:description", content: "Allowance master data used in monthly payroll runs." },
  ]}),
  component: AllowancesPage,
});

function AllowancesPage() {
  const q = useAllowanceTypes();
  const upsert = useUpsertAllowanceType();
  const del = useDeleteAllowanceType();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AllowanceType | undefined>();
  const [toDelete, setToDelete] = useState<AllowanceType | undefined>();
  const [form, setForm] = useState({ name: "", code: "", amount_type: "fixed", amount: "" as string | number, taxable: true, status: "active" });

  const openNew = () => { setEditing(undefined); setForm({ name: "", code: "", amount_type: "fixed", amount: "", taxable: true, status: "active" }); setOpen(true); };
  const openEdit = (a: AllowanceType) => { setEditing(a); setForm({ name: a.name, code: a.code ?? "", amount_type: a.amount_type, amount: a.amount, taxable: a.taxable, status: a.status }); setOpen(true); };

  const save = async () => {
    if (!form.name.trim()) return toast.error("Name is required");
    try {
      await upsert.mutateAsync({ id: editing?.id, name: form.name, code: form.code || null, amount_type: form.amount_type, amount: Number(form.amount) || 0, taxable: form.taxable, status: form.status });
      toast.success(editing ? "Allowance updated" : "Allowance added");
      setOpen(false);
    } catch (e) { toast.error((e as Error).message); }
  };

  const rows = q.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Allowances</h1>
          <p className="text-sm text-muted-foreground mt-1">Master list of salary allowances used in payroll processing.</p>
        </div>
        <div className="flex gap-2"><SensitiveToggle /><Button onClick={openNew}><Plus className="h-4 w-4" /> Add Allowance</Button></div>
      </div>

      <Card className="glass-card"><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Name</TableHead><TableHead>Code</TableHead><TableHead>Type</TableHead>
            <TableHead className="text-right">Amount / %</TableHead><TableHead>Taxable</TableHead>
            <TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No allowance types yet.</TableCell></TableRow>
            ) : rows.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.name}</TableCell>
                <TableCell className="font-mono text-xs">{a.code ?? "—"}</TableCell>
                <TableCell className="capitalize">{a.amount_type.replace("_", " ")}</TableCell>
                <TableCell className="text-right">{a.amount_type === "percent_of_basic" ? `${a.amount}%` : <Money value={a.amount} />}</TableCell>
                <TableCell>{a.taxable ? <Badge variant="secondary">Taxable</Badge> : <Badge variant="outline">Exempt</Badge>}</TableCell>
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
          <DialogHeader><DialogTitle>{editing ? "Edit Allowance" : "Add Allowance"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Code</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
            <div>
              <Label>Amount Type</Label>
              <Select value={form.amount_type} onValueChange={(v) => setForm({ ...form, amount_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed amount</SelectItem>
                  <SelectItem value="percent_of_basic">% of basic salary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>{form.amount_type === "percent_of_basic" ? "Percent" : "Amount"}</Label><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
            <div className="flex items-center gap-3 pt-6"><Switch checked={form.taxable} onCheckedChange={(v) => setForm({ ...form, taxable: v })} /><Label>Taxable</Label></div>
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
          <AlertDialogHeader><AlertDialogTitle>Remove allowance "{toDelete?.name}"?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { if (!toDelete) return; await del.mutateAsync(toDelete.id); toast.success("Removed"); setToDelete(undefined); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
