import { createFileRoute } from "@tanstack/react-router";
import { PlusCircle } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/allowances")({
  head: () => ({ meta: [{ title: "Allowances — Finance Hub" }, { name: "description", content: "Manage employee allowances." }] }),
  component: () => <ComingSoon title="Allowances" description="Configure and assign allowances to employees." icon={PlusCircle} />,
});
