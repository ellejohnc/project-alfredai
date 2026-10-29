import { useState, useEffect, useCallback } from "react";
import { 
  getStoredCredentials, 
  getVisitorSession, 
  updateVisitorSession,
  getOrCreateVisitorSession 
} from "@/lib/visitorSession";

export interface LeadIdentity {
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
}

interface UseLeadIdentityResult {
  leadIdentity: LeadIdentity;
  isLoading: boolean;
  updateLeadIdentity: (updates: Partial<LeadIdentity>) => Promise<void>;
  clearLeadIdentity: () => void;
}

const LOCAL_STORAGE_KEY = "alfred_lead_identity";
const LEGACY_STORAGE_KEY = "lead_identity";

/**
 * Merge legacy `lead_identity` key into the canonical `alfred_lead_identity`.
 * Canonical values take priority; legacy fills in gaps.
 */
function mergeWithLegacy(canonical: LeadIdentity): LeadIdentity {
  try {
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacy) return canonical;
    const parsed = JSON.parse(legacy);
    const merged: LeadIdentity = { ...canonical };
    // Fill gaps from legacy
    if (!merged.name && (parsed.firstName || parsed.lastName)) {
      merged.name = `${parsed.firstName || ''} ${parsed.lastName || ''}`.trim();
    }
    if (!merged.firstName && parsed.firstName) merged.firstName = parsed.firstName;
    if (!merged.lastName && parsed.lastName) merged.lastName = parsed.lastName;
    if (!merged.email && parsed.email) merged.email = parsed.email;
    if (!merged.phone && parsed.phone) merged.phone = parsed.phone;
    if (!merged.company && parsed.company) merged.company = parsed.company;
    return merged;
  } catch {
    return canonical;
  }
}

/** Write to both storage keys for backward compat */
function dualWrite(identity: LeadIdentity) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(identity));
    // Legacy compat shape (DemoLeadCaptureModal reads firstName/lastName)
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify({
      firstName: identity.firstName || identity.name?.split(' ')[0] || '',
      lastName: identity.lastName || identity.name?.split(' ').slice(1).join(' ') || '',
      email: identity.email || '',
      phone: identity.phone || '',
      company: identity.company || '',
    }));
  } catch {
    // localStorage unavailable (private browsing edge case) — fail silently
  }
}

/**
 * Hook to manage lead identity persistence
 * - Syncs with visitor session in database
 * - Falls back to localStorage for quick access
 * - Merges legacy `lead_identity` key on init
 * - Dual-writes for backward compat
 * - Auto-loads on mount
 */
export function useLeadIdentity(): UseLeadIdentityResult {
  const [leadIdentity, setLeadIdentity] = useState<LeadIdentity>(() => {
    // Initialize from localStorage, merging legacy key
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      const canonical: LeadIdentity = stored ? JSON.parse(stored) : {};
      const merged = mergeWithLegacy(canonical);
      // Persist merged result back to both keys
      if (Object.keys(merged).length > 0) {
        dualWrite(merged);
      }
      return merged;
    } catch {
      return {};
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load from visitor session on mount
  useEffect(() => {
    async function loadFromSession() {
      try {
        const credentials = getStoredCredentials();
        if (credentials) {
          const session = await getVisitorSession(credentials.sessionId, credentials.sessionToken);
          if (session) {
            const identity: LeadIdentity = {
              name: session.name || undefined,
              email: session.email || undefined,
              company: session.company || undefined,
              // Note: phone is stored in localStorage only since visitor_sessions doesn't have phone column
            };
            
            // Merge with localStorage (localStorage may have more recent data)
            const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (localData) {
              const parsed = JSON.parse(localData);
              // Prefer localStorage values if they exist
              Object.keys(parsed).forEach(key => {
                if (parsed[key]) {
                  (identity as Record<string, unknown>)[key] = parsed[key];
                }
              });
            }
            
            setLeadIdentity(identity);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(identity));
          }
        }
      } catch (error) {
        console.error("Failed to load lead identity from session:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadFromSession();
  }, []);

  const updateLeadIdentity = useCallback(async (updates: Partial<LeadIdentity>) => {
    // Update local state immediately
    setLeadIdentity(prev => {
      const newIdentity = { ...prev, ...updates };
      // Dual-write to both keys
      dualWrite(newIdentity);
      return newIdentity;
    });

    // Sync to visitor session in background
    try {
      let credentials = getStoredCredentials();
      if (!credentials) {
        credentials = await getOrCreateVisitorSession();
      }
      
      if (credentials) {
        await updateVisitorSession({
          name: updates.name || updates.firstName && updates.lastName 
            ? `${updates.firstName || ''} ${updates.lastName || ''}`.trim() 
            : undefined,
          email: updates.email,
          company: updates.company,
        });
      }
    } catch (error) {
      console.error("Failed to sync lead identity to session:", error);
    }
  }, []);

  const clearLeadIdentity = useCallback(() => {
    setLeadIdentity({});
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }, []);

  return {
    leadIdentity,
    isLoading,
    updateLeadIdentity,
    clearLeadIdentity,
  };
}

/**
 * Get lead identity synchronously from localStorage
 * Useful for components that need immediate access without async
 */
export function getLeadIdentitySync(): LeadIdentity {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    const canonical: LeadIdentity = stored ? JSON.parse(stored) : {};
    return mergeWithLegacy(canonical);
  } catch {
    return {};
  }
}
