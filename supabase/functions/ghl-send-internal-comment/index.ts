import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, ghlFetch, requireAdmin, GHL_BASE, BROWSER_UA, GHL_LOCATION_ID, GHL_V3 } from "../_shared/ghlClient.ts";

/**
 * Post an INTERNAL COMMENT into a contact's GHL conversation feed.
 *
 * GHL only accepts `type: "InternalComment"` on POST /conversations/messages
 * when the request is sent with `Version: v3` (the shared client pins
 * 2021-07-28, which rejects the enum), and `status` is required by the v3 body
 * schema. So this function issues its own fetch rather than using ghlFetch.
 *
 * Body: { contact_id, message, user_id? }
 * Always returns 200 with { success: boolean, error? } so the UI never crashes.
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
    let userId = body?.user_id ? String(body.user_id).trim() : "";
    if (!contactId || !message) {
      return json({ success: false, error: "contact_id and message are required" });
    }
    if (message.length > 5000) {
      return json({ success: false, error: "Comment too long (max 5000 chars)" });
    }

    // Attribute the comment to the matching GHL user (by admin email) so the
    // feed shows a real author instead of "system". Soft-fails.
    if (!userId) {
      try {
        const { data: adminRow } = await supabase
          .from("admin_users")
          .select("email")
          .eq("id", auth.userId)
          .maybeSingle();
        const email = String((adminRow as any)?.email || "").toLowerCase();
        if (email) {
          const uRes = await ghlFetch(`/users/?locationId=${GHL_LOCATION_ID}`, { apiKey, version: GHL_V3 });
          if (uRes.ok) {
            const parsed: any = await uRes.json().catch(() => null);
            const users: any[] = Array.isArray(parsed?.users) ? parsed.users : [];
            const match = users.find((u) => String(u?.email || "").toLowerCase() === email);
            if (match?.id) userId = String(match.id);
          }
        }
      } catch { /* attribution is optional */ }
    }

    const payload: Record<string, unknown> = {
      type: "InternalComment",
      contactId,
      message,
      status: "delivered",
    };
    if (userId) payload.userId = userId;


    const send = (version: string) =>
      fetch(`${GHL_BASE}/conversations/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Version: version,
          Accept: "application/json",
          "Content-Type": "application/json",
          "User-Agent": BROWSER_UA,
        },
        body: JSON.stringify(payload),
      });

    // v3 is the documented version for InternalComment; fall back to the
    // legacy version only if v3 itself is rejected outright.
    let res = await send("v3");
    let text = await res.text();
    if (!res.ok && (res.status === 400 || res.status === 422)) {
      const retry = await send("2021-07-28");
      const retryText = await retry.text();
      if (retry.ok) { res = retry; text = retryText; }
      else console.error("[ghl-send-internal-comment] fallback failed", retry.status, retryText);
    }

    if (!res.ok) {
      console.error("[ghl-send-internal-comment] failed", res.status, text);
      return json({
        success: false,
        error: `GHL internal comment failed (${res.status}): ${text.slice(0, 250)}`,
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
    console.error("[ghl-send-internal-comment] error", err);
    return json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});
