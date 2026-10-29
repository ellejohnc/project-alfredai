import { useQuery } from '@tanstack/react-query';
import { fetchAllRows } from '@/lib/supabasePaging';

/**
 * The GoHighLevel contact ids that have an actual booking against them.
 *
 * Meta Lead Ads needs "Booked from ads" — Every Leads Page 04 names it — but
 * meta_leads has no booking column: the booking lives in ghl_submissions, tied
 * back by contact id. So the set is fetched once and the page intersects it
 * with its own rows.
 *
 * Paged rather than limited. PostgREST caps a response at 1,000 rows and
 * ghl_submissions is larger than that, so a plain select would silently return
 * the first thousand and undercount the tile.
 */
export const BOOKED_CONTACT_IDS_QK = ['booked-ghl-contact-ids'] as const;

async function fetchBookedContactIds(): Promise<Set<string>> {
  const rows = await fetchAllRows<{ ghl_response: { ghl_contact_id?: string } | null }>(
    'ghl_submissions',
    (q) => q.is('archived_at', null).in('ghl_status', ['confirmed', 'rescheduled']),
    'ghl_response',
  );
  const ids = new Set<string>();
  for (const r of rows) {
    const id = r?.ghl_response?.ghl_contact_id;
    if (id) ids.add(String(id));
  }
  return ids;
}

export function useBookedFromAds() {
  const { data } = useQuery({
    queryKey: BOOKED_CONTACT_IDS_QK,
    queryFn: fetchBookedContactIds,
    staleTime: 60_000,
  });
  return data ?? new Set<string>();
}
