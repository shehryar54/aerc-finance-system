import { openPrintWindow, aercHeader, escapeHtml, splitRsPs } from "@/lib/print-templates";
import type { LedgerEntry } from "@/lib/ledger";

type Head = { id: string; name: string; code?: string | null; hec_code?: string | null; type?: string };

/** Plain text header used by the ruled ledger sheet (no logos — matches the printed book). */
function ledgerHeader(): string {
  return `
    <div class="lg-head">
      <div class="h1">APPLIED ECONOMICS RESEARCH CENTRE</div>
      <div class="h2">(INSTITUTION OF NATIONAL CAPABILITY IN APPLIED ECONOMICS)</div>
      <div class="h3">University of Karachi</div>
    </div>
  `;
}

/** Ledger sheet — matches ledger_format.pdf exactly.
 *  Year shown once, month only when it changes, per-row balance left blank,
 *  ruled blank rows filling the sheet and a single closing total row. */
export function printLedgerSheet(opts: {
  account: Head;
  rows: LedgerEntry[];
  sheetNo?: string;
  from?: string;
  to?: string;
}) {
  const { account, rows } = opts;
  const TOTAL_ROWS = 19;

  let bal = 0;
  let lastYear = "";
  let lastMonth = "";
  const bodyRows: string[] = [];

  for (const r of rows) {
    const d = Number(r.debit), c = Number(r.credit);
    bal += d - c;
    const dt = new Date(r.entry_date);
    const year = String(dt.getFullYear());
    const month = dt.toLocaleString("en-US", { month: "short" });
    const day = dt.getDate().toString().padStart(2, "0");

    if (year !== lastYear) {
      bodyRows.push(`<tr><td class="m">${year}</td><td class="d"></td>${Array.from({ length: 10 }).map(() => "<td></td>").join("")}</tr>`);
      lastYear = year;
      lastMonth = "";
    }
    const showMonth = month !== lastMonth;
    lastMonth = month;

    const debit = splitRsPs(d);
    const credit = splitRsPs(c);
    const rb = splitRsPs(Math.abs(bal));
    bodyRows.push(`<tr>
      <td class="m">${showMonth ? month : ""}</td>
      <td class="d">${day}</td>
      <td class="center">${escapeHtml(r.voucher_no ?? "")}</td>
      <td class="part">${escapeHtml(r.particulars)}${r.remarks ? ` ${escapeHtml(r.remarks)}` : ""}</td>
      <td class="center">${escapeHtml(r.folio ?? "")}</td>
      <td class="right">${d ? debit.rs : ""}</td>
      <td class="right">${d ? debit.ps : ""}</td>
      <td class="right">${c ? credit.rs : ""}</td>
      <td class="right">${c ? credit.ps : ""}</td>
      <td class="center">${bal === 0 ? "" : bal > 0 ? "Dr" : "Cr"}</td>
      <td class="right">${rb.rs}</td>
      <td class="right">${rb.ps}</td>
    </tr>`);
  }

  const padCount = Math.max(0, TOTAL_ROWS - bodyRows.length);
  const padRows = Array.from({ length: padCount })
    .map(() => `<tr>${Array.from({ length: 12 }).map(() => `<td style="height:26px"></td>`).join("")}</tr>`)
    .join("");

  const totalD = rows.reduce((a, r) => a + Number(r.debit), 0);
  const totalC = rows.reduce((a, r) => a + Number(r.credit), 0);
  const td = splitRsPs(totalD), tc = splitRsPs(totalC), tb = splitRsPs(Math.abs(bal));
  const drCrFinal = bal >= 0 ? "Dr" : "Cr";

  const body = `
    ${ledgerHeader()}
    <div class="acct-line">
      <span class="lbl">NAME OF ACCOUNT</span>
      <span class="acct-name">${escapeHtml(account.name.toUpperCase())}${(account.hec_code || account.code) ? ` &nbsp;<small>(A/c Code: ${escapeHtml(account.hec_code || account.code || "")})</small>` : ""}</span>
      <span class="sheet-lbl">SHEET NO.</span>
      <span class="sheet-box">${escapeHtml(opts.sheetNo ?? "001")}</span>
    </div>
    <table class="ledger">
      <thead>
        <tr>
          <th colspan="2" class="hd-md">Month<br/>&amp;<br/>Date</th>
          <th rowspan="2" style="width:62px;">Voucher<br/>No.</th>
          <th rowspan="2">PARTICULARS</th>
          <th rowspan="2" style="width:46px;">Folio</th>
          <th colspan="2">DEBIT</th>
          <th colspan="2">CREDIT</th>
          <th rowspan="2" style="width:34px;">DR.<br/>or<br/>CR.</th>
          <th colspan="2">BALANCE</th>
        </tr>
        <tr>
          <th style="width:38px;">&nbsp;</th>
          <th style="width:26px;">&nbsp;</th>
          <th style="width:74px;">Rs.</th><th style="width:26px;">Ps.</th>
          <th style="width:74px;">Rs.</th><th style="width:26px;">Ps.</th>
          <th style="width:74px;">Rs.</th><th style="width:26px;">Ps.</th>
        </tr>
      </thead>
      <tbody>
        ${bodyRows.join("")}
        ${padRows}
        <tr class="closing">
          <td colspan="5"></td>
          <td class="right">${totalD ? td.rs : ""}</td><td class="right">${totalD ? td.ps : ""}</td>
          <td class="right">${totalC ? tc.rs : ""}</td><td class="right">${totalC ? tc.ps : ""}</td>
          <td class="center">${drCrFinal}</td>
          <td class="right">${tb.rs}</td><td class="right">${tb.ps}</td>
        </tr>
      </tbody>
    </table>
  `;

  const css = `
    @page{size:A4 landscape;margin:12mm;}
    body{font-family:'Times New Roman',Times,serif;font-size:11px;}
    .lg-head{text-align:center;margin-bottom:10px;}
    .lg-head .h1{font-family:Arial,Helvetica,sans-serif;font-weight:700;font-size:19px;}
    .lg-head .h2{font-family:Arial,Helvetica,sans-serif;font-weight:700;font-size:11px;margin-top:2px;}
    .lg-head .h3{font-family:Arial,Helvetica,sans-serif;font-size:12px;margin-top:1px;}
    .acct-line{display:flex;align-items:flex-end;gap:8px;margin:0 0 6px 0;}
    .acct-line .lbl{font-family:Arial,Helvetica,sans-serif;font-size:13px;}
    .acct-line .acct-name{flex:1;text-align:center;font-style:italic;font-size:13px;letter-spacing:.5px;border-bottom:1px solid #000;}
    .acct-line .sheet-lbl{font-family:Arial,Helvetica,sans-serif;font-size:9px;}
    .acct-line .sheet-box{border:1px solid #000;padding:2px 18px;font-family:Arial,Helvetica,sans-serif;font-size:12px;}
    table.ledger{border-collapse:collapse;width:100%;table-layout:fixed;}
    table.ledger th,table.ledger td{border:1px solid #000;padding:1px 3px;font-size:11px;vertical-align:top;}
    table.ledger th{font-family:Arial,Helvetica,sans-serif;font-weight:700;font-size:10px;text-align:center;vertical-align:middle;}
    table.ledger td.m,table.ledger td.d{text-align:center;}
    table.ledger td.part{text-align:left;}
    table.ledger td.right{text-align:right;}
    table.ledger td.center{text-align:center;}
    table.ledger tr td{height:26px;}
    table.ledger tr.closing td{height:20px;font-weight:400;}
  `;
  openPrintWindow(`Ledger — ${account.name}`, body, css);
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
