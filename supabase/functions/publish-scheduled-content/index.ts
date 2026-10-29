import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

/**
 * Publish content whose scheduled time has passed.
 *
 * WHAT THIS IS ALLOWED TO DO, stated narrowly on purpose: it may move a row
 * from `draft` to `published`, and nothing else. It cannot unpublish, it cannot
 * archive, it cannot touch a row that is already published, and it cannot
 * publish a row with no `scheduled_for`. Anything outside that is a person's
 * decision, and this runs unattended on a timer against a PUBLIC website.
 *
 * IDEMPOTENT BY CONSTRUCTION. `scheduled_for` is cleared in the same update
 * that publishes, so a row can never be picked up twice — and because the
 * filter requires `status = 'draft'`, a re-run over a row this job already
 * published matches nothing at all. Two guards rather than one, because a cron
 * that fires twice is normal and a double-publish would be silent.
 *
 * NO SILENT CAP. Every unpaged-query fault this project has found came from a
 * limit that quietly hid rows — the Alpha source showing 1,000 of 3,055, the
 * Bounce Dashboard drawing 1,000 of 1,418. So this publishes everything that is
 * due and REPORTS the number rather than trimming it. A run larger than
 * LOUD_RUN is still processed, and says so loudly, because "50 posts went live
 * at once" is something to find out from a log rather than from the site.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

/** Every content type that can be scheduled. Table → the label used in logs. */
const CONTENT_TABLES: Record<string, string> = {
  blog_posts: "blog post",
  guides_playbooks: "guide",
  webinars_events: "webinar",
  documentation: "doc",
  faqs: "FAQ",
  testimonials: "testimonial",
  job_openings: "job opening",
};

/** A run bigger than this is legitimate but worth shouting about. */
const LOUD_RUN = 25;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startedAt = Date.now();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Cron-only. This publishes to the public site with nobody watching, so it
  // is not something an anon caller should be able to trigger. Checked the same
  // way verify-ghl-sync does it, and failing CLOSED: no secret configured means
  // no publishing, because the alternative is an open endpoint that changes
  // what the world can see.
  const cronSecret = Deno.env.get("CRON_SECRET") ?? Deno.env.get("META_SYNC_CRON_SECRET");
  if (!cronSecret) {
    console.error("No CRON_SECRET configured — refusing to publish anything.");
    return new Response(
      JSON.stringify({ error: "Not configured", published: 0 }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  if (req.headers.get("x-cron-secret") !== cronSecret) {
    console.error("Invalid or missing cron secret.");
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const now = new Date().toISOString();

  const published: Record<string, number> = {};
  const failures: Record<string, string> = {};
  let total = 0;

  for (const [table, label] of Object.entries(CONTENT_TABLES)) {
    try {
      // The filter IS the safety rail: draft only, scheduled only, due only.
      // `select()` on the update returns exactly the rows that changed, so the
      // count reported below is what actually happened rather than what was
      // intended — the distinction that made the Alpha backfill report 25 of 25
      // successes while every one of them had failed.
      const { data, error } = await supabase
        .from(table)
        .update({ status: "published", published_at: now, scheduled_for: null })
        .eq("status", "draft")
        .not("scheduled_for", "is", null)
        .lte("scheduled_for", now)
        .select("id");

      if (error) {
        failures[table] = error.message;
        console.error(`[${table}] scheduled publish failed:`, error.message);
        continue;
      }

      const n = data?.length ?? 0;
      if (n > 0) {
        published[table] = n;
        total += n;
        console.log(`[${table}] published ${n} scheduled ${label}${n === 1 ? "" : "s"}`);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      failures[table] = message;
      console.error(`[${table}] scheduled publish threw:`, message);
    }
  }

  if (total >= LOUD_RUN) {
    console.warn(
      `Published ${total} items in a single run. That is legitimate but large — ` +
      `worth checking nothing was scheduled in bulk by accident.`,
    );
  }

  const failed = Object.keys(failures).length;
  // A table erroring is reported, but the run is still a 200: the other six
  // published correctly, and answering 500 here would tell the caller that
  // nothing happened when six things did.
  return new Response(
    JSON.stringify({
      success: failed === 0,
      published_total: total,
      published,
      failures,
      duration_ms: Date.now() - startedAt,
      ran_at: now,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
