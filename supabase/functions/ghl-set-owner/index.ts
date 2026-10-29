import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, ghlFetch, requireAdmin, GHL_LOCATION_ID, GHL_V3 } from "../_shared/ghlClient.ts";

/**
 * Set the owner (assignedTo) on a GHL contact and any given opportunities.
 * Reps map to GHL users by email (case-insensitive).
 *
 * Body: { contact_id, opportunity_ids?, rep_email? }
 *   - rep_email null/empty → unassign (assignedTo = "")
 *   - rep_email with no GHL user match → success:true, matched:false (no writes)
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
    const opportunityIds: string[] = Array.isArray(body?.opportunity_ids)
      ? body.opportunity_ids.map((s: unknown) => String(s || "").trim()).filter(Boolean)
      : [];
    const repEmailRaw = body?.rep_email;
    const repEmail = typeof repEmailRaw === "string" ? repEmailRaw.trim().toLowerCase() : "";

    if (!contactId) return json({ success: false, error: "contact_id is required" });

    // Resolve rep_email → GHL userId (empty = unassign)
    let userId = "";
    let matched = true;
    if (repEmail) {
      const uRes = await ghlFetch(`/users/?locationId=${GHL_LOCATION_ID}`, { apiKey, version: GHL_V3 });
      if (!uRes.ok) {
        const t = await uRes.text();
        return json({ success: false, error: `GHL GET /users ${uRes.status}: ${t.slice(0, 300)}` });
      }
      const parsed: any = await uRes.json().catch(() => null);
      const users: any[] = Array.isArray(parsed?.users) ? parsed.users : Array.isArray(parsed) ? parsed : [];
      const found = users.find((u) => String(u?.email || "").trim().toLowerCase() === repEmail);
      if (!found) {
        return json({ success: true, matched: false, ghl_user_id: null });
      }
      userId = String(found.id || found._id || "");
      if (!userId) return json({ success: true, matched: false, ghl_user_id: null });
    } else {
      matched = true; // explicit unassign
    }

    // PUT contact
    const cRes = await ghlFetch(`/contacts/${contactId}`, {
      apiKey,
      method: "PUT",
      body: { assignedTo: userId },
      version: GHL_V3,
    });
    if (!cRes.ok) {
      const t = await cRes.text();
      return json({ success: false, error: `GHL PUT /contacts/${contactId} ${cRes.status}: ${t.slice(0, 300)}` });
    }

    // PUT opportunities
    for (const oid of opportunityIds) {
      const oRes = await ghlFetch(`/opportunities/${oid}`, {
        apiKey,
        method: "PUT",
        body: { assignedTo: userId },
        version: GHL_V3,
      });
      if (!oRes.ok) {
        const t = await oRes.text();
        return json({ success: false, error: `GHL PUT /opportunities/${oid} ${oRes.status}: ${t.slice(0, 300)}` });
      }
    }

    return json({ success: true, matched, ghl_user_id: userId || null });
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
