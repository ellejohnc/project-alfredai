import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, requireAdmin } from "../_shared/ghlClient.ts";

/**
 * connector-health — is every scheduled job and inbound webhook actually
 * working?
 *
 * Written because one was not, and nothing on the site could have said so.
 * `check-deleted-ghl-contacts` had failed on every single run: it built its
 * URL and Authorization from vault secrets named SUPABASE_URL and
 * SUPABASE_SERVICE_ROLE_KEY, and the vault holds neither, so both came back
 * null and Postgres rejected the row. It failed silently, daily.
 *
 * Two sources, because they answer different questions:
 *
 *   cron.job_run_details — did the SCHEDULE fire, and did the HTTP request get
 *   queued? A job broken the way the one above was fails here.
 *
 *   webhook_logs — did the FUNCTION run, and what did it return? Only a
 *   couple of functions write here, and the response says which, so a thin
 *   list reads as thin coverage rather than as everything being fine.
 *
 * Read-only. Admin only.
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
    const auth = await requireAdmin(req, supabase);
    if (!auth.ok) return json({ success: false, error: auth.error });

    const { data: jobs, error: jobErr } = await supabase.rpc("connector_health_jobs");
    if (jobErr) throw jobErr;

    const { data: hooks, error: hookErr } = await supabase.rpc("connector_health_webhooks");
    if (hookErr) throw hookErr;

    const jobRows = (jobs ?? []) as Record<string, unknown>[];
    const broken = jobRows.filter((j) => Number(j.failed_7d) > 0);
    const silent = jobRows.filter((j) => !j.last_run);

    return json({
      success: true,
      jobs: jobRows,
      webhooks: hooks ?? [],
      verdict:
        broken.length === 0 && silent.length === 0
          ? `All ${jobRows.length} scheduled jobs ran clean this week.`
          : [
              broken.length ? `${broken.length} job(s) failing` : null,
              silent.length ? `${silent.length} job(s) have not run at all` : null,
            ]
              .filter(Boolean)
              .join(" · "),
      caveat:
        "Job status comes from cron.job_run_details, which records whether the schedule fired and the request was queued — not whether the function then succeeded. Only a couple of functions write to webhook_logs, so that list is thin because coverage is thin, not because everything else is healthy.",
    });
  } catch (err) {
    console.error("[connector-health] error", err);
    return json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});
