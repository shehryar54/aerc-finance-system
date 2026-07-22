import { useState } from "react";
import { UserPlus, Wallet, PencilLine, ArrowRightLeft, FileBarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransferDialog } from "./transfer-dialog";
import { OpeningBalanceDialog } from "./opening-balance-dialog";
import { EmployeeDialog } from "@/components/employees/employee-dialog";
import type { Bank } from "@/lib/queries";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export function QuickActions({ banks }: { banks: Bank[] }) {
  const [empOpen, setEmpOpen] = useState(false);
  const [openingOpen, setOpeningOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => setEmpOpen(true)}><UserPlus className="h-4 w-4" /> Add Employee</Button>
        <Button size="sm" variant="secondary" onClick={() => toast.info("Payroll module coming in the next release")}>
          <Wallet className="h-4 w-4" /> Process Payroll
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setOpeningOpen(true)} disabled={banks.length === 0}>
          <PencilLine className="h-4 w-4" /> Update Opening Balance
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setTransferOpen(true)} disabled={banks.length < 2}>
          <ArrowRightLeft className="h-4 w-4" /> Transfer Funds
        </Button>
        <Button size="sm" variant="outline" onClick={() => navigate({ to: "/reports" })}>
          <FileBarChart className="h-4 w-4" /> Generate Report
        </Button>
      </div>
      <EmployeeDialog open={empOpen} onOpenChange={setEmpOpen} banks={banks} />
      {banks[0] && <OpeningBalanceDialog open={openingOpen} onOpenChange={setOpeningOpen} bank={banks[0]} />}
      <TransferDialog open={transferOpen} onOpenChange={setTransferOpen} fromBank={banks[0]} banks={banks} />
    </>
  );
}
