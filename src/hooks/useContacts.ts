import { useMemo } from 'react';
import { useUnifiedLeads } from '@/hooks/useUnifiedLeads';
import { LEAD_SOURCE_META, type LeadSource, type UnifiedLead } from '@/lib/unifiedLead';

/**
 * Contacts — sample S5/S6. One row per PERSON, not per lead.
 *
 * This needed almost no new machinery, which is the point: the Inbox already
 * runs applyCrossSourceMerges, which unions leads by normalised email and
 * phone and hangs the duplicates off the primary as `_merged`. That group IS
 * the person. Contacts is the same data asked a different question — "who is
 * this?" rather than "what came in?" — so it reads the same cached query
 * instead of fetching its own copy, and a merge fixed in one place is fixed in
 * both.
 */

export interface ContactRecordRef {
  source: LeadSource;
  sourceLabel: string;
  id: string;
  createdAt: string | null;
  status: string | null;
}

export interface Contact {
  /** Stable id for routing: the primary lead's source + id. */
  key: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  ownerId: string | null;
  ghlContactId: string | null;
  /** The lead this person is anchored on — the most recent record. */
  primary: UnifiedLead;
  /** Every record we hold for them, newest first. */
  records: ContactRecordRef[];
  /** Record count per source, for the roll-up chips on the row. */
  countsBySource: Partial<Record<LeadSource, number>>;
  firstSeen: string | null;
  lastSeen: string | null;
}

const time = (v: string | null | undefined) => {
  const t = v ? new Date(v).getTime() : NaN;
  return Number.isFinite(t) ? t : 0;
};

export function buildContacts(leads: UnifiedLead[]): Contact[] {
  return leads
    .map((primary) => {
      const group = [primary, ...(primary._merged ?? [])];
      const records: ContactRecordRef[] = group
        .map((l) => ({
          source: l.source,
          sourceLabel: LEAD_SOURCE_META[l.source]?.label ?? String(l.source),
          id: l.id,
          createdAt: l.created_at ?? null,
          status: l.status ?? null,
        }))
        .sort((a, b) => time(b.createdAt) - time(a.createdAt));

      const countsBySource: Partial<Record<LeadSource, number>> = {};
      for (const r of records) countsBySource[r.source] = (countsBySource[r.source] ?? 0) + 1;

      // Prefer the first non-empty value across the group: a booking may carry
      // a company the original form never asked for, and vice versa.
      const pick = (fn: (l: UnifiedLead) => string | null | undefined) =>
        group.map(fn).find((v) => v != null && String(v).trim() !== '') ?? null;

      const times = records.map((r) => time(r.createdAt)).filter(Boolean);

      return {
        key: `${primary.source}:${primary.id}`,
        name: pick((l) => l.name) || pick((l) => l.email) || 'Unknown',
        email: pick((l) => l.email),
        phone: pick((l) => l.phone),
        company: pick((l) => l.company),
        ownerId: primary.annotation?.owner_id ?? null,
        ghlContactId: pick((l) => l.ghl_contact_id),
        primary,
        records,
        countsBySource,
        firstSeen: times.length ? new Date(Math.min(...times)).toISOString() : null,
        lastSeen: times.length ? new Date(Math.max(...times)).toISOString() : null,
      } satisfies Contact;
    })
    .sort((a, b) => time(b.lastSeen) - time(a.lastSeen));
}

export function useContacts() {
  const { data, isLoading, error, refetch, isFetching } = useUnifiedLeads();
  const contacts = useMemo(() => buildContacts(data?.leads ?? []), [data?.leads]);
  return { contacts, isLoading, error, refetch, isFetching };
}

export function useContact(key: string | undefined) {
  const { contacts, isLoading, error } = useContacts();
  const contact = useMemo(
    () => (key ? (contacts.find((c) => c.key === key) ?? null) : null),
    [contacts, key],
  );
  return { contact, isLoading, error };
}
