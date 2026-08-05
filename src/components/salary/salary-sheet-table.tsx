import { memo, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FileText, Printer, Trash2, CheckCircle2 } from "lucide-react";
import type { Employee } from "@/lib/queries";
import {
  EARNING_FIELDS, DEDUCTION_FIELDS, EDITABLE_KEYS, computeTotals,
  useUpdateSalarySheetCell, useDeleteSalarySheetRow,
  type SalarySheetRow,
} from "@/lib/salary-sheet";
import { formatMoney } from "@/lib/format";

type Props = {
  rows: SalarySheetRow[];
  employeesById: Map<string, Employee>;
  onOpenSlip: (r: SalarySheetRow) => void;
};

const NumCell = memo(function NumCell({
  value, onCommit,
}: { value: number; onCommit: (n: number) => void }) {
  const [v, setV] = useState<string>(String(value ?? 0));
  const initial = useRef(value);
  useEffect(() => { setV(String(value ?? 0)); initial.current = value; }, [value]);

  return (
    <input
      type="number"
      step="0.01"
      value={v}
      onChange={(e) => setV(e.target.value)}
      onFocus={(e) => e.currentTarget.select()}
      onBlur={() => {
        const n = Number(v || 0);
        if (Number.isFinite(n) && n !== Number(initial.current || 0)) onCommit(n);
        else setV(String(initial.current ?? 0));
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
        if (e.key === "Escape") { setV(String(initial.current ?? 0)); (e.currentTarget as HTMLInputElement).blur(); }
      }}
      className="w-24 h-7 px-1.5 text-right text-xs bg-transparent border border-transparent hover:border-border focus:border-primary focus:bg-background rounded outline-none tabular-nums"
    />
  );
});

export function SalarySheetTable({ rows, employeesById, onOpenSlip }: Props) {
  const update = useUpdateSalarySheetCell();
  const del = useDeleteSalarySheetRow();
  // Local optimistic overlay so totals & net_pay refresh instantly while the mutation flies.
  const [overlay, setOverlay] = useState<Record<string, Partial<SalarySheetRow>>>({});

  const commit = (row: SalarySheetRow, key: keyof SalarySheetRow, val: number) => {
    setOverlay((o) => ({ ...o, [row.id]: { ...(o[row.id] ?? {}), [key]: val } }));
    update.mutate(
      { id: row.id, patch: { [key]: val } as Partial<SalarySheetRow> },
      {
        onError: (e) => {
          toast.error((e as Error).message);
          setOverlay((o) => { const c = { ...o }; delete c[row.id]; return c; });
        },
        onSuccess: () => setOverlay((o) => { const c = { ...o }; delete c[row.id]; return c; }),
      },
    );
  };

  const markPaid = (row: SalarySheetRow) => {
    update.mutate(
      { id: row.id, patch: { status: "paid", paid_at: new Date().toISOString() } },
      { onError: (e) => toast.error((e as Error).message), onSuccess: () => toast.success("Marked paid") },
    );
  };

  const remove = (row: SalarySheetRow) => {
    const name = employeesById.get(row.employee_id)?.full_name ?? "record";
    if (!confirm(`Delete salary row for ${name}?`)) return;
    del.mutate(row.id, {
      onError: (e) => toast.error((e as Error).message),
      onSuccess: () => toast.success("Deleted"),
    });
  };

  const view = rows.map((r) => ({ ...r, ...(overlay[r.id] ?? {}) })) as SalarySheetRow[];

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs border-separate border-spacing-0">
        <thead className="sticky top-0 bg-muted/80 backdrop-blur z-10">
          <tr>
            <th className="text-left px-2 py-2 border-b sticky left-0 bg-muted/80 z-20 min-w-[110px]">Emp #</th>
            <th className="text-left px-2 py-2 border-b sticky left-[110px] bg-muted/80 z-20 min-w-[180px]">Name</th>
            {EARNING_FIELDS.map((f) => (
              <th key={f.key} className="px-2 py-2 border-b text-right text-[10px] uppercase tracking-wide whitespace-nowrap">{f.label}</th>
            ))}
            <th className="px-2 py-2 border-b text-right bg-emerald-500/10 whitespace-nowrap">Gross</th>
            {DEDUCTION_FIELDS.map((f) => (
              <th key={f.key} className="px-2 py-2 border-b text-right text-[10px] uppercase tracking-wide whitespace-nowrap">{f.label}</th>
            ))}
            <th className="px-2 py-2 border-b text-right bg-destructive/10 whitespace-nowrap">Deductions</th>
            <th className="px-2 py-2 border-b text-right bg-primary/10 whitespace-nowrap">Net Pay</th>
            <th className="px-2 py-2 border-b text-center whitespace-nowrap">Status</th>
            <th className="px-2 py-2 border-b text-right whitespace-nowrap">Actions</th>
          </tr>
        </thead>
        <tbody>
          {view.length === 0 && (
            <tr><td colSpan={40} className="h-32 text-center text-muted-foreground">
              No records for this month. Click <b>Generate</b> to seed rows from active employees or the previous month.
            </td></tr>
          )}
          {view.map((r) => {
            const emp = employeesById.get(r.employee_id);
            const totals = computeTotals(r);
            return (
              <tr key={r.id} className="hover:bg-muted/40">
                <td className="px-2 py-1 border-b sticky left-0 bg-background z-10 font-mono">{emp?.employee_code ?? "—"}</td>
                <td className="px-2 py-1 border-b sticky left-[110px] bg-background z-10 font-medium whitespace-nowrap">{emp?.full_name ?? "—"}</td>
                {EDITABLE_KEYS.map((k) => (
                  <td key={k} className="px-1 py-0.5 border-b text-right">
                    <NumCell value={Number(r[k] || 0)} onCommit={(n) => commit(r, k, n)} />
                  </td>
                )).slice(0, EARNING_FIELDS.length)}
                <td className="px-2 py-1 border-b text-right font-semibold bg-emerald-500/5 tabular-nums">{<Money value={totals.gross_pay} />}</td>
                {EDITABLE_KEYS.slice(EARNING_FIELDS.length).map((k) => (
                  <td key={k} className="px-1 py-0.5 border-b text-right">
                    <NumCell value={Number(r[k] || 0)} onCommit={(n) => commit(r, k, n)} />
                  </td>
                ))}
                <td className="px-2 py-1 border-b text-right font-semibold bg-destructive/5 tabular-nums">{<Money value={totals.total_deductions} />}</td>
                <td className="px-2 py-1 border-b text-right font-bold text-primary bg-primary/5 tabular-nums">{<Money value={totals.net_pay} />}</td>
                <td className="px-2 py-1 border-b text-center">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] uppercase ${
                    r.status === "paid" ? "bg-emerald-500/15 text-emerald-600"
                    : r.status === "finalized" ? "bg-amber-500/15 text-amber-600"
                    : "bg-muted text-muted-foreground"
                  }`}>{r.status}</span>
                </td>
                <td className="px-2 py-1 border-b text-right whitespace-nowrap">
                  <Button size="icon" variant="ghost" title="Salary slip" onClick={() => onOpenSlip(r)}><FileText className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" title="Print" onClick={() => onOpenSlip(r)}><Printer className="h-3.5 w-3.5" /></Button>
                  {r.status !== "paid" && (
                    <Button size="icon" variant="ghost" title="Mark paid" onClick={() => markPaid(r)}>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" title="Delete" onClick={() => remove(r)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
        {view.length > 0 && (() => {
          const total = view.reduce((a, r) => {
            const t = computeTotals(r);
            return {
              gross: a.gross + t.gross_pay,
              ded: a.ded + t.total_deductions,
              net: a.net + t.net_pay,
            };
          }, { gross: 0, ded: 0, net: 0 });
          const cols = 2 + EARNING_FIELDS.length;
          return (
            <tfoot className="sticky bottom-0 bg-muted/90 backdrop-blur font-semibold">
              <tr>
                <td colSpan={cols} className="px-2 py-2 text-right">Column totals →</td>
                <td className="px-2 py-2 text-right bg-emerald-500/10 tabular-nums">{<Money value={total.gross} />}</td>
                <td colSpan={DEDUCTION_FIELDS.length}></td>
                <td className="px-2 py-2 text-right bg-destructive/10 tabular-nums">{<Money value={total.ded} />}</td>
                <td className="px-2 py-2 text-right bg-primary/10 tabular-nums">{<Money value={total.net} />}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          );
        })()}
      </table>
    </div>
  );
}
