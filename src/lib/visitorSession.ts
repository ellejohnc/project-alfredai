import { supabase } from "@/integrations/supabase/client";

const SESSION_STORAGE_KEY = "alfred_visitor_session";
const TOKEN_STORAGE_KEY = "alfred_visitor_token";

interface SessionCredentials {
  sessionId: string;
  sessionToken: string;
}

interface VisitorSession {
  id: string;
  name?: string;
  email?: string;
  company?: string;
  industry?: string;
  team_size?: string;
  pain_points?: string[];
  current_tools?: string[];
  goals?: string[];
  budget_range?: string;
  recommended_demos?: string[];
  source?: string;
  primary_challenge?: string;
  workflows_to_automate?: string[];
  pain_level?: string;
  timeline?: string;
  personalization?: Record<string, unknown>;
  utm_params?: Record<string, unknown>;
  roi_inputs?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
  last_accessed_at?: string;
}

/**
 * Get stored session credentials from localStorage
 */
export function getStoredCredentials(): SessionCredentials | null {
  try {
    const sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    const sessionToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    
    if (sessionId && sessionToken) {
      return { sessionId, sessionToken };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Store session credentials in localStorage
 */
function storeCredentials(credentials: SessionCredentials): void {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, credentials.sessionId);
    localStorage.setItem(TOKEN_STORAGE_KEY, credentials.sessionToken);
  } catch (error) {
    console.error("Failed to store session credentials:", error);
  }
}

/**
 * Clear stored session credentials
 */
export function clearStoredCredentials(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear session credentials:", error);
  }
}

/**
 * Create a new visitor session
 */
export async function createVisitorSession(
  initialData?: Partial<VisitorSession>
): Promise<{ sessionId: string; sessionToken: string } | null> {
  try {
    const { data, error } = await supabase.functions.invoke("visitor-session", {
      body: {
        action: "create",
        data: initialData || {},
      },
    });

    if (error) {
      console.error("Failed to create visitor session:", error);
      return null;
    }

    if (data?.success && data.sessionId && data.sessionToken) {
      const credentials = { 
        sessionId: data.sessionId, 
        sessionToken: data.sessionToken 
      };
      storeCredentials(credentials);
      return credentials;
    }

    return null;
  } catch (error) {
    console.error("Failed to create visitor session:", error);
    return null;
  }
}

/**
 * Get visitor session by ID (requires valid token)
 */
export async function getVisitorSession(
  sessionId?: string,
  sessionToken?: string
): Promise<VisitorSession | null> {
  try {
    // Use provided credentials or fall back to stored ones
    const credentials = sessionId && sessionToken
      ? { sessionId, sessionToken }
      : getStoredCredentials();

    if (!credentials) {
      return null;
    }

    const { data, error } = await supabase.functions.invoke("visitor-session", {
      body: {
        action: "get",
        sessionId: credentials.sessionId,
        sessionToken: credentials.sessionToken,
      },
    });

    if (error) {
      console.error("Failed to get visitor session:", error);
      return null;
    }

    return data?.session || null;
  } catch (error) {
    console.error("Failed to get visitor session:", error);
    return null;
  }
}

/**
 * Update visitor session (requires valid token)
 */
export async function updateVisitorSession(
  updates: Partial<VisitorSession>,
  sessionId?: string,
  sessionToken?: string
): Promise<VisitorSession | null> {
  try {
    // Use provided credentials or fall back to stored ones
    const credentials = sessionId && sessionToken
      ? { sessionId, sessionToken }
      : getStoredCredentials();

    if (!credentials) {
      console.error("No session credentials available for update");
      return null;
    }

    const { data, error } = await supabase.functions.invoke("visitor-session", {
      body: {
        action: "update",
        sessionId: credentials.sessionId,
        sessionToken: credentials.sessionToken,
        data: updates,
      },
    });

    if (error) {
      console.error("Failed to update visitor session:", error);
      return null;
    }

    return data?.session || null;
  } catch (error) {
    console.error("Failed to update visitor session:", error);
    return null;
  }
}

/**
 * Get or create a visitor session
 */
export async function getOrCreateVisitorSession(): Promise<SessionCredentials | null> {
  const existing = getStoredCredentials();
  
  if (existing) {
    // Verify the session still exists
    const session = await getVisitorSession(existing.sessionId, existing.sessionToken);
    if (session) {
      return existing;
    }
    // Session invalid, clear and create new
    clearStoredCredentials();
  }

  return createVisitorSession();
}
