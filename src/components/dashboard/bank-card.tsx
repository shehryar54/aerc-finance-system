import { useMemo, useState } from "react";
import { Landmark, Pencil, ArrowRightLeft, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney, formatDateTime } from "@/lib/format";
import type { Bank, BankTransaction } from "@/lib/queries";
import { OpeningBalanceDialog } from "./opening-balance-dialog";
import { TransferDialog } from "./transfer-dialog";
import { Link } from "@tanstack/react-router";

export function BankCard({
  bank, transactions, allBanks,
}: {
  bank: Bank;
  transactions: BankTransaction[];
  allBanks: Bank[];
}) {
  const [openingOpen, setOpeningOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  const totals = useMemo(() => {
    const txs = transactions.filter((t) => t.bank_id === bank.id);
    return {
      credit: txs.reduce((s, t) => s + Number(t.credit ?? 0), 0),
      debit: txs.reduce((s, t) => s + Number(t.debit ?? 0), 0),
    };
  }, [transactions, bank.id]);

  return (
    <>
      <Card className="glass-card overflow-hidden group hover:shadow-elegant transition-all duration-300">
        <div className="h-1 gradient-primary" />
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-primary text-primary-foreground shadow-elegant">
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-base leading-tight">{bank.name}</div>
                <div className="text-xs text-muted-foreground">{bank.account_title ?? "—"}</div>
              </div>
            </div>
            <Badge variant={bank.status === "active" ? "secondary" : "outline"} className="capitalize">
              {bank.status}
            </Badge>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Current Balance</div>
            <div className="text-3xl font-semibold tracking-tight">{<Money value={bank.current_balance} />}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Opening: {<Money value={bank.opening_balance} />}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 rounded-md bg-success/10 p-1.5 text-success"><ArrowDownRight className="h-3.5 w-3.5" /></div>
              <div>
                <div className="text-[11px] text-muted-foreground">Total Credit</div>
                <div className="text-sm font-medium text-success">{<Money value={totals.credit} />}</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-0.5 rounded-md bg-destructive/10 p-1.5 text-destructive"><ArrowUpRight className="h-3.5 w-3.5" /></div>
              <div>
                <div className="text-[11px] text-muted-foreground">Total Debit</div>
                <div className="text-sm font-medium text-destructive">{<Money value={totals.debit} />}</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" /> Updated {formatDateTime(bank.updated_at)}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button size="sm" variant="outline" onClick={() => setOpeningOpen(true)}>
              <Pencil className="h-3.5 w-3.5" /> Opening
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link to="/banks">View</Link>
            </Button>
            <Button size="sm" onClick={() => setTransferOpen(true)}>
              <ArrowRightLeft className="h-3.5 w-3.5" /> Transfer
            </Button>
          </div>
        </CardContent>
      </Card>

      <OpeningBalanceDialog open={openingOpen} onOpenChange={setOpeningOpen} bank={bank} />
      <TransferDialog open={transferOpen} onOpenChange={setTransferOpen} fromBank={bank} banks={allBanks} />
    </>
  );
}
