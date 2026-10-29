import { cn } from "@/lib/utils";
import { CheckCircle2, type LucideIcon } from "lucide-react";

/**
 * SectionHeading — Principle 2 & 3: hierarchy through size + weight + contrast,
 * not decoration. Eyebrow (small, muted) → title (large, bold) → optional
 * supporting line. Passes the squint test: the title dominates.
 */
interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  as?: "h1" | "h2" | "h3";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  as: Tag = "h2",
  className,
}: SectionHeadingProps) {
  const sizes =
    Tag === "h1"
      ? "text-3xl md:text-5xl"
      : Tag === "h2"
        ? "text-2xl md:text-4xl"
        : "text-xl md:text-2xl";
  return (
    <div className={cn(align === "center" && "text-center mx-auto", "measure-prose", className)}>
      {eyebrow && (
        <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {eyebrow}
        </span>
      )}
      <Tag className={cn("font-bold tracking-tight text-foreground leading-[1.12]", sizes)}>
        {title}
      </Tag>
      {description && (
        <p className="mt-3 text-base text-muted-foreground leading-relaxed">{description}</p>
      )}
    </div>
  );
}

/**
 * CompletionMoment — Principle 40 (peak-end rule) & 44 (labour illusion).
 * The satisfying end-state after a demo workflow finishes, itemising what
 * the AI did for the user. This is the peak, the ending, and the retention hook.
 */
interface CompletionMomentProps {
  title: string;
  /** Bullet lines describing the work the AI performed. */
  didItems: string[];
  icon?: LucideIcon;
  className?: string;
}

export function CompletionMoment({
  title,
  didItems,
  icon: Icon = CheckCircle2,
  className,
}: CompletionMomentProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-status-ontrack/30 bg-status-ontrack-surface p-5",
        className,
      )}
    >
      <div className="flex items-center gap-2.5">
        <Icon className="h-5 w-5 shrink-0 text-status-ontrack" aria-hidden />
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
      </div>
      <ul className="mt-3 space-y-1.5">
        {didItems.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-status-ontrack" aria-hidden />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SectionHeading;
