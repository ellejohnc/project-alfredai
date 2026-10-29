import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Loader2 } from 'lucide-react';
import AccessDenied from '@/components/admin/AccessDenied';
import { usePermissions } from '@/hooks/usePermissions';
import { useContacts, type Contact } from '@/hooks/useContacts';
import { useLeadOverlayData } from '@/hooks/useLeadOverlay';
import { useSalesReps } from '@/hooks/useSalesReps';
import { AdminToolbar, type ToolbarFilter } from '@/components/admin/AdminToolbar';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminMetricsStrip } from '@/components/admin/AdminMetricsStrip';
import { AdminActionsRow } from '@/components/admin/AdminActionsRow';
import { LeadList, LeadListHeader, LeadListRow } from '@/components/admin/leads/LeadListRow';
import { Badge } from '@/components/ui/badge';
import { matchesLeadSearch } from '@/lib/leadSearch';
import { LEAD_SOURCE_META, type LeadSource } from '@/lib/unifiedLead';
import { RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

const ALL = 'all';

/**
 * Contacts — sample S5. Person-first, deduped across every source.
 *
 * The difference from the Inbox is the question being asked, not the data: the
 * Inbox lists what came in, this lists who it came from, with their records
 * rolled up. Both read the same cached query, so a merge corrected in one is
 * corrected in the other.
 */
export default function ContactsAdmin() {
  const { canViewLeads } = usePermissions();
  const { contacts, isLoading, refetch, isFetching } = useContacts();
  const { data: overlay } = useLeadOverlayData();
  const { data: reps = [] } = useSalesReps();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [ownerFilter, setOwnerFilter] = useState(ALL);
  const [sourceFilter, setSourceFilter] = useState(ALL);
  const [bookingsOnly, setBookingsOnly] = useState(false);

  const ownerNameFor = (id: string | null) =>
    id ? (reps.find((r) => r.id === id)?.display_name ?? 'Assigned') : 'Unassigned';

  const filtered = useMemo(
    () =>
      contacts.filter((c) => {
        if (
          search.trim() &&
          !matchesLeadSearch(search, {
            text: [c.name, c.email, c.company],
            phones: [c.phone],
          })
        ) {
          return false;
        }
        if (ownerFilter !== ALL) {
          if (ownerFilter === '__none__' ? c.ownerId : c.ownerId !== ownerFilter) return false;
        }
        if (sourceFilter !== ALL && !c.countsBySource[sourceFilter as LeadSource]) return false;
        if (bookingsOnly && !c.countsBySource.ghl_submissions) return false;
        return true;
      }),
    [contacts, search, ownerFilter, sourceFilter, bookingsOnly],
  );

  const stats = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return {
      total: contacts.length,
      withBookings: contacts.filter((c) => Boolean(c.countsBySource.ghl_submissions)).length,
      unassigned: contacts.filter((c) => !c.ownerId).length,
      thisWeek: contacts.filter((c) => new Date(c.lastSeen ?? 0).getTime() >= weekAgo).length,
    };
  }, [contacts]);

  const ownerOptions = useMemo(() => {
    const ids = new Set(contacts.map((c) => c.ownerId).filter(Boolean) as string[]);
    return [
      { value: ALL, label: 'Any owner' },
      { value: '__none__', label: 'Unassigned' },
      ...[...ids].map((id) => ({ value: id, label: ownerNameFor(id) })),
    ];
  }, [contacts, reps]);

  const sourceOptions = useMemo(() => {
    const present = new Set<LeadSource>();
    for (const c of contacts) {
      for (const s of Object.keys(c.countsBySource) as LeadSource[]) present.add(s);
    }
    return [
      { value: ALL, label: 'All sources' },
      ...[...present].map((s) => ({
        value: s,
        label: LEAD_SOURCE_META[s]?.label ?? String(s),
      })),
    ];
  }, [contacts]);

  const filters: ToolbarFilter[] = [
    { key: 'owner', label: 'Owner', options: ownerOptions, value: ownerFilter, onChange: setOwnerFilter },
    { key: 'source', label: 'Source', options: sourceOptions, value: sourceFilter, onChange: setSourceFilter },
  ];

  if (!canViewLeads) return <AccessDenied />;

  const initials = (name: string) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || '?';

  const row = (c: Contact) => (
    <LeadListRow
      key={c.key}
      name={c.name}
      onClick={() => navigate(`/admin/contacts/${encodeURIComponent(c.key)}`)}
      syncSlot={
        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-muted text-[9px] font-semibold text-muted-foreground">
          {initials(c.name)}
        </span>
      }
      badgeSlot={
        c.company ? (
          <Badge variant="outline" className="text-[10px]">
            {c.company}
          </Badge>
        ) : null
      }
      extraSlot={
        <span className="flex flex-wrap items-center gap-1">
          {(Object.entries(c.countsBySource) as [LeadSource, number][]).map(([s, n]) => (
            <Badge key={s} variant="secondary" className="text-[10px]">
              {n > 1 ? `${n} ` : ''}
              {LEAD_SOURCE_META[s]?.label ?? s}
            </Badge>
          ))}
        </span>
      }
      contactLine={[c.email, c.phone].filter(Boolean).join(' · ') || 'No contact details'}
      statusLabel={c.ghlContactId ? 'GHL synced' : 'Not in GHL'}
      status={c.ghlContactId ? 'confirmed' : null}
      ownerSlot={<span>{ownerNameFor(c.ownerId)}</span>}
      whenSlot={c.lastSeen ? format(new Date(c.lastSeen), 'd MMM yyyy') : '—'}
    />
  );

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Contacts"
        icon={<Users className="h-5 w-5 text-primary" />}
        description={`${filtered.length.toLocaleString()} ${filtered.length === 1 ? 'person' : 'people'}, deduped across every source.`}
      />

      <AdminMetricsStrip
        metrics={[
          {
            value: stats.total,
            label: 'Contacts',
            onClick: () => {
              setSearch('');
              setOwnerFilter(ALL);
              setSourceFilter(ALL);
              setBookingsOnly(false);
            },
          },
          {
            value: stats.withBookings,
            label: 'Has bookings',
            tone: 'good',
            onClick: () => setBookingsOnly(!bookingsOnly),
            active: bookingsOnly,
          },
          {
            value: stats.unassigned,
            label: 'Unassigned',
            tone: 'warn',
            onClick: () => setOwnerFilter(ownerFilter === '__none__' ? ALL : '__none__'),
            active: ownerFilter === '__none__',
          },
          { value: stats.thisWeek, label: 'Active this week', tone: 'accent' },
        ]}
      />

      <AdminActionsRow
        actions={[
          {
            key: 'refresh',
            label: 'Refresh',
            icon: <RefreshCw className="h-3.5 w-3.5" />,
            onClick: () => refetch(),
            loading: isFetching,
          },
        ]}
      />

      <AdminToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search contacts…"
        filters={filters}
        onClearAll={() => {
          setSearch('');
          setOwnerFilter(ALL);
          setSourceFilter(ALL);
          setBookingsOnly(false);
        }}
        resultCount={filtered.length}
        resultNoun="contact"
      />

      {isLoading ? (
        <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading contacts…
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No contacts match those filters.
        </p>
      ) : (
        <LeadList>
          <LeadListHeader whenLabel="Last seen" />
          {filtered.map(row)}
        </LeadList>
      )}
    </div>
  );
}
