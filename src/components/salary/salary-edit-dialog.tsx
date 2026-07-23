import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { Employee } from "@/lib/queries";
import {
  ALLOWANCE_LABELS, DEDUCTION_LABELS, computeSalary,
  useSalaryFormulas, useUpsertSalaryRecord, type SalaryRecord,
} from "@/lib/salary";
import { formatMoney } from "@/lib/format";

const ALLOWANCE_KEYS = Object.keys(ALLOWANCE_LABELS);
const DEDUCTION_KEYS = Object.keys(DEDUCTION_LABELS);

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  record?: SalaryRecord;
  employee?: Employee;
};

type Draft = {
  working_days: number;
  basic_pay: number;
  allowances: Record<string, number>;
  deductions: Record<string, number>;
  leaves: { casual: number; sick: number; earned: number; unpaid: number };
  manual_deductions: { loan_recovery: number; income_tax: number; advance_salary: number; misc: number };
  remarks: string;
};

function makeDraft(r?: SalaryRecord, e?: Employee): Draft {
  return {
    working_days: r?.working_days ?? 26,
    basic_pay: r?.basic_pay ?? Number(e?.basic_salary ?? 0),
    allowances: { ...(r?.allowances ?? {}) },
    deductions: { ...(r?.deductions ?? {}) },
    leaves: { casual: 0, sick: 0, earned: 0, unpaid: 0, ...(r?.leaves ?? {}) },
    manual_deductions: { loan_recovery: 0, income_tax: 0, advance_salary: 0, misc: 0, ...(r?.manual_deductions ?? {}) },
    remarks: r?.remarks ?? "",
  };
}

export function SalaryEditDialog({ open, onOpenChange, record, employee }: Props) {
  const formulasQ = useSalaryFormulas();
  const upsert = useUpsertSalaryRecord();
  const [draft, setDraft] = useState<Draft>(() => makeDraft(record, employee));

  useEffect(() => { setDraft(makeDraft(record, employee)); }, [record, employee, open]);

  if (!record || !employee) return null;

  const computed = computeSalary(draft, formulasQ.data ?? []);

  const numInput = (val: number, onChange: (n: number) => void) => (
    <Input type="number" step="0.01" value={val} onChange={(e) => onChange(Number(e.target.value || 0))} className="h-8" />
  );

  const save = async () => {
    try {
      await upsert.mutateAsync({
        id: record.id,
        employee_id: record.employee_id,
        period_year: record.period_year,
        period_month: record.period_month,
        ...draft,
        gross_pay: computed.gross_pay,
        leave_deduction: computed.leave_deduction,
        total_deductions: computed.total_deductions,
        net_pay: computed.net_pay,
      });
      toast.success("Salary record saved");
      onOpenChange(false);
    } catch (e) { toast.error((e as Error).message); }
  };

  const finalize = async () => {
    try {
      await upsert.mutateAsync({
        id: record.id,
        employee_id: record.employee_id,
        period_year: record.period_year,
        period_month: record.period_month,
        ...draft,
        gross_pay: computed.gross_pay,
        leave_deduction: computed.leave_deduction,
        total_deductions: computed.total_deductions,
        net_pay: computed.net_pay,
        status: "finalized",
      });
      toast.success("Marked as finalized");
      onOpenChange(false);
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Salary — {employee.full_name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3">
          <div><Label>Working Days</Label>{numInput(draft.working_days, (n) => setDraft({ ...draft, working_days: n }))}</div>
          <div><Label>Basic Pay</Label>{numInput(draft.basic_pay, (n) => setDraft({ ...draft, basic_pay: n }))}</div>
          <div className="text-sm">
            <div className="text-muted-foreground">Daily Salary</div>
            <div className="font-mono h-8 flex items-center">{formatMoney(computed.daily_salary)}</div>
          </div>
        </div>

        <Tabs defaultValue="allowances">
          <TabsList>
            <TabsTrigger value="allowances">Allowances</TabsTrigger>
            <TabsTrigger value="deductions">Deductions</TabsTrigger>
            <TabsTrigger value="leaves">Leaves & Manual</TabsTrigger>
          </TabsList>

          <TabsContent value="allowances" className="grid grid-cols-2 gap-3">
            {ALLOWANCE_KEYS.map((k) => (
              <div key={k}>
                <Label className="text-xs">{ALLOWANCE_LABELS[k]}</Label>
                {numInput(Number(draft.allowances[k] ?? 0), (n) => setDraft({ ...draft, allowances: { ...draft.allowances, [k]: n } }))}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="deductions" className="grid grid-cols-2 gap-3">
            {DEDUCTION_KEYS.map((k) => (
              <div key={k}>
                <Label className="text-xs">{DEDUCTION_LABELS[k]}</Label>
                {numInput(Number(draft.deductions[k] ?? 0), (n) => setDraft({ ...draft, deductions: { ...draft.deductions, [k]: n } }))}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="leaves" className="space-y-4">
            <div>
              <div className="text-sm font-medium mb-2">Leaves (days)</div>
              <div className="grid grid-cols-4 gap-3">
                <div><Label className="text-xs">Casual</Label>{numInput(draft.leaves.casual, (n) => setDraft({ ...draft, leaves: { ...draft.leaves, casual: n } }))}</div>
                <div><Label className="text-xs">Sick</Label>{numInput(draft.leaves.sick, (n) => setDraft({ ...draft, leaves: { ...draft.leaves, sick: n } }))}</div>
                <div><Label className="text-xs">Earned</Label>{numInput(draft.leaves.earned, (n) => setDraft({ ...draft, leaves: { ...draft.leaves, earned: n } }))}</div>
                <div><Label className="text-xs">Unpaid</Label>{numInput(draft.leaves.unpaid, (n) => setDraft({ ...draft, leaves: { ...draft.leaves, unpaid: n } }))}</div>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium mb-2">Manual Deductions</div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Loan Recovery</Label>{numInput(draft.manual_deductions.loan_recovery, (n) => setDraft({ ...draft, manual_deductions: { ...draft.manual_deductions, loan_recovery: n } }))}</div>
                <div><Label className="text-xs">Income Tax</Label>{numInput(draft.manual_deductions.income_tax, (n) => setDraft({ ...draft, manual_deductions: { ...draft.manual_deductions, income_tax: n } }))}</div>
                <div><Label className="text-xs">Advance Salary</Label>{numInput(draft.manual_deductions.advance_salary, (n) => setDraft({ ...draft, manual_deductions: { ...draft.manual_deductions, advance_salary: n } }))}</div>
                <div><Label className="text-xs">Miscellaneous</Label>{numInput(draft.manual_deductions.misc, (n) => setDraft({ ...draft, manual_deductions: { ...draft.manual_deductions, misc: n } }))}</div>
              </div>
            </div>
            <div>
              <Label className="text-xs">Remarks</Label>
              <Textarea rows={2} value={draft.remarks} onChange={(e) => setDraft({ ...draft, remarks: e.target.value })} />
            </div>
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-4 gap-3 rounded-lg border p-3 bg-muted/30">
          <div><div className="text-xs text-muted-foreground">Gross Pay</div><div className="font-semibold">{formatMoney(computed.gross_pay)}</div></div>
          <div><div className="text-xs text-muted-foreground">Leave Deduction</div><div className="font-semibold">{formatMoney(computed.leave_deduction)}</div></div>
          <div><div className="text-xs text-muted-foreground">Total Deductions</div><div className="font-semibold">{formatMoney(computed.total_deductions)}</div></div>
          <div><div className="text-xs text-muted-foreground">Net Pay</div><div className="font-semibold text-primary">{formatMoney(computed.net_pay)}</div></div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="secondary" onClick={finalize} disabled={upsert.isPending}>Save & Finalize</Button>
          <Button onClick={save} disabled={upsert.isPending}>Save Draft</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
