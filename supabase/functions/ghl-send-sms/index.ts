import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, ghlFetch, requireAdmin, GHL_V3 } from "../_shared/ghlClient.ts";

/**
 * Send an SMS via GHL for a contact.
 * Body: { contact_id, message }
 * GHL resolves the conversation from contactId + channel; no from-number needed.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const json = (obj: unknown, status = 200) =>
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
    if (!auth.ok) return json({ success: false, error: auth.error });

    const apiKey = Deno.env.get("GHL_API_KEY");
    if (!apiKey) return json({ success: false, error: "GHL_API_KEY missing" });

    const body = await req.json().catch(() => ({}));
    const contactId = String(body?.contact_id || "").trim();
    const message = String(body?.message || "").trim();
    if (!contactId || !message) {
      return json({ success: false, error: "contact_id and message are required" });
    }
    if (message.length > 1600) {
      return json({ success: false, error: "Message too long (max 1600 chars)" });
    }

    const res = await ghlFetch("/conversations/messages", {
      apiKey,
      method: "POST",
      body: { type: "SMS", contactId, message },
      version: GHL_V3,
    });
    const text = await res.text();
    if (!res.ok) {
      console.error("[ghl-send-sms] send failed", res.status, text);
      return json({
        success: false,
        error: `GHL send failed (${res.status}): ${text.slice(0, 250)}`,
      });
    }
    let parsed: any = null;
    try { parsed = JSON.parse(text); } catch { /* ignore */ }
    return json({
      success: true,
      conversationId: parsed?.conversationId ?? null,
      messageId: parsed?.messageId ?? null,
    });
  } catch (err) {
    console.error("[ghl-send-sms] error", err);
    return json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});
