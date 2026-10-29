import { getGHLSyncStatus } from '@/lib/ghlSyncStatus';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface GHLSyncDotProps {
  /** The raw source row (ghl_status + ghl_response live here). */
  input?: { ghl_status?: string | null; ghl_response?: Record<string, unknown> | null } | null;
  className?: string;
  /** Show the text label next to the dot. */
  withLabel?: boolean;
}

/**
 * Small coloured dot summarising GHL sync health, reusing the single source of
 * truth in src/lib/ghlSyncStatus.ts:
 *   green  = synced
 *   amber  = awaiting / booking_shown / pending
 *   red    = failed / invalid
 */
export function GHLSyncDot({ input, className, withLabel }: GHLSyncDotProps) {
  const status = getGHLSyncStatus(input ?? undefined);
  const color =
    status.icon === 'synced'
      ? 'bg-emerald-500'
      : status.icon === 'error'
        ? 'bg-red-500'
        : 'bg-amber-500';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn('inline-flex items-center gap-1.5', className)}>
            <span
              className={cn('h-2.5 w-2.5 rounded-full shrink-0', color)}
              aria-label={`GHL sync: ${status.label}`}
            />
            {withLabel && <span className="text-xs text-muted-foreground">{status.label}</span>}
          </span>
        </TooltipTrigger>
        <TooltipContent>GHL sync: {status.label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
