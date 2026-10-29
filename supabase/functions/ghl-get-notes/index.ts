import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
// Shared client: 5-min in-memory user-map cache + single 429 retry honouring
// Retry-After. The local copy here had neither and doubled /users traffic.
import { fetchUserMap, ghlFetch, GHL_V3 } from "../_shared/ghlClient.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};


interface GetNotesRequest {
  contact_id?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (obj: unknown) =>
    new Response(JSON.stringify(obj), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ghlApiKey = Deno.env.get("GHL_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the caller is an authenticated admin.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ success: false, error: "Missing authorization header", notes: [] });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return json({ success: false, error: "Invalid token", notes: [] });

    const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: user.id });
    if (!isAdmin) return json({ success: false, error: "Unauthorized: Admin access required", notes: [] });

    if (!ghlApiKey) return json({ success: false, error: "GHL_API_KEY is not configured", notes: [] });

    // Accept the contact id from body (POST) or query (?contact_id=).
    let contactId = "";
    if (req.method === "POST") {
      const payload: GetNotesRequest = await req.json().catch(() => ({}));
      contactId = (payload.contact_id || "").trim();
    } else {
      contactId = (new URL(req.url).searchParams.get("contact_id") || "").trim();
    }
    if (!contactId) return json({ success: false, error: "Missing contact_id", notes: [] });

    // Use the shared client: browser UA + single 429 retry honouring Retry-After.
    const ghlRes = await ghlFetch(`/contacts/${contactId}/notes`, { apiKey: ghlApiKey, version: GHL_V3 });


    const ghlText = await ghlRes.text();
    if (!ghlRes.ok) {
      console.error("[GHL-GET-NOTES] GHL API error", ghlRes.status, ghlText);
      return json({ success: false, error: `GHL API error (${ghlRes.status})`, notes: [] });
    }

    let parsed: any = null;
    try { parsed = JSON.parse(ghlText); } catch { /* ignore */ }

    const rawNotes: any[] = Array.isArray(parsed?.notes)
      ? parsed.notes
      : Array.isArray(parsed)
        ? parsed
        : [];

    const userMap = await fetchUserMap(ghlApiKey);

    const notes = rawNotes
      .map((n) => {
        const userId = n.userId ?? n.createdBy ?? null;
        const author = (userId && userMap[userId]) || "GoHighLevel";
        return {
          id: n.id || n._id || crypto.randomUUID(),
          body: n.body ?? n.note ?? "",
          author,
          createdAt: n.dateAdded ?? n.createdAt ?? n.created_at ?? null,
        };
      })
      .filter((n) => !!String(n.body).trim())
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    return json({ success: true, notes });
  } catch (err) {
    console.error("[GHL-GET-NOTES] Unexpected error", err);
    return json({ success: false, error: err instanceof Error ? err.message : "Unknown error", notes: [] });
  }
});
