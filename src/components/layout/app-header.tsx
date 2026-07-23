import { Bell, Moon, Sun, Search, Settings, User, ShieldCheck } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "@/components/theme-provider";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { financialYear } from "@/lib/format";
import { useRole, ROLE_LABELS, type Role } from "@/lib/role";

export function AppHeader() {
  const { theme, setTheme } = useTheme();
  const { role, setRole } = useRole();
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/70 px-3 backdrop-blur-md">
      <SidebarTrigger />
      <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search employees, transactions, banks…" className="pl-8 h-9" />
        </div>
      </div>
      <div className="ml-auto flex items-center gap-1">
        <div className="hidden md:flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs bg-muted/40">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          <Select value={role} onValueChange={(v) => setRole(v as Role)}>
            <SelectTrigger className="h-6 border-0 bg-transparent px-1 py-0 text-xs focus:ring-0 shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {(Object.keys(ROLE_LABELS) as Role[]).map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="hidden sm:flex items-center rounded-full border px-2.5 py-1 text-xs text-muted-foreground bg-muted/40">
          FY {financialYear()}
        </div>
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle theme"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" aria-label="Settings">
          <Settings className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary font-medium">AE</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>AERC Finance</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem><User className="mr-2 h-4 w-4" />Profile</DropdownMenuItem>
            <DropdownMenuItem><Settings className="mr-2 h-4 w-4" />Preferences</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
