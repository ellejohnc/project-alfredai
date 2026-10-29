#!/usr/bin/env node
/**
 * Renders the Docs Plan page from docs/doc-map.json.
 *
 * The map is what the gate reads; this page is what I read. Generating one
 * from the other means they cannot disagree — which is the whole complaint
 * this plan exists to answer. Editing the page by hand would reintroduce
 * exactly the drift it is documenting, so: edit the map, re-run this.
 *
 *   node scripts/build-docs-plan.mjs        # writes docs/docs-plan.html
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { docNav } from './doc-nav.mjs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const map = JSON.parse(readFileSync(resolve(ROOT, 'docs/doc-map.json'), 'utf8'));

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** `src/components/admin/leads/**` reads better as a short human phrase. */
function coversLabel(doc) {
  if (doc.always) return 'Every change to the app or the edge functions';
  return doc.covers.map((c) => '<code>' + esc(c) + '</code>').join(' · ');
}

const always = map.docs.filter((d) => d.always);
const matched = map.docs.filter((d) => !d.always);

const card = (d) => `
      <article class="doc${d.always ? ' always' : ''}">
        <header>
          <h3><a target="_top" href="${d.url}">${esc(d.name)}</a></h3>
          ${d.always ? '<span class="tag">always</span>' : ''}
        </header>
        <p class="job">${esc(d.why)}</p>
        <p class="fires"><span class="k">Fires on</span>${coversLabel(d)}</p>
      </article>`;

const retiredRow = (r) => `
        <tr>
          <td><a target="_top" href="${r.url}">${esc(r.name)}</a></td>
          <td><b>${esc(r.replacedBy)}</b></td>
          <td>${esc(r.why)}</td>
        </tr>`;

const html = `<title>The Docs Plan</title>
<style>
  :root{
    --bg:#0a0e1a; --bg2:#0e1322; --surface:#141a2b; --surface2:#1b2233;
    --border:#222a3b; --border2:#333d52;
    --text:#f4f6fb; --muted:#9aa6bc; --faint:#64748b;
    --pink:#ff4d8d; --pink-soft:#ff7aa8; --pink-dim:rgba(255,77,141,.14);
    --emerald:#2dd4bf; --emerald-dim:rgba(45,212,191,.14);
    --amber:#f59e0b; --amber-dim:rgba(245,158,11,.14);
    --mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace;
    --sans:system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  }
  *{box-sizing:border-box}
  body{margin:0;background:
      radial-gradient(1100px 600px at 85% -12%, rgba(255,77,141,.07), transparent 60%),
      var(--bg);
    color:var(--text);font-family:var(--sans);line-height:1.55;-webkit-font-smoothing:antialiased}
  .wrap{max-width:1000px;margin:0 auto;padding:44px 20px 90px}
  .eyebrow{font-family:var(--mono);font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--pink-soft)}
  h1{font-size:clamp(28px,5vw,42px);line-height:1.04;margin:13px 0 10px;font-weight:760;letter-spacing:-.022em;text-wrap:balance}
  h1 .thin{color:var(--muted);font-weight:400}
  .lede{font-size:16px;color:var(--muted);max-width:70ch;margin:0}
  code{font-family:var(--mono);font-size:.85em;background:var(--surface2);border:1px solid var(--border);
    border-radius:4px;padding:1px 5px;color:#c9d3e2}

  .rule{margin:24px 0 0;padding:16px 18px;border:1px solid var(--border2);border-left:3px solid var(--pink);
    background:linear-gradient(180deg,var(--surface),var(--bg2));border-radius:0 11px 11px 0;font-size:14.5px;color:var(--muted)}
  .rule b{color:var(--text)}

  h2{font-size:20px;margin:46px 0 4px;font-weight:690;letter-spacing:-.012em}
  .h2sub{color:var(--faint);font-size:12.5px;margin:0 0 16px}

  .docs{display:grid;gap:11px}
  .doc{border:1px solid var(--border);background:var(--surface);border-radius:12px;padding:15px 17px}
  .doc.always{border-color:rgba(255,77,141,.35);background:linear-gradient(180deg,var(--pink-dim),var(--surface))}
  .doc header{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
  .doc h3{margin:0;font-size:15.5px;font-weight:670}
  .doc h3 a{color:var(--text);text-decoration:none;border-bottom:1px solid var(--border2)}
  .doc h3 a:hover{color:var(--pink-soft);border-color:var(--pink)}
  .tag{font-family:var(--mono);font-size:9px;letter-spacing:.12em;text-transform:uppercase;
    color:var(--pink-soft);border:1px solid rgba(255,77,141,.4);background:var(--pink-dim);border-radius:20px;padding:2px 9px}
  .job{margin:7px 0 0;font-size:13.5px;color:var(--muted)}
  .fires{margin:9px 0 0;font-size:12px;color:var(--faint);line-height:1.7}
  .fires .k{font-family:var(--mono);font-size:9px;letter-spacing:.13em;text-transform:uppercase;
    color:var(--faint);margin-right:9px}

  .how{display:grid;gap:10px;margin-top:4px}
  .step{display:grid;grid-template-columns:26px 1fr;gap:12px;align-items:start;
    border:1px solid var(--border);background:var(--surface);border-radius:11px;padding:13px 15px}
  .step .n{width:24px;height:24px;border-radius:7px;display:flex;align-items:center;justify-content:center;
    font-family:var(--mono);font-size:11px;font-weight:700;background:var(--emerald-dim);color:var(--emerald);
    border:1px solid rgba(45,212,191,.4)}
  .step .t{font-size:13.5px}
  .step .t b{color:var(--text)}
  .step .t span{color:var(--muted)}

  .warn{margin-top:14px;padding:13px 16px;border:1px solid rgba(245,158,11,.4);border-left:3px solid var(--amber);
    background:var(--amber-dim);border-radius:0 10px 10px 0;font-size:13px;color:var(--muted)}
  .warn b{color:var(--amber)}

  .tblwrap{overflow-x:auto;border:1px solid var(--border);border-radius:12px;background:var(--surface)}
  table{border-collapse:collapse;width:100%;font-size:12.5px;min-width:620px}
  th{text-align:left;font-family:var(--mono);font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;
    color:var(--faint);font-weight:600;padding:10px 13px;border-bottom:1px solid var(--border2);background:var(--bg2)}
  td{padding:10px 13px;border-bottom:1px solid var(--border);color:var(--muted);vertical-align:top}
  tr:last-child td{border-bottom:0}
  td a{color:var(--text);text-decoration:none;border-bottom:1px solid var(--border2)}
  td a:hover{color:var(--pink-soft)}
  td b{color:var(--emerald);font-weight:600}

  footer{margin-top:52px;border-top:1px solid var(--border);padding-top:18px;color:var(--faint);font-size:12px;line-height:1.7}
</style>

<div class="wrap">
${docNav('docs-plan')}  <div class="eyebrow">AlfredAI · Docs · the plan for the docs themselves</div>
  <h1>The Docs Plan <span class="thin">— what is kept current, and what makes it happen</span></h1>
  <p class="lede">Nine docs are the necessary ones. They are the only ones kept current, and keeping them current is
  no longer something anyone has to remember — it is a gate that fails. Everything else is retired behind a signpost.</p>

  <div class="rule">
    <b>The rule, in one line:</b> when work lands, the docs that describe it are updated in the same session, and the
    message where it lands carries the link. <b>The board is where the state is read</b> — what is next and what is
    done — so everything that lands touches it, along with the Master Plan it has to agree with and the Shipped log
    that records what actually went live.
  </div>

  <h2>The nine</h2>
  <p class="h2sub">${always.length} always · ${matched.length} matched to the files they describe</p>
  <div class="docs">${always.map(card).join('')}${matched.map(card).join('')}
  </div>

  <h2>What makes it happen</h2>
  <p class="h2sub">a mechanism, not a promise — because the promise is what kept failing</p>
  <div class="how">
    <div class="step"><span class="n">1</span><span class="t"><b>One source.</b>
      <span><code>docs/doc-map.json</code> maps each doc to the files it describes. This page is generated from it,
      so the plan and the gate cannot drift apart.</span></span></div>
    <div class="step"><span class="n">2</span><span class="t"><b>CI fails.</b>
      <span>The <code>Docs gate</code> step runs <code>scripts/doc-check.mjs --ci</code>: if a commit touches mapped
      code and carries no doc link, the check goes red and names the docs it is missing.</span></span></div>
    <div class="step"><span class="n">3</span><span class="t"><b>A hook says it out loud.</b>
      <span>A Stop hook prints the same list at the end of every turn, so it does not depend on anyone thinking to
      look.</span></span></div>
    <div class="step"><span class="n">4</span><span class="t"><b>And the claim is checked against reality.</b>
      <span>Publishing a doc also bumps its stamp in <code>docs/doc-versions.json</code>
      (<code>node scripts/stamp-doc.mjs &lt;id&gt;</code>). The gate compares the two: a doc named in a commit whose
      stamp did not move <b>fails the build and is named</b>. Pasting a link is no longer enough.</span></span></div>
    <div class="step"><span class="n">5</span><span class="t"><b>Bypassing is visible, not blocked.</b>
      <span><code>${esc(map.escapeHatch)} — &lt;reason&gt;</code> in the commit message passes, and the reason goes
      into the history. A gate that cannot be bypassed gets switched off; one that records the bypass stays on. Same
      reasoning as the lint budget.</span></span></div>
  </div>

  <div class="warn">
    <b>What this still does not do, said plainly.</b> The stamp proves a doc was <b>republished</b>, not that the
    republish contained anything useful — and the stamp itself could be bumped by hand without publishing. That moves
    a false claim from <i>satisfied by copy-paste</i> to <i>a deliberate false entry</i>, which is the difference
    worth having, not a guarantee. And none of it can block a push while <code>main</code> has no branch protection:
    the check goes red and visible, and nothing stops. Knowing about both beats discovering them.
  </div>

  <h2>Retired</h2>
  <p class="h2sub">${map.retired.length} pages, frozen behind a signpost — deliberately NOT in the map</p>
  <div class="tblwrap"><table>
    <thead><tr><th>Page</th><th>Current instead</th><th>Why it stopped</th></tr></thead>
    <tbody>${map.retired.map(retiredRow).join('')}
    </tbody>
  </table></div>

  <footer>
    Generated from <code>docs/doc-map.json</code> by <code>scripts/build-docs-plan.mjs</code> — edit the map, re-run
    the script, republish. Editing this page by hand would reintroduce the exact drift it documents.<br>
    Numbers belong in the app, not in a doc: findings live on the <b>System Health</b> page, source counts on
    <b>GHL Sync</b>. A doc that says “see Sync Health” is correct forever; one that says “3,765” is correct until Tuesday.
  </footer>
</div>
`;

writeFileSync(resolve(ROOT, 'docs/docs-plan.html'), html);
console.log('docs/docs-plan.html — ' + map.docs.length + ' live, ' + map.retired.length + ' retired');
