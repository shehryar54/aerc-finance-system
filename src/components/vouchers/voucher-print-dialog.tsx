import { useRef } from "react";
import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { formatMoney, formatDate } from "@/lib/format";
import type { PaymentVoucher, Vendor, AccountHead, VoucherApproval } from "@/lib/vouchers";
import { STATUS_LABELS } from "@/lib/vouchers";
import { useOrgSettings } from "@/lib/queries";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  voucher: PaymentVoucher | null;
  vendor?: Vendor | null;
  debitHead?: AccountHead | null;
  creditHead?: AccountHead | null;
  approvals?: VoucherApproval[];
};

function amountInWords(amount: number): string {
  const a = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
    "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
  const b = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  const inWords = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " hundred" + (n % 100 ? " " + inWords(n % 100) : "");
    if (n < 100000) return inWords(Math.floor(n / 1000)) + " thousand" + (n % 1000 ? " " + inWords(n % 1000) : "");
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + " lakh" + (n % 100000 ? " " + inWords(n % 100000) : "");
    return inWords(Math.floor(n / 10000000)) + " crore" + (n % 10000000 ? " " + inWords(n % 10000000) : "");
  };
  const rupees = Math.floor(amount);
  const paisa = Math.round((amount - rupees) * 100);
  let s = "Rupees " + (inWords(rupees) || "zero");
  if (paisa) s += " and " + inWords(paisa) + " paisa";
  return s.replace(/\s+/g, " ").trim() + " only";
}

export function VoucherPrintDialog({ open, onOpenChange, voucher, vendor, debitHead, creditHead, approvals = [] }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  const org = useOrgSettings().data;

  if (!voucher) return null;

  const doPrint = () => {
    const el = printRef.current;
    if (!el) return;
    const w = window.open("", "_blank", "width=900,height=1000");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>${voucher.voucher_no}</title>
      <style>
        *{box-sizing:border-box;font-family:'Helvetica','Arial',sans-serif;}
        body{margin:0;padding:32px;color:#111;}
        .header{text-align:center;border-bottom:2px solid #111;padding-bottom:12px;margin-bottom:18px;}
        .title{font-size:22px;font-weight:700;letter-spacing:1px;}
        .subtitle{font-size:12px;color:#555;margin-top:4px;}
        .voucher-title{font-size:16px;font-weight:700;text-transform:uppercase;margin-top:12px;letter-spacing:3px;background:#111;color:#fff;display:inline-block;padding:6px 20px;}
        .meta{display:flex;justify-content:space-between;font-size:12px;margin:14px 0;}
        table{width:100%;border-collapse:collapse;margin-top:10px;font-size:12px;}
        th,td{border:1px solid #333;padding:8px 10px;text-align:left;}
        th{background:#f2f2f2;text-transform:uppercase;font-size:11px;}
        .amount-row td{font-weight:700;background:#fafafa;}
        .in-words{border:1px solid #333;padding:10px;margin-top:10px;font-size:12px;}
        .sign-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:60px;}
        .sign-box{text-align:center;border-top:1px solid #333;padding-top:6px;font-size:11px;text-transform:uppercase;letter-spacing:1px;}
        .approvals{margin-top:16px;font-size:11px;}
        .status{display:inline-block;padding:2px 8px;border:1px solid #333;border-radius:3px;font-size:10px;text-transform:uppercase;}
        @media print { body{padding:16px;} }
      </style></head><body>${el.innerHTML}
      <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),400);}</script>
      </body></html>`);
    w.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <div className="font-semibold">Voucher Preview — {voucher.voucher_no}</div>
          <div className="flex gap-2">
            <Button size="sm" onClick={doPrint}><Printer className="h-4 w-4" /> Print / Save PDF</Button>
            <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)}><X className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="max-h-[80vh] overflow-auto bg-white text-black p-6">
          <div ref={printRef}>
            <div className="header">
              <div className="title">{org?.organisation_name || "AERC Finance"}</div>
              <div className="subtitle">{org?.address ?? ""}</div>
              <div className="voucher-title">Payment Voucher</div>
            </div>

            <div className="meta">
              <div><b>Voucher #:</b> {voucher.voucher_no}</div>
              <div><b>Date:</b> {formatDate(voucher.voucher_date)}</div>
              <div><b>Status:</b> <span className="status">{STATUS_LABELS[voucher.status]}</span></div>
            </div>

            <table>
              <tbody>
                <tr>
                  <th style={{ width: "30%" }}>Paid To (Vendor)</th>
                  <td>
                    {vendor ? (
                      <>
                        <div><b>{vendor.name}</b></div>
                        {vendor.address && <div>{vendor.address}</div>}
                        {vendor.contact_number && <div>Ph: {vendor.contact_number}</div>}
                        {vendor.ntn && <div>NTN: {vendor.ntn}</div>}
                        {vendor.bank_name && <div>Bank: {vendor.bank_name}{vendor.account_title ? ` — ${vendor.account_title}` : ""}{vendor.bank_account_no ? ` (${vendor.bank_account_no})` : ""}</div>}
                      </>
                    ) : "—"}
                  </td>
                </tr>
                <tr><th>Payment Method</th><td>{voucher.payment_method.replace(/_/g, " ").toUpperCase()}{voucher.reference_no ? ` — Ref ${voucher.reference_no}` : ""}</td></tr>
                <tr><th>Purpose</th><td>{voucher.purpose}</td></tr>
                {voucher.description && <tr><th>Description</th><td>{voucher.description}</td></tr>}
              </tbody>
            </table>

            <table style={{ marginTop: 10 }}>
              <thead><tr><th>Account Head</th><th style={{ width: "20%" }}>Debit</th><th style={{ width: "20%" }}>Credit</th></tr></thead>
              <tbody>
                <tr><td>Dr — {debitHead?.name ?? "—"} <span style={{ color: "#666" }}>{debitHead?.code ? `(${debitHead.code})` : ""}</span></td><td style={{ textAlign: "right" }}>{formatMoney(voucher.amount)}</td><td></td></tr>
                <tr><td style={{ paddingLeft: 24 }}>Cr — {creditHead?.name ?? "—"} <span style={{ color: "#666" }}>{creditHead?.code ? `(${creditHead.code})` : ""}</span></td><td></td><td style={{ textAlign: "right" }}>{formatMoney(voucher.amount)}</td></tr>
                <tr className="amount-row"><td style={{ textAlign: "right" }}>Total</td><td style={{ textAlign: "right" }}>{formatMoney(voucher.amount)}</td><td style={{ textAlign: "right" }}>{formatMoney(voucher.amount)}</td></tr>
              </tbody>
            </table>

            <div className="in-words"><b>Amount in words:</b> {amountInWords(Number(voucher.amount))}</div>

            {voucher.remarks && <div className="in-words" style={{ marginTop: 8 }}><b>Remarks:</b> {voucher.remarks}</div>}

            {approvals.length > 0 && (
              <div className="approvals">
                <b>Approval trail:</b>
                <ul style={{ marginTop: 4 }}>
                  {approvals.map((a) => (
                    <li key={a.id}>{formatDate(a.created_at)} — {a.action.replace(/_/g, " ")} by {a.actor_name}{a.remarks ? ` (${a.remarks})` : ""}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="sign-grid">
              <div className="sign-box">Prepared by<br />Payroll Officer</div>
              <div className="sign-box">Approved by<br />Director {voucher.director_approved_by ? `— ${voucher.director_approved_by}` : ""}</div>
              {voucher.requires_vc ? (
                <div className="sign-box">Approved by<br />Vice Chancellor {voucher.vc_approved_by ? `— ${voucher.vc_approved_by}` : ""}</div>
              ) : (
                <div className="sign-box">Received by<br />Vendor</div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
