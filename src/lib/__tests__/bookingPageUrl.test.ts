import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BOOKING_PAGE_URL } from '../bookingConfig';

/**
 * "Book a demo" now goes to one address: the booking page on the primary
 * domain. Two ways this quietly breaks, both already burned here:
 *
 * - The address is a string. `/try-alfred-live` on the mobile bar was a string
 *   that named nothing, and it opened the 404 page until somebody clicked it
 *   (`stickyMobileCtaRoutes.test.ts`, `adminSpotlightRoutes.test.ts`). An
 *   absolute URL is the same trap with a domain in front of it: if `/book` is
 *   ever renamed, `https://new.alfredai.bot/book` serves NotFound and nothing
 *   in a build complains. So the path is resolved against the real `<Route>`
 *   table, not against a second list that could drift.
 * - Copies drift. If a button pastes its own copy of the address, moving it
 *   later fixes some buttons and leaves the rest behind. The components name
 *   the constant instead, and nobody re-types the literal.
 */

const APP = resolve(__dirname, '../../App.tsx');
const SRC = resolve(__dirname, '../..');

const CONTROLS = [
  '../../pages/solutions/ConstructionEstimatingSoftware.tsx',
  '../../components/roi/TakeoffRoiCalculator.tsx',
  '../../components/demos/takeoff/AiTakeoffLiveDemo.tsx',
];

/** Every path the router can serve (see stickyMobileCtaRoutes.test.ts). */
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

function tsFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return entry === '__tests__' ? [] : tsFiles(full);
    return /\.(ts|tsx)$/.test(entry) ? [full] : [];
  });
}

describe('the booking destination', () => {
  it('is the booking page on the primary domain', () => {
    expect(BOOKING_PAGE_URL).toBe('https://new.alfredai.bot/book');
    const url = new URL(BOOKING_PAGE_URL);
    expect(url.origin).toBe('https://new.alfredai.bot');
    expect(url.pathname).toBe('/book');
  });

  it('names a route the router actually serves', () => {
    const { pathname } = new URL(BOOKING_PAGE_URL);
    expect(routePaths()).toContain(pathname);
  });

  it('is named by every Book a demo control, never copied', () => {
    for (const rel of CONTROLS) {
      const src = readFileSync(resolve(__dirname, rel), 'utf8');
      expect(src, rel).toContain('BOOKING_PAGE_URL');
      // A relative /book would stay on whatever host the page is opened from,
      // and the old modal handler would open the calendar in a dialog instead.
      expect(src, rel).not.toMatch(/to="\/book"|href="\/book"|openBooking/);
    }
  });

  it('every booking control points at the one booking page', () => {
    const holders = tsFiles(SRC).filter((f) => {
      const src = readFileSync(f, 'utf8');
      return src.includes('new.alfredai.bot/book') && !f.includes('__tests__');
    });
    expect(holders.length).toBeGreaterThan(1);
  });
});
