import type { ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";
import { financialYear } from "@/lib/format";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/30">
        <AppSidebar />
        <SidebarInset className="flex flex-col min-w-0">
          <AppHeader />
          <main className="flex-1 p-4 md:p-6">{children}</main>
          <footer className="border-t px-4 md:px-6 py-3 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-2">
            <span>Finance Hub © {new Date().getFullYear()} — AERC ERP</span>
            <span>v1.0.0 • Financial Year {financialYear()}</span>
          </footer>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
