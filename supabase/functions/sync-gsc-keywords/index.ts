// Sync keyword metrics from Google Search Console for tracked keywords.
// Idempotent — re-running for the same date range upserts snapshots.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GSC_GATEWAY = "https://connector-gateway.lovable.dev/google_search_console";
const SITE_URL = "https://new.alfredai.bot/";

interface GscRow {
  keys: string[]; // [query, page, date]
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

function ok(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GSC_KEY = Deno.env.get("GOOGLE_SEARCH_CONSOLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !GSC_KEY) {
      return ok({ success: false, error: "Google Search Console connector is not linked." });
    }
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return ok({ success: false, error: "Backend is not configured." });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const body = await req.json().catch(() => ({}));
    const daysBack = Math.min(Math.max(Number(body.days_back ?? 30), 1), 90);

    const today = new Date();
    const endDate = new Date(today);
    endDate.setUTCDate(endDate.getUTCDate() - 2); // GSC data lags ~2 days
    const startDate = new Date(endDate);
    startDate.setUTCDate(startDate.getUTCDate() - daysBack);

    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    // Load active tracked keywords
    const { data: keywords, error: kwErr } = await supabase
      .from("tracked_keywords")
      .select("id, keyword, target_landing_path")
      .eq("is_active", true);

    if (kwErr) {
      return ok({ success: false, error: `Failed to load keywords: ${kwErr.message}` });
    }
    if (!keywords || keywords.length === 0) {
      return ok({ success: true, message: "No active keywords to sync.", synced: 0 });
    }

    // Single GSC query: dimensions=query,page,date filtered to our tracked keyword list
    const encodedSite = encodeURIComponent(SITE_URL);
    const gscRes = await fetch(
      `${GSC_GATEWAY}/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": GSC_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate: fmt(startDate),
          endDate: fmt(endDate),
          dimensions: ["query", "page", "date"],
          dimensionFilterGroups: [
            {
              filters: [
                {
                  dimension: "query",
                  operator: "includingRegex",
                  expression: keywords.map((k) => k.keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
                },
              ],
            },
          ],
          rowLimit: 25000,
        }),
      },
    );

    const gscJson = await gscRes.json();
    if (!gscRes.ok) {
      console.error("GSC error:", gscJson);
      return ok({
        success: false,
        error: `Search Console query failed (${gscRes.status}). Verify your site is added to GSC.`,
        details: gscJson?.error?.message ?? null,
      });
    }

    const rows: GscRow[] = gscJson.rows ?? [];

    // Group by (keyword, date) — aggregate across pages, keep top landing path
    const keywordMap = new Map<string, { id: string; landing?: string | null }>();
    keywords.forEach((k) => keywordMap.set(k.keyword.toLowerCase(), { id: k.id, landing: k.target_landing_path }));

    type Agg = {
      keyword_id: string;
      metric_date: string;
      impressions: number;
      clicks: number;
      positionSum: number;
      positionWeight: number;
      pages: Map<string, number>;
    };
    const agg = new Map<string, Agg>();

    for (const row of rows) {
      const [query, page, date] = row.keys;
      const k = keywordMap.get(query.toLowerCase());
      if (!k) continue;
      const key = `${k.id}:${date}`;
      let entry = agg.get(key);
      if (!entry) {
        entry = {
          keyword_id: k.id,
          metric_date: date,
          impressions: 0,
          clicks: 0,
          positionSum: 0,
          positionWeight: 0,
          pages: new Map(),
        };
        agg.set(key, entry);
      }
      entry.impressions += row.impressions;
      entry.clicks += row.clicks;
      // Impression-weighted average position
      entry.positionSum += row.position * row.impressions;
      entry.positionWeight += row.impressions;
      entry.pages.set(page, (entry.pages.get(page) ?? 0) + row.clicks);
    }

    // Conversions: count GHL submissions on the keyword's target landing page that day.
    // (Best-effort attribution — GSC doesn't pass query to your site.)
    const snapshots = [];
    for (const entry of agg.values()) {
      const topPage = [...entry.pages.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      const landingPath = topPage ? new URL(topPage).pathname : null;

      let conversions = 0;
      if (landingPath) {
        const dayStart = `${entry.metric_date}T00:00:00Z`;
        const dayEnd = `${entry.metric_date}T23:59:59Z`;
        const { count } = await supabase
          .from("ghl_submissions")
          .select("id", { count: "exact", head: true })
          .gte("created_at", dayStart)
          .lte("created_at", dayEnd)
          .ilike("source_url", `%${landingPath}%`);
        conversions = count ?? 0;
      }

      const avgPosition = entry.positionWeight > 0 ? entry.positionSum / entry.positionWeight : null;
      const ctr = entry.impressions > 0 ? entry.clicks / entry.impressions : 0;

      snapshots.push({
        keyword_id: entry.keyword_id,
        metric_date: entry.metric_date,
        impressions: entry.impressions,
        clicks: entry.clicks,
        ctr: Number(ctr.toFixed(4)),
        position: avgPosition !== null ? Number(avgPosition.toFixed(2)) : null,
        conversions,
        top_landing_path: landingPath,
      });
    }

    if (snapshots.length > 0) {
      const { error: upErr } = await supabase
        .from("keyword_metrics_snapshots")
        .upsert(snapshots, { onConflict: "keyword_id,metric_date" });
      if (upErr) {
        return ok({ success: false, error: `Failed to save snapshots: ${upErr.message}` });
      }
    }

    return ok({
      success: true,
      synced: snapshots.length,
      rows_from_gsc: rows.length,
      date_range: { start: fmt(startDate), end: fmt(endDate) },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("sync-gsc-keywords error:", msg);
    return ok({ success: false, error: msg });
  }
});
