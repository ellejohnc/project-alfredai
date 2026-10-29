import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { getGHLSyncStatus } from '@/lib/ghlSyncStatus';
import { AdminStatusChip } from '@/components/admin/AdminStatusChip';
import { LegacyLeadActions } from '@/components/admin/leads/LegacyLeadActions';
import { NoteCountBadge, OutcomePill, MergedCountBadge } from '@/components/admin/leads/leadOverlayUi';
import { LeadAvatar } from '@/components/admin/leads/LeadOwnerCell';
import { ownerName } from '@/components/admin/leads/ownerName';
import { useLeadOverlay } from '@/hooks/useLeadOverlay';
import { useLeadFollowers } from '@/hooks/useLeadFollow';
import { useGhlNotes } from '@/hooks/useGhlLead';
import { useSalesReps } from '@/hooks/useSalesReps';
import {
  leadStatusLabel,
  type LeadSource,
  type UnifiedLead,
} from '@/lib/unifiedLead';
import { sourceBadge, isGHLSource } from '@/lib/leadSegments';
import { buildLeadHero, leadContextLine, urlPathLabel } from '@/lib/leadSourceHero';
import { recordRouteForLead } from '@/lib/leadAdminLinks';

export interface LeadQuickViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Lead identity + raw source row. Same shape LegacyLeadActions accepts. */
  lead: {
    source: LeadSource;
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    company?: string | null;
    status?: string | null;
    createdAt?: string;
    sourceUrl?: string | null;
    ghlContactId?: string | null;
    appointmentId?: string | null;
    raw?: Record<string, unknown>;
  } | null;
  /** Optional edit hook — only wired by the Webinar page today. */
  onEdit?: () => void;
  /** Optional source-specific actions rendered above the footer (e.g. investor approve/reject). */
  footerActions?: React.ReactNode;
  /**
   * Number of DUPLICATE records merged into this person. Rendered as a total
   * record count ("3 records") to match the record page header wording.
   */
  mergedCount?: number;
  /** Extra sections appended to the scroll body (e.g. the Inbox merged list). */
  extraSections?: React.ReactNode;
}


/**
 * The shared centered quick-view modal used by every legacy leads admin page.
 *
 * Centered (not a side drawer) is a locked design decision: the record is the
 * focus, so it sits in the middle of the screen at a comfortable reading width
 * on desktop and near full-width on small screens. Presents identity + status +
 * highlights and links out to the full record via `Open full record`.
 */
export function LeadQuickView({ open, onOpenChange, lead, onEdit, footerActions, mergedCount, extraSections }: LeadQuickViewProps) {
  const navigate = useNavigate();
  const { data: reps = [] } = useSalesReps();
  const overlay = useLeadOverlay(lead?.source, lead?.id);
  // Only reach out to GHL while the peek is actually open (avoids row-hover spam).
  const { data: ghlNotes = [] } = useGhlNotes(open ? lead?.ghlContactId ?? null : null);

  const unified: UnifiedLead | null = useMemo(() => {
    if (!lead) return null;
    return {
      id: lead.id,
      source: lead.source,
      name: lead.name || 'Lead',
      email: lead.email ?? null,
      phone: lead.phone ?? null,
      company: lead.company ?? null,
      status: lead.status ?? null,
      created_at: lead.createdAt ?? new Date().toISOString(),
      source_url: lead.sourceUrl ?? null,
      referrer: null,
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      ghl_contact_id: lead.ghlContactId ?? null,
      appointment_id: lead.appointmentId ?? null,
      raw: (lead.raw ?? {}) as Record<string, unknown>,
      annotation: overlay.annotation,
      notes: overlay.notes,
      notesCount: overlay.notesCount,
    };
  }, [lead, overlay.annotation, overlay.notes, overlay.notesCount]);

  const quickFollowers = useLeadFollowers(unified);

  const raw = (unified?.raw ?? {}) as Record<string, unknown>;
  const status = unified ? leadStatusLabel(unified) : null;
  const badge = unified ? sourceBadge(unified) : null;

  const created = unified?.created_at
    ? (() => {
        try {
          return format(new Date(unified.created_at), 'PPP p');
        } catch {
          return unified.created_at;
        }
      })()
    : null;

  // Highlights come from the SHARED source-hero helper — the same rows the
  // record page leads with, junk values ("unknown", "-") already dropped.
  const hero = useMemo(() => (unified ? buildLeadHero(unified) : null), [unified]);
  const highlights = hero?.rows ?? [];
  const contextLine = useMemo(() => (unified ? leadContextLine(unified) : null), [unified]);
  const sync = unified && isGHLSource(unified) ? getGHLSyncStatus(raw) : null;
  const owner = unified?.annotation?.owner_id ?? null;
  const ownerLabel = owner ? ownerName(owner, reps) ?? 'Owner' : null;

  // The record page shows local notes AND the contact's GHL notes, so the peek
  // must count both (deduped the same way) or it under-reports ("4 notes" when
  // the record lists many more).
  const stripAttribution = (s: string) =>
    s.replace(/^\s*\[[^\]]*via alfred ai website\]\s*/i, '').trim();
  const notesCount = useMemo(() => {
    const local = overlay.notes ?? [];
    const remote = ghlNotes ?? [];
    const localBodies = local.map((n) => (n.body ?? '').trim());
    const used = new Set<number>();
    let extra = 0;
    for (const g of remote) {
      const body = stripAttribution(g.body || '');
      const i = localBodies.findIndex((b, idx) => !used.has(idx) && b === body);
      if (i >= 0) used.add(i);
      else extra += 1;
    }
    return local.length + extra;
  }, [overlay.notes, ghlNotes]);
  // The peek never owns the full record — it routes to the source's own page.
  const recordRoute = unified
    ? recordRouteForLead(unified)
    : { path: '/admin/leads', label: 'Open full record' };

  // ONE Highlights card: contact, the source-tailored hero rows, notes count
  // and captured time — no separate section headers, no merged audit trail.
  const peekRows = useMemo(() => {
    if (!unified) return [];
    const rows: { label: string; value: string; href?: string | null }[] = [];
    if (unified.email) rows.push({ label: 'Email', value: unified.email, href: `mailto:${unified.email}` });
    if (unified.phone) rows.push({ label: 'Phone', value: unified.phone, href: `tel:${unified.phone}` });
    if (unified.company) rows.push({ label: 'Company', value: unified.company });
    for (const h of highlights) {
      if (!h.value) continue;
      if (rows.some((r) => r.label.toLowerCase() === h.label.toLowerCase())) continue;
      rows.push({ label: h.label, value: h.value, href: h.href ?? null });
    }
    if (unified.source_url) {
      rows.push({
        label: 'Page',
        value: urlPathLabel(unified.source_url) ?? unified.source_url,
        href: unified.source_url,
      });
    }
    rows.push({ label: 'Notes', value: `${notesCount} ${notesCount === 1 ? 'note' : 'notes'}` });
    rows.push({ label: 'Captured', value: created ?? 'recently' });
    return rows;
  }, [unified, highlights, notesCount, created]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[calc(100vw-2rem)] max-w-lg p-0 gap-0 flex flex-col max-h-[85vh] focus:outline-none"
        tabIndex={-1}
        // Radix focuses the first focusable child when a dialog opens. Here that
        // is the "N records" badge, which navigates — so the peek opened with a
        // navigation button visibly ring-highlighted and armed, and pressing
        // space (or Enter) left the page you had just opened the peek from.
        // Focus the panel itself instead: the modal still traps focus and Escape
        // still closes it, but nothing is pre-selected and the first Tab starts
        // at the top of the content rather than mid-way through it.
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          (e.currentTarget as HTMLElement | null)?.focus();
        }}
      >
        {unified ? (
          <>
            <DialogHeader className="px-6 pt-6 pb-4 space-y-3 border-b text-left">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-xl leading-tight truncate">{unified.name}</DialogTitle>
                  <DialogDescription className="mt-1 text-xs">
                    {contextLine ?? created ?? 'Just now'}
                  </DialogDescription>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {badge && <Badge variant="outline" className="text-[10px]">{badge}</Badge>}
                <AdminStatusChip status={unified.status} label={status} />
                <OutcomePill outcome={overlay.annotation?.outcome ?? null} className="text-[10px]" />
                {sync && (
                  <Badge
                    variant="outline"
                    className={cn('gap-1.5 text-[10px] font-medium', sync.color)}
                    title={`GHL sync: ${sync.label}`}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        sync.icon === 'synced'
                          ? 'bg-emerald-500'
                          : sync.icon === 'error'
                            ? 'bg-red-500'
                            : 'bg-amber-500',
                      )}
                    />
                    {sync.synced ? 'GHL synced' : sync.label}
                  </Badge>
                )}
                <NoteCountBadge count={notesCount} />
                {!!mergedCount && (
                  <MergedCountBadge
                    count={mergedCount}
                    className="text-[10px]"
                    tooltip={`${mergedCount + 1} records for this person — open the full record to review them`}
                    onClick={() => {
                      onOpenChange(false);
                      window.setTimeout(() => navigate(recordRoute.path), 210);
                    }}
                  />
                )}
              </div>
            </DialogHeader>

            {/* A BRIEF peek: one source-tailored Highlights card + Ownership.
                Contact, source, notes and captured all fold in as rows — the
                full record is one click away in the footer. */}
            <ScrollArea className="flex-1 px-6 py-4">
              <div className="space-y-4">
                <section className="space-y-2">
                  <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Highlights</h3>
                  <dl className="space-y-1.5 text-sm">
                    {peekRows.map((h, i) => (
                      <div key={i} className="grid grid-cols-[7rem_1fr] gap-2">
                        <dt className="text-muted-foreground truncate">{h.label}</dt>
                        <dd className="min-w-0 break-words">
                          {h.href ? (
                            <a
                              href={h.href}
                              title={h.value ?? undefined}
                              target={h.href.startsWith('http') ? '_blank' : undefined}
                              rel="noopener noreferrer"
                              className="text-primary hover:underline break-all"
                            >
                              {h.value}
                            </a>
                          ) : (
                            h.value
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>

                <Separator />
                {/* Owner and Followers are LABELLED ROWS on the same
                    `7rem` grid as Highlights above, because that is what the
                    Design Standard draws for the peek — every line in it is a
                    muted label with its value beside it.
                    LeadOwnerCell packed owner, follower avatars and the note
                    count onto one unlabelled line, so a follower read as a
                    bare bubble floating next to the owner's name. Worse, the
                    only text that ever said the word "followers" was the empty
                    state — so the peek was clearest when there were none. */}
                <section className="space-y-2">
                  <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Ownership</h3>
                  <dl className="space-y-1.5 text-sm">
                    <div className="grid grid-cols-[7rem_1fr] gap-2">
                      <dt className="text-muted-foreground truncate">Owner</dt>
                      <dd className="min-w-0">
                        {owner ? (
                          <span className="inline-flex items-center gap-1.5">
                            <LeadAvatar name={ownerLabel ?? 'Owner'} />
                            <span className="break-words">{ownerLabel ?? 'Owner'}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </dd>
                    </div>
                    <div className="grid grid-cols-[7rem_1fr] gap-2">
                      <dt className="text-muted-foreground truncate">Followers</dt>
                      <dd className="min-w-0">
                        {quickFollowers.length > 0 ? (
                          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            {quickFollowers.map((f) => (
                              <span key={f.id} className="inline-flex items-center gap-1.5">
                                <LeadAvatar name={f.name} />
                                <span className="break-words">{f.name}</span>
                              </span>
                            ))}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">No followers</span>
                        )}
                      </dd>
                    </div>
                    {notesCount > 0 && (
                      <div className="grid grid-cols-[7rem_1fr] gap-2">
                        <dt className="text-muted-foreground truncate">Notes</dt>
                        <dd className="min-w-0">{notesCount}</dd>
                      </div>
                    )}
                  </dl>
                </section>

                {extraSections}
              </div>
            </ScrollArea>

            {footerActions ? (
              <div className="px-6 py-3 border-t flex flex-wrap items-center gap-2">{footerActions}</div>
            ) : null}

            <DialogFooter className="px-6 py-4 border-t flex-row items-center justify-between gap-2 sm:justify-between">

              <LegacyLeadActions
                source={unified.source}
                id={unified.id}
                name={unified.name}
                email={unified.email}
                phone={unified.phone}
                company={unified.company}
                status={unified.status}
                createdAt={unified.created_at}
                sourceUrl={unified.source_url}
                ghlContactId={unified.ghl_contact_id}
                appointmentId={unified.appointment_id}
                raw={unified.raw}
              />
              <div className="flex items-center gap-2">
                {onEdit && (
                  <Button variant="outline" size="sm" onClick={() => { onEdit(); onOpenChange(false); }}>
                    Edit
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    // Let the dialog's dark overlay finish unmounting (Radix
                    // keeps it mounted for its 200ms close animation) before the
                    // new route mounts — otherwise the overlay tints the
                    // incoming page and reads as a black flash.
                    window.setTimeout(() => navigate(recordRoute.path), 210);
                  }}
                  className={cn('gap-1.5')}
                >
                  {recordRoute.label} <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
