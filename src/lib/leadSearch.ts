/**
 * ONE search matcher for every lead surface.
 *
 * Every field is read defensively, so a null/undefined value can never throw
 * inside a filter callback — that bug used to break an entire lead list while
 * the user was typing. Phone matching ignores formatting, so "0412 345 678",
 * "+61412345678" and "0412345678" all match the same query.
 */

/** Normalise any value to a lowercase string, safely. */
const asText = (v: unknown): string =>
  v === null || v === undefined ? '' : String(v).toLowerCase();

const digitsOf = (v: unknown): string => String(v ?? '').replace(/\D/g, '');

export interface LeadSearchFields {
  /** Plain text fields to match against (name, email, company, source…). */
  text?: unknown[];
  /** Phone-ish fields — matched as text AND by digits-only. */
  phones?: unknown[];
}

/**
 * True when the record matches the query. An empty query matches everything,
 * so callers can pass the raw input value straight through.
 */
export function matchesLeadSearch(query: string, fields: LeadSearchFields): boolean {
  const q = (query ?? '').trim().toLowerCase();
  if (!q) return true;

  for (const v of fields.text ?? []) {
    if (asText(v).includes(q)) return true;
  }

  const qDigits = q.replace(/\D/g, '');
  for (const v of fields.phones ?? []) {
    if (asText(v).includes(q)) return true;
    if (qDigits.length >= 3 && digitsOf(v).includes(qDigits)) return true;
  }

  return false;
}

/**
 * Build a filter's option list straight from the rows on screen, so a page can
 * never offer an option that matches nothing (and never omits one that exists).
 */
export function optionsFromData<T>(
  rows: T[],
  pick: (row: T) => string | null | undefined,
  label?: (value: string) => string,
): { value: string; label: string }[] {
  const seen = new Set<string>();
  for (const row of rows) {
    const v = pick(row);
    if (v !== null && v !== undefined && String(v).trim() !== '') seen.add(String(v));
  }
  return Array.from(seen)
    .sort()
    .map((v) => ({ value: v, label: label ? label(v) : v }));
}
