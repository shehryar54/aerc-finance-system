import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Calculator, Save, Info } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSalaryFormulas, useUpsertFormula, evalFormula, type SalaryFormula } from "@/lib/salary";

export const Route = createFileRoute("/salary-formulas")({
  head: () => ({
    meta: [
      { title: "Salary Formulas — Finance Hub" },
      { name: "description", content: "Configure how monthly salaries are calculated without editing code." },
      { property: "og:title", content: "Salary Formulas — Finance Hub" },
      { property: "og:description", content: "Configure salary calculation formulas." },
    ],
  }),
  component: FormulasPage,
});

const TEST_SCOPE = {
  basic_pay: 100000,
  working_days: 26,
  allowances_total: 45000,
  deductions_total: 8000,
  daily_salary: 100000 / 26,
  leave_deduction: 0,
  gross_pay: 145000,
  total_deductions: 8000,
  leaves: { casual: 0, sick: 0, earned: 0, unpaid: 2 },
  manual: { loan_recovery: 5000, income_tax: 3000, advance_salary: 0, misc: 0 },
};

function FormulaCard({ f }: { f: SalaryFormula }) {
  const upsert = useUpsertFormula();
  const [expression, setExpression] = useState(f.expression);
  const [description, setDescription] = useState(f.description ?? "");
  const [preview, setPreview] = useState<{ ok: boolean; value: string }>({ ok: true, value: "" });

  useEffect(() => { setExpression(f.expression); setDescription(f.description ?? ""); }, [f]);

  useEffect(() => {
    try {
      const v = evalFormula(expression, TEST_SCOPE);
      setPreview({ ok: true, value: v.toLocaleString("en-US", { maximumFractionDigits: 2 }) });
    } catch (e) {
      setPreview({ ok: false, value: (e as Error).message });
    }
  }, [expression]);

  const save = async () => {
    try {
      await upsert.mutateAsync({ key: f.key, label: f.label, expression, description });
      toast.success(`${f.label} updated`);
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span>{f.label}</span>
          <code className="text-xs font-mono text-muted-foreground">{f.key}</code>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label className="text-xs">Expression</Label>
          <Input value={expression} onChange={(e) => setExpression(e.target.value)} className="font-mono text-sm" />
        </div>
        <div>
          <Label className="text-xs">Description</Label>
          <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className={`text-xs rounded-md p-2 ${preview.ok ? "bg-muted" : "bg-destructive/10 text-destructive"}`}>
          <span className="font-medium">Test evaluation:</span> <span className="font-mono">{preview.value}</span>
        </div>
        <div className="flex justify-end">
          <Button size="sm" onClick={save} disabled={upsert.isPending}><Save className="h-4 w-4" /> Save</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function FormulasPage() {
  const q = useSalaryFormulas();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Calculator className="h-6 w-6 text-primary" /> Salary Formulas
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Configure how monthly salaries are calculated — no code changes required.</p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Available variables</AlertTitle>
        <AlertDescription className="text-xs font-mono">
          basic_pay, working_days, allowances_total, deductions_total, daily_salary, leave_deduction, gross_pay, total_deductions,
          leaves.casual, leaves.sick, leaves.earned, leaves.unpaid,
          manual.loan_recovery, manual.income_tax, manual.advance_salary, manual.misc
        </AlertDescription>
      </Alert>

      <div className="grid md:grid-cols-2 gap-3">
        {(q.data ?? []).map((f) => <FormulaCard key={f.id} f={f} />)}
      </div>
    </div>
  );
}
