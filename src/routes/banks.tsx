import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Landmark, Plus, ArrowRightLeft } from "lucide-react";
import { useBanks, useTransactions, useCreateTransaction } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatMoney, formatDate, formatDateTime } from "@/lib/format";
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { OpeningBalanceDialog } from "@/components/dashboard/opening-balance-dialog";
import { TransferDialog } from "@/components/dashboard/transfer-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/banks")({
  head: () => ({
    meta: [
      { title: "Banks — Finance Hub" },
      { name: "description", content: "Manage banks, opening balances, transfers, and view transaction history." },
      { property: "og:title", content: "Banks — Finance Hub" },
      { property: "og:description", content: "Manage banks, balances and transaction history." },
    ],
  }),
  component: BanksPage,
});

function BanksPage() {
  const banksQ = useBanks();
  const txQ = useTransactions();
  const banks = banksQ.data ?? [];
  const [tab, setTab] = useState<string>("");
  const [openingBank, setOpeningBank] = useState<string | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [txDialog, setTxDialog] = useState<{ open: boolean; bankId?: string; kind: "credit" | "debit" }>({ open: false, kind: "credit" });

  const activeTab = tab || banks[0]?.id;
  const activeBank = banks.find((b) => b.id === activeTab);
  const activeTx = useMemo(() => (txQ.data ?? []).filter((t) => t.bank_id === activeTab), [txQ.data, activeTab]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Bank Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Track opening balance, current balance and every transaction per bank.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setTransferOpen(true)} disabled={banks.length < 2}>
            <ArrowRightLeft className="h-4 w-4" /> Transfer
          </Button>
          <Button onClick={() => setTxDialog({ open: true, bankId: activeTab, kind: "credit" })} disabled={!activeTab}>
            <Plus className="h-4 w-4" /> Record Credit
          </Button>
          <Button variant="secondary" onClick={() => setTxDialog({ open: true, bankId: activeTab, kind: "debit" })} disabled={!activeTab}>
            <Plus className="h-4 w-4" /> Record Debit
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setTab}>
        <TabsList>
          {banks.map((b) => (
            <TabsTrigger key={b.id} value={b.id} className="gap-2"><Landmark className="h-3.5 w-3.5" />{b.name}</TabsTrigger>
          ))}
        </TabsList>

        {banks.map((b) => (
          <TabsContent key={b.id} value={b.id} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <InfoCard label="Opening Balance" value={formatMoney(b.opening_balance)} />
              <InfoCard label="Current Balance" value={formatMoney(b.current_balance)} tone="primary" />
              <InfoCard label="Status" value={<Badge variant="secondary" className="capitalize">{b.status}</Badge>} />
              <InfoCard label="Last Updated" value={formatDateTime(b.updated_at)} />
            </div>

            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">Bank Details</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setOpeningBank(b.id)}>Edit Opening Balance</Button>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <Field label="Account Title" value={b.account_title ?? "—"} />
                <Field label="Account Number" value={b.account_number ?? "—"} />
                <Field label="Branch" value={b.branch ?? "—"} />
                <Field label="Effective Date" value={b.opening_effective_date ? formatDate(b.opening_effective_date) : "—"} />
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="pb-2"><CardTitle className="text-base">Transactions</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeTx.length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No transactions yet for this bank.</TableCell></TableRow>
                      ) : activeTx.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell>{formatDate(t.date)}</TableCell>
                          <TableCell className="max-w-[320px] truncate">{t.description}</TableCell>
                          <TableCell className="text-muted-foreground">{t.reference_no ?? "—"}</TableCell>
                          <TableCell className="text-right text-success">{Number(t.credit) > 0 ? formatMoney(t.credit) : "—"}</TableCell>
                          <TableCell className="text-right text-destructive">{Number(t.debit) > 0 ? formatMoney(t.debit) : "—"}</TableCell>
                          <TableCell className="text-right font-medium">{formatMoney(t.balance_after_transaction)}</TableCell>
                          <TableCell><Badge variant="secondary" className="capitalize">{t.status}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {openingBank && (
        <OpeningBalanceDialog
          open={!!openingBank}
          onOpenChange={(o) => !o && setOpeningBank(null)}
          bank={banks.find((b) => b.id === openingBank)!}
        />
      )}
      <TransferDialog open={transferOpen} onOpenChange={setTransferOpen} fromBank={activeBank} banks={banks} />
      <TransactionDialog state={txDialog} onOpenChange={(o) => setTxDialog((s) => ({ ...s, open: o }))} banks={banks} />
    </div>
  );
}

function InfoCard({ label, value, tone = "default" }: { label: string; value: React.ReactNode; tone?: "default" | "primary" }) {
  return (
    <Card className="glass-card">
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-lg font-semibold ${tone === "primary" ? "text-primary" : ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
function Field({ label, value }: { label: string; value: string }) {
  return <div><div className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</div><div className="mt-0.5">{value}</div></div>;
}

function TransactionDialog({
  state, onOpenChange, banks,
}: {
  state: { open: boolean; bankId?: string; kind: "credit" | "debit" };
  onOpenChange: (b: boolean) => void;
  banks: { id: string; name: string }[];
}) {
  const [bankId, setBankId] = useState<string>(state.bankId ?? "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const mut = useCreateTransaction();

  // sync
  if (state.open && state.bankId && state.bankId !== bankId) setBankId(state.bankId);

  const onSubmit = async () => {
    const val = parseFloat(amount);
    if (!bankId) return toast.error("Select a bank");
    if (!Number.isFinite(val) || val <= 0) return toast.error("Enter a valid amount");
    if (!description.trim()) return toast.error("Description required");
    try {
      await mut.mutateAsync({
        bank_id: bankId,
        date,
        description,
        reference_no: reference || null,
        credit: state.kind === "credit" ? val : 0,
        debit: state.kind === "debit" ? val : 0,
        remarks: remarks || null,
      });
      toast.success("Transaction recorded");
      onOpenChange(false);
      setDescription(""); setReference(""); setAmount(""); setRemarks("");
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <Dialog open={state.open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Record {state.kind === "credit" ? "Credit" : "Debit"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Bank</Label>
            <Select value={bankId} onValueChange={setBankId}>
              <SelectTrigger><SelectValue placeholder="Select bank" /></SelectTrigger>
              <SelectContent>{banks.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div><Label>Amount</Label><Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
          </div>
          <div><Label>Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div><Label>Reference No.</Label><Input value={reference} onChange={(e) => setReference(e.target.value)} /></div>
          <div><Label>Remarks</Label><Textarea rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSubmit} disabled={mut.isPending}>{mut.isPending ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
