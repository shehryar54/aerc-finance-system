import type { ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";
import { financialYear } from "@/lib/format";
import aercLogo from "@/assets/aerc-logo.png";
import uokLogo from "@/assets/uok-logo.png";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/30">
        <AppSidebar />
        <SidebarInset className="flex flex-col min-w-0">
          <AppHeader />
          <main className="flex-1 p-4 md:p-6">{children}</main>
          <footer className="border-t bg-muted/20 px-4 md:px-6 py-6 text-xs text-muted-foreground">
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex items-center gap-1.5 rounded-md bg-white/95 px-2 py-1 shadow-sm">
                    <img src={aercLogo} alt="AERC" className="h-8 w-8 object-contain" />
                    <img src={uokLogo} alt="University of Karachi" className="h-8 w-8 object-contain" />
                  </div>
                </div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">About AERC</h3>
                <p className="leading-relaxed">
                  The Applied Economics Research Centre (AERC), University of Karachi, was
                  established in 1973. The major functions of the Centre are policy oriented
                  Core/academic Research, Contract Research for Clients, and post-graduate
                  teaching and providing advisory services to the government.
                </p>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">Contact Us</h3>
                <ul className="space-y-1">
                  <li>Tel: 92-21-99261541 – 43</li>
                  <li>Tel: 92-21-99261547 – 49</li>
                  <li>
                    Email:{" "}
                    <a href="mailto:aerc@aerc.edu.pk" className="hover:text-foreground">
                      aerc@aerc.edu.pk
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">Address</h3>
                <p className="leading-relaxed">
                  Applied Economics Research Centre,<br />
                  University of Karachi,<br />
                  P.O. Box 8403, 75270 — Pakistan
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
              <span>Finance Hub © {new Date().getFullYear()} — AERC ERP</span>
              <span>v1.0.0 • Financial Year {financialYear()}</span>
            </div>
          </footer>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
