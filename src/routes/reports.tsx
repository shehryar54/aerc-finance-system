import { createFileRoute } from "@tanstack/react-router";
import { FileBarChart } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports — Finance Hub" }, { name: "description", content: "Generate financial and payroll reports." }] }),
  component: () => <ComingSoon title="Reports" description="Generate and export financial and payroll reports." icon={FileBarChart} />,
});
