import { useState } from "react";
import { cn } from "@/lib/utils";
import { Sparkles, ChevronDown } from "lucide-react";

/**
 * AIWorkTrail — Principle 44: the labour illusion & AI transparency.
 * Shows a compact "how I got this" summary of the work the AI performed,
 * expandable to the underlying source steps. Builds trust in AI output
 * without fake delays, and provides a defensible audit trail.
 */
interface AIWorkTrailProps {
  /** One-line summary, e.g. "Read 14 pages · Extracted 32 line items · Matched PO-0047". */
  summary: string;
  /** Optional detailed steps revealed on expand. */
  steps?: string[];
  className?: string;
}

export function AIWorkTrail({ summary, steps, className }: AIWorkTrailProps) {
  const [open, setOpen] = useState(false);
  const hasSteps = !!steps && steps.length > 0;

  return (
    <div className={cn("rounded-lg border border-border bg-muted/40 text-sm", className)}>
      <button
        type="button"
        onClick={() => hasSteps && setOpen((v) => !v)}
        aria-expanded={hasSteps ? open : undefined}
        className={cn(
          "flex w-full items-center gap-2 px-3 py-2 text-left min-h-touch",
          hasSteps && "cursor-pointer",
        )}
      >
        <Sparkles className="h-4 w-4 shrink-0 text-ai-signal" aria-hidden />
        <span className="flex-1 text-foreground/80">{summary}</span>
        {hasSteps && (
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
            aria-hidden
          />
        )}
      </button>
      {hasSteps && open && (
        <ol className="space-y-1 border-t border-border px-3 py-2.5 pl-9">
          {steps!.map((step, i) => (
            <li key={i} className="list-decimal text-xs text-muted-foreground marker:text-muted-foreground">
              {step}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default AIWorkTrail;
