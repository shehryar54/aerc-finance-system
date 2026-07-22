import { createFileRoute } from "@tanstack/react-router";
import { HandCoins } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/loans")({
  head: () => ({ meta: [{ title: "Loans — Finance Hub" }, { name: "description", content: "Employee loans and repayments." }] }),
  component: () => <ComingSoon title="Loans" description="Issue, schedule and track employee loans." icon={HandCoins} />,
});
