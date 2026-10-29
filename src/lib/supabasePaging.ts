import { supabase } from '@/integrations/supabase/client';

/**
 * Read every row, and count rows exactly.
 *
 * PostgREST caps a response at 1000 rows. A `.limit(1000)` therefore does not
 * mean "all of them" — it means "the first thousand, silently", and a page
 * built on it reports a number that is correct right up until the day it
 * quietly is not. ghl_submissions is at 876.
 *
 * These were already written inside useUnifiedLeads for exactly this reason.
 * Lifting them here so every admin surface can use the same two, rather than
 * each one rediscovering the cap the hard way.
 */

/**
 * PostgREST's filter-builder type is generic over the table and is not exported
 * in a form we can name for an arbitrary table string. This alias is the ONE
 * place that is admitted, so callers can take a typed filter argument instead
 * of each writing their own `any`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PostgrestQuery = any;

const fromTable = (table: string) => (supabase as unknown as { from: (t: string) => PostgrestQuery }).from(table);

const PAGE_SIZE = 1000;

const identity = (q: PostgrestQuery) => q;

/** Every row matching the filters, paged past the 1000-row cap. */
export async function fetchAllRows<T = Record<string, unknown>>(
  table: string,
  applyFilters: (query: PostgrestQuery) => PostgrestQuery = identity,
  columns = '*',
  orderBy = 'created_at',
): Promise<T[]> {
  const rows: T[] = [];
  let from = 0;

  for (;;) {
    const { data, error } = await applyFilters(
      fromTable(table).select(columns).order(orderBy, { ascending: false }).range(from, from + PAGE_SIZE - 1),
    );
    if (error) throw error;
    const page = (data ?? []) as T[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
}

/**
 * An exact count from the server — no rows transferred.
 *
 * Prefer this over `rows.length` whenever the number is shown as a total, so a
 * tile cannot disagree with the table beneath it.
 */
export async function fetchExactCount(
  table: string,
  applyFilters: (query: PostgrestQuery) => PostgrestQuery = identity,
): Promise<number> {
  const { count, error } = await applyFilters(
    fromTable(table).select('*', { count: 'exact', head: true }),
  );
  if (error) throw error;
  return count ?? 0;
}
