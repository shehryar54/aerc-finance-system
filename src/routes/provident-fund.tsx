import { createFileRoute } from "@tanstack/react-router";
import { PiggyBank } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/provident-fund")({
  head: () => ({ meta: [{ title: "Provident Fund — Finance Hub" }, { name: "description", content: "Manage employee provident fund balances." }] }),
  component: () => <ComingSoon title="Provident Fund" description="Manage PF contributions and balances." icon={PiggyBank} />,
});
