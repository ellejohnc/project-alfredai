#!/usr/bin/env node
/**
 * Check the Leads Build board before republishing it.
 *
 * Since 13 Oct the board runs on the same engine as the Content engine board:
 * the page's state is one JSON block (`<script type="application/json"
 * id="state">`) and one script (`<script id="app">`) renders it, and the page
 * republishes itself when someone changes a task. So the things that can break
 * are different from the old hand-typed PHASES object, and so are the checks.
 *
 * Three failures this guards against, each of which has actually happened:
 *
 * 1. A PAGE THAT RENDERS NOTHING. A missing comma left the old board blank for
 *    three days, and it was linked four more times without anyone opening it.
 *    Both the state and the script are parsed here, so a broken publish fails
 *    in a second instead.
 *
 * 2. LABELS THAT DRIFT FROM THE WORK. The old board's phase and stage labels
 *    were typed separately from their tasks and disagreed with them five
 *    times. On this board a section's state is computed from its tasks, so
 *    that drift cannot happen. What CAN go wrong is a task pointing at
 *    something that does not exist: an unknown area, status or mode, a `next`
 *    naming a missing task, or a weekly priority naming one.
 *
 * 3. "DONE" WITH NOTHING BEHIND IT. The Content engine board marked the Alpha
 *    push done on 21 Sep with no note, and the database shows it never ran.
 *    So a task in Done must say what was done.
 *
 * Usage:  node scripts/check-board.mjs <path-to-board.html>
 *
 * The board is an artifact, not a repo file, so this takes a path rather than
 * running in CI. It is the thing to run between editing the board and
 * publishing it.
 */

import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const file = process.argv[2];
if (!file) {
  console.error('usage: node scripts/check-board.mjs <path-to-board.html>');
  process.exit(2);
}

const html = readFileSync(file, 'utf8');
let problems = 0;
const fail = (msg) => { console.error('✗ ' + msg); problems++; };

// ── 1. It parses ─────────────────────────────────────────────────────────────
const stateMatch = html.match(/<script type="application\/json" id="state">([\s\S]*?)<\/script>/);
const appMatch = html.match(/<script id="app">([\s\S]*?)<\/script>/);
if (!stateMatch || !appMatch) {
  console.error('✗ No state block or no app script — is this the board? (The pre-13 Oct PHASES format is retired.)');
  process.exit(1);
}

let state;
try {
  state = JSON.parse(stateMatch[1]);
  console.log('✓ state parses');
} catch (err) {
  console.error('✗ THE BOARD WOULD RENDER NOTHING — the state JSON does not parse:\n  ' + err.message);
  process.exit(1);
}

const tmp = join(tmpdir(), `board-check-${process.pid}.js`);
writeFileSync(tmp, appMatch[1]);
try {
  execFileSync(process.execPath, ['--check', tmp], { stdio: 'pipe' });
  console.log('✓ script parses');
} catch (err) {
  console.error('✗ THE BOARD WOULD RENDER NOTHING — the script does not parse:\n');
  console.error(err.stderr?.toString() ?? err.message);
  process.exit(1);
} finally {
  try { unlinkSync(tmp); } catch { /* best effort */ }
}

// The page republishes itself, so it must publish in the Artifact tool's own
// skeleton; otherwise the next publish from the tool nests a second document.
if (!/var SKEL = "<!doctype html><html><head><meta charset=utf8>/.test(appMatch[1])) {
  fail('buildDoc no longer emits the Artifact skeleton (var SKEL) — a later tool publish would nest the page');
}

// ── 2. Every reference resolves ─────────────────────────────────────────────
const STATUS = ['today', 'progress', 'blocked', 'open', 'hold', 'done', 'dropped', 'abandoned', 'removed'];
const ACTIVE = ['today', 'progress', 'blocked', 'open', 'hold'];
const MODES = ['guide', 'chat', 'code', 'lovable', 'manual', 'message'];
const SEV = ['critical', 'high', 'normal', 'low'];
const PAREAS = ['crm', 'alpha', 'panel', 'site'];

const cats = new Set((state.cats ?? []).map((c) => c[0]));
const tasks = state.tasks ?? [];
const byId = new Map();
for (const t of tasks) {
  if (byId.has(t.id)) fail(`${t.id} is used by two tasks`);
  byId.set(t.id, t);
}

for (const t of tasks) {
  const where = `${t.id} "${String(t.title).slice(0, 50)}"`;
  if (!t.title) fail(`${t.id} has no title`);
  if (!cats.has(t.cat)) fail(`${where} is in area "${t.cat}", which does not exist`);
  if (!STATUS.includes(t.status)) fail(`${where} has unknown status "${t.status}"`);
  if (t.mode && !MODES.includes(t.mode)) fail(`${where} has unknown mode "${t.mode}"`);
  if (t.severity && !SEV.includes(t.severity)) fail(`${where} has unknown severity "${t.severity}"`);
  if (t.problem && !PAREAS.includes(t.problem)) fail(`${where} names problem area "${t.problem}", which the page does not render`);
  if (t.next && !byId.has(t.next)) fail(`${where} says its next task is ${t.next}, which does not exist`);

  // ── 3. Done means something was done ──
  if (t.status === 'done' && !String(t.note ?? '').trim()) {
    fail(`${where} is marked Done with no note of what was done`);
  }
}

// Since 15 Oct the engine shows WHY a task is blocked or on hold, and the
// tasks it waits on. A held task with no reason reads as abandoned, and a
// "waiting on" that names a missing task can never clear.
for (const t of tasks.filter((x) => x.status === 'blocked' || x.status === 'hold')) {
  if (!String(t.blocked?.reason ?? '').trim()) fail(`${t.id} is ${t.status === 'hold' ? 'On hold' : 'Blocked'} with no reason`);
  for (const id of t.blocked?.by ?? []) if (!byId.has(id)) fail(`${t.id} says it waits on ${id}, which does not exist`);
}

// The path is the order of work. A step naming a missing task silently drops
// out of it, and the "Do this now" marker moves to the wrong task.
for (const s of state.path?.steps ?? []) {
  if (!byId.has(s.id)) fail(`the path names ${s.id}, which does not exist`);
}

// Two active tasks with the same priority make "Start here" pick one at random.
const prio = new Map();
for (const t of tasks.filter((x) => x.priority && ACTIVE.includes(x.status))) {
  if (prio.has(t.priority)) fail(`${t.id} and ${prio.get(t.priority)} both have priority ${t.priority}`);
  prio.set(t.priority, t.id);
}

// Weekly priorities are written "LB-1: text"; the id before the colon is what
// the page ticks off when that task is done.
for (const list of [state.weekly?.priorities ?? [], state.weekly?.next?.priorities ?? []]) {
  for (const p of list) {
    const head = String(p).split(':')[0];
    if (head === p) continue;
    for (const id of head.split(/[\s,/&+]+/).filter(Boolean)) {
      if (/^[A-Z]+[A-Z0-9]*-\w+$/.test(id) && !byId.has(id)) fail(`weekly priority "${p.slice(0, 50)}" names ${id}, which does not exist`);
    }
  }
}

const active = tasks.filter((t) => ACTIVE.includes(t.status));
const counts = STATUS.map((s) => [s, tasks.filter((t) => t.status === s).length]).filter(([, n]) => n);
console.log(`  ${tasks.length} tasks · ${active.length} active · ` + counts.map(([s, n]) => `${n} ${s}`).join(', '));

if (problems) {
  console.error(`\n${problems} problem(s). Fix them before publishing.`);
  process.exit(1);
}
console.log('✓ every area, status, mode, next-task and weekly reference resolves; every Done task says what was done');
