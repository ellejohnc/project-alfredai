import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  UnifiedLead,
  LeadSource,
  LeadAnnotation,
  LeadNote,
  leadKey,
  normalizeGhlSubmission,
  normalizeMetaLead,
  normalizeInvestorLead,
  normalizeAlphaDigitalLead,
  normalizeLead,
  normalizeWebinarRegistration,
} from '@/lib/unifiedLead';

export interface UnifiedLeadsResult {
  leads: UnifiedLead[];
  countsBySource: Record<LeadSource, number>;
  failedSources: LeadSource[];
}

// PostgREST caps each response at 1,000 rows server-side. Page every source so
// the inbox receives the complete dataset while exact count queries power badges.
const PAGE_SIZE = 1000;

type SourceFetchResult = { leads: UnifiedLead[]; count: number };
type Fetcher = () => Promise<SourceFetchResult>;

type LeadQuery = any;

const fromTable = (table: string) => (supabase as any).from(table);

async function fetchAllRows(
  table: string,
  applyFilters: (query: LeadQuery) => LeadQuery,
  columns = '*',
): Promise<Record<string, any>[]> {
  const rows: Record<string, any>[] = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await applyFilters(
      fromTable(table).select(columns).order('created_at', { ascending: false }).range(from, to),
    );

    if (error) throw error;
    const page = (data ?? []) as Record<string, any>[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
}

async function fetchExactCount(
  table: string,
  applyFilters: (query: LeadQuery) => LeadQuery,
): Promise<number> {
  const { count, error } = await applyFilters(
    fromTable(table).select('*', { count: 'exact', head: true }),
  );
  if (error) throw error;
  return count ?? 0;
}

export async function fetchSource(
  table: string,
  applyFilters: (query: LeadQuery) => LeadQuery,
  normalize: (row: Record<string, any>) => UnifiedLead,
  columns = '*',
): Promise<SourceFetchResult> {
  const [rows, count] = await Promise.all([
    fetchAllRows(table, applyFilters, columns),
    fetchExactCount(table, applyFilters),
  ]);

  return { leads: rows.map(normalize), count };
}

/**
 * The slim Alpha Digital select: every column the UI reads plus only the
 * `raw_data` keys anything actually touches (~30 kB instead of a 5.5 MB blob).
 * Exported so other surfaces (the archived view) read Alpha exactly the same
 * cheap way instead of re-deriving the key list and drifting.
 */
export const ALPHA_SLIM_SELECT =
  'id, external_id, name, email, phone, company, source, status, synced_at, archived_at, created_at, updated_at, ghl_contact_id, ghl_opportunity_id, ghl_pushed_at, ghl_push_meta,' +
  'rd_linkedinUrl:raw_data->>linkedinUrl,' +
  'rd_linkedin_url:raw_data->>linkedin_url,' +
  'rd_profileUrl:raw_data->>profileUrl,' +
  'rd_headline:raw_data->>headline,' +
  'rd_occupation:raw_data->>occupation,' +
  'rd_jobTitle:raw_data->>jobTitle,' +
  'rd_title:raw_data->>title,' +
  'rd_company:raw_data->>company,' +
  'rd_currentCompany:raw_data->>currentCompany,' +
  'rd_companyName:raw_data->>companyName,' +
  'rd_campaign:raw_data->campaign,' +
  'rd_connectionDegree:raw_data->>connectionDegree,' +
  'rd_degree:raw_data->>degree,' +
  'rd_currentStep:raw_data->>currentStep,' +
  'rd_step:raw_data->>step,' +
  'rd_nextStep:raw_data->>nextStep,' +
  'rd_businessEmail:raw_data->>businessEmail,' +
  'rd_personalEmail:raw_data->>personalEmail,' +
  'rd_stepChangeTimestamp:raw_data->>stepChangeTimestamp';

/** Rebuild a slim `raw_data` object so downstream readers can't tell the
 *  difference between the extracted keys and the original blob. */
export function rebuildAlphaRawData(r: Record<string, any>): Record<string, any> {
  return {
    ...r,
    raw_data: {
      linkedinUrl: r.rd_linkedinUrl,
      linkedin_url: r.rd_linkedin_url,
      profileUrl: r.rd_profileUrl,
      headline: r.rd_headline,
      occupation: r.rd_occupation,
      jobTitle: r.rd_jobTitle,
      title: r.rd_title,
      company: r.rd_company,
      currentCompany: r.rd_currentCompany,
      companyName: r.rd_companyName,
      campaign: r.rd_campaign,
      connectionDegree: r.rd_connectionDegree,
      degree: r.rd_degree,
      currentStep: r.rd_currentStep,
      step: r.rd_step,
      nextStep: r.rd_nextStep,
      businessEmail: r.rd_businessEmail,
      personalEmail: r.rd_personalEmail,
      stepChangeTimestamp: r.rd_stepChangeTimestamp,
    },
  };
}


async function fetchAllPaged(table: string): Promise<Record<string, any>[]> {
  const rows: Record<string, any>[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await fromTable(table)
      .select('*')
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    const page = (data ?? []) as Record<string, any>[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return rows;
}

const applyNoFilters = (query: LeadQuery) => query;
const applyNotArchived = (query: LeadQuery) => query.is('archived_at', null);
export const applySiteLeadFilters = (query: LeadQuery) =>
  query
    .is('archived_at', null)
    .or('lead_source.is.null,lead_source.neq.calendar_widget')
    .or('source_medium.is.null,source_medium.neq.ghl_direct_booking');

// Each source is fetched independently so one failure never blocks the others
// (fallback rule: never dead-end the whole inbox).
const SOURCE_FETCHERS: { source: LeadSource; run: Fetcher }[] = [
  {
    source: 'ghl_submissions',
    run: () => fetchSource('ghl_submissions', applyNotArchived, normalizeGhlSubmission),
  },
  {
    source: 'meta_leads',
    // Every column EXCEPT raw_payload. That jsonb is 2,022 kB of this table's
    // 2,440 kB and nothing in the inbox path reads inside it — only
    // MetaLeadsAdmin does, and it fetches separately. Unlike Alpha's raw_data,
    // there are no fields hiding in here that the UI needs, so this is a plain
    // exclusion rather than a key extraction. Checked every consumer first.
    run: () =>
      fetchSource(
        'meta_leads',
        applyNoFilters,
        normalizeMetaLead,
        'id, full_name, email, phone, form_name, form_id, campaign_id, ad_id, ad_name, client, status, submitted_at, created_at, leadgen_id, notification_status, notification_sent_at, notification_error, ghl_contact_id, utm_source, utm_medium, utm_campaign, source, tags',
      ),
  },
  {
    source: 'investor_leads',
    run: () => fetchSource('investor_leads', applyNoFilters, normalizeInvestorLead),
  },
  {
    source: 'alpha_digital_leads',
    run: async () => {
      // The `raw_data` jsonb is ~5.5 MB across the active rows and transferring
      // it for 1000 rows tripped the statement timeout, which dead-ended this
      // source in the inbox. But the LinkedIn card genuinely needs what's inside
      // it, so we can't just drop it either.
      //
      // Instead we extract only the keys anything actually reads — about 30 kB
      // total, 185x smaller than the blob — and rebuild a slim `raw_data` below.
      // Everything downstream (normalizeAlphaDigitalLead, extractAlphaRawInfo,
      // LeadDetailPage, LeadQuickView) keeps reading `raw_data` exactly as
      // before and can't tell the difference.
      const CHUNK = 1000;
      const rows: Record<string, any>[] = [];
      let from = 0;
      // Page like every other source. This used to be a hard .limit(1000) —
      // the only capped source in the file — while this is the only table that
      // exceeds 1000 rows (3,055 active). That hid 2,055 leads from the inbox
      // AND broke every row link on the Alpha admin page for those leads,
      // because LeadDetailPage resolves the id out of this same list and shows
      // "not found" when it misses. Paging is cheap now that we only pull the
      // extracted keys rather than the 5.5 MB blob.
      while (from < 100000) {
        const { data, error } = await supabase
          .from('alpha_digital_leads')
          .select(ALPHA_SLIM_SELECT)
          .is('archived_at', null)
          .order('created_at', { ascending: false })
          .range(from, from + CHUNK - 1);
        if (error) throw error;
        const page = data ?? [];
        rows.push(...page);
        if (page.length < CHUNK) break;
        from += CHUNK;
      }

      const mapped = rows.map((r: Record<string, any>) => rebuildAlphaRawData(r));

      return { leads: mapped.map(normalizeAlphaDigitalLead), count: mapped.length };


    },
  },
  {
    source: 'leads',
    // GHL direct-booking rows are already represented as ghl_submissions; keeping
    // them here would duplicate the Booked records in the "Site Leads" source.
    run: () => fetchSource('leads', applySiteLeadFilters, normalizeLead),
  },
  {
    source: 'webinar_registrations',
    run: () => fetchSource('webinar_registrations', applyNoFilters, normalizeWebinarRegistration),
  },
];

async function fetchUnifiedLeads(): Promise<UnifiedLeadsResult> {
  const results = await Promise.allSettled(SOURCE_FETCHERS.map((f) => f.run()));

  const leads: UnifiedLead[] = [];
  const countsBySource = {} as Record<LeadSource, number>;
  const failedSources: LeadSource[] = [];

  results.forEach((res, i) => {
    const { source } = SOURCE_FETCHERS[i];
    if (res.status === 'fulfilled') {
      countsBySource[source] = res.value.count;
      leads.push(...res.value.leads);
    } else {
      failedSources.push(source);
      countsBySource[source] = 0;
    }
  });

  leads.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Apply persistent merges recorded in lead_merges so duplicates stay collapsed
  // everywhere (not just via the inbox toggle) and merges survive reloads.
  const merged = await applyPersistentMerges(leads);

  // Then collapse duplicates ACROSS source tables when they share a normalized
  // email or phone (e.g. leads + ghl_submissions for the same person). Keep the
  // GHL-linked / booked record as primary so Rebecca shows once as Booked.
  const crossMerged = applyCrossSourceMerges(merged);

  // Attach overlay CRM data (owner/stage/outcome + notes) from the side tables.
  const withOverlay = await attachOverlay(crossMerged);

  return { leads: withOverlay, countsBySource, failedSources };
}

/** Digits-only, last 10 (drops leading 1/61 country codes) — see log-ghl-submission.
 *  Exported so the single-record path (useLeadRecord) matches on the exact same
 *  key; two copies of a phone matcher would drift. */
export function normalizePhoneKey(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let digits = String(phone).replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length > 10 && (digits.startsWith('1') || digits.startsWith('61'))) {
    digits = digits.replace(/^(61|1)/, '');
  }
  const last10 = digits.slice(-10);
  return last10.length >= 7 ? last10 : null;
}

/**
 * Primary-choice score for a group of duplicate records: prefer a booked /
 * appointment record; then confirmed / rescheduled; then a real ghl_contact_id;
 * then a `ghl_submissions` row over a plain `leads` row. Callers break ties on
 * created_at desc. Exported so the list and the single-record path agree on who
 * the primary is.
 */
export function leadPrimaryScore(l: UnifiedLead): number {
  let s = 0;
  if (l.appointment_id) s += 100;
  const status = (l.status ?? '').toLowerCase();
  if (status === 'confirmed' || status === 'rescheduled') s += 50;
  if (l.ghl_contact_id) s += 20;
  // Small nudge so a `ghl_submissions` beats a plain `leads` row on ties.
  if (l.source === 'ghl_submissions') s += 5;
  return s;
}

/** Sort comparator: best primary first (score, then most recent). */
export function compareLeadPrimary(a: UnifiedLead, b: UnifiedLead): number {
  const d = leadPrimaryScore(b) - leadPrimaryScore(a);
  if (d !== 0) return d;
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

/**
 * Cross-source dedupe: leads that share a normalized email or phone are the
 * same person even when they live in different tables (leads +
 * ghl_submissions + meta_leads). Keep the booked/GHL-linked record as primary
 * so the person shows once (in their strongest context, e.g. Booked).
 */
function applyCrossSourceMerges(leads: UnifiedLead[]): UnifiedLead[] {
  // Group by normalized email or phone. A lead can index into multiple groups
  // (email + phone); union them via a simple parent map.
  const parent = new Map<number, number>();
  const find = (i: number): number => {
    let p = parent.get(i) ?? i;
    while (p !== (parent.get(p) ?? p)) p = parent.get(p) ?? p;
    parent.set(i, p);
    return p;
  };
  const union = (a: number, b: number) => {
    const pa = find(a);
    const pb = find(b);
    if (pa !== pb) parent.set(pa, pb);
  };
  const emailIdx = new Map<string, number>();
  const phoneIdx = new Map<string, number>();
  leads.forEach((l, i) => {
    parent.set(i, i);
    const email = (l.email ?? '').trim().toLowerCase();
    if (email) {
      const seen = emailIdx.get(email);
      if (seen !== undefined) union(seen, i);
      else emailIdx.set(email, i);
    }
    const phone = normalizePhoneKey(l.phone);
    if (phone) {
      const seen = phoneIdx.get(phone);
      if (seen !== undefined) union(seen, i);
      else phoneIdx.set(phone, i);
    }
  });

  const groups = new Map<number, number[]>();
  leads.forEach((_, i) => {
    const root = find(i);
    const arr = groups.get(root) ?? [];
    arr.push(i);
    groups.set(root, arr);
  });

  const kept: UnifiedLead[] = [];
  groups.forEach((idxs) => {
    if (idxs.length === 1) {
      kept.push(leads[idxs[0]]);
      return;
    }
    // Shared primary-choice rule (see compareLeadPrimary) so the record page
    // never disagrees with the list about who the primary is.
    const sorted = idxs.map((i) => leads[i]).sort(compareLeadPrimary);
    const primary = sorted[0];
    const extras = sorted.slice(1);
    // Preserve any existing _merged sub-records on the primary and add the
    // cross-source duplicates so the record page can still explain the merge.
    const mergedList = [
      ...(primary._merged ?? []),
      ...extras.map((d) => ({
        ...d,
        _mergeId: null,
        _matchedOn: 'email_or_phone',
        _matchReason: 'cross_source_person_match',
      })),
    ];
    kept.push({ ...primary, _merged: mergedList });
  });

  // Preserve original ordering by created_at desc.
  kept.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return kept;
}

/**
 * Fetch lead_annotations + lead_notes and attach them to each lead, matched by
 * source+id INCLUDING merged sub-records (so a note left on a duplicate still
 * shows on the surviving primary). Single source of truth for row, record page
 * and counts. Never dead-ends the inbox: on failure leads are returned as-is.
 */
export async function attachOverlay(leads: UnifiedLead[]): Promise<UnifiedLead[]> {
  let annotations: LeadAnnotation[] = [];
  let notes: LeadNote[] = [];
  try {
    const [aRows, nRows] = await Promise.all([
      fetchAllPaged('lead_annotations'),
      fetchAllPaged('lead_notes'),
    ]);
    annotations = aRows as LeadAnnotation[];
    notes = nRows as LeadNote[];
  } catch {
    return leads;
  }
  if (annotations.length === 0 && notes.length === 0) return leads;

  const annByKey = new Map<string, LeadAnnotation>();
  annotations.forEach((a) => annByKey.set(leadKey(a.lead_source, a.lead_id), a));
  const notesByKey = new Map<string, LeadNote[]>();
  notes.forEach((n) => {
    const k = leadKey(n.lead_source, n.lead_id);
    const arr = notesByKey.get(k) ?? [];
    arr.push(n);
    notesByKey.set(k, arr);
  });

  return leads.map((lead) => {
    // Keys for this lead: itself + any merged sub-records collapsed underneath.
    const keys = [leadKey(lead.source, lead.id), ...(lead._merged ?? []).map((m) => leadKey(m.source, m.id))];
    // A merged lead is ONE person, so pick the most recent annotation across
    // the whole group rather than whichever sub-record happens to be primary.
    // Taking the first match made the answer depend on merge ordering, so the
    // inbox row and the record page could show different owners for one person.
    let annotation: LeadAnnotation | null = null;
    for (const k of keys) {
      const a = annByKey.get(k);
      if (!a) continue;
      if (!annotation) { annotation = a; continue; }
      const at = new Date(a.updated_at ?? 0).getTime();
      const best = new Date(annotation.updated_at ?? 0).getTime();
      if (at > best) annotation = a;
    }
    const leadNotes = keys
      .flatMap((k) => notesByKey.get(k) ?? [])
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return { ...lead, annotation, notes: leadNotes, notesCount: leadNotes.length };
  });
}

interface MergeRow {
  id: string;
  primary_source: string;
  primary_id: string;
  merged_source: string;
  merged_id: string;
  matched_on: string | null;
  reason: string | null;
}

async function applyPersistentMerges(leads: UnifiedLead[]): Promise<UnifiedLead[]> {
  let merges: MergeRow[] = [];
  try {
    merges = (await fetchAllPaged('lead_merges')) as MergeRow[];
  } catch {
    // If the merge table can't be read, fall back to showing every record
    // rather than dead-ending the inbox.
    return leads;
  }
  if (merges.length === 0) return leads;

  const byKey = new Map<string, UnifiedLead>();
  leads.forEach((l) => byKey.set(leadKey(l.source, l.id), l));

  // Resolve the ultimate primary for a key, following merge chains safely.
  const primaryOf = new Map<string, MergeRow>();
  merges.forEach((m) => primaryOf.set(leadKey(m.merged_source, m.merged_id), m));

  const resolveRoot = (startKey: string): { key: string; last: MergeRow | null } => {
    let key = startKey;
    let last: MergeRow | null = null;
    const seen = new Set<string>();
    while (primaryOf.has(key) && !seen.has(key)) {
      seen.add(key);
      last = primaryOf.get(key)!;
      key = leadKey(last.primary_source, last.primary_id);
    }
    return { key, last };
  };

  const mergedAway = new Set<string>();
  merges.forEach((m) => {
    const dupeKey = leadKey(m.merged_source, m.merged_id);
    const dupe = byKey.get(dupeKey);
    if (!dupe) return;
    const { key: rootKey } = resolveRoot(dupeKey);
    const primary = byKey.get(rootKey);
    if (!primary || rootKey === dupeKey) return;
    mergedAway.add(dupeKey);
    const enrichedDupe: UnifiedLead = {
      ...dupe,
      _mergeId: m.id,
      _matchedOn: m.matched_on,
      _matchReason: m.reason,
    };
    primary._merged = [...(primary._merged ?? []), enrichedDupe];
  });

  return leads.filter((l) => !mergedAway.has(leadKey(l.source, l.id)));
}


export function useUnifiedLeads() {
  return useQuery({
    queryKey: ['unified-leads'],
    queryFn: fetchUnifiedLeads,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}
