import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LEGACY_ADHOC_KEYS, monthLabel, useCreateAdhoc, useMergeAdhoc, useRemoveAdhoc,
} from "@/lib/salary-sheet";

const LEGACY_LABEL: Record<string, string> = {
  adhoc_2022: "Ad-hoc 2022", adhoc_2023: "Ad-hoc 2023", adhoc_2024: "Ad-hoc 2024", adhoc_2025: "Ad-hoc 2025",
};

export function ManageAdhocDialog({
  open, onOpenChange, year, month, customKeys,
}: {
  open: boolean; onOpenChange: (o: boolean) => void;
  year: number; month: number; customKeys: string[];
}) {
  const merge = useMergeAdhoc();
  const create = useCreateAdhoc();
  const remove = useRemoveAdhoc();
  const [sources, setSources] = useState<string[]>([]);
  const [mergeName, setMergeName] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"percent_of_basic" | "fixed">("percent_of_basic");
  const [value, setValue] = useState("");

  useEffect(() => { if (open) { setSources([]); setMergeName(""); setName(""); setValue(""); } }, [open]);

  const all = [...LEGACY_ADHOC_KEYS, ...customKeys];
  const period = monthLabel(year, month);
  const toggle = (k: string) => setSources((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));

  const doMerge = async () => {
    try {
      const n = await merge.mutateAsync({ year, month, sources, targetName: mergeName });
      toast.success(`Merged into "${mergeName.trim()}" for ${n} rows from ${period} onward`);
      onOpenChange(false);
    } catch (e) { toast.error((e as Error).message); }
  };
  const doCreate = async () => {
    try {
      const n = await create.mutateAsync({ year, month, name, mode, value: Number(value) });
      toast.success(`Added "${name.trim()}" to ${n} rows from ${period} onward`);
      onOpenChange(false);
    } catch (e) { toast.error((e as Error).message); }
  };
  const doRemove = async (k: string) => {
    if (!confirm(`Remove "${k}" from ${period} onward? Earlier months are kept.`)) return;
    try { await remove.mutateAsync({ year, month, name: k }); toast.success("Removed"); }
    catch (e) { toast.error((e as Error).message); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Manage Ad-hoc — from {period}</DialogTitle></DialogHeader>
        <p className="text-xs text-muted-foreground">Changes apply to {period} and later months. Earlier months stay as they are.</p>
        <Tabs defaultValue="new">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="new">New Ad-hoc</TabsTrigger>
            <TabsTrigger value="merge">Merge Ad-hoc</TabsTrigger>
          </TabsList>
          <TabsContent value="new" className="space-y-3 pt-2">
            <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ad-hoc 2026" /></div>
            <div>
              <Label>Calculation</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent_of_basic">Percentage of Basic Pay</SelectItem>
                  <SelectItem value="fixed">Fixed amount (edit per employee afterwards)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{mode === "percent_of_basic" ? "Percentage (%)" : "Amount (Rs.)"}</Label>
              <Input type="number" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} />
            </div>
            {customKeys.length > 0 && (
              <div className="space-y-1">
                <Label>Existing custom Ad-hocs</Label>
                {customKeys.map((k) => (
                  <div key={k} className="flex items-center justify-between text-sm border rounded px-2 py-1">
                    <span>{k}</span>
                    <Button size="sm" variant="ghost" onClick={() => doRemove(k)}>Remove</Button>
                  </div>
                ))}
              </div>
            )}
            <DialogFooter><Button onClick={doCreate} disabled={create.isPending}>Add Ad-hoc</Button></DialogFooter>
          </TabsContent>
          <TabsContent value="merge" className="space-y-3 pt-2">
            <Label>Select columns to merge</Label>
            <div className="grid grid-cols-2 gap-2">
              {all.map((k) => (
                <label key={k} className="flex items-center gap-2 text-sm border rounded px-2 py-1.5 cursor-pointer">
                  <Checkbox checked={sources.includes(k)} onCheckedChange={() => toggle(k)} />
                  {LEGACY_LABEL[k] ?? k}
                </label>
              ))}
            </div>
            <div><Label>New merged name</Label><Input value={mergeName} onChange={(e) => setMergeName(e.target.value)} placeholder="e.g. Ad-hoc Merged" /></div>
            <DialogFooter><Button onClick={doMerge} disabled={merge.isPending}>Merge</Button></DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
