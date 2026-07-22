import { createFileRoute } from "@tanstack/react-router";
import { Settings as SettingsIcon } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Finance Hub" }, { name: "description", content: "Application settings." }] }),
  component: () => <ComingSoon title="Settings" description="Organisation, preferences and access control." icon={SettingsIcon} />,
});
