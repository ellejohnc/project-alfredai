import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

/**
 * The push card's numbers must be about the run it describes.
 *
 * With the triage on, the function's `remaining` is every unpushed row with an
 * email — about a thousand — while the run is about the 56 people tagged
 * interested. The card printed the thousand as "eligible in total", so Check
 * first read as a thousand-contact push and "run again until 0 left" could
 * never finish.
 */

const invoke = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: (...a: unknown[]) => invoke(...a) } },
}));
vi.mock('@/hooks/usePermissions', () => ({ usePermissions: () => ({ isAdmin: true }) }));

import { AlphaBackfillPanel } from '../AlphaBackfillPanel';

describe('Alpha push card', () => {
  beforeEach(() => invoke.mockReset());

  it('reports the triage count, not the whole backlog, on a triaged check', async () => {
    invoke.mockResolvedValue({
      data: {
        success: true, dry_run: true, remaining: 1012, not_enrichable: 2900,
        triaged_matching: 56, runs_to_finish: 3, would_push: 25,
        note: '1012 row(s) are eligible; at this batch size that is 41 run(s).',
      },
      error: null,
    });
    render(<AlphaBackfillPanel />);
    fireEvent.click(screen.getByRole('button', { name: /check first/i }));
    expect(await screen.findByText(/56 triaged as interested/)).toBeTruthy();
    expect(screen.queryByText(/1,012 eligible/)).toBeNull();
    expect(screen.queryByText(/1012 row\(s\) are eligible/)).toBeNull();
  });

  it('still reports the whole backlog when the triage is off', async () => {
    invoke.mockResolvedValue({
      data: { success: true, dry_run: true, remaining: 1012, would_push: 25 },
      error: null,
    });
    render(<AlphaBackfillPanel />);
    fireEvent.click(screen.getByRole('checkbox', { name: /only leads triaged/i }));
    fireEvent.click(screen.getByRole('button', { name: /check first/i }));
    expect(await screen.findByText(/1,012 eligible in total/)).toBeTruthy();
  });
});
