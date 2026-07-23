import { useEffect, useState } from "react";

export type Role = "payroll_officer" | "director" | "vice_chancellor" | "admin";

export const ROLE_LABELS: Record<Role, string> = {
  payroll_officer: "Payroll Officer",
  director: "Director",
  vice_chancellor: "Vice Chancellor",
  admin: "Admin",
};

const KEY = "fh_current_role";

export function getRole(): Role {
  if (typeof window === "undefined") return "payroll_officer";
  return (localStorage.getItem(KEY) as Role) || "payroll_officer";
}

export function setRole(r: Role) {
  localStorage.setItem(KEY, r);
  window.dispatchEvent(new Event("fh_role_changed"));
}

export function useRole() {
  const [role, setRoleState] = useState<Role>("payroll_officer");
  useEffect(() => {
    setRoleState(getRole());
    const handler = () => setRoleState(getRole());
    window.addEventListener("fh_role_changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("fh_role_changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return { role, setRole: (r: Role) => setRole(r) };
}
