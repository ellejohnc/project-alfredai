// =============================================================================
// notify-lead-owner  (repurposed: BOOKED / SYNCED team digest)
// =============================================================================
// Sends a SINGLE digest email to sales@alfredai.bot listing website leads
// (ghl_submissions rows) that became newly BOOKED or SYNCED in the last 24h.
// This is a TEAM digest to the group inbox — it is NOT owner-routed. If a lead
// has an assigned owner (lead_annotations.owner_id) the owner's NAME is shown as
// a context column, but the owner's email is NEVER a recipient.
//
// ⚠️ SAFETY DESIGN — mirrors alert-incomplete-bookings, built to be physically
// unable to spam. A previous alert cron scanned the ENTIRE GHL contact list and
// flooded sales with ~220 emails/day. This function is fundamentally different:
//
//   • Data source is ONLY our own ghl_submissions rows (last 24h, not archived)
//     that are booked or synced. It NEVER queries the GHL contact list.
//   • Recipient is sales@alfredai.bot ONLY (the group inbox). Never individual
//     reps, never a broadcast.
//   • It sends ONE digest per run, never one email per lead.
//   • It processes at most MAX_LEADS_PER_RUN (20) leads per run.
//   • Each lead is included at most ONCE ever (dedup via lead_alert_log,
//     alert_type = 'booked_synced_group').
//
// TWO INDEPENDENT SAFETY SWITCHES — a real send requires BOTH:
//
//   1) enabled gate  — feature_flags.flag_key = 'booked_synced_alerts_enabled'
//                      DEFAULTS FALSE. When false, returns { enabled:false } and
//                      does nothing, even if called with dryRun:false.
//   2) dryRun         — request flag, DEFAULTS TRUE. When true (default),
//                      computes and returns the digest payload as JSON but
//                      sends NO email and writes NOTHING to lead_alert_log.
//
//   REAL SEND  ⇢  enabled === true  AND  dryRun === false
//
// KILL SWITCH: set feature_flags 'booked_synced_alerts_enabled' -> is_enabled
// = false to stop ALL sends regardless of the cron schedule.
// =============================================================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { SALES_EMAIL, getFullUrl } from "../_shared/config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ENABLED_FLAG = "booked_synced_alerts_enabled";
const ALERT_TYPE = "booked_synced_group";
const LEAD_SOURCE = "ghl_submissions";
const MAX_LEADS_PER_RUN = 20;
const FRESH_WINDOW_HOURS = 24;

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

const BOOKED_STATUSES = ["confirmed", "rescheduled"];

// Mirror of isBooked() from src/lib/leadSegments.ts (kept in sync manually):
// confirmed/rescheduled status OR an attached appointment id.
function isBooked(row: SubmissionRow): boolean {
  if (row.ghl_status && BOOKED_STATUSES.includes(row.ghl_status)) return true;
  const raw = (row.ghl_response ?? {}) as Record<string, unknown>;
  if (raw.appointment_id || raw.appointmentId) return true;
  return false;
}

// Mirror of isGHLSynced() from src/lib/ghlSyncStatus.ts (kept in sync manually).
function isGHLSynced(row: SubmissionRow): boolean {
  const response = (row.ghl_response ?? {}) as Record<string, unknown>;
  if (response.ghl_synced === true && response.ghl_verified === true) return true;
  if (row.ghl_status === "synced" && response.ghl_contact_id) return true;
  if (["confirmed", "cancelled", "rescheduled", "synced"].includes(row.ghl_status ?? "")) return true;
  return false;
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
      to: SALES_EMAIL, // ONLY recipient — the group inbox, never individual reps.
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
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${l.status}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${l.page}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${l.owner}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${l.time}</td>
      </tr>`,
    )
    .join("");
  return `
  <div style="font-family:Arial,sans-serif;color:#0f172a;max-width:720px;margin:0 auto;">
    <h2 style="margin:0 0 8px;">Newly booked / synced leads (${leads.length})</h2>
    <p style="color:#475569;margin:0 0 16px;">
      These website leads became booked or synced in the last ${FRESH_WINDOW_HOURS}h. Follow up while they're warm.
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead>
        <tr style="text-align:left;background:#f8fafc;">
          <th style="padding:8px 12px;border-bottom:2px solid #cbd5e1;">Name</th>
          <th style="padding:8px 12px;border-bottom:2px solid #cbd5e1;">Contact</th>
          <th style="padding:8px 12px;border-bottom:2px solid #cbd5e1;">Status</th>
          <th style="padding:8px 12px;border-bottom:2px solid #cbd5e1;">Source page</th>
          <th style="padding:8px 12px;border-bottom:2px solid #cbd5e1;">Owner</th>
          <th style="padding:8px 12px;border-bottom:2px solid #cbd5e1;">When</th>
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

    // dryRun DEFAULTS TRUE. Only false when explicitly set to false.
    let dryRun = true;
    if (req.method === "POST" || req.method === "PUT") {
      try {
        const body = await req.clone().json();
        if (body && body.dryRun === false) dryRun = false;
      } catch (_) { /* no/invalid body — stay in safe default */ }
    }

    // Switch 1: enabled gate. Defaults FALSE / missing => disabled.
    const { data: flag } = await supabase
      .from("feature_flags")
      .select("is_enabled")
      .eq("flag_key", ENABLED_FLAG)
      .maybeSingle();
    const enabled = flag?.is_enabled === true;

    // Candidate rows: created in the last 24h, not archived.
    const sinceIso = new Date(Date.now() - FRESH_WINDOW_HOURS * 3600 * 1000).toISOString();
    const { data: rows, error } = await supabase
      .from("ghl_submissions")
      .select(
        "id, lead_email, lead_name, lead_first_name, lead_last_name, lead_phone, source_page, ghl_status, created_at, ghl_response",
      )
      .is("archived_at", null)
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw error;

    // Booked OR synced — ALL such leads (owner or not).
    const relevant = (rows ?? []).filter((r) => {
      const row = r as SubmissionRow;
      return isBooked(row) || isGHLSynced(row);
    }) as SubmissionRow[];

    // Dedup: skip anything already included (once ever).
    const { data: alreadyAlerted } = await supabase
      .from("lead_alert_log")
      .select("lead_id")
      .eq("lead_source", LEAD_SOURCE)
      .eq("alert_type", ALERT_TYPE);
    const alertedIds = new Set((alreadyAlerted ?? []).map((a) => a.lead_id));

    const fresh = relevant
      .filter((r) => !alertedIds.has(r.id))
      .slice(0, MAX_LEADS_PER_RUN); // Hard cap: at most 20 leads per run.

    // Owner NAME lookup (context column only — never a recipient).
    const ids = fresh.map((r) => r.id);
    const ownerNameByLead = new Map<string, string>();
    if (ids.length > 0) {
      const { data: annos } = await supabase
        .from("lead_annotations")
        .select("lead_id, owner_id")
        .eq("lead_source", LEAD_SOURCE)
        .in("lead_id", ids)
        .not("owner_id", "is", null);
      const ownerIds = [...new Set((annos ?? []).map((a) => a.owner_id as string).filter(Boolean))];
      const nameById = new Map<string, string>();
      if (ownerIds.length > 0) {
        const { data: users } = await supabase
          .from("admin_users")
          .select("id, full_name, email")
          .in("id", ownerIds);
        for (const u of users ?? []) {
          nameById.set(u.id as string, (u.full_name as string) || (u.email as string) || "Owner");
        }
      }
      for (const a of annos ?? []) {
        if (a.owner_id) {
          ownerNameByLead.set(a.lead_id as string, nameById.get(a.owner_id as string) || "Owner");
        }
      }
    }

    const leads = fresh.map((r) => {
      const row = r as SubmissionRow;
      return {
        id: row.id,
        name: leadName(row),
        contact: row.lead_email || row.lead_phone || "No contact",
        status: isBooked(row) ? "Booked" : "Synced",
        page: row.source_page || "—",
        owner: ownerNameByLead.get(row.id) || "Unassigned",
        time: row.created_at,
      };
    });

    const summaryBase = {
      enabled,
      dryRun,
      leadsMatched: leads.length,
      candidates: relevant.length,
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
      return json({ ...summaryBase, sent: false, note: "No new booked/synced leads to alert." });
    }

    // REAL SEND path: enabled === true AND dryRun === false.
    await sendDigestEmail(
      `${leads.length} newly booked/synced lead${leads.length > 1 ? "s" : ""}`,
      buildDigestHtml(leads),
    );

    // Log each lead so it's never included again (dedup — once ever).
    const logRows = leads.map((l) => ({
      lead_id: l.id,
      lead_source: LEAD_SOURCE,
      alert_type: ALERT_TYPE,
    }));
    const { error: logError } = await supabase.from("lead_alert_log").insert(logRows);
    if (logError) throw logError;

    return json({
      ...summaryBase,
      sent: true,
      note: `Sent 1 digest to ${SALES_EMAIL} with ${leads.length} lead(s).`,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return json({ success: false, error: message }, 200);
  }
});
