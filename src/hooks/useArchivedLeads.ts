import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  UnifiedLead,
  LeadSource,
  normalizeGhlSubmission,
  normalizeAlphaDigitalLead,
  normalizeLead,
} from '@/lib/unifiedLead';
import {
  ALPHA_SLIM_SELECT,
  attachOverlay,
  fetchSource,
  rebuildAlphaRawData,
} from '@/hooks/useUnifiedLeads';

/**
 * Archived leads — the mirror image of `useUnifiedLeads`.
 *
 * Same source fetchers, same `normalize*` functions, same 1000-row paging and
 * the same overlay attach (owner + notes). The ONLY difference is the filter:
 * `.not('archived_at', 'is', null)` instead of `.is('archived_at', null)`.
 *
 * Only THREE tables carry an `archived_at` column — `ghl_submissions`, `leads`
 * and `alpha_digital_leads` — so only those three are queried here. Meta Lead
 * Ads, Investor leads and Webinar registrations have no archive column at all,
 * which means they can never be archived and are deliberately absent from this
 * view (they are NOT silently folded in as "never archived").
 *
 * The cross-source merge is skipped on purpose. Archived records are being
 * looked at one at a time to restore or discard, so collapsing them into
 * "people" would hide the very rows someone came here to find.
 */

export const ARCHIVABLE_SOURCES: LeadSource[] = [
  'ghl_submissions',
  'leads',
  'alpha_digital_leads',
];

export interface ArchivedLeadsResult {
  leads: UnifiedLead[];
  countsBySource: Record<string, number>;
  failedSources: LeadSource[];
}

type LeadQuery = any;

const applyArchived = (query: LeadQuery) => query.not('archived_at', 'is', null);

const PAGE_SIZE = 1000;

async function fetchArchivedAlpha(): Promise<{ leads: UnifiedLead[]; count: number }> {
  // Same extracted-keys select the inbox uses — never the full raw_data blob.
  const rows: Record<string, any>[] = [];
  let from = 0;
  while (from < 100000) {
    const { data, error } = await supabase
      .from('alpha_digital_leads')
      .select(ALPHA_SLIM_SELECT)
      .not('archived_at', 'is', null)
      .order('archived_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    const page = data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  const mapped = rows.map((r: Record<string, any>) => rebuildAlphaRawData(r));
  return { leads: mapped.map(normalizeAlphaDigitalLead), count: mapped.length };
}

const SOURCE_FETCHERS: {
  source: LeadSource;
  run: () => Promise<{ leads: UnifiedLead[]; count: number }>;
}[] = [
  {
    source: 'ghl_submissions',
    run: () => fetchSource('ghl_submissions', applyArchived, normalizeGhlSubmission),
  },
  {
    source: 'leads',
    // No `applySiteLeadFilters` here: the inbox hides GHL direct-booking rows
    // because their twin already shows as Booked, but an archived row must
    // still be findable and restorable from its own table.
    run: () => fetchSource('leads', applyArchived, normalizeLead),
  },
  { source: 'alpha_digital_leads', run: fetchArchivedAlpha },
];

/** Archive timestamp for a row, read off the raw source record. */
export function archivedAtOf(lead: UnifiedLead): string | null {
  const raw = (lead.raw ?? {}) as Record<string, unknown>;
  const v = raw.archived_at;
  return typeof v === 'string' ? v : null;
}

async function fetchArchivedLeads(): Promise<ArchivedLeadsResult> {
  const results = await Promise.allSettled(SOURCE_FETCHERS.map((f) => f.run()));

  const leads: UnifiedLead[] = [];
  const countsBySource: Record<string, number> = {};
  const failedSources: LeadSource[] = [];

  results.forEach((res, i) => {
    const { source } = SOURCE_FETCHERS[i];
    if (res.status === 'fulfilled') {
      countsBySource[source] = res.value.count;
      leads.push(...res.value.leads);
    } else {
      // Never dead-end the whole page because one source failed.
      failedSources.push(source);
      countsBySource[source] = 0;
    }
  });

  // Newest archive first — that's the column you scan on this page.
  leads.sort((a, b) => {
    const at = new Date(archivedAtOf(a) ?? a.created_at).getTime();
    const bt = new Date(archivedAtOf(b) ?? b.created_at).getTime();
    return bt - at;
  });

  const withOverlay = await attachOverlay(leads);
  return { leads: withOverlay, countsBySource, failedSources };
}

export function useArchivedLeads() {
  return useQuery({
    queryKey: ['archived-leads'],
    queryFn: fetchArchivedLeads,
    staleTime: 60_000,
  });
}
