import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, ghlFetch, GHL_LOCATION_ID, requireAdmin, GHL_V3 } from "../_shared/ghlClient.ts";

/** Return every pipeline in the location with its ordered stages so the
 *  Ownership card can offer a full pipeline+stage picker for a GHL opportunity. */
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
    if (!auth.ok) return json({ success: false, error: auth.error, pipelines: [] });

    const apiKey = Deno.env.get("GHL_API_KEY");
    if (!apiKey) return json({ success: false, error: "GHL_API_KEY missing", pipelines: [] });

    const res = await ghlFetch(`/opportunities/pipelines?locationId=${GHL_LOCATION_ID}`, { apiKey, version: GHL_V3 });
    if (!res.ok) {
      const text = await res.text();
      return json({
        success: false,
        error: `GHL pipelines ${res.status}: ${text.slice(0, 200)}`,
        pipelines: [],
      });
    }
    const data: any = await res.json().catch(() => ({}));
    const raw: any[] = Array.isArray(data?.pipelines) ? data.pipelines : [];
    const pipelines = raw.map((p) => ({
      id: p.id,
      name: p.name,
      stages: (Array.isArray(p.stages) ? p.stages : [])
        .slice()
        .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
        .map((s: any) => ({ id: s.id, name: s.name, position: s.position ?? 0 })),
    }));

    return json({ success: true, pipelines });
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : String(err),
        pipelines: [],
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
