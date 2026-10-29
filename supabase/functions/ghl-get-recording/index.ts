import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  corsHeaders,
  ghlFetch,
  GHL_LOCATION_ID,
  requireAdmin,
  GHL_V3,
} from "../_shared/ghlClient.ts";

/**
 * Proxy a GHL call/voicemail recording so it can be played in the browser.
 * GHL recording URLs are auth-protected — a bare <audio src=...> won't play.
 *
 * Body (POST): { message_id }  OR  query ?message_id=...
 * Returns: binary audio stream with the upstream Content-Type.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const jsonErr = (obj: unknown, status = 200) =>
    new Response(JSON.stringify(obj), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const auth = await requireAdmin(req, supabase);
    if (!auth.ok) return jsonErr({ success: false, error: auth.error });

    const apiKey = Deno.env.get("GHL_API_KEY");
    if (!apiKey) return jsonErr({ success: false, error: "GHL_API_KEY missing" });

    let messageId = "";
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      messageId = String(body?.message_id || "").trim();
    } else {
      messageId = (new URL(req.url).searchParams.get("message_id") || "").trim();
    }
    if (!messageId) return jsonErr({ success: false, error: "Missing message_id" });

    // Standard LC v2 endpoint for a message's recording (audio/mpeg).
    const res = await ghlFetch(
      `/conversations/messages/${encodeURIComponent(messageId)}/locations/${GHL_LOCATION_ID}/recording`,
      { apiKey, accept: "audio/mpeg, */*",
      version: GHL_V3,
    },
    );

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[ghl-get-recording] upstream", res.status, text.slice(0, 200));
      return jsonErr({
        success: false,
        error: `Recording unavailable (${res.status})`,
      });
    }

    const contentType = res.headers.get("content-type") || "audio/mpeg";
    const contentLength = res.headers.get("content-length");

    const headers: Record<string, string> = {
      ...corsHeaders,
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=3600",
    };
    if (contentLength) headers["Content-Length"] = contentLength;

    return new Response(res.body, { status: 200, headers });
  } catch (err) {
    console.error("[ghl-get-recording] error", err);
    return jsonErr({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
});
