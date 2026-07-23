import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, History } from "lucide-react";
import { SalaryHistoryDialog } from "@/components/salary/salary-history-dialog";
import { useBanks, useDeleteEmployee, useEmployees, type Employee } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmployeeDialog } from "@/components/employees/employee-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatMoney } from "@/lib/format";

export const Route = createFileRoute("/employees")({
  head: () => ({
    meta: [
      { title: "Employees — Finance Hub" },
      { name: "description", content: "Manage employees, departments, designations, BPS and salaries." },
      { property: "og:title", content: "Employees — Finance Hub" },
      { property: "og:description", content: "Employee directory with search, filters and pagination." },
    ],
  }),
  component: EmployeesPage,
});

function EmployeesPage() {
  const empQ = useEmployees();
  const banksQ = useBanks();
  const del = useDeleteEmployee();

  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [bps, setBps] = useState<string>("all");
  const [pageSize, setPageSize] = useState<number | "all">(25);
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | undefined>();
  const [toDelete, setToDelete] = useState<Employee | undefined>();

  const employees = empQ.data ?? [];
  const departments = useMemo(() => Array.from(new Set(employees.map((e) => e.department).filter(Boolean) as string[])), [employees]);
  const bpsList = useMemo(() => Array.from(new Set(employees.map((e) => e.bps).filter((v): v is number => v != null))).sort((a, b) => a - b), [employees]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return employees.filter((e) => {
      if (department !== "all" && e.department !== department) return false;
      if (status !== "all" && e.status !== status) return false;
      if (bps !== "all" && String(e.bps ?? "") !== bps) return false;
      if (!q) return true;
      return (
        e.full_name.toLowerCase().includes(q) ||
        e.employee_code.toLowerCase().includes(q) ||
        (e.designation ?? "").toLowerCase().includes(q) ||
        (e.department ?? "").toLowerCase().includes(q)
      );
    });
  }, [employees, query, department, status, bps]);

  const total = filtered.length;
  const size = pageSize === "all" ? total || 1 : pageSize;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const rows = filtered.slice((page - 1) * size, page * size);

  const onDelete = async () => {
    if (!toDelete) return;
    try {
      await del.mutateAsync(toDelete.id);
      toast.success("Employee removed");
    } catch (e) { toast.error((e as Error).message); }
    setToDelete(undefined);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Employee Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Search, filter, and manage the full employee directory.</p>
        </div>
        <Button onClick={() => { setEditing(undefined); setDialogOpen(true); }}>
          <Plus className="h-4 w-4" /> Add Employee
        </Button>
      </div>

      <Card className="glass-card">
        <CardContent className="p-4 flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search name, code, designation…" className="pl-8" />
          </div>
          <Select value={department} onValueChange={(v) => { setDepartment(v); setPage(1); }}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Department" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={bps} onValueChange={(v) => { setBps(v); setPage(1); }}>
            <SelectTrigger className="w-[120px]"><SelectValue placeholder="BPS" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All BPS</SelectItem>
              {bpsList.map((b) => <SelectItem key={b} value={String(b)}>BPS-{b}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="on_leave">On leave</SelectItem>
            </SelectContent>
          </Select>
          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(v === "all" ? "all" : Number(v)); setPage(1); }}>
            <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25 / page</SelectItem>
              <SelectItem value="50">50 / page</SelectItem>
              <SelectItem value="100">100 / page</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>BPS</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Basic Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {empQ.isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 9 }).map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="h-32 text-center text-muted-foreground">No employees found. Click "Add Employee" to create one.</TableCell></TableRow>
                ) : rows.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-mono text-xs">{e.employee_code}</TableCell>
                    <TableCell className="font-medium">{e.full_name}</TableCell>
                    <TableCell>{e.department ?? "—"}</TableCell>
                    <TableCell>{e.designation ?? "—"}</TableCell>
                    <TableCell>{e.bps ? `BPS-${e.bps}` : "—"}</TableCell>
                    <TableCell>{e.phone ?? "—"}</TableCell>
                    <TableCell className="text-right">{formatMoney(e.basic_salary)}</TableCell>
                    <TableCell><Badge variant={e.status === "active" ? "secondary" : "outline"} className="capitalize">{e.status.replace("_", " ")}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => { setEditing(e); setDialogOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setToDelete(e)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t text-xs text-muted-foreground">
            <span>{total} employee{total === 1 ? "" : "s"}</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
              <span>Page {page} / {totalPages}</span>
              <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <EmployeeDialog open={dialogOpen} onOpenChange={setDialogOpen} employee={editing} banks={banksQ.data ?? []} />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove employee?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes <b>{toDelete?.full_name}</b> ({toDelete?.employee_code}). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
