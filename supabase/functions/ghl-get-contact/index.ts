import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  corsHeaders,
  ghlFetch,
  GHL_LOCATION_ID,
  GHL_V3,
  fetchUserMap,
  requireAdmin,
} from "../_shared/ghlClient.ts";

/**
 * Fetch a GHL contact by id and return a normalised, admin-friendly slice
 * of their profile fields (company, emails, phones, LinkedIn, tags, owner,
 * custom fields). Read-only. Fails soft: always 200 with { success: false }.
 */

interface CustomFieldDef {
  id: string;
  name: string;
  fieldKey?: string;
  model?: string;
}

let fieldDefsCache: { at: number; defs: CustomFieldDef[] } | null = null;
async function fetchCustomFieldDefs(apiKey: string): Promise<CustomFieldDef[]> {
  if (fieldDefsCache && Date.now() - fieldDefsCache.at < 5 * 60 * 1000) return fieldDefsCache.defs;
  const defs: CustomFieldDef[] = [];
  try {
    const res = await ghlFetch(`/locations/${GHL_LOCATION_ID}/customFields`, { apiKey, version: GHL_V3 });
    if (res.ok) {
      const parsed: any = await res.json().catch(() => null);
      const arr: any[] = Array.isArray(parsed?.customFields)
        ? parsed.customFields
        : Array.isArray(parsed)
          ? parsed
          : [];
      for (const f of arr) {
        const id = f.id || f._id;
        if (!id) continue;
        defs.push({
          id,
          name: String(f.name || f.fieldKey || "").trim(),
          fieldKey: f.fieldKey,
          model: f.model,
        });
      }
      fieldDefsCache = { at: Date.now(), defs };
    }
  } catch { /* ignore */ }
  return defs;
}

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
    const auth = await requireAdmin(req, supabase);
    if (!auth.ok) return json({ success: false, error: auth.error, contact: null });

    const apiKey = Deno.env.get("GHL_API_KEY");
    if (!apiKey) return json({ success: false, error: "GHL_API_KEY missing", contact: null });

    let contactId = "";
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      contactId = String(body?.contact_id || "").trim();
    } else {
      contactId = (new URL(req.url).searchParams.get("contact_id") || "").trim();
    }
    if (!contactId) return json({ success: false, error: "Missing contact_id", contact: null });

    // FIRST endpoint migrated to the named API version. The v3 response is
    // `{ contact: {...} }` — the same envelope the parse below already handled —
    // and every field read here exists in ContactsByIdSuccessfulResponseDtoV3.
    // v3 additionally carries per-channel dndSettings and first/last-touch
    // attribution, both surfaced further down.
    const res = await ghlFetch(`/contacts/${contactId}`, { apiKey, version: GHL_V3 });
    if (!res.ok) {
      const text = await res.text();
      console.error("[ghl-get-contact] GHL error", res.status, text.slice(0, 200));
      return json({ success: false, error: `GHL API error (${res.status})`, contact: null });
    }
    const parsed: any = await res.json().catch(() => ({}));
    const c = parsed?.contact ?? parsed ?? {};


    const [defs, userMap] = await Promise.all([
      fetchCustomFieldDefs(apiKey),
      fetchUserMap(apiKey),
    ]);
    const defsById = new Map(defs.map((d) => [d.id, d]));

    const rawCF: any[] = Array.isArray(c.customFields) ? c.customFields : [];
    const customFields = rawCF
      .map((cf) => {
        const def = defsById.get(cf.id);
        const name = def?.name || cf.fieldKey || cf.id;
        const value = cf.value ?? cf.field_value ?? cf.fieldValue ?? "";
        return { id: cf.id, name, key: def?.fieldKey ?? cf.fieldKey ?? null, value };
      })
      .filter((f) => f.value !== "" && f.value != null);

    // Try to surface a LinkedIn URL from person field OR custom field.
    const linkedInFromCF = customFields.find((f) =>
      /linkedin/i.test(f.name || "") && typeof f.value === "string" && /linkedin\.com/i.test(f.value)
    )?.value as string | undefined;

    const ownerId = c.assignedTo || c.owner || null;
    const ownerName = ownerId ? userMap[ownerId] || null : null;

    // Website: person field OR custom field
    const websiteFromCF = customFields.find((f) =>
      /website|url/i.test(f.name || "") && typeof f.value === "string" && /^https?:\/\//i.test(f.value)
    )?.value as string | undefined;

    // Address bits
    const addressParts = [c.address1, c.city, c.state, c.postalCode, c.country].filter(Boolean);
    const address = addressParts.length ? addressParts.join(", ") : null;

    const companyId: string | null = c.companyId || c.company_id || null;

    // Try linked company (soft-fail).
    let company: any = null;
    if (companyId) {
      try {
        const cr = await ghlFetch(`/companies/${companyId}`, { apiKey, version: GHL_V3 });
        if (cr.ok) {
          const cp: any = await cr.json().catch(() => ({}));
          const co = cp?.company ?? cp ?? {};
          const coAddr = [co.address, co.city, co.state, co.postalCode, co.country].filter(Boolean).join(", ") || null;
          company = {
            id: co.id || companyId,
            name: co.name || co.companyName || null,
            website: co.website || null,
            phone: co.phone || null,
            email: co.email || null,
            industry: co.industry || null,
            employees: co.noOfEmployees || co.employees || null,
            address: coAddr,
            description: co.description || null,
          };
        }
      } catch (e) {
        console.warn("[ghl-get-contact] company fetch failed", (e as Error).message);
      }
    }

    // --- v3 additions -----------------------------------------------------
    // Per-channel Do-Not-Disturb. NOTE THE INVERSION: a channel's `status` of
    // "active" means the DND rule is active, i.e. the channel is BLOCKED.
    // "inactive" is the one that means you may send. Reading it the obvious
    // way round would silently invert every guard built on top of it.
    const DND_CHANNELS = ["call", "email", "sms", "whatsApp", "gmb", "fb"] as const;
    const rawDnd = c.dndSettings && typeof c.dndSettings === "object" ? c.dndSettings : {};
    const channels: Record<string, { blocked: boolean; permanent: boolean; reason: string | null }> = {};
    for (const ch of DND_CHANNELS) {
      const s = rawDnd[ch];
      if (!s || typeof s !== "object") continue;
      const status = String(s.status ?? "").toLowerCase();
      if (status !== "active" && status !== "permanent") continue;
      channels[ch] = {
        blocked: true,
        permanent: status === "permanent",
        reason: s.message || s.code || null,
      };
    }
    // A global `dnd` flag blocks everything regardless of per-channel settings.
    const dndAll = c.dnd === true;

    const attribution = (src: any) => {
      if (!src || typeof src !== "object") return null;
      const pick = {
        url: src.url ?? null,
        campaign: src.campaign ?? null,
        campaignId: src.campaignId ?? null,
        utmSource: src.utmSource ?? null,
        utmMedium: src.utmMedium ?? null,
        utmContent: src.utmContent ?? null,
        referrer: src.referrer ?? null,
        medium: src.medium ?? null,
        gclid: src.gclid ?? null,
        fbclid: src.fbclid ?? null,
      };
      // Drop it entirely when GHL returns the object with nothing useful in it,
      // so the record renders no attribution block rather than a row of dashes.
      return Object.values(pick).some((v) => v !== null && v !== "") ? pick : null;
    };

    const contact = {
      id: c.id || contactId,
      dndAll,
      dndChannels: channels,
      timezone: c.timezone || null,
      lastActivity: c.lastActivity || null,
      dateUpdated: c.dateUpdated || null,
      businessId: c.businessId || null,
      visitorId: c.visitorId || null,
      attributionSource: attribution(c.attributionSource),
      lastAttributionSource: attribution(c.lastAttributionSource),
      firstName: c.firstName || null,
      lastName: c.lastName || null,
      name: c.contactName || c.name || [c.firstName, c.lastName].filter(Boolean).join(" ").trim() || null,
      companyName: c.companyName || c.businessName || null,
      website: c.website || websiteFromCF || null,
      address,
      city: c.city || null,
      state: c.state || null,
      postalCode: c.postalCode || null,
      country: c.country || null,
      companyId,
      company,
      email: c.email || null,
      workEmail: c.workEmail || null,
      secondaryEmail: c.secondaryEmail || c.additionalEmails?.[0] || null,
      additionalEmails: Array.isArray(c.additionalEmails) ? c.additionalEmails : [],
      phone: c.phone || null,
      mobilePhone: c.mobilePhone || null,
      linkedinUrl: c.linkedin || c.linkedInUrl || linkedInFromCF || null,
      title: c.title || c.jobTitle || null,
      contactType: c.type || c.contactType || null,
      tags: Array.isArray(c.tags) ? c.tags : [],
      ownerId,
      ownerName,
      seniority: c.seniority || null,
      department: c.department || null,
      dateAdded: c.dateAdded || c.createdAt || null,
      customFields,
      // Raw v3 DND payload. Keeps the name the conversation composer already
      // reads, and sits alongside the normalised `dndChannels` above rather
      // than replacing it. Deliberately NOT re-declaring attributionSource /
      // lastAttributionSource — those keys are set above, and a later
      // duplicate key in an object literal silently wins, which would swap the
      // normalised values back for raw ones.
      dnd: typeof c.dnd === "boolean" ? c.dnd : null,
      dndSettings: c.dndSettings && typeof c.dndSettings === "object" ? c.dndSettings : null,
    };


    return json({ success: true, contact });
  } catch (err) {
    console.error("[ghl-get-contact] error", err);
    return json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
      contact: null,
    });
  }
});
