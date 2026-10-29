import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, ghlFetch, GHL_LOCATION_ID, requireAdmin, GHL_V3 } from "../_shared/ghlClient.ts";

/**
 * Multi-channel outbound message via GHL for a contact.
 *
 * Body: { contact_id, channel: 'SMS' | 'WhatsApp' | 'Email', message, subject? }
 * GHL resolves the conversation from contactId + type; no from-address needed.
 * Always returns 200 with { success: boolean, error? } so the UI never crashes.
 */
const CHANNELS = new Set(["SMS", "WhatsApp", "Email"]);

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

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
    const channel = String(body?.channel || "SMS").trim();
    const subject = String(body?.subject || "").trim();
    const attachments: string[] = Array.isArray(body?.attachments)
      ? body.attachments.map((u: unknown) => String(u)).filter(Boolean).slice(0, 5)
      : [];

    if (!contactId) return json({ success: false, error: "contact_id is required" });
    if (!message && attachments.length === 0) {
      return json({ success: false, error: "A message or at least one attachment is required" });
    }
    if (!CHANNELS.has(channel)) {
      return json({ success: false, error: `Unsupported channel: ${channel}` });
    }
    if (channel !== "Email" && message.length > 1600) {
      return json({ success: false, error: "Message too long (max 1600 chars)" });
    }
    if (channel === "Email" && message.length > 20000) {
      return json({ success: false, error: "Email too long (max 20000 chars)" });
    }

    const payload: Record<string, unknown> =
      channel === "Email"
        ? {
            type: "Email",
            contactId,
            subject: subject || "Message from AlfredAI",
            html: `<div>${escapeHtml(message).replace(/\n/g, "<br/>")}</div>`,
            message,
          }
        : { type: channel, contactId, message };
    if (attachments.length > 0) payload.attachments = attachments;

    let res = await ghlFetch("/conversations/messages", {
      apiKey,
      method: "POST",
      body: payload,
      version: GHL_V3,
    });

    // A contact with no thread yet can fail with 404/400 "conversation not
    // found" — create the thread and retry once so brand-new contacts are
    // reachable from the composer.
    if (!res.ok && (res.status === 404 || res.status === 400)) {
      const probe = await res.clone().text().catch(() => "");
      if (/conversation/i.test(probe)) {
        const cRes = await ghlFetch("/conversations/", {
          apiKey,
          method: "POST",
          body: { locationId: GHL_LOCATION_ID, contactId },
          version: GHL_V3,
        });
        if (cRes.ok) {
          res = await ghlFetch("/conversations/messages", {
            apiKey,
            method: "POST",
            body: payload,
            version: GHL_V3,
          });
        }
      }
    }

    const text = await res.text();
    if (!res.ok) {
      console.error("[ghl-send-message] send failed", channel, res.status, text);
      return json({
        success: false,
        error: `GHL ${channel} send failed (${res.status}): ${text.slice(0, 250)}`,
      });
    }
    let parsed: any = null;
    try { parsed = JSON.parse(text); } catch { /* ignore */ }
    return json({
      success: true,
      channel,
      conversationId: parsed?.conversationId ?? null,
      messageId: parsed?.messageId ?? null,
    });
  } catch (err) {
    console.error("[ghl-send-message] error", err);
    return json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});
