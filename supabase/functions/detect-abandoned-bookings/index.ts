import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getFullUrl } from "../_shared/config.ts";
import { GHL_V3 } from "../_shared/ghlClient.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// "Book an AI Impact Conversation - AlfredAi" calendar
const IMPACT_CALENDAR_ID = "UzsgmkS3VDB4iavKB8Dx";
// One-click manual-book link target (Impact conversation calendar)
const MANUAL_BOOK_URL = `https://api.leadconnectorhq.com/widget/booking/${IMPACT_CALENDAR_ID}`;

// Detection windows (minutes) — only alert on genuine booking-flow starts that
// are old enough to have finished but not so old they're stale.
const MIN_AGE_MINUTES = 30;   // must be at least this old with no appointment
const MAX_AGE_MINUTES = 180;  // ignore anything older than this

// Safety valve: never send more than this many alerts in a single run.
const MAX_ALERTS_PER_RUN = 5;

const GHL_BASE = "https://services.leadconnectorhq.com";
const GHL_VERSION = GHL_V3;

interface GHLAppointment {
  calendarId?: string;
  appointmentStatus?: string;
}

interface SubmissionRow {
  id: string;
  lead_email: string | null;
  lead_name: string | null;
  lead_first_name: string | null;
  lead_last_name: string | null;
  lead_phone: string | null;
  lead_company: string | null;
  ghl_status: string | null;
  created_at: string;
  ghl_response: Record<string, unknown> | null;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startedAt = Date.now();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const ghlApiKey = Deno.env.get("GHL_API_KEY");
  const ghlLocationId = Deno.env.get("GHL_LOCATION_ID");

  // Dry-run mode: check ?dry_run=true or body { dry_run: true }.
  let dryRun = new URL(req.url).searchParams.get("dry_run") === "true";
  if (!dryRun && (req.method === "POST" || req.method === "PUT")) {
    try {
      const body = await req.clone().json();
      if (body && body.dry_run === true) dryRun = true;
    } catch (_) { /* no/invalid body — ignore */ }
  }

  let candidates = 0;
  let alerted = 0;
  let wouldAlert = 0;
  let skippedHasAppt = 0;
  let skippedDeduped = 0;
  let skippedNoContact = 0;
  let skippedCap = 0;
  const errors: string[] = [];

  const logResult = async (status: string, httpStatus: number, message: string, errorMessage?: string) => {
    try {
      await supabase.from("webhook_logs").insert({
        function_name: "detect-abandoned-bookings",
        request_method: req.method,
        status,
        http_status: httpStatus,
        message,
        error_message: errorMessage ?? null,
        duration_ms: Date.now() - startedAt,
        meta: {
          dryRun, candidates, alerted, wouldAlert,
          skippedHasAppt, skippedDeduped, skippedNoContact, skippedCap,
          errors,
        },
      });
    } catch (e) {
      console.error("Failed to write webhook_logs:", e);
    }
  };

  try {
    if (!ghlApiKey || !ghlLocationId) {
      await logResult("error", 200, "GHL API key or Location ID not configured");
      return new Response(
        JSON.stringify({ success: false, error: "GHL not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const ghlHeaders = {
      Authorization: `Bearer ${ghlApiKey}`,
      Version: GHL_VERSION,
      "Content-Type": "application/json",
    };

    const nowIso = new Date().toISOString();
    const minAgeIso = new Date(Date.now() - MIN_AGE_MINUTES * 60 * 1000).toISOString();
    const maxAgeIso = new Date(Date.now() - MAX_AGE_MINUTES * 60 * 1000).toISOString();

    // 1. SCOPE — drive the scan from OUR data, never from all GHL contacts.
    //    Only rows that represent an ACTUAL booking-flow start:
    //      - ghl_status = 'booking_shown', OR
    //      - ghl_response->>'booking_completed_in_frame' = 'true'
    //    …aged between MIN_AGE and MAX_AGE, and NOT already confirmed/abandoned.
    const { data: rowsRaw, error: selErr } = await supabase
      .from("ghl_submissions")
      .select("id, lead_email, lead_name, lead_first_name, lead_last_name, lead_phone, lead_company, ghl_status, created_at, ghl_response")
      .or("ghl_status.eq.booking_shown,ghl_response->>booking_completed_in_frame.eq.true")
      .lte("created_at", minAgeIso)   // at least MIN_AGE old
      .gte("created_at", maxAgeIso)   // not older than MAX_AGE
      .not("ghl_status", "in", "(confirmed,booking_abandoned,cancelled,archived_duplicate,deleted_from_ghl)")
      .order("created_at", { ascending: true })
      .limit(200);

    if (selErr) {
      await logResult("error", 200, "Submission query failed", JSON.stringify(selErr));
      return new Response(
        JSON.stringify({ success: false, error: "Submission query failed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const rows = (rowsRaw ?? []) as unknown as SubmissionRow[];
    candidates = rows.length;

    for (const row of rows) {
      const resp = (row.ghl_response ?? {}) as Record<string, unknown>;
      const email = (row.lead_email || "").toLowerCase().trim();
      const contactId = (resp["ghl_contact_id"] as string | undefined) || (resp["contact_id"] as string | undefined) || "";

      // Must have a GHL contact to verify against — otherwise we can't confirm
      // whether they actually booked. Skip (never alert blindly).
      if (!contactId) {
        skippedNoContact++;
        continue;
      }

      // 2. HARD DEDUP — has this submission/contact already been alerted?
      if (resp["booking_abandoned_alerted"] === true) {
        skippedDeduped++;
        continue;
      }
      try {
        const { data: existing } = await supabase
          .from("ghl_submissions")
          .select("id")
          .eq("ghl_status", "booking_abandoned")
          .filter("ghl_response->>ghl_contact_id", "eq", contactId)
          .limit(1);
        if ((existing?.length ?? 0) > 0) {
          skippedDeduped++;
          continue;
        }
      } catch (e) {
        errors.push(`dedupe ${row.id}: ${String(e)}`);
      }

      // 3. Verify against GHL — did an appointment appear since?
      let appointments: GHLAppointment[] = [];
      try {
        const apptRes = await fetch(
          `${GHL_BASE}/contacts/${contactId}/appointments`,
          { method: "GET", headers: ghlHeaders },
        );
        if (apptRes.ok) {
          const apptData = await apptRes.json();
          appointments = apptData.events || apptData.appointments || [];
        } else {
          const txt = await apptRes.text();
          errors.push(`appts ${contactId}: ${apptRes.status} ${txt.slice(0, 120)}`);
          // On lookup failure, be conservative: skip (never alert on uncertainty).
          skippedHasAppt++;
          continue;
        }
      } catch (e) {
        errors.push(`appts ${contactId}: ${String(e)}`);
        skippedHasAppt++;
        continue;
      }

      // Suppress if an Impact-calendar appointment now exists (they completed).
      const hasImpactAppt = appointments.some((a) => a.calendarId === IMPACT_CALENDAR_ID);
      if (hasImpactAppt) {
        skippedHasAppt++;
        continue;
      }

      // Genuine abandoned booking.
      const contactName =
        row.lead_name ||
        [row.lead_first_name, row.lead_last_name].filter(Boolean).join(" ").trim() ||
        (email ? email.split("@")[0] : "Unknown");

      // Safety-valve cap.
      if (alerted + wouldAlert >= MAX_ALERTS_PER_RUN) {
        skippedCap++;
        continue;
      }

      if (dryRun) {
        wouldAlert++;
        continue;
      }

      // 3b. Mark BEFORE sending so a re-run can never double-send.
      try {
        await supabase
          .from("ghl_submissions")
          .update({
            ghl_response: {
              ...resp,
              booking_abandoned_alerted: true,
              booking_abandoned_at: nowIso,
            },
          })
          .eq("id", row.id);
      } catch (e) {
        errors.push(`mark ${row.id}: ${String(e)}`);
        // If we couldn't set the guard, do NOT send (avoid spam risk).
        continue;
      }

      // Dedupe marker row (separate abandoned record).
      try {
        await supabase.from("ghl_submissions").insert({
          lead_email: email || null,
          lead_name: contactName,
          lead_phone: row.lead_phone || null,
          lead_company: row.lead_company || null,
          source_page: "/book",
          source_medium: "calendar_widget",
          lead_source: "calendar_widget",
          ghl_status: "booking_abandoned",
          ghl_response: {
            ghl_contact_id: contactId,
            source_submission_id: row.id,
            calendar_id: IMPACT_CALENDAR_ID,
            detected_at: nowIso,
            reason: "Booking flow started but no Impact-calendar appointment created",
          },
        });
      } catch (e) {
        errors.push(`marker insert ${contactId}: ${String(e)}`);
      }

      // Admin notification row.
      try {
        await supabase.from("admin_notifications").insert({
          type: "booking_abandoned",
          title: "⚠️ Booking started — not completed",
          body: `${contactName}${email ? ` (${email})` : ""} started the AI Impact Conversation booking but never completed it.`,
          link: getFullUrl("/admin/ghl-submissions"),
          metadata: { contact_id: contactId, submission_id: row.id, email, manual_book_url: MANUAL_BOOK_URL },
        });
      } catch (e) {
        errors.push(`admin_notif ${contactId}: ${String(e)}`);
      }

      // Email alert via notify-new-lead.
      try {
        const notifyRes = await fetch(`${supabaseUrl}/functions/v1/notify-new-lead`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseServiceKey}` },
          body: JSON.stringify({
            event: "booking_abandoned",
            lead_email: email || "unknown@no-email.local",
            lead_name: contactName,
            lead_phone: row.lead_phone || undefined,
            lead_company: row.lead_company || undefined,
            source_page: "/book",
            source_medium: "calendar_widget",
            lead_source: "calendar_widget",
            ghl_contact_id: contactId,
            manual_book_url: MANUAL_BOOK_URL,
            tags: ["booking-abandoned"],
          }),
        });
        if (!notifyRes.ok) {
          const txt = await notifyRes.text();
          errors.push(`notify ${contactId}: ${notifyRes.status} ${txt.slice(0, 120)}`);
        }
      } catch (e) {
        errors.push(`notify ${contactId}: ${String(e)}`);
      }

      alerted++;
    }

    const summary = dryRun
      ? `Dry run: ${wouldAlert} would be alerted (of ${candidates} candidates)`
      : `Scan complete: ${alerted} abandoned booking(s) alerted (of ${candidates} candidates)`;
    await logResult("success", 200, summary);

    return new Response(
      JSON.stringify({
        success: true,
        dryRun,
        candidates,
        alerted,
        wouldAlert,
        skippedHasAppt,
        skippedDeduped,
        skippedNoContact,
        skippedCap,
        maxAlertsPerRun: MAX_ALERTS_PER_RUN,
        errors,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("detect-abandoned-bookings error:", msg);
    await logResult("error", 200, "Unhandled error", msg);
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
