import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, Wallet, PlusCircle, MinusCircle, HandCoins,
  PiggyBank, Receipt, Landmark, FileBarChart, Settings, Sparkles,
  Building2, FileText,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, group: "Workspace" },
  { title: "Employees", url: "/employees", icon: Users, group: "Workspace" },
  { title: "Payroll", url: "/payroll", icon: Wallet, group: "Payroll" },
  { title: "Allowances", url: "/allowances", icon: PlusCircle, group: "Payroll" },
  { title: "Deductions", url: "/deductions", icon: MinusCircle, group: "Payroll" },
  { title: "Loans", url: "/loans", icon: HandCoins, group: "Payroll" },
  { title: "Provident Fund", url: "/provident-fund", icon: PiggyBank, group: "Payroll" },
  { title: "Income Tax", url: "/income-tax", icon: Receipt, group: "Payroll" },
  { title: "Vendors", url: "/vendors", icon: Building2, group: "Accounts" },
  { title: "Vouchers", url: "/vouchers", icon: FileText, group: "Accounts" },
  { title: "Banks", url: "/banks", icon: Landmark, group: "Accounts" },
  { title: "Reports", url: "/reports", icon: FileBarChart, group: "System" },
  { title: "Settings", url: "/settings", icon: Settings, group: "System" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary text-primary-foreground shadow-elegant">
            <Sparkles className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="font-semibold tracking-tight">Finance Hub</span>
              <span className="text-xs text-muted-foreground">AERC Payroll ERP</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = item.url === "/" ? pathname === "/" : pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        {!collapsed && (
          <div className="px-2 py-2 text-xs text-muted-foreground">
            v1.0 • Production Ready
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
