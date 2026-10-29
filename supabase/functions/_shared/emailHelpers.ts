import { SupabaseClient } from "npm:@supabase/supabase-js@2";

/**
 * Shared email helper functions for suppression checking and tracking
 */

export interface EmailSendOptions {
  recipientEmail: string;
  templateKey: string;
  subject: string;
  functionName: string;
  metadata?: Record<string, unknown>;
  links?: string[]; // URLs to track clicks
}

export interface TrackingInfo {
  openToken: string;
  clickTokens: Record<string, string>;
  pixelUrl: string;
}

/**
 * Check if an email address is suppressed (bounced, unsubscribed, etc.)
 */
export async function isEmailSuppressed(
  supabase: SupabaseClient,
  email: string
): Promise<{ suppressed: boolean; reason?: string }> {
  try {
    const { data, error } = await supabase
      .rpc("is_email_suppressed", { check_email: email.toLowerCase() }) as { data: boolean | null; error: unknown };
    
    if (error) {
      console.error("Error checking email suppression:", error);
      return { suppressed: false }; // Fail open - allow send if check fails
    }
    
    if (data) {
      // Get the reason
      const { data: suppression } = await supabase
        .from("email_suppressions")
        .select("reason, bounce_type")
        .eq("email", email.toLowerCase())
        .single() as { data: { reason?: string; bounce_type?: string } | null };
      
      return {
        suppressed: true,
        reason: suppression?.reason || "unknown",
      };
    }
    
    return { suppressed: false };
  } catch (err) {
    console.error("Email suppression check failed:", err);
    return { suppressed: false };
  }
}

/**
 * Suppress an email address after a bounce
 */
export async function suppressBouncedEmail(
  supabase: SupabaseClient,
  email: string,
  logId: string,
  bounceType: "hard" | "soft",
  bounceMessage?: string
): Promise<void> {
  try {
    const reason = bounceType === "hard" ? "hard_bounce" : "soft_bounce";
    
    await supabase.rpc("suppress_email", {
      p_email: email.toLowerCase(),
      p_reason: reason,
      p_source_log_id: logId,
      p_bounce_type: bounceType,
      p_bounce_message: bounceMessage || null,
      p_expires_days: bounceType === "soft" ? 7 : null, // Soft bounces expire after 7 days
    });
    
    // Also update the email log
    await supabase
      .from("email_logs")
      .update({
        delivery_status: "bounced",
        bounced_at: new Date().toISOString(),
        bounce_type: bounceType,
        bounce_reason: bounceMessage,
      })
      .eq("id", logId);
    
    console.log(`Email suppressed: ${email} (${reason})`);
  } catch (err) {
    console.error("Failed to suppress email:", err);
  }
}

/**
 * Create tracking tokens for an email
 */
export async function createEmailTracking(
  supabase: SupabaseClient,
  logId: string,
  links: string[] = []
): Promise<TrackingInfo | null> {
  try {
    const { data, error } = await supabase.rpc("create_email_tracking", {
      p_log_id: logId,
      p_links: links,
    }) as { data: Array<{ open_token: string; click_tokens: Record<string, string> }> | null; error: unknown };
    
    if (error) {
      console.error("Failed to create tracking:", error);
      return null;
    }
    
    const result = data?.[0];
    if (!result) return null;
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const trackingBaseUrl = `${supabaseUrl}/functions/v1/email-tracking`;
    
    return {
      openToken: result.open_token,
      clickTokens: result.click_tokens || {},
      pixelUrl: `${trackingBaseUrl}?t=${result.open_token}&a=open`,
    };
  } catch (err) {
    console.error("Tracking creation failed:", err);
    return null;
  }
}

/**
 * Get tracked click URL
 */
export function getTrackedClickUrl(
  clickTokens: Record<string, string>,
  originalUrl: string
): string {
  const token = clickTokens[originalUrl];
  if (!token) return originalUrl;
  
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  return `${supabaseUrl}/functions/v1/email-tracking?t=${token}&a=click`;
}

/**
 * Inject tracking pixel into HTML email
 */
export function injectTrackingPixel(html: string, pixelUrl: string): string {
  // Insert tracking pixel before closing body tag
  const closingBodyIndex = html.lastIndexOf("</body>");
  if (closingBodyIndex !== -1) {
    const pixel = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none;width:1px;height:1px;border:0;" />`;
    return html.slice(0, closingBodyIndex) + pixel + html.slice(closingBodyIndex);
  }
  // If no body tag, append to end
  return html + `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none;" />`;
}

/**
 * Replace links in HTML with tracked versions
 */
export function replaceLinksWithTracked(
  html: string,
  clickTokens: Record<string, string>
): string {
  let result = html;
  
  for (const [originalUrl, token] of Object.entries(clickTokens)) {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const trackedUrl = `${supabaseUrl}/functions/v1/email-tracking?t=${token}&a=click`;
    
    // Replace href attributes
    const hrefPattern = new RegExp(`href=["']${escapeRegExp(originalUrl)}["']`, "g");
    result = result.replace(hrefPattern, `href="${trackedUrl}"`);
  }
  
  return result;
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Log email send to database
 */
export async function logEmailSend(
  supabase: SupabaseClient,
  options: EmailSendOptions & { status: "sent" | "failed"; errorMessage?: string }
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("email_logs")
      .insert({
        template_key: options.templateKey,
        recipient_email: options.recipientEmail,
        subject: options.subject,
        status: options.status,
        delivery_status: options.status === "sent" ? "delivered" : "failed",
        error_message: options.errorMessage || null,
        metadata: options.metadata || {},
        function_name: options.functionName,
      })
      .select("id")
      .single() as { data: { id: string } | null; error: unknown };
    
    if (error) {
      console.error("Failed to log email:", error);
      return null;
    }
    
    return data?.id || null;
  } catch (err) {
    console.error("Email logging failed:", err);
    return null;
  }
}
