// =============================================================================
// alert-incomplete-bookings
// =============================================================================
// Sends a SINGLE digest email to sales@alfredai.bot listing fresh "incomplete
// booking" website leads (people who started the booking flow but never
// confirmed an appointment).
//
// ⚠️ SAFETY DESIGN — this function is built to be physically unable to spam.
// A previous alert cron scanned the ENTIRE GHL contact list and flooded sales
// with ~220 emails/day. This function is fundamentally different:
//
//   • Data source is ONLY our own captured website sessions (ghl_submissions
//     rows in the "Incomplete" segment). It NEVER queries the GHL contact list.
//   • It sends ONE digest per run, never one email per lead.
//   • It processes at most MAX_LEADS_PER_RUN (20) leads per run.
//   • Each lead is alerted at most ONCE ever (dedup via lead_alert_log).
//   • It is NOT scheduled. No cron/schedule is registered anywhere.
//
// TWO INDEPENDENT SAFETY SWITCHES — a real send requires BOTH:
//
//   1) enabled gate  — feature_flags.flag_key = 'incomplete_booking_alerts_enabled'
//                      DEFAULTS FALSE. When false, returns { enabled:false } and
//                      does nothing, even if called with dryRun:false.
//   2) dryRun         — request flag, DEFAULTS TRUE. When true (default),
//                      computes and returns the digest payload as JSON but
//                      sends NO email and writes NOTHING to lead_alert_log.
//
//   REAL SEND  ⇢  enabled === true  AND  dryRun === false
//
// To enable later, a human must flip BOTH:
//   • Set feature_flags row 'incomplete_booking_alerts_enabled' -> is_enabled = true
//   • Invoke this function with body { "dryRun": false }
// =============================================================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { SALES_EMAIL, getFullUrl } from "../_shared/config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ENABLED_FLAG = "incomplete_booking_alerts_enabled";
const ALERT_TYPE = "incomplete_booking";
const LEAD_SOURCE = "ghl_submissions";
const MAX_LEADS_PER_RUN = 20;
const FRESH_WINDOW_HOURS = 24;
const BOOKING_SKIP_MARKER = "Skipped for booking_shown";

interface SubmissionRow {
  id: string;
  lead_email: string | null;
  lead_name: string | null;
  lead_first_name: string | null;
  lead_last_name: string | null;
  lead_phone: string | null;
  source_page: string | null;
  ghl_status: string | null;
  created_at: string;
  ghl_response: Record<string, unknown> | null;
}

// Mirror of isIncomplete() from src/lib/leadSegments.ts (kept in sync manually):
// a ghl_submissions row that STARTED a booking but never confirmed — status is
// booking_shown (or ghl_response marks the booking flow reached), no confirmed
// appointment, and not confirmed/cancelled/rescheduled/archived.
function isBenignBookingSkip(status: string | null, resp: Record<string, unknown> | null): boolean {
  if (status === "booking_shown") return true;
  const syncError = (resp?.ghl_sync_error as string | undefined) ?? "";
  return syncError.includes(BOOKING_SKIP_MARKER);
}

function isIncomplete(row: SubmissionRow): boolean {
  const status = (row.ghl_status ?? "").toLowerCase();
  if (["confirmed", "cancelled", "rescheduled", "archived"].includes(status)) return false;
  const resp = (row.ghl_response ?? {}) as Record<string, unknown>;
  const startedBooking =
    isBenignBookingSkip(row.ghl_status, resp) || resp.booking_completed_in_frame != null;
  return startedBooking;
}

function leadName(row: SubmissionRow): string {
  return (
    row.lead_name ||
    [row.lead_first_name, row.lead_last_name].filter(Boolean).join(" ") ||
    "Unknown"
  ).trim();
}

async function sendDigestEmail(subject: string, html: string) {
  const gmailUser = Deno.env.get("GMAIL_USER");
  const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");
  if (!gmailUser || !gmailPassword) throw new Error("Gmail credentials not configured");

  const client = new SMTPClient({
    connection: {
      hostname: "smtp.gmail.com",
      port: 465,
      tls: true,
      auth: { username: gmailUser, password: gmailPassword },
    },
  });
  try {
    await client.send({
      from: `alfred ai <${gmailUser}>`,
      to: SALES_EMAIL, // ONLY recipient — never changed or expanded.
      subject,
      content: "This email contains HTML content. Please view it in an HTML-compatible email client.",
      html,
    });
  } finally {
    await client.close();
  }
}

function buildDigestHtml(leads: Array<Record<string, string>>): string {
  const rows = leads
    .map(
      (l) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${l.name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${l.contact}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${l.page}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${l.time}</td>
      </tr>`,
    )
    .join("");
  return `
  <div style="font-family:Arial,sans-serif;color:#0f172a;max-width:640px;margin:0 auto;">
    <h2 style="margin:0 0 8px;">Incomplete booking leads (${leads.length})</h2>
    <p style="color:#475569;margin:0 0 16px;">
      These people started a booking on the website in the last ${FRESH_WINDOW_HOURS}h but never confirmed an appointment. Follow up while they're warm.
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead>
        <tr style="text-align:left;background:#f8fafc;">
          <th style="padding:8px 12px;border-bottom:2px solid #cbd5e1;">Name</th>
          <th style="padding:8px 12px;border-bottom:2px solid #cbd5e1;">Contact</th>
          <th style="padding:8px 12px;border-bottom:2px solid #cbd5e1;">Source page</th>
          <th style="padding:8px 12px;border-bottom:2px solid #cbd5e1;">Started</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="color:#94a3b8;font-size:12px;margin-top:20px;">
      <a href="${getFullUrl("/admin/leads")}" style="color:#2563eb;">Open the Leads Inbox</a>
    </p>
  </div>`;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // dryRun DEFAULTS TRUE. It's only false when explicitly set to false.
    let dryRun = true;
    if (req.method === "POST" || req.method === "PUT") {
      try {
        const body = await req.clone().json();
        if (body && body.dryRun === false) dryRun = false;
      } catch (_) { /* no/invalid body — stay in safe default */ }
    }

    // Switch 1: enabled gate (feature flag). Defaults FALSE / missing => disabled.
    const { data: flag } = await supabase
      .from("feature_flags")
      .select("is_enabled")
      .eq("flag_key", ENABLED_FLAG)
      .maybeSingle();
    const enabled = flag?.is_enabled === true;

    // Gather candidate rows: fresh (last 24h), not archived. We over-select then
    // filter with the mirrored isIncomplete() logic in code.
    const sinceIso = new Date(Date.now() - FRESH_WINDOW_HOURS * 3600 * 1000).toISOString();
    const { data: rows, error } = await supabase
      .from("ghl_submissions")
      .select(
        "id, lead_email, lead_name, lead_first_name, lead_last_name, lead_phone, source_page, ghl_status, created_at, ghl_response",
      )
      .is("archived_at", null)
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;

    const incomplete = (rows ?? []).filter((r) => isIncomplete(r as SubmissionRow));

    // Skip anything already alerted (dedup — alerted at most once ever).
    const { data: alreadyAlerted } = await supabase
      .from("lead_alert_log")
      .select("lead_id")
      .eq("lead_source", LEAD_SOURCE)
      .eq("alert_type", ALERT_TYPE);
    const alertedIds = new Set((alreadyAlerted ?? []).map((a) => a.lead_id));

    const fresh = incomplete
      .filter((r) => !alertedIds.has(r.id))
      .slice(0, MAX_LEADS_PER_RUN); // Hard cap: at most 20 leads per run.

    const leads = fresh.map((r) => {
      const row = r as SubmissionRow;
      return {
        id: row.id,
        name: leadName(row),
        contact: row.lead_email || row.lead_phone || "No contact",
        page: row.source_page || "—",
        time: row.created_at,
      };
    });

    const summaryBase = {
      enabled,
      dryRun,
      candidates: incomplete.length,
      newLeads: leads.length,
      cap: MAX_LEADS_PER_RUN,
      recipient: SALES_EMAIL,
      leads,
    };

    // Switch 1 blocks everything (even dryRun:false).
    if (!enabled) {
      return json({ ...summaryBase, sent: false, note: `Disabled: flag '${ENABLED_FLAG}' is off.` });
    }

    // Switch 2: dryRun (default). Compute only — no email, no log writes.
    if (dryRun) {
      return json({ ...summaryBase, sent: false, note: "dryRun: computed only, nothing sent or logged." });
    }

    // Nothing to send.
    if (leads.length === 0) {
      return json({ ...summaryBase, sent: false, note: "No new incomplete-booking leads to alert." });
    }

    // REAL SEND path: enabled === true AND dryRun === false.
    await sendDigestEmail(`${leads.length} incomplete booking${leads.length === 1 ? "" : "s"} to follow up`, buildDigestHtml(leads));

    // Only write to the log AFTER the email is actually sent.
    const { error: logError } = await supabase.from("lead_alert_log").insert(
      leads.map((l) => ({ lead_source: LEAD_SOURCE, lead_id: l.id, alert_type: ALERT_TYPE })),
    );
    if (logError) console.error("lead_alert_log insert error:", logError.message);

    return json({ ...summaryBase, sent: true, note: "Digest email sent to sales@alfredai.bot." });
  } catch (err) {
    console.error("alert-incomplete-bookings error:", err);
    // Return 200 with success:false to avoid frontend crashes (project convention).
    return json({ success: false, error: err instanceof Error ? err.message : String(err) }, 200);
  }
});
