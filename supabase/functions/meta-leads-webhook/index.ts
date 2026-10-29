import { createClient } from "npm:@supabase/supabase-js@2";

// The no-generic overload of createClient() resolves to a restrictive client
// type (tables/rows = never, rpc args = undefined). Use an any-database alias
// so the webhook can insert/update meta_leads without shipping generated types.
type SupabaseClientAny = ReturnType<typeof createClient<any>>;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const GRAPH_VERSION = "v21.0";

// Verify Meta's X-Hub-Signature-256 header (HMAC-SHA256 of the raw body).
async function verifyMetaSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string,
): Promise<boolean> {
  if (!signatureHeader) return false;
  const expectedHex = signatureHeader.startsWith("sha256=")
    ? signatureHeader.slice("sha256=".length)
    : signatureHeader;
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(appSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sigBuf = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(rawBody),
    );
    const computedHex = Array.from(new Uint8Array(sigBuf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    if (computedHex.length !== expectedHex.length) return false;
    // Constant-time comparison.
    let diff = 0;
    for (let i = 0; i < computedHex.length; i++) {
      diff |= computedHex.charCodeAt(i) ^ expectedHex.charCodeAt(i);
    }
    return diff === 0;
  } catch {
    return false;
  }
}

interface FieldDatum {
  name: string;
  values: string[];
}

function mapFieldData(fieldData: FieldDatum[]) {
  const get = (...keys: string[]) => {
    for (const f of fieldData || []) {
      if (keys.includes(f.name?.toLowerCase?.())) {
        return f.values?.[0] ?? null;
      }
    }
    return null;
  };

  const firstName = get("first_name");
  const lastName = get("last_name");
  const fullName =
    get("full_name", "name") ||
    [firstName, lastName].filter(Boolean).join(" ").trim() ||
    null;

  return {
    full_name: fullName || null,
    email: get("email", "work_email"),
    phone: get("phone_number", "phone", "work_phone_number"),
  };
}

// Determine the client (AlfredAI or Palantir) — adjust mapping as needed.
function resolveClient(formName: string | null): string {
  if (formName && /palantir/i.test(formName)) return "Palantir";
  return "AlfredAI";
}

async function processLeadgen(
  leadgenId: string,
  formIdFromHook: string | null,
  pageToken: string,
  supabase: SupabaseClientAny,
) {
  try {
    // --- Deduplication: skip if we already processed this leadgen_id ---
    // (Meta retries webhook deliveries; this guarantees one notification per lead.)
    const { data: existing } = await supabase
      .from("meta_leads")
      .select("id")
      .eq("leadgen_id", leadgenId)
      .maybeSingle();

    if (existing) {
      console.log("Skipping duplicate meta lead", leadgenId);
      return;
    }

    const url = `https://graph.facebook.com/${GRAPH_VERSION}/${leadgenId}?access_token=${pageToken}`;
    const res = await fetch(url);
    const lead = await res.json();

    if (!res.ok) {
      console.error("Graph API error for leadgen", leadgenId, lead);
      return;
    }

    const mapped = mapFieldData(lead.field_data || []);
    const formName = lead.form_name ?? null;
    const client = resolveClient(formName);

    const row = {
      leadgen_id: leadgenId,
      full_name: mapped.full_name,
      email: mapped.email,
      phone: mapped.phone,
      form_name: formName,
      form_id: lead.form_id ?? formIdFromHook,
      campaign_id: lead.campaign_id ?? null,
      ad_id: lead.ad_id ?? null,
      client,
      status: "new",
      submitted_at: lead.created_time ?? null,
      raw_payload: lead,
    };

    // Insert with conflict guard on leadgen_id (handles concurrent retries).
    const { data: inserted, error } = await supabase
      .from("meta_leads")
      .upsert(row, { onConflict: "leadgen_id", ignoreDuplicates: true })
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("Insert error for leadgen", leadgenId, error);
      return;
    }
    if (!inserted) {
      // Conflict — another delivery already inserted it. No duplicate email.
      console.log("Concurrent duplicate meta lead skipped", leadgenId);
      return;
    }

    console.log("Inserted meta lead", leadgenId);

    // --- Fire the sales notification once, fallback-safe ---
    let notifStatus = "sent";
    let notifError: string | null = null;
    try {
      const { error: notifyErr } = await supabase.functions.invoke("notify-new-lead", {
        body: {
          lead_email: mapped.email ?? "unknown@meta-lead",
          lead_name: mapped.full_name ?? undefined,
          lead_phone: mapped.phone ?? undefined,
          source_page: "Meta Lead Ads",
          source_medium: "meta_lead_ads",
          lead_source: "meta_lead_ads",
          traffic_source: "Facebook",
          client,
          form_name: formName ?? undefined,
          form_id: (lead.form_id ?? formIdFromHook) ?? undefined,
          campaign_id: lead.campaign_id ?? undefined,
          ad_id: lead.ad_id ?? undefined,
          record_id: inserted.id || undefined,
          record_type: 'meta_lead',
        },
      });
      if (notifyErr) {
        notifStatus = "failed";
        notifError = notifyErr.message ?? String(notifyErr);
        console.error("notify-new-lead failed for", leadgenId, notifyErr);
      }
    } catch (e) {
      notifStatus = "failed";
      notifError = e instanceof Error ? e.message : String(e);
      console.error("notify-new-lead threw for", leadgenId, e);
    }

    // Record notification outcome on the lead (never blocks the lead being saved).
    await supabase
      .from("meta_leads")
      .update({
        notification_status: notifStatus,
        notification_sent_at: notifStatus === "sent" ? new Date().toISOString() : null,
        notification_error: notifError,
      })
      .eq("id", inserted.id);
  } catch (err) {
    console.error("processLeadgen failed", leadgenId, err);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const verifyToken = Deno.env.get("META_VERIFY_TOKEN");
  const pageToken = Deno.env.get("META_PAGE_TOKEN");

  // Meta verification challenge
  if (req.method === "GET") {
    const params = new URL(req.url).searchParams;
    const mode = params.get("hub.mode");
    const token = params.get("hub.verify_token");
    const challenge = params.get("hub.challenge");

    if (mode === "subscribe" && token && token === verifyToken && challenge) {
      return new Response(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }
    return new Response("Forbidden", { status: 403 });
  }

  if (req.method === "POST") {
    // Read the raw body once (needed for HMAC verification); JSON.parse it ourselves.
    const rawBody = await req.text();

    // Optional Meta signature verification (non-breaking: skipped if secret unset).
    const appSecret = Deno.env.get("META_APP_SECRET");
    if (appSecret) {
      const sigHeader =
        req.headers.get("x-hub-signature-256") ||
        req.headers.get("X-Hub-Signature-256");
      const valid = await verifyMetaSignature(rawBody, sigHeader, appSecret);
      if (!valid) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid signature" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    let body: any = {};
    try {
      body = JSON.parse(rawBody);
    } catch {
      return new Response(JSON.stringify({ success: true, ignored: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    ) as SupabaseClientAny;

    const jobs: Array<{ leadgenId: string; formId: string | null }> = [];
    try {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const v = change.value || {};
          const leadgenId = v.leadgen_id;
          if (leadgenId) {
            jobs.push({
              leadgenId: String(leadgenId),
              formId: v.form_id ? String(v.form_id) : null,
            });
          }
        }
      }
    } catch (err) {
      console.error("Failed to parse webhook entries", err);
    }

    // Ack quickly; process leads in the background.
    const processAll = async () => {
      if (!pageToken) {
        console.error("META_PAGE_TOKEN is not set; cannot fetch lead details");
        return;
      }
      for (const job of jobs) {
        await processLeadgen(job.leadgenId, job.formId, pageToken, supabase);
      }
    };

    // @ts-ignore EdgeRuntime is available in Supabase functions runtime
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(processAll());
    } else {
      await processAll();
    }

    return new Response(JSON.stringify({ success: true, received: jobs.length }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response("Method Not Allowed", { status: 405 });
});
