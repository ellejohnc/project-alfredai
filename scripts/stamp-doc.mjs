#!/usr/bin/env node
/**
 * Records that a doc was actually republished.
 *
 * The docs gate used to read the commit message alone, so pasting a URL passed
 * it whether or not the page changed — "did you say you did it", not "did you
 * do it". This is the other half: publishing a doc also bumps its stamp here,
 * and the gate checks the stamp moved in the same commit.
 *
 * It does not make a false claim impossible — the stamp can be bumped without
 * publishing. It makes it a deliberate false entry rather than forgetfulness,
 * which is the difference worth having.
 *
 * The rev counter exists because the artifact list only reports a DATE. Two
 * publishes on one day would leave the date identical and the diff empty, so
 * the rev is what guarantees the stamp always moves.
 *
 *   node scripts/stamp-doc.mjs board master-plan        # after republishing those two
 *   node scripts/stamp-doc.mjs --all                    # every doc (a full sweep)
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MAP = resolve(ROOT, 'docs/doc-map.json');
const STAMPS = resolve(ROOT, 'docs/doc-versions.json');

const map = JSON.parse(readFileSync(MAP, 'utf8'));
const stamps = JSON.parse(readFileSync(STAMPS, 'utf8'));
const ids = map.docs.map((d) => d.id);

const args = process.argv.slice(2);
const wanted = args.includes('--all') ? ids : args.filter((a) => !a.startsWith('--'));

if (!wanted.length) {
  console.error('Which docs? ' + ids.join(' ') + '   (or --all)');
  process.exit(1);
}

const unknown = wanted.filter((id) => !ids.includes(id));
if (unknown.length) {
  console.error('Not a doc id: ' + unknown.join(', ') + '\nKnown: ' + ids.join(' '));
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);

for (const id of wanted) {
  const prev = String(stamps[id] ?? today + '#0');
  const rev = Number(prev.split('#')[1] ?? 0) + 1;
  stamps[id] = today + '#' + rev;
  console.log(id + '  ' + prev + '  ->  ' + stamps[id]);
}

// Rewritten by hand rather than JSON.stringify so the file stays one line per
// doc — the gate reads the diff, and a reflowed file would make every stamp
// look changed.
const body =
  '{\n  "_why": ' + JSON.stringify(stamps._why) + ',\n' +
  ids.map((id) => '  ' + JSON.stringify(id) + ': ' + JSON.stringify(stamps[id])).join(',\n') +
  '\n}\n';
writeFileSync(STAMPS, body);
