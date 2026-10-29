import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  corsHeaders,
  ghlFetch,
  requireAdmin,
  GHL_LOCATION_ID,
  GHL_VERSION,
  GHL_V3,
} from "../_shared/ghlClient.ts";

/**
 * Does GoHighLevel still accept what we send it?
 *
 * Every call in this codebase moved from the legacy `2021-07-28` date header to
 * `v3`. The reads were verified against the vendored v3 types, but the WRITE
 * paths — contact update, opportunity stage, message send — moved on
 * shape-checking alone, and a broken write loses data rather than showing an
 * empty panel.
 *
 * Exercising a write to prove it works would mean writing to a real client
 * record, so this does the honest alternative: it probes one READ per resource
 * on v3. A resource that answers a read on v3 is accepting the header, which is
 * the part of the migration that could fail wholesale. What that cannot prove
 * is response-shape handling on writes — that is called out in the result
 * rather than glossed over.
 *
 * Read-only, admin-only, sequential. Nothing here mutates anything.
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
    // Service-role permitted: read-only probe, run unattended so a version rejection is caught without waiting for someone to open the page.
    const auth = await requireAdmin(req, supabase, { allowServiceRole: true });
    if (!auth.ok) return json({ success: false, error: auth.error });

    const apiKey = Deno.env.get("GHL_API_KEY");
    if (!apiKey) return json({ success: false, error: "GHL_API_KEY missing" });

    // A real contact id, so the contact probe is a genuine read rather than a
    // guaranteed 404 that would look like a version rejection.
    //
    // ghl_submissions has NO ghl_contact_id column — it never has. The id lives
    // inside the ghl_response jsonb, which is where the app reads it from too
    // (see normalizeGhlSubmission). Selecting it as a column returned nothing
    // and every contact-dependent probe silently skipped, so this check
    // reported less than it appeared to. 868 of 876 rows carry one.
    const { data: sample } = await supabase
      .from("ghl_submissions")
      .select("ghl_response")
      .not("ghl_response->>ghl_contact_id", "is", null)
      .limit(1)
      .maybeSingle();
    const contactId: string | null =
      (sample?.ghl_response as Record<string, unknown> | null)?.ghl_contact_id as string ?? null;

    const probes: { resource: string; path: string; skip?: string }[] = [
      { resource: "users", path: `/users/?locationId=${GHL_LOCATION_ID}` },
      { resource: "opportunities", path: `/opportunities/pipelines?locationId=${GHL_LOCATION_ID}` },
      { resource: "custom fields", path: `/locations/${GHL_LOCATION_ID}/customFields` },
      contactId
        ? { resource: "contacts", path: `/contacts/${contactId}` }
        : { resource: "contacts", path: "", skip: "no contact id on file to read" },
      contactId
        ? { resource: "notes", path: `/contacts/${contactId}/notes` }
        : { resource: "notes", path: "", skip: "needs a contact id" },
      contactId
        ? { resource: "appointments", path: `/contacts/${contactId}/appointments` }
        : { resource: "appointments", path: "", skip: "needs a contact id" },
    ];

    const results: Record<string, unknown>[] = [];
    for (const p of probes) {
      if (p.skip) {
        results.push({ resource: p.resource, status: "skipped", detail: p.skip });
        continue;
      }
      const res = await ghlFetch(p.path, { apiKey, version: GHL_V3 });
      results.push({
        resource: p.resource,
        status: res.ok ? "ok" : "failed",
        httpStatus: res.status,
        detail: res.ok ? null : (await res.text()).slice(0, 160),
      });
      await new Promise((r) => setTimeout(r, 120));
    }

    const failed = results.filter((r) => r.status === "failed");
    const okCount = results.filter((r) => r.status === "ok").length;

    return json({
      success: true,
      version: { sending: GHL_V3, legacyDefault: GHL_VERSION },
      results,
      verdict:
        failed.length === 0
          ? `All ${okCount} probes accepted Version: v3. The header is good across every resource we call.`
          : `${failed.length} of ${results.length} resources rejected or errored on v3 — see detail.`,
      caveat:
        "Reads only. This proves GoHighLevel accepts the v3 header per resource, which is the part of the migration that could fail wholesale. It does NOT prove write response-shape handling — exercising those means writing to a real client record, so do that deliberately on a lead you own.",
    });
  } catch (err) {
    console.error("[ghl-health] error", err);
    return json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});
