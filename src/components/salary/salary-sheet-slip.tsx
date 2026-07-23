import { useMemo, useRef } from "react";
import { Printer, FileDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Employee } from "@/lib/queries";
import { useOrgSettings } from "@/lib/queries";
import { formatDate } from "@/lib/format";
import { MONTHS, type SalarySheetRow } from "@/lib/salary-sheet";

const AERC_LOGO = "https://www.aerc.edu.pk/wp-content/uploads/2018/10/AERC-Favicon.png";
const UOK_LOGO = "https://www.aerc.edu.pk/wp-content/uploads/2018/10/AERC-Favicon.png";

function fmt(n: number | null | undefined) {
  const v = Number(n || 0);
  if (!Number.isFinite(v) || v === 0) return "0";
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
    if (!row) return { gross: 0, ded: 0, net: 0, grossAmount: 0 };
    const gross = Number(row.gross_pay || 0);
    const extras =
      Number(row.incentive_child || 0) +
      Number(row.telephone || 0) +
      Number(row.overtime || 0);
    const ded = Number(row.total_deductions || 0);
    return {
      gross,
      ded,
      grossAmount: gross + extras,
      net: gross + extras - ded,
    };
  }, [row]);

  if (!row || !employee) return null;
  const org = orgQ.data;

  const monthName = MONTHS[row.period_month - 1].toUpperCase();
  const finYear = row.period_month >= 7
    ? `${row.period_year}-${(row.period_year + 1).toString().slice(-2)}`
    : `${row.period_year - 1}-${row.period_year.toString().slice(-2)}`;

  const doPrint = () => {
    const html = printRef.current?.innerHTML ?? "";
    const w = window.open("", "_blank", "width=1100,height=1400");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>Salary Slip ${employee.employee_code} ${monthName} ${row.period_year}</title>
      <style>
        *{box-sizing:border-box}
        body{font-family:'Times New Roman',Times,serif;padding:14px;color:#000;font-size:12px}
        table{width:100%;border-collapse:collapse;table-layout:fixed}
        td,th{border:1px solid #000;padding:3px 6px;vertical-align:top;font-size:12px}
        .no-b{border:none !important}
        .b-t{border-top:1px solid #000}
        .b-b{border-bottom:1px solid #000}
        .b-r{border-right:1px solid #000}
        .b-l{border-left:1px solid #000}
        .center{text-align:center}
        .right{text-align:right}
        .bold{font-weight:700}
        .italic{font-style:italic}
        .sp{letter-spacing:3px}
        .hdr{font-weight:700;text-align:center}
        .row-lbl{font-style:italic}
        .num{text-align:right;font-variant-numeric:tabular-nums}
        .shade{background:#f2f2f2}
        img.logo{height:40px;width:40px;object-fit:contain}
        @media print{body{padding:6px}.no-print{display:none}}
      </style></head><body>${html}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] p-0">
        <DialogHeader className="px-6 pt-5 pb-2">
          <DialogTitle>Salary Slip — {employee.full_name}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[74vh]">
          <div className="px-6 py-4 bg-white text-black">
            <div ref={printRef} style={{ fontFamily: "'Times New Roman', Times, serif", color: "#000" }}>
              <table>
                <colgroup>
                  <col style={{ width: "58%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "12%" }} />
                </colgroup>
                <tbody>
                  {/* Header row */}
                  <tr>
                    <td colSpan={2} className="center bold">
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <img className="logo" src={AERC_LOGO} alt="AERC" />
                        <div>
                          <div style={{ fontSize: 13 }}>{(org?.organisation_name ?? "APPLIED ECONOMICS RESEARCH CENTRE").toUpperCase()}</div>
                          <div>UNIVERSITY OF KARACHI</div>
                        </div>
                        <img className="logo" src={UOK_LOGO} alt="UoK" />
                      </div>
                    </td>
                    <td colSpan={2} className="center bold">
                      SALARY FOR THE MONTH OF {monthName} {row.period_year}
                    </td>
                  </tr>

                  {/* Employee meta */}
                  <tr>
                    <td colSpan={2}><b>Name:</b> {employee.full_name}</td>
                    <td colSpan={2}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span><b>D.O.B</b> {(employee as any).date_of_birth ? formatDate((employee as any).date_of_birth) : "—"}</span>
                        <span><b>Financial Year:</b> {finYear}</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2}><b>BPS-{employee.bps ?? "—"}</b>&nbsp;&nbsp;{employee.designation ?? ""}</td>
                    <td colSpan={2}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span><b>D.O.A</b> {employee.joining_date ? formatDate(employee.joining_date) : "—"}</span>
                        <span><b>Employee No:</b> {employee.employee_code}</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2}><b>CNIC #</b> {employee.cnic ?? "—"}</td>
                    <td colSpan={2}><i>Length of Service: {serviceLength(employee.joining_date)}</i></td>
                  </tr>

                  {/* Column headers */}
                  <tr>
                    <td className="center bold sp">P A Y M E N T S</td>
                    <td></td>
                    <td className="center bold sp">D E D U C T I O N S</td>
                    <td></td>
                  </tr>
                  <tr className="shade">
                    <td className="bold italic">Particulars</td>
                    <td className="right bold italic">Amount (Rs.)</td>
                    <td className="bold italic">Particulars</td>
                    <td className="right bold italic">Amount (Rs.)</td>
                  </tr>

                  {/* Payments vs Deductions rows */}
                  {[
                    ["Basic Pay", row.basic_pay, "Provident Fund Subscription", row.provident_fund],
                    ["House Rent Allowance", row.house_rent, "Withholding Tax", row.income_tax],
                    ["Conveyance Allowance", row.conveyance, "Loan Provident Fund", row.pf_loan],
                    ["Medical Allowance", row.medical, "Deduction – Housing / Car Loan", row.housing_car_loan],
                    ["Qualification Allowance", row.qualification, "Salary Advance", row.salary_advance],
                    ["Computer Allowance", row.computer, "Other Advances", row.other_adjustment],
                    ["Senior Post Allowance", row.senior_post, "KUTS Benevolent Fund", row.kuts_benevolent],
                    ["Entertainment Allowance", row.entertainment, "KUTS / KUOWA Membership Fee", row.kuts_kuowa],
                    ["Orderly Allowance", row.orderly, "Group Insurance", 0],
                    ["Ad-hoc Relief Allowance 2022", row.adhoc_2022, "Medical Adjustment", 0],
                    ["Ad-hoc Relief Allowance 2023", row.adhoc_2023, "Revenue Stamps", 0],
                    ["Ad-hoc Relief Allowance 2024", row.adhoc_2024, "Professional tax", 0],
                    ["Ad-hoc Relief Allowance 2025", row.adhoc_2025, "", null],
                    ["Differential Allowance", row.differential, "", null],
                    ["Integrated Allowance", row.integrated, "", null],
                    ["Night Duty & Other Allowance", row.night_duty, "", null],
                  ].map(([lp, vp, ld, vd], i) => (
                    <tr key={i}>
                      <td className="italic">{lp as string}</td>
                      <td className="num italic">{fmt(vp as number)}</td>
                      <td className="italic">{ld as string}</td>
                      <td className="num italic">{vd === null ? "" : fmt(vd as number)}</td>
                    </tr>
                  ))}

                  {/* Gross Pay / Deductions total */}
                  <tr className="shade">
                    <td className="bold">GROSS PAY:</td>
                    <td className="num bold">{fmt(totals.gross)}</td>
                    <td className="bold">DEDUCTIONS:</td>
                    <td className="num bold">{fmt(totals.ded)}</td>
                  </tr>

                  {/* Extras below gross */}
                  <tr>
                    <td className="italic">Incentive Award / Child Education Allowance</td>
                    <td className="num italic">{fmt(row.incentive_child)}</td>
                    <td className="italic bold">Deductions</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td className="italic">Telephone Allowance</td>
                    <td className="num italic">{fmt(row.telephone)}</td>
                    <td className="italic">Earned Leave&nbsp;&nbsp;0</td>
                    <td className="num italic">0</td>
                  </tr>
                  <tr>
                    <td className="italic">Overtime / Leave Encashment / Special Pay</td>
                    <td className="num italic">{fmt(row.overtime)}</td>
                    <td className="italic">Leave Without Pay&nbsp;&nbsp;0</td>
                    <td className="num italic">0</td>
                  </tr>
                  <tr>
                    <td className="italic">Arrears</td>
                    <td className="num italic">0</td>
                    <td className="italic">Night Duty Allowance</td>
                    <td className="num italic">{fmt(row.night_duty)}</td>
                  </tr>

                  {/* Gross Amount / Net Pay */}
                  <tr className="shade">
                    <td className="bold">GROSS AMOUNT:</td>
                    <td className="num bold">{fmt(totals.grossAmount)}</td>
                    <td className="bold">NET PAY:</td>
                    <td className="num bold">{fmt(totals.net)}</td>
                  </tr>
                  <tr>
                    <td></td>
                    <td></td>
                    <td className="italic">Monthly Contribution IMAF</td>
                    <td className="num italic">0</td>
                  </tr>

                  {/* Banker row spans full width */}
                  <tr className="shade">
                    <td colSpan={2} className="bold">
                      BANKER: {((employee as any).bank_name ?? "NATIONAL BANK OF PAKISTAN, UNIVERSITY CAMPUS BRANCH, KARACHI").toUpperCase()}.
                    </td>
                    <td className="bold">A/c # {employee.bank_account_no ?? "—"}</td>
                    <td className="num bold">{fmt(totals.net)}</td>
                  </tr>

                  {/* Bottom summary */}
                  <tr>
                    <td className="italic">Total Provident Fund</td>
                    <td className="num italic">{fmt(row.provident_fund)}</td>
                    <td className="italic" colSpan={2}>
                      <b>Balances:</b>&nbsp;&nbsp;Provident Fund Loan : <span style={{ float: "right" }}>0</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="italic">Total Withholding Tax</td>
                    <td className="num italic">{fmt(row.income_tax)}</td>
                    <td className="italic" colSpan={2}>Salary Advance : <span style={{ float: "right" }}>0</span></td>
                  </tr>
                  <tr>
                    <td className="italic">Total Ittemad Mahana Aamdani Fund</td>
                    <td className="num italic">0</td>
                    <td className="italic" colSpan={2}>Medical / Excess Salary Adjustment : <span style={{ float: "right" }}>0</span></td>
                  </tr>
                  <tr>
                    <td className="italic">Previous Year Balance of Withholding tax C/F</td>
                    <td className="num italic">0</td>
                    <td className="italic" colSpan={2}>Housing / Car Loan : <span style={{ float: "right" }}>{fmt(row.housing_car_loan)}</span></td>
                  </tr>
                  <tr>
                    <td className="italic bold">Leaves Balances as on {monthName.charAt(0) + monthName.slice(1).toLowerCase()} 15, {row.period_year}:</td>
                    <td className="italic bold center">Casual: 0</td>
                    <td className="italic bold">Earned: 0</td>
                    <td className="italic" >Group Insurance / Welfare Fund : <span style={{ float: "right" }}>0</span></td>
                  </tr>
                </tbody>
              </table>

              {row.remarks && (
                <div style={{ marginTop: 8, fontSize: 11 }}><b>Remarks:</b> {row.remarks}</div>
              )}
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
