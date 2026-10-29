import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

type ActivityType = 'page_view' | 'record_change' | 'search' | 'export_request' | 'filter_change' | 'bulk_action';

// Map paths to friendly page titles
const PAGE_TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/analytics': 'Analytics',
  '/admin/sales-figures': 'Sales Figures',
  '/admin/leads': 'Leads',
  '/admin/leads-booked': 'Booked Leads',
  '/admin/investor-leads': 'Investor Leads',
  '/admin/meetings': 'Meetings',
  '/admin/discovery-meetings': 'Discovery Meetings',
  '/admin/solution-meetings': 'Solution Meetings',
  '/admin/personal-meetings': 'Personal Meetings',
  '/admin/ghl-submissions': 'GHL Submissions',
  '/admin/ghl-sync': 'GHL Sync Status',
  '/admin/demo-leads': 'Demo Leads',
  '/admin/job-applications': 'Job Applications',
  '/admin/quotes': 'Quotes',
  '/admin/tidy-up': 'Data Tidy Up',
  '/admin/handover-queue': 'Handover Queue',
  '/admin/documents': 'Documents',
  '/admin/registrations': 'Event Registrations',
  '/admin/webinars': 'Webinars',
  '/admin/guides': 'Guides & Playbooks',
  '/admin/blog': 'Blog Posts',
  '/admin/testimonials': 'Testimonials',
  '/admin/faqs': 'FAQs',
  '/admin/docs': 'Documentation',
  '/admin/jobs': 'Job Openings',
  '/admin/settings/users': 'User Management',
  '/admin/settings/activity': 'Activity Log',
  '/admin/settings/jobs': 'Scheduled Jobs',
  '/admin/settings/emails': 'Email Templates',
  '/admin/settings/email-logs': 'Email Logs',
  '/admin/settings/email-delivery': 'Email Analytics',
  '/admin/settings/newsletter': 'Newsletter Subscribers',
  '/admin/settings/sitemap': 'Sitemap',
  '/admin/settings/performance': 'Performance',
  '/admin/settings/feature-flags': 'Feature Flags',
  '/admin/settings/search-analytics': 'Search Analytics',
  '/admin/settings/account': 'Account Settings',
  '/admin/settings/theme': 'Theme Settings',
  '/admin/settings/user-activity': 'User Activity Tracker',
  '/admin/settings/export-requests': 'Export Requests',
  '/admin/connectors': 'Connectors',
};

function getPageTitle(path: string): string {
  // Exact match first
  if (PAGE_TITLES[path]) return PAGE_TITLES[path];
  // Try base path (for /admin/blog/123 → Blog Posts)
  const basePath = path.replace(/\/[^/]+$/, '');
  if (PAGE_TITLES[basePath]) return PAGE_TITLES[basePath];
  return path;
}

export function useActivityTracker() {
  const location = useLocation();
  const { user, isLoading } = useAdminAuth();
  const lastPath = useRef<string>('');
  const isAdmin = location.pathname.startsWith('/admin');

  // Log page views automatically
  useEffect(() => {
    if (!isAdmin || isLoading || !user?.id || !user?.email) return;
    if (location.pathname === lastPath.current) return;
    lastPath.current = location.pathname;

    const logPageView = async () => {
      try {
        await supabase.from('admin_page_views').insert([{
          user_id: user.id,
          user_email: user.email!,
          activity_type: 'page_view',
          page_path: location.pathname,
          page_title: getPageTitle(location.pathname),
          user_agent: navigator.userAgent,
        }]);
      } catch (err) {
        console.error('Failed to log page view:', err);
      }
    };

    logPageView();
  }, [location.pathname, user?.id, user?.email, isLoading, isAdmin]);

  // Manual activity logging
  const logActivity = useCallback(
    async (activityType: ActivityType, details?: Record<string, Json>, pagePath?: string) => {
      if (!user?.id || !user?.email) return;
      try {
        await supabase.from('admin_page_views').insert([{
          user_id: user.id,
          user_email: user.email!,
          activity_type: activityType,
          page_path: pagePath || location.pathname,
          page_title: getPageTitle(pagePath || location.pathname),
          details: details || {},
          user_agent: navigator.userAgent,
        }]);
      } catch (err) {
        console.error('Failed to log activity:', err);
      }
    },
    [user?.id, user?.email, location.pathname]
  );

  return { logActivity };
}
