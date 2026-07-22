import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label, value, icon: Icon, tone = "default", hint,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "default" | "success" | "warning" | "destructive";
  hint?: string;
}) {
  const toneClass =
    tone === "success" ? "bg-success/10 text-success" :
    tone === "warning" ? "bg-warning/15 text-warning-foreground" :
    tone === "destructive" ? "bg-destructive/10 text-destructive" :
    "bg-primary/10 text-primary";
  return (
    <Card className="glass-card hover:shadow-elegant transition-shadow">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", toneClass)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs text-muted-foreground truncate">{label}</div>
          <div className="text-lg md:text-xl font-semibold tracking-tight truncate">{value}</div>
          {hint && <div className="text-[11px] text-muted-foreground truncate">{hint}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
