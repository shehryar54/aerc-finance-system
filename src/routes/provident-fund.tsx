import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useEmployees, usePfContributions, useUpsertPf, useDeletePf, type PfContribution } from "@/lib/queries";
import { formatMoney, formatDate } from "@/lib/format";

export const Route = createFileRoute("/provident-fund")({
  head: () => ({ meta: [
    { title: "Provident Fund — Finance Hub" },
    { name: "description", content: "Track employee and employer provident fund contributions." },
    { property: "og:title", content: "Provident Fund — Finance Hub" },
    { property: "og:description", content: "Monthly PF ledger per employee." },
  ]}),
  component: PfPage,
});

function PfPage() {
  const q = usePfContributions();
  const empQ = useEmployees();
  const upsert = useUpsertPf();
  const del = useDeletePf();
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<PfContribution | undefined>();
  const [form, setForm] = useState({ employee_id: "", period: "", employee_share: "" as string | number, employer_share: "" as string | number, remarks: "" });

  const empMap = useMemo(() => new Map((empQ.data ?? []).map((e) => [e.id, e])), [empQ.data]);
  const rows = q.data ?? [];
  const totalEmp = rows.reduce((s, r) => s + Number(r.employee_share), 0);
  const totalEr = rows.reduce((s, r) => s + Number(r.employer_share), 0);

  const save = async () => {
    if (!form.employee_id || !form.period) return toast.error("Employee and period required");
    try {
      await upsert.mutateAsync({ employee_id: form.employee_id, period: form.period, employee_share: Number(form.employee_share) || 0, employer_share: Number(form.employer_share) || 0, remarks: form.remarks || null });
      toast.success("Contribution recorded");
      setOpen(false);
      setForm({ employee_id: "", period: "", employee_share: "", employer_share: "", remarks: "" });
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div><h1 className="text-2xl font-semibold tracking-tight">Provident Fund</h1><p className="text-sm text-muted-foreground mt-1">Employee contributions <b>{formatMoney(totalEmp)}</b> · Employer contributions <b>{formatMoney(totalEr)}</b>.</p></div>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Record Contribution</Button>
      </div>
      <Card className="glass-card"><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Period</TableHead><TableHead>Employee</TableHead>
            <TableHead className="text-right">Employee Share</TableHead><TableHead className="text-right">Employer Share</TableHead>
            <TableHead className="text-right">Total</TableHead><TableHead>Remarks</TableHead><TableHead className="text-right">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No PF contributions recorded.</TableCell></TableRow>
            ) : rows.map((r) => {
              const e = empMap.get(r.employee_id);
              return (
                <TableRow key={r.id}>
                  <TableCell>{formatDate(r.period)}</TableCell>
                  <TableCell className="font-medium">{e?.full_name ?? "—"}<div className="text-xs text-muted-foreground">{e?.employee_code}</div></TableCell>
                  <TableCell className="text-right">{formatMoney(r.employee_share)}</TableCell>
                  <TableCell className="text-right">{formatMoney(r.employer_share)}</TableCell>
                  <TableCell className="text-right font-medium">{formatMoney(Number(r.employee_share) + Number(r.employer_share))}</TableCell>
                  <TableCell className="text-muted-foreground">{r.remarks ?? "—"}</TableCell>
                  <TableCell className="text-right"><Button size="icon" variant="ghost" onClick={() => setToDelete(r)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record PF Contribution</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <Label>Employee</Label>
              <Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>{(empQ.data ?? []).map((e) => <SelectItem key={e.id} value={e.id}>{e.full_name} — {e.employee_code}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Period</Label><Input type="date" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} /></div>
            <div><Label>Employee Share</Label><Input type="number" step="0.01" value={form.employee_share} onChange={(e) => setForm({ ...form, employee_share: e.target.value })} /></div>
            <div><Label>Employer Share</Label><Input type="number" step="0.01" value={form.employer_share} onChange={(e) => setForm({ ...form, employer_share: e.target.value })} /></div>
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
          <AlertDialogHeader><AlertDialogTitle>Remove this PF entry?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { if (!toDelete) return; await del.mutateAsync(toDelete.id); toast.success("Removed"); setToDelete(undefined); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
