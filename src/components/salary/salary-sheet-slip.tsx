import { useMemo, useRef } from "react";
import { Printer, FileDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Employee } from "@/lib/queries";
import { useOrgSettings } from "@/lib/queries";
import { formatDate } from "@/lib/format";
import {
  EARNING_FIELDS, DEDUCTION_FIELDS, MONTHS, monthLabel,
  type SalarySheetRow,
} from "@/lib/salary-sheet";

function fmt(n: number | null | undefined) {
  const v = Number(n || 0);
  if (v === 0) return "0";
  return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function serviceLength(joining?: string | null, ref = new Date()): string {
  if (!joining) return "—";
  const j = new Date(joining);
  let y = ref.getFullYear() - j.getFullYear();
  let m = ref.getMonth() - j.getMonth();
  let d = ref.getDate() - j.getDate();
  if (d < 0) m -= 1;
  if (m < 0) { y -= 1; m += 12; }
  return `${y} Years ${Math.abs(m)} Months ${Math.max(0, d)} Days`;
}

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  row?: SalarySheetRow;
  employee?: Employee;
};

export function SalarySheetSlipDialog({ open, onOpenChange, row, employee }: Props) {
  const orgQ = useOrgSettings();
  const printRef = useRef<HTMLDivElement>(null);

  const totals = useMemo(() => {
    if (!row) return { gross: 0, ded: 0, net: 0 };
    return { gross: Number(row.gross_pay || 0), ded: Number(row.total_deductions || 0), net: Number(row.net_pay || 0) };
  }, [row]);

  if (!row || !employee) return null;
  const org = orgQ.data;

  const doPrint = () => {
    const html = printRef.current?.innerHTML ?? "";
    const w = window.open("", "_blank", "width=1000,height=1200");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>Salary Slip ${employee.employee_code} ${monthLabel(row.period_year, row.period_month)}</title>
      <style>
        *{box-sizing:border-box}
        body{font-family:Arial,sans-serif;padding:24px;color:#000;font-size:12px}
        table{width:100%;border-collapse:collapse}
        h1,h2,h3,h4{margin:0}
        .slip-header{text-align:center;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:12px}
        .slip-header h2{font-size:16px;text-transform:uppercase}
        .meta{display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px 12px;margin-bottom:10px}
        .meta div{border-bottom:1px dotted #999;padding:2px 0}
        .two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        .col{border:1px solid #000}
        .col h4{background:#eee;padding:4px 8px;border-bottom:1px solid #000;text-align:center;font-size:12px}
        .row{display:grid;grid-template-columns:1fr auto;padding:2px 8px}
        .row.total{border-top:1px solid #000;font-weight:700;background:#f7f7f7}
        .footer{margin-top:10px;font-size:11px}
        @media print{body{padding:12px}.no-print{display:none}}
      </style></head><body>${html}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 250);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>Salary Slip — {employee.full_name}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <div className="px-6 py-4 bg-white text-black">
            <div ref={printRef}>
              <div className="slip-header text-center border-b-2 border-black pb-2 mb-3">
                <h2 className="text-base font-bold uppercase">{org?.organisation_name ?? "Applied Economics Research Centre"}</h2>
                <h3 className="text-sm">University of Karachi</h3>
                <div className="text-sm mt-1 font-semibold">
                  SALARY FOR THE MONTH OF {MONTHS[row.period_month - 1].toUpperCase()} {row.period_year}
                </div>
              </div>

              <div className="meta grid grid-cols-3 gap-x-3 gap-y-1 text-[11px] mb-2">
                <div><b>Name:</b> {employee.full_name}</div>
                <div><b>Employee No:</b> {employee.employee_code}</div>
                <div><b>BPS-{employee.bps ?? "—"}</b> {employee.designation ?? ""}</div>
                <div><b>CNIC #:</b> {employee.cnic ?? "—"}</div>
                <div><b>D.O.A:</b> {employee.joining_date ? formatDate(employee.joining_date) : "—"}</div>
                <div><b>Financial Year:</b> {row.period_month >= 7
                  ? `${row.period_year}-${(row.period_year + 1).toString().slice(-2)}`
                  : `${row.period_year - 1}-${row.period_year.toString().slice(-2)}`}</div>
                <div className="col-span-3"><b>Length of Service:</b> {serviceLength(employee.joining_date)}</div>
              </div>

              <div className="two-col grid grid-cols-2 gap-4">
                <div className="col border border-black">
                  <h4 className="bg-neutral-200 border-b border-black text-center py-1 text-xs font-bold">PAYMENTS</h4>
                  <div className="row grid grid-cols-[1fr_auto] px-2 py-0.5 text-[11px] font-semibold">
                    <span>Particulars</span><span>Amount (Rs.)</span>
                  </div>
                  {EARNING_FIELDS.map((f) => (
                    <div key={f.key} className="row grid grid-cols-[1fr_auto] px-2 py-0.5 text-[11px]">
                      <span>{f.label}</span><span>{fmt(row[f.key] as number)}</span>
                    </div>
                  ))}
                  <div className="row total grid grid-cols-[1fr_auto] px-2 py-1 text-[11px] font-bold border-t border-black bg-neutral-100">
                    <span>GROSS PAY:</span><span>{fmt(totals.gross)}</span>
                  </div>
                </div>

                <div className="col border border-black">
                  <h4 className="bg-neutral-200 border-b border-black text-center py-1 text-xs font-bold">DEDUCTIONS</h4>
                  <div className="row grid grid-cols-[1fr_auto] px-2 py-0.5 text-[11px] font-semibold">
                    <span>Particulars</span><span>Amount (Rs.)</span>
                  </div>
                  {DEDUCTION_FIELDS.map((f) => (
                    <div key={f.key} className="row grid grid-cols-[1fr_auto] px-2 py-0.5 text-[11px]">
                      <span>{f.label}</span><span>{fmt(row[f.key] as number)}</span>
                    </div>
                  ))}
                  <div className="row total grid grid-cols-[1fr_auto] px-2 py-1 text-[11px] font-bold border-t border-black bg-neutral-100">
                    <span>TOTAL DEDUCTIONS:</span><span>{fmt(totals.ded)}</span>
                  </div>
                  <div className="row total grid grid-cols-[1fr_auto] px-2 py-1 text-[11px] font-bold border-t border-black bg-neutral-100">
                    <span>NET PAY:</span><span>{fmt(totals.net)}</span>
                  </div>
                </div>
              </div>

              <div className="footer mt-3 text-[11px]">
                <div className="border-t border-black pt-2">
                  <div><b>Bank A/c #</b> {employee.bank_account_no ?? "—"}</div>
                  {row.remarks && <div className="mt-1"><b>Remarks:</b> {row.remarks}</div>}
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="px-6 pb-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button variant="outline" onClick={doPrint}><FileDown className="h-4 w-4" /> Export PDF</Button>
          <Button onClick={doPrint}><Printer className="h-4 w-4" /> Print</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
