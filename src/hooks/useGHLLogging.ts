import { supabase } from '@/integrations/supabase/client';

interface QualificationData {
  role?: string;
  industry?: string;
  challenge?: string;
  size?: string;
  timeline?: string;
}

interface GHLSubmissionData {
  lead_email: string;
  lead_name?: string;
  lead_phone?: string;
  lead_company?: string;
  source_page: string;
  source_medium: string;
  source_campaign?: string;
  lead_source?: 'chatbot' | 'calendar_widget' | 'form' | 'personalization_flow' | 'demo_share' | 'unknown';
  ghl_status?: string;
  ghl_response?: Record<string, unknown>;
  qualification_data?: QualificationData;
  utm_data?: Record<string, unknown>;
  /** Where the visitor came from (document.referrer) — powers "what made them click". */
  referrer?: string;
  /** Full page URL (window.location.href), not just the pathname. */
  source_url?: string;
  /**
   * Browser visitor id, shared with demo_engagement.visitor_id. It is what
   * lets a demo lead be joined to the engagement events that same browser
   * produced — without it the Demo page's Started / Engaged / Completed tiles
   * have nothing to count.
   */
  visitor_id?: string;
}

interface GHLSubmissionResult {
  success: boolean;
  ghl_contact_id?: string;
}

/**
 * Log a GHL submission to the database for tracking
 * Returns the GHL contact ID if the contact was synced successfully
 */
export async function logGHLSubmission(data: GHLSubmissionData): Promise<GHLSubmissionResult> {
  try {
    const { data: responseData, error } = await supabase.functions.invoke('log-ghl-submission', {
      body: data,
    });

    if (error) {
      console.error('Failed to log GHL submission:', error);
      return { success: false };
    }

    console.log('GHL submission logged:', {
      email: data.lead_email,
      source: data.source_page,
      medium: data.source_medium,
      lead_source: data.lead_source,
      ghl_contact_id: responseData?.ghl_contact_id,
    });
    return { 
      success: true, 
      ghl_contact_id: responseData?.ghl_contact_id || undefined,
    };
  } catch (error) {
    console.error('Error logging GHL submission:', error);
    return { success: false };
  }
}


/**
 * Background delivery: the visitor sees "success" straight away while the
 * submission is sent behind the scenes. The payload is queued in localStorage
 * BEFORE sending and removed only once the server confirms, so a slow network,
 * a closed tab or a failed call is retried on the next page load instead of
 * losing the lead.
 */
const PENDING_KEY = 'alfred_pending_ghl_submissions';

function readPending(): Array<{ id: string; data: GHLSubmissionData; tries: number }> {
  try { return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]'); } catch { return []; }
}
function writePending(items: ReturnType<typeof readPending>) {
  try { localStorage.setItem(PENDING_KEY, JSON.stringify(items)); } catch { /* storage full/blocked */ }
}

async function deliver(id: string, data: GHLSubmissionData) {
  const result = await logGHLSubmission(data);
  const items = readPending();
  if (result.success) {
    writePending(items.filter((i) => i.id !== id));
  } else {
    // Give up after 5 attempts so a permanently bad payload doesn't loop forever.
    writePending(items.map((i) => (i.id === id ? { ...i, tries: i.tries + 1 } : i)).filter((i) => i.tries < 5));
  }
  return result;
}

export function logGHLSubmissionInBackground(data: GHLSubmissionData): void {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  writePending([...readPending(), { id, data, tries: 0 }]);
  void deliver(id, data);
}

let flushed = false;
/** Re-send anything left over from an earlier visit. Sequential, once per load. */
export async function flushPendingGHLSubmissions(): Promise<void> {
  if (flushed) return;
  flushed = true;
  for (const item of readPending()) {
    await deliver(item.id, item.data);
  }
}

/**
 * Hook for GHL logging utilities
 */
export function useGHLLogging() {
  return { logGHLSubmission };
}
