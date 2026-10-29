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
 * push-b2b-lead-to-ghl — manual "Push to GHL" for a B2B Matchmaking lead in
 * the `leads` table (source_campaign = 'alfred_b2b_matchmaking').
 *
 * Field mapping (uses EXISTING GHL fields — never creates new ones):
 *   CONTACT built-ins:
 *     - Title (companyTitle)     ← job_title
 *     - Business Website         ← ghl_response.website  (fieldKey contact.business_website)
 *     - Mobile Phone             ← ghl_response.mobile   (fieldKey contact.mobile_number)
 *     - phone (built-in)         ← phone
 *   OPPORTUNITY custom fields in "B2B Matchmaking" pipeline (stage New):
 *     - opportunity.pain_points_identified (LARGE_TEXT) ← interests joined by \n
 *     - opportunity.scope                  (LARGE_TEXT) ← offices   joined by \n
 *   NOTE: labelled block containing Timeline, Requested Call, Offices,
 *   Interests, Website, Mobile, and the full email reply with real newlines.
 *
 * Body: { lead_id: string }
 */

const s = (v: unknown): string | null => {
  if (v === null || v === undefined) return null;
  const t = String(v).trim();
  return t === "" ? null : t;
};

const digits = (v: string | null) => (v ? v.replace(/\D/g, "") : "");
const asObj = (v: unknown): Record<string, any> =>
  v && typeof v === "object" ? (v as Record<string, any>) : {};

/**
 * Normalize a text blob so newlines render as real line breaks in GHL.
 * Converts literal "\n" / "\r\n" escape sequences into real \n and collapses
 * runs of 3+ blank lines into a single blank line.
 */
const normalizeText = (v: string | null): string | null => {
  if (!v) return null;
  const t = v
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return t === "" ? null : t;
};

let pipelineCache: { at: number; pipelines: any[] } | null = null;
async function fetchPipelines(apiKey: string): Promise<any[]> {
  if (pipelineCache && Date.now() - pipelineCache.at < 5 * 60 * 1000) return pipelineCache.pipelines;
  const res = await ghlFetch(`/opportunities/pipelines?locationId=${GHL_LOCATION_ID}`, { apiKey, version: GHL_V3 });
  if (!res.ok) return [];
  const data: any = await res.json().catch(() => ({}));
  const pipelines: any[] = Array.isArray(data?.pipelines) ? data.pipelines : [];
  pipelineCache = { at: Date.now(), pipelines };
  return pipelines;
}

/**
 * Resolve opportunity-model custom fields by fieldKey (preferred) or name.
 * Never creates fields — only reads what already exists in the location.
 * Cached per cold start.
 */
type ResolvedField = { id: string; name: string; fieldKey: string | null };
const cfCache = new Map<string, { at: number; list: ResolvedField[] }>();

async function fetchCustomFields(
  apiKey: string,
  model: "contact" | "opportunity",
): Promise<ResolvedField[]> {
  const cached = cfCache.get(model);
  if (cached && Date.now() - cached.at < 10 * 60 * 1000) return cached.list;
  const list: ResolvedField[] = [];
  try {
    const res = await ghlFetch(
      `/locations/${GHL_LOCATION_ID}/customFields?model=${model}`,
      { apiKey,
      version: GHL_V3,
    },
    );
    if (res.ok) {
      const parsed: any = await res.json().catch(() => null);
      const raw: any[] = Array.isArray(parsed?.customFields)
        ? parsed.customFields
        : Array.isArray(parsed) ? parsed : [];
      for (const f of raw) {
        if (!f?.id) continue;
        list.push({
          id: String(f.id),
          name: String(f.name ?? ""),
          fieldKey: (f.fieldKey ?? f.key ?? null) as string | null,
        });
      }
    } else {
      console.warn(`[push-b2b-lead-to-ghl] list ${model} custom fields failed:`, res.status);
    }
  } catch (e) {
    console.warn(`[push-b2b-lead-to-ghl] list ${model} custom fields errored:`, e);
  }
  cfCache.set(model, { at: Date.now(), list });
  return list;
}

function resolveByFieldKey(list: ResolvedField[], key: string): ResolvedField | null {
  const lc = key.toLowerCase();
  // Match on fieldKey first (e.g. "opportunity.pain_points_identified"), then
  // fall back to the last segment ("pain_points_identified") and finally the
  // human name ("Pain Points Identified").
  const tail = lc.split(".").pop() ?? lc;
  const humanised = tail.replace(/_/g, " ");
  return (
    list.find((f) => (f.fieldKey ?? "").toLowerCase() === lc) ||
    list.find((f) => (f.fieldKey ?? "").toLowerCase().endsWith("." + tail)) ||
    list.find((f) => (f.fieldKey ?? "").toLowerCase() === tail) ||
    list.find((f) => f.name.trim().toLowerCase() === humanised) ||
    null
  );
}

/** Build the clean labelled note body with real newlines and bullets. */
function buildNoteBody(args: {
  name: string;
  company: string | null;
  timeline: string | null;
  requestedCall: string | null;
  offices: string[];
  interests: string[];
  website: string | null;
  mobile: string | null;
  message: string | null;
}): string {
  const parts: string[] = [];
  const heading = `B2B Matchmaking — ${args.name}${args.company ? ` (${args.company})` : ""}`;
  parts.push(heading);

  if (args.timeline) parts.push(`Timeline:\n• ${args.timeline}`);
  if (args.requestedCall) parts.push(`Requested Call:\n• ${args.requestedCall}`);
  if (args.offices.length) parts.push(`Offices:\n${args.offices.map((o) => `• ${o}`).join("\n")}`);
  if (args.interests.length) parts.push(`Interests:\n${args.interests.map((i) => `• ${i}`).join("\n")}`);

  const kv: string[] = [];
  if (args.website) kv.push(`Website: ${args.website}`);
  if (args.mobile) kv.push(`Mobile: ${args.mobile}`);
  if (kv.length) parts.push(kv.join("\n"));

  if (args.message) parts.push(`— Email reply —\n${args.message}`);

  return parts.join("\n\n");
}

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
    const leadId = String(body.lead_id ?? "").trim();
    if (!leadId) return ok({ success: false, error: "lead_id required" });

    const { data: row, error: fetchErr } = await supabase
      .from("leads")
      .select("id, first_name, last_name, email, phone, company, job_title, message, source_campaign, source_page, source_medium, lead_source, ghl_response")
      .eq("id", leadId)
      .maybeSingle();
    if (fetchErr || !row) return ok({ success: false, error: fetchErr?.message || "Lead not found" });

    const resp = asObj(row.ghl_response);
    const existingContactId = s(resp.ghl_contact_id);
    if (existingContactId) {
      return ok({
        success: true,
        alreadyPushed: true,
        contact_id: existingContactId,
        opportunity_id: s(resp.ghl_opportunity_id),
        message: "Already in GHL",
      });
    }

    const email = (s(row.email) ?? "").toLowerCase();
    const phone = s(row.phone) ?? "";
    const firstName = s(row.first_name) ?? "";
    const lastName = s(row.last_name) ?? "";
    const name = [firstName, lastName].filter(Boolean).join(" ").trim() || (email || "B2B Lead");
    const company = s(row.company);
    const jobTitle = s(row.job_title);
    const message = normalizeText(s(row.message));
    const website = s(resp.website);
    const mobile = s(resp.mobile);
    const timeline = s(resp.timeline);
    const requestedCall = s(resp.requested_call);
    const interests = Array.isArray(resp.interests)
      ? (resp.interests as unknown[]).map((x) => String(x).trim()).filter(Boolean)
      : [];
    const offices = Array.isArray(resp.offices)
      ? (resp.offices as unknown[]).map((x) => String(x).trim()).filter(Boolean)
      : [];
    const rawTags = Array.isArray(resp.tags)
      ? (resp.tags as unknown[]).map(String).filter(Boolean)
      : [];

    if (!email && !phone) {
      return ok({ success: false, error: "Lead needs an email or phone before pushing to GHL" });
    }

    // 1) Find-or-create contact.
    let contactId: string | null = null;
    let linked = false;
    try {
      const query = email || name || phone;
      const searchRes = await ghlFetch("/contacts/search", {
        apiKey,
        method: "POST",
        body: { locationId: GHL_LOCATION_ID, query, page: 1, pageLimit: 20 },
        version: GHL_V3,
      });
      if (searchRes.ok) {
        const searchData: any = await searchRes.json();
        const contacts = Array.isArray(searchData.contacts) ? searchData.contacts : [];
        const phoneTail = digits(phone).slice(-10);
        const match = contacts.find((c: any) => {
          if (email && c.email && String(c.email).toLowerCase() === email) return true;
          if (phoneTail && c.phone && digits(String(c.phone)).endsWith(phoneTail)) return true;
          return false;
        });
        if (match?.id) { contactId = match.id; linked = true; }
      }
    } catch (e) {
      console.warn("[push-b2b-lead-to-ghl] search failed:", e);
    }

    const tags = Array.from(new Set([
      "B2B Matchmaking",
      "AlfredAI B2B Matchmaking",
      ...rawTags,
    ].filter(Boolean)));

    // Resolve CONTACT custom fields (Title, Business Website, Mobile Phone) by
    // fieldKey/name at runtime. GHL's contact POST only accepts a whitelist of
    // top-level props (firstName, lastName, name, email, phone, companyName,
    // tags, source, address, customFields) — anything else 422s. So Title /
    // Website / Mobile go into the customFields array, not top-level.
    const contactFields = await fetchCustomFields(apiKey, "contact");
    const contactCustomFields: Array<{ id: string; key?: string; field_value: string }> = [];
    const contactFieldsUsed: Array<{ key: string; id: string; name: string }> = [];
    const pushContactField = (wantKey: string, value: string | null) => {
      if (!value) return;
      const f = resolveByFieldKey(contactFields, wantKey);
      if (!f) return;
      contactCustomFields.push(
        f.fieldKey
          ? { id: f.id, key: f.fieldKey, field_value: value }
          : { id: f.id, field_value: value },
      );
      contactFieldsUsed.push({ key: wantKey, id: f.id, name: f.name });
    };
    pushContactField("contact.title", jobTitle);
    pushContactField("contact.business_website", website);
    pushContactField("contact.mobile_number", mobile);

    // Safe top-level payload — only GHL-whitelisted props. No companyTitle,
    // no mobilePhone, no website — those live in customFields above.
    const builtIns: Record<string, unknown> = {
      companyName: company || undefined,
      phone: phone || undefined,
    };

    if (!contactId) {
      const createBody: Record<string, unknown> = {
        locationId: GHL_LOCATION_ID,
        firstName: firstName || name || "B2B Lead",
        lastName: lastName || undefined,
        email: email || undefined,
        source: "AlfredAI B2B Matchmaking",
        tags,
        ...builtIns,
        ...(contactCustomFields.length ? { customFields: contactCustomFields } : {}),
      };
      for (const k of Object.keys(createBody)) {
        if (createBody[k] === undefined) delete createBody[k];
      }

      const createRes = await ghlFetch("/contacts/", { apiKey, method: "POST", body: createBody, version: GHL_V3 });
      const createText = await createRes.text();
      if (!createRes.ok) {
        try {
          const parsed = JSON.parse(createText);
          const dupId = parsed?.meta?.contactId || parsed?.contact?.id;
          if (dupId) { contactId = dupId; linked = true; }
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

    // If linked to an existing contact, ensure our tags are on it.
    if (linked) {
      try {
        await ghlFetch(`/contacts/${contactId}/tags`, {
          apiKey, method: "POST", body: { tags },
          version: GHL_V3,
        });
      } catch (e) {
        console.warn("[push-b2b-lead-to-ghl] tag update failed:", e);
      }
    }
    // Always PUT built-ins + resolved custom fields onto the contact (handles
    // both fresh creates and linked existing contacts).
    try {
      const updateBody: Record<string, unknown> = { ...builtIns };
      for (const k of Object.keys(updateBody)) {
        if (updateBody[k] === undefined) delete updateBody[k];
      }
      if (contactCustomFields.length) updateBody.customFields = contactCustomFields;
      if (Object.keys(updateBody).length) {
        const updRes = await ghlFetch(`/contacts/${contactId}`, {
          apiKey, method: "PUT", body: updateBody,
          version: GHL_V3,
        });
        if (!updRes.ok) {
          console.warn("[push-b2b-lead-to-ghl] contact update failed:", updRes.status, (await updRes.text().catch(() => "")).slice(0, 200));
        }
      }
    } catch (e) {
      console.warn("[push-b2b-lead-to-ghl] contact update errored:", e);
    }

    // 2) Add the clean labelled note.
    try {
      const noteBody = buildNoteBody({
        name,
        company,
        timeline,
        requestedCall,
        offices,
        interests,
        website,
        mobile,
        message,
      });
      await ghlFetch(`/contacts/${contactId}/notes`, {
        apiKey,
        method: "POST",
        body: { body: noteBody },
        version: GHL_V3,
      });
    } catch (e) {
      console.warn("[push-b2b-lead-to-ghl] add-note failed:", e);
    }

    // 3) Resolve "B2B Matchmaking" pipeline @ stage "New" + create opportunity
    // with opportunity-model custom fields (Pain Points Identified, Scope).
    let opportunityId: string | null = null;
    let pipelineId: string | null = null;
    let stageId: string | null = null;
    let stageName: string | null = null;
    let pipelineWarning: string | null = null;
    const oppCustomFieldsUsed: Array<{ key: string; id: string; name: string }> = [];

    const pipelines = await fetchPipelines(apiKey);
    const pipeline = pipelines.find(
      (p) => String(p.name ?? "").trim().toLowerCase() === "b2b matchmaking",
    );
    if (!pipeline) {
      pipelineWarning =
        `The "B2B Matchmaking" pipeline does not exist in GHL yet. Contact was ${linked ? "linked" : "created"} ` +
        `and a note was added, but no opportunity was made. Create a pipeline named "B2B Matchmaking" in GHL ` +
        `with stages including "New", then re-push.`;
    } else {
      pipelineId = pipeline.id;
      const stages: any[] = Array.isArray(pipeline.stages) ? pipeline.stages : [];
      const stage =
        stages.find((st) => String(st.name ?? "").trim().toLowerCase() === "new") ?? stages[0];
      stageId = stage?.id ?? null;
      stageName = stage?.name ?? null;

      if (stageId) {
        // Resolve opportunity custom fields by fieldKey.
        const oppFields = await fetchCustomFields(apiKey, "opportunity");
        const painField = resolveByFieldKey(oppFields, "opportunity.pain_points_identified");
        const scopeField = resolveByFieldKey(oppFields, "opportunity.scope");

        const oppCustomFields: Array<{ id: string; field_value: string }> = [];
        if (painField && interests.length) {
          oppCustomFields.push({ id: painField.id, field_value: interests.join("\n") });
          oppCustomFieldsUsed.push({ key: "opportunity.pain_points_identified", id: painField.id, name: painField.name });
        }
        if (scopeField && offices.length) {
          oppCustomFields.push({ id: scopeField.id, field_value: offices.join("\n") });
          oppCustomFieldsUsed.push({ key: "opportunity.scope", id: scopeField.id, name: scopeField.name });
        }

        try {
          const opBody: Record<string, unknown> = {
            pipelineId,
            locationId: GHL_LOCATION_ID,
            name: company ? `${company} — ${name}` : name,
            pipelineStageId: stageId,
            status: "open",
            contactId,
            source: "AlfredAI B2B Matchmaking",
            ...(oppCustomFields.length ? { customFields: oppCustomFields } : {}),
          };
          const opRes = await ghlFetch("/opportunities/", { apiKey, method: "POST", body: opBody, version: GHL_V3 });
          const opText = await opRes.text();
          if (opRes.ok) {
            const parsed = JSON.parse(opText);
            opportunityId = parsed?.opportunity?.id || parsed?.id || null;
          } else {
            pipelineWarning = `Contact ${linked ? "linked" : "created"}, but opportunity create failed: ${opRes.status} ${opText.slice(0, 200)}`;
            console.warn("[push-b2b-lead-to-ghl] opportunity create failed:", opText);
          }
        } catch (e) {
          pipelineWarning = `Contact ${linked ? "linked" : "created"}, but opportunity create errored: ${e instanceof Error ? e.message : String(e)}`;
        }
      }
    }

    // 4) Persist back onto leads.ghl_response.
    const pushMeta = {
      pushed_by: auth.userId,
      pushed_at: new Date().toISOString(),
      linked_existing: linked,
      pipeline_id: pipelineId,
      pipeline_name: pipeline?.name ?? null,
      stage_id: stageId,
      stage_name: stageName,
      warning: pipelineWarning,
      tags,
      contact_custom_fields: contactFieldsUsed,
      opportunity_custom_fields: oppCustomFieldsUsed,
    };
    const nextResp = {
      ...resp,
      ghl_contact_id: contactId,
      ghl_opportunity_id: opportunityId,
      pushed_at: pushMeta.pushed_at,
      pushed_by: auth.userId,
      b2b_matchmaking_push_meta: pushMeta,
    };
    const { error: updErr } = await supabase
      .from("leads")
      .update({ ghl_response: nextResp })
      .eq("id", leadId);
    if (updErr) {
      return ok({
        success: true,
        contact_id: contactId,
        opportunity_id: opportunityId,
        linked,
        warning: `Pushed to GHL but DB update failed: ${updErr.message}`,
      });
    }

    return ok({
      success: true,
      contact_id: contactId,
      opportunity_id: opportunityId,
      linked,
      pipeline_id: pipelineId,
      pipeline_name: pipeline?.name ?? null,
      stage_id: stageId,
      stage_name: stageName,
      warning: pipelineWarning,
      opportunity_custom_fields: oppCustomFieldsUsed,
    });
  } catch (e) {
    console.error("[push-b2b-lead-to-ghl] error:", e);
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : String(e) }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
