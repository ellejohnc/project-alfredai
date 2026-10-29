#!/usr/bin/env node
/**
 * The one nav row every doc we follow carries — same order, same names, on
 * every page, with the page you are on marked rather than linked.
 *
 * Each doc had grown its own row ("Watch", "Plan set", a bare list) with
 * different names for the same pages — the board was "Live status" on some —
 * and none of them linked the Docs Plan. One source here means the rows cannot
 * drift apart again: the Docs Plan page imports it, and the artifact docs are
 * edited by pasting its output.
 *
 *   node scripts/doc-nav.mjs <id>     # prints the row for that doc
 */
import { fileURLToPath } from 'node:url';

export const DOC_NAV = [
  ['board', '📋', 'Leads Build board', '26bdaba6-6e2a-4ff7-a4d9-5f06158196bd'],
  ['master-plan', '📘', 'Master Plan', '91718abb-c46b-49c8-9bc8-2a6a09aa6340'],
  ['shipped', '🧱', 'Shipped log', '1c73c39a-8383-4784-ba26-1483de720f04'],
  ['design-standard', '📐', 'Design Standard', '82165f38-f123-46cc-ab2b-4e703359139e'],
  ['every-leads-page', '🗂️', 'Every Leads Page', '60e478dd-2f24-4541-8a2a-12a6962c8878'],
  ['live-samples', '🎨', 'Live Samples', 'b38eebde-7088-4ff5-8b93-f241b8b2fcf3'],
  ['ui-kit', '🎛️', 'UI-Kit', '07f701e2-9530-426d-9b13-221a3da3135f'],
  ['ghl', '🔌', 'GHL Integration', 'b4fa2ea5-a085-4bd9-9422-52713dc208da'],
  ['design-vs-build', '🔍', 'Design vs Build', '791fd2fd-b1c6-492c-9d1c-1005fa801a56'],
  ['docs-plan', '🗺️', 'Docs Plan', '00b8292c-1187-4612-8eb7-942d117eae48'],
];

// Colours come from the page's own text colour, so the row reads on the dark
// docs and on the Standard's light theme alike. Pink marks the current page.
const STYLE =
  '<style id="docnav-css">.docnav{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:0 0 18px;padding:10px 12px;' +
  'border:1px solid color-mix(in srgb,currentColor 18%,transparent);border-radius:10px;' +
  'background:color-mix(in srgb,currentColor 4%,transparent);font:12px/1.3 system-ui,-apple-system,"Segoe UI",sans-serif}' +
  '.docnav .dn-l{font:600 9.5px/1 ui-monospace,"SF Mono",Menlo,monospace;letter-spacing:.14em;text-transform:uppercase;opacity:.6;margin-right:4px}' +
  '.docnav a,.docnav .dn-here{display:inline-flex;align-items:center;gap:5px;padding:5px 10px;border-radius:7px;text-decoration:none;color:inherit;' +
  'border:1px solid color-mix(in srgb,currentColor 22%,transparent);white-space:nowrap}' +
  '.docnav a:hover{border-color:#ec4899}' +
  '.docnav .dn-here{border-color:#ec4899;color:#ec4899;background:rgba(236,72,153,.12);font-weight:600}' +
  '@media (max-width:520px){.docnav{gap:5px}.docnav a,.docnav .dn-here{padding:4px 8px;font-size:11.5px}}</style>';

export function docNav(here) {
  if (!DOC_NAV.some(([id]) => id === here)) throw new Error(`unknown doc id: ${here}`);
  const items = DOC_NAV.map(([id, icon, name, aid]) =>
    id === here
      ? `<span class="dn-here" aria-current="page">${icon} ${name}</span>`
      : `<a target="_top" href="https://claude.ai/code/artifact/${aid}">${icon} ${name}</a>`,
  ).join('');
  return `${STYLE}\n<nav class="docnav" aria-label="The docs we follow"><span class="dn-l">The docs we follow</span>${items}</nav>\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.stdout.write(docNav(process.argv[2]));
}
