import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { statusTone, STATUS_TONE_CLASS, STATUS_TONE_TEXT, STATUS_TONE_DOT } from '@/lib/statusTone';
import { humanizeStatusCode } from '@/lib/unifiedLead';

interface LeadStatusProps {
  /** RAW status value (e.g. 'booking_shown') — decides the colour. */
  status?: string | null;
  /**
   * Display text. Pass the already-humanized label when the caller has one
   * (leadStatusLabel), otherwise the raw status is humanized here.
   */
  label?: string | null;
  className?: string;
}

/**
 * Status as a filled pill.
 *
 * Used where the status sits among other badges and needs its own edges to
 * read as a distinct object — the quick view header, record pages.
 */
export function AdminStatusChip({ status, label, className }: LeadStatusProps) {
  const text = label ?? humanizeStatusCode(status);
  if (!text) return null;
  return (
    <Badge
      variant="outline"
      className={cn(
        'h-5 px-1.5 text-[10px] font-medium',
        STATUS_TONE_CLASS[statusTone(status)],
        className,
      )}
    >
      {text}
    </Badge>
  );
}

/**
 * Status as a coloured dot + coloured label — the form used in list rows,
 * matching design sample S1.
 *
 * A pill in its own column fought the source badge next to the name for
 * attention: two outlined objects on one row, neither clearly primary. The dot
 * carries the same colour with far less ink, so the eye lands on the person's
 * name first and picks up state second — which is the order you actually scan
 * a list in.
 *
 * Colour still never travels alone; the label is always beside the dot.
 */
export function AdminStatusDot({ status, label, className }: LeadStatusProps) {
  const text = label ?? humanizeStatusCode(status);
  if (!text) return null;
  const tone = statusTone(status);
  return (
    <span className={cn('flex min-w-0 items-center gap-2', className)}>
      <span
        aria-hidden
        className={cn('h-[7px] w-[7px] flex-none rounded-full', STATUS_TONE_DOT[tone])}
      />
      <span className={cn('truncate text-[13px] font-medium', STATUS_TONE_TEXT[tone])}>{text}</span>
    </span>
  );
}
