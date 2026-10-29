import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, ghlFetch, requireAdmin, GHL_V3 } from "../_shared/ghlClient.ts";

/**
 * PUT /opportunities/{opportunityId} — moves a GHL opportunity to a new
 * pipeline stage (and optionally a new pipeline). GHL requires pipelineId in
 * the body, so callers must always send it.
 *
 * Body: { opportunity_id, pipeline_id, pipeline_stage_id }
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
    const opportunityId = String(body?.opportunity_id || "").trim();
    const pipelineId = String(body?.pipeline_id || "").trim();
    const pipelineStageId = String(body?.pipeline_stage_id || "").trim();
    if (!opportunityId || !pipelineId || !pipelineStageId) {
      return json({ success: false, error: "opportunity_id, pipeline_id and pipeline_stage_id are required" });
    }

    const res = await ghlFetch(`/opportunities/${opportunityId}`, {
      apiKey,
      method: "PUT",
      body: { pipelineId, pipelineStageId },
      version: GHL_V3,
    });
    const text = await res.text();
    if (!res.ok) {
      return json({
        success: false,
        error: `GHL PUT /opportunities/${opportunityId} ${res.status}: ${text.slice(0, 300)}`,
      });
    }
    let parsed: unknown = null;
    try { parsed = JSON.parse(text); } catch { /* non-JSON success */ }
    return json({ success: true, opportunity: parsed });
  } catch (err) {
    return json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});
