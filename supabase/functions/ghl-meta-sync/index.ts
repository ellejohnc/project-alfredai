import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-ghl-signature",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

/**
 * GHL -> Meta Leads sync
 *
 * GHL already receives Facebook/Instagram (Meta) Lead Ads contacts. This endpoint
 * lets a GHL workflow POST those contacts here so they automatically appear on the
 * admin Meta Leads page (public.meta_leads), deduplicated, with a sales notification.
 *
 * Configure in GHL: add a "Webhook" action to a workflow that fires when a contact
 * with a Facebook/Instagram source is created, pointing at this function URL.
 */

// Pull a value from a loosely-structured payload using multiple possible keys.
function pick(obj: Record<string, unknown>, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      return String(v);
    }
  }
  return null;
}

// Decide whether the lead actually originated from Meta (Facebook/Instagram).
function isMetaSource(text: string | null): boolean {
  if (!text) return false;
  return /facebook|instagram|\bfb\b|\big\b|meta\b|lead\s*ad/i.test(text);
}

function resolveClient(formName: string | null): string {
  if (formName && /palantir/i.test(formName)) return "Palantir";
  return "AlfredAI";
}

function resolveTrafficSource(text: string | null): string {
  if (text && /instagram|\big\b/i.test(text)) return "Instagram";
  return "Facebook";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    // Optional shared-secret auth (non-breaking: skipped if secret unset).
    const syncSecret = Deno.env.get("GHL_SYNC_SECRET");
    if (syncSecret) {
      const provided =
        req.headers.get("x-ghl-sync-secret") ||
        new URL(req.url).searchParams.get("secret");
      if (provided !== syncSecret) {
        return new Response(
          JSON.stringify({ success: false, error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let payload: Record<string, unknown> = {};
    try {
      payload = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid JSON body" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // GHL nests the contact under various keys depending on workflow config.
    const contact =
      (payload.contact as Record<string, unknown>) ||
      (payload.data as Record<string, unknown>) ||
      payload;

    const email = pick(contact, "email", "primaryEmail", "Email") || pick(payload, "email");
    const firstName = pick(contact, "first_name", "firstName", "First Name");
    const lastName = pick(contact, "last_name", "lastName", "Last Name");
    const fullName =
      pick(contact, "full_name", "name", "fullName", "Full Name") ||
      [firstName, lastName].filter(Boolean).join(" ").trim() ||
      null;
    const phone = pick(contact, "phone", "phone_number", "Phone");

    // Source / attribution signals from GHL.
    const sourceText = [
      pick(contact, "source", "Source", "contactSource"),
      pick(payload, "source", "attributionSource"),
      (Array.isArray(contact.tags) ? (contact.tags as string[]).join(",") : null),
    ]
      .filter(Boolean)
      .join(",");

    const formName =
      pick(contact, "form_name", "formName", "Form Name") ||
      pick(payload, "form_name", "formName");
    const formId = pick(contact, "form_id", "formId") || pick(payload, "form_id", "formId");
    const campaignId =
      pick(contact, "campaign_id", "campaignId") || pick(payload, "campaign_id", "campaignId");
    const adId = pick(contact, "ad_id", "adId") || pick(payload, "ad_id", "adId");
    const contactId = pick(contact, "id", "contact_id", "contactId") || pick(payload, "contactId");

    // Only sync Meta-origin leads (unless caller explicitly forces it).
    // `force` can be set in the JSON body OR as a `?force=true` query param — the
    // latter lets a GHL workflow (which already filters to Meta leads) bypass the
    // source check via the webhook URL, even when GHL's payload omits a source field.
    const forceParam = new URL(req.url).searchParams.get("force");
    const force =
      payload.force === true ||
      payload.force === "true" ||
      forceParam === "true" ||
      forceParam === "1";
    if (!force && !isMetaSource(sourceText) && !isMetaSource(formName)) {
      return new Response(
        JSON.stringify({
          success: true,
          skipped: true,
          reason: "Not a Meta (Facebook/Instagram) lead",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!email && !phone && !contactId) {
      return new Response(
        JSON.stringify({ success: false, error: "No email, phone, or contact id in payload" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Stable dedup key: reuse leadgen_id unique index with a GHL-derived id.
    const leadgenId = `ghl_${contactId || email || phone}`;

    // Skip if we already have this lead.
    const { data: existing } = await supabase
      .from("meta_leads")
      .select("id")
      .eq("leadgen_id", leadgenId)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ success: true, deduped: true, id: existing.id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const client = resolveClient(formName);
    const trafficSource = resolveTrafficSource(sourceText || formName);

    const row = {
      leadgen_id: leadgenId,
      full_name: fullName,
      email: email,
      phone: phone,
      form_name: formName,
      form_id: formId,
      campaign_id: campaignId,
      ad_id: adId,
      client,
      status: "new",
      submitted_at: pick(contact, "date_created", "createdAt", "submitted_at") || new Date().toISOString(),
      raw_payload: payload,
    };

    const { data: inserted, error } = await supabase
      .from("meta_leads")
      .upsert(row, { onConflict: "leadgen_id", ignoreDuplicates: true })
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("meta_leads insert error", error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!inserted) {
      // Concurrent duplicate — another delivery inserted it first.
      return new Response(
        JSON.stringify({ success: true, deduped: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fire the sales notification (fallback-safe — never blocks the lead being saved).
    let notifStatus = "sent";
    let notifError: string | null = null;
    try {
      const { error: notifyErr } = await supabase.functions.invoke("notify-new-lead", {
        body: {
          lead_email: email ?? "unknown@meta-lead",
          lead_name: fullName ?? undefined,
          lead_phone: phone ?? undefined,
          source_page: "Meta Lead Ads (via GHL)",
          source_medium: "meta_lead_ads",
          lead_source: "meta_lead_ads",
          traffic_source: trafficSource,
          client,
          form_name: formName ?? undefined,
          form_id: formId ?? undefined,
          campaign_id: campaignId ?? undefined,
          ad_id: adId ?? undefined,
          record_id: inserted.id || undefined,
          record_type: 'meta_lead',
          ghl_contact_id: contactId || undefined,
        },
      });
      if (notifyErr) {
        notifStatus = "failed";
        notifError = notifyErr.message ?? String(notifyErr);
        console.error("notify-new-lead failed for GHL meta lead", leadgenId, notifyErr);
      }
    } catch (e) {
      notifStatus = "failed";
      notifError = e instanceof Error ? e.message : String(e);
      console.error("notify-new-lead threw for GHL meta lead", leadgenId, e);
    }

    await supabase
      .from("meta_leads")
      .update({
        notification_status: notifStatus,
        notification_sent_at: notifStatus === "sent" ? new Date().toISOString() : null,
        notification_error: notifError,
      })
      .eq("id", inserted.id);

    return new Response(
      JSON.stringify({ success: true, id: inserted.id, traffic_source: trafficSource }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("ghl-meta-sync failed", err);
    const message = err instanceof Error ? err.message : "Internal error";
    // Return 200 with success:false so GHL doesn't endlessly retry.
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
