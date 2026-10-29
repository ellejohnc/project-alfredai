import { cn } from "@/lib/utils";

/**
 * MetricValue — Principle 15: financial / data figures render with tabular
 * numerals so digits stack in perfect columns. Principle 14: weight + colour
 * carry hierarchy (bold value, muted label), never decoration.
 */
interface MetricValueProps {
  value: string | number;
  label?: string;
  /** Right-align for table columns where magnitudes are compared. */
  align?: "left" | "right";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-3xl md:text-4xl",
} as const;

export function MetricValue({ value, label, align = "left", size = "md", className }: MetricValueProps) {
  return (
    <div className={cn("flex flex-col gap-0.5", align === "right" && "items-end text-right", className)}>
      {label && (
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      )}
      <span className={cn("tabular-nums font-semibold text-foreground leading-none", SIZES[size])}>
        {value}
      </span>
    </div>
  );
}

export default MetricValue;
