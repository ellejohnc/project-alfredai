import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ViewCounts {
  [blogId: string]: {
    total_views: number;
    views_30d: number;
    views_7d: number;
  };
}

// Generate a simple visitor ID for tracking unique views
const getVisitorId = (): string => {
  const key = 'alfred_visitor_id';
  let visitorId = localStorage.getItem(key);
  if (!visitorId) {
    visitorId = `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(key, visitorId);
  }
  return visitorId;
};

export const useBlogViews = () => {
  const [viewCounts, setViewCounts] = useState<ViewCounts>({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch view counts
  const fetchViewCounts = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_blog_view_counts');
      
      if (error) {
        console.error('Failed to fetch view counts:', error);
        return;
      }

      if (data) {
        const counts: ViewCounts = {};
        data.forEach((item: { blog_id: string; total_views: number; views_30d: number; views_7d: number }) => {
          counts[item.blog_id] = {
            total_views: item.total_views,
            views_30d: item.views_30d,
            views_7d: item.views_7d,
          };
        });
        setViewCounts(counts);
      }
    } catch (error) {
      console.error('Failed to fetch view counts:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchViewCounts();
  }, [fetchViewCounts]);

  // Track a view
  const trackView = useCallback(async (blogId: string) => {
    try {
      const visitorId = getVisitorId();
      
      await supabase.from('blog_views').insert({
        blog_id: blogId,
        visitor_id: visitorId,
      });

      // Update local count
      setViewCounts(prev => ({
        ...prev,
        [blogId]: {
          total_views: (prev[blogId]?.total_views || 0) + 1,
          views_30d: (prev[blogId]?.views_30d || 0) + 1,
          views_7d: (prev[blogId]?.views_7d || 0) + 1,
        },
      }));
    } catch (error) {
      console.error('Failed to track view:', error);
    }
  }, []);

  const getViewCount = useCallback((blogId: string) => {
    return viewCounts[blogId]?.total_views || 0;
  }, [viewCounts]);

  const get30dViewCount = useCallback((blogId: string) => {
    return viewCounts[blogId]?.views_30d || 0;
  }, [viewCounts]);

  return {
    viewCounts,
    isLoading,
    trackView,
    getViewCount,
    get30dViewCount,
    refetch: fetchViewCounts,
  };
};
