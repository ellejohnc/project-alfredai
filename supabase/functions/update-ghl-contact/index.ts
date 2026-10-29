import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, ghlFetch, requireAdmin, GHL_V3 } from "../_shared/ghlClient.ts";

/**
 * PUT /contacts/{contactId} — admin-only push of editable contact fields
 * from the website → GHL, then mirror the change into local ghl_submissions
 * and leads rows so the app reflects immediately.
 *
 * Body: { contact_id, firstName?, lastName?, email?, phone?, companyName?, old_email? }
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const json = (obj: unknown, status = 200) =>
    new Response(JSON.stringify(obj), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const auth = await requireAdmin(req, supabase);
    if (!auth.ok) return json({ success: false, error: auth.error });

    const apiKey = Deno.env.get("GHL_API_KEY");
    if (!apiKey) return json({ success: false, error: "GHL_API_KEY missing" });

    const body = await req.json().catch(() => ({}));
    const contactId = String(body?.contact_id || "").trim();
    if (!contactId) return json({ success: false, error: "contact_id is required" });

    const has = (k: string) => Object.prototype.hasOwnProperty.call(body, k);
    const clean = (v: unknown) =>
      typeof v === "string" ? v.trim() : v === null ? null : v;

    const firstName = has("firstName") ? clean(body.firstName) : undefined;
    const lastName = has("lastName") ? clean(body.lastName) : undefined;
    const email = has("email") ? (clean(body.email) as string | null) : undefined;
    const phone = has("phone") ? clean(body.phone) : undefined;
    const companyName = has("companyName") ? clean(body.companyName) : undefined;
    const oldEmail = typeof body?.old_email === "string" ? body.old_email.trim().toLowerCase() : "";

    const ghlBody: Record<string, unknown> = {};
    if (firstName !== undefined) ghlBody.firstName = firstName ?? "";
    if (lastName !== undefined) ghlBody.lastName = lastName ?? "";
    if (email !== undefined) ghlBody.email = email ?? "";
    if (phone !== undefined) ghlBody.phone = phone ?? "";
    if (companyName !== undefined) ghlBody.companyName = companyName ?? "";

    if (Object.keys(ghlBody).length === 0) {
      return json({ success: false, error: "No fields to update" });
    }

    const res = await ghlFetch(`/contacts/${contactId}`, {
      apiKey,
      method: "PUT",
      body: ghlBody,
      version: GHL_V3,
    });
    const text = await res.text();
    if (!res.ok) {
      return json({
        success: false,
        error: `GHL PUT /contacts/${contactId} ${res.status}: ${text.slice(0, 400)}`,
      });
    }

    // --- Mirror locally ------------------------------------------------------
    const syncTs = new Date().toISOString();
    const emailLower = typeof email === "string" ? email.toLowerCase() : null;

    const buildMirror = (existing: Record<string, unknown>) => {
      const merged: Record<string, unknown> = {
        ...existing,
        ghl_contact_id: contactId,
        last_synced_at: syncTs,
      };
      if (firstName !== undefined) merged.ghl_first_name = firstName;
      if (lastName !== undefined) merged.ghl_last_name = lastName;
      if (phone !== undefined) merged.ghl_phone = phone;
      if (companyName !== undefined) {
        merged.ghl_business_name = companyName;
        merged.ghl_company_synced = true;
        merged.ghl_company_synced_at = syncTs;
      }
      return merged;
    };

    const matched: Record<string, number> = { ghl_submissions: 0, leads: 0 };

    // ---- ghl_submissions ---------------------------------------------------
    try {
      let subs: { id: string; ghl_response: unknown }[] = [];
      const q1 = await supabase
        .from("ghl_submissions")
        .select("id, ghl_response")
        .filter("ghl_response->>ghl_contact_id", "eq", contactId);
      if (!q1.error && q1.data) subs = q1.data as typeof subs;

      if (subs.length === 0 && oldEmail) {
        const q2 = await supabase
          .from("ghl_submissions")
          .select("id, ghl_response")
          .ilike("lead_email", oldEmail);
        if (!q2.error && q2.data) subs = q2.data as typeof subs;
      }

      for (const row of subs) {
        const existing = (row.ghl_response as Record<string, unknown>) || {};
        const update: Record<string, unknown> = { ghl_response: buildMirror(existing) };
        if (firstName !== undefined) update.lead_first_name = firstName;
        if (lastName !== undefined) update.lead_last_name = lastName;
        if (phone !== undefined) update.lead_phone = phone;
        if (companyName !== undefined) update.lead_company = companyName;
        if (emailLower !== undefined && emailLower !== null) update.lead_email = emailLower;
        const { error: uerr } = await supabase
          .from("ghl_submissions")
          .update(update)
          .eq("id", row.id);
        if (!uerr) matched.ghl_submissions += 1;
      }
    } catch (e) {
      console.warn("[update-ghl-contact] ghl_submissions mirror failed:", e);
    }

    // ---- leads -------------------------------------------------------------
    try {
      let leads: { id: string; ghl_response: unknown }[] = [];
      const q1 = await supabase
        .from("leads")
        .select("id, ghl_response")
        .filter("ghl_response->>ghl_contact_id", "eq", contactId);
      if (!q1.error && q1.data) leads = q1.data as typeof leads;

      if (leads.length === 0 && oldEmail) {
        const q2 = await supabase
          .from("leads")
          .select("id, ghl_response")
          .ilike("email", oldEmail);
        if (!q2.error && q2.data) leads = q2.data as typeof leads;
      }

      for (const row of leads) {
        const existing = (row.ghl_response as Record<string, unknown>) || {};
        const update: Record<string, unknown> = { ghl_response: buildMirror(existing) };
        if (firstName !== undefined) update.first_name = firstName;
        if (lastName !== undefined) update.last_name = lastName;
        if (phone !== undefined) update.phone = phone;
        if (companyName !== undefined) update.company = companyName;
        if (emailLower !== undefined && emailLower !== null) update.email = emailLower;
        const { error: uerr } = await supabase
          .from("leads")
          .update(update)
          .eq("id", row.id);
        if (!uerr) matched.leads += 1;
      }
    } catch (e) {
      console.warn("[update-ghl-contact] leads mirror failed:", e);
    }

    const totalMatched = matched.ghl_submissions + matched.leads;

    // ---- audit log ---------------------------------------------------------
    try {
      await supabase.from("ghl_sync_history").insert({
        lead_email: emailLower ?? oldEmail ?? null,
        ghl_contact_id: contactId,
        sync_status: totalMatched > 0 ? "success" : "no_match",
        sync_type: "contact_update_push",
        ghl_response: {
          pushed: ghlBody,
          matched_counts: matched,
          synced_at: syncTs,
          actor_id: auth.userId,
        },
      });
    } catch (e) {
      console.warn("[update-ghl-contact] history log failed:", e);
    }

    let parsed: unknown = null;
    try { parsed = JSON.parse(text); } catch { /* non-JSON success */ }
    return json({
      success: true,
      updated: parsed,
      matched_counts: matched,
    });
  } catch (err) {
    return json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});
