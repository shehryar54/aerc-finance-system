import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useOrgSettings, useUpdateOrgSettings } from "@/lib/queries";
import { useTheme } from "@/components/theme-provider";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [
    { title: "Settings — Finance Hub" },
    { name: "description", content: "Organisation preferences, appearance and fiscal year configuration." },
    { property: "og:title", content: "Settings — Finance Hub" },
    { property: "og:description", content: "Manage organisation details and application preferences." },
  ]}),
  component: SettingsPage,
});

function SettingsPage() {
  const q = useOrgSettings();
  const mut = useUpdateOrgSettings();
  const { theme, setTheme } = useTheme();
  const [form, setForm] = useState({ organisation_name: "", address: "", currency: "PKR", fiscal_year_start: "07-01", contact_email: "", contact_phone: "", logo_url: "" });

  useEffect(() => {
    if (q.data) setForm({
      organisation_name: q.data.organisation_name,
      address: q.data.address ?? "",
      currency: q.data.currency,
      fiscal_year_start: q.data.fiscal_year_start,
      contact_email: q.data.contact_email ?? "",
      contact_phone: q.data.contact_phone ?? "",
      logo_url: q.data.logo_url ?? "",
    });
  }, [q.data]);

  const save = async () => {
    if (!q.data) return;
    try {
      await mut.mutateAsync({ id: q.data.id, ...form, address: form.address || null, contact_email: form.contact_email || null, contact_phone: form.contact_phone || null, logo_url: form.logo_url || null });
      toast.success("Settings saved");
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Organisation details, appearance, and defaults used across the app.</p>
      </div>

      <Card className="glass-card"><CardContent className="p-4 space-y-4">
        <h3 className="font-semibold">Organisation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><Label>Organisation Name</Label><Input value={form.organisation_name} onChange={(e) => setForm({ ...form, organisation_name: e.target.value })} /></div>
          <div><Label>Currency</Label><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></div>
          <div><Label>Fiscal Year Start (MM-DD)</Label><Input value={form.fiscal_year_start} onChange={(e) => setForm({ ...form, fiscal_year_start: e.target.value })} /></div>
          <div><Label>Contact Email</Label><Input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></div>
          <div><Label>Contact Phone</Label><Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} /></div>
          <div><Label>Logo URL</Label><Input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
        </div>
        <div className="flex justify-end"><Button onClick={save} disabled={mut.isPending}><Save className="h-4 w-4" /> {mut.isPending ? "Saving…" : "Save changes"}</Button></div>
      </CardContent></Card>

      <Card className="glass-card"><CardContent className="p-4 space-y-3">
        <h3 className="font-semibold">Appearance</h3>
        <div className="flex gap-2">
          {(["light", "dark"] as const).map((t) => (
            <Button key={t} variant={theme === t ? "default" : "outline"} onClick={() => setTheme(t)} className="capitalize">{t}</Button>
          ))}
        </div>
      </CardContent></Card>
    </div>
  );
}
