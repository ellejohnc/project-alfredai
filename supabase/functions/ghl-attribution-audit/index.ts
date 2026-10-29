import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, ghlFetch, requireAdmin, GHL_V3 } from "../_shared/ghlClient.ts";

/**
 * Answer one question with evidence instead of a guess: does GoHighLevel hold
 * campaign attribution for our Meta leads?
 *
 * meta_leads.campaign_id is null on all 1,514 rows and utm_campaign on all of
 * them too, which is why the "Campaigns" tile from the design deck was recorded
 * as unbuildable. But the v3 contact carries attributionSource and
 * lastAttributionSource, so the data may exist on GHL's side and simply never
 * have been captured on ours.
 *
 * Samples N Meta leads that have a ghl_contact_id, fetches each contact on v3,
 * and reports how many carry a usable campaign. Read-only, admin-only, and
 * rate-limit aware: requests are sequential with a small delay, because the
 * failure we have actually hit is twenty parallel calls turning a soft 429 into
 * an outage.
 *
 * Body: { sample?: number }  (default 25, max 100)
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
    // Service-role permitted: read-only sampling of Meta contacts, run unattended.
    const auth = await requireAdmin(req, supabase, { allowServiceRole: true });
    if (!auth.ok) return json({ success: false, error: auth.error });

    const apiKey = Deno.env.get("GHL_API_KEY");
    if (!apiKey) return json({ success: false, error: "GHL_API_KEY missing" });

    const body = await req.json().catch(() => ({}));
    const sample = Math.min(Math.max(Number(body?.sample) || 25, 1), 100);

    const { data: rows, error } = await supabase
      .from("meta_leads")
      .select("id, ghl_contact_id, form_name, submitted_at")
      .not("ghl_contact_id", "is", null)
      .order("submitted_at", { ascending: false })
      .limit(sample);
    if (error) return json({ success: false, error: error.message });

    const counts = {
      sampled: 0,
      fetched: 0,
      failed: 0,
      withAttribution: 0,
      withCampaign: 0,
      withCampaignId: 0,
      withUtmSource: 0,
      withReferrer: 0,
    };
    const campaigns = new Map<string, number>();
    const examples: unknown[] = [];

    for (const row of rows ?? []) {
      counts.sampled += 1;
      const res = await ghlFetch(`/contacts/${row.ghl_contact_id}`, { apiKey, version: GHL_V3 });
      if (!res.ok) {
        counts.failed += 1;
        continue;
      }
      counts.fetched += 1;
      const parsed: any = await res.json().catch(() => ({}));
      const c = parsed?.contact ?? parsed ?? {};
      const first = c.attributionSource ?? null;
      const last = c.lastAttributionSource ?? null;
      const any = first || last;
      if (any) counts.withAttribution += 1;

      const campaign = first?.campaign ?? last?.campaign ?? null;
      if (campaign) {
        counts.withCampaign += 1;
        campaigns.set(String(campaign), (campaigns.get(String(campaign)) ?? 0) + 1);
      }
      if (first?.campaignId ?? last?.campaignId) counts.withCampaignId += 1;
      if (first?.utmSource ?? last?.utmSource) counts.withUtmSource += 1;
      if (first?.referrer ?? last?.referrer) counts.withReferrer += 1;

      if (examples.length < 3 && any) {
        examples.push({ lead_id: row.id, form_name: row.form_name, first, last });
      }

      // Sequential with a breath between calls. See the header comment.
      await new Promise((r) => setTimeout(r, 120));
    }

    const distinctCampaigns = [...campaigns.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, n]) => ({ campaign: name, leads: n }));

    return json({
      success: true,
      counts,
      distinctCampaigns,
      examples,
      verdict:
        counts.fetched === 0
          ? "Could not fetch any contact — check the API key and rate limits."
          : counts.withCampaign === 0
            ? "GHL holds no campaign for these contacts. The Campaigns tile needs capture work in the Meta webhook, not a read."
            : `GHL holds a campaign for ${counts.withCampaign} of ${counts.fetched} sampled contacts (${distinctCampaigns.length} distinct). The Campaigns tile is buildable from GHL without new capture.`,
    });
  } catch (err) {
    console.error("[ghl-attribution-audit] error", err);
    return json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});
