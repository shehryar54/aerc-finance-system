import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useTaxSlabs, useUpsertTaxSlab, useDeleteTaxSlab, type TaxSlab } from "@/lib/queries";
import { formatMoney } from "@/lib/format";

export const Route = createFileRoute("/income-tax")({
  head: () => ({ meta: [
    { title: "Income Tax — Finance Hub" },
    { name: "description", content: "Configure progressive income tax slabs used in payroll calculation." },
    { property: "og:title", content: "Income Tax — Finance Hub" },
    { property: "og:description", content: "Manage annual salaried tax slabs and rates." },
  ]}),
  component: TaxPage,
});

function TaxPage() {
  const q = useTaxSlabs();
  const upsert = useUpsertTaxSlab();
  const del = useDeleteTaxSlab();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TaxSlab | undefined>();
  const [toDelete, setToDelete] = useState<TaxSlab | undefined>();
  const [form, setForm] = useState({ fiscal_year: "2024-25", min_income: "" as string | number, max_income: "" as string | number, base_tax: "" as string | number, rate_percent: "" as string | number, sort_order: "" as string | number });

  const rows = q.data ?? [];
  const fiscalYears = useMemo(() => Array.from(new Set(rows.map((r) => r.fiscal_year))), [rows]);

  const openNew = () => { setEditing(undefined); setForm({ fiscal_year: fiscalYears[0] ?? "2024-25", min_income: "", max_income: "", base_tax: "", rate_percent: "", sort_order: rows.length + 1 }); setOpen(true); };
  const openEdit = (t: TaxSlab) => { setEditing(t); setForm({ fiscal_year: t.fiscal_year, min_income: t.min_income, max_income: t.max_income ?? "", base_tax: t.base_tax, rate_percent: t.rate_percent, sort_order: t.sort_order }); setOpen(true); };
  const save = async () => {
    try {
      await upsert.mutateAsync({
        id: editing?.id, fiscal_year: String(form.fiscal_year),
        min_income: Number(form.min_income) || 0,
        max_income: form.max_income === "" ? null : Number(form.max_income),
        base_tax: Number(form.base_tax) || 0,
        rate_percent: Number(form.rate_percent) || 0,
        sort_order: Number(form.sort_order) || 0,
      });
      toast.success(editing ? "Slab updated" : "Slab added");
      setOpen(false);
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div><h1 className="text-2xl font-semibold tracking-tight">Income Tax</h1><p className="text-sm text-muted-foreground mt-1">Progressive salaried tax slabs applied on annualised gross salary during payroll.</p></div>
        <Button onClick={openNew}><Plus className="h-4 w-4" /> Add Slab</Button>
      </div>
      <Card className="glass-card"><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Fiscal Year</TableHead><TableHead className="text-right">Income From</TableHead>
            <TableHead className="text-right">Income To</TableHead><TableHead className="text-right">Base Tax</TableHead>
            <TableHead className="text-right">Rate</TableHead><TableHead className="text-right">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No slabs configured.</TableCell></TableRow>
            ) : rows.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-mono text-xs">{t.fiscal_year}</TableCell>
                <TableCell className="text-right">{formatMoney(t.min_income)}</TableCell>
                <TableCell className="text-right">{t.max_income == null ? "Above" : formatMoney(t.max_income)}</TableCell>
                <TableCell className="text-right">{formatMoney(t.base_tax)}</TableCell>
                <TableCell className="text-right">{t.rate_percent}%</TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setToDelete(t)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Slab" : "Add Slab"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><Label>Fiscal Year</Label><Input value={form.fiscal_year} onChange={(e) => setForm({ ...form, fiscal_year: e.target.value })} /></div>
            <div><Label>Sort Order</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} /></div>
            <div><Label>Income From (annual)</Label><Input type="number" step="0.01" value={form.min_income} onChange={(e) => setForm({ ...form, min_income: e.target.value })} /></div>
            <div><Label>Income To (blank = ∞)</Label><Input type="number" step="0.01" value={form.max_income} onChange={(e) => setForm({ ...form, max_income: e.target.value })} /></div>
            <div><Label>Base Tax</Label><Input type="number" step="0.01" value={form.base_tax} onChange={(e) => setForm({ ...form, base_tax: e.target.value })} /></div>
            <div><Label>Rate %</Label><Input type="number" step="0.001" value={form.rate_percent} onChange={(e) => setForm({ ...form, rate_percent: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={upsert.isPending}>{upsert.isPending ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Remove this slab?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { if (!toDelete) return; await del.mutateAsync(toDelete.id); toast.success("Removed"); setToDelete(undefined); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
