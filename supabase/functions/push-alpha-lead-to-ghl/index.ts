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
 * push-alpha-lead-to-ghl — manual "Push to GHL" for an alpha_digital_leads
 * row (LinkedIn outbound prospect). Creates or links a GHL contact, then
 * creates an opportunity in the dedicated "Alpha Digital" pipeline (resolved
 * by name at runtime — the GHL v2 API does NOT expose pipeline creation, so
 * the pipeline must exist in the GHL UI).
 *
 * Stage mapping (from raw MultiLead leadStatusId → "Alpha Digital" stage name):
 *   1 New              → New
 *   2 Contacted        → Contacted
 *   3 Replied          → Replied
 *   4 Interested       → Replied
 *   5 Not interested   → Lost
 *   6 Meeting booked   → Meeting Booked
 *   default            → New
 *
 * Body: { alpha_lead_id: string, require_email?: boolean, batch_tag?: string }
 *   require_email — defaults TRUE. Refuses a lead with no email address. The
 *                   per-row UI buttons send FALSE deliberately; the batch
 *                   runner is what the default is protecting.
 *   batch_tag     — extra tag applied alongside "Alpha Digital" / "LinkedIn
 *                   Lead" / campaign, so one sync is addressable as a GHL
 *                   Smart List. Smart Lists are saved filters over tags; the
 *                   v3 API has no endpoint that adds a contact to one.
 * Writes back: alpha_digital_leads.ghl_contact_id, ghl_opportunity_id,
 * ghl_pushed_at, ghl_push_meta.
 * Idempotent: if ghl_contact_id already present, refuses to duplicate and
 * returns the existing ids.
 */

interface AlphaRow {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string | null;
  status: string | null;
  raw_data: Record<string, unknown> | null;
  ghl_contact_id: string | null;
  ghl_opportunity_id: string | null;
}

const s = (v: unknown): string | null => {
  if (v === null || v === undefined) return null;
  const t = String(v).trim();
  return t === "" ? null : t;
};

const digits = (v: string | null) => (v ? v.replace(/\D/g, "") : "");

const STAGE_MAP: Record<string, string> = {
  "1": "New",
  "2": "Contacted",
  "3": "Replied",
  "4": "Replied",
  "5": "Lost",
  "6": "Meeting Booked",
};

function pickStageName(status: string | null): string {
  if (!status) return "New";
  return STAGE_MAP[String(status).trim()] ?? "New";
}

// Cached pipeline lookup (per cold start).
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

// Cached custom-field lookup for "LinkedIn URL". Discovered by NAME so we
// never hardcode ids. GHL returns model = "contact" | "opportunity".
interface LinkedInField {
  id: string;
  fieldKey: string | null;
  model: "contact" | "opportunity";
  name: string;
}
let linkedinFieldCache: { at: number; field: LinkedInField | null } | null = null;
async function fetchLinkedInField(apiKey: string): Promise<LinkedInField | null> {
  if (linkedinFieldCache && Date.now() - linkedinFieldCache.at < 5 * 60 * 1000) {
    return linkedinFieldCache.field;
  }
  // Try both models — v2 returns everything from /locations/{id}/customFields
  // but some tenants require ?model=opportunity to include opportunity fields.
  const collected: any[] = [];
  for (const qs of ["", "?model=opportunity", "?model=contact"]) {
    try {
      const res = await ghlFetch(`/locations/${GHL_LOCATION_ID}/customFields${qs}`, { apiKey, version: GHL_V3 });
      if (!res.ok) continue;
      const data: any = await res.json().catch(() => ({}));
      const arr: any[] = Array.isArray(data?.customFields)
        ? data.customFields
        : Array.isArray(data?.fields)
          ? data.fields
          : Array.isArray(data)
            ? data
            : [];
      for (const f of arr) collected.push(f);
    } catch (e) {
      console.warn("[push-alpha-lead-to-ghl] customFields fetch failed:", e);
    }
  }
  const seen = new Set<string>();
  const unique = collected.filter((f) => {
    const id = String(f?.id ?? "");
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
  const norm = (v: unknown) => String(v ?? "").trim().toLowerCase();
  const match = unique.find((f) => {
    const n = norm(f?.name);
    return n === "linkedin url" || n === "linkedinurl" || n === "linkedin";
  });
  const field: LinkedInField | null = match
    ? {
        id: String(match.id),
        fieldKey: match.fieldKey ?? match.key ?? null,
        model: (String(match.model ?? "contact").toLowerCase() === "opportunity"
          ? "opportunity"
          : "contact") as "contact" | "opportunity",
        name: String(match.name ?? "LinkedIn URL"),
      }
    : null;
  linkedinFieldCache = { at: Date.now(), field };
  if (field) {
    console.log(`[push-alpha-lead-to-ghl] LinkedIn URL custom field: id=${field.id} model=${field.model} key=${field.fieldKey}`);
  } else {
    console.log("[push-alpha-lead-to-ghl] LinkedIn URL custom field not found in GHL");
  }
  return field;
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

    // Service-role permitted: alpha-backfill-ghl calls this per row, and that
    // batch runner is itself already admin-gated.
    const auth = await requireAdmin(req, supabase, { allowServiceRole: true });
    if (!auth.ok) return ok({ success: false, error: auth.error });

    const body = await req.json().catch(() => ({}));
    const alphaLeadId = String(body.alpha_lead_id ?? "").trim();
    if (!alphaLeadId) return ok({ success: false, error: "alpha_lead_id required" });

    // Refuse a contact with no email unless the caller opts out. Defaults to
    // TRUE, which is a deliberate change of behaviour: this function used to
    // push anything with a name, and 25 of the 26 Alpha contacts now sitting
    // in GoHighLevel have no email address as a direct result. Will's answer
    // on syncing the backlog was "we probably need to find a way to find their
    // emails" — so an emailless push is now the exception you ask for, not the
    // default you get.
    //
    // `require_email: false` restores the LinkedIn-only behaviour where the
    // profile URL genuinely is the channel. BOTH per-row UI callers send it —
    // PushAlphaLeadToGhlButton and LeadRowActions — because a person acting on
    // one named lead is not the failure mode this guards against. Defaulting it
    // on for them broke the button for the ~2,948 emailless rows and gave back
    // a red toast with no way through, which is worse than the problem.
    //
    // The default stays TRUE so that any NEW caller, and the batch runner in
    // particular, has to ask for an emailless push rather than get one.
    const requireEmail = body.require_email !== false;

    // A GoHighLevel Smart List is a SAVED FILTER, not a container — there is no
    // "add to smart list" endpoint anywhere in the v3 spec (checked docs/ghl/).
    // Contacts match a Smart List dynamically, by tag. So a batch tag passed in
    // here is what makes "the leads we synced today" addressable as a list.
    const batchTag = s(body.batch_tag);

    const { data: row, error: fetchErr } = await supabase
      .from("alpha_digital_leads")
      .select("id, name, email, phone, company, source, status, raw_data, ghl_contact_id, ghl_opportunity_id")
      .eq("id", alphaLeadId)
      .maybeSingle();
    if (fetchErr || !row) return ok({ success: false, error: fetchErr?.message || "Alpha lead not found" });

    const alpha = row as AlphaRow;
    const raw = (alpha.raw_data ?? {}) as Record<string, any>;
    const linkedinUrl = s(raw.linkedinUrl) ?? s(raw.linkedin_url) ?? s(raw.profileUrl);
    const businessEmail = s(raw.businessEmail);
    const personalEmail = s(raw.personalEmail);
    const email = (s(alpha.email) ?? businessEmail ?? personalEmail ?? "").toLowerCase();
    const phone = s(alpha.phone) ?? s(raw.phone) ?? "";
    const name = s(alpha.name) ?? [s(raw.firstName), s(raw.lastName)].filter(Boolean).join(" ").trim();
    const [firstName, ...rest] = (name ?? "").split(/\s+/).filter(Boolean);
    const lastName = rest.join(" ");
    const company = s(alpha.company) ?? s(raw.company) ?? s(raw.currentCompany) ?? null;
    const campaignName =
      s(raw?.campaign?.name) ?? s(raw?.campaign?.title) ??
      (raw?.campaign?.id ? `Campaign ${raw.campaign.id}` : null);
    const jobTitle = s(raw.headline) ?? s(raw.jobTitle) ?? s(raw.title) ?? null;

    // Short-circuit if already pushed.
    //
    // TAGGING STILL HAPPENS HERE — 8 Sep. This used to return before applying
    // any tags, which meant a contact already in GoHighLevel could never be
    // tagged through this function at all: the batch_tag existed to build a
    // Smart List, and the very contacts most likely to need one were the ones
    // it skipped. Tagging is idempotent in GoHighLevel (adding a tag that is
    // already there is a no-op), so doing it on the short-circuit path costs
    // nothing and closes the gap.
    //
    // Still refuses to create or link anything a second time. The only new
    // behaviour is that a tag you explicitly asked for is actually applied.
    if (alpha.ghl_contact_id) {
      let tagged = false;
      if (batchTag) {
        try {
          await ghlFetch(`/contacts/${alpha.ghl_contact_id}/tags`, {
            apiKey,
            method: "POST",
            body: { tags: [batchTag] },
            version: GHL_V3,
          });
          tagged = true;
        } catch (e) {
          // A tag failing must not turn an otherwise-fine "already there" into
          // an error. Reported, not thrown.
          console.warn(
            `[push-alpha-lead-to-ghl] tag "${batchTag}" failed on existing contact ` +
            `${alpha.ghl_contact_id}: ${e instanceof Error ? e.message : String(e)}`,
          );
        }
      }
      return ok({
        success: true,
        alreadyPushed: true,
        tagged,
        contact_id: alpha.ghl_contact_id,
        opportunity_id: alpha.ghl_opportunity_id,
        message: tagged ? `Already in GHL — tag "${batchTag}" applied` : "Already in GHL",
      });
    }

    if (!name && !email && !linkedinUrl) {
      return ok({ success: false, error: "Alpha lead has no name / email / LinkedIn — nothing to push" });
    }

    if (requireEmail && !email) {
      return ok({
        success: false,
        skipped: "no_email",
        error: "Alpha lead has no email address — enrich it first, or call again with require_email: false",
      });
    }

    // 1) Find or create contact
    let contactId: string | null = null;
    let linked = false;
    try {
      const query = email || name || linkedinUrl || "";
      const searchRes = await ghlFetch("/contacts/search", {
        apiKey,
        method: "POST",
        body: { locationId: GHL_LOCATION_ID, query, page: 1, pageLimit: 20 },
        version: GHL_V3,
      });
      if (searchRes.ok) {
        const searchData: any = await searchRes.json();
        const contacts = Array.isArray(searchData.contacts) ? searchData.contacts : [];
        const emailDig = digits(email);
        const phoneTail = digits(phone).slice(-10);
        const match = contacts.find((c: any) => {
          if (email && c.email && String(c.email).toLowerCase() === email) return true;
          if (phoneTail && c.phone && digits(String(c.phone)).endsWith(phoneTail)) return true;
          // Fall back to name+company match for LinkedIn-only leads.
          if (name && !email && !phoneTail) {
            const cName = [c.firstName, c.lastName].filter(Boolean).join(" ").trim().toLowerCase();
            const cCompany = String(c.companyName ?? "").toLowerCase();
            if (
              cName && cName === name.toLowerCase() &&
              (!company || !cCompany || cCompany === company.toLowerCase())
            ) return true;
          }
          return false;
        });
        if (match?.id) { contactId = match.id; linked = true; }
      }
    } catch (e) {
      console.warn("[push-alpha-lead-to-ghl] search failed:", e);
    }

    const tags = Array.from(new Set([
      "Alpha Digital",
      "LinkedIn Lead",
      campaignName ?? null,
      batchTag,
    ].filter(Boolean) as string[]));

    // Discover the "LinkedIn URL" custom field up-front so we know whether it
    // lives on the contact or the opportunity, and can attach it to the right
    // payload. Missing/unknown → we silently skip (note is fallback).
    const linkedInField = linkedinUrl ? await fetchLinkedInField(apiKey) : null;

    if (!contactId) {
      // GHL v2 accepts only whitelisted top-level fields on POST /contacts/.
      // Only include `customFields` (plural array) when we have a real field
      // id resolved from the location — that avoids the earlier 422.
      const createBody: Record<string, unknown> = {
        locationId: GHL_LOCATION_ID,
        firstName: firstName || name || "LinkedIn",
        lastName: lastName || undefined,
        email: email || undefined,
        phone: phone || undefined,
        companyName: company || undefined,
        source: "Alpha Digital (LinkedIn)",
        tags,
        website: linkedinUrl || undefined,
      };
      if (linkedinUrl && linkedInField?.model === "contact") {
        createBody.customFields = [
          linkedInField.fieldKey
            ? { id: linkedInField.id, key: linkedInField.fieldKey, field_value: linkedinUrl }
            : { id: linkedInField.id, field_value: linkedinUrl },
        ];
      }
      for (const k of Object.keys(createBody)) {
        if (createBody[k] === undefined) delete createBody[k];
      }

      const createRes = await ghlFetch("/contacts/", { apiKey, method: "POST", body: createBody, version: GHL_V3 });
      const createText = await createRes.text();
      if (!createRes.ok) {
        // Try to salvage a duplicate id.
        try {
          const parsed = JSON.parse(createText);
          const dupId = parsed?.meta?.contactId || parsed?.contact?.id;
          if (dupId) { contactId = dupId; linked = true; }
        } catch { /* ignore */ }
        if (!contactId) {
          return ok({ success: false, error: `GHL create failed: ${createRes.status} ${createText.slice(0, 300)}` });
        }
        // Fell through with a duplicate — patch the LinkedIn custom field
        // onto the existing contact so it isn't lost.
        if (linkedinUrl && linkedInField?.model === "contact" && contactId) {
          try {
            await ghlFetch(`/contacts/${contactId}`, {
              apiKey,
              method: "PUT",
              body: {
                customFields: [
                  linkedInField.fieldKey
                    ? { id: linkedInField.id, key: linkedInField.fieldKey, field_value: linkedinUrl }
                    : { id: linkedInField.id, field_value: linkedinUrl },
                ],
              },
              version: GHL_V3,
            });
          } catch (e) {
            console.warn("[push-alpha-lead-to-ghl] contact customField update failed:", e);
          }
        }
      } else {
        const parsed = JSON.parse(createText);
        contactId = parsed?.contact?.id || parsed?.id || null;
      }
    } else if (linkedinUrl && linkedInField?.model === "contact") {
      // Existing contact matched via search — patch the LinkedIn custom field.
      try {
        await ghlFetch(`/contacts/${contactId}`, {
          apiKey,
          method: "PUT",
          body: {
            customFields: [
              linkedInField.fieldKey
                ? { id: linkedInField.id, key: linkedInField.fieldKey, field_value: linkedinUrl }
                : { id: linkedInField.id, field_value: linkedinUrl },
            ],
          },
          version: GHL_V3,
        });
      } catch (e) {
        console.warn("[push-alpha-lead-to-ghl] contact customField update failed:", e);
      }
    }

    if (!contactId) return ok({ success: false, error: "GHL returned no contact id" });

    // Tags only ever went on the CREATE body, so a lead that matched a contact
    // already in GoHighLevel got none of them — and a Smart List filtered on a
    // tag would silently miss exactly the contacts we already knew about. Add
    // them explicitly when we linked rather than created.
    //
    // POST /contacts/{id}/tags — `addTags` in the vendored v3 index, body is
    // TagsDTO { tags: string[] } (docs/ghl/models-contacts.d.ts:60). Non-fatal:
    // a missed tag is a Smart List gap, not a lost lead.
    // Whether the tags actually LANDED, not merely that we meant to send them.
    // I reported the Alpha Digital tag as applied on the strength of reading
    // this code, and it was sent, not proven — ghl_push_meta recorded the
    // pipeline and the stage and said nothing about tags, so there was no way
    // to tell the difference afterwards. Now there is.
    let tagsApplied: string[] = [];
    let tagsError: string | null = null;
    if (tags.length) {
      if (linked) {
        try {
          await ghlFetch(`/contacts/${contactId}/tags`, {
            apiKey,
            method: "POST",
            body: { tags },
            version: GHL_V3,
          });
          tagsApplied = tags;
        } catch (e) {
          tagsError = e instanceof Error ? e.message : String(e);
          console.warn("[push-alpha-lead-to-ghl] add-tags failed:", e);
        }
      } else {
        // Sent on the create body, which GoHighLevel accepted along with the
        // contact — so these are applied, by the same call that made the row.
        tagsApplied = tags;
      }
    }

    // 2) Add a LinkedIn note if we have the URL (belt & braces if custom field is absent).
    if (linkedinUrl) {
      try {
        await ghlFetch(`/contacts/${contactId}/notes`, {
          apiKey,
          method: "POST",
          body: {
            body: `LinkedIn: ${linkedinUrl}${jobTitle ? `\nRole: ${jobTitle}` : ""}${campaignName ? `\nCampaign: ${campaignName}` : ""}`,
          },
          version: GHL_V3,
        });
      } catch (e) {
        console.warn("[push-alpha-lead-to-ghl] add-note failed:", e);
      }
    }

    // 3) Resolve "Alpha Digital" pipeline + target stage.
    let opportunityId: string | null = null;
    let pipelineId: string | null = null;
    let stageId: string | null = null;
    let stageName: string | null = null;
    let pipelineWarning: string | null = null;

    const pipelines = await fetchPipelines(apiKey);
    const pipeline = pipelines.find((p) => String(p.name ?? "").trim().toLowerCase() === "alpha digital");
    if (!pipeline) {
      pipelineWarning =
        `The "Alpha Digital" pipeline does not exist in GHL. Contact was ${linked ? "linked" : "created"}, ` +
        `but no opportunity was made. Create a pipeline named "Alpha Digital" in GHL with stages: ` +
        `New → Reviewing → Contacted → Replied → Meeting Booked → Won → Lost, then re-push.`;
    } else {
      pipelineId = pipeline.id;
      const wantStage = pickStageName(alpha.status);
      const stages: any[] = Array.isArray(pipeline.stages) ? pipeline.stages : [];
      const stage =
        stages.find((st) => String(st.name ?? "").trim().toLowerCase() === wantStage.toLowerCase()) ??
        stages.find((st) => String(st.name ?? "").trim().toLowerCase() === "new") ??
        stages[0];
      stageId = stage?.id ?? null;
      stageName = stage?.name ?? null;

      if (stageId) {
        try {
          const opBody: Record<string, unknown> = {
            pipelineId,
            locationId: GHL_LOCATION_ID,
            name: name || email || "Alpha Digital lead",
            pipelineStageId: stageId,
            status: "open",
            contactId,
            source: "Alpha Digital (LinkedIn)",
          };
          if (linkedinUrl && linkedInField?.model === "opportunity") {
            opBody.customFields = [
              linkedInField.fieldKey
                ? { id: linkedInField.id, key: linkedInField.fieldKey, field_value: linkedinUrl }
                : { id: linkedInField.id, field_value: linkedinUrl },
            ];
          }
          const opRes = await ghlFetch("/opportunities/", {
            apiKey,
            method: "POST",
            body: opBody,
            version: GHL_V3,
          });
          const opText = await opRes.text();
          if (opRes.ok) {
            const parsed = JSON.parse(opText);
            opportunityId = parsed?.opportunity?.id || parsed?.id || null;
            // If field is opportunity-scoped but the create silently ignored
            // it, PATCH it in — some GHL tenants require an update call.
            if (opportunityId && linkedinUrl && linkedInField?.model === "opportunity") {
              try {
                await ghlFetch(`/opportunities/${opportunityId}`, {
                  apiKey,
                  method: "PUT",
                  body: {
                    customFields: [
                      linkedInField.fieldKey
                        ? { id: linkedInField.id, key: linkedInField.fieldKey, field_value: linkedinUrl }
                        : { id: linkedInField.id, field_value: linkedinUrl },
                    ],
                  },
                  version: GHL_V3,
                });
              } catch (e) {
                console.warn("[push-alpha-lead-to-ghl] opportunity customField update failed:", e);
              }
            }
          } else {
            pipelineWarning = `Contact ${linked ? "linked" : "created"}, but opportunity create failed: ${opRes.status} ${opText.slice(0, 200)}`;
            console.warn("[push-alpha-lead-to-ghl] opportunity create failed:", opText);
          }
        } catch (e) {
          pipelineWarning = `Contact ${linked ? "linked" : "created"}, but opportunity create errored: ${e instanceof Error ? e.message : String(e)}`;
        }
      }
    }

    // 4) Persist on the alpha row.
    const meta = {
      pushed_by: auth.userId,
      pushed_at: new Date().toISOString(),
      linked_existing: linked,
      pipeline_id: pipelineId,
      pipeline_name: pipeline?.name ?? null,
      stage_id: stageId,
      stage_name: stageName,
      warning: pipelineWarning,
      linkedin_url: linkedinUrl,
      linkedin_field_id: linkedInField?.id ?? null,
      linkedin_field_model: linkedInField?.model ?? null,
      linkedin_field_key: linkedInField?.fieldKey ?? null,
      campaign: campaignName,
      // GoHighLevel normalises every tag name to lowercase — confirmed 14 Sep
      // by reading all 306 tags on the location, every one of them lowercase.
      // So "Alpha Digital" lands on the existing "alpha digital" rather than
      // creating a second tag, and the casing worry that held this push back
      // was unfounded. Recorded as SENT and APPLIED separately anyway: the
      // normalisation is GoHighLevel's behaviour, not our guarantee.
      tags_sent: tags,
      tags_applied: tagsApplied,
      tags_error: tagsError,
    };
    const { error: updErr } = await supabase
      .from("alpha_digital_leads")
      .update({
        ghl_contact_id: contactId,
        ghl_opportunity_id: opportunityId,
        ghl_pushed_at: meta.pushed_at,
        ghl_push_meta: meta,
      })
      .eq("id", alphaLeadId);
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
      stage_id: stageId,
      stage_name: stageName,
      linkedin_field: linkedInField,
      warning: pipelineWarning,
    });
  } catch (e) {
    console.error("[push-alpha-lead-to-ghl] error:", e);
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : String(e) }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
