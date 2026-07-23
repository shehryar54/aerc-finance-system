import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Play, Trash2, Wallet, Users, TrendingUp, Receipt } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { usePayrollRuns, useGeneratePayrollRun, useDeletePayrollRun, type PayrollRun } from "@/lib/queries";
import { formatMoney, formatDate } from "@/lib/format";

export const Route = createFileRoute("/payroll")({
  head: () => ({ meta: [
    { title: "Payroll — Finance Hub" },
    { name: "description", content: "Generate monthly payroll runs computed from employees, allowances, deductions and tax slabs." },
    { property: "og:title", content: "Payroll — Finance Hub" },
    { property: "og:description", content: "Automated monthly salary processing with full breakdown." },
  ]}),
  component: PayrollPage,
});

function PayrollPage() {
  const q = usePayrollRuns();
  const gen = useGeneratePayrollRun();
  const del = useDeletePayrollRun();
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<PayrollRun | undefined>();
  const today = new Date();
  const [form, setForm] = useState({ period: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`, remarks: "" });

  const rows = q.data ?? [];
  const latest = rows[0];

  const run = async () => {
    if (!form.period) return toast.error("Period is required");
    try {
      await gen.mutateAsync({ period: form.period, remarks: form.remarks || undefined });
      toast.success("Payroll run generated");
      setOpen(false);
    } catch (e) { toast.error((e as Error).message); }
  };

  const stats = [
    { label: "Latest Net Payout", value: formatMoney(latest?.total_net ?? 0), icon: Wallet },
    { label: "Employees", value: (latest?.employees_count ?? 0).toString(), icon: Users },
    { label: "Total Tax Withheld", value: formatMoney(latest?.total_tax ?? 0), icon: Receipt },
    { label: "Runs Processed", value: rows.length.toString(), icon: TrendingUp },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div><h1 className="text-2xl font-semibold tracking-tight">Payroll</h1><p className="text-sm text-muted-foreground mt-1">Generate monthly payroll runs from active employees, allowance / deduction masters and tax slabs.</p></div>
        <Button onClick={() => setOpen(true)}><Play className="h-4 w-4" /> Generate Run</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="glass-card"><CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div><div className="text-xs text-muted-foreground">{s.label}</div><div className="text-lg font-semibold mt-1">{s.value}</div></div>
              <div className="h-10 w-10 rounded-xl gradient-primary text-primary-foreground flex items-center justify-center"><s.icon className="h-5 w-5" /></div>
            </div>
          </CardContent></Card>
        ))}
      </div>

      <Card className="glass-card"><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Period</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Employees</TableHead>
            <TableHead className="text-right">Gross Basic</TableHead><TableHead className="text-right">Allowances</TableHead>
            <TableHead className="text-right">Deductions</TableHead><TableHead className="text-right">Tax</TableHead>
            <TableHead className="text-right">Net Payout</TableHead><TableHead className="text-right">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="h-24 text-center text-muted-foreground">No payroll runs yet. Click "Generate Run" to process the first month.</TableCell></TableRow>
            ) : rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{formatDate(r.period)}</TableCell>
                <TableCell><Badge variant="secondary" className="capitalize">{r.status}</Badge></TableCell>
                <TableCell className="text-right">{r.employees_count}</TableCell>
                <TableCell className="text-right">{formatMoney(r.total_gross)}</TableCell>
                <TableCell className="text-right">{formatMoney(r.total_allowances)}</TableCell>
                <TableCell className="text-right">{formatMoney(r.total_deductions)}</TableCell>
                <TableCell className="text-right">{formatMoney(r.total_tax)}</TableCell>
                <TableCell className="text-right font-semibold">{formatMoney(r.total_net)}</TableCell>
                <TableCell className="text-right"><Button size="icon" variant="ghost" onClick={() => setToDelete(r)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Generate Payroll Run</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Period</Label><Input type="date" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} /></div>
            <div><Label>Remarks</Label><Input value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Optional notes" /></div>
            <p className="text-xs text-muted-foreground">This will compute gross salary, allowances, deductions and monthly tax for all <b>active</b> employees using the current master data.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={run} disabled={gen.isPending}>{gen.isPending ? "Processing…" : "Generate"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Remove this payroll run?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { if (!toDelete) return; await del.mutateAsync(toDelete.id); toast.success("Removed"); setToDelete(undefined); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
