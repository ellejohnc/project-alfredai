import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, ghlFetch, GHL_LOCATION_ID, requireAdmin, GHL_V3 } from "../_shared/ghlClient.ts";

/**
 * Return a contact's GHL opportunities, each enriched with the ordered stages
 * of its pipeline so the frontend can render a stepper with the current stage
 * highlighted.
 */

let pipelineCache: { at: number; pipelines: any[] } | null = null;

async function fetchPipelines(apiKey: string): Promise<any[]> {
  if (pipelineCache && Date.now() - pipelineCache.at < 5 * 60 * 1000) return pipelineCache.pipelines;
  const res = await ghlFetch(`/opportunities/pipelines?locationId=${GHL_LOCATION_ID}`, { apiKey, version: GHL_V3 });
  if (!res.ok) return [];
  const data: any = await res.json().catch(() => ({}));
  const pipelines: any[] = Array.isArray(data?.pipelines) ? data.pipelines : [];
  pipelineCache = { at: Date.now(), pipelines };
  return pipelines;
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
    if (!auth.ok) return json({ success: false, error: auth.error, opportunities: [] });

    const apiKey = Deno.env.get("GHL_API_KEY");
    if (!apiKey) return json({ success: false, error: "GHL_API_KEY missing", opportunities: [] });

    const body = await req.json().catch(() => ({}));
    const contactId = String(body?.contact_id || "").trim();
    if (!contactId) return json({ success: false, error: "Missing contact_id", opportunities: [] });

    // GHL requires snake_case params on opportunities/search.
    const oRes = await ghlFetch(
      `/opportunities/search?location_id=${GHL_LOCATION_ID}&contact_id=${encodeURIComponent(contactId)}`,
      { apiKey,
      version: GHL_V3,
    },
    );
    if (!oRes.ok) {
      const text = await oRes.text();
      return json({
        success: false,
        error: `GHL opportunities/search ${oRes.status}: ${text.slice(0, 200)}`,
        opportunities: [],
      });
    }
    const oData: any = await oRes.json().catch(() => ({}));
    const opps: any[] = Array.isArray(oData?.opportunities) ? oData.opportunities : [];

    const pipelines = await fetchPipelines(apiKey);
    const pipelineById: Record<string, any> = {};
    for (const p of pipelines) pipelineById[p.id] = p;

    const normalized = opps.map((o) => {
      const p = pipelineById[o.pipelineId] || null;
      const stagesRaw: any[] = p && Array.isArray(p.stages) ? p.stages : [];
      const stages = stagesRaw
        .slice()
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        .map((s) => ({ id: s.id, name: s.name, position: s.position ?? 0 }));
      return {
        id: o.id,
        name: o.name,
        monetaryValue: Number(o.monetaryValue) || 0,
        status: o.status,
        source: o.source || null,
        pipelineId: o.pipelineId,
        pipelineName: p?.name ?? null,
        pipelineStageId: o.pipelineStageId,
        stages,
        assignedTo: o.assignedTo ?? null,
        lastStageChangeAt: o.lastStageChangeAt || o.updatedAt || null,
        lastStatusChangeAt: o.lastStatusChangeAt || null,
        createdAt: o.createdAt || null,
        updatedAt: o.updatedAt || null,
      };
    });

    return json({ success: true, opportunities: normalized });
  } catch (err) {
    console.error("[ghl-get-opportunities] error", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : String(err),
        opportunities: [],
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
