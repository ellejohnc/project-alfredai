import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { AdminStatusDot } from '@/components/admin/AdminStatusChip';

/**
 * The shared lead list — one row shape for every lead surface, matching the
 * approved design sample: sync dot · who (name + source badge + contact line) ·
 * status · owner · when · actions.
 *
 * Columns are a CSS grid rather than a <table> so the same markup collapses
 * gracefully: on small screens the header hides and the middle columns drop
 * away, leaving the person and their actions. Nothing is ever clipped.
 *
 * Everything except the status is passed in as a slot, so a page keeps full
 * control of its own sync dot, owner widget and row menu while still getting
 * identical geometry, spacing and hover behaviour.
 */

const GRID_BASE = 'grid items-center gap-3 px-3 py-3 ';
const GRID_COLS = 'grid-cols-[14px_1fr_40px] lg:grid-cols-[14px_2fr_1.2fr_1.1fr_150px_40px]';
// The Inbox is the only surface with a multi-select column (merge mode). It
// gets one extra 20px cell in front rather than growing its own row shape.
const GRID_COLS_SELECT =
  'grid-cols-[20px_14px_1fr_40px] lg:grid-cols-[20px_14px_2fr_1.2fr_1.1fr_150px_40px]';

const gridFor = (selectable?: boolean) => GRID_BASE + (selectable ? GRID_COLS_SELECT : GRID_COLS);

/** Columns that only appear at lg and above. */
const HIDE_SM = 'hidden lg:block min-w-0';

export function LeadListHeader({
  whenLabel = 'When',
  selectable,
  className,
}: {
  /** Last column's heading. Booked calls it "Meeting", Demo calls it "When". */
  whenLabel?: string;
  /** Adds the leading select column so the header lines up with selectable rows. */
  selectable?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        gridFor(selectable),
        'hidden border-b border-border bg-muted/40 lg:grid',
        'font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground',
        className,
      )}
    >
      {selectable && <span />}
      <span />
      <span>Lead</span>
      <span>Status</span>
      <span>Owner</span>
      <span>{whenLabel}</span>
      <span />
    </div>
  );
}

export interface LeadListRowProps {
  /** Small sync indicator in the first column (e.g. <GHLSyncDot />). */
  syncSlot?: ReactNode;
  /** Multi-select control rendered in a leading column (Inbox merge mode). */
  selectSlot?: ReactNode;
  /** Reserve the leading select column even when this row has no control. */
  selectable?: boolean;
  name: string;
  /** Source badge shown beside the name. */
  badgeSlot?: ReactNode;
  /** Extra chips beside the name (merged count, stage, outcome…). */
  extraSlot?: ReactNode;
  /** Secondary line under the name — usually "email · phone". */
  contactLine?: ReactNode;
  /** RAW status value; drives the chip colour. */
  status?: string | null;
  /** Humanized status text; falls back to the raw value. */
  statusLabel?: string | null;
  /** Owner widget + note count. */
  ownerSlot?: ReactNode;
  /** Date / meeting info, right-aligned on wide screens. */
  whenSlot?: ReactNode;
  /** Row menu — stop propagation inside this slot. */
  actionsSlot?: ReactNode;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  className?: string;
}

export function LeadListRow({
  syncSlot,
  selectSlot,
  selectable,
  name,
  badgeSlot,
  extraSlot,
  contactLine,
  status,
  statusLabel,
  ownerSlot,
  whenSlot,
  actionsSlot,
  onClick,
  onMouseEnter,
  onMouseLeave,
  className,
}: LeadListRowProps) {
  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              // Enter only — deliberately NOT Space, and only when the row
              // itself has focus rather than something inside it.
              //
              // Radix returns focus to the trigger when a dialog closes, so the
              // row keeps focus after you close a peek. Space then re-opened
              // the peek instead of scrolling the page, which is what Space
              // does everywhere else — you would close a lead, press Space to
              // read on, and it would spring back open. The target check stops
              // a checkbox or menu button inside the row from activating the
              // whole row as well.
              if (e.key === 'Enter' && e.target === e.currentTarget) {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(
        gridFor(selectable ?? !!selectSlot),
        'border-b border-border transition-colors last:border-b-0',
        onClick && 'cursor-pointer hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none',
        className,
      )}
    >
      {(selectable || selectSlot) && (
        <span
          className="flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          {selectSlot}
        </span>
      )}

      {/* Sync dot */}
      <span className="flex items-center justify-center">{syncSlot}</span>

      {/* Who */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-[14.5px] font-semibold leading-tight">{name}</span>
          {badgeSlot}
          {extraSlot}
          {/* Status rides along with the name on small screens, where its own
              column is hidden — so state is never lost on mobile. */}
          <span className="lg:hidden">
            <AdminStatusDot status={status} label={statusLabel} />
          </span>
        </div>
        {contactLine && (
          <div className="mt-1 truncate text-[12.5px] text-muted-foreground">{contactLine}</div>
        )}
      </div>

      {/* Status */}
      <div className={HIDE_SM}>
        <AdminStatusDot status={status} label={statusLabel} />
      </div>

      {/* Owner */}
      <div className={cn(HIDE_SM, 'text-[12px] text-muted-foreground')}>{ownerSlot}</div>

      {/* When */}
      <div className={cn(HIDE_SM, 'text-[11.5px] tabular-nums text-muted-foreground')}>
        {whenSlot}
      </div>

      {/* Actions */}
      <div
        className="flex items-center justify-end"
        onClick={(e) => e.stopPropagation()}
      >
        {actionsSlot}
      </div>
    </div>
  );
}

/** Bordered container that wraps a header + rows into one list surface. */
export function LeadList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-lg border border-border bg-card', className)}>
      {children}
    </div>
  );
}
