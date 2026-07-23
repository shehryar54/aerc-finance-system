import { createFileRoute, redirect } from "@tanstack/react-router";

// The full editable salary spreadsheet lives at /payroll. This route is an alias
// so a "Salary" tab in the sidebar takes users straight to the live sheet where
// every field — including month/year — is editable.
export const Route = createFileRoute("/salary")({
  beforeLoad: () => {
    throw redirect({ to: "/payroll" });
  },
});
