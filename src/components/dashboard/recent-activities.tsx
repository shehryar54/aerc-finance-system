import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";
import type { Activity } from "@/lib/queries";
import {
  UserPlus, Wallet, Pencil, ArrowRightLeft, HandCoins, PiggyBank, Receipt, Activity as ActivityIcon,
} from "lucide-react";

function iconFor(action: string) {
  const a = action.toLowerCase();
  if (a.includes("employee")) return UserPlus;
  if (a.includes("payroll")) return Wallet;
  if (a.includes("opening")) return Pencil;
  if (a.includes("transfer")) return ArrowRightLeft;
  if (a.includes("loan")) return HandCoins;
  if (a.includes("pf") || a.includes("provident")) return PiggyBank;
  if (a.includes("tax")) return Receipt;
  return ActivityIcon;
}

export function RecentActivities({ items, loading }: { items: Activity[]; loading?: boolean }) {
  return (
    <Card className="glass-card">
      <CardHeader className="pb-2"><CardTitle className="text-sm">Recent Activity</CardTitle></CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[520px] px-4 pb-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="text-sm text-muted-foreground py-10 text-center">
              No activity yet. Actions like transfers, edits, and payroll runs will appear here.
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((a) => {
                const Icon = iconFor(a.action);
                return (
                  <li key={a.id} className="flex gap-3 items-start">
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{a.action}</div>
                      {a.description && <div className="text-xs text-muted-foreground truncate">{a.description}</div>}
                      <div className="text-[11px] text-muted-foreground mt-0.5">{formatDateTime(a.created_at)}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
