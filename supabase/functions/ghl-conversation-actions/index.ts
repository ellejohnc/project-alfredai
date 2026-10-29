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
 * Small write/read helpers for a GHL conversation, kept in one function so the
 * client has a single round-trip surface.
 *
 * Body (POST): { action, ... }
 *   action: 'mark_read'   → { conversation_id }            PUT /conversations/{id}
 *   action: 'message_status' → { message_id }              GET /conversations/messages/{id}
 *   action: 'ensure_conversation' → { contact_id }         POST /conversations/
 *
 * Always 200 with { success, ... } so the UI never crashes on a handled error.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const json = (obj: unknown) =>
    new Response(JSON.stringify(obj), {
      status: 200,
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
    const action = String(body?.action || "").trim();

    if (action === "mark_read") {
      const conversationId = String(body?.conversation_id || "").trim();
      if (!conversationId) return json({ success: false, error: "Missing conversation_id" });
      const res = await ghlFetch(`/conversations/${encodeURIComponent(conversationId)}`, {
        apiKey,
        method: "PUT",
        body: { locationId: GHL_LOCATION_ID, unreadCount: 0 },
        version: GHL_V3,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        return json({ success: false, error: `Mark read failed (${res.status}): ${text.slice(0, 150)}` });
      }
      return json({ success: true });
    }

    if (action === "message_status") {
      const messageId = String(body?.message_id || "").trim();
      if (!messageId) return json({ success: false, error: "Missing message_id" });
      const res = await ghlFetch(`/conversations/messages/${encodeURIComponent(messageId)}`, {
        apiKey,
        version: GHL_V3,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        return json({ success: false, error: `Status unavailable (${res.status}): ${text.slice(0, 150)}` });
      }
      const data: any = await res.json().catch(() => ({}));
      const m = data?.message ?? data;

      // Emails carry their provider outcome on a separate record, so pull it in
      // when the message is an email and we have its email id.
      let emailRec: any = null;
      const emailId = m?.meta?.email?.messageIds?.[0] || m?.meta?.email?.messageId || m?.emailMessageId;
      if (emailId) {
        const eRes = await ghlFetch(`/emails/${encodeURIComponent(String(emailId))}`, { apiKey, version: GHL_V3 });
        if (eRes.ok) emailRec = await eRes.json().catch(() => null);
      }

      // Walk every place GHL/its providers stash an explanation. Report the
      // exact strings back rather than a generic "failed".
      const candidates: Array<{ code: unknown; message: unknown }> = [
        { code: m?.meta?.error?.code, message: m?.meta?.error?.message },
        { code: m?.error?.code, message: m?.error?.message },
        { code: m?.errorCode, message: m?.errorMessage },
        { code: m?.meta?.errorCode, message: m?.meta?.errorMessage },
        { code: m?.meta?.email?.errorCode, message: m?.meta?.email?.errorMessage },
        { code: null, message: m?.statusReason ?? m?.meta?.statusReason },
        { code: null, message: m?.meta?.reason ?? m?.reason },
        { code: emailRec?.errorCode ?? emailRec?.email?.errorCode, message: emailRec?.errorMessage ?? emailRec?.email?.errorMessage },
        { code: null, message: emailRec?.rejectReason ?? emailRec?.email?.rejectReason },
        { code: null, message: emailRec?.bounceReason ?? emailRec?.email?.bounceReason },
      ];
      const hit = candidates.find((c) => (c.message != null && String(c.message).trim()) || (c.code != null && String(c.code).trim()));

      const status = m?.status ?? null;
      const code = hit?.code != null ? String(hit.code) : null;
      const message = hit?.message != null ? String(hit.message) : null;
      const reason = [code ? `[${code}]` : null, message].filter(Boolean).join(" ") || null;

      return json({
        success: true,
        status,
        type: m?.messageType ?? null,
        error_code: code,
        error_message: message,
        reason,
        // Raw provider payload subset so the UI can always show something exact.
        raw_error: m?.meta?.error ?? m?.error ?? emailRec?.error ?? null,
        email_status: emailRec?.status ?? emailRec?.email?.status ?? null,
      });
    }


    if (action === "ensure_conversation") {
      const contactId = String(body?.contact_id || "").trim();
      if (!contactId) return json({ success: false, error: "Missing contact_id" });

      // Reuse an existing thread when there is one — creating duplicates would
      // split the timeline across two conversations.
      const sRes = await ghlFetch(
        `/conversations/search?locationId=${GHL_LOCATION_ID}&contactId=${encodeURIComponent(contactId)}&limit=1`,
        { apiKey,
        version: GHL_V3,
      },
      );
      if (sRes.ok) {
        const sData: any = await sRes.json().catch(() => ({}));
        const existing = Array.isArray(sData?.conversations) ? sData.conversations[0] : null;
        if (existing?.id) return json({ success: true, conversationId: existing.id, created: false });
      }

      const cRes = await ghlFetch("/conversations/", {
        apiKey,
        method: "POST",
        body: { locationId: GHL_LOCATION_ID, contactId },
        version: GHL_V3,
      });
      if (!cRes.ok) {
        const text = await cRes.text().catch(() => "");
        return json({ success: false, error: `Create conversation failed (${cRes.status}): ${text.slice(0, 150)}` });
      }
      const cData: any = await cRes.json().catch(() => ({}));
      const id = cData?.conversation?.id ?? cData?.id ?? null;
      return json({ success: true, conversationId: id, created: true });
    }

    return json({ success: false, error: `Unknown action: ${action}` });
  } catch (err) {
    console.error("[ghl-conversation-actions] error", err);
    return json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});
