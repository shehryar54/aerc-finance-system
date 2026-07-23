import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, Trash2, Pencil, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useVendors, useUpsertVendor, useDeleteVendor, type Vendor } from "@/lib/vouchers";

export const Route = createFileRoute("/vendors")({
  head: () => ({ meta: [
    { title: "Vendors — Finance Hub" },
    { name: "description", content: "Manage vendor directory: contact details, bank information, and NTN for payment processing." },
    { property: "og:title", content: "Vendors — Finance Hub" },
    { property: "og:description", content: "Vendor directory with bank details and NTN." },
  ]}),
  component: VendorsPage,
});

type FormState = Partial<Vendor>;

function VendorsPage() {
  const q = useVendors();
  const upsert = useUpsertVendor();
  const del = useDeleteVendor();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FormState | null>(null);
  const [toDelete, setToDelete] = useState<Vendor | null>(null);

  const rows = q.data ?? [];
  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim();
    if (!s) return rows;
    return rows.filter((v) =>
      [v.name, v.contact_number, v.email, v.ntn, v.bank_name, v.account_title].some((f) => (f ?? "").toLowerCase().includes(s))
    );
  }, [rows, search]);

  const openNew = () => { setEditing({ status: "active" }); setOpen(true); };
  const openEdit = (v: Vendor) => { setEditing(v); setOpen(true); };

  const save = async () => {
    if (!editing?.name?.trim()) return toast.error("Vendor name is required");
    try {
      await upsert.mutateAsync(editing);
      toast.success(editing.id ? "Vendor updated" : "Vendor added");
      setOpen(false); setEditing(null);
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Vendors</h1>
          <p className="text-sm text-muted-foreground mt-1">Suppliers, contractors and payees used across payment vouchers.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search name, NTN, bank…" className="pl-8 w-72" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button onClick={openNew}><Plus className="h-4 w-4" /> New Vendor</Button>
        </div>
      </div>

      <Card className="glass-card"><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Vendor</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Bank</TableHead>
            <TableHead>Account Title</TableHead>
            <TableHead>Account #</TableHead>
            <TableHead>NTN</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                <div className="flex flex-col items-center gap-2"><Building2 className="h-6 w-6" /> No vendors yet. Add your first vendor to start creating payment vouchers.</div>
              </TableCell></TableRow>
            ) : filtered.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-medium">
                  <div>{v.name}</div>
                  {v.email && <div className="text-xs text-muted-foreground">{v.email}</div>}
                </TableCell>
                <TableCell>{v.contact_number ?? "—"}</TableCell>
                <TableCell>{v.bank_name ?? "—"}</TableCell>
                <TableCell>{v.account_title ?? "—"}</TableCell>
                <TableCell className="font-mono text-xs">{v.bank_account_no ?? "—"}</TableCell>
                <TableCell className="font-mono text-xs">{v.ntn ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(v)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setToDelete(v)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit Vendor" : "New Vendor"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2"><Label>Vendor Name *</Label><Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div><Label>Contact Number</Label><Input value={editing.contact_number ?? ""} onChange={(e) => setEditing({ ...editing, contact_number: e.target.value })} /></div>
              <div><Label>Email</Label><Input type="email" value={editing.email ?? ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Address</Label><Textarea rows={2} value={editing.address ?? ""} onChange={(e) => setEditing({ ...editing, address: e.target.value })} /></div>
              <div><Label>Bank Name</Label><Input value={editing.bank_name ?? ""} onChange={(e) => setEditing({ ...editing, bank_name: e.target.value })} /></div>
              <div><Label>Account Title</Label><Input value={editing.account_title ?? ""} onChange={(e) => setEditing({ ...editing, account_title: e.target.value })} /></div>
              <div><Label>Account Number</Label><Input value={editing.bank_account_no ?? ""} onChange={(e) => setEditing({ ...editing, bank_account_no: e.target.value })} /></div>
              <div><Label>NTN</Label><Input value={editing.ntn ?? ""} onChange={(e) => setEditing({ ...editing, ntn: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={upsert.isPending}>{upsert.isPending ? "Saving…" : "Save Vendor"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Remove vendor "{toDelete?.name}"?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { if (!toDelete) return; await del.mutateAsync(toDelete.id); toast.success("Vendor removed"); setToDelete(null); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
