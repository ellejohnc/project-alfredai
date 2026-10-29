import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The Standard's first rule about a list page is the one easiest to break by
 * hand: FIVE BANDS, NEVER REORDERED — title · tiles · toolbar · table · empty
 * state.
 *
 * The ten lead pages have carried all five since Stage C. The seven content
 * pages carried four: they have a header, a filter bar, a table and an empty
 * state, and no tiles at all. That is what the Phase 3 reskin is closing.
 *
 * This guard exists because band ORDER is invisible to a type checker and to
 * every test that renders a page and asserts on its contents — a tiles band
 * dropped below the filter bar still renders, still works, and still reads
 * wrong. The only thing that catches it is the source order itself.
 *
 * As each content page moves onto the kit, add it to RESKINNED. A page that is
 * not listed is not yet claimed to be done, so this file also doubles as the
 * honest count of how far the reskin has actually got — which is the number
 * that went wrong twice in Stage C, when pages were recorded as done on the
 * strength of their rows alone.
 */

const read = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf8');

/** Content pages carrying all five bands, in the order they landed. */
const RESKINNED = [
  'src/pages/admin/content/BlogAdmin.tsx',
  'src/pages/admin/content/GuidesAdmin.tsx',
  'src/pages/admin/content/WebinarsAdmin.tsx',
  'src/pages/admin/content/TestimonialsAdmin.tsx',
];

/**
 * Pages that are DONE and deliberately have no tiles band — not pages still
 * waiting for one. The difference matters, because "four bands" read as
 * unfinished is exactly how Stage C miscounted itself twice.
 *
 * The Standard's stronger rule wins here: a tile is a filter, and one that
 * selects the whole list is decoration. Each of these was measured before the
 * decision, not assumed.
 */
const NO_TILES_BY_DESIGN: Record<string, string> = {
  'src/pages/admin/content/DocsAdmin.tsx':
    'Six rows across four categories, nothing varies — every possible tile reads all six or one.',
  'src/pages/admin/content/FAQsAdmin.tsx':
    'Fifteen rows in five categories of exactly three each, all published, none edited since 30 Dec (re-checked 25 Oct). Every tile would read 15 or 3, so it carries the title band and the toolbar on its list tab, and no tiles.',
  'src/pages/admin/content/JobsAdmin.tsx':
    'The table is empty. Every tile would read zero; the empty state is the band that carries the message.',
};

/** Every content page, so the guard can report what is left rather than guess. */
const ALL_CONTENT_PAGES = [
  'src/pages/admin/content/BlogAdmin.tsx',
  'src/pages/admin/content/GuidesAdmin.tsx',
  'src/pages/admin/content/WebinarsAdmin.tsx',
  'src/pages/admin/content/DocsAdmin.tsx',
  'src/pages/admin/content/FAQsAdmin.tsx',
  'src/pages/admin/content/TestimonialsAdmin.tsx',
  'src/pages/admin/content/JobsAdmin.tsx',
];

describe('content pages follow the Standard band order', () => {
  it.each(RESKINNED)('%s puts tiles between the title and the toolbar', (page) => {
    const src = read(page);

    const header = src.indexOf('<AdminPageHeader');
    const tiles = src.indexOf('<AdminMetricsStrip');
    const toolbar = src.indexOf('<AdminContentFilters');
    const table = src.indexOf('<ContentTable');

    expect(header, 'no title band').toBeGreaterThan(-1);
    expect(tiles, 'no tiles band — that is the band the reskin adds').toBeGreaterThan(-1);
    expect(toolbar, 'no toolbar band').toBeGreaterThan(-1);
    expect(table, 'no table band').toBeGreaterThan(-1);

    expect(tiles).toBeGreaterThan(header);
    expect(toolbar).toBeGreaterThan(tiles);
    expect(table).toBeGreaterThan(toolbar);
  });

  it.each(RESKINNED)('%s tiles are filters, not statistics', (page) => {
    const src = read(page);

    // "A tile is a filter, not a statistic. If clicking it does nothing, it
    // does not belong." Every metric in the strip must carry an onClick.
    const block = src.slice(src.indexOf('const metrics'), src.indexOf('const byTile'));
    expect(block.length, 'could not find the metrics block').toBeGreaterThan(0);

    const labels = block.match(/label:/g)?.length ?? 0;
    const clicks = block.match(/onClick:/g)?.length ?? 0;
    expect(labels).toBeGreaterThan(0);
    expect(clicks).toBe(labels);
  });

  it.each(Object.keys(NO_TILES_BY_DESIGN))('%s is settled, not unfinished', (page) => {
    const src = read(page);
    // If one of these ever gains a tiles band, the decision above changed and
    // the reason recorded beside it is now wrong — move it into RESKINNED
    // rather than leaving two records disagreeing.
    expect(src).not.toContain('<AdminMetricsStrip');
    expect(NO_TILES_BY_DESIGN[page].length).toBeGreaterThan(40);
  });

  it('SEO fields live in the shared editor, not seven copies of themselves', () => {
    const form = read('src/components/admin/ContentForm.tsx');
    expect(form).toContain("name: 'seo_title'");
    expect(form).toContain("name: 'seo_description'");

    // If a page grows its own copy, the two lists can disagree about what an
    // editor is offered — the same shape as the chat button and the chat
    // keeping separate route lists.
    for (const page of ALL_CONTENT_PAGES) {
      expect(read(page)).not.toContain("name: 'seo_title'");
    }
  });

  it('the SEO override falls back rather than blanking what is live', () => {
    const src = read('src/pages/resources/BlogPostPage.tsx');

    // 84 posts exist with both columns null. If the override is ever read
    // without a fallback, every meta description on the blog goes empty the
    // moment this ships — which is worse than not having the feature.
    expect(src).toContain('post.seo_title?.trim() || post.title');
    expect(src).toContain('post.seo_description?.trim() || post.excerpt');
  });

  it('AI drafting fills empty fields only and never saves', () => {
    const form = read('src/components/admin/ContentForm.tsx');

    // The whole safety case for this button is that it cannot destroy work in
    // progress and cannot publish. Both are one edit away from being untrue, and
    // neither is visible to a type checker.
    expect(form).toContain('generate-content-draft');
    expect(form).toContain("if (String(formData[key] ?? '').trim()) { kept.push(key); continue; }");

    // It must not write or publish from the client either.
    const draftBlock = form.slice(form.indexOf('const handleAiDraft'), form.indexOf('const handleChange'));
    expect(draftBlock.length).toBeGreaterThan(0);
    expect(draftBlock).not.toContain(".from(");
    expect(draftBlock).not.toContain("'published'");
  });

  it('every content page is accounted for, one way or the other', () => {
    // The honest count. A page missing from BOTH lists is one nobody has
    // looked at, and that is the thing Stage C kept losing track of.
    const settled = [...RESKINNED, ...Object.keys(NO_TILES_BY_DESIGN)].sort();
    expect(settled).toEqual([...ALL_CONTENT_PAGES].sort());

    for (const page of settled) {
      expect(() => read(page)).not.toThrow();
    }
  });
});
