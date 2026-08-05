import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Search, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { formatDate } from "@/lib/format";
import { Money } from "@/lib/privacy";
import type { Bank, BankTransaction } from "@/lib/queries";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE = 8;

export function RecentTransactions({
  transactions, banks, loading,
}: {
  transactions: BankTransaction[]; banks: Bank[]; loading?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sortDesc, setSortDesc] = useState(true);

  const bankMap = useMemo(() => Object.fromEntries(banks.map((b) => [b.id, b.name])), [banks]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = transactions.filter((t) => {
      if (!q) return true;
      return (
        t.description.toLowerCase().includes(q) ||
        (t.reference_no ?? "").toLowerCase().includes(q) ||
        (bankMap[t.bank_id] ?? "").toLowerCase().includes(q)
      );
    });
    list.sort((a, b) => {
      const cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
      return sortDesc ? -cmp : cmp;
    });
    return list;
  }, [transactions, query, bankMap, sortDesc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const rows = filtered.slice((page - 1) * PAGE, page * PAGE);

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
        <CardTitle className="text-sm">Recent Transactions</CardTitle>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search…" className="pl-8 h-9 w-[220px]" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button className="inline-flex items-center gap-1" onClick={() => setSortDesc((v) => !v)}>
                    Date <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead>Bank</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground">No transactions yet. Use Transfer or record a credit/debit to see activity.</TableCell></TableRow>
              ) : rows.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="whitespace-nowrap">{formatDate(t.date)}</TableCell>
                  <TableCell>{bankMap[t.bank_id] ?? "—"}</TableCell>
                  <TableCell className="max-w-[280px] truncate">{t.description}</TableCell>
                  <TableCell className="text-muted-foreground">{t.reference_no ?? "—"}</TableCell>
                  <TableCell className="text-right text-success">{Number(t.credit) > 0 ? <Money value={t.credit} /> : "—"}</TableCell>
                  <TableCell className="text-right text-destructive">{Number(t.debit) > 0 ? <Money value={t.debit} /> : "—"}</TableCell>
                  <TableCell className="text-right font-medium"><Money value={t.balance_after_transaction} /></TableCell>
                  <TableCell><Badge variant="secondary" className="capitalize">{t.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t text-xs text-muted-foreground">
          <span>{filtered.length} transaction{filtered.length === 1 ? "" : "s"}</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="px-2">Page {page} / {totalPages}</span>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
