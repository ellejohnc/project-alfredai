import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The hero's primary CTA is a path written straight into JSX, so nothing
 * checked where it pointed — the same shape of bug that sent Spotlight's
 * `Users & Roles` row to the 404 page. It typechecked, it built, and it only
 * failed when somebody clicked it.
 *
 * So the hero destinations are resolved against the real `<Route>` table in
 * `App.tsx`, the way `adminSpotlightRoutes.test.ts` does for the admin. The
 * primary CTA is also pinned to the AI Take-Off page: if it is ever moved,
 * this names the page it is meant to open rather than letting the link drift.
 */

const APP = resolve(__dirname, '../../App.tsx');
const HERO = resolve(__dirname, '../../components/sections/HeroSection.tsx');

/** Absolute paths as written; relative ones belong to the `/admin` block. */
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

const heroSrc = readFileSync(HERO, 'utf8');

/** Literal `<Link to="...">` destinations. Dynamic `to={...}` is not matched. */
function heroLinks(): string[] {
  return [...heroSrc.matchAll(/<Link\s+to="([^"]+)"/g)].map((m) => m[1]);
}

/** The destination of the link carrying a given `data-cta-id`. */
function linkForCta(ctaId: string): string {
  const m = heroSrc.match(
    new RegExp(`<Link\\s+to="([^"]+)"[^>]*data-cta-id="${ctaId}"`),
  );
  if (!m) throw new Error(`No <Link to="..."> carries data-cta-id="${ctaId}"`);
  return m[1];
}

describe('hero CTA destinations resolve to real routes', () => {
  const matchers = routePaths().map(toMatcher);
  const resolves = (path: string) => matchers.some((re) => re.test(path));

  it('reads the route table (guards against the regex silently matching nothing)', () => {
    expect(routePaths().length).toBeGreaterThan(40);
    expect(routePaths()).toContain('/admin/settings/users');
  });

  it('finds literal hero links (guards against the regex matching nothing)', () => {
    expect(heroLinks().length).toBeGreaterThan(0);
  });

  it('every literal hero link is a route the router can serve', () => {
    for (const path of heroLinks()) {
      expect(resolves(path), `${path} is not a route in App.tsx`).toBe(true);
    }
  });

  it('the primary CTA opens the AI Take-Off page', () => {
    const primary = linkForCta('hero_try_demo');
    expect(primary).toBe('/solutions/ai-takeoff');
    expect(resolves(primary), `${primary} is not a route in App.tsx`).toBe(true);
  });
});
