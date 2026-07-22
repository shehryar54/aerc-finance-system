export function formatMoney(n: number | string | null | undefined, currency = "PKR"): string {
  const val = typeof n === "string" ? parseFloat(n) : n ?? 0;
  const safe = Number.isFinite(val) ? val : 0;
  return `${currency} ${safe.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatNumber(n: number | string | null | undefined): string {
  const val = typeof n === "string" ? parseFloat(n) : n ?? 0;
  return (Number.isFinite(val) ? val : 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-US", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function financialYear(d = new Date()): string {
  const y = d.getFullYear();
  const m = d.getMonth();
  // Financial year July-June
  return m >= 6 ? `${y}-${(y + 1).toString().slice(-2)}` : `${y - 1}-${y.toString().slice(-2)}`;
}

export function greeting(d = new Date()): string {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
