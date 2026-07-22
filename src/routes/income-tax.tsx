import { createFileRoute } from "@tanstack/react-router";
import { Receipt } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/income-tax")({
  head: () => ({ meta: [{ title: "Income Tax — Finance Hub" }, { name: "description", content: "Income tax calculation and reporting." }] }),
  component: () => <ComingSoon title="Income Tax" description="Compute and report income tax deductions." icon={Receipt} />,
});
