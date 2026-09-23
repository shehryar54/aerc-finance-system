import { useMemo } from "react";
import { Printer, FileDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Employee } from "@/lib/queries";
import { useOrgSettings } from "@/lib/queries";
import { monthLabel, type SalarySheetRow } from "@/lib/salary-sheet";
import { buildSalarySlipHtml, printSalarySlips, SLIP_CSS } from "@/lib/print-salary-slip";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  row?: SalarySheetRow;
  employee?: Employee;
};

export function SalarySheetSlipDialog({ open, onOpenChange, row, employee }: Props) {
  const orgQ = useOrgSettings();
  const html = useMemo(
    () => (row && employee ? buildSalarySlipHtml(row, employee, orgQ.data?.organisation_name) : ""),
    [row, employee, orgQ.data],
  );
  if (!row || !employee) return null;
  const print = () =>
    printSalarySlips(`Salary Slip — ${employee.full_name} — ${monthLabel(row.period_year, row.period_month)}`, [html]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader><DialogTitle>Salary Slip — {employee.full_name}</DialogTitle></DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <div className="bg-white text-black rounded p-2">
            <style>{SLIP_CSS.replace(/body\{[^}]*\}/g, "")}</style>
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={print}><FileDown className="h-3.5 w-3.5" /> Save PDF</Button>
          <Button size="sm" onClick={print}><Printer className="h-3.5 w-3.5" /> Print</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
