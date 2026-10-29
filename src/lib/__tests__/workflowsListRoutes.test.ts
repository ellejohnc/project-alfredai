import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BOOKING_PAGE_URL } from '../bookingConfig';

/**
 * The workflows list on /products/use-cases is a plain array of destination
 * strings, so nothing checks where a card's button actually goes until someone
 * clicks it — the same shape as the Spotlight bug in
 * `adminSpotlightRoutes.test.ts` and the mobile bar bug in
 * `stickyMobileCtaRoutes.test.ts`.
 *
 * This reads the real `WORKFLOWS` array out of the page source and resolves
 * every `href` against the actual `<Route>` table in `App.tsx`, so a card
 * pointing at a page that was never built fails here rather than opening the
 * 404 page.
 */

const PAGE = resolve(__dirname, '../../data/workflows.ts');
const APP = resolve(__dirname, '../../App.tsx');

/** Identifiers a card may use instead of a literal path. */
const CONSTANTS: Record<string, string> = { BOOKING_PAGE_URL };

/** Every destination the workflow cards can send someone to. */
function workflowHrefs(): string[] {
  const src = readFileSync(PAGE, 'utf8');
  return [...src.matchAll(/href:\s*(?:"([^"]+)"|([A-Za-z_][A-Za-z0-9_]*))/g)].map(
    (m) => m[1] ?? CONSTANTS[m[2]] ?? m[2],
  );
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

describe('workflows list destinations resolve to real routes', () => {
  const matchers = routePaths().map(toMatcher);
  const resolves = (path: string) => {
    const p = /^https?:/.test(path) ? new URL(path).pathname : path;
    return matchers.some((re) => re.test(p));
  };

  it('reads the route table (guards against the regex silently matching nothing)', () => {
    expect(routePaths().length).toBeGreaterThan(40);
  });

  it('reads the cards (guards against the extraction silently matching nothing)', () => {
    expect(workflowHrefs().length).toBe(6);
  });

  it('every destination is a page the router can actually serve', () => {
    for (const path of workflowHrefs()) {
      expect(resolves(path), `${path} is not a route — the card would open the 404 page`).toBe(true);
    }
  });

  it('Email Pre-send Intelligence is on the list and opens its own page', () => {
    const src = readFileSync(PAGE, 'utf8');
    expect(src).toContain('Email Pre-send Intelligence');
    expect(workflowHrefs()).toContain('/solutions/email-presend-intelligence');
  });
});
