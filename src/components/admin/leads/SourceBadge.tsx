import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Shared "source" pill for the legacy lead admin pages. Mirrors the Unified
 * Inbox styling (`bg-primary/10 text-primary border-primary/20`) so a lead's
 * origin reads identically no matter which page you're on.
 *
 * The label is passed in verbatim — each page already knows its own source
 * (Demo / Webinar / LinkedIn / Meta / Investor / Booked / Website / Matchmaking)
 * so we don't need to re-run the full sourceBadge() heuristic here.
 */
export function SourceBadge({ label, className }: { label: string; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn('text-xs bg-primary/10 text-primary border-primary/20', className)}
    >
      {label}
    </Badge>
  );
}

/**
 * Shared "status" pill using leadStatusLabel(). Renders nothing when the
 * humanised label is empty, so pages can drop it in unconditionally.
 */
export function LeadStatusPill({
  label,
  className,
}: {
  label: string | null | undefined;
  className?: string;
}) {
  if (!label) return null;
  return (
    <Badge
      variant="outline"
      className={cn('text-xs bg-muted text-muted-foreground border-border/60', className)}
    >
      {label}
    </Badge>
  );
}
