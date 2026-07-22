import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateOpeningBalance, type Bank } from "@/lib/queries";

export function OpeningBalanceDialog({
  open, onOpenChange, bank,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  bank: Bank;
}) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const mut = useUpdateOpeningBalance();

  useEffect(() => {
    if (open) {
      setAmount(String(bank.opening_balance ?? 0));
      setDate(bank.opening_effective_date ?? new Date().toISOString().slice(0, 10));
      setRemarks(bank.opening_remarks ?? "");
    }
  }, [open, bank]);

  const onSave = async () => {
    const val = parseFloat(amount);
    if (!Number.isFinite(val) || val < 0) {
      toast.error("Enter a valid opening balance");
      return;
    }
    try {
      await mut.mutateAsync({
        id: bank.id,
        opening_balance: val,
        opening_effective_date: date || undefined,
        opening_remarks: remarks || undefined,
      });
      toast.success("Opening balance updated");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Opening Balance</DialogTitle>
          <DialogDescription>Updates recalculate the current balance automatically.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Bank Name</Label>
            <Input value={bank.name} disabled />
          </div>
          <div>
            <Label>Opening Balance</Label>
            <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <Label>Effective Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label>Remarks</Label>
            <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSave} disabled={mut.isPending}>{mut.isPending ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
