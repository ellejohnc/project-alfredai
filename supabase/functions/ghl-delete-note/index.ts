import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, ghlFetch, requireAdmin, GHL_V3 } from "../_shared/ghlClient.ts";

/**
 * Delete a GHL contact note. Admin-only. Two-way sync: deleting here
 * removes the note in GHL so it doesn't reappear on the next refetch.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const json = (o: unknown) =>
    new Response(JSON.stringify(o), {
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
    const noteId = String(body?.note_id || "").trim();
    if (!contactId || !noteId) {
      return json({ success: false, error: "contact_id and note_id are required" });
    }

    const res = await ghlFetch(`/contacts/${contactId}/notes/${noteId}`, {
      apiKey,
      method: "DELETE",
      version: GHL_V3,
    });
    const text = await res.text();
    if (!res.ok && res.status !== 404) {
      return json({
        success: false,
        error: `GHL API error ${res.status}: ${text.slice(0, 300)}`,
      });
    }
    return json({ success: true });
  } catch (err) {
    return json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
});
