import { useRef } from "react";
import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { formatDate } from "@/lib/format";
import type { PaymentVoucher, Vendor, AccountHead, VoucherApproval } from "@/lib/vouchers";
import { amountInWords, splitRsPs, aercHeader, openPrintWindow, escapeHtml } from "@/lib/print-templates";
import aercLogo from "@/assets/aerc-logo.png";
import uokLogo from "@/assets/uok-logo.png";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  voucher: PaymentVoucher | null;
  vendor?: Vendor | null;
  debitHead?: AccountHead | null;
  creditHead?: AccountHead | null;
  approvals?: VoucherApproval[];
};

/** Build the voucher body HTML (used both for on-screen preview and print). */
function voucherBodyHtml(
  voucher: PaymentVoucher,
  vendor: Vendor | null | undefined,
  debitHead: AccountHead | null | undefined,
  creditHead: AccountHead | null | undefined,
): string {
  const amt = splitRsPs(voucher.amount);
  // Bank code: if credit head is a bank, use its code as A/c No fallback
  const bankName = creditHead?.type === "bank" ? creditHead.name : (vendor?.bank_name ?? "");
  // Bank account number only — accounting codes are never printed as A/c No.
  const acNo = vendor?.bank_account_no ?? "";
  const needsVc = Number(voucher.amount) > 100000;
  const headCode = (h: AccountHead | null | undefined) =>
    (h as (AccountHead & { hec_code?: string | null }) | null | undefined)?.hec_code || h?.code || "";
  const payTo = vendor?.name ?? "";
  const description = voucher.description ?? "";
  const emptyRows = Math.max(0, 12 - 2); // padding rows in ledger table
  const emptyTr = Array.from({ length: emptyRows }).map(() =>
    `<tr><td style="height:22px"></td><td></td><td></td><td></td><td></td><td></td></tr>`
  ).join("");

  return `
    ${aercHeader({ subtitle: "UNIVERSITY OF KARACHI" })}

    <table class="no-b" style="margin-top:6px;font-size:12px;">
      <tr>
        <td class="no-b" style="width:70px;"><b>Bank</b></td>
        <td class="no-b"><div class="field-value center"><b>${escapeHtml(bankName)}</b></div></td>
        <td class="no-b" style="width:80px;text-align:right;"><b>Voucher No.</b></td>
        <td class="no-b"><div class="field-value">${escapeHtml(voucher.voucher_no)}</div></td>
      </tr>
      <tr>
        <td class="no-b"><b>A/c. No.</b></td>
        <td class="no-b"><div class="field-value"><span class="mono">${escapeHtml(acNo)}</span> &nbsp; <i>${escapeHtml(voucher.purpose)}</i></div></td>
        <td class="no-b" style="text-align:right;"><b>Date</b></td>
        <td class="no-b"><div class="field-value">${escapeHtml(formatDate(voucher.voucher_date))}</div></td>
      </tr>
    </table>

    <div style="display:grid;grid-template-columns:1fr 220px;gap:12px;margin-top:10px;">
      <div>
        <div style="margin-bottom:8px;"><b>Cheque No.</b> <span class="u" style="min-width:220px;">${escapeHtml(voucher.reference_no ?? "")}</span></div>
        <div style="margin-bottom:8px;"><b>Pay</b> <span class="u" style="min-width:340px;">${escapeHtml(payTo)}</span></div>
        <div style="margin-bottom:8px;"><span class="u" style="min-width:400px;">${escapeHtml(description)}</span></div>
        <div style="margin-bottom:8px;"><b>Rs.</b> <span class="u" style="min-width:220px;"><b>${amt.rs}.${amt.ps}</b></span></div>
      </div>
      <div style="border:1px solid #000;padding:6px;text-align:center;font-size:11px;">
        <div style="font-weight:700;">Receipt of the amount stated<br/>hereon is acknowledged</div>
        <div style="border:1px solid #000;margin:8px auto;padding:14px 8px;width:80%;font-style:italic;">Revenue<br/>stamp<br/>here</div>
        <div style="font-weight:700;">Receiver's Signature</div>
      </div>
    </div>

    <div style="border-top:1px solid #000;border-bottom:1px solid #000;text-align:center;font-weight:700;padding:4px 0;margin-top:6px;">
      the above amount has been incurred in connection with :
    </div>

    <div style="margin:10px 0 8px 0;text-decoration:underline;font-weight:700;">
      ${escapeHtml(voucher.purpose)}${description ? ` — ${escapeHtml(description)}` : ""}
    </div>

    <table style="font-size:12px;">
      <thead>
        <tr>
          <th style="width:44%;">Title of Account</th>
          <th style="width:14%;">A/c. Code</th>
          <th style="width:21%;" colspan="2">Debit</th>
          <th style="width:21%;" colspan="2">Credit</th>
        </tr>
        <tr>
          <th></th><th></th>
          <th class="right" style="width:16%;">Rs.</th><th class="right" style="width:5%;">Ps.</th>
          <th class="right" style="width:16%;">Rs.</th><th class="right" style="width:5%;">Ps.</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><b>Bank/Cash</b></td>
          <td class="mono center">${escapeHtml(headCode(creditHead))}</td>
          <td></td><td></td>
          <td class="right mono"><i>${amt.rs}</i></td><td class="right mono"><i>${amt.ps}</i></td>
        </tr>
        <tr>
          <td>${escapeHtml(debitHead?.name ?? "")}${description ? ` — ${escapeHtml(description)}` : ""}</td>
          <td class="mono center">${escapeHtml(headCode(debitHead))}</td>
          <td class="right mono">${amt.rs}</td><td class="right mono">${amt.ps}</td>
          <td></td><td></td>
        </tr>
        ${emptyTr}
        <tr style="font-weight:700;">
          <td></td><td></td>
          <td class="right mono">${amt.rs}</td><td class="right mono">${amt.ps}</td>
          <td class="right mono">${amt.rs}</td><td class="right mono">${amt.ps}</td>
        </tr>
      </tbody>
    </table>

    <div style="border:1px solid #000;padding:14px 8px;margin-top:16px;">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;text-align:center;gap:8px;">
        <div>Prepared By</div><div>Checked By</div><div>Forwarded By</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;text-align:center;gap:8px;margin-top:34px;font-weight:700;">
        <div style="border-top:1px solid #000;padding-top:2px;">Accounts Officer</div>
        <div style="border-top:1px solid #000;padding-top:2px;">Accounts Officer</div>
        <div style="border-top:1px solid #000;padding-top:2px;">Member Finance</div>
      </div>
    </div>

    <div class="approvals-grid" style="grid-template-columns:repeat(${needsVc ? 4 : 3},1fr)">
      <div class="sig-cell">Director</div>
      <div class="sig-cell">Auditor</div>
      <div class="sig-cell">Director Finance</div>
      ${needsVc ? `<div class="sig-cell">Vice Chancellor</div>` : ""}
    </div>

    <div class="print-foot">
      <div>Printed by: <b>ZK</b></div>
      <div>Print Date: <b>${escapeHtml(formatDate(new Date()))}</b></div>
      <div>Prov Voucher No: <b>${escapeHtml(voucher.voucher_no)}</b></div>
    </div>

    <div style="margin-top:8px;font-size:11px;"><b>Amount in words:</b> ${escapeHtml(amountInWords(Number(voucher.amount)))}</div>
  `;
}

export function VoucherPrintDialog({ open, onOpenChange, voucher, vendor, debitHead, creditHead }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!voucher) return null;

  const bodyHtml = voucherBodyHtml(voucher, vendor, debitHead, creditHead);

  const doPrint = () => {
    openPrintWindow(`Voucher ${voucher.voucher_no}`, bodyHtml);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <div className="font-semibold">Voucher Preview — {voucher.voucher_no}</div>
          <div className="flex gap-2">
            <Button size="sm" onClick={doPrint}><Printer className="h-4 w-4" /> Print / Save PDF</Button>
            <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)}><X className="h-4 w-4" /></Button>
          </div>
        </div>
        <div className="max-h-[80vh] overflow-auto bg-white text-black p-6" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
          <style>{`
            .prev-container img.logo-l,.prev-container img.logo-r{height:56px}
            .prev-container table{border-collapse:collapse;width:100%}
            .prev-container th,.prev-container td{border:1px solid #000;padding:4px 6px;font-size:12px}
            .prev-container .no-b,.prev-container .no-b td,.prev-container .no-b th{border:none}
            .prev-container .u{border-bottom:1px solid #000;display:inline-block;padding:0 6px}
            .prev-container .field-value{border-bottom:1px solid #000;padding:0 6px;min-height:16px}
            .prev-container .aerc-head{display:flex;align-items:center;justify-content:center;gap:16px}
            .prev-container .aerc-head .t1{font-weight:700;font-size:20px}
            .prev-container .aerc-head .t2{font-weight:700;font-size:12px}
            .prev-container .center{text-align:center}.prev-container .right{text-align:right}
            .prev-container .mono{font-family:'Courier New',monospace}
            .prev-container .approvals-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:28px;text-align:center;font-weight:700}
            .prev-container .approvals-grid .sig-cell{border-top:1px solid #000;padding-top:4px}
            .prev-container .print-foot{display:flex;justify-content:space-between;font-size:11px;margin-top:14px}
          `}</style>
          <div className="prev-container" ref={printRef}>
            {/* Inject the same HTML we send to print, so preview matches print exactly */}
            <div
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{
                __html: bodyHtml
                  .replace(/src="[^"]*aerc-logo[^"]*"/g, `src="${aercLogo}"`)
                  .replace(/src="[^"]*uok-logo[^"]*"/g, `src="${uokLogo}"`),
              }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
