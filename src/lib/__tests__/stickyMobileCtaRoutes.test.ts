import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The mobile sticky bar sent people to the 404 page.
 *
 * Its primary button did `window.location.href = "/try-alfred-live"` — an
 * address that has never been a route. `/try-alfred-live` is an *anchor id* on
 * the homepage (`TryAlfredLiveSection`), not a page, so the router fell through
 * to `<Route path="*" />` and opened NotFound on the one control phone visitors
 * see most. The `go()` helper's own fallback never fires for this: assigning
 * `location.href` does not throw, so a dead path still looks like success.
 *
 * Same shape as the Spotlight bug in `adminSpotlightRoutes.test.ts` — a
 * destination is just a string, so nothing checks it until somebody clicks.
 * This reads the bar's real destinations and resolves each against the actual
 * `<Route>` table in `App.tsx`, rather than a second list that could drift.
 */

const CTA = resolve(__dirname, '../../components/mobile/StickyMobileCTA.tsx');
const APP = resolve(__dirname, '../../App.tsx');

/** Every path the bar can send someone to. */
function ctaDestinations(): string[] {
  const src = readFileSync(CTA, 'utf8');
  return [...src.matchAll(/go\("([^"]+)"/g)].map((m) => m[1]);
}

/**
 * Every path the router can serve. Absolute paths are taken as they are;
 * relative ones belong to the single nested `/admin` block, so a second nested
 * block would make these resolve under the wrong parent and fail loudly here.
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

/** `:param` matches one non-empty segment, so `/demos/:demoId` serves `/demos/x`. */
function toMatcher(routePath: string): RegExp {
  const body = routePath
    .split('/')
    .filter(Boolean)
    .map((seg) => (seg.startsWith(':') ? '[^/]+' : seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    .join('/');
  return new RegExp(`^/${body}/?$`);
}

describe('mobile sticky CTA destinations resolve to real routes', () => {
  const matchers = routePaths().map(toMatcher);
  const resolves = (path: string) => { const p = /^https?:/.test(path) ? new URL(path).pathname : path; return matchers.some((re) => re.test(p)); };

  it('reads the route table (guards against the regex silently matching nothing)', () => {
    expect(routePaths().length).toBeGreaterThan(40);
  });

  it('reads the bar (guards against the extraction silently matching nothing)', () => {
    expect(ctaDestinations().length).toBe(2);
  });

  it('every destination is a page the router can actually serve', () => {
    for (const path of ctaDestinations()) {
      expect(resolves(path), `${path} is not a route — the bar would open the 404 page`).toBe(true);
    }
  });

  it('the take-off button points at the AI Take-Off page', () => {
    expect(ctaDestinations()).toContain('/solutions/ai-takeoff');
  });
});
