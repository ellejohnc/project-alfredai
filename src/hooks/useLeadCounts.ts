import { useMemo } from 'react';
import { useUnifiedLeads } from '@/hooks/useUnifiedLeads';
import { computeLeadCounts, LeadCounts } from '@/lib/leadCounts';

/**
 * Phase 2 — the ONE hook every surface uses to read lead counts. Wraps
 * useUnifiedLeads (the single unified dataset) and runs the shared
 * computeLeadCounts utility so the Inbox tabs, every legacy panel header and
 * the dashboard cards all report identical numbers. Never dead-ends: while
 * loading / on error it returns zeroed counts.
 */
export function useLeadCounts(): {
  counts: LeadCounts;
  isLoading: boolean;
  isError: boolean;
} {
  const { data, isLoading, isError } = useUnifiedLeads();

  const counts = useMemo(
    () => computeLeadCounts(data?.leads, data?.countsBySource),
    [data?.leads, data?.countsBySource],
  );

  return { counts, isLoading, isError };
}
