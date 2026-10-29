type Entry = { data: unknown; ts: number };
const cache = new Map<string, Entry>();
const TTL = 5 * 60 * 1000; // 5 minutes

/** Fresh cached value (null if missing or stale) — use to decide whether to show a spinner. */
export function getLeadsCache<T>(key: string): T | null {
  const e = cache.get(key);
  if (!e) return null;
  if (Date.now() - e.ts > TTL) return null;
  return e.data as T;
}
/** Any cached value regardless of age — use to hydrate initial state instantly. */
export function peekLeadsCache<T>(key: string): T | null {
  const e = cache.get(key);
  return e ? (e.data as T) : null;
}
export function setLeadsCache(key: string, data: unknown) {
  cache.set(key, { data, ts: Date.now() });
}
