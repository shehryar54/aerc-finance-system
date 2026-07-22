import { createFileRoute } from "@tanstack/react-router";
import { Wallet } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/payroll")({
  head: () => ({ meta: [{ title: "Payroll — Finance Hub" }, { name: "description", content: "Process and manage monthly payroll runs." }] }),
  component: () => <ComingSoon title="Payroll" description="Process monthly payroll, generate salary sheets and payslips." icon={Wallet} />,
});
