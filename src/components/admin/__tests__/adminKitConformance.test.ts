import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * ONE KIT. This guard exists because there were two.
 *
 * The Leads Design Standard describes a single five-band shape — title ·
 * tiles · toolbar · table · empty state — and on 11 Sep counting the pages
 * found the code had built it twice. Nine lead pages hand-rolled their title
 * band over LeadsToolbar/LeadList; six content pages used AdminPageHeader over
 * AdminFilterBar/ContentTable. They shared exactly one component between them,
 * AdminMetricsStrip, and nothing else.
 *
 * WHY NOTHING CAUGHT IT, which is the part worth guarding against rather than
 * just fixing: each family was internally consistent and each passed its own
 * check. contentBands.test.ts compares content pages to each other; the lead
 * pages were audited against sample S1. No test compared the two families, so
 * a second kit could grow for weeks while every existing guard stayed green.
 *
 * WHICH KIT WON, and it was not a preference. AdminFilterBar is hardcoded to
 * AdminFilters — status, datePreset, searchQuery — so it CANNOT express the
 * Owner or Outcome filters the Standard's toolbar names. AdminToolbar takes an
 * arbitrary filter array with active-filter chips, clear-all and a live count.
 * The narrow one is a special case of the general one, so the panel converges
 * on AdminToolbar for the toolbar band and AdminPageHeader for the title band.
 *
 * This is a LEDGER, not a wall. A page not yet migrated is listed with what it
 * still uses, so the honest count is in the file rather than in someone's head
 * — and a page in NEITHER list fails, which is the thing Stage C lost track of
 * twice. It is deliberately not a red build on day one: a gate that is always
 * red gets switched off.
 */

const ROOT = process.cwd();
const read = (p: string) => readFileSync(resolve(ROOT, p), 'utf8');

// settings/ joined on 21 Oct, when Users became the first settings page on the kit.
const LIST_PAGE_DIRS = ['src/pages/admin/content', 'src/pages/admin/contacts', 'src/pages/admin/settings'];

/** Every page that renders any part of the shell. Discovered, not hand-listed. */
function shellPages(): string[] {
  const out: string[] = [];
  for (const dir of LIST_PAGE_DIRS) {
    for (const f of readdirSync(resolve(ROOT, dir))) {
      if (!f.endsWith('.tsx')) continue;
      const p = `${dir}/${f}`;
      const src = read(p);
      if (/<Admin(PageHeader|Toolbar|FilterBar|MetricsStrip)/.test(src)) out.push(p);
    }
  }
  return out.sort();
}

/** On the unified shell: the shared title band AND the shared toolbar. */
const ON_UNIFIED_SHELL = [
  'src/pages/admin/contacts/ContactsAdmin.tsx',
  'src/pages/admin/content/AlphaDigitalLeadsAdmin.tsx',
  'src/pages/admin/content/ArchivedLeadsAdmin.tsx',
  'src/pages/admin/content/B2BMatchmakingLeadsAdmin.tsx',
  'src/pages/admin/content/BlogAdmin.tsx',
  'src/pages/admin/content/DemoLeadsAdmin.tsx',
  'src/pages/admin/content/DocsAdmin.tsx',
  'src/pages/admin/content/FAQsAdmin.tsx',
  'src/pages/admin/content/GuidesAdmin.tsx',
  'src/pages/admin/content/InvestorLeadsAdmin.tsx',
  'src/pages/admin/content/JobsAdmin.tsx',
  'src/pages/admin/content/LeadsBookedAdmin.tsx',
  'src/pages/admin/content/MeetingsAdmin.tsx',
  'src/pages/admin/content/QuotesAdmin.tsx',
  'src/pages/admin/content/SalesFiguresAdmin.tsx',
  'src/pages/admin/content/GHLSubmissionsAdmin.tsx',
  'src/pages/admin/content/DataTidyUpAdmin.tsx',
  'src/pages/admin/content/MetaLeadsAdmin.tsx',
  'src/pages/admin/content/TestimonialsAdmin.tsx',
  'src/pages/admin/content/UnifiedLeadsInbox.tsx',
  'src/pages/admin/content/WebinarLeadsAdmin.tsx',
  'src/pages/admin/content/WebinarsAdmin.tsx',
  'src/pages/admin/settings/EmailDeliveryDashboard.tsx',
  'src/pages/admin/settings/UsersAdmin.tsx',
]

/**
 * Carried the shared toolbar while still hand-rolling their title band.
 * EMPTIED 13 Sep — all nine moved onto AdminPageHeader, which closes band 1
 * across every lead surface. Kept as a named empty list rather than deleted, so
 * a page sliding back into this state has somewhere to be recorded.
 */
const TOOLBAR_ONLY: string[] = [];
/**
 * Carried the shared title band while still on the NARROW filter bar.
 * EMPTIED 14 Sep — all six moved onto the shared toolbar via
 * AdminContentFilters, and AdminFilterBar is deleted. There is now exactly one
 * toolbar implementation in the panel. Kept as a named empty list rather than
 * removed, so a page sliding back has somewhere to be recorded.
 */
const HEADER_ONLY: string[] = [];
/**
 * Pages that are not lists: an editor or a dashboard-style tool with nothing
 * to filter. They carry the shared title band and deliberately no tiles or
 * toolbar, because a toolbar with nothing to narrow is decoration. Added
 * 21 Oct with Email Templates, so such a page is counted honestly instead of
 * being forced into a list's shape or left out of the ledger.
 */
const TITLE_BAND_ONLY = [
  'src/pages/admin/settings/EmailTemplatesAdmin.tsx',
];

describe('the admin panel has one kit, not two', () => {
  it('every page rendering the shell is accounted for in exactly one list', () => {
    const ledger = [...ON_UNIFIED_SHELL, ...TOOLBAR_ONLY, ...HEADER_ONLY, ...TITLE_BAND_ONLY].sort();
    // A page in none of them is one nobody has looked at — the exact thing
    // Stage C lost track of twice, and the reskin miscounted again on 11 Sep.
    expect(shellPages()).toEqual(ledger);
    expect(new Set(ledger).size, 'a page is listed twice').toBe(ledger.length);
  });

  it('no page mixes the two toolbars', () => {
    // Both on one page would mean the page filters through two different
    // state shapes at once, which is how the families drifted in the first place.
    for (const page of shellPages()) {
      const src = read(page);
      const both = src.includes('<AdminToolbar') && src.includes('<AdminContentFilters');
      expect(both, `${page} renders the toolbar twice`).toBe(false);
    }
  });

  it('the narrow filter bar is gone and cannot come back', () => {
    // AdminFilterBar could not express Owner or Outcome — it was hardcoded to
    // status/date/search — so it was deleted rather than kept beside the one
    // that can. The file itself must stay gone: a page importing it again is
    // the second kit growing back, which is what this whole file exists for.
    expect(() => read('src/components/admin/AdminFilterBar.tsx')).toThrow();
    for (const page of shellPages()) {
      expect(read(page), `${page} still renders the deleted filter bar`)
        .not.toContain('<AdminFilterBar');
    }
    expect(HEADER_ONLY).toEqual([]);
  });

  it('the shell lives in components/admin, not under leads/', () => {
    // The shell is panel-wide. A content page importing its toolbar from a
    // leads folder is the naming drift this project keeps paying for, and it
    // is what made two kits look like one.
    for (const page of shellPages()) {
      const src = read(page);
      expect(src, `${page} imports a shell component from leads/`)
        .not.toMatch(/from ['"]@\/components\/admin\/leads\/Admin(Toolbar|ActionsRow|PageHeader|MetricsStrip)['"]/);
    }
  });

  it('the shared shell components exist where the kit says they do', () => {
    for (const c of ['AdminPageHeader', 'AdminToolbar', 'AdminActionsRow', 'AdminMetricsStrip', 'AdminContentFilters']) {
      expect(() => read(`src/components/admin/${c}.tsx`), `${c} is not in components/admin`).not.toThrow();
    }
  });

  it('a shell component that is imported is also rendered', () => {
    // Found 14 Sep, fixed 13 Oct: Alpha Digital and Investor both IMPORTED the
    // admin row and never rendered it. Alpha even built its actions array — Sync
    // now, Export CSV — and handed it to nothing, so both buttons were
    // unreachable while every doc recorded the row as present on all ten lead
    // pages, "verified by grep". The grep counted imports. An import is a
    // promise; this checks it is kept.
    for (const page of shellPages()) {
      const src = read(page);
      for (const c of ['AdminActionsRow', 'AdminToolbar', 'AdminPageHeader', 'AdminMetricsStrip']) {
        const imported = new RegExp(`import[^;]*\\b${c}\\b[^;]*from`).test(src);
        if (!imported) continue;
        expect(src, `${page} imports ${c} and never renders it`).toContain(`<${c}`);
      }
    }
  });

  it('reports how far the unification has actually got', () => {
    // The honest count, in the file rather than in a doc that goes stale.
    const total = shellPages().length;
    const done = ON_UNIFIED_SHELL.length;
    expect(total).toBe(25);
    expect(done + TOOLBAR_ONLY.length + HEADER_ONLY.length + TITLE_BAND_ONLY.length).toBe(total);
    // 24 list pages on the full shell (FAQs 25 Oct, Email Delivery 26 Oct), plus 1 non-list page on the title band
    // only (Email Templates, 21 Oct). Both old ledgers are empty, which is the honest way to say the
    // LIST pages are unified — one title band, one toolbar, one tiles strip.
    // The pages still on no kit at all do not render the shell, so they are
    // out of scope here rather than quietly counted as done. That distinction
    // is what the reskin lost twice before. Each one moved onto the kit lands
    // here and raises both numbers: Meetings was the first, then Quotes
    // and GHL Submissions, all 15 Oct, then Data Tidy-Up, Sales Figures and Users on 21 Oct.
    expect(done).toBe(24);
  });
});
