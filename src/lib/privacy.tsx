import { useCallback, useSyncExternalStore } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";

/**
 * Global "hide sensitive values" switch.
 * Module-level store so every page shares one state without a provider.
 */
const KEY = "aerc:hide-sensitive";
let hidden = false;
const listeners = new Set<() => void>();

if (typeof window !== "undefined") {
  hidden = window.localStorage.getItem(KEY) === "1";
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function toggleSensitive() {
  hidden = !hidden;
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, hidden ? "1" : "0");
  listeners.forEach((l) => l());
}

export function useSensitiveHidden(): boolean {
  return useSyncExternalStore(subscribe, () => hidden, () => false);
}

const DOTS = "••••••";

/** Returns a formatter that masks money values while sensitive mode is on. */
export function useMoney() {
  const isHidden = useSensitiveHidden();
  return useCallback(
    (v: number | string | null | undefined) => (isHidden ? DOTS : formatMoney(v)),
    [isHidden],
  );
}

/** Returns a masker for arbitrary sensitive text (CNIC, phone, account no…). */
export function useMask() {
  const isHidden = useSensitiveHidden();
  return useCallback(
    (v: string | number | null | undefined) => (isHidden ? DOTS : (v == null || v === "" ? "—" : String(v))),
    [isHidden],
  );
}

/** Inline money value that respects the sensitive-mode switch. */
export function Money({ value }: { value: number | string | null | undefined }) {
  const money = useMoney();
  return <>{money(value)}</>;
}

/** Inline sensitive text that respects the sensitive-mode switch. */
export function Masked({ value }: { value: string | number | null | undefined }) {
  const mask = useMask();
  return <>{mask(value)}</>;
}

/** Eye / eye-off button that toggles masking of sensitive figures. */
export function SensitiveToggle({ label = false }: { label?: boolean }) {
  const isHidden = useSensitiveHidden();
  return (
    <Button
      variant="outline"
      size={label ? "sm" : "icon"}
      onClick={toggleSensitive}
      aria-pressed={isHidden}
      title={isHidden ? "Show sensitive amounts" : "Hide sensitive amounts"}
      aria-label={isHidden ? "Show sensitive amounts" : "Hide sensitive amounts"}
    >
      {isHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      {label && <span>{isHidden ? "Show" : "Hide"}</span>}
    </Button>
  );
}
