import { useMemo, useState } from "react";
import { Printer, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSalaryRecords, monthLabel, type SalaryRecord } from "@/lib/salary";
import type { Employee } from "@/lib/queries";
import { formatMoney } from "@/lib/format";
import { SalarySlipDialog } from "./salary-slip-dialog";

type Props = { open: boolean; onOpenChange: (o: boolean) => void; employee?: Employee };

const nowY = new Date().getFullYear();
const YEARS = [nowY - 2, nowY - 1, nowY, nowY + 1];

export function SalaryHistoryDialog({ open, onOpenChange, employee }: Props) {
  const [range, setRange] = useState<"all" | "month" | "quarter" | "year" | "custom">("all");
  const [year, setYear] = useState<number>(nowY);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [quarter, setQuarter] = useState<number>(Math.ceil((new Date().getMonth() + 1) / 3));
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [preview, setPreview] = useState<SalaryRecord | undefined>();

  const q = useSalaryRecords({ employeeId: employee?.id });

  const rows = useMemo(() => {
    const all = q.data ?? [];
    return all.filter((r) => {
      if (range === "month") return r.period_year === year && r.period_month === month;
      if (range === "year") return r.period_year === year;
      if (range === "quarter") {
        const rq = Math.ceil(r.period_month / 3);
        return r.period_year === year && rq === quarter;
      }
      if (range === "custom" && from && to) {
        const d = new Date(r.period_year, r.period_month - 1, 1).getTime();
        return d >= new Date(from).getTime() && d <= new Date(to).getTime();
      }
      return true;
    });
  }, [q.data, range, year, month, quarter, from, to]);

  if (!employee) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Salary History — {employee.full_name} ({employee.employee_code})</DialogTitle>
          </DialogHeader>

          <div className="flex flex-wrap gap-2 items-center">
            <Select value={range} onValueChange={(v) => setRange(v as typeof range)}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All history</SelectItem>
                <SelectItem value="month">By month</SelectItem>
                <SelectItem value="quarter">By quarter</SelectItem>
                <SelectItem value="year">By year</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>
            {range !== "all" && range !== "custom" && (
              <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                <SelectContent>{YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
              </Select>
            )}
            {range === "month" && (
              <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                <SelectContent>{Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <SelectItem key={m} value={String(m)}>{monthLabel(year, m).split(" ")[0]}</SelectItem>)}</SelectContent>
              </Select>
            )}
            {range === "quarter" && (
              <Select value={String(quarter)} onValueChange={(v) => setQuarter(Number(v))}>
                <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                <SelectContent>{[1, 2, 3, 4].map((qu) => <SelectItem key={qu} value={String(qu)}>Q{qu}</SelectItem>)}</SelectContent>
              </Select>
            )}
            {range === "custom" && (
              <>
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-[160px]" />
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-[160px]" />
              </>
            )}
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Basic</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Net Pay</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Slip</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No salary records for this range.</TableCell></TableRow>
                ) : rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{monthLabel(r.period_year, r.period_month)}</TableCell>
                    <TableCell className="text-right">{formatMoney(r.basic_pay)}</TableCell>
                    <TableCell className="text-right">{formatMoney(r.gross_pay)}</TableCell>
                    <TableCell className="text-right">{formatMoney(r.total_deductions)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatMoney(r.net_pay)}</TableCell>
                    <TableCell><Badge variant={r.status === "paid" ? "secondary" : "outline"} className="capitalize">{r.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => setPreview(r)}>
                        <FileText className="h-3.5 w-3.5" /> View
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setPreview(r)}>
                        <Printer className="h-3.5 w-3.5" /> Print
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <SalarySlipDialog open={!!preview} onOpenChange={(o) => !o && setPreview(undefined)} record={preview} employee={employee} />
    </>
  );
}
