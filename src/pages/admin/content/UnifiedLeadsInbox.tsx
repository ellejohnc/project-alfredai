import { useMemo, useState, useEffect, useCallback  } from 'react';
import { Link  } from 'react-router-dom';
import { format  } from 'date-fns';
import {
  Users,
  Search,
  Mail,
  Phone,
  Building,
  ExternalLink,
  AlertCircle,
  Save,
  Trash2,
  Bookmark,
  Loader2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  GitMerge,
  Undo2,
  MoreHorizontal, Download, RefreshCw, Globe, Eye, Info,
  
} from 'lucide-react';
import { AdminPageHeader  } from '@/components/admin/AdminPageHeader';
import { Input  } from '@/components/ui/input';
import { Button  } from '@/components/ui/button';
import { Badge  } from '@/components/ui/badge';
import { Card, CardContent  } from '@/components/ui/card';
import { Skeleton  } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger  } from '@/components/ui/popover';
import { toast  } from 'sonner';
import { cn  } from '@/lib/utils';
import { useUnifiedLeads  } from '@/hooks/useUnifiedLeads';
import { useLeadSegments  } from '@/hooks/useLeadSegments';
import {
  UnifiedLead,
  LeadSource,
  LEAD_SOURCE_META,
  leadKey,
  leadStatusLabel,
  humanizeStatusCode,
} from '@/lib/unifiedLead';
import { supabase  } from '@/integrations/supabase/client';
import { CONTACT_INFO  } from '@/lib/contactInfo';
import { usePermissions  } from '@/hooks/usePermissions';
import AccessDenied from '@/components/admin/AccessDenied';
import { useNavigate, useSearchParams  } from 'react-router-dom';
import { useUnifiedLeadsFlag  } from '@/hooks/useUnifiedLeadsFlag';
import { GHLSyncDot  } from '@/components/admin/GHLSyncDot';
import { LeadRowActions  } from '@/components/admin/leads/LeadRowActions';
import { usePrefetchGhlLead  } from '@/hooks/useGhlLead';
import { OutcomePill, MergedCountBadge } from '@/components/admin/leads/leadOverlayUi';
import { ownerName } from '@/components/admin/leads/ownerName';
import { LeadList, LeadListHeader, LeadListRow  } from '@/components/admin/leads/LeadListRow';
import { LeadQuickView  } from '@/components/admin/leads/LeadQuickView';
import { LeadOwnerCell  } from '@/components/admin/leads/LeadOwnerCell';
import { AdminToolbar  } from '@/components/admin/AdminToolbar';
import { AdminMetricsStrip  } from '@/components/admin/AdminMetricsStrip';
import { LeadSourcePerformance } from '@/components/admin/leads/LeadSourcePerformance';
import { hasUnreadLocalNotes  } from '@/lib/notesSeen';
import { useLeadsRealtime  } from '@/hooks/useLeadsRealtime';
import { useSalesReps  } from '@/hooks/useSalesReps';
import {
  SEGMENT_DEFS,
  LeadSegment,
  inSegment,
  sourceBadge,
  isJunkLead,
  isJunkMetaLead,
  needsSyncAttention,
  isGHLSource,
} from '@/lib/leadSegments';
import { AdminActionsRow } from '@/components/admin/AdminActionsRow';
import { optionsFromData } from '@/lib/leadSearch';
import { useAdminAuth  } from '@/contexts/AdminAuthContext';

const OWNER_MINE = '__mine__';
const MY_LEADS_KEY = 'leads-inbox-owner-scope';

const ALL = 'all';
const PAGE_SIZE = 25;
type SortDir = 'desc' | 'asc';

/** How duplicate entries are matched when merging. */
type MatchBy = 'both' | 'email' | 'phone';
const MATCH_STORAGE_KEY = 'leads-inbox-match-by';
const MATCH_LABELS: Record<MatchBy, string> = {
  both: 'Email + phone (strict)',
  email: 'Email only',
  phone: 'Phone only',
};
const MATCH_HINTS: Record<MatchBy, string> = {
  both: 'collapsed because they share the same email and phone',
  email: 'collapsed because they share the same email',
  phone: 'collapsed because they share the same phone number',
};

const normEmail = (v?: string | null) => (v ? v.trim().toLowerCase() : '');
const normPhone = (v?: string | null) => (v ? v.replace(/[^\d]/g, '') : '');

/** Work out how a manual set of records match, for the explanation shown to the user. */
function describeMatch(leads: UnifiedLead[]): { matchedOn: 'both' | 'email' | 'phone' | 'manual'; reason: string } {
  const emails = new Set(leads.map((l) => normEmail(l.email)).filter(Boolean));
  const phones = new Set(leads.map((l) => normPhone(l.phone)).filter(Boolean));
  const sharedEmail = emails.size === 1 && leads.every((l) => normEmail(l.email));
  const sharedPhone = phones.size === 1 && leads.every((l) => normPhone(l.phone));
  if (sharedEmail && sharedPhone)
    return { matchedOn: 'both', reason: 'Merged manually — records share the same email and phone number.' };
  if (sharedEmail)
    return { matchedOn: 'email', reason: 'Merged manually — records share the same email address.' };
  if (sharedPhone)
    return { matchedOn: 'phone', reason: 'Merged manually — records share the same phone number.' };
  return { matchedOn: 'manual', reason: 'Merged manually — confirmed by an admin as the same person.' };
}



/** Build the grouping key for a lead given the active matching rule. */
function matchKey(l: UnifiedLead, mode: MatchBy): string {
  const email = normEmail(l.email);
  const phone = normPhone(l.phone);
  if (mode === 'email') return email;
  if (mode === 'phone') return phone;
  // 'both' — require BOTH to match; skip merging when either is missing so we
  // never collapse people who merely share one detail (e.g. a shared phone).
  return email && phone ? `${email}|${phone}` : '';
}

/** Sort comparator: by date, or by "needs action" (sync attention first). */
function compareLeads(
  a: UnifiedLead,
  b: UnifiedLead,
  sortBy: 'date' | 'needs_action',
  sortDir: SortDir
): number {
  if (sortBy === 'needs_action') {
    const an = needsSyncAttention(a) ? 1 : 0;
    const bn = needsSyncAttention(b) ? 1 : 0;
    if (an !== bn) return bn - an;
  }
  const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  return sortDir === 'asc' ? diff : -diff;
}




/** Small debounce hook — keeps search responsive on large datasets. */
function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function UnifiedLeadsInbox() {
  useLeadsRealtime();
  const { canViewLeads, canExportLeads, isSalesRep } = usePermissions();
  const { user } = useAdminAuth();
  const currentUserId = user?.id ?? null;
  const navigate = useNavigate();
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  useEffect(() => {
    const channel = supabase.channel('inbox-status')
      .subscribe((status) => {
        setIsRealtimeConnected(status === 'SUBSCRIBED');
      });
    return () => { supabase.removeChannel(channel); };
  }, []);
  const { prefetch: prefetchGhlLead, cancel: cancelPrefetchGhlLead } = usePrefetchGhlLead();
  const unifiedEnabled = useUnifiedLeadsFlag();
  const { data: reps = [] } = useSalesReps();
  const { data, isLoading, error, refetch, isRefetching } = useUnifiedLeads();
  const { segments, saveSegment, deleteSegment } = useLeadSegments();

  // Phase 1: Gmail-style segment tabs (filtered views of the ONE list).
  // The active segment is persisted in the URL (?segment=...) so returning from
  // a record via "Back to Leads" restores the same tab/filter.
  const [searchParams, setSearchParams] = useSearchParams();
  const validSegmentIds = useMemo(() => new Set(SEGMENT_DEFS.map((d) => d.id)), []);
  const [segment, setSegmentState] = useState<LeadSegment>(() => {
    const fromUrl = searchParams.get('segment');
    return fromUrl && validSegmentIds.has(fromUrl as LeadSegment) ? (fromUrl as LeadSegment) : 'all';
  });
  const setSegment = useCallback(
    (id: LeadSegment) => {
      setSegmentState(id);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (id === 'all') next.delete('segment');
          else next.set('segment', id);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );
  // Keep local state in sync if the URL segment changes (e.g. back navigation).
  useEffect(() => {
    const fromUrl = searchParams.get('segment');
    const resolved = fromUrl && validSegmentIds.has(fromUrl as LeadSegment) ? (fromUrl as LeadSegment) : 'all';
    setSegmentState((cur) => (cur === resolved ? cur : resolved));
  }, [searchParams, validSegmentIds]);
  const [showJunk, setShowJunk] = useState(false);

  // Part C: rep-focused default. Sales reps default to THEIR OWN leads; admins
  // default to all. Persisted per user in localStorage.
  const [ownerScope, setOwnerScope] = useState<'mine' | 'all'>(() => {
    if (typeof window === 'undefined') return 'all';
    const saved = window.localStorage.getItem(MY_LEADS_KEY);
    if (saved === 'mine' || saved === 'all') return saved;
    return isSalesRep ? 'mine' : 'all';
  });
  useEffect(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem(MY_LEADS_KEY, ownerScope);
  }, [ownerScope]);

  const [source, setSource] = useState<string>(ALL);
  const [status, setStatus] = useState<string>(ALL);
  const [ownerFilter, setOwnerFilter] = useState<string>(ALL);
  const [outcomeFilter, setOutcomeFilter] = useState<string>(ALL);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [sortBy, setSortBy] = useState<'date' | 'needs_action'>('date');
  const [mergeDuplicates, setMergeDuplicates] = useState(true);
  const [matchBy, setMatchBy] = useState<MatchBy>(() => {
    if (typeof window === 'undefined') return 'both';
    const saved = window.localStorage.getItem(MATCH_STORAGE_KEY) as MatchBy | null;
    return saved === 'email' || saved === 'phone' || saved === 'both' ? saved : 'both';
  });
  useEffect(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem(MATCH_STORAGE_KEY, matchBy);
  }, [matchBy]);

  const [page, setPage] = useState(1);
  const [saveOpen, setSaveOpen] = useState(false);
  const [segmentName, setSegmentName] = useState('');
  const [selected, setSelected] = useState<(UnifiedLead & { _dupes?: UnifiedLead[] }) | null>(null);

  // Manual merge: pick 2+ records, then combine them into one primary.
  const [selectMode, setSelectMode] = useState(false);
  const [picked, setPicked] = useState<Record<string, UnifiedLead & { _dupes?: UnifiedLead[] }>>({});
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergePrimaryKey, setMergePrimaryKey] = useState<string | null>(null);
  const [merging, setMerging] = useState(false);
  const [unmerging, setUnmerging] = useState(false);

  const pickedList = useMemo(() => Object.values(picked), [picked]);

  const togglePick = useCallback((lead: UnifiedLead & { _dupes?: UnifiedLead[] }) => {
    const key = leadKey(lead.source, lead.id);
    setPicked((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = lead;
      return next;
    });
  }, []);


  const clearPicks = useCallback(() => setPicked({}), []);

  // Pull the latest Meta (Facebook/Instagram) leads from GoHighLevel on demand.
  const [syncingMeta, setSyncingMeta] = useState(false);
  const syncMetaLeads = useCallback(async () => {
    setSyncingMeta(true);
    try {
      const { data: res, error: fnError } = await supabase.functions.invoke('sync-meta-leads', {
        body: { maxPages: 20 },
      });
      if (fnError) throw fnError;
      if (!res?.success) {
        toast.error(`Meta sync failed: ${res?.error ?? 'Unknown error'}`, {
          description: 'You can retry, or email us the problem.',
          action: { label: 'Email us', onClick: () => { window.location.href = mailtoError; } },
        });
        return;
      }
      toast.success(`Meta leads synced`, {
        description: `${res.matched ?? 0} matched · ${res.upserted ?? 0} imported/updated`,
      });
      await refetch();
    } catch (e) {
      toast.error('Could not reach the Meta sync service', {
        description: e instanceof Error ? e.message : 'Please try again shortly.',
        action: { label: 'Email us', onClick: () => { window.location.href = mailtoError; } },
      });
    } finally {
      setSyncingMeta(false);
    }
  }, [refetch]);


  const leads = data?.leads ?? [];
  const countsBySource = data?.countsBySource ?? ({} as Record<LeadSource, number>);
  const failedSources = data?.failedSources ?? [];
  const fmtCount = (n: number) => n.toLocaleString('en-AU');
  const allSourceCount = useMemo(
    () => (Object.keys(LEAD_SOURCE_META) as LeadSource[]).reduce((sum, s) => sum + (countsBySource[s] ?? 0), 0),
    [countsBySource],
  );

  const statusOptions = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => l.status && set.add(l.status));
    return Array.from(set).sort();
  }, [leads]);

  const ownerNameFor = useCallback(
    (l: UnifiedLead) => {
      const ownerId = l.annotation?.owner_id;
      if (!ownerId) return null;
      return ownerName(ownerId, reps) || null;
    },
    [reps]
  );

  const exportToCSV = () => {
    if (!displayed.length) return;
    const headers = ['Name', 'Email', 'Phone', 'Company', 'Status', 'Source', 'Received'];
    const rows = displayed.map((l) => [
      l.name,
      l.email || '',
      l.phone || '',
      l.company || '',
      humanizeStatusCode(l.status || ''),
      LEAD_SOURCE_META[l.source].label,
      format(new Date(l.created_at), 'yyyy-MM-dd HH:mm'),
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leads-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const list = leads.filter((l) => {
      // Segment tabs are pure filtered views of the ONE list (flag on only).
      if (unifiedEnabled && !inSegment(l, segment)) return false;
      // Part C: "My leads" scope — only leads owned by the current user.
      if (ownerScope === 'mine' && currentUserId) {
        if ((l.annotation?.owner_id ?? null) !== currentUserId) return false;
      }
      if (source !== ALL && l.source !== source) return false;
      if (status !== ALL && l.status !== status) return false;
      if (ownerFilter !== ALL) {
        const name = ownerNameFor(l);
        if (ownerFilter === '__unassigned') {
          if (name) return false;
        } else {
          if (name !== ownerFilter) return false;
        }
      }
      if (outcomeFilter !== ALL) {
        const outcome = l.annotation?.outcome ?? null;
        if (outcomeFilter === 'open' ? outcome !== null : outcome !== outcomeFilter) return false;
      }
      if (q) {
        const hay = `${l.name} ${l.email ?? ''} ${l.company ?? ''} ${l.phone ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    list.sort((a, b) => compareLeads(a, b, sortBy, sortDir));
    return list;
  }, [leads, source, status, ownerFilter, outcomeFilter, debouncedSearch, sortDir, sortBy, unifiedEnabled, segment, ownerScope, currentUserId]);

  // System-wide: hide invalid-number junk leads on EVERY tab unless revealed.
  // Conservative rule (see isJunkLead) — a lead with a real email is never hidden.
  // On the Meta tab we additionally apply the Meta-specific spam rule
  // (numeric names / junk phone numbers common in Meta ad leads).
  const isHiddenJunk = useCallback(
    (l: UnifiedLead) => isJunkLead(l) || (segment === 'meta' && isJunkMetaLead(l)),
    [segment]
  );
  const junkCount = useMemo(
    () => (unifiedEnabled ? filtered.filter((l) => isHiddenJunk(l)).length : 0),
    [filtered, unifiedEnabled, isHiddenJunk]
  );

  const segmentFiltered = useMemo(() => {
    if (!unifiedEnabled || showJunk) return filtered;
    return filtered.filter((l) => !isHiddenJunk(l));
  }, [filtered, unifiedEnabled, showJunk, isHiddenJunk]);


  // Merge duplicate people into one row using the active matching rule.
  // The most recent entry becomes the PRIMARY; older entries are attached as
  // _dupes so we can show every source/status this person appears under.
  type MergedLead = UnifiedLead & { _dupes: UnifiedLead[] };
  const displayed = useMemo<MergedLead[]>(() => {
    // Persistent merges (from the DB) always apply, even with the toggle off.
    if (!mergeDuplicates) return segmentFiltered.map((l) => ({ ...l, _dupes: l._merged ?? [] }));
    const groups = new Map<string, MergedLead>();
    const singles: MergedLead[] = [];
    for (const l of segmentFiltered) {
      const key = matchKey(l, matchBy);
      if (!key) {
        singles.push({ ...l, _dupes: l._merged ?? [] });
        continue;
      }
      const existing = groups.get(key);
      if (!existing) {
        groups.set(key, { ...l, _dupes: [...(l._merged ?? [])] });
      } else {
        // Keep the most recent record as the primary; demote the other to a dupe.
        if (new Date(l.created_at).getTime() > new Date(existing.created_at).getTime()) {
          const { _dupes, ...prevPrimary } = existing;
          const promoted: MergedLead = {
            ...l,
            _dupes: [..._dupes, prevPrimary, ...(l._merged ?? [])],
          };
          groups.set(key, promoted);
        } else {
          existing._dupes.push(l, ...(l._merged ?? []));
        }
      }
    }
    const merged = [...groups.values(), ...singles];
    merged.sort((a, b) => compareLeads(a, b, sortBy, sortDir));
    return merged;
  }, [segmentFiltered, mergeDuplicates, sortDir, sortBy, matchBy]);



  // Reset to first page whenever filters change.
  useEffect(() => {
    setPage(1);
  }, [source, status, ownerFilter, outcomeFilter, debouncedSearch, sortDir, sortBy, mergeDuplicates, matchBy, segment, showJunk, ownerScope]);

  // Segment tab counts (over the full list — labels, not data sources).
  const segmentCounts = useMemo(() => {
    const counts = {} as Record<LeadSegment, number>;
    SEGMENT_DEFS.forEach((def) => (counts[def.id] = 0));
    counts.all = allSourceCount;
    for (const l of leads) {
      SEGMENT_DEFS.forEach((def) => {
        if (def.id === 'all') return;
        if (inSegment(l, def.id)) counts[def.id] += 1;
      });
    }
    return counts;
  }, [leads, allSourceCount]);

  const totalPages = Math.max(1, Math.ceil(displayed.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = useMemo(
    () => displayed.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [displayed, currentPage]
  );

  const activeFilterCount =
    (source !== ALL ? 1 : 0) +
    (status !== ALL ? 1 : 0) +
    (ownerFilter !== ALL ? 1 : 0) +
    (outcomeFilter !== ALL ? 1 : 0) +
    (debouncedSearch.trim() ? 1 : 0);

  const clearFilters = useCallback(() => {
    setSource(ALL);
    setStatus(ALL);
    setOwnerFilter(ALL);
    setOutcomeFilter(ALL);
    setSearch('');
  }, []);

  const applySegment = (id: string) => {
    const seg = segments.find((s) => s.id === id);
    if (!seg) return;
    setSource(seg.filters.source ?? ALL);
    setStatus(seg.filters.status ?? ALL);
    setSearch(seg.filters.search ?? '');
    // Part C: saved segments also capture the active tab + owner + outcome.
    if (seg.filters.segment) setSegment(seg.filters.segment as LeadSegment);
    if (seg.filters.owner) {
      if (seg.filters.owner === OWNER_MINE) {
        setOwnerScope('mine');
        setOwnerFilter(ALL);
      } else {
        setOwnerScope('all');
        setOwnerFilter(seg.filters.owner);
      }
    } else {
      setOwnerFilter(ALL);
    }
    setOutcomeFilter(seg.filters.outcome ?? ALL);
  };

  const handleSaveSegment = async () => {
    if (!segmentName.trim()) return;
    try {
      await saveSegment.mutateAsync({
        name: segmentName.trim(),
        filters: {
          source,
          status,
          search,
          segment,
          // Preserve the rep's "my leads" intent, else the explicit owner filter.
          owner: ownerScope === 'mine' ? OWNER_MINE : ownerFilter,
          outcome: outcomeFilter,
        },
      });
      toast.success('Segment saved');
      setSaveOpen(false);
      setSegmentName('');
    } catch {
      toast.error('Could not save segment');
    }
  };

  const openMerge = () => {
    if (pickedList.length < 2) return;
    // Default primary: prefer a GHL-linked record, else the most recent.
    const sorted = [...pickedList].sort((a, b) => {
      const ag = a.ghl_contact_id ? 1 : 0;
      const bg = b.ghl_contact_id ? 1 : 0;
      if (ag !== bg) return bg - ag;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    setMergePrimaryKey(leadKey(sorted[0].source, sorted[0].id));
    setMergeOpen(true);
  };

  const confirmMerge = async () => {
    const primary = pickedList.find((l) => leadKey(l.source, l.id) === mergePrimaryKey);
    if (!primary || pickedList.length < 2) return;
    setMerging(true);
    try {
      const { matchedOn, reason } = describeMatch(pickedList);
      // Flatten: link every picked record (and any records already merged under
      // them) to the chosen primary.
      const primaryKey = leadKey(primary.source, primary.id);
      const children: UnifiedLead[] = [];
      for (const p of pickedList) {
        if (leadKey(p.source, p.id) !== primaryKey) children.push(p);
        (p._dupes ?? []).forEach((d) => {
          if (leadKey(d.source, d.id) !== primaryKey) children.push(d);
        });
      }
      const seen = new Set<string>();
      const rows = children
        .filter((c) => {
          const k = leadKey(c.source, c.id);
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        })
        .map((c) => ({
          primary_source: primary.source,
          primary_id: primary.id,
          merged_source: c.source,
          merged_id: c.id,
          matched_on: matchedOn,
          reason,
        }));

      const { error } = await supabase
        .from('lead_merges')
        .upsert(rows, { onConflict: 'merged_source,merged_id' });
      if (error) throw error;

      toast.success(`Merged ${rows.length + 1} records into one`);
      setMergeOpen(false);
      setSelectMode(false);
      clearPicks();
      await refetch();
    } catch {
      toast.error('Could not merge these records. Please try again or email us.');
    } finally {
      setMerging(false);
    }
  };

  const unmergeOne = async (dupe: UnifiedLead) => {
    if (!dupe._mergeId) return;
    setUnmerging(true);
    try {
      const { error } = await supabase.from('lead_merges').delete().eq('id', dupe._mergeId);
      if (error) throw error;
      toast.success('Record un-merged');
      setSelected(null);
      await refetch();
    } catch {
      toast.error('Could not un-merge. Please try again.');
    } finally {
      setUnmerging(false);
    }
  };

  if (!canViewLeads) return <AccessDenied />;


  const mailtoError = `mailto:${CONTACT_INFO.email.support}?subject=${encodeURIComponent(
    'Leads inbox error'
  )}&body=${encodeURIComponent(
    `A lead source failed to load.\n\nPage: ${typeof window !== 'undefined' ? window.location.href : ''}\nFailed sources: ${failedSources
      .map((s) => LEAD_SOURCE_META[s].label)
      .join(', ')}\n\n(Please attach a screenshot.)`
  )}`;

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Leads"
        icon={<Users className="h-5 w-5 text-primary" />}
        isRealtimeConnected={isRealtimeConnected}
        stats={[
          { label: 'Total', value: leads.length },
          { label: 'Showing', value: displayed.length },
        ]}
        description=""
        onRefresh={() => refetch()}
        isLoading={isLoading || isRefetching}
      />


      {/* Part B: read-only funnel metrics (default collapsed) */}
      

      {/* Fallback banner if a source failed */}
      {failedSources.length > 0 && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-3 flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
            <span className="flex-1">
              Couldn't load: {failedSources.map((s) => LEAD_SOURCE_META[s].label).join(', ')}.
              Other sources are shown below.
            </span>
            <div className="flex gap-2 flex-wrap">
              {failedSources.map((s) => (
                <Button key={s} asChild variant="outline" size="sm" className="min-h-[44px]">
                  <Link to={LEAD_SOURCE_META[s].legacyPath}>Open {LEAD_SOURCE_META[s].label}</Link>
                </Button>
              ))}
              <Button asChild variant="outline" size="sm" className="min-h-[44px]">
                <a href={mailtoError}>Email us this problem</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-3 text-sm flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              We couldn't load your leads.
            </span>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" className="min-h-[44px]" onClick={() => refetch()}>
                Try again
              </Button>
              <Button asChild variant="outline" size="sm" className="min-h-[44px]">
                <a href={mailtoError}>Email us this problem</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ONE segment tab row (Gmail-style filtered views of the ONE list) */}
      {unifiedEnabled && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {SEGMENT_DEFS.map((def) => (
              <button
                key={def.id}
                onClick={() => setSegment(def.id)}
                className={cn(
                  'px-3 h-9 rounded-lg border text-sm font-medium transition-colors',
                  segment === def.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted'
                )}
              >
                {def.label} ({fmtCount(segmentCounts[def.id])})
              </button>
            ))}

            {/* Status-dot colour legend */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  aria-label="Status colour legend"
                  title="Status colour legend"
                >
                  <Info className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-64 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">Status dot colours</p>
                <ul className="space-y-1.5 text-xs">
                  <li className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
                    Synced to GHL
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" />
                    Awaiting booking / queued / verifying
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500 shrink-0" />
                    Sync failed
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-400 shrink-0" />
                    Not synced / N/A
                  </li>
                </ul>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Part C: My leads / All leads scope toggle */}
            <div className="inline-flex rounded-lg border p-0.5">
              <button
                onClick={() => setOwnerScope('mine')}
                className={cn(
                  'px-3 h-8 rounded-md text-xs font-medium transition-colors',
                  ownerScope === 'mine'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                My leads
              </button>
              <button
                onClick={() => setOwnerScope('all')}
                className={cn(
                  'px-3 h-8 rounded-md text-xs font-medium transition-colors',
                  ownerScope === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                All leads
              </button>
            </div>
            {junkCount > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Hidden: {junkCount} junk {junkCount === 1 ? 'lead' : 'leads'}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setShowJunk((v) => !v)}
                >
                  {showJunk ? 'Hide again' : 'Reveal'}
                </Button>
              </div>
            )}
            {segment === 'meta' && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 min-h-[44px] sm:min-h-0 gap-2"
                onClick={syncMetaLeads}
                disabled={syncingMeta}
                title="Pull the latest Meta leads from GoHighLevel"
              >
                {syncingMeta ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ArrowUpDown className="h-3.5 w-3.5" />
                )}
                {syncingMeta ? 'Syncing…' : 'Sync Meta leads now'}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Legacy source chips (only when the unified inbox is disabled) */}
      {!unifiedEnabled && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSource(ALL)}
            className={cn(
              'px-3 min-h-[44px] rounded-lg border text-sm transition-colors',
              source === ALL ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'
            )}
          >
            All ({fmtCount(allSourceCount)})
          </button>
          {(Object.keys(LEAD_SOURCE_META) as LeadSource[]).map((s) => (
            <button
              key={s}
              onClick={() => setSource(s)}
              className={cn(
                'px-3 min-h-[44px] rounded-lg border text-sm transition-colors',
                source === s ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'
              )}
            >
              {LEAD_SOURCE_META[s].label} ({fmtCount(countsBySource[s] ?? 0)})
            </button>
          ))}
        </div>
      )}

      {/* Shared metrics strip: the segment counts the Inbox already computes. */}
      {unifiedEnabled && (
        <>
        <AdminMetricsStrip
          metrics={[
            {
              value: fmtCount(segmentCounts.all ?? 0),
              label: 'All leads',
              onClick: () => setSegment('all'),
              active: segment === 'all',
            },
            {
              value: fmtCount(segmentCounts.booked ?? 0),
              label: 'Booked',
              tone: 'good',
              onClick: () => setSegment('booked'),
              active: segment === 'booked',
            },
            {
              value: fmtCount(segmentCounts.incomplete ?? 0),
              label: 'Incomplete',
              tone: 'warn',
              onClick: () => setSegment('incomplete'),
              active: segment === 'incomplete',
            },
            {
              value: fmtCount(segmentCounts.sync ?? 0),
              label: 'Needs sync',
              tone: 'accent',
              onClick: () => setSegment('sync'),
              active: segment === 'sync',
            },
          ]}
        />
        <AdminActionsRow
          actions={[
            {
              key: 'refresh',
              label: 'Refresh',
              icon: <RefreshCw className="h-3.5 w-3.5" />,
              onClick: () => refetch(),
              loading: isRefetching,
            },
            {
              key: 'export',
              label: 'Export',
              icon: <Download className="h-3.5 w-3.5" />,
              onClick: exportToCSV,
              allowed: canExportLeads,
            },
          ]}
          className="mt-4"
        />
        {/* Which sources actually produce meetings. Computed from the same
            `displayed` array the table renders, so it always agrees with what
            is on screen — including when a filter is applied. */}
        <LeadSourcePerformance
          leads={displayed}
          scopeLabel={displayed.length === (segmentCounts.all ?? 0) ? 'all leads' : 'current filter'}
        />
        </>
      )}


      {/* Shared toolbar: Search · Sort · Status · Owner · Outcome · ⋯ overflow */}
      <AdminToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name, email, company, phone…"
        resultCount={displayed.length}
        onClearAll={clearFilters}
        filters={[
          {
            key: 'sort',
            label: 'Sort',
            allValue: 'date_desc',
            width: 'w-[168px]',
            value: sortBy === 'needs_action' ? 'needs_action' : sortDir === 'desc' ? 'date_desc' : 'date_asc',
            onChange: (v) => {
              if (v === 'needs_action') {
                setSortBy('needs_action');
              } else {
                setSortBy('date');
                setSortDir(v === 'date_asc' ? 'asc' : 'desc');
              }
            },
            options: [
              { value: 'date_desc', label: 'Date (newest)' },
              { value: 'date_asc', label: 'Date (oldest)' },
              { value: 'needs_action', label: 'Needs action' },
            ],
          },
          {
            // Source filter — the chips only render with the unified inbox OFF,
            // so without this there was no way to list e.g. Site Leads.
            key: 'source',
            label: 'Source',
            allValue: ALL,
            width: 'w-[172px]',
            value: source,
            onChange: setSource,
            options: [
              { value: ALL, label: `All sources (${fmtCount(allSourceCount)})` },
              ...(Object.keys(LEAD_SOURCE_META) as LeadSource[])
                .map((s) => ({
                  value: s,
                  label: `${LEAD_SOURCE_META[s].label} (${fmtCount(countsBySource[s] ?? 0)})`,
                  count: countsBySource[s] ?? 0,
                }))
                .filter((o) => o.count > 0 || o.value === source)
                .map(({ value, label }) => ({ value, label })),
            ],
          },
          {
            key: 'status',
            label: 'Status',
            allValue: ALL,
            value: status,
            onChange: setStatus,
            options: [
              { value: ALL, label: 'All statuses' },
              ...statusOptions.map((s) => ({ value: s, label: s })),
            ],
          },
          {
            key: 'owner',
            label: 'Owner',
            allValue: ALL,
            value: ownerFilter,
            onChange: setOwnerFilter,
            options: [
              { value: ALL, label: 'All owners' },
              { value: '__unassigned', label: 'Unassigned' },
              ...optionsFromData(leads, (l) => ownerNameFor(l)),
            ],
          },
          {
            key: 'outcome',
            label: 'Outcome',
            allValue: ALL,
            value: outcomeFilter,
            onChange: setOutcomeFilter,
            options: [
              { value: ALL, label: 'Any outcome' },
              { value: 'open', label: 'Open (no outcome)' },
              { value: 'won', label: 'Won' },
              { value: 'lost', label: 'Lost' },
            ],
          },
        ]}
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8" title="More actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onClick={() => {
                  setSelectMode((v) => !v);
                  clearPicks();
                }}
              >
                <GitMerge className="h-4 w-4 mr-2" />
                {selectMode ? 'Cancel merge selection' : 'Merge records'}
              </DropdownMenuItem>
              <DropdownMenuCheckboxItem
                checked={mergeDuplicates}
                onCheckedChange={(c) => setMergeDuplicates(!!c)}
              >
                Collapse duplicate people
              </DropdownMenuCheckboxItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger disabled={!mergeDuplicates}>
                  Dedup match mode
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup value={matchBy} onValueChange={(v) => setMatchBy(v as MatchBy)}>
                    <DropdownMenuRadioItem value="both">{MATCH_LABELS.both}</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="email">{MATCH_LABELS.email}</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="phone">{MATCH_LABELS.phone}</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSaveOpen(true)}>
                <Save className="h-4 w-4 mr-2" /> Save segment
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Bookmark className="h-4 w-4 mr-2" /> Saved segments
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-56">
                  {segments.length === 0 && (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">No saved segments</div>
                  )}
                  {segments.map((seg) => (
                    <div key={seg.id} className="flex items-center">
                      <DropdownMenuItem className="flex-1" onClick={() => applySegment(seg.id)}>
                        {seg.name}
                      </DropdownMenuItem>
                      {!seg.isPreset && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteSegment.mutate(seg.id);
                          }}
                          className="px-2 text-muted-foreground hover:text-destructive"
                          aria-label={`Delete ${seg.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />



      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="py-3 flex items-center gap-3">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-64" />
                </div>
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16">
          <Users className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium">
            {leads.length === 0 ? 'No leads yet' : 'No leads match your filters'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {leads.length === 0
              ? 'New leads from every source will appear here automatically.'
              : 'Try adjusting the source, status, or search.'}
          </p>
          {activeFilterCount > 0 && (
            <Button variant="outline" size="sm" className="mt-4 min-h-[44px]" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <>
          <LeadList>
            <LeadListHeader whenLabel="Received" selectable={selectMode} />
            {pageItems.map((lead) => {
              // Distinct source labels across the primary row + any merged dupes.
              const allEntries = [lead, ...lead._dupes];
              const sourceLabels = Array.from(
                new Set(allEntries.map((e) => LEAD_SOURCE_META[e.source].label))
              );
              // Show ONLY the single most-recent/most-relevant status, humanized.
              const latestStatusEntry = [...allEntries]
                .filter((e) => e.status)
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
              const latestStatusLabel = latestStatusEntry ? leadStatusLabel(latestStatusEntry) : null;
              const isMerged = lead._dupes.length > 0;
              const isPicked = !!picked[leadKey(lead.source, lead.id)];
              const badge = sourceBadge(lead);
              const leadIsGHL = isGHLSource(lead);
              // GHL contact links only make sense for GHL-backed sources that
              // have a GENUINE contact id. No email-search fallback — if there's
              // no contact id, the lead never synced, so hide the button.
              const rowGhlContactId = leadIsGHL
                ? lead.ghl_contact_id ||
                  lead._dupes.find((d) => d.ghl_contact_id)?.ghl_contact_id ||
                  null
                : null;
              const handleRowClick = () => {
                if (selectMode) return togglePick(lead);
                // The Inbox peeks; it does not navigate. The peek's own
                // "Open in …" button routes to the source's record.
                setSelected(lead);
              };
              return (
                <LeadListRow
                  key={`${lead.source}-${lead.id}`}
                  selectable={selectMode}
                  selectSlot={
                    selectMode ? (
                      <input
                        type="checkbox"
                        checked={isPicked}
                        onChange={() => togglePick(lead)}
                        className="h-4 w-4 accent-primary cursor-pointer"
                        aria-label={`Select ${lead.name} to merge`}
                      />
                    ) : null
                  }
                  onClick={handleRowClick}
                  onMouseEnter={() => { if (rowGhlContactId) prefetchGhlLead(rowGhlContactId); }}
                  onMouseLeave={cancelPrefetchGhlLead}
                  className={cn(isPicked && 'bg-primary/5')}
                  syncSlot={
                    unifiedEnabled && leadIsGHL ? (
                      <GHLSyncDot input={lead.raw as Record<string, unknown>} />
                    ) : null
                  }
                  name={lead.name}
                  badgeSlot={
                    unifiedEnabled ? (
                      <Badge className="text-xs bg-primary/10 text-primary border-primary/20" variant="outline">
                        {badge}
                      </Badge>
                    ) : (
                      <>
                        {sourceLabels.map((label) => (
                          <Badge key={label} variant="outline" className="text-xs">{label}</Badge>
                        ))}
                      </>
                    )
                  }
                  extraSlot={
                    <>
                      {isMerged && (
                        <MergedCountBadge
                          count={lead._dupes.length}
                          tooltip={`Showing the latest record; ${lead._dupes.length} older ${lead._dupes.length === 1 ? 'entry' : 'entries'} ${MATCH_HINTS[matchBy]}.`}
                        />
                      )}
                      {lead.annotation?.stage && (
                        <Badge variant="outline" className="text-xs">{lead.annotation.stage}</Badge>
                      )}
                      <OutcomePill outcome={lead.annotation?.outcome} />
                    </>
                  }
                  contactLine={
                    <span className="flex flex-wrap items-center gap-x-3">
                      {lead.email && <span className="truncate">{lead.email}</span>}
                      {lead.phone && <span>{lead.phone}</span>}
                      {lead.company && <span className="truncate">{lead.company}</span>}
                    </span>
                  }
                  status={lead.status}
                  statusLabel={latestStatusLabel}
                  ownerSlot={
                    <LeadOwnerCell
                      owner={
                        lead.annotation?.owner_id
                          ? {
                              id: lead.annotation.owner_id,
                              name: ownerName(lead.annotation.owner_id, reps) ?? 'Owner',
                            }
                          : null
                      }
                      noteCount={lead.notesCount ?? 0}
                      unreadNotes={hasUnreadLocalNotes(lead, currentUserId)}
                    />
                  }
                  whenSlot={format(new Date(lead.created_at), 'd MMM yyyy, h:mma')}
                  actionsSlot={unifiedEnabled ? <LeadRowActions lead={lead} /> : null}
                />
              );
            })}
          </LeadList>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <span className="text-xs text-muted-foreground">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, displayed.length)} of {displayed.length}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="min-h-[44px]"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>
              <span className="text-xs text-muted-foreground px-1">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="min-h-[44px]"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Floating manual-merge action bar */}
      {selectMode && pickedList.length > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
          <div className="flex items-center gap-3 rounded-full border bg-background shadow-lg px-4 py-2">
            <span className="text-sm">
              {pickedList.length} selected
            </span>
            <Button size="sm" variant="ghost" className="min-h-[40px]" onClick={clearPicks}>
              Clear
            </Button>
            <Button
              size="sm"
              className="min-h-[40px]"
              disabled={pickedList.length < 2}
              onClick={openMerge}
            >
              <GitMerge className="h-4 w-4 mr-1.5" />
              Merge {pickedList.length >= 2 ? pickedList.length : ''} records
            </Button>
          </div>
        </div>
      )}

      {/* Merge confirm dialog */}
      <Dialog open={mergeOpen} onOpenChange={(o) => !o && setMergeOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Merge {pickedList.length} records</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
              {describeMatch(pickedList).reason}
            </div>
            <div>
              <p className="text-xs font-medium mb-1.5">Keep as the primary record</p>
              <div className="space-y-1.5">
                {pickedList.map((l) => {
                  const k = leadKey(l.source, l.id);
                  return (
                    <label
                      key={k}
                      className={cn(
                        'flex items-start gap-2 rounded-md border p-2 cursor-pointer',
                        mergePrimaryKey === k && 'border-primary ring-1 ring-primary'
                      )}
                    >
                      <input
                        type="radio"
                        name="merge-primary"
                        checked={mergePrimaryKey === k}
                        onChange={() => setMergePrimaryKey(k)}
                        className="mt-1 accent-primary"
                      />
                      <span className="min-w-0">
                        <span className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium truncate">{l.name}</span>
                          <Badge variant="outline" className="text-[11px]">{LEAD_SOURCE_META[l.source].label}</Badge>
                          {l.ghl_contact_id && (
                            <Badge variant="secondary" className="text-[11px]">GHL linked</Badge>
                          )}
                        </span>
                        <span className="block text-xs text-muted-foreground truncate">
                          {l.email ?? l.phone ?? '—'} · {format(new Date(l.created_at), 'd MMM yyyy')}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">
                The other records are attached to the primary and hidden from the list.
                This is reversible — open the primary to un-merge any record.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMergeOpen(false)}>Cancel</Button>
            <Button onClick={confirmMerge} disabled={merging || !mergePrimaryKey}>
              {merging ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Merge records'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* THE peek — one shared component for every lead surface. Its primary
          button routes to the source's own record page. */}
      <LeadQuickView
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        lead={
          selected
            ? {
                source: selected.source,
                id: selected.id,
                name: selected.name,
                email: selected.email,
                phone: selected.phone,
                company: selected.company,
                status: selected.status,
                createdAt: selected.created_at,
                sourceUrl: selected.source_url,
                ghlContactId:
                  selected.ghl_contact_id ||
                  selected._dupes?.find((d) => d.ghl_contact_id)?.ghl_contact_id ||
                  null,
                appointmentId: selected.appointment_id,
                raw: selected.raw,
              }
            : null
        }
        // Merged records deliberately do NOT appear in the peek — the
        // "N records" badge routes to the full record, which owns the audit
        // trail and the un-merge controls.
        mergedCount={selected?._dupes?.length ?? 0}
      />

      {/* Save segment dialog */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Save current filters as a segment</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="e.g. Hot bookings"
            value={segmentName}
            onChange={(e) => setSegmentName(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSegment} disabled={saveSegment.isPending || !segmentName.trim()}>
              {saveSegment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

