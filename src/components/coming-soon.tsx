import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

export function ComingSoon({ title, description, icon: Icon }: { title: string; description: string; icon: LucideIcon }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      <Card className="glass-card">
        <CardContent className="p-12 flex flex-col items-center text-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary text-primary-foreground shadow-elegant">
            <Icon className="h-7 w-7" />
          </div>
          <div className="max-w-md">
            <h3 className="text-lg font-semibold">Module in development</h3>
            <p className="text-sm text-muted-foreground mt-1">
              This section will connect to the shared banks, employees, and activity log. The database schema and UI framework are already wired up.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
