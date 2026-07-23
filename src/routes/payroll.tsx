import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Wallet, Play, Search, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useEmployees } from "@/lib/queries";
import {
  MONTHS, monthLabel,
  useSalarySheet, useGenerateSalarySheet,
  EARNING_FIELDS, DEDUCTION_FIELDS,
  type SalarySheetRow,
} from "@/lib/salary-sheet";
import { formatMoney } from "@/lib/format";
import { SalarySheetTable } from "@/components/salary/salary-sheet-table";
import { SalarySheetSlipDialog } from "@/components/salary/salary-sheet-slip";

export const Route = createFileRoute("/payroll")({
  head: () => ({
    meta: [
      { title: "Payroll Sheet — Finance Hub" },
      { name: "description", content: "Live salary spreadsheet: edit any cell to instantly recalculate gross, deductions, and net pay." },
      { property: "og:title", content: "Payroll Sheet — Finance Hub" },
      { property: "og:description", content: "Live monthly salary spreadsheet." },
    ],
  }),
  component: PayrollPage,
});

const now = new Date();
// Anchor to June 2026 (imported data) but let user pick any month
const DEFAULT_YEAR = 2026;
const DEFAULT_MONTH = 6;
const YEARS = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1, 2026];
const UNIQUE_YEARS = Array.from(new Set(YEARS)).sort();

function PayrollPage() {
  const [year, setYear] = useState(DEFAULT_YEAR);
  const [month, setMonth] = useState(DEFAULT_MONTH);
  const [query, setQuery] = useState("");
  const [slipRow, setSlipRow] = useState<SalarySheetRow | undefined>();

  const empQ = useEmployees();
  const sheetQ = useSalarySheet(year, month);
  const gen = useGenerateSalarySheet();

  const empsById = useMemo(
    () => new Map((empQ.data ?? []).map((e) => [e.id, e])),
    [empQ.data],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = sheetQ.data ?? [];
    if (!q) return list;
    return list.filter((r) => {
      const e = empsById.get(r.employee_id);
      if (!e) return false;
      return e.full_name.toLowerCase().includes(q) || e.employee_code.toLowerCase().includes(q);
    });
  }, [sheetQ.data, empsById, query]);

  const stats = useMemo(() => {
    const list = sheetQ.data ?? [];
    return {
      count: list.length,
      gross: list.reduce((a, r) => a + Number(r.gross_pay || 0), 0),
      ded: list.reduce((a, r) => a + Number(r.total_deductions || 0), 0),
      net: list.reduce((a, r) => a + Number(r.net_pay || 0), 0),
      paid: list.filter((r) => r.status === "paid").length,
    };
  }, [sheetQ.data]);

  const doGenerate = async () => {
    try {
      const n = await gen.mutateAsync({ year, month });
      toast.success(n > 0 ? `Generated ${n} salary rows for ${monthLabel(year, month)}` : "All employees already have a row for this month");
    } catch (e) { toast.error((e as Error).message); }
  };

  const exportCsv = () => {
    const list = filtered;
    if (list.length === 0) { toast.error("Nothing to export"); return; }
    const header = [
      "Emp Code", "Name", "BPS",
      ...EARNING_FIELDS.map((f) => f.label),
      "Gross Pay",
      ...DEDUCTION_FIELDS.map((f) => f.label),
      "Total Deductions", "Net Pay", "Status",
    ];
    const csv = [header.join(",")].concat(
      list.map((r) => {
        const e = empsById.get(r.employee_id);
        const row = [
          e?.employee_code ?? "",
          `"${(e?.full_name ?? "").replace(/"/g, '""')}"`,
          e?.bps ?? "",
          ...EARNING_FIELDS.map((f) => Number(r[f.key] || 0)),
          Number(r.gross_pay || 0),
          ...DEDUCTION_FIELDS.map((f) => Number(r[f.key] || 0)),
          Number(r.total_deductions || 0),
          Number(r.net_pay || 0),
          r.status,
        ];
        return row.join(",");
      }),
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `salary-${year}-${String(month).padStart(2, "0")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" /> Payroll Sheet — {monthLabel(year, month)}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live spreadsheet — edit any cell and gross, deductions, and net pay recalculate instantly.
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>{MONTHS.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
            <SelectContent>{UNIQUE_YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4" /> Export CSV</Button>
          <Button onClick={doGenerate} disabled={gen.isPending}>
            <Play className="h-4 w-4" /> Generate
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Rows", value: stats.count, hint: `${stats.paid} paid` },
          { label: "Total Gross", value: formatMoney(stats.gross) },
          { label: "Total Deductions", value: formatMoney(stats.ded) },
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
        <CardContent className="p-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search employee name or code…" className="pl-8" />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardContent className="p-0 max-h-[70vh] overflow-auto">
          {sheetQ.isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
            </div>
          ) : (
            <SalarySheetTable
              rows={filtered}
              employeesById={empsById}
              onOpenSlip={setSlipRow}
            />
          )}
        </CardContent>
      </Card>

      <SalarySheetSlipDialog
        open={!!slipRow}
        onOpenChange={(o) => !o && setSlipRow(undefined)}
        row={slipRow}
        employee={slipRow ? empsById.get(slipRow.employee_id) : undefined}
      />
    </div>
  );
}
