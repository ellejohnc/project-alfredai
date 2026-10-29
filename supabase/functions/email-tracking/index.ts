import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 1x1 transparent GIF for open tracking pixel
const TRACKING_PIXEL = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00,
  0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00,
  0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
  0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b
]);

interface TrackingToken {
  id: string;
  log_id: string;
  tracking_type: string;
  target_url: string | null;
  trigger_count: number;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("t");
    const action = url.searchParams.get("a"); // 'open' or 'click'

    if (!token) {
      return new Response("Missing token", { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get tracking info
    const { data: tracking, error: trackingError } = await supabase
      .from("email_tracking_tokens")
      .select("id, log_id, tracking_type, target_url, trigger_count")
      .eq("token", token)
      .single() as { data: TrackingToken | null; error: unknown };

    if (trackingError || !tracking) {
      console.error("Tracking token not found:", token);
      // For open pixels, still return the image
      if (action === "open") {
        return new Response(TRACKING_PIXEL, {
          headers: {
            ...corsHeaders,
            "Content-Type": "image/gif",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        });
      }
      return new Response("Invalid token", { status: 404, headers: corsHeaders });
    }

    const isFirstTrigger = tracking.trigger_count === 0;
    const now = new Date().toISOString();

    // Get request metadata. Hash the IP for privacy/GDPR (do not store raw IP).
    const userAgent = req.headers.get("user-agent") || null;
    const forwardedFor = req.headers.get("x-forwarded-for");
    const rawIp = forwardedFor?.split(",")[0]?.trim() || null;
    let ipHash: string | null = null;
    if (rawIp) {
      const hashBuf = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(rawIp),
      );
      ipHash = Array.from(new Uint8Array(hashBuf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
        .slice(0, 16);
    }

    // Update tracking token
    const updateData: Record<string, unknown> = {
      trigger_count: tracking.trigger_count + 1,
    };
    if (isFirstTrigger) {
      updateData.first_triggered_at = now;
    }

    await supabase
      .from("email_tracking_tokens")
      .update(updateData)
      .eq("id", tracking.id);

    // Update email log based on tracking type
    if (tracking.tracking_type === "open") {
      // Get current count
      const { data: currentLog } = await supabase
        .from("email_logs")
        .select("opened_count")
        .eq("id", tracking.log_id)
        .single() as { data: { opened_count: number } | null };

      const logUpdate: Record<string, unknown> = {
        opened_count: (currentLog?.opened_count || 0) + 1,
        user_agent: userAgent,
        // Store hashed IP only — raw IPs are PII under GDPR/etc.
        ip_address: ipHash,
      };

      if (isFirstTrigger) {
        logUpdate.opened_at = now;
        logUpdate.delivery_status = "opened";
      }

      await supabase
        .from("email_logs")
        .update(logUpdate)
        .eq("id", tracking.log_id);

      // Return tracking pixel
      return new Response(TRACKING_PIXEL, {
        headers: {
          ...corsHeaders,
          "Content-Type": "image/gif",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      });
    } else if (tracking.tracking_type === "click") {
      // Get current count
      const { data: currentLog } = await supabase
        .from("email_logs")
        .select("click_count")
        .eq("id", tracking.log_id)
        .single() as { data: { click_count: number } | null };

      const logUpdate: Record<string, unknown> = {
        click_count: (currentLog?.click_count || 0) + 1,
      };

      if (isFirstTrigger) {
        logUpdate.clicked_at = now;
        logUpdate.delivery_status = "clicked";
      }

      await supabase
        .from("email_logs")
        .update(logUpdate)
        .eq("id", tracking.log_id);

      // Redirect to target URL
      if (tracking.target_url) {
        return new Response(null, {
          status: 302,
          headers: {
            ...corsHeaders,
            "Location": tracking.target_url,
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        });
      }

      return new Response("Tracked", { status: 200, headers: corsHeaders });
    }

    return new Response("Unknown tracking type", { status: 400, headers: corsHeaders });
  } catch (error) {
    console.error("Email tracking error:", error);
    // Still return pixel for opens to prevent broken images
    return new Response(TRACKING_PIXEL, {
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        ...corsHeaders,
      },
    });
  }
});
