import { createFileRoute } from "@tanstack/react-router";
import { MinusCircle } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/deductions")({
  head: () => ({ meta: [{ title: "Deductions — Finance Hub" }, { name: "description", content: "Manage payroll deductions." }] }),
  component: () => <ComingSoon title="Deductions" description="Configure and track payroll deductions." icon={MinusCircle} />,
});
