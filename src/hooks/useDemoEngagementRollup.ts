import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Engagement per visitor, for the Demo page's Started / Engaged / Completed
 * tiles.
 *
 * Those tiles are what Every Leads Page 03 asks for and they could not be built
 * at all until recently: `demo_engagement` rows carried a visitor_id, `leads`
 * rows carried none, so an event could never be attributed to a person. The
 * join now exists (leads.visitor_id) and the tracker emits step and completed
 * events as well as viewed.
 *
 * Counts will read low until events accumulate — capture only started on
 * 19 Aug. That is honest rather than misleading: the alternative was tiles
 * showing a number derived from something else and calling it engagement.
 */

export interface EngagementRollup {
  /** visitor_id -> what that visitor did */
  byVisitor: Map<string, { viewed: boolean; engaged: boolean; completed: boolean; seconds: number }>;
  /** True once any step/completed event exists — i.e. the tiles mean something. */
  hasEngagementData: boolean;
}

/** A visitor counts as engaged once they pass a step, or watch this long. */
const ENGAGED_SECONDS = 30;

export function useDemoEngagementRollup() {
  return useQuery<EngagementRollup>({
    queryKey: ['demo-engagement-rollup'],
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      const byVisitor: EngagementRollup['byVisitor'] = new Map();
      let hasEngagementData = false;

      // Only the columns the rollup reads. This table grows with every view, so
      // selecting * here would drag the metadata jsonb across for nothing.
      const { data, error } = await supabase
        .from('demo_engagement')
        .select('visitor_id, event_type, duration_seconds')
        .not('visitor_id', 'is', null)
        .limit(10000);
      if (error) throw error;

      for (const row of data ?? []) {
        const id = row.visitor_id as string | null;
        if (!id) continue;
        const entry =
          byVisitor.get(id) ?? { viewed: false, engaged: false, completed: false, seconds: 0 };
        const type = String(row.event_type ?? '');
        const secs = Number(row.duration_seconds ?? 0) || 0;

        if (type === 'viewed') entry.viewed = true;
        if (type === 'step') {
          entry.engaged = true;
          hasEngagementData = true;
        }
        if (type === 'completed') {
          entry.completed = true;
          entry.engaged = true;
          hasEngagementData = true;
        }
        entry.seconds = Math.max(entry.seconds, secs);
        if (entry.seconds >= ENGAGED_SECONDS) entry.engaged = true;

        byVisitor.set(id, entry);
      }

      return { byVisitor, hasEngagementData };
    },
  });
}
