import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { filterItems, getDefaultFilters } from '../adminFilters';

/**
 * The content search box looked only at `title`. FAQs and Testimonials have
 * no title, so until 25 Oct their search matched nothing, whatever was typed,
 * and nothing failed: the list simply went empty. This pins both halves.
 */
const row = (o: Record<string, unknown>) => ({ status: 'published', created_at: '2026-01-01', updated_at: '2026-01-01', ...o });

describe('content search', () => {
  it('searches title by default', () => {
    const items = [row({ title: 'Estimating guide' }), row({ title: 'Other' })];
    const out = filterItems(items, { ...getDefaultFilters(), searchQuery: 'estim' });
    expect(out).toHaveLength(1);
  });

  it('searches the fields a page names', () => {
    const items = [row({ question: 'How long is setup?', answer: 'Two weeks' }), row({ question: 'Pricing?', answer: 'Per seat' })];
    const out = filterItems(items, { ...getDefaultFilters(), searchQuery: 'two weeks' }, ['question', 'answer']);
    expect(out).toHaveLength(1);
  });

  it('pages whose records have no title pass their own search fields', () => {
    for (const page of ['FAQsAdmin', 'TestimonialsAdmin']) {
      const src = readFileSync(resolve(process.cwd(), `src/pages/admin/content/${page}.tsx`), 'utf8');
      expect(src, `${page} searches title, which its records do not have`).toMatch(/filterItems\([^)]*,\s*\[/);
    }
  });
});
