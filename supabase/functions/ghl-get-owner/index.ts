import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, ghlFetch, requireAdmin, GHL_LOCATION_ID, GHL_V3 } from "../_shared/ghlClient.ts";

/**
 * Return the current assigned owner of a GHL contact, resolved to email + name.
 * Body: { contact_id }
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
    if (!contactId) return json({ success: false, error: "contact_id is required" });

    // v3: same `{ contact: {...} }` envelope this already unwraps, and
    // `assignedTo` is part of the v3 contact DTO. The /users/ call below stays
    // on the default version until its own v3 shape is confirmed.
    const cRes = await ghlFetch(`/contacts/${contactId}`, { apiKey, version: GHL_V3 });
    if (!cRes.ok) {
      const t = await cRes.text();
      return json({ success: false, error: `GHL GET /contacts/${contactId} ${cRes.status}: ${t.slice(0, 300)}` });
    }
    const cJson: any = await cRes.json().catch(() => null);
    const contact = cJson?.contact ?? cJson ?? {};
    const assignedTo = String(contact?.assignedTo || "").trim();
    if (!assignedTo) {
      return json({ success: true, ghl_user_id: null, email: null, name: null });
    }

    // Resolve via users list
    const uRes = await ghlFetch(`/users/?locationId=${GHL_LOCATION_ID}`, { apiKey, version: GHL_V3 });
    if (!uRes.ok) {
      return json({ success: true, ghl_user_id: assignedTo, email: null, name: null });
    }
    const uJson: any = await uRes.json().catch(() => null);
    const users: any[] = Array.isArray(uJson?.users) ? uJson.users : Array.isArray(uJson) ? uJson : [];
    const u = users.find((x) => String(x?.id || x?._id || "") === assignedTo);
    const email = u?.email ? String(u.email).trim() : null;
    const name =
      (u?.name && String(u.name).trim()) ||
      [u?.firstName, u?.lastName].filter(Boolean).join(" ").trim() ||
      email ||
      null;

    return json({ success: true, ghl_user_id: assignedTo, email, name });
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
