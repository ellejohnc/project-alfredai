import { useState, useEffect, useCallback } from 'react';
import { getVisitorId, getDeviceType } from '@/lib/visitorId';
import { supabase } from '@/integrations/supabase/client';

interface ViewCounts {
  [demoId: string]: {
    total_views: number;
    views_30d: number;
    views_7d: number;
  };
}

// Visitor id + device type now come from one shared helper, because the demo
// LEAD forms have to stamp the same id for the engagement events to be
// joinable to a person. Two private copies would drift the moment either
// changed.

export const useDemoViews = () => {
  const [viewCounts, setViewCounts] = useState<ViewCounts>({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch view counts
  const fetchViewCounts = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_demo_view_counts');
      
      if (error) {
        console.error('Failed to fetch demo view counts:', error);
        return;
      }

      if (data) {
        const counts: ViewCounts = {};
        data.forEach((item: { demo_id: string; total_views: number; views_30d: number; views_7d: number }) => {
          counts[item.demo_id] = {
            total_views: item.total_views,
            views_30d: item.views_30d,
            views_7d: item.views_7d,
          };
        });
        setViewCounts(counts);
      }
    } catch (error) {
      console.error('Failed to fetch demo view counts:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchViewCounts();
  }, [fetchViewCounts]);

  // Track a view
  const trackView = useCallback(async (demoId: string) => {
    try {
      const visitorId = getVisitorId();
      const deviceType = getDeviceType();
      
      await supabase.from('demo_engagement').insert({
        demo_id: demoId,
        event_type: 'viewed',
        visitor_id: visitorId,
        device_type: deviceType,
        referrer: document.referrer || null,
      });

      // Update local count optimistically
      setViewCounts(prev => ({
        ...prev,
        [demoId]: {
          total_views: (prev[demoId]?.total_views || 0) + 1,
          views_30d: (prev[demoId]?.views_30d || 0) + 1,
          views_7d: (prev[demoId]?.views_7d || 0) + 1,
        },
      }));
    } catch (error) {
      console.error('Failed to track demo view:', error);
    }
  }, []);

  /**
   * Record progress through a demo. This is the half that was missing: the
   * tracker only ever emitted `viewed`, so "steps completed" and "watch time"
   * — the two things the Demo page is designed around — had no source at all.
   *
   * `step` fires as someone moves through; `completed` fires once at the end.
   * Both carry the same visitor id the lead form stamps, so engagement can be
   * attributed to a person rather than an anonymous browser.
   */
  const trackStep = useCallback(
    async (demoId: string, stepNumber: number, stepId?: string, durationSeconds?: number) => {
      try {
        await supabase.from('demo_engagement').insert({
          demo_id: demoId,
          event_type: 'step',
          visitor_id: getVisitorId(),
          device_type: getDeviceType(),
          step_number: stepNumber,
          step_id: stepId ?? null,
          duration_seconds: durationSeconds ?? null,
        });
      } catch (error) {
        // Tracking must never break the demo the visitor came for.
        console.error('Failed to track demo step:', error);
      }
    },
    [],
  );

  const trackCompleted = useCallback(
    async (demoId: string, durationSeconds?: number, steps?: number) => {
      try {
        await supabase.from('demo_engagement').insert({
          demo_id: demoId,
          event_type: 'completed',
          visitor_id: getVisitorId(),
          device_type: getDeviceType(),
          step_number: steps ?? null,
          duration_seconds: durationSeconds ?? null,
        });
      } catch (error) {
        console.error('Failed to track demo completion:', error);
      }
    },
    [],
  );

  const getViewCount = useCallback((demoId: string) => {
    return viewCounts[demoId]?.total_views || 0;
  }, [viewCounts]);

  const get30dViewCount = useCallback((demoId: string) => {
    return viewCounts[demoId]?.views_30d || 0;
  }, [viewCounts]);

  return {
    viewCounts,
    trackStep,
    trackCompleted,
    isLoading,
    trackView,
    getViewCount,
    get30dViewCount,
    refetch: fetchViewCounts,
  };
};
