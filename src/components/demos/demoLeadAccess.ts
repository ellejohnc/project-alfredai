/**
 * Who has already given us their details, and what we remember about them.
 *
 * Split out of DemoLeadCaptureModal so that component can hot-reload: a file
 * exporting both a component and plain functions makes React Fast Refresh give
 * up and full-reload the page.
 */

import { getLeadIdentitySync } from "@/hooks/useLeadIdentity";
import { getUTMData, isFromMetaAds } from "@/lib/utmTracking";
import { supabase } from "@/integrations/supabase/client";

// Check if user has already provided info (within 7 days)
export function hasRecentDemoAccess(): boolean {
  try {
    const stored = localStorage.getItem(DEMO_ACCESS_KEY);
    if (!stored) return false;
    const { timestamp } = JSON.parse(stored);
    const daysSince = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
    return daysSince < 7; // 7-day access window
  } catch {
    return false;
  }
}

/**
 * Combined bypass check: skip lead capture if returning visitor OR traffic from Meta/Facebook ads.
 * Use this instead of hasRecentDemoAccess() to respect all bypass rules.
 */

/**
 * Combined bypass check: skip lead capture if returning visitor OR traffic from Meta/Facebook ads.
 * Use this instead of hasRecentDemoAccess() to respect all bypass rules.
 */
export function shouldBypassLeadCapture(): boolean {
  return hasRecentDemoAccess() || isFromMetaAds();
}

// Get stored lead identity for silent tracking

// Get stored lead identity for silent tracking
export function getStoredLeadIdentity(): { email: string; name: string; phone?: string; company?: string } | null {
  try {
    const identity = getLeadIdentitySync();
    if (!identity.email && !identity.name) return null;
    return {
      email: identity.email || '',
      name: identity.name || `${identity.firstName || ''} ${identity.lastName || ''}`.trim(),
      phone: identity.phone,
      company: identity.company,
    };
  } catch {
    return null;
  }
}

// Silently log demo access for returning visitors (no form shown)

// Silently log demo access for returning visitors (no form shown)
export async function logSilentDemoAccess(demoId: string, demoTitle: string): Promise<void> {
  const identity = getStoredLeadIdentity();
  const utmData = getUTMData();
  const fromMeta = isFromMetaAds();
  
  // For Meta ad visitors without identity, still log engagement
  if (!identity || !identity.email) {
    if (fromMeta) {
      try {
        await supabase.functions.invoke('queue-demo-lead', {
          body: {
            lead_email: 'meta_ads_visitor@unknown',
            lead_name: 'Meta Ads Visitor',
            source_page: `/resources/demos/${demoId}`,
            source_medium: "meta_ads_bypass",
            source_campaign: `demo_${demoId}`,
            lead_source: "meta_ads",
            demo_title: demoTitle,
            demo_id: demoId,
            is_return_visit: true,
            utm_data: utmData,
          }
        });
      } catch (err) {
        console.error('Meta ads bypass logging failed:', err);
      }
    }
    return;
  }
  
  try {
    await supabase.functions.invoke('queue-demo-lead', {
      body: {
        lead_email: identity.email,
        lead_name: identity.name,
        lead_phone: identity.phone,
        lead_company: identity.company,
        source_page: `/resources/demos/${demoId}`,
        source_medium: fromMeta ? "meta_ads_bypass" : "demo_return_visit",
        source_campaign: `demo_${demoId}`,
        lead_source: fromMeta ? "meta_ads" : "demo_return",
        demo_title: demoTitle,
        demo_id: demoId,
        is_return_visit: !fromMeta, // Meta ads first visits should trigger full processing + email
        utm_data: utmData,
      }
    });
  } catch (err) {
    console.error('Silent demo access logging failed:', err);
  }
}

export const DEMO_ACCESS_KEY = "demo_lead_captured";

export function storeDemoAccess(email: string): void {
  localStorage.setItem(DEMO_ACCESS_KEY, JSON.stringify({
    email,
    timestamp: Date.now()
  }));
}
