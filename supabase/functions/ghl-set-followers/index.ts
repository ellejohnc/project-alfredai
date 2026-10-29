import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  corsHeaders,
  ghlFetch,
  requireAdmin,
  fetchUserMap,
  GHL_V3,
} from "../_shared/ghlClient.ts";

/**
 * Push a lead's followers to GoHighLevel.
 *
 * Followers were built local-only on the stated basis that GHL had no such
 * concept. It does: POST/DELETE /contacts/{id}/followers take
 * { followers: string[] } of GHL user ids. This is the missing half.
 *
 * Body: { contact_id, add?: string[], remove?: string[] }
 * where add/remove are OUR user emails — resolved to GHL user ids here, so a
 * caller never has to know GHL's id space.
 *
 * Fails soft: always 200 with { success }. A follower that cannot be mapped to
 * a GHL user is reported in `unmatched` rather than failing the whole call —
 * following someone locally is still useful when they have no GHL seat.
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
    const contactId = String(body?.contact_id || "").trim();
    if (!contactId) return json({ success: false, error: "Missing contact_id" });

    const addEmails: string[] = Array.isArray(body?.add) ? body.add : [];
    const removeEmails: string[] = Array.isArray(body?.remove) ? body.remove : [];
    if (!addEmails.length && !removeEmails.length) {
      return json({ success: true, added: [], removed: [], unmatched: [] });
    }

    // fetchUserMap gives id -> display name; we need email -> id, so read the
    // user list directly. Same endpoint, already on v3.
    const uRes = await ghlFetch(`/users/?locationId=${Deno.env.get("GHL_LOCATION_ID") || "0Mihjpq27y2HyrXxdfH3"}`, {
      apiKey,
      version: GHL_V3,
    });
    if (!uRes.ok) {
      const t = await uRes.text();
      return json({ success: false, error: `GHL GET /users ${uRes.status}: ${t.slice(0, 300)}` });
    }
    const uParsed: any = await uRes.json().catch(() => null);
    const users: any[] = Array.isArray(uParsed?.users) ? uParsed.users : [];
    const idByEmail = new Map<string, string>();
    for (const u of users) {
      const email = String(u?.email || "").trim().toLowerCase();
      const id = u?.id || u?._id;
      if (email && id) idByEmail.set(email, String(id));
    }

    const unmatched: string[] = [];
    const toIds = (emails: string[]) => {
      const ids: string[] = [];
      for (const e of emails) {
        const id = idByEmail.get(String(e || "").trim().toLowerCase());
        if (id) ids.push(id);
        else unmatched.push(e);
      }
      return ids;
    };

    const addIds = toIds(addEmails);
    const removeIds = toIds(removeEmails);

    const call = async (method: "POST" | "DELETE", followers: string[]) => {
      if (!followers.length) return { ok: true, applied: [] as string[] };
      const res = await ghlFetch(`/contacts/${contactId}/followers`, {
        apiKey,
        method,
        body: { followers },
        version: GHL_V3,
      });
      if (!res.ok) {
        const t = await res.text();
        console.error(`[ghl-set-followers] ${method} ${res.status}`, t.slice(0, 200));
        return { ok: false, applied: [] as string[], error: `GHL ${method} followers ${res.status}` };
      }
      const parsed: any = await res.json().catch(() => ({}));
      // v3 answers with followersAdded / followersRemoved; fall back to what we sent.
      const applied: string[] = parsed?.followersAdded ?? parsed?.followersRemoved ?? followers;
      return { ok: true, applied };
    };

    const added = await call("POST", addIds);
    const removed = await call("DELETE", removeIds);

    if (!added.ok || !removed.ok) {
      return json({
        success: false,
        error: added.error || removed.error,
        added: added.applied,
        removed: removed.applied,
        unmatched,
      });
    }

    return json({
      success: true,
      added: added.applied,
      removed: removed.applied,
      unmatched,
    });
  } catch (err) {
    console.error("[ghl-set-followers] error", err);
    return json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});
