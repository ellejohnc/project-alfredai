import { cn } from '@/lib/utils';

export interface AdminMetric {
  /** Big number. */
  value: number | string;
  /** Short label under the number. */
  label: string;
  /** Semantic emphasis — drives the number's colour from the status tokens. */
  tone?: 'default' | 'good' | 'warn' | 'accent';
  /** Clicking filters the list. Omit for a read-only stat. */
  onClick?: () => void;
  /** Renders the stat as currently applied. */
  active?: boolean;
}

const TONE_CLASS: Record<NonNullable<AdminMetric['tone']>, string> = {
  default: 'text-foreground',
  good: 'text-[hsl(var(--status-ontrack))]',
  warn: 'text-[hsl(var(--status-atrisk))]',
  accent: 'text-primary',
};

/**
 * The shared metrics strip that sits at the top of every lead page.
 *
 * Compact by design (matching the admin density pass): the number leads, the
 * label sits quietly under it, and colour is semantic — green for healthy,
 * amber for needs-attention — drawn from the same status tokens the row chips
 * use, so a number and a chip never disagree about what "good" looks like.
 *
 * A stat with `onClick` is a filter: it looks interactive and shows an active
 * state once applied.
 */
export function AdminMetricsStrip({
  metrics,
  className,
}: {
  metrics: AdminMetric[];
  className?: string;
}) {
  if (metrics.length === 0) return null;
  return (
    <div
      className={cn(
        'grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
        className,
      )}
    >
      {metrics.map((m, i) => {
        const interactive = !!m.onClick;
        const Tag = interactive ? 'button' : 'div';
        return (
          <Tag
            key={`${m.label}-${i}`}
            {...(interactive ? { type: 'button' as const, onClick: m.onClick } : {})}
            className={cn(
              'min-w-0 rounded-lg border border-border bg-card p-2.5 text-left transition-colors',
              interactive && 'cursor-pointer hover:border-primary/30 hover:bg-muted/40',
              m.active && 'border-primary/60 bg-muted/50',
            )}
          >
            <div
              className={cn(
                'text-lg font-semibold leading-tight tabular-nums',
                TONE_CLASS[m.tone ?? 'default'],
              )}
            >
              {m.value}
            </div>
            <div className="truncate text-[11px] text-muted-foreground">{m.label}</div>

          </Tag>
        );
      })}
    </div>
  );
}
