import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Wallet, Play, Edit, FileText, Printer, CheckCircle2, Search, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useEmployees } from "@/lib/queries";
import {
  MONTHS, monthLabel,
  useGenerateMonthlySalaries, useSalaryRecords, useUpsertSalaryRecord, useDeleteSalaryRecord,
  type SalaryRecord,
} from "@/lib/salary";
import { formatMoney, formatDate } from "@/lib/format";
import { SalaryEditDialog } from "@/components/salary/salary-edit-dialog";
import { SalarySlipDialog } from "@/components/salary/salary-slip-dialog";

export const Route = createFileRoute("/payroll")({
  head: () => ({
    meta: [
      { title: "Payroll — Finance Hub" },
      { name: "description", content: "Monthly salary processing, leave adjustments, and salary slip generation." },
      { property: "og:title", content: "Payroll — Finance Hub" },
      { property: "og:description", content: "Monthly salary processing and slip generation." },
    ],
  }),
  component: PayrollPage,
});

const now = new Date();
const YEARS = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

function PayrollPage() {
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [editing, setEditing] = useState<SalaryRecord | undefined>();
  const [previewing, setPreviewing] = useState<SalaryRecord | undefined>();

  const empQ = useEmployees();
  const recQ = useSalaryRecords({ year, month });
  const generate = useGenerateMonthlySalaries();
  const upsert = useUpsertSalaryRecord();
  const del = useDeleteSalaryRecord();

  const empMap = useMemo(() => new Map((empQ.data ?? []).map((e) => [e.id, e])), [empQ.data]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (recQ.data ?? []).filter((r) => {
      const e = empMap.get(r.employee_id);
      if (status !== "all" && r.status !== status) return false;
      if (!q || !e) return !q;
      return e.full_name.toLowerCase().includes(q) || e.employee_code.toLowerCase().includes(q);
    });
  }, [recQ.data, empMap, query, status]);

  const stats = useMemo(() => {
    const list = recQ.data ?? [];
    return {
      count: list.length,
      gross: list.reduce((a, r) => a + Number(r.gross_pay || 0), 0),
      deductions: list.reduce((a, r) => a + Number(r.total_deductions || 0), 0),
      net: list.reduce((a, r) => a + Number(r.net_pay || 0), 0),
      paid: list.filter((r) => r.status === "paid").length,
      pending: list.filter((r) => r.status !== "paid").length,
    };
  }, [recQ.data]);

  const doGenerate = async () => {
    try {
      const n = await generate.mutateAsync({ year, month });
      toast.success(n > 0 ? `Generated ${n} salary drafts for ${monthLabel(year, month)}` : "Records already exist for this month");
    } catch (e) { toast.error((e as Error).message); }
  };

  const markPaid = async (r: SalaryRecord) => {
    try {
      await upsert.mutateAsync({
        id: r.id, employee_id: r.employee_id, period_year: r.period_year, period_month: r.period_month,
        status: "paid", paid_at: new Date().toISOString(),
      });
      toast.success("Marked as paid");
    } catch (e) { toast.error((e as Error).message); }
  };

  const doDelete = async (r: SalaryRecord) => {
    if (!confirm(`Delete salary record for ${empMap.get(r.employee_id)?.full_name ?? "employee"}?`)) return;
    try { await del.mutateAsync(r.id); toast.success("Deleted"); }
    catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" /> Payroll — {monthLabel(year, month)}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Generate monthly salary drafts, adjust leaves & deductions, then print or export slips.</p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>{MONTHS.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
            <SelectContent>{YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
          </Select>
          <Button onClick={doGenerate} disabled={generate.isPending}>
            <Play className="h-4 w-4" /> Generate
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Records", value: stats.count, hint: `${stats.paid} paid • ${stats.pending} pending` },
          { label: "Total Gross", value: formatMoney(stats.gross) },
          { label: "Total Deductions", value: formatMoney(stats.deductions) },
          { label: "Total Net Pay", value: formatMoney(stats.net) },
        ].map((s) => (
          <Card key={s.label} className="glass-card">
            <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground font-medium">{s.label}</CardTitle></CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl font-semibold">{s.value}</div>
              {s.hint && <div className="text-xs text-muted-foreground mt-1">{s.hint}</div>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass-card">
        <CardContent className="p-4 flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search employee…" className="pl-8" />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="finalized">Finalized</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Emp #</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>BPS</TableHead>
                  <TableHead className="text-right">Basic</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Net Pay</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Paid On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recQ.isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 10 }).map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow><TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                    No salary records for {monthLabel(year, month)}. Click <b>Generate</b> to create drafts from active employees.
                  </TableCell></TableRow>
                ) : rows.map((r) => {
                  const e = empMap.get(r.employee_id);
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{e?.employee_code ?? "—"}</TableCell>
                      <TableCell className="font-medium">{e?.full_name ?? "—"}</TableCell>
                      <TableCell>{e?.bps ? `BPS-${e.bps}` : "—"}</TableCell>
                      <TableCell className="text-right">{formatMoney(r.basic_pay)}</TableCell>
                      <TableCell className="text-right">{formatMoney(r.gross_pay)}</TableCell>
                      <TableCell className="text-right">{formatMoney(r.total_deductions)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatMoney(r.net_pay)}</TableCell>
                      <TableCell><Badge variant={r.status === "paid" ? "secondary" : "outline"} className="capitalize">{r.status}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.paid_at ? formatDate(r.paid_at) : "—"}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button size="icon" variant="ghost" title="Edit" onClick={() => setEditing(r)}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" title="Preview slip" onClick={() => setPreviewing(r)}><FileText className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" title="Print / PDF" onClick={() => setPreviewing(r)}><Printer className="h-3.5 w-3.5" /></Button>
                        {r.status !== "paid" && (
                          <Button size="icon" variant="ghost" title="Mark paid" onClick={() => markPaid(r)}><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /></Button>
                        )}
                        <Button size="icon" variant="ghost" title="Delete" onClick={() => doDelete(r)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <SalaryEditDialog open={!!editing} onOpenChange={(o) => !o && setEditing(undefined)} record={editing} employee={editing ? empMap.get(editing.employee_id) : undefined} />
      <SalarySlipDialog open={!!previewing} onOpenChange={(o) => !o && setPreviewing(undefined)} record={previewing} employee={previewing ? empMap.get(previewing.employee_id) : undefined} />
    </div>
  );
}
