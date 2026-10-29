import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  ghlFetch,
  corsHeaders,
  GHL_LOCATION_ID,
  requireAdmin,
  GHL_V3,
} from "../_shared/ghlClient.ts";

/**
 * push-lead-to-ghl — force-creates (or links) a GHL contact for an INCOMPLETE
 * ghl_submissions lead (booking_shown / benign-skip) that never made it into
 * GHL. Uses the same search-then-create path as log-ghl-submission so we don't
 * duplicate an existing contact.
 *
 * Body: { submission_id: string }
 * Writes back into ghl_submissions:
 *   ghl_response = { ...existing, ghl_contact_id, pushed_at, pushed_by }
 *   ghl_status   = 'contact_created' (or 'contact_linked' if we matched by email)
 *
 * After this succeeds, the lead has a ghl_contact_id, so isIncomplete() drops
 * it from the Incomplete tab and it reclassifies as Website / Booked.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };
  const ok = (b: unknown) => new Response(JSON.stringify(b), { status: 200, headers: jsonHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const apiKey = Deno.env.get("GHL_API_KEY");
    if (!apiKey) return ok({ success: false, error: "GHL_API_KEY not configured" });

    const auth = await requireAdmin(req, supabase);
    if (!auth.ok) return ok({ success: false, error: auth.error });

    const body = await req.json().catch(() => ({}));
    const submissionId = String(body.submission_id ?? "").trim();
    if (!submissionId) return ok({ success: false, error: "submission_id required" });

    const { data: row, error: fetchErr } = await supabase
      .from("ghl_submissions")
      .select("id, lead_name, lead_email, lead_phone, lead_company, source_page, source_medium, source_campaign, ghl_status, ghl_response")
      .eq("id", submissionId)
      .maybeSingle();
    if (fetchErr || !row) return ok({ success: false, error: fetchErr?.message || "Submission not found" });

    const resp = (row.ghl_response ?? {}) as Record<string, unknown>;
    const existingId = (resp.ghl_contact_id as string | undefined) || null;
    if (existingId) {
      return ok({ success: true, alreadyLinked: true, contact_id: existingId });
    }

    const email = (row.lead_email || "").trim().toLowerCase();
    const phone = (row.lead_phone || "").trim();
    if (!email && !phone) {
      return ok({ success: false, error: "Lead needs an email or phone before pushing to GHL" });
    }

    const name = (row.lead_name || "").trim();
    const [firstName, ...rest] = name.split(/\s+/).filter(Boolean);
    const lastName = rest.join(" ");
    const tags = [
      "manual-push",
      "incomplete-recovered",
      row.source_campaign && `campaign:${row.source_campaign}`,
      row.source_medium && `medium:${row.source_medium}`,
    ].filter(Boolean) as string[];

    // 1) Search by email (or phone if no email)
    let contactId: string | null = null;
    let linked = false;
    try {
      const searchRes = await ghlFetch("/contacts/search", {
        apiKey,
        method: "POST",
        body: {
          locationId: GHL_LOCATION_ID,
          query: email || phone,
          page: 1,
          pageLimit: 20,
        },
        version: GHL_V3,
      });
      if (searchRes.ok) {
        const searchData: any = await searchRes.json();
        const contacts = Array.isArray(searchData.contacts) ? searchData.contacts : [];
        const match = contacts.find((c: any) =>
          (email && c.email && String(c.email).toLowerCase() === email) ||
          (phone && c.phone && String(c.phone).replace(/\D/g, "").endsWith(phone.replace(/\D/g, "").slice(-10)))
        );
        if (match?.id) {
          contactId = match.id;
          linked = true;
        }
      }
    } catch (e) {
      console.warn("[push-lead-to-ghl] search failed:", e);
    }

    // 2) Create if no match
    if (!contactId) {
      const createRes = await ghlFetch("/contacts/", {
        apiKey,
        method: "POST",
        body: {
          locationId: GHL_LOCATION_ID,
          email: email || undefined,
          phone: phone || undefined,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          companyName: row.lead_company || undefined,
          tags,
          source: "AlfredAI Admin – Manual Push",
        },
        version: GHL_V3,
      });
      const createText = await createRes.text();
      if (!createRes.ok) {
        // If GHL says duplicate, try to extract existing id
        try {
          const parsed = JSON.parse(createText);
          const dupId = parsed?.meta?.contactId || parsed?.contact?.id;
          if (dupId) {
            contactId = dupId;
            linked = true;
          }
        } catch { /* ignore */ }
        if (!contactId) {
          return ok({ success: false, error: `GHL create failed: ${createRes.status} ${createText.slice(0, 300)}` });
        }
      } else {
        const parsed = JSON.parse(createText);
        contactId = parsed?.contact?.id || parsed?.id || null;
      }
    }

    if (!contactId) return ok({ success: false, error: "GHL returned no contact id" });

    const newStatus = linked ? "contact_linked" : "contact_created";
    const nextResp = {
      ...resp,
      ghl_contact_id: contactId,
      pushed_at: new Date().toISOString(),
      pushed_by: auth.userId,
      push_result: linked ? "linked_existing" : "created_new",
    };
    const { error: updErr } = await supabase
      .from("ghl_submissions")
      .update({ ghl_status: newStatus, ghl_response: nextResp })
      .eq("id", submissionId);
    if (updErr) {
      console.warn("[push-lead-to-ghl] update failed:", updErr);
      return ok({ success: true, contact_id: contactId, linked, warning: "Contact created but DB update failed: " + updErr.message });
    }

    return ok({ success: true, contact_id: contactId, linked });
  } catch (e) {
    console.error("[push-lead-to-ghl] error:", e);
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : String(e) }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
