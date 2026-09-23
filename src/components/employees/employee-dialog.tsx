import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useUpsertEmployee, type Bank, type Employee } from "@/lib/queries";

export function EmployeeDialog({
  open, onOpenChange, employee, banks,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  employee?: Employee;
  banks: Bank[];
}) {
  const empty = {
    employee_code: "",
    full_name: "",
    father_name: "",
    cnic: "",
    email: "",
    phone: "",
    department: "",
    designation: "",
    bps: "" as string | number,
    joining_date: "",
    status: "active",
    bank_id: "" as string,
    bank_account_no: "",
    address: "",
  };
  const [form, setForm] = useState<typeof empty>(empty);
  const mut = useUpsertEmployee();

  useEffect(() => {
    if (open) {
      if (employee) {
        setForm({
          employee_code: employee.employee_code,
          full_name: employee.full_name,
          father_name: employee.father_name ?? "",
          cnic: employee.cnic ?? "",
          email: employee.email ?? "",
          phone: employee.phone ?? "",
          department: employee.department ?? "",
          designation: employee.designation ?? "",
          bps: employee.bps ?? "",
          joining_date: employee.joining_date ?? "",
          status: employee.status,
          bank_id: employee.bank_id ?? "",
          bank_account_no: employee.bank_account_no ?? "",
          address: employee.address ?? "",
        });
      } else {
        setForm({ ...empty, employee_code: `EMP-${Math.floor(1000 + Math.random() * 9000)}` });
      }
    }
  }, [open, employee]);

  const set = <K extends keyof typeof empty>(k: K, v: (typeof empty)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const onSave = async () => {
    if (!form.full_name.trim()) return toast.error("Full name is required");
    if (!form.employee_code.trim()) return toast.error("Employee code is required");
    try {
      await mut.mutateAsync({
        id: employee?.id,
        employee_code: form.employee_code,
        full_name: form.full_name,
        father_name: form.father_name || null,
        cnic: form.cnic || null,
        email: form.email || null,
        phone: form.phone || null,
        department: form.department || null,
        designation: form.designation || null,
        bps: form.bps === "" ? null : Number(form.bps),
        joining_date: form.joining_date || null,
        status: form.status,
        bank_id: form.bank_id || null,
        bank_account_no: form.bank_account_no || null,
        address: form.address || null,
      });
      toast.success(employee ? "Employee updated" : "Employee added");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{employee ? "Edit Employee" : "Add Employee"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><Label>Employee Code</Label><Input value={form.employee_code} onChange={(e) => set("employee_code", e.target.value)} /></div>
          <div><Label>Full Name</Label><Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} /></div>
          <div><Label>Father Name</Label><Input value={form.father_name} onChange={(e) => set("father_name", e.target.value)} /></div>
          <div><Label>CNIC</Label><Input value={form.cnic} onChange={(e) => set("cnic", e.target.value)} /></div>
          <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
          <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
          <div><Label>Department</Label><Input value={form.department} onChange={(e) => set("department", e.target.value)} /></div>
          <div><Label>Designation</Label><Input value={form.designation} onChange={(e) => set("designation", e.target.value)} /></div>
          <div><Label>BPS</Label><Input type="number" value={form.bps} onChange={(e) => set("bps", e.target.value)} /></div>
          <div><Label>Joining Date</Label><Input type="date" value={form.joining_date} onChange={(e) => set("joining_date", e.target.value)} /></div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="on_leave">On leave</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Bank</Label>
            <Select value={form.bank_id || "__none"} onValueChange={(v) => set("bank_id", v === "__none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Select bank" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">None</SelectItem>
                {banks.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Bank Account No</Label><Input value={form.bank_account_no} onChange={(e) => set("bank_account_no", e.target.value)} /></div>
          <div className="md:col-span-2"><Label>Address</Label><Input value={form.address} onChange={(e) => set("address", e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSave} disabled={mut.isPending}>{mut.isPending ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
