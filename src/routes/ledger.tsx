import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BookOpen, Download, Filter, Plus, Printer, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { formatMoney, formatDate } from "@/lib/format";
import { useAccountHeads } from "@/lib/vouchers";
import {
  useLedgerEntries, useCreateLedgerEntry, useDeleteLedgerEntry,
  withRunningBalance, SOURCE_LABELS, type LedgerEntry,
} from "@/lib/ledger";
import { printLedgerSheet, printCashBook } from "@/lib/print-ledger";

export const Route = createFileRoute("/ledger")({
  head: () => ({ meta: [
    { title: "General Ledger — Finance Hub" },
    { name: "description", content: "Central double-entry ledger: general ledger, trial balance, cash book, and bank book — auto-posted from vouchers, bank transactions, and payroll." },
    { property: "og:title", content: "General Ledger — Finance Hub" },
    { property: "og:description", content: "Every voucher, bank movement and salary automatically posts to the ledger with running balances." },
  ]}),
  component: LedgerPage,
});

function LedgerPage() {
  const heads = useAccountHeads().data ?? [];
  const [accountId, setAccountId] = useState<string>("all");
  const [sourceType, setSourceType] = useState<string>("all");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"general" | "trial" | "cash" | "bank">("general");
  const [createOpen, setCreateOpen] = useState(false);
  const [toDelete, setToDelete] = useState<LedgerEntry | null>(null);

  const q = useLedgerEntries({
    accountHeadId: accountId,
    sourceType,
    from: from || undefined,
    to: to || undefined,
    search: search || undefined,
  });
  const del = useDeleteLedgerEntry();

  const rows = q.data ?? [];
  const rowsWithBal = useMemo(() => withRunningBalance(rows), [rows]);
  const totals = useMemo(() => rows.reduce((a, r) => ({ d: a.d + Number(r.debit), c: a.c + Number(r.credit) }), { d: 0, c: 0 }), [rows]);

  // Trial Balance
  const allEntriesQ = useLedgerEntries({ from: from || undefined, to: to || undefined });
  const trial = useMemo(() => {
    const map = new Map<string, { debit: number; credit: number }>();
    for (const r of allEntriesQ.data ?? []) {
      const cur = map.get(r.account_head_id) ?? { debit: 0, credit: 0 };
      cur.debit += Number(r.debit); cur.credit += Number(r.credit);
      map.set(r.account_head_id, cur);
    }
    return heads.map((h) => {
      const t = map.get(h.id) ?? { debit: 0, credit: 0 };
      const net = t.debit - t.credit;
      return { head: h, debit: t.debit, credit: t.credit, dr: net >= 0 ? net : 0, cr: net < 0 ? -net : 0 };
    }).filter((r) => r.debit || r.credit);
  }, [allEntriesQ.data, heads]);
  const trialTotals = useMemo(() => trial.reduce((a, r) => ({ dr: a.dr + r.dr, cr: a.cr + r.cr }), { dr: 0, cr: 0 }), [trial]);

  const exportCSV = () => {
    const header = ["Date", "Voucher", "Particulars", "Account", "Debit", "Credit", "Balance"];
    const lines = rowsWithBal.map((r) => {
      const name = heads.find((h) => h.id === r.account_head_id)?.name ?? "";
      return [r.entry_date, r.voucher_no ?? "", `"${r.particulars.replace(/"/g, '""')}"`, `"${name}"`, r.debit, r.credit, r.running].join(",");
    });
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `ledger-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const currentHead = accountId !== "all" ? heads.find((h) => h.id === accountId) : null;
  const cashHeads = heads.filter((h) => h.type === "bank");
  const bankBookHead = tab === "bank" ? (currentHead ?? cashHeads[0]) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2"><BookOpen className="h-6 w-6" /> General Ledger</h1>
          <p className="text-sm text-muted-foreground mt-1">Central double-entry ledger — every voucher, bank movement, and salary posts here automatically.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</Button>
          <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4" /> CSV</Button>
          <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Journal Entry</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Total Debits" value={formatMoney(totals.d)} tone="emerald" />
        <Stat label="Total Credits" value={formatMoney(totals.c)} tone="amber" />
        <Stat label="Difference" value={formatMoney(totals.d - totals.c)} tone="primary" />
        <Stat label="Entries" value={rows.length.toString()} tone="primary" />
      </div>

      <Card className="glass-card"><CardContent className="p-3 grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
        <div className="md:col-span-2">
          <Label className="text-xs">Search</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Voucher, particulars…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div>
          <Label className="text-xs">Account</Label>
          <Select value={accountId} onValueChange={setAccountId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All accounts</SelectItem>
              {heads.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Source</Label>
          <Select value={sourceType} onValueChange={setSourceType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              {Object.entries(SOURCE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">From</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">To</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </CardContent></Card>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="general">General Ledger</TabsTrigger>
          <TabsTrigger value="trial">Trial Balance</TabsTrigger>
          <TabsTrigger value="cash">Cash Book</TabsTrigger>
          <TabsTrigger value="bank">Bank Book</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-3">
          <LedgerTable rows={rowsWithBal} heads={heads} showAccount={accountId === "all"} onDelete={setToDelete} />
        </TabsContent>

        <TabsContent value="trial" className="mt-3">
          <Card className="glass-card"><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead className="text-right">Balance (Dr)</TableHead>
                <TableHead className="text-right">Balance (Cr)</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {trial.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No activity in selected period.</TableCell></TableRow>
                ) : trial.map((r) => (
                  <TableRow key={r.head.id}>
                    <TableCell className="font-medium">{r.head.name}</TableCell>
                    <TableCell className="capitalize">{r.head.type}</TableCell>
                    <TableCell className="text-right font-mono">{formatMoney(r.debit)}</TableCell>
                    <TableCell className="text-right font-mono">{formatMoney(r.credit)}</TableCell>
                    <TableCell className="text-right font-mono text-emerald-600">{r.dr ? formatMoney(r.dr) : "—"}</TableCell>
                    <TableCell className="text-right font-mono text-amber-600">{r.cr ? formatMoney(r.cr) : "—"}</TableCell>
                  </TableRow>
                ))}
                {trial.length > 0 && (
                  <TableRow className="border-t-2 font-semibold bg-muted/40">
                    <TableCell colSpan={4} className="text-right">Totals</TableCell>
                    <TableCell className="text-right font-mono">{formatMoney(trialTotals.dr)}</TableCell>
                    <TableCell className="text-right font-mono">{formatMoney(trialTotals.cr)}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="cash" className="mt-3">
          <p className="text-xs text-muted-foreground mb-2"><Filter className="h-3 w-3 inline" /> Showing bank & cash accounts only (In / Out with running balance).</p>
          <LedgerTable
            rows={withRunningBalance(rows.filter((r) => cashHeads.some((h) => h.id === r.account_head_id)))}
            heads={heads}
            showAccount={true}
            variant="cash"
            onDelete={setToDelete}
          />
        </TabsContent>

        <TabsContent value="bank" className="mt-3">
          <div className="mb-2">
            <Label className="text-xs">Bank account</Label>
            <Select value={bankBookHead?.id ?? ""} onValueChange={(v) => setAccountId(v)}>
              <SelectTrigger className="w-72"><SelectValue placeholder="Select a bank" /></SelectTrigger>
              <SelectContent>
                {cashHeads.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <LedgerTable
            rows={withRunningBalance(rows.filter((r) => bankBookHead && r.account_head_id === bankBookHead.id))}
            heads={heads}
            showAccount={false}
            variant="cash"
            onDelete={setToDelete}
          />
        </TabsContent>
      </Tabs>

      <JournalEntryDialog open={createOpen} onOpenChange={setCreateOpen} />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this ledger entry?</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-muted-foreground">
            {toDelete && toDelete.source_type !== "manual"
              ? "This entry was auto-posted from a " + SOURCE_LABELS[toDelete.source_type] + ". Deleting it here will only remove this row — reversing the source transaction is the correct way to unpost it."
              : "This will remove the manual journal entry."}
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => { if (!toDelete) return; await del.mutateAsync(toDelete.id); toast.success("Deleted"); setToDelete(null); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            ><Trash2 className="h-4 w-4" /> Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function LedgerTable({
  rows, heads, showAccount, variant, onDelete,
}: {
  rows: (LedgerEntry & { running: number })[];
  heads: { id: string; name: string }[];
  showAccount: boolean;
  variant?: "cash";
  onDelete: (r: LedgerEntry) => void;
}) {
  return (
    <Card className="glass-card"><CardContent className="p-0 overflow-x-auto">
      <Table>
        <TableHeader><TableRow>
          <TableHead className="w-24">Date</TableHead>
          <TableHead className="w-32">Voucher</TableHead>
          <TableHead>Particulars</TableHead>
          {showAccount && <TableHead>Account</TableHead>}
          <TableHead className="w-24">Source</TableHead>
          <TableHead className="text-right w-32">{variant === "cash" ? "In (Dr)" : "Debit"}</TableHead>
          <TableHead className="text-right w-32">{variant === "cash" ? "Out (Cr)" : "Credit"}</TableHead>
          <TableHead className="text-right w-32">Balance</TableHead>
          <TableHead className="w-10"></TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow><TableCell colSpan={showAccount ? 9 : 8} className="h-24 text-center text-muted-foreground">
              <div className="flex flex-col items-center gap-2"><BookOpen className="h-6 w-6" /> No entries for the selected filters.</div>
            </TableCell></TableRow>
          ) : rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="whitespace-nowrap">{formatDate(r.entry_date)}</TableCell>
              <TableCell className="font-mono text-xs">{r.voucher_no ?? "—"}</TableCell>
              <TableCell className="max-w-[360px]"><span title={r.particulars}>{r.particulars}</span>{r.remarks && <div className="text-xs text-muted-foreground truncate">{r.remarks}</div>}</TableCell>
              {showAccount && <TableCell>{heads.find((h) => h.id === r.account_head_id)?.name ?? "—"}</TableCell>}
              <TableCell><span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs">{SOURCE_LABELS[r.source_type] ?? r.source_type}</span></TableCell>
              <TableCell className="text-right font-mono">{Number(r.debit) ? formatMoney(r.debit) : "—"}</TableCell>
              <TableCell className="text-right font-mono">{Number(r.credit) ? formatMoney(r.credit) : "—"}</TableCell>
              <TableCell className={`text-right font-mono ${r.running >= 0 ? "text-emerald-600" : "text-amber-600"}`}>{formatMoney(Math.abs(r.running))} {r.running >= 0 ? "Dr" : "Cr"}</TableCell>
              <TableCell>
                <Button size="icon" variant="ghost" onClick={() => onDelete(r)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent></Card>
  );
}

function JournalEntryDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const heads = useAccountHeads().data ?? [];
  const create = useCreateLedgerEntry();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [voucherNo, setVoucherNo] = useState("");
  const [particulars, setParticulars] = useState("");
  const [debitHead, setDebitHead] = useState<string>("");
  const [creditHead, setCreditHead] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [remarks, setRemarks] = useState("");

  const submit = async () => {
    const amt = parseFloat(amount);
    if (!debitHead || !creditHead || !particulars.trim() || !(amt > 0)) {
      toast.error("Fill particulars, debit head, credit head, and a positive amount.");
      return;
    }
    if (debitHead === creditHead) { toast.error("Debit and credit accounts must differ."); return; }
    try {
      await create.mutateAsync({ entry_date: date, voucher_no: voucherNo || null, particulars, account_head_id: debitHead, debit: amt, credit: 0, remarks: remarks || null });
      await create.mutateAsync({ entry_date: date, voucher_no: voucherNo || null, particulars, account_head_id: creditHead, debit: 0, credit: amt, remarks: remarks || null });
      toast.success("Journal entry posted");
      onOpenChange(false);
      setParticulars(""); setAmount(""); setRemarks(""); setVoucherNo("");
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New Journal Entry</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div><Label>Voucher / Ref #</Label><Input value={voucherNo} onChange={(e) => setVoucherNo(e.target.value)} placeholder="JV-001" /></div>
          </div>
          <div><Label>Particulars</Label><Input value={particulars} onChange={(e) => setParticulars(e.target.value)} placeholder="Description of the transaction" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Debit (Dr)</Label>
              <Select value={debitHead} onValueChange={setDebitHead}>
                <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>{heads.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Credit (Cr)</Label>
              <Select value={creditHead} onValueChange={setCreditHead}>
                <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>{heads.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Amount</Label><Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" /></div>
          <div><Label>Remarks</Label><Input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional notes" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={create.isPending}>Post Entry</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "amber" | "emerald" | "primary" }) {
  const t = { amber: "bg-amber-500/10 text-amber-700 dark:text-amber-400", emerald: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400", primary: "bg-primary/10 text-primary" }[tone];
  return (
    <Card className="glass-card"><CardContent className="p-4 flex items-center justify-between">
      <div><div className="text-xs text-muted-foreground">{label}</div><div className="text-lg font-semibold mt-1">{value}</div></div>
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${t}`}><BookOpen className="h-5 w-5" /></div>
    </CardContent></Card>
  );
}
