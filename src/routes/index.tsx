import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Users, Wallet, ArrowDownRight, ArrowUpRight, Landmark, HandCoins, PiggyBank, Receipt,
} from "lucide-react";
import { useBanks, useTransactions, useEmployees, useActivity } from "@/lib/queries";
import { useSalarySheet } from "@/lib/salary-sheet";
import { greeting, financialYear, formatDate } from "@/lib/format";
import { useMoney, SensitiveToggle } from "@/lib/privacy";
import { BankCard } from "@/components/dashboard/bank-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { DashboardCharts } from "@/components/dashboard/charts";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { RecentActivities } from "@/components/dashboard/recent-activities";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Smart Finance System" },
      { name: "description", content: "Real-time overview of banks, cash flow, payroll and recent activity." },
      { property: "og:title", content: "Dashboard — Smart Finance System" },
      { property: "og:description", content: "Real-time overview of banks, cash flow, payroll and recent activity." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const banksQ = useBanks();
  const txQ = useTransactions();
  const empQ = useEmployees();
  const actQ = useActivity(20);
  const sheetQ = useSalarySheet(2026, 6);

  const banks = banksQ.data ?? [];
  const transactions = txQ.data ?? [];
  const employees = empQ.data ?? [];

  const totals = useMemo(() => {
    const credit = transactions.reduce((s, t) => s + Number(t.credit ?? 0), 0);
    const debit = transactions.reduce((s, t) => s + Number(t.debit ?? 0), 0);
    const opening = banks.reduce((s, b) => s + Number(b.opening_balance ?? 0), 0);
    return { credit, debit, opening, net: opening + credit - debit };
  }, [transactions, banks]);

  const money = useMoney();
  const [greet, setGreet] = useState("Welcome");
  const [dateLine, setDateLine] = useState("");
  useEffect(() => {
    setGreet(greeting());
    const now = new Date();
    setDateLine(`${formatDate(now)} • ${now.toLocaleDateString("en-US", { month: "long" })} • FY ${financialYear()}`);
  }, []);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="text-sm text-muted-foreground">{greet},</div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Welcome back to Finance Hub</h1>
          <div className="text-xs text-muted-foreground mt-1 min-h-4">{dateLine}</div>
        </div>
        <div className="flex items-center gap-2">
          <SensitiveToggle />
          <QuickActions banks={banks} />
        </div>
      </div>

      {/* Bank cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {banksQ.isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="glass-card"><CardContent className="p-5"><Skeleton className="h-40 w-full" /></CardContent></Card>
            ))
          : banks.map((b) => (
              <BankCard key={b.id} bank={b} transactions={transactions} allBanks={banks} />
            ))}
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Employees" value={String(employees.length)} icon={Users} />
        <StatCard label="Monthly Payroll" value={money((sheetQ.data ?? []).reduce((s, r) => s + Number(r.net_pay || 0), 0))} icon={Wallet} tone="warning" />
        <StatCard label="Total Credits" value={money(totals.credit)} icon={ArrowDownRight} tone="success" />
        <StatCard label="Total Debits" value={money(totals.debit)} icon={ArrowUpRight} tone="destructive" />
        <StatCard label="Net Cash" value={money(totals.net)} icon={Landmark} />
        <StatCard label="Pending Loans" value={money(0)} icon={HandCoins} hint="Module coming" />
        <StatCard label="Provident Fund" value={money(0)} icon={PiggyBank} hint="Module coming" />
        <StatCard label="Income Tax" value={money(0)} icon={Receipt} hint="Module coming" />
      </section>

      {/* Charts */}
      <DashboardCharts transactions={transactions} employees={employees} />

      {/* Transactions + Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <RecentTransactions transactions={transactions} banks={banks} loading={txQ.isLoading} />
        </div>
        <RecentActivities items={actQ.data ?? []} loading={actQ.isLoading} />
      </div>
    </div>
  );
}
