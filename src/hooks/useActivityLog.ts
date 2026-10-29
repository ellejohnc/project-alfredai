import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

type LogAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'password_changed';
type ResourceType = 'blog_post' | 'webinar' | 'guide' | 'testimonial' | 'faq' | 'documentation' | 'user' | 'invitation' | 'session' | 'job_opening';

interface LogParams {
  action: LogAction;
  resourceType: ResourceType;
  resourceId?: string;
  resourceName?: string;
  details?: Record<string, any>;
  ipAddress?: string;
}

// Utility to get client IP (fallback, actual IP comes from server)
async function getClientIP(): Promise<string | null> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || null;
  } catch {
    return null;
  }
}

export function useActivityLog() {
  const { user } = useAdminAuth();

  const logActivity = async ({ action, resourceType, resourceId, resourceName, details = {}, ipAddress }: LogParams) => {
    if (!user) return;

    try {
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        user_email: user.email || '',
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        resource_name: resourceName,
        details,
        ip_address: ipAddress || null,
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  };

  return { logActivity, getClientIP };
}

// Standalone function for logging without hook context (for auth events)
export async function logAuthActivity(params: {
  userId: string;
  userEmail: string;
  action: 'login' | 'logout';
  details?: Record<string, any>;
}) {
  try {
    // Get IP address
    let ipAddress: string | null = null;
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      ipAddress = data.ip || null;
    } catch {
      // Silently fail IP lookup
    }

    await supabase.from('activity_logs').insert({
      user_id: params.userId,
      user_email: params.userEmail,
      action: params.action,
      resource_type: 'session',
      resource_name: params.action === 'login' ? 'Admin Login' : 'Admin Logout',
      details: {
        ...params.details,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
      },
      ip_address: ipAddress,
    });
  } catch (error) {
    console.error('Failed to log auth activity:', error);
  }
}
