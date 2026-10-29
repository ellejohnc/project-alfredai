import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { normalizePhoneKey, compareLeadPrimary, applySiteLeadFilters } from './useUnifiedLeads';

/**
 * Single-record read model for the lead record page.
 *
 * The record page used to call `useUnifiedLeads()`, which fetches ALL six
 * sources (~6.7k rows / ~1.6 MB) plus lead_merges / lead_annotations /
 * lead_notes and runs the whole cross-source dedupe in the browser — just to
 * locate the one id in the URL. This hook resolves that id directly with a
 * handful of tiny indexed lookups and returns the SAME shape
 * (`UnifiedLead` with `_merged`, `annotation`, `notes`, `notesCount`), so
 * `LeadDetailPage` and everything below it keep working unchanged.
 *
 * Field mapping and the primary-choice rule are imported from the list path
 * rather than reimplemented, so the two can't drift.
 */

const fromTable = (table: string) => (supabase as any).from(table);

interface SourceSpec {
  source: LeadSource;
  table: string;
  /** Columns to select for the single-record / duplicate lookups. */
  columns: string;
  /** Column holding the e-mail on this table. */
  emailCol: string;
  /** Column holding the phone on this table. */
  phoneCol: string;
  normalize: (row: Record<string, unknown>) => UnifiedLead;
  /**
   * Same visibility rule the Inbox applies to this source. Reused (not
   * re-written) from `useUnifiedLeads` so the two can never drift — notably
   * `leads` rows that are shadows of a `ghl_submissions` booking
   * (lead_source = calendar_widget / source_medium = ghl_direct_booking) are
   * excluded here exactly as they are in the list.
   */
  applyFilters?: (query: any) => any;
}

// `alpha_digital_leads` selects `*` on purpose: the record page needs the full
// `raw_data` for the LinkedIn card, and this is a handful of rows — the reason
// the LIST query slims that blob (statement timeouts across 3k rows) does not
// apply to a single record.
const SOURCES: SourceSpec[] = [
  {
    source: 'ghl_submissions',
    table: 'ghl_submissions',
    columns: '*',
    emailCol: 'lead_email',
    phoneCol: 'lead_phone',
    normalize: normalizeGhlSubmission,
  },
  {
    source: 'leads',
    table: 'leads',
    columns: '*',
    emailCol: 'email',
    phoneCol: 'phone',
    normalize: normalizeLead,
    applyFilters: applySiteLeadFilters,
  },
  {
    source: 'meta_leads',
    table: 'meta_leads',
    columns: '*',
    emailCol: 'email',
    phoneCol: 'phone',
    normalize: normalizeMetaLead,
  },
  {
    source: 'investor_leads',
    table: 'investor_leads',
    columns: '*',
    emailCol: 'email',
    phoneCol: 'phone_number',
    normalize: normalizeInvestorLead,
  },
  {
    source: 'alpha_digital_leads',
    table: 'alpha_digital_leads',
    columns: '*',
    emailCol: 'email',
    phoneCol: 'phone',
    normalize: normalizeAlphaDigitalLead,
  },
  {
    source: 'webinar_registrations',
    table: 'webinar_registrations',
    columns: '*',
    emailCol: 'email',
    phoneCol: 'phone',
    normalize: normalizeWebinarRegistration,
  },
];

const SOURCE_BY_NAME = new Map(SOURCES.map((s) => [s.source as string, s]));

interface MergeRow {
  id: string;
  primary_source: string;
  primary_id: string;
  merged_source: string;
  merged_id: string;
  matched_on: string | null;
  reason: string | null;
}

/** Fetch one row from one source table by primary key. */
async function fetchById(
  spec: SourceSpec,
  id: string,
  /** Set false to read a row the Inbox hides (shadow-row URL resolution). */
  respectVisibility = true,
): Promise<UnifiedLead | null> {
  let q = fromTable(spec.table).select(spec.columns).eq('id', id);
  if (respectVisibility && spec.applyFilters) q = spec.applyFilters(q);
  const { data, error } = await q.maybeSingle();
  // Never dead-end the page because one source is unreadable.
  if (error || !data) return null;
  return spec.normalize(data as Record<string, unknown>);
}

/** Escape a value for use inside a PostgREST `.or()` filter list. */
const orValue = (v: string) => `"${v.replace(/"/g, '')}"`;

/**
 * Candidate phone filters. Phones are stored in mixed formats, so we probe the
 * raw value plus the digit-only tail; every candidate is re-verified in JS with
 * the shared `normalizePhoneKey` before it is accepted as the same person.
 */
function phonePatterns(phone: string | null | undefined): string[] {
  if (!phone) return [];
  const key = normalizePhoneKey(phone);
  const out = new Set<string>([phone.trim()]);
  if (key) {
    out.add(key);
    out.add(`0${key.slice(-9)}`);
    out.add(`%${key.slice(-9)}`);
    out.add(`%${key}`);
  }
  return [...out].filter(Boolean);
}

/** Rows in one source matching this person's email or phone. */
async function fetchDuplicates(
  spec: SourceSpec,
  email: string | null,
  phone: string | null,
): Promise<UnifiedLead[]> {
  const clauses: string[] = [];
  if (email) clauses.push(`${spec.emailCol}.ilike.${orValue(email)}`);
  phonePatterns(phone).forEach((p) => clauses.push(`${spec.phoneCol}.ilike.${orValue(p)}`));
  if (clauses.length === 0) return [];

  let q = fromTable(spec.table).select(spec.columns).or(clauses.join(','));
  if (spec.applyFilters) q = spec.applyFilters(q);
  const { data, error } = await q.limit(50);
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(spec.normalize);
}

/** Same person? Shared email (case-insensitive) or shared normalized phone. */
function sameParty(a: UnifiedLead, b: UnifiedLead): boolean {
  const ae = (a.email ?? '').trim().toLowerCase();
  const be = (b.email ?? '').trim().toLowerCase();
  if (ae && be && ae === be) return true;
  const ap = normalizePhoneKey(a.phone);
  const bp = normalizePhoneKey(b.phone);
  return !!ap && !!bp && ap === bp;
}

async function fetchMergesFor(keys: string[]): Promise<MergeRow[]> {
  if (keys.length === 0) return [];
  const ids = [...new Set(keys.map((k) => k.split(':').slice(1).join(':')))];
  const { data, error } = await fromTable('lead_merges')
    .select('*')
    .or(`primary_id.in.(${ids.join(',')}),merged_id.in.(${ids.join(',')})`);
  if (error || !data) return [];
  return data as MergeRow[];
}

export async function fetchLeadRecord(id: string): Promise<UnifiedLead | null> {
  // 1 — locate the record. Six tiny primary-key lookups in parallel.
  const hits = await Promise.all(SOURCES.map((s) => fetchById(s, id)));
  let self = hits.find(Boolean) ?? null;

  // A hidden shadow row must still open when its id is in the URL. Re-read it
  // ignoring the visibility filter, then hand over to its `ghl_submissions`
  // twin (same email/phone) so the user lands on the real booking record. If
  // no twin exists we show the shadow row itself rather than 404.
  if (!self) {
    for (const spec of SOURCES.filter((s) => s.applyFilters)) {
      const hidden = await fetchById(spec, id, false);
      if (!hidden) continue;
      const twins = await fetchDuplicates(
        SOURCE_BY_NAME.get('ghl_submissions')!,
        (hidden.email ?? '').trim() || null,
        hidden.phone ?? null,
      );
      const twin = twins.find((t) => sameParty(hidden, t));
      self = twin ?? hidden;
      break;
    }
  }

  // A merged-away record must still open: resolve its primary from lead_merges.
  if (!self) {
    const { data: mergeRows } = await fromTable('lead_merges')
      .select('*')
      .eq('merged_id', id)
      .limit(1);
    const m = (mergeRows as MergeRow[] | null)?.[0];
    if (m) {
      const spec = SOURCE_BY_NAME.get(m.primary_source);
      if (spec) self = await fetchById(spec, m.primary_id);
    }
  }
  if (!self) return null;

  // 2 — targeted duplicate lookup across every source (email OR phone).
  const email = (self.email ?? '').trim() || null;
  const phone = self.phone ?? null;
  const dupeLists = await Promise.all(SOURCES.map((s) => fetchDuplicates(s, email, phone)));

  const byKey = new Map<string, UnifiedLead>();
  byKey.set(leadKey(self.source, self.id), self);
  dupeLists.flat().forEach((cand) => {
    const k = leadKey(cand.source, cand.id);
    if (byKey.has(k)) return;
    if (!sameParty(self as UnifiedLead, cand)) return;
    byKey.set(k, cand);
  });

  // 3 — respect persisted merges pointing at anything in this group.
  const merges = await fetchMergesFor([...byKey.keys()]);
  const mergeMetaByKey = new Map<string, MergeRow>();
  for (const m of merges) {
    mergeMetaByKey.set(leadKey(m.merged_source, m.merged_id), m);
    for (const side of [
      { source: m.primary_source, id: m.primary_id },
      { source: m.merged_source, id: m.merged_id },
    ]) {
      const k = leadKey(side.source, side.id);
      if (byKey.has(k)) continue;
      const spec = SOURCE_BY_NAME.get(side.source);
      if (!spec) continue;
      const row = await fetchById(spec, side.id);
      if (row) byKey.set(k, row);
    }
  }

  // 4 — pick the primary with the SAME rule the list uses.
  const group = [...byKey.values()].sort(compareLeadPrimary);
  const primary = group[0];
  const extras = group.slice(1).map((d) => {
    const meta = mergeMetaByKey.get(leadKey(d.source, d.id));
    return {
      ...d,
      _mergeId: meta?.id ?? null,
      _matchedOn: meta?.matched_on ?? 'email_or_phone',
      _matchReason: meta?.reason ?? 'cross_source_person_match',
    } as UnifiedLead;
  });

  // 5 — overlay (owner / stage / outcome + notes) for THIS group only.
  const keys = group.map((g) => leadKey(g.source, g.id));
  const sources = [...new Set(group.map((g) => g.source))];
  const ids = [...new Set(group.map((g) => g.id))];

  let annotation: LeadAnnotation | null = null;
  let notes: LeadNote[] = [];
  try {
    const [aRes, nRes] = await Promise.all([
      fromTable('lead_annotations')
        .select('*')
        .in('lead_source', sources)
        .in('lead_id', ids),
      fromTable('lead_notes')
        .select('*')
        .in('lead_source', sources)
        .in('lead_id', ids),
    ]);
    const keySet = new Set(keys);
    const anns = ((aRes.data ?? []) as LeadAnnotation[]).filter((a) =>
      keySet.has(leadKey(a.lead_source, a.lead_id)),
    );
    // A merged lead is ONE person: take the most recently updated annotation
    // across the group, exactly as the inbox now does.
    for (const a of anns) {
      if (!annotation) {
        annotation = a;
        continue;
      }
      if (new Date(a.updated_at ?? 0).getTime() > new Date(annotation.updated_at ?? 0).getTime()) {
        annotation = a;
      }
    }
    notes = ((nRes.data ?? []) as LeadNote[])
      .filter((n) => keySet.has(leadKey(n.lead_source, n.lead_id)))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch {
    // Overlay is additive — never dead-end the record page over it.
  }

  return {
    ...primary,
    _merged: extras,
    annotation,
    notes,
    notesCount: notes.length,
  };
}

/** Resolve a single lead (plus its duplicates and CRM overlay) by id. */
export function useLeadRecord(id: string | undefined) {
  const qc = useQueryClient();

  // Paint immediately when we already know this lead.
  //
  // Opening a record from the Inbox showed a full-page skeleton while six
  // lookups, a merge query and the overlay came back — for a lead whose name,
  // email, company and status were already on screen a moment earlier. The
  // Inbox's cached list has all of that, so the page can render the person at
  // once and fill in duplicates and CRM detail when they arrive.
  //
  // placeholderData, NOT initialData: this is a strictly poorer copy — no
  // duplicates, no merge resolution — so it must never be written into the
  // cache or treated as fresh. The real fetch still runs every time.
  const placeholder = (() => {
    if (!id) return undefined;
    const cached = qc.getQueryData<{ leads?: UnifiedLead[] }>(['unified-leads']);
    return cached?.leads?.find((l) => l.id === id);
  })();

  return useQuery({
    queryKey: ['lead-record', id],
    queryFn: () => fetchLeadRecord(id as string),
    enabled: !!id,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: placeholder,
  });
}
