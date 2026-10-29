/**
 * Maps a lead's state onto the design-system status tokens already defined in
 * index.css (--status-ontrack / atrisk / blocked / info / neutral). Using the
 * tokens means every lead surface shows the SAME colour for the same meaning,
 * and it adapts automatically across light, dark and the admin themes.
 *
 * Colour always pairs with a text label — never colour alone.
 */
export type StatusTone = 'ontrack' | 'atrisk' | 'blocked' | 'info' | 'neutral';

const TONE_BY_STATUS: Record<string, StatusTone> = {
  // CONTENT STATES. Added 8 Sep, when the seven content admin pages came onto
  // this map. ContentTable had been hardcoding bg-green-500/10 for "Published"
  // — a green picked by hand, so a published post and a confirmed booking were
  // two different greens on two pages meaning the same thing: this is fine.
  //
  // draft is 'info' rather than amber for the same reason `new` is: amber has
  // to mean "this needs you", and a draft is not a problem, it is unfinished
  // work. There are zero drafts anywhere in the system today, so this entry is
  // written for the first one rather than describing anything live.
  published: 'ontrack',
  draft: 'info',
  // archived deliberately falls through to 'neutral' — it is not a failure,
  // it is a thing deliberately taken out of circulation.

  // Good — the lead moved forward
  confirmed: 'ontrack',
  approved: 'ontrack',
  won: 'ontrack',
  completed: 'ontrack',
  synced: 'ontrack',
  qualified: 'ontrack',
  converted: 'ontrack',

  // Brand new — nothing is wrong, it just hasn't been worked yet.
  // Deliberately NOT amber: amber has to mean "this needs you", and if every
  // fresh lead is amber the colour stops meaning anything.
  new: 'info',
  submitted: 'info',
  open: 'info',

  // Needs attention — started but not finished
  booking_shown: 'atrisk',
  pending: 'atrisk',
  pending_review: 'atrisk',
  rescheduled: 'atrisk',
  contacted: 'atrisk',

  // Dead end
  cancelled: 'blocked',
  canceled: 'blocked',
  rejected: 'blocked',
  lost: 'blocked',
  booking_abandoned: 'blocked',
  deleted_from_ghl: 'blocked',
};

export function statusTone(status?: string | null): StatusTone {
  if (!status) return 'neutral';
  return TONE_BY_STATUS[status.trim().toLowerCase()] ?? 'neutral';
}

/** Pill classes (text + soft surface + border) — used where status is a badge. */
export const STATUS_TONE_CLASS: Record<StatusTone, string> = {
  ontrack:
    'text-[hsl(var(--status-ontrack))] bg-[hsl(var(--status-ontrack-surface))] border-[hsl(var(--status-ontrack)/0.30)]',
  atrisk:
    'text-[hsl(var(--status-atrisk))] bg-[hsl(var(--status-atrisk-surface))] border-[hsl(var(--status-atrisk)/0.30)]',
  blocked:
    'text-[hsl(var(--status-blocked))] bg-[hsl(var(--status-blocked-surface))] border-[hsl(var(--status-blocked)/0.30)]',
  info:
    'text-[hsl(var(--status-info))] bg-[hsl(var(--status-info-surface))] border-[hsl(var(--status-info)/0.30)]',
  neutral:
    'text-[hsl(var(--status-neutral))] bg-[hsl(var(--status-neutral-surface))] border-[hsl(var(--status-neutral)/0.30)]',
};

/** Text-only colour — used for the dot+label form in list rows. */
export const STATUS_TONE_TEXT: Record<StatusTone, string> = {
  ontrack: 'text-[hsl(var(--status-ontrack))]',
  atrisk: 'text-[hsl(var(--status-atrisk))]',
  blocked: 'text-[hsl(var(--status-blocked))]',
  info: 'text-[hsl(var(--status-info))]',
  neutral: 'text-[hsl(var(--status-neutral))]',
};

/** Solid dot colour that pairs with STATUS_TONE_TEXT. */
export const STATUS_TONE_DOT: Record<StatusTone, string> = {
  ontrack: 'bg-[hsl(var(--status-ontrack))]',
  atrisk: 'bg-[hsl(var(--status-atrisk))]',
  blocked: 'bg-[hsl(var(--status-blocked))]',
  info: 'bg-[hsl(var(--status-info))]',
  neutral: 'bg-[hsl(var(--status-neutral))]',
};
