import aercLogo from "@/assets/aerc-logo.png";
import uokLogo from "@/assets/uok-logo.png";

/** Split a rupee amount into whole rupees & 2-digit paisa strings. */
export function splitRsPs(n: number | string | null | undefined): { rs: string; ps: string } {
  const v = typeof n === "string" ? parseFloat(n) : n ?? 0;
  const safe = Number.isFinite(v) ? v : 0;
  const rs = Math.floor(Math.abs(safe));
  const ps = Math.round((Math.abs(safe) - rs) * 100);
  return {
    rs: (safe < 0 ? "-" : "") + rs.toLocaleString("en-US"),
    ps: ps.toString().padStart(2, "0"),
  };
}

export function amountInWords(amount: number): string {
  const a = ["","one","two","three","four","five","six","seven","eight","nine","ten",
    "eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"];
  const b = ["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"];
  const inW = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " hundred" + (n % 100 ? " " + inW(n % 100) : "");
    if (n < 100000) return inW(Math.floor(n / 1000)) + " thousand" + (n % 1000 ? " " + inW(n % 1000) : "");
    if (n < 10000000) return inW(Math.floor(n / 100000)) + " lakh" + (n % 100000 ? " " + inW(n % 100000) : "");
    return inW(Math.floor(n / 10000000)) + " crore" + (n % 10000000 ? " " + inW(n % 10000000) : "");
  };
  const rupees = Math.floor(amount);
  const paisa = Math.round((amount - rupees) * 100);
  let s = "Rupees " + (inW(rupees) || "zero");
  if (paisa) s += " and " + inW(paisa) + " paisa";
  return s.replace(/\s+/g, " ").trim() + " only";
}

export function escapeHtml(v: unknown): string {
  return String(v ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!
  ));
}

/** Common AERC document header (logos + institution name) */
export function aercHeader(opts: { subtitle?: string } = {}): string {
  return `
    <div class="aerc-head">
      <img src="${aercLogo}" class="logo-l" />
      <div class="title-block">
        <div class="t1">APPLIED ECONOMICS RESEARCH CENTRE</div>
        ${opts.subtitle
          ? `<div class="t2">${escapeHtml(opts.subtitle)}</div>`
          : `<div class="t2">(INSTITUTION OF NATIONAL CAPABILITY IN APPLIED ECONOMICS)</div>
             <div class="t3">University of Karachi</div>`}
      </div>
      <img src="${uokLogo}" class="logo-r" />
    </div>
  `;
}

/** Shared print CSS for all AERC documents. */
export const PRINT_CSS = `
  *{box-sizing:border-box;font-family:'Times New Roman','Times',serif;}
  body{margin:0;padding:24px 28px;color:#000;background:#fff;font-size:12px;}
  .aerc-head{display:flex;align-items:center;justify-content:center;gap:16px;padding-bottom:8px;}
  .aerc-head .logo-l,.aerc-head .logo-r{height:56px;width:auto;object-fit:contain;}
  .aerc-head .title-block{text-align:center;}
  .aerc-head .t1{font-weight:700;font-size:20px;letter-spacing:.5px;}
  .aerc-head .t2{font-weight:700;font-size:12px;margin-top:2px;}
  .aerc-head .t3{font-size:12px;margin-top:1px;}
  table{border-collapse:collapse;width:100%;}
  th,td{border:1px solid #000;padding:4px 6px;vertical-align:top;}
  th{font-weight:700;text-align:center;font-size:11px;}
  .no-b,.no-b td,.no-b th{border:none;}
  .center{text-align:center;} .right{text-align:right;} .left{text-align:left;}
  .mono{font-family:'Courier New',monospace;}
  .u{border-bottom:1px solid #000;display:inline-block;min-width:120px;padding:0 6px;}
  .row{display:flex;gap:12px;align-items:flex-end;}
  .grow{flex:1;}
  .field-label{font-weight:700;font-size:12px;}
  .field-value{border-bottom:1px solid #000;padding:0 6px;min-height:16px;}
  .sig-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;margin-top:40px;text-align:center;}
  .sig-cell{border-top:1px solid #000;padding-top:4px;font-weight:700;font-size:12px;}
  .approvals-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:28px;text-align:center;font-size:12px;font-weight:700;}
  .approvals-grid .sig-cell{border-top:1px solid #000;padding-top:4px;}
  .print-foot{display:flex;justify-content:space-between;font-size:11px;margin-top:14px;}
  @page{size:A4;margin:12mm;}
  @media print{body{padding:0;}}
`;

export function openPrintWindow(title: string, bodyHtml: string, extraCss = "") {
  const w = window.open("", "_blank", "width=1000,height=1100");
  if (!w) return;
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
    <style>${PRINT_CSS}${extraCss}</style></head><body>${bodyHtml}
    <script>window.onload=()=>{setTimeout(()=>{window.print();},300);}</script>
    </body></html>`);
  w.document.close();
}
