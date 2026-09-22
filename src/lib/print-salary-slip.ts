import { escapeHtml } from "@/lib/print-templates";
import { formatDate } from "@/lib/format";
import { MONTHS, customTotal, type SalarySheetRow } from "@/lib/salary-sheet";
import type { Employee } from "@/lib/queries";

import AERC_LOGO from "@/assets/aerc-logo.png";
import UOK_LOGO from "@/assets/uok-logo.png";

function fmt(n: number | null | undefined) {
  const v = Number(n || 0);
  if (!Number.isFinite(v) || v === 0) return "0";
  return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function serviceLength(joining?: string | null, ref = new Date()): string {
  if (!joining) return "—";
  const j = new Date(joining);
  let y = ref.getFullYear() - j.getFullYear();
  let m = ref.getMonth() - j.getMonth();
  const d = ref.getDate() - j.getDate();
  if (d < 0) m -= 1;
  if (m < 0) { y -= 1; m += 12; }
  return `${y} Years ${Math.abs(m)} Months ${Math.max(0, d)} Days`;
}

export function slipTotals(row: SalarySheetRow) {
  const gross = Number(row.gross_pay || 0);
  const extras =
    Number(row.incentive_child || 0) +
    Number(row.telephone || 0) +
    Number(row.overtime || 0);
  const ded = Number(row.total_deductions || 0);
  // gross_pay already contains the extras, so the printed "Gross Amount" mirrors it
  return { gross: gross - extras, ded, grossAmount: gross, net: gross - ded, custom: customTotal(row) };
}

/** Shared salary-slip markup used for the on-screen preview, single print and Print All. */
export function buildSalarySlipHtml(
  row: SalarySheetRow,
  employee: Employee,
  orgName?: string | null,
): string {
  const t = slipTotals(row);
  const monthName = (MONTHS[row.period_month - 1] ?? "").toUpperCase();
  const finYear = row.period_month >= 7
    ? `${row.period_year}-${(row.period_year + 1).toString().slice(-2)}`
    : `${row.period_year - 1}-${row.period_year.toString().slice(-2)}`;

  const customRows = Object.entries(row.custom_allowances ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => [k, Number(v || 0)] as [string, number]);

  const pairs: [string, number | null, string, number | null][] = [
    ["Basic Pay", row.basic_pay, "Provident Fund Subscription", row.provident_fund],
    ["House Rent Allowance", row.house_rent, "Withholding Tax", row.income_tax],
    ["Conveyance Allowance", row.conveyance, "Loan Provident Fund", row.pf_loan],
    ["Medical Allowance", row.medical, "Deduction – Housing / Car Loan", row.housing_car_loan],
    ["Qualification Allowance", row.qualification, "Salary Advance", row.salary_advance],
    ["Computer Allowance", row.computer, "Other Advances", row.other_adjustment],
    ["Senior Post Allowance", row.senior_post, "KUTS Benevolent Fund", row.kuts_benevolent],
    ["Entertainment Allowance", row.entertainment, "KUTS / KUOWA Membership Fee", row.kuts_kuowa],
    ["Orderly Allowance", row.orderly, "Special Deduction", row.special_deduction],
    ["Ad-hoc Relief Allowance 2022", row.adhoc_2022, "Group Insurance", 0],
    ["Ad-hoc Relief Allowance 2023", row.adhoc_2023, "Medical Adjustment", 0],
    ["Ad-hoc Relief Allowance 2024", row.adhoc_2024, "Revenue Stamps", 0],
    ["Ad-hoc Relief Allowance 2025", row.adhoc_2025, "Professional tax", 0],
    ...customRows.map(([k, v]) => [k, v, "", null] as [string, number, string, null]),
    ["Differential Allowance", row.differential, "", null],
    ["Integrated Allowance", row.integrated, "", null],
    ["Night Duty & Other Allowance", row.night_duty, "", null],
  ];

  const bankName = ((employee as any).bank_name ?? "NATIONAL BANK OF PAKISTAN, UNIVERSITY CAMPUS BRANCH, KARACHI") as string;

  return `
  <div class="slip">
    <table>
      <colgroup>
        <col style="width:58%" /><col style="width:12%" /><col style="width:18%" /><col style="width:12%" />
      </colgroup>
      <tbody>
        <tr>
          <td colspan="2" class="center bold">
            <div class="slip-head">
              <img class="logo" src="${AERC_LOGO}" alt="AERC" />
              <div>
                <div style="font-size:13px">${escapeHtml((orgName ?? "APPLIED ECONOMICS RESEARCH CENTRE").toUpperCase())}</div>
                <div>UNIVERSITY OF KARACHI</div>
              </div>
              <img class="logo" src="${UOK_LOGO}" alt="UoK" />
            </div>
          </td>
          <td colspan="2" class="center bold">SALARY FOR THE MONTH OF ${monthName} ${row.period_year}</td>
        </tr>
        <tr>
          <td colspan="2"><b>Name:</b> ${escapeHtml(employee.full_name)}</td>
          <td colspan="2"><div class="sb"><span><b>D.O.B</b> ${(employee as any).date_of_birth ? escapeHtml(formatDate((employee as any).date_of_birth)) : "—"}</span><span><b>Financial Year:</b> ${finYear}</span></div></td>
        </tr>
        <tr>
          <td colspan="2"><b>BPS-${escapeHtml(employee.bps ?? "—")}</b>&nbsp;&nbsp;${escapeHtml(employee.designation ?? "")}</td>
          <td colspan="2"><div class="sb"><span><b>D.O.A</b> ${employee.joining_date ? escapeHtml(formatDate(employee.joining_date)) : "—"}</span><span><b>Employee No:</b> ${escapeHtml(employee.employee_code)}</span></div></td>
        </tr>
        <tr>
          <td colspan="2"><b>CNIC #</b> ${escapeHtml(employee.cnic ?? "—")}</td>
          <td colspan="2"><i>Length of Service: ${serviceLength(employee.joining_date)}</i></td>
        </tr>
        <tr>
          <td class="center bold sp">P A Y M E N T S</td><td></td>
          <td class="center bold sp">D E D U C T I O N S</td><td></td>
        </tr>
        <tr class="shade">
          <td class="bold italic">Particulars</td><td class="right bold italic">Amount (Rs.)</td>
          <td class="bold italic">Particulars</td><td class="right bold italic">Amount (Rs.)</td>
        </tr>
        ${pairs.map(([lp, vp, ld, vd]) => `<tr>
          <td class="italic">${escapeHtml(lp)}</td>
          <td class="num italic">${vp === null ? "" : fmt(vp)}</td>
          <td class="italic">${escapeHtml(ld)}</td>
          <td class="num italic">${vd === null ? "" : fmt(vd)}</td>
        </tr>`).join("")}
        <tr class="shade">
          <td class="bold">GROSS PAY:</td><td class="num bold">${fmt(t.gross)}</td>
          <td class="bold">DEDUCTIONS:</td><td class="num bold">${fmt(t.ded)}</td>
        </tr>
        <tr>
          <td class="italic">Incentive Award / Child Education Allowance</td><td class="num italic">${fmt(row.incentive_child)}</td>
          <td class="italic bold">Deductions</td><td></td>
        </tr>
        <tr>
          <td class="italic">Telephone Allowance</td><td class="num italic">${fmt(row.telephone)}</td>
          <td class="italic">Earned Leave&nbsp;&nbsp;0</td><td class="num italic">0</td>
        </tr>
        <tr>
          <td class="italic">Overtime / Leave Encashment / Special Pay</td><td class="num italic">${fmt(row.overtime)}</td>
          <td class="italic">Leave Without Pay&nbsp;&nbsp;0</td><td class="num italic">0</td>
        </tr>
        <tr>
          <td class="italic">Arrears</td><td class="num italic">0</td>
          <td class="italic">Night Duty Allowance</td><td class="num italic">${fmt(row.night_duty)}</td>
        </tr>
        <tr class="shade">
          <td class="bold">GROSS AMOUNT:</td><td class="num bold">${fmt(t.grossAmount)}</td>
          <td class="bold">NET PAY:</td><td class="num bold">${fmt(t.net)}</td>
        </tr>
        <tr class="shade">
          <td colspan="2" class="bold">BANKER: ${escapeHtml(bankName.toUpperCase())}.</td>
          <td class="bold">A/c # ${escapeHtml(employee.bank_account_no ?? "—")}</td>
          <td class="num bold">${fmt(t.net)}</td>
        </tr>
        <tr>
          <td class="italic">Total Provident Fund</td><td class="num italic">${fmt(row.provident_fund)}</td>
          <td class="italic" colspan="2"><b>Balances:</b>&nbsp;&nbsp;Provident Fund Loan : <span class="fr">${fmt(row.pf_loan)}</span></td>
        </tr>
        <tr>
          <td class="italic">Total Withholding Tax</td><td class="num italic">${fmt(row.income_tax)}</td>
          <td class="italic" colspan="2">Salary Advance : <span class="fr">${fmt(row.salary_advance)}</span></td>
        </tr>
        <tr>
          <td class="italic">Total Ittemad Mahana Aamdani Fund</td><td class="num italic">0</td>
          <td class="italic" colspan="2">Medical / Excess Salary Adjustment : <span class="fr">${fmt(row.other_adjustment)}</span></td>
        </tr>
        <tr>
          <td class="italic">Previous Year Balance of Withholding tax C/F</td><td class="num italic">0</td>
          <td class="italic" colspan="2">Housing / Car Loan : <span class="fr">${fmt(row.housing_car_loan)}</span></td>
        </tr>
        <tr>
          <td class="italic bold">Leaves Balances as on ${monthName.charAt(0) + monthName.slice(1).toLowerCase()} 15, ${row.period_year}:</td>
          <td class="italic bold center">Casual: 0</td>
          <td class="italic bold">Earned: 0</td>
          <td class="italic">Group Insurance / Welfare Fund : <span class="fr">0</span></td>
        </tr>
      </tbody>
    </table>
    ${row.remarks ? `<div style="margin-top:8px;font-size:11px;"><b>Remarks:</b> ${escapeHtml(row.remarks)}</div>` : ""}
  </div>`;
}

export const SLIP_CSS = `
  *{box-sizing:border-box}
  body{font-family:'Times New Roman',Times,serif;padding:14px;color:#000;font-size:12px}
  .slip table{width:100%;border-collapse:collapse;table-layout:fixed}
  .slip td,.slip th{border:1px solid #000;padding:3px 6px;vertical-align:top;font-size:12px}
  .slip .center{text-align:center}
  .slip .right{text-align:right}
  .slip .bold{font-weight:700}
  .slip .italic{font-style:italic}
  .slip .sp{letter-spacing:3px}
  .slip .num{text-align:right;font-variant-numeric:tabular-nums}
  .slip .shade{background:#f2f2f2}
  .slip .sb{display:flex;justify-content:space-between}
  .slip .fr{float:right}
  .slip .slip-head{display:flex;align-items:center;justify-content:center;gap:8px}
  .slip img.logo{height:22px;width:22px;object-fit:contain}
  .slip{page-break-after:always}
  .slip:last-child{page-break-after:auto}
  @page{size:A4;margin:10mm}
  @media print{body{padding:0}}
`;

/** Open a print window containing one or more salary slips, one per page. */
export function printSalarySlips(title: string, slipsHtml: string[]) {
  const w = window.open("", "_blank", "width=1100,height=1400");
  if (!w) return;
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
    <style>${SLIP_CSS}</style></head><body>${slipsHtml.join("")}
    <script>window.onload=()=>{setTimeout(()=>{window.print();},400);}</script>
    </body></html>`);
  w.document.close();
}
