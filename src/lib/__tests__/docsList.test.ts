import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * CLAUDE.md and docs/doc-map.json are the same list twice — one for me to read,
 * one for the gate to read. Two copies of a list is precisely the drift every
 * other finding in this project is about, so they check each other here.
 *
 * If a doc is added to one and not the other, this fails and names it. The
 * retired pages are checked too, in the opposite direction: they must NOT be
 * in the map, because being in the map is what marks a page as kept current.
 */

const ROOT = resolve(__dirname, '../../..');
const map = JSON.parse(readFileSync(resolve(ROOT, 'docs/doc-map.json'), 'utf8')) as {
  docs: { id: string; name: string; url: string; always?: boolean }[];
  retired: { name: string; url: string }[];
};
const claudeMd = readFileSync(resolve(ROOT, 'CLAUDE.md'), 'utf8');

describe('the watched-docs list agrees with itself', () => {
  it.each(map.docs.map((d) => [d.name, d.url] as const))(
    'CLAUDE.md lists %s',
    (_name, url) => {
      expect(claudeMd, `${url} is in doc-map.json but not in CLAUDE.md`).toContain(url);
    },
  );

  it('every artifact link in CLAUDE.md is a doc the map knows about', () => {
    const known = new Set([
      ...map.docs.map((d) => d.url),
      ...map.retired.map((r) => r.url),
      // Generated from the map rather than watched, so it is named in
      // CLAUDE.md without being an entry in it.
      'https://claude.ai/code/artifact/00b8292c-1187-4612-8eb7-942d117eae48',
    ]);
    const linked = [
      ...new Set(
        [...claudeMd.matchAll(/https:\/\/claude\.ai\/code\/artifact\/[0-9a-f-]+/g)].map(
          (m) => m[0],
        ),
      ),
    ];
    expect(linked.length).toBeGreaterThan(0);
    for (const url of linked) {
      expect(known, `${url} is linked in CLAUDE.md but is in neither list`).toContain(url);
    }
  });

  it('CLAUDE.md never links a retired page as if it were current', () => {
    // Retirement is the whole point: a frozen signpost linked from the working
    // agreement reads as a live doc, which is the drift the retirement removed.
    for (const r of map.retired) {
      expect(claudeMd, `${r.name} is retired but linked in CLAUDE.md`).not.toContain(r.url);
    }
  });

  it.each(map.retired.map((r) => [r.name, r.url] as const))(
    'retired: %s is not in the watched map',
    (_name, url) => {
      expect(map.docs.some((d) => d.url === url)).toBe(false);
    },
  );

  it('the three always-docs are the board, the plan and the shipped log', () => {
    expect(map.docs.filter((d) => d.always).map((d) => d.id).sort()).toEqual([
      'board',
      'master-plan',
      'shipped',
    ]);
  });
});
