import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  corsHeaders,
  ghlFetch,
  GHL_LOCATION_ID,
  fetchUserMap,
  requireAdmin,
  GHL_V3,
} from "../_shared/ghlClient.ts";

/**
 * Read a contact's GHL conversation(s) and return a normalized, chronological
 * message list (oldest -> newest) suitable for a chat timeline.
 *
 * Body (POST): { contact_id, transcript_for?: string (message_id) }
 * When `transcript_for` is provided, ONLY the transcript is returned — cheap
 * per-message expand from the client without re-listing all messages.
 */

const TYPE_MAP: Record<string, string> = {
  TYPE_SMS: "SMS",
  TYPE_EMAIL: "Email",
  TYPE_CALL: "Call",
  TYPE_VOICEMAIL: "Voicemail",
  TYPE_INTERNAL_COMMENT: "Comment",
  TYPE_ACTIVITY_OPPORTUNITY: "Activity",
  TYPE_ACTIVITY_CONTACT: "Activity",
  TYPE_ACTIVITY_INVOICE: "Activity",
  TYPE_ACTIVITY_PAYMENT: "Activity",
  TYPE_FB: "Facebook",
  TYPE_IG: "Instagram",
  TYPE_WHATSAPP: "WhatsApp",
  TYPE_LIVE_CHAT: "Chat",
};

/** Flatten a GHL email HTML body into readable plain text for the timeline. */
function htmlToText(html: string): string {
  if (!/<[a-z][\s\S]*>/i.test(html)) return html.trim();
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|h[1-6]|li|table)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_m, href, label) => {
      const text = String(label).replace(/<[^>]+>/g, "").trim();
      return text ? `${text}\n[${href}]` : `[${href}]`;
    })
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&zwnj;|&#8203;/gi, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}


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
    if (!auth.ok) return json({ success: false, error: auth.error, messages: [] });

    const apiKey = Deno.env.get("GHL_API_KEY");
    if (!apiKey) return json({ success: false, error: "GHL_API_KEY missing", messages: [] });

    const body = await req.json().catch(() => ({}));
    const contactId = String(body?.contact_id || "").trim();
    const transcriptFor = String(body?.transcript_for || "").trim();
    if (!contactId) return json({ success: false, error: "Missing contact_id", messages: [] });

    // On-demand transcript fetch.
    if (transcriptFor) {
      const tRes = await ghlFetch(
        `/conversations/locations/${GHL_LOCATION_ID}/messages/${transcriptFor}/transcription`,
        { apiKey,
        version: GHL_V3,
      },
      );
      if (!tRes.ok) {
        return json({ success: false, error: `Transcript unavailable (${tRes.status})`, transcript: [] });
      }
      const rows = await tRes.json().catch(() => []);
      return json({ success: true, transcript: Array.isArray(rows) ? rows : [] });
    }

    // 1) Find conversation(s) for the contact. A contact can own several
    // conversations (phone thread, email thread, chat widget) — page through
    // the search so none of them, and none of their messages, go missing.
    const conversations: any[] = [];
    {
      const seen = new Set<string>();
      for (let page = 1; page <= 5; page++) {
        const cRes = await ghlFetch(
          `/conversations/search?locationId=${GHL_LOCATION_ID}&contactId=${encodeURIComponent(contactId)}&limit=100&page=${page}`,
          { apiKey,
          version: GHL_V3,
        },
        );
        if (!cRes.ok) {
          if (conversations.length > 0) break;
          const text = await cRes.text();
          return json({
            success: false,
            error: `GHL conversations/search ${cRes.status}: ${text.slice(0, 200)}`,
            messages: [],
          });
        }
        const cData: any = await cRes.json().catch(() => ({}));
        const arr: any[] = Array.isArray(cData?.conversations) ? cData.conversations : [];
        for (const c of arr) {
          if (c?.id && !seen.has(c.id)) {
            seen.add(c.id);
            conversations.push(c);
          }
        }
        if (arr.length < 100) break;
      }
    }
    if (conversations.length === 0) {
      return json({ success: true, messages: [], conversations: [] });
    }


    const userMap = await fetchUserMap(apiKey);

    // 2) Fetch messages for each conversation (paginate lastMessageId).
    const allMessages: any[] = [];
    for (const c of conversations) {
      const cid = c.id;
      let lastMessageId: string | undefined;
      for (let page = 0; page < 20; page++) {
        const qs = new URLSearchParams({ limit: "100" });
        if (lastMessageId) qs.set("lastMessageId", lastMessageId);
        const mRes = await ghlFetch(`/conversations/${cid}/messages?${qs.toString()}`, { apiKey, version: GHL_V3 });
        if (!mRes.ok) break;
        const mData: any = await mRes.json().catch(() => ({}));
        const inner = mData?.messages;
        const arr: any[] = Array.isArray(inner?.messages)
          ? inner.messages
          : Array.isArray(mData?.messages)
            ? mData.messages
            : [];
        if (arr.length === 0) break;
        for (const m of arr) allMessages.push({ ...m, _conversationId: cid });
        const nextId = inner?.lastMessageId ?? mData?.lastMessageId;
        const hasNext = inner?.nextPage ?? mData?.nextPage;
        if (!hasNext || !nextId || nextId === lastMessageId) break;
        lastMessageId = nextId;
      }
    }

    // 3) Normalise, oldest -> newest.
    const normalized = allMessages
      .map((m) => {
        const rawType: string = m.messageType || "";
        const kind = TYPE_MAP[rawType] || "Other";
        const call = m?.meta?.call || null;
        const userName = m.userId ? userMap[m.userId] || null : null;
        return {
          id: m.id,
          conversationId: m._conversationId,
          type: kind,
          rawType,
          // Bulk/campaign emails arrive with no top-level direction — the only
          // hint sits on meta.email, so fall back to it before giving up.
          direction: (m.direction || m?.meta?.email?.direction || "").toLowerCase() as
            | "inbound"
            | "outbound"
            | "",
          body: m.body || "",
          status: m.status || null,
          dateAdded: m.dateAdded || m.dateUpdated || null,
          // Emails carry their addresses on meta.email, not at the top level.
          from: m.from || m?.meta?.email?.from || null,
          to:
            m.to ||
            (Array.isArray(m?.meta?.email?.to)
              ? m.meta.email.to.filter(Boolean).join(", ")
              : m?.meta?.email?.to) ||
            null,

          userName,
          source: m.source || null,
          call: call
            ? {
                duration: Number(call.duration) || 0,
                status: call.status || null,
                recordingUrl: call.recordingUrl || null,
              }
            : null,
          transcriptAvailable: kind === "Call",
          meta: m.meta || null,
          altId: m.altId || null,
        };
      })
      .sort(
        (a, b) => new Date(a.dateAdded || 0).getTime() - new Date(b.dateAdded || 0).getTime(),
      );

    // 4) Hydrate email bodies. The conversation messages endpoint returns
    // campaign/template emails with an EMPTY body — the content lives behind
    // /conversations/messages/email/{emailMessageId} (meta.email.messageIds).
    // Without this the timeline showed those emails as blank bubbles, which is
    // why messages visible in GHL looked missing here.
    const needsEmail = normalized
      .filter(
        (m) =>
          m.type === "Email" &&
          (!m.body || !m.from || !m.to) &&
          m?.meta?.email?.messageIds?.length,
      )

      .slice(-40); // newest 40 — enough for the timeline, keeps us off the rate limit
    const CHUNK = 5;
    for (let i = 0; i < needsEmail.length; i += CHUNK) {
      const chunk = needsEmail.slice(i, i + CHUNK);
      await Promise.all(
        chunk.map(async (msg) => {
          const emailId = msg.meta.email.messageIds[msg.meta.email.messageIds.length - 1];
          try {
            const eRes = await ghlFetch(`/conversations/messages/email/${emailId}`, { apiKey, version: GHL_V3 });
            if (!eRes.ok) return;
            const eData: any = await eRes.json().catch(() => ({}));
            const e = eData?.emailMessage ?? eData?.email ?? eData;
            const raw: string = e?.body || e?.htmlBody || e?.textBody || "";
            if (raw) msg.body = htmlToText(raw);
            if (!msg.from && e?.from) msg.from = e.from;
            if (!msg.to && e?.to) msg.to = Array.isArray(e.to) ? e.to.join(", ") : e.to;
            if (!msg.status && e?.status) msg.status = e.status;
            if (!msg.direction && e?.direction) msg.direction = String(e.direction).toLowerCase() as any;
          } catch (_e) {
            // Leave the bubble as-is; a single email failing must not blank the thread.
          }
        }),
      );
    }


    return json({
      success: true,
      conversations: conversations.map((c) => ({
        id: c.id,
        type: c.type,
        lastMessageDate: c.lastMessageDate,
        unreadCount: c.unreadCount,
      })),
      messages: normalized,
    });
  } catch (err) {
    console.error("[ghl-get-conversation] error", err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err), messages: [] }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
