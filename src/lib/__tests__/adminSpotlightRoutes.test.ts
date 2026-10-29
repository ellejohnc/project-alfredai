import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SPOTLIGHT_PAGES } from '@/lib/adminSpotlightPages';
import { spotlightRecordPath } from '@/hooks/useSpotlightRecords';

/**
 * Spotlight sent people to the 404 page.
 *
 * `Users & Roles` pointed at `/admin/users`; the route is
 * `/admin/settings/users`. Documentation results pointed at
 * `/admin/documentation`; the route is `/admin/docs`. Nothing checked, because
 * a path is just a string — it typechecks, it builds, and it fails only when
 * somebody clicks it.
 *
 * So this reads the actual `<Route>` table out of `App.tsx` and fails if any
 * Spotlight destination cannot be matched by it. Reading the source is
 * deliberate: importing `App` would drag in the whole admin, and the point is
 * to check what the router really declares rather than a second list of it
 * that could drift the same way.
 */

const APP = resolve(__dirname, '../../App.tsx');

/**
 * Every path the router can serve.
 *
 * Absolute paths are taken as they are. Relative ones belong to the single
 * nested block — `<Route path="/admin" element={<AdminDashboard />}>` — so
 * they are prefixed with `/admin`. If a second nested block is ever added,
 * this assumption breaks loudly (its children resolve under the wrong parent
 * and the paths below stop matching) rather than quietly passing.
 */
function routePaths(): string[] {
  const src = readFileSync(APP, 'utf8');
  const out: string[] = [];
  for (const m of src.matchAll(/<Route\s+[^>]*path="([^"]+)"/g)) {
    const p = m[1];
    if (p === '*') continue;
    out.push(p.startsWith('/') ? p : `/admin/${p}`);
  }
  return out;
}

/** `leads/:id` matches `/admin/leads/abc`; `:param` is one non-empty segment. */
function toMatcher(routePath: string): RegExp {
  const body = routePath
    .split('/')
    .filter(Boolean)
    .map((seg) => (seg.startsWith(':') ? '[^/]+' : seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    .join('/');
  return new RegExp(`^/${body}/?$`);
}

describe('Spotlight destinations resolve to real routes', () => {
  const matchers = routePaths().map(toMatcher);
  const resolves = (path: string) => matchers.some((re) => re.test(path));

  it('reads the route table (guards against the regex silently matching nothing)', () => {
    expect(routePaths().length).toBeGreaterThan(40);
    expect(routePaths()).toContain('/admin/settings/users');
  });

  it.each(SPOTLIGHT_PAGES.map((p) => [p.title, p.path] as const))(
    'page %s → %s',
    (_title, path) => {
      expect(resolves(path), `${path} is not a route in App.tsx`).toBe(true);
    },
  );

  it.each(
    // Called with a sample id so the builders themselves are checked, not a
    // second copy of what they are supposed to return.
    Object.entries(spotlightRecordPath).map(([name, build]) => [name, build('sample-id')] as const),
  )('record %s → %s', (_name, path) => {
    expect(resolves(path), `${path} is not a route in App.tsx`).toBe(true);
  });

  it('has no duplicate page paths', () => {
    const paths = SPOTLIGHT_PAGES.map((p) => p.path);
    expect(new Set(paths).size).toBe(paths.length);
  });
});
