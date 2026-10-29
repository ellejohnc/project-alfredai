#!/usr/bin/env node
/**
 * Names the docs that describe whatever just changed, and fails when a commit
 * touches them and carries no link.
 *
 * I have asked for the docs to be kept current more times than for anything
 * else, and every answer until now was a promise to remember. This is the
 * mechanism that replaces the promise. It does not write a doc — nothing can
 * do that — it makes the ABSENCE of a doc update visible, which is the part
 * that kept slipping past.
 *
 * The board is `always` in the map because it is where I read what is next and
 * what is done: every piece of work that lands touches it. The Master Plan is
 * always too, because it has to agree with the board, and so is the Shipped
 * log. The rest are matched by the files they describe.
 *
 * Deliberately escapable: `Docs: n/a — <reason>` in the commit message passes.
 * A gate that cannot be bypassed gets switched off; one that records the bypass
 * in the history stays on and stays honest. Same reasoning as the lint ratchet.
 *
 *   node scripts/doc-check.mjs                 # working tree, advisory
 *   node scripts/doc-check.mjs --ci            # commit range, fails the build
 *   node scripts/doc-check.mjs --advisory      # never exit non-zero
 */

import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const argv = new Set(process.argv.slice(2));
const CI = argv.has('--ci');
/** Emit a single JSON line for a Claude Code Stop hook instead of a report. */
const HOOK = argv.has('--hook');
const ADVISORY = argv.has('--advisory') || HOOK || !CI;

// Resolved from this file, not from cwd: the Stop hook may run from anywhere.
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const map = JSON.parse(readFileSync(resolve(ROOT, 'docs/doc-map.json'), 'utf8'));
const STAMPS = 'docs/doc-versions.json';

const sh = (cmd) => {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
};

/** The hook speaks only when something is missing — a clean turn stays quiet. */
function hookOut(text) {
  if (text) process.stdout.write(JSON.stringify({ systemMessage: text }) + '\n');
  process.exit(0);
}

/**
 * `**` crosses directory separators, `*` does not. Everything else is literal —
 * this only ever reads our own map, so a full glob implementation would be more
 * surface than the job needs.
 */
function toRegExp(glob) {
  let out = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') { out += '.*'; i++; }
      else out += '[^/]*';
    } else if ('\\^$+?.()|[]{}'.includes(c)) {
      out += '\\' + c;
    } else {
      out += c;
    }
  }
  return new RegExp('^' + out + '$');
}

/** What changed, and what was said about it. */
function subject() {
  if (!CI) {
    const files = new Set(
      [sh('git diff --name-only HEAD'), sh('git diff --name-only --cached')]
        .join('\n').split('\n').filter(Boolean),
    );
    // Nothing uncommitted? Report on the last commit instead, so running this
    // straight after committing still says something rather than shrugging.
    if (!files.size) {
      return {
        files: sh('git show --name-only --format= HEAD').split('\n').filter(Boolean),
        message: sh('git log -1 --format=%B'),
        where: 'the last commit',
      };
    }
    return { files: [...files], message: sh('git log -1 --format=%B'), where: 'the working tree' };
  }

  const base = process.env.DOC_CHECK_BASE
    || (sh('git rev-parse --verify origin/main') ? 'origin/main' : 'HEAD~1');
  const range = base + '...HEAD';
  return {
    files: sh('git diff --name-only ' + range).split('\n').filter(Boolean),
    message: sh('git log ' + range + ' --format=%B') || sh('git log -1 --format=%B'),
    where: range,
  };
}

const { files, message, where } = subject();
if (!files.length) {
  if (HOOK) hookOut('');
  console.log('doc-check: nothing changed in ' + where + '.');
  process.exit(0);
}

/**
 * `excludes` exists because the gate was crying wolf.
 *
 * The four design docs cover `src/components/admin/leads/**`, which is right for
 * the row, the tiles, the toolbar, the peek and the record — and wrong for the
 * ops panels and push buttons that happen to live in the same folder. Changing a
 * checkbox on AlphaBackfillPanel demanded updates to the Design Standard, Live
 * Samples, the UI-Kit and Design vs Build, none of which describe it, and the
 * escape hatch was used five times in two days with the same reason each time.
 *
 * A gate that is waived every time it fires has stopped being a gate. So the
 * broad glob stays — a NEW surface file is covered by default, which is the safe
 * direction — and the known non-surfaces are named. Excluding by name means
 * adding a file to the exclusion list is a deliberate, reviewable act.
 */
const required = [];
for (const doc of map.docs) {
  const matchers = doc.covers.map(toRegExp);
  const excluders = (doc.excludes ?? []).map(toRegExp);
  const hits = files.filter(
    (f) => matchers.some((re) => re.test(f)) && !excluders.some((re) => re.test(f)),
  );
  if (hits.length) required.push({ ...doc, hits });
}

const bypassed = message.includes(map.escapeHatch);
const missing = required.filter((d) => !message.includes(d.url));

/**
 * A URL in a commit message says the doc was updated. The stamp says it was
 * republished. Without this, pasting the link passed the gate whether or not
 * the page changed — "did you say you did it", not "did you do it".
 *
 * Only meaningful over a commit range: in the working tree there is nothing
 * committed yet to compare against.
 */
// Checked for EVERY doc named in the message, not only the ones this change
// required: saying a doc was updated when it was not republished is a false
// statement either way.
const stampDiff = CI ? sh('git diff ' + where + ' -- ' + STAMPS) : '';
const claimedButNotStamped = CI
  ? map.docs.filter(
      (d) => message.includes(d.url) && !new RegExp('^\\+\\s*"' + d.id + '"', 'm').test(stampDiff),
    )
  : [];


if (!required.length && !claimedButNotStamped.length) {
  if (HOOK) hookOut('');
  console.log('doc-check: ' + files.length + ' file(s) changed, none of them described by a doc.');
  process.exit(0);
}

if (HOOK) {
  if (bypassed || !missing.length) hookOut('');
  hookOut(
    'doc-check — ' + missing.length + ' doc(s) describe what changed and are not linked in the commit:\n' +
      missing.map((d) => '  - ' + d.name + (d.always ? ' (always)' : '') + '\n    ' + d.url).join('\n') +
      '\nUpdate them and put the link in the commit message, or write "' + map.escapeHatch + ' - <reason>".',
  );
}

const E = String.fromCharCode(27) + '[';
const W = E + '33m', G = E + '32m', R = E + '31m', D = E + '2m', X = E + '0m';

console.log('');
console.log('doc-check — these docs describe what changed in ' + where + ':');
console.log('');
for (const d of required) {
  const linked = message.includes(d.url);
  const mark = linked ? G + '  linked' + X : (bypassed ? D + '  waived' + X : R + ' MISSING' + X);
  console.log(mark + '  ' + d.name + (d.always ? D + '  (always)' + X : ''));
  console.log('          ' + D + d.why + X);
  console.log('          ' + d.url);
  const sample = d.hits.slice(0, 3).join(', ');
  const more = d.hits.length > 3 ? ' +' + (d.hits.length - 3) + ' more' : '';
  console.log('          ' + D + 'matched: ' + sample + more + X);
  console.log('');
}

if (bypassed) {
  console.log(D + 'Waived by "' + map.escapeHatch + '" in the commit message.' + X);
  process.exit(0);
}

if (!missing.length && !claimedButNotStamped.length) {
  console.log(G + 'Every doc that describes this change is linked in the commit' +
    (CI ? ', and each one was actually republished.' : '.') + X);
  process.exit(0);
}

if (claimedButNotStamped.length) {
  console.log(R + 'Linked in the commit but never republished:' + X);
  for (const d of claimedButNotStamped) {
    console.log('  - ' + d.name + '  ' + D + '(no "' + d.id + '" change in ' + STAMPS + ')' + X);
  }
  console.log(D + 'Publish the doc, then: node scripts/stamp-doc.mjs ' +
    claimedButNotStamped.map((d) => d.id).join(' ') + X);
  console.log('');
}

if (missing.length) {
  console.log(W + 'Update the ' + missing.length + ' doc(s) marked MISSING, then put the link in the commit message.' + X);
}
console.log(D + 'If one genuinely does not apply, write "' + map.escapeHatch + ' - <reason>" and it passes with the reason on the record.' + X);
console.log('');
process.exit(ADVISORY ? 0 : 1);
