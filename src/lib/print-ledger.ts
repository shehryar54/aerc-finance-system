import { openPrintWindow, aercHeader, escapeHtml, splitRsPs } from "@/lib/print-templates";
import type { LedgerEntry } from "@/lib/ledger";

type Head = { id: string; name: string; code?: string | null; type?: string };

/** Ledger sheet — matches ledger_format.pdf.
 *  One account per sheet, with Month & Date, Voucher No, Particulars, Folio,
 *  Debit (Rs/Ps), Credit (Rs/Ps), Dr/Cr, Balance (Rs/Ps). */
export function printLedgerSheet(opts: {
  account: Head;
  rows: LedgerEntry[];
  sheetNo?: string;
  from?: string;
  to?: string;
}) {
  const { account, rows } = opts;
  let bal = 0;
  const bodyRows = rows.map((r) => {
    const d = Number(r.debit), c = Number(r.credit);
    bal += d - c;
    const drCr = bal >= 0 ? "Dr" : "Cr";
    const dt = new Date(r.entry_date);
    const month = dt.toLocaleString("en-US", { month: "short" });
    const day = dt.getDate().toString().padStart(2, "0");
    const debit = splitRsPs(d);
    const credit = splitRsPs(c);
    const balance = splitRsPs(Math.abs(bal));
    return `<tr>
      <td class="center"><span class="mono">${month}</span></td>
      <td class="center"><span class="mono">${day}</span></td>
      <td class="center"><span class="mono">${escapeHtml(r.voucher_no ?? "")}</span></td>
      <td>${escapeHtml(r.particulars)}${r.remarks ? ` <span style="color:#555;font-size:10px">— ${escapeHtml(r.remarks)}</span>` : ""}</td>
      <td class="center"><span class="mono">${escapeHtml(r.folio ?? "")}</span></td>
      <td class="right mono">${d ? debit.rs : ""}</td>
      <td class="right mono">${d ? debit.ps : ""}</td>
      <td class="right mono">${c ? credit.rs : ""}</td>
      <td class="right mono">${c ? credit.ps : ""}</td>
      <td class="center"><b>${drCr}</b></td>
      <td class="right mono">${balance.rs}</td>
      <td class="right mono">${balance.ps}</td>
    </tr>`;
  }).join("");

  // Pad to 20 rows for that ruled-book feel
  const padCount = Math.max(0, 20 - rows.length);
  const padRows = Array.from({ length: padCount }).map(() =>
    `<tr>${Array.from({ length: 12 }).map(() => `<td style="height:22px"></td>`).join("")}</tr>`
  ).join("");

  const totalD = rows.reduce((a, r) => a + Number(r.debit), 0);
  const totalC = rows.reduce((a, r) => a + Number(r.credit), 0);
  const td = splitRsPs(totalD), tc = splitRsPs(totalC), tb = splitRsPs(Math.abs(bal));
  const drCrFinal = bal >= 0 ? "Dr" : "Cr";

  const body = `
    ${aercHeader()}
    <div style="display:flex;justify-content:space-between;align-items:flex-end;margin:8px 0 4px 0;">
      <div><b>NAME OF ACCOUNT</b> &nbsp; <span class="u" style="min-width:340px;"><i>${escapeHtml(account.name)}</i></span></div>
      <div><b>SHEET NO.</b> &nbsp; <span style="border:1px solid #000;padding:2px 14px;min-width:60px;display:inline-block;text-align:center;">${escapeHtml(opts.sheetNo ?? "001")}</span></div>
    </div>
    <table>
      <thead>
        <tr>
          <th colspan="2">Month<br/>&amp;<br/>Date</th>
          <th rowspan="2" style="width:70px;">Voucher<br/>No.</th>
          <th rowspan="2">PARTICULARS</th>
          <th rowspan="2" style="width:50px;">Folio</th>
          <th colspan="2">DEBIT</th>
          <th colspan="2">CREDIT</th>
          <th rowspan="2" style="width:44px;">DR.<br/>or<br/>CR.</th>
          <th colspan="2">BALANCE</th>
        </tr>
        <tr>
          <th style="width:44px;">M</th>
          <th style="width:34px;">D</th>
          <th class="right" style="width:80px;">Rs.</th><th class="right" style="width:32px;">Ps.</th>
          <th class="right" style="width:80px;">Rs.</th><th class="right" style="width:32px;">Ps.</th>
          <th class="right" style="width:80px;">Rs.</th><th class="right" style="width:32px;">Ps.</th>
        </tr>
      </thead>
      <tbody>
        ${bodyRows}
        ${padRows}
        <tr style="font-weight:700;background:#f2f2f2;">
          <td colspan="5" class="right">Total</td>
          <td class="right mono">${td.rs}</td><td class="right mono">${td.ps}</td>
          <td class="right mono">${tc.rs}</td><td class="right mono">${tc.ps}</td>
          <td class="center">${drCrFinal}</td>
          <td class="right mono">${tb.rs}</td><td class="right mono">${tb.ps}</td>
        </tr>
      </tbody>
    </table>
    <div style="display:flex;justify-content:space-between;font-size:10px;margin-top:6px;color:#555;">
      <div>Printed: ${escapeHtml(new Date().toLocaleString())}</div>
      <div>${opts.from ? `From ${escapeHtml(opts.from)}` : ""} ${opts.to ? `to ${escapeHtml(opts.to)}` : ""}</div>
    </div>
  `;
  openPrintWindow(`Ledger — ${account.name}`, body, `@page{size:A4 landscape;margin:10mm;}`);
}

/** Cash Book — matches cashbook_format.pdf (Receipts + Payments, two facing pages). */
export function printCashBook(opts: {
  account: Head;
  rows: LedgerEntry[]; // pre-filtered to bank account
  monthLabel: string; // e.g., "June 2026"
  sheetNo?: string;
  openingBalance?: number;
}) {
  const { account, rows, monthLabel } = opts;

  const receipts = rows.filter((r) => Number(r.debit) > 0);
  const payments = rows.filter((r) => Number(r.credit) > 0);

  const renderSide = (side: "RECEIPTS" | "PAYMENTS", data: LedgerEntry[], sheetNo: string) => {
    const isReceipt = side === "RECEIPTS";
    const bodyRows = data.map((r) => {
      const amt = splitRsPs(isReceipt ? Number(r.debit) : Number(r.credit));
      const dt = new Date(r.entry_date);
      const day = dt.getDate().toString().padStart(2, "0");
      const month = dt.toLocaleString("en-US", { month: "short" });
      return `<tr>
        <td class="center" style="min-height:60px;"><span class="mono">${month}</span><br/><span class="mono">${day}</span></td>
        <td class="center mono">${escapeHtml(r.voucher_no ?? "")}</td>
        <td><b>${escapeHtml(r.particulars)}</b>${r.remarks ? `<div style="font-size:11px;color:#333;">${escapeHtml(r.remarks)}</div>` : ""}</td>
        <td class="center mono">${escapeHtml(r.folio ?? "")}</td>
        <td class="right mono">${amt.rs}</td>
        <td class="right mono">${amt.ps}</td>
        <td></td><td></td>
      </tr>`;
    }).join("");

    const pad = Math.max(0, 10 - data.length);
    const padTr = Array.from({ length: pad }).map(() =>
      `<tr>${Array.from({ length: 8 }).map(() => `<td style="height:44px"></td>`).join("")}</tr>`
    ).join("");

    const total = data.reduce((a, r) => a + (isReceipt ? Number(r.debit) : Number(r.credit)), 0);
    const t = splitRsPs(total);

    return `
      <div style="page-break-after:always;">
        ${aercHeader()}
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin:6px 0 2px 0;">
          <div><b>Project:</b> <span class="u" style="min-width:280px;"><b>${escapeHtml(account.name.toUpperCase())}</b></span></div>
          <div><b>SHEET NO.</b> <span style="border:1px solid #000;padding:2px 12px;">${escapeHtml(sheetNo)}</span></div>
        </div>
        <div style="text-align:center;font-weight:700;margin:4px 0;">CASH BOOK FOR THE MONTH OF &nbsp;<u>${escapeHtml(monthLabel)}</u></div>
        <div style="text-align:right;letter-spacing:6px;font-weight:700;margin-top:6px;">${side.split("").join(" ")}</div>
        <table>
          <thead>
            <tr>
              <th rowspan="2" style="width:64px;">Date</th>
              <th rowspan="2" style="width:60px;">Voucher<br/>No.</th>
              <th rowspan="2">PARTICULARS</th>
              <th rowspan="2" style="width:44px;">Folio</th>
              <th colspan="2">AMOUNT</th>
              <th colspan="2">TOTAL</th>
            </tr>
            <tr>
              <th class="right" style="width:80px;">Rs.</th><th class="right" style="width:32px;">Ps.</th>
              <th class="right" style="width:80px;">Rs.</th><th class="right" style="width:32px;">Ps.</th>
            </tr>
          </thead>
          <tbody>
            ${bodyRows}
            ${padTr}
            <tr style="font-weight:700;background:#f2f2f2;">
              <td colspan="4" class="right">${isReceipt ? "Balance c/f" : "Balance c/f"}</td>
              <td></td><td></td>
              <td class="right mono">${t.rs}</td><td class="right mono">${t.ps}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  };

  const body = renderSide("RECEIPTS", receipts, opts.sheetNo ?? "001") +
               renderSide("PAYMENTS", payments, opts.sheetNo ?? "002");
  openPrintWindow(`Cash Book — ${account.name} — ${monthLabel}`, body);
}
