import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Download, Users, Building2, Wallet, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBanks, useEmployees, useLoans, usePayrollRuns, useTransactions } from "@/lib/queries";
import { formatMoney, formatDate } from "@/lib/format";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [
    { title: "Reports — Finance Hub" },
    { name: "description", content: "Consolidated finance, payroll and workforce reports with CSV export." },
    { property: "og:title", content: "Reports — Finance Hub" },
    { property: "og:description", content: "Live analytical rollups of banks, payroll runs, loans and staff distribution." },
  ]}),
  component: ReportsPage,
});

function downloadCsv(name: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a"); a.href = url; a.download = `${name}.csv`; a.click(); URL.revokeObjectURL(url);
}

function ReportsPage() {
  const banksQ = useBanks();
  const empQ = useEmployees();
  const txQ = useTransactions();
  const loansQ = useLoans();
  const payrollQ = usePayrollRuns();

  const banks = banksQ.data ?? [];
  const employees = empQ.data ?? [];
  const tx = txQ.data ?? [];
  const loans = loansQ.data ?? [];
  const runs = payrollQ.data ?? [];

  const totalCash = banks.reduce((s, b) => s + Number(b.current_balance), 0);
  const totalLoans = loans.reduce((s, l) => s + Number(l.remaining_balance), 0);
  const activeEmp = employees.filter((e) => e.status === "active").length;
  const lastRunNet = runs[0]?.total_net ?? 0;

  const byDept = useMemo(() => {
    const map = new Map<string, number>();
    employees.forEach((e) => map.set(e.department ?? "Unspecified", (map.get(e.department ?? "Unspecified") ?? 0) + 1));
    return Array.from(map.entries()).map(([department, count]) => ({ department, count }));
  }, [employees]);

  const byBps = useMemo(() => {
    const map = new Map<string, number>();
    employees.forEach((e) => { const k = e.bps ? `BPS-${e.bps}` : "Unspecified"; map.set(k, (map.get(k) ?? 0) + 1); });
    return Array.from(map.entries()).map(([bps, count]) => ({ bps, count })).sort((a, b) => a.bps.localeCompare(b.bps));
  }, [employees]);

  const kpis = [
    { label: "Cash Across Banks", value: formatMoney(totalCash), icon: Building2 },
    { label: "Active Employees", value: activeEmp.toString(), icon: Users },
    { label: "Outstanding Loans", value: formatMoney(totalLoans), icon: Wallet },
    { label: "Last Payroll Net", value: formatMoney(lastRunNet), icon: Receipt },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">Live analytical view across banks, employees, loans and payroll.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <Card key={k.label} className="glass-card"><CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div><div className="text-xs text-muted-foreground">{k.label}</div><div className="text-lg font-semibold mt-1">{k.value}</div></div>
              <div className="h-10 w-10 rounded-xl gradient-primary text-primary-foreground flex items-center justify-center"><k.icon className="h-5 w-5" /></div>
            </div>
          </CardContent></Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between"><h3 className="font-semibold">Workforce by Department</h3><Button variant="outline" size="sm" onClick={() => downloadCsv("workforce-by-department", byDept)}><Download className="h-4 w-4" /> CSV</Button></div>
            <Table>
              <TableHeader><TableRow><TableHead>Department</TableHead><TableHead className="text-right">Employees</TableHead></TableRow></TableHeader>
              <TableBody>{byDept.map((d) => <TableRow key={d.department}><TableCell>{d.department}</TableCell><TableCell className="text-right">{d.count}</TableCell></TableRow>)}</TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between"><h3 className="font-semibold">Workforce by BPS Grade</h3><Button variant="outline" size="sm" onClick={() => downloadCsv("workforce-by-bps", byBps)}><Download className="h-4 w-4" /> CSV</Button></div>
            <Table>
              <TableHeader><TableRow><TableHead>Grade</TableHead><TableHead className="text-right">Employees</TableHead></TableRow></TableHeader>
              <TableBody>{byBps.map((d) => <TableRow key={d.bps}><TableCell>{d.bps}</TableCell><TableCell className="text-right">{d.count}</TableCell></TableRow>)}</TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between"><h3 className="font-semibold">Bank Balances</h3><Button variant="outline" size="sm" onClick={() => downloadCsv("bank-balances", banks.map((b) => ({ name: b.name, account_number: b.account_number, opening: b.opening_balance, current: b.current_balance, status: b.status })))}><Download className="h-4 w-4" /> CSV</Button></div>
          <Table>
            <TableHeader><TableRow><TableHead>Bank</TableHead><TableHead>Account No.</TableHead><TableHead className="text-right">Opening</TableHead><TableHead className="text-right">Current</TableHead></TableRow></TableHeader>
            <TableBody>{banks.map((b) => <TableRow key={b.id}><TableCell>{b.name}</TableCell><TableCell className="font-mono text-xs">{b.account_number ?? "—"}</TableCell><TableCell className="text-right">{formatMoney(b.opening_balance)}</TableCell><TableCell className="text-right font-medium">{formatMoney(b.current_balance)}</TableCell></TableRow>)}</TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between"><h3 className="font-semibold">Recent Transactions ({tx.length})</h3><Button variant="outline" size="sm" onClick={() => downloadCsv("transactions", tx.map((t) => ({ date: t.date, description: t.description, reference: t.reference_no, credit: t.credit, debit: t.debit, balance: t.balance_after_transaction })))}><Download className="h-4 w-4" /> CSV</Button></div>
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Credit</TableHead><TableHead className="text-right">Debit</TableHead></TableRow></TableHeader>
            <TableBody>{tx.slice(0, 10).map((t) => <TableRow key={t.id}><TableCell>{formatDate(t.date)}</TableCell><TableCell className="max-w-[380px] truncate">{t.description}</TableCell><TableCell className="text-right text-emerald-500">{Number(t.credit) > 0 ? formatMoney(t.credit) : "—"}</TableCell><TableCell className="text-right text-destructive">{Number(t.debit) > 0 ? formatMoney(t.debit) : "—"}</TableCell></TableRow>)}</TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between"><h3 className="font-semibold">Employee Directory ({employees.length})</h3><Button variant="outline" size="sm" onClick={() => downloadCsv("employees", employees.map((e) => ({ code: e.employee_code, name: e.full_name, bps: e.bps, designation: e.designation, department: e.department, phone: e.phone, cnic: e.cnic, joining_date: e.joining_date, status: e.status })))}><Download className="h-4 w-4" /> Export All</Button></div>
        </CardContent>
      </Card>
    </div>
  );
}
