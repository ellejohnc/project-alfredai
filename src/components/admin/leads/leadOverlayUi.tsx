import { ownerName } from './ownerName';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Check, Trophy, XCircle, StickyNote, Layers, GitBranch } from 'lucide-react';
import { LeadOutcome, ownerInitials } from '@/lib/leadPipeline';
import type { SalesRep } from '@/hooks/useSalesReps';

export function OwnerBadge({
  ownerId,
  reps,
  className,
}: {
  ownerId: string | null | undefined;
  reps: SalesRep[];
  className?: string;
}) {
  if (!ownerId) return null;
  const name = ownerName(ownerId, reps);
  const initials = ownerInitials(name);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border bg-muted/60 pl-0.5 pr-2 py-0.5 text-[11px] font-medium',
        className
      )}
      title={name ?? 'Owner'}
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary text-[10px] font-semibold">
        {initials}
      </span>
      <span className="max-w-[100px] truncate">{name ?? 'Owner'}</span>
    </span>
  );
}

/** Won / Lost outcome pill. */
export function OutcomePill({ outcome, className }: { outcome: LeadOutcome | null | undefined; className?: string }) {
  if (!outcome) return null;
  const won = outcome === 'won';
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-[11px] gap-1',
        won
          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          : 'border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400',
        className
      )}
    >
      {won ? <Trophy className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {won ? 'Won' : 'Lost'}
    </Badge>
  );
}

/**
 * Pipeline stage, as a neutral chip.
 *
 * `annotation.stage` has been fetched on every legacy row since the overlay
 * existed and was rendered NOWHERE — Design vs Build carried "opportunity
 * stage is not surfaced on the row" as the last open gap on Booked, and the
 * data was already there. This is the same shape as the components that were
 * built and never wired to a page, one layer down: a FIELD fetched and never
 * shown.
 *
 * Deliberately neutral rather than coloured. Stage is a position in a
 * pipeline, not a health signal — colouring it would put a fourth colour
 * language next to the status dot, the sync badge and the outcome pill, and
 * the Standard allows semantic colour only where it means something. The
 * label carries the meaning on its own.
 */
export function StagePill({ stage, className }: { stage: string | null | undefined; className?: string }) {
  const label = stage?.trim();
  if (!label) return null;
  return (
    <Badge variant="outline" className={cn('text-[11px] gap-1 font-normal text-muted-foreground', className)}>
      <GitBranch className="h-3 w-3" />
      {label}
    </Badge>
  );
}

/** Note-count pill (only when > 0) with an explicit "N notes" label +
 *  tooltip so a bare number is never shown on its own. */
export function NoteCountBadge({ count, className, unread }: { count: number; className?: string; unread?: boolean }) {
  if (!count) return null;
  const label = `${count} ${count === 1 ? 'note' : 'notes'}`;
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className={cn('relative text-[11px] gap-1', className)}>
            <StickyNote className="h-3 w-3" />
            {label}
            {unread && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          {unread ? 'New note since you last looked' : `${count} ${count === 1 ? 'note' : 'notes'} on this lead`}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Merged-records count pill.
 *
 * `count` is the number of DUPLICATES; the label shows the total RECORD count
 * (duplicates + the primary) so the row, the peek and the record header all say
 * the same number for the same person.
 */
export function MergedCountBadge({
  count,
  className,
  tooltip,
  onClick,
}: {
  count: number;
  className?: string;
  /** Optional override for the hover tooltip. */
  tooltip?: string;
  /** When set the badge becomes the way into the full merged list. */
  onClick?: () => void;
}) {
  if (count <= 0) return null;
  const records = count + 1;
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onClick={onClick ? (e) => { e.stopPropagation(); onClick(); } : undefined}
            onKeyDown={
              onClick
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      onClick();
                    }
                  }
                : undefined
            }
            className={cn(
              'text-[11px] gap-1 bg-primary/10 text-primary border-primary/20',
              onClick && 'cursor-pointer hover:bg-primary/20',
              className,
            )}
          >
            <Layers className="h-3 w-3" />
            {records} records
          </Badge>
        </TooltipTrigger>
        <TooltipContent>{tooltip ?? `${records} records for this person`}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** Searchable owner list (Command) reused in the row menu and the record page. */
export function OwnerCommand({
  reps,
  value,
  onSelect,
  loading,
}: {
  reps: SalesRep[];
  value: string | null | undefined;
  onSelect: (ownerId: string | null, name?: string) => void;
  loading?: boolean;
}) {
  return (
    <Command>
      <CommandInput placeholder="Search team…" className="h-9" />
      <CommandList>
        <CommandEmpty>{loading ? 'Loading…' : 'No team members found.'}</CommandEmpty>
        <CommandGroup>
          <CommandItem value="__unassign__" className="cursor-pointer data-[selected=true]:bg-muted/60 data-[selected=true]:text-foreground" onSelect={() => onSelect(null)}>
            <Check className={cn('mr-2 h-4 w-4', !value ? 'opacity-100' : 'opacity-0')} />
            Unassigned
          </CommandItem>
          {reps.map((rep) => {
            const label = rep.display_name || rep.email;
            return (
              <CommandItem
                key={rep.id}
                value={`${label} ${rep.email}`}
                className="cursor-pointer data-[selected=true]:bg-muted/60 data-[selected=true]:text-foreground"
                onSelect={() => onSelect(rep.id, label)}
              >
                <Check className={cn('mr-2 h-4 w-4', value === rep.id ? 'opacity-100' : 'opacity-0')} />
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary text-[10px] font-semibold mr-2">
                  {ownerInitials(label)}
                </span>
                <span className="truncate">{label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
