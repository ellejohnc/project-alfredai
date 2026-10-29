import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { isChatAvailable } from '@/lib/chatRoutes';

/**
 * The chat button and the chat itself must agree about where the chat exists.
 *
 * Header.tsx grew a hand-copied list of the routes App.tsx uses to decide
 * whether to mount ChatAssistant. They matched on the day it was written. The
 * failure mode if they ever stop matching is silent and points the wrong way:
 * the button renders, openAssistant() sets the state, nothing is mounted to
 * read it, and clicking does nothing at all.
 *
 * So both call one predicate, and this proves it — including that neither file
 * has quietly grown its own copy back, which is the thing a type checker cannot
 * see.
 */

const read = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf8');

describe('where the chat assistant is available', () => {
  const EXCLUDED = [
    '/admin',
    '/admin/leads',
    '/investors',
    '/explained/pricing/diy-quote',
    '/demos/anything',
    '/proposal/abc123',
    '/book',
    '/resources/webinars/agenticbusiness',
    '/partners/portal',
    '/partners/portal/certification',
  ];

  const INCLUDED = [
    '/',
    '/resources',
    '/resources/webinars',
    '/explained/pricing',
    '/contact',
    '/careers',
    '/partners',
  ];

  it.each(EXCLUDED)('is absent on %s', (path) => {
    expect(isChatAvailable(path)).toBe(false);
  });

  it.each(INCLUDED)('is present on %s', (path) => {
    expect(isChatAvailable(path)).toBe(true);
  });

  it('is not fooled by a prefix that only looks like an excluded route', () => {
    // /bookings is not /book, and /administrators is not /admin.
    expect(isChatAvailable('/bookings')).toBe(true);
    expect(isChatAvailable('/investors-report')).toBe(true);
  });

  it('the two launchers split at one breakpoint and never both show', () => {
    const chat = read('src/components/chat/ChatAssistant.tsx');
    const header = read('src/components/layout/Header.tsx');

    // There are two ways into the chat: a floating bubble and a header button.
    // Keeping both is a choice. Showing both at once is not — and for three
    // hours every tablet did, because the bubble hid below 768px (useIsMobile)
    // while the header button renders below 1280px (xl:hidden). Nothing failed;
    // it just looked wrong to anyone on a tablet.
    //
    // The split is xl, stated in CSS in one file and matched in the other.
    expect(chat).toContain('hidden xl:flex');
    expect(header).toContain('xl:hidden');

    // And the bubble must not re-acquire a JS breakpoint of its own. A second
    // opinion about where "mobile" starts is the whole bug.
    const gate = chat.match(/const showButton = .*/)?.[0] ?? '';
    expect(gate).toBe('const showButton = !isOpen;');
  });

  it('both App and Header call the predicate rather than keeping their own list', () => {
    const app = read('src/App.tsx');
    const header = read('src/components/layout/Header.tsx');

    expect(app).toContain('isChatAvailable(location.pathname)');
    expect(header).toContain('isChatAvailable(location.pathname)');

    // The old hand-rolled shape: a chain of pathname comparisons deciding chat
    // visibility. If this comes back, the two lists can drift again.
    expect(header).not.toContain("location.pathname !== \"/investors\"");
    expect(app).not.toContain('!isPartnerPortalRoute && (');
  });
});
