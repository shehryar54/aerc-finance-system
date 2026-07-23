import { useMemo, useRef } from "react";
import { Printer, FileDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Employee } from "@/lib/queries";
import {
  ALLOWANCE_LABELS, DEDUCTION_LABELS, MONTHS, monthLabel, sumValues,
  type SalaryRecord,
} from "@/lib/salary";
import { useOrgSettings } from "@/lib/queries";
import { formatDate } from "@/lib/format";

function fmt(n: number | undefined | null) {
  const v = Number(n || 0);
  if (v === 0) return "0";
  return v.toLocaleString("en-US");
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

// Fixed row order to match the reference slip layout.
const ALLOWANCE_ORDER = [
  "house_rent", "conveyance", "medical", "qualification", "computer",
  "senior_post", "entertainment", "orderly",
  "adhoc_2022", "adhoc_2023", "adhoc_2024", "adhoc_2025",
  "differential", "integrated", "night_duty",
];
const EXTRA_ORDER = ["incentive_child", "telephone", "overtime"];
const DEDUCTION_ORDER = [
  "provident_fund", "withholding_tax", "pf_loan", "housing_car_loan",
  "salary_advance", "other_adjustment", "benevolent_fund", "kuts_membership",
  "special",
];

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  record?: SalaryRecord;
  employee?: Employee;
};

export function SalarySlipDialog({ open, onOpenChange, record, employee }: Props) {
  const orgQ = useOrgSettings();
  const printRef = useRef<HTMLDivElement>(null);

  const grossPayments = useMemo(() =>
    record ? Number(record.basic_pay || 0) + ALLOWANCE_ORDER.reduce((a, k) => a + Number(record.allowances?.[k] || 0), 0) : 0,
    [record]);
  const grossAmount = useMemo(() =>
    record ? grossPayments + EXTRA_ORDER.reduce((a, k) => a + Number(record.allowances?.[k] || 0), 0) : 0,
    [record, grossPayments]);
  const deductionsTotal = useMemo(() =>
    record ? sumValues(record.deductions) : 0, [record]);

  if (!record || !employee) return null;

  const org = orgQ.data;

  const doPrint = () => {
    const html = printRef.current?.innerHTML ?? "";
    const w = window.open("", "_blank", "width=1000,height=1200");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>Salary Slip ${employee.employee_code} ${monthLabel(record.period_year, record.period_month)}</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 24px; color: #000; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; }
        h1,h2,h3,h4 { margin: 0; }
        .slip-header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
        .slip-header h2 { font-size: 16px; text-transform: uppercase; }
        .slip-header h3 { font-size: 13px; font-weight: normal; }
        .meta { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px 12px; margin-bottom: 10px; }
        .meta div { border-bottom: 1px dotted #999; padding: 2px 0; }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .col { border: 1px solid #000; }
        .col h4 { background: #eee; padding: 4px 8px; border-bottom: 1px solid #000; text-align: center; font-size: 12px; }
        .row { display: grid; grid-template-columns: 1fr auto; padding: 2px 8px; }
        .row.total { border-top: 1px solid #000; font-weight: 700; background: #f7f7f7; }
        .footer { margin-top: 10px; font-size: 11px; }
        .footer table { border-top: 1px solid #000; margin-top: 6px; }
        .footer td { padding: 2px 6px; }
        @media print { body { padding: 12px; } .no-print { display: none; } }
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
                <div className="text-sm mt-1 font-semibold">SALARY FOR THE MONTH OF {MONTHS[record.period_month - 1].toUpperCase()} {record.period_year}</div>
              </div>

              <div className="meta grid grid-cols-3 gap-x-3 gap-y-1 text-[11px] mb-2">
                <div><b>Name:</b> {employee.full_name}</div>
                <div><b>D.O.B:</b> —</div>
                <div><b>Financial Year:</b> {record.period_month >= 7 ? `${record.period_year}-${(record.period_year + 1).toString().slice(-2)}` : `${record.period_year - 1}-${record.period_year.toString().slice(-2)}`}</div>
                <div><b>BPS-{employee.bps ?? "—"}</b> {employee.designation ?? ""}</div>
                <div><b>D.O.A:</b> {employee.joining_date ? formatDate(employee.joining_date) : "—"}</div>
                <div><b>Employee No:</b> {employee.employee_code}</div>
                <div><b>CNIC #:</b> {employee.cnic ?? "—"}</div>
                <div className="col-span-2"><b>Length of Service:</b> {serviceLength(employee.joining_date)}</div>
              </div>

              <div className="two-col grid grid-cols-2 gap-4">
                <div className="col border border-black">
                  <h4 className="bg-neutral-200 border-b border-black text-center py-1 text-xs font-bold">PAYMENTS</h4>
                  <div className="row grid grid-cols-[1fr_auto] px-2 py-0.5 text-[11px] font-semibold">
                    <span>Particulars</span><span>Amount (Rs.)</span>
                  </div>
                  <div className="row grid grid-cols-[1fr_auto] px-2 py-0.5 text-[11px]"><span>Basic Pay</span><span>{fmt(record.basic_pay)}</span></div>
                  {ALLOWANCE_ORDER.map((k) => (
                    <div key={k} className="row grid grid-cols-[1fr_auto] px-2 py-0.5 text-[11px]">
                      <span>{ALLOWANCE_LABELS[k] ?? k}</span><span>{fmt(record.allowances?.[k] ?? 0)}</span>
                    </div>
                  ))}
                  <div className="row total grid grid-cols-[1fr_auto] px-2 py-1 text-[11px] font-bold border-t border-black bg-neutral-100">
                    <span>GROSS PAY:</span><span>{fmt(grossPayments)}</span>
                  </div>
                  {EXTRA_ORDER.map((k) => (
                    <div key={k} className="row grid grid-cols-[1fr_auto] px-2 py-0.5 text-[11px]">
                      <span>{ALLOWANCE_LABELS[k] ?? k}</span><span>{fmt(record.allowances?.[k] ?? 0)}</span>
                    </div>
                  ))}
                  <div className="row grid grid-cols-[1fr_auto] px-2 py-0.5 text-[11px]"><span>Arrears</span><span>0</span></div>
                  <div className="row total grid grid-cols-[1fr_auto] px-2 py-1 text-[11px] font-bold border-t border-black bg-neutral-100">
                    <span>GROSS AMOUNT:</span><span>{fmt(grossAmount)}</span>
                  </div>
                </div>

                <div className="col border border-black">
                  <h4 className="bg-neutral-200 border-b border-black text-center py-1 text-xs font-bold">DEDUCTIONS</h4>
                  <div className="row grid grid-cols-[1fr_auto] px-2 py-0.5 text-[11px] font-semibold">
                    <span>Particulars</span><span>Amount (Rs.)</span>
                  </div>
                  {DEDUCTION_ORDER.map((k) => (
                    <div key={k} className="row grid grid-cols-[1fr_auto] px-2 py-0.5 text-[11px]">
                      <span>{DEDUCTION_LABELS[k] ?? k}</span><span>{fmt(record.deductions?.[k] ?? 0)}</span>
                    </div>
                  ))}
                  <div className="row total grid grid-cols-[1fr_auto] px-2 py-1 text-[11px] font-bold border-t border-black bg-neutral-100">
                    <span>DEDUCTIONS:</span><span>{fmt(deductionsTotal)}</span>
                  </div>
                  <div className="row grid grid-cols-[1fr_auto] px-2 py-0.5 text-[11px]">
                    <span>Earned Leave {record.leaves?.earned ?? 0}</span><span>0</span>
                  </div>
                  <div className="row grid grid-cols-[1fr_auto] px-2 py-0.5 text-[11px]">
                    <span>Leave Without Pay {record.leaves?.unpaid ?? 0}</span><span>{fmt(record.leave_deduction)}</span>
                  </div>
                  <div className="row grid grid-cols-[1fr_auto] px-2 py-0.5 text-[11px]"><span>Loan Recovery</span><span>{fmt(record.manual_deductions?.loan_recovery)}</span></div>
                  <div className="row grid grid-cols-[1fr_auto] px-2 py-0.5 text-[11px]"><span>Income Tax (Manual)</span><span>{fmt(record.manual_deductions?.income_tax)}</span></div>
                  <div className="row grid grid-cols-[1fr_auto] px-2 py-0.5 text-[11px]"><span>Advance Salary</span><span>{fmt(record.manual_deductions?.advance_salary)}</span></div>
                  <div className="row grid grid-cols-[1fr_auto] px-2 py-0.5 text-[11px]"><span>Miscellaneous</span><span>{fmt(record.manual_deductions?.misc)}</span></div>
                  <div className="row total grid grid-cols-[1fr_auto] px-2 py-1 text-[11px] font-bold border-t border-black bg-neutral-100">
                    <span>NET PAY:</span><span>{fmt(record.net_pay)}</span>
                  </div>
                </div>
              </div>

              <div className="footer mt-3 text-[11px]">
                <div className="border-t border-black pt-2">
                  <div><b>BANKER:</b> {employee.bank_id ? "Employee Bank on file" : "—"} &nbsp; <b>A/c #</b> {employee.bank_account_no ?? "—"}</div>
                  <div className="mt-1">Leaves Balances — Casual: {record.leaves?.casual ?? 0} &nbsp; Sick: {record.leaves?.sick ?? 0} &nbsp; Earned: {record.leaves?.earned ?? 0} &nbsp; Unpaid: {record.leaves?.unpaid ?? 0}</div>
                  {record.remarks && <div className="mt-1"><b>Remarks:</b> {record.remarks}</div>}
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
