import { cn } from '@/lib/utils';
import { StickyNote } from 'lucide-react';

export interface LeadPerson {
  id: string;
  name: string;
  email?: string | null;
}

/** Two-letter initials from a display name; falls back to a dash. */
function initialsOf(name?: string | null): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '—';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function LeadAvatar({
  name,
  muted,
  className,
}: {
  name?: string | null;
  /** Unassigned / placeholder styling. */
  muted?: boolean;
  className?: string;
}) {
  return (
    <span
      title={name ?? 'Unassigned'}
      className={cn(
        'flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full',
        'border text-[9.5px] font-bold leading-none',
        muted
          ? 'border-border bg-muted text-muted-foreground'
          : 'border-primary/30 bg-primary/10 text-primary',
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}

/**
 * Owner (and followers) for a lead, as shown in the row's Owner column and in
 * the quick view.
 *
 * Unassigned is shown explicitly rather than left blank — an empty cell reads
 * as "loading", a muted dash reads as "nobody owns this yet", which is the
 * thing a sales lead actually needs to spot.
 *
 * Followers stack with a slight overlap and collapse to "+N" past three, so a
 * busy lead never blows out the column width.
 */
export function LeadOwnerCell({
  owner,
  followers = [],
  noteCount = 0,
  unreadNotes = false,
  className,
}: {
  owner?: LeadPerson | null;
  followers?: LeadPerson[];
  noteCount?: number;
  unreadNotes?: boolean;
  className?: string;
}) {
  const shown = followers.slice(0, 3);
  const overflow = followers.length - shown.length;

  return (
    <div className={cn('flex min-w-0 items-center gap-2', className)}>
      <LeadAvatar name={owner?.name} muted={!owner} />
      <span className={cn('truncate', !owner && 'text-muted-foreground')}>
        {owner?.name ?? 'Unassigned'}
      </span>

      {shown.length > 0 && (
        <span className="flex flex-none items-center" title={followers.map((f) => f.name).join(', ')}>
          {shown.map((f, i) => (
            <LeadAvatar
              key={f.id}
              name={f.name}
              className={cn('h-[18px] w-[18px] text-[8px]', i > 0 && '-ml-1.5')}
            />
          ))}
          {overflow > 0 && (
            <span className="ml-1 text-[10px] text-muted-foreground">+{overflow}</span>
          )}
        </span>
      )}

      <span
        className={cn(
          'relative flex flex-none items-center gap-0.5 text-[11px]',
          noteCount > 0 ? 'text-muted-foreground' : 'text-muted-foreground/50',
        )}
        title={
          noteCount > 0
            ? `${noteCount} note${noteCount === 1 ? '' : 's'}${unreadNotes ? ' · unread' : ''}`
            : 'No notes on this lead yet'
        }
      >
        <StickyNote className="h-3 w-3" />
        {noteCount}
        {unreadNotes && (
          <span className="absolute -right-1.5 -top-1 h-[7px] w-[7px] rounded-full bg-primary ring-2 ring-card" />
        )}
      </span>
    </div>
  );
}
