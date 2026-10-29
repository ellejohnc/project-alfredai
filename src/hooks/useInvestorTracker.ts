import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface InvestorData {
  id: string;
  isMaster?: boolean;
}

type ActivityType = 'page_view' | 'section_view' | 'button_click' | 'document_view' | 'booking_click' | 'download';

const SECTION_TITLES: Record<string, string> = {
  '/investors': 'Investor Portal Home',
  '/investors#traction': 'Traction & Metrics',
  '/investors#product': 'Product Showcase',
  '/investors#revenue': 'Revenue Projections',
  '/investors#team': 'Team',
  '/investors#expansion': 'Geographic Expansion',
};

function getInvestorData(): InvestorData | null {
  try {
    const stored = localStorage.getItem('investor_data');
    if (stored) return JSON.parse(stored);
  } catch {
    // Storage unreadable or the stored value is not valid JSON.
  }
  return null;
}

function getSessionId(): string {
  let sessionId = sessionStorage.getItem('investor_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('investor_session_id', sessionId);
  }
  return sessionId;
}

export function useInvestorTracker() {
  const lastTrackedPath = useRef<string>('');

  // Track page view on mount / path change
  useEffect(() => {
    const investor = getInvestorData();
    if (!investor) return;
    
    const path = window.location.pathname + window.location.hash;
    if (path === lastTrackedPath.current) return;
    lastTrackedPath.current = path;

    trackActivity('page_view', SECTION_TITLES[path] || 'Investor Portal');
  }, []);

  const trackActivity = useCallback(
    async (activityType: ActivityType, pageTitle?: string, metadata?: Record<string, unknown>) => {
      const investor = getInvestorData();
      if (!investor) return;

      try {
        await supabase.from('investor_page_views').insert({
          investor_id: investor.id !== 'master' ? investor.id : null,
          session_id: getSessionId(),
          page_path: window.location.pathname + window.location.hash,
          page_title: pageTitle || document.title,
          activity_type: activityType,
          user_agent: navigator.userAgent,
          referrer: document.referrer || null,
          metadata: {
            ...metadata,
            is_master: investor.isMaster || false,
          },
        });
      } catch (err) {
        console.error('Failed to track investor activity:', err);
      }
    },
    []
  );

  return { trackActivity };
}
