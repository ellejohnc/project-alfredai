import { useEffect, useState } from 'react';

/**
 * Client-side feature flag for the Phase 1 unified Leads Inbox.
 *
 * Stored in localStorage under `admin_unified_leads`. While OFF the inbox keeps
 * its existing (source-chip) behaviour so the current admin is untouched; when
 * flipped ON it adds the Gmail-style segment tabs, GHL sync dots, per-row
 * actions and the contextual lead detail page.
 *
 * Toggle from the browser console:
 *   localStorage.setItem('admin_unified_leads', 'true')
 */
export const UNIFIED_LEADS_FLAG = 'admin_unified_leads';

function read(): boolean {
  // ON by default for everyone. Rollback path: a user can force-disable by
  // setting localStorage `admin_unified_leads` to the string 'false'.
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(UNIFIED_LEADS_FLAG) !== 'false';
  } catch {
    return true;
  }
}

export function isUnifiedLeadsEnabled(): boolean {
  return read();
}

export function useUnifiedLeadsFlag(): boolean {
  const [enabled, setEnabled] = useState<boolean>(read);

  useEffect(() => {
    const sync = () => setEnabled(read());
    // React to changes from other tabs and in-app toggles.
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  return enabled;
}
