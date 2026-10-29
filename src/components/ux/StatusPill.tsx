import { CheckCircle2, AlertTriangle, OctagonX, Circle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * StatusPill — Principle 18: colour NEVER carries meaning alone.
 * Every status renders an icon + a text label alongside the colour, so a
 * colour-blind user (≈8% of a male-heavy industry) reads shape and word.
 */
export type StatusKind = "ontrack" | "atrisk" | "blocked" | "neutral";

const CONFIG: Record<
  StatusKind,
  { label: string; icon: LucideIcon; text: string; surface: string; ring: string }
> = {
  ontrack: {
    label: "On track",
    icon: CheckCircle2,
    text: "text-status-ontrack",
    surface: "bg-status-ontrack-surface",
    ring: "ring-status-ontrack/20",
  },
  atrisk: {
    label: "At risk",
    icon: AlertTriangle,
    text: "text-status-atrisk",
    surface: "bg-status-atrisk-surface",
    ring: "ring-status-atrisk/20",
  },
  blocked: {
    label: "Blocked",
    icon: OctagonX,
    text: "text-status-blocked",
    surface: "bg-status-blocked-surface",
    ring: "ring-status-blocked/20",
  },
  neutral: {
    label: "Pending",
    icon: Circle,
    text: "text-status-neutral",
    surface: "bg-status-neutral-surface",
    ring: "ring-status-neutral/20",
  },
};

interface StatusPillProps {
  status: StatusKind;
  /** Override the default label text (e.g. "3 RFIs overdue"). */
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

export function StatusPill({ status, label, size = "md", className }: StatusPillProps) {
  const cfg = CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium ring-1 whitespace-nowrap",
        cfg.text,
        cfg.surface,
        cfg.ring,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        className,
      )}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} aria-hidden />
      {label ?? cfg.label}
    </span>
  );
}

export default StatusPill;
