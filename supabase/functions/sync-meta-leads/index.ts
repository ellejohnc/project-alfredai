import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { ghlFetch, GHL_V3 } from "../_shared/ghlClient.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};


const TAG_MARKER = "au fb lead";

interface SyncBody {
  since?: string | null; // ISO timestamp — only import contacts added/updated after this
  full?: boolean; // full backfill: also page the whole location for attribution matches
  maxPages?: number; // safety cap for paging
  tagOnly?: boolean; // only import the tagged set (fast)
}

type GHLContact = Record<string, any>;

const lc = (v: unknown) => String(v ?? "").toLowerCase();

function isGhlCommandTimeout(status: number, body: string): boolean {
  return status === 401 && /command timed out/i.test(body);
}

/** Does this GHL contact qualify as a Meta lead by attribution / tag / pageUrl? */
function isMetaContact(c: GHLContact): boolean {
  const tags: string[] = Array.isArray(c.tags) ? c.tags : [];
  if (tags.some((t) => lc(t).includes(TAG_MARKER))) return true;

  const attrs: GHLContact[] = Array.isArray(c.attributions)
    ? c.attributions
    : Array.isArray(c.attributionSource)
      ? c.attributionSource
      : c.attributionSource
        ? [c.attributionSource]
        : [];

  for (const a of attrs) {
    const paidSocial = lc(a.utmSessionSource) === "paid social";
    const chan = [lc(a.medium), lc(a.adSource), lc(a.utmSource)];
    const isFbIg = chan.some((x) => x === "facebook" || x === "instagram");
    if (paidSocial && isFbIg) return true;
    if (lc(a.pageUrl).startsWith("https://fb.me/")) return true;
  }
  return false;
}

/** Map a GHL contact into a public.meta_leads row. */
function toMetaLeadRow(c: GHLContact) {
  const attrs: GHLContact[] = Array.isArray(c.attributions) ? c.attributions : [];
  // Prefer the attribution entry that actually carries UTM/ad data.
  const attr =
    attrs.find((a) => a.utmSource || a.medium || a.adSource || a.utmCampaign || a.utmContent) ||
    attrs[0] ||
    {};

  const firstName = c.firstName ?? c.firstNameRaw ?? c.first_name ?? null;
  const lastName = c.lastName ?? c.lastNameRaw ?? c.last_name ?? null;
  const fullName =
    (c.contactName ?? c.name ?? [firstName, lastName].filter(Boolean).join(" ").trim()) || null;

  const tags: string[] = Array.isArray(c.tags) ? c.tags : [];
  const trafficSource =
    lc(attr.medium).includes("instagram") || lc(attr.utmSource).includes("instagram")
      ? "Instagram"
      : lc(attr.medium).includes("whatsapp")
        ? "WhatsApp"
        : "Facebook";

  return {
    ghl_contact_id: String(c.id),
    leadgen_id: `ghl_${c.id}`,
    full_name: fullName,
    email: c.email ?? null,
    phone: c.phone ?? null,
    source: c.source ?? null,
    tags,
    client: "AlfredAI",
    status: "new",
    utm_source: attr.utmSource ?? attr.medium ?? attr.adSource ?? "facebook",
    utm_medium: attr.utmMedium ?? attr.medium ?? "paid_social",
    utm_campaign: attr.utmCampaign ?? null,
    campaign_id: attr.utmCampaignId ?? c.campaignId ?? null,
    ad_id: attr.utmAdId ?? c.adId ?? null,
    ad_name: attr.utmContent ?? attr.adName ?? c.adName ?? null,
    form_name: c.formName ?? attr.utmCampaign ?? trafficSource,
    submitted_at: c.dateAdded ?? c.createdAt ?? null,
    created_at: c.dateAdded ?? c.createdAt ?? new Date().toISOString(),
    raw_payload: c,
  };
}

/** Page through /contacts/search. Optional tag filter; sorted newest first. */
async function searchContacts(opts: {
  tag?: string;
  maxPages: number;
  since?: string | null;
  onlyMeta?: boolean;
}): Promise<GHLContact[]> {
  const locationId = Deno.env.get("GHL_LOCATION_ID");
  const out: GHLContact[] = [];
  let searchAfter: unknown[] | undefined;
  const sinceMs = opts.since ? new Date(opts.since).getTime() : null;

  for (let page = 0; page < opts.maxPages; page++) {
    const body: Record<string, unknown> = {
      locationId,
      pageLimit: 100,
      sort: [{ field: "dateAdded", direction: "desc" }],
    };
    if (opts.tag) {
      body.filters = [{ field: "tags", operator: "contains", value: opts.tag }];
    }
    if (searchAfter) body.searchAfter = searchAfter;

    // Was a hand-rolled fetch carrying Version: 2021-07-28 — the last call site
    // left on the legacy header, missed by the v3 migration precisely because
    // it did not go through the shared client. Routing it through ghlFetch also
    // buys the 429 retry this loop never had, on the one job that pages hardest.
    const res = await ghlFetch("/contacts/search", {
      apiKey: Deno.env.get("GHL_API_KEY")!,
      method: "POST",
      body,
      version: GHL_V3,
    });
    const text = await res.text();
    if (!res.ok) {
      // One bad page used to abort the entire sync. GoHighLevel's transient
      // 401 "Command timed out" is retried inside ghlFetch now, but if it is
      // STILL failing after that, losing the pages already collected helps
      // nobody — the leads in them are real and the next scheduled run would
      // have to fetch them again anyway.
      //
      // So: fail loudly on the FIRST page, because zero results and a silent
      // success is exactly the kind of lie this project keeps finding. Beyond
      // that, stop paging, keep what arrived, and let the caller report a
      // partial run as a partial run.
      const detail = `GHL search failed (${res.status}) on page ${page + 1}: ${text.slice(0, 300)}`;
      if (out.length === 0 && isGhlCommandTimeout(res.status, text)) {
        console.warn(`[sync-meta-leads] ${detail} — falling back to GET /contacts`);
        return await listContactsFallback(opts);
      }
      if (out.length === 0) throw new Error(detail);
      console.warn(`[sync-meta-leads] ${detail} — keeping ${out.length} contact(s) already read`);
      break;
    }
    let json: GHLContact;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(`GHL search returned non-JSON: ${text.slice(0, 200)}`);
    }
    const contacts: GHLContact[] = json.contacts ?? json.data ?? [];
    if (contacts.length === 0) break;

    let reachedSince = false;
    for (const c of contacts) {
      if (sinceMs) {
        const added = new Date(c.dateAdded ?? c.createdAt ?? 0).getTime();
        if (added && added < sinceMs) {
          reachedSince = true;
          continue;
        }
      }
      if (opts.onlyMeta && !isMetaContact(c)) continue;
      out.push(c);
    }
    if (reachedSince) break; // sorted desc — everything after is older

    const last = contacts[contacts.length - 1];
    searchAfter = last?.searchAfter;
    if (!searchAfter) break;
  }
  return out;
}

/**
 * Fallback for GoHighLevel's intermittent 401 "Command timed out" on
 * POST /contacts/search. The deprecated list endpoint is slower and less
 * expressive, but it keeps scheduled Meta lead syncs moving instead of
 * aborting the whole run.
 */
async function listContactsFallback(opts: {
  tag?: string;
  maxPages: number;
  since?: string | null;
  onlyMeta?: boolean;
}): Promise<GHLContact[]> {
  const out: GHLContact[] = [];
  const locationId = Deno.env.get("GHL_LOCATION_ID");
  const apiKey = Deno.env.get("GHL_API_KEY");
  if (!locationId || !apiKey) {
    throw new Error("GHL_API_KEY / GHL_LOCATION_ID not configured");
  }
  let startAfter: unknown = null;
  let startAfterId: string | null = null;
  const sinceMs = opts.since ? new Date(opts.since).getTime() : null;

  for (let page = 0; page < opts.maxPages; page++) {
    const params = new URLSearchParams({
      locationId,
      limit: "100",
    });
    if (startAfter !== null && startAfter !== undefined) {
      params.set("startAfter", String(startAfter));
    }
    if (startAfterId) {
      params.set("startAfterId", startAfterId);
    }

    const res = await ghlFetch(`/contacts/?${params.toString()}`, {
      apiKey,
      version: GHL_V3,
    });
    const text = await res.text();
    if (!res.ok) {
      const detail = `GHL fallback list failed (${res.status}) on page ${page + 1}: ${text.slice(0, 300)}`;
      if (out.length === 0) throw new Error(detail);
      console.warn(`[sync-meta-leads] ${detail} — keeping ${out.length} contact(s) already read`);
      break;
    }

    let json: GHLContact;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(`GHL fallback list returned non-JSON: ${text.slice(0, 200)}`);
    }

    const contacts: GHLContact[] = Array.isArray(json.contacts)
      ? json.contacts
      : Array.isArray(json.data)
        ? json.data
        : Array.isArray(json)
          ? json
          : [];
    if (contacts.length === 0) break;

    for (const c of contacts) {
      if (sinceMs) {
        const added = new Date(c.dateAdded ?? c.createdAt ?? c.dateUpdated ?? 0).getTime();
        if (added && added < sinceMs) continue;
      }
      const tags: string[] = Array.isArray(c.tags) ? c.tags : [];
      if (opts.tag && !tags.some((t) => lc(t).includes(lc(opts.tag)))) continue;
      if (opts.onlyMeta && !isMetaContact(c)) continue;
      out.push(c);
    }

    if (contacts.length < 100) break;

    const last = contacts[contacts.length - 1];
    const nextStartAfter = json.meta?.startAfter ?? last?.dateUpdated ?? last?.dateAdded ?? null;
    const nextStartAfterId = json.meta?.startAfterId ?? (String(last?.id || last?._id || "") || null);
    if (!nextStartAfterId || (nextStartAfterId === startAfterId && nextStartAfter === startAfter)) break;
    startAfter = nextStartAfter;
    startAfterId = nextStartAfterId;
  }

  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    if (!Deno.env.get("GHL_API_KEY") || !Deno.env.get("GHL_LOCATION_ID")) {
      return new Response(
        JSON.stringify({ success: false, error: "GHL_API_KEY / GHL_LOCATION_ID not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Auth: allow a cron shared-secret OR an authenticated admin.
    const cronSecret = Deno.env.get("META_SYNC_CRON_SECRET");
    const providedCron = req.headers.get("x-cron-secret");
    const isCron = !!cronSecret && providedCron === cronSecret;

    if (!isCron) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing authorization header" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid token" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: user.id });
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ success: false, error: "Unauthorized: Admin access required" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    let body: SyncBody = {};
    if (req.method === "POST") {
      try {
        body = await req.json();
      } catch {
        body = {};
      }
    }

    const full = body.full === true;
    const tagOnly = body.tagOnly === true;
    // Backfill can page deep; incremental runs stay shallow and fast.
    const maxPages = body.maxPages ?? (full ? 400 : 5);

    // 1) Tagged set via the tag filter.
    const byId = new Map<string, GHLContact>();
    const tagged = await searchContacts({
      tag: TAG_MARKER,
      maxPages: full ? maxPages : Math.min(maxPages, 20),
      since: body.since ?? null,
    });
    for (const c of tagged) if (c?.id) byId.set(String(c.id), c);

    // 2) Attribution set (full backfill or incremental scan of recent contacts).
    if (!tagOnly) {
      const attrHits = await searchContacts({
        maxPages,
        since: body.since ?? null,
        onlyMeta: true,
      });
      for (const c of attrHits) if (c?.id) byId.set(String(c.id), c);
    }

    const contacts = [...byId.values()];
    const rows = contacts.map(toMetaLeadRow).filter((r) => r.ghl_contact_id);

    // Upsert in chunks, keyed by ghl_contact_id (no dupes on re-run).
    let upserted = 0;
    const errors: string[] = [];
    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500);
      const { error } = await supabase
        .from("meta_leads")
        .upsert(chunk, { onConflict: "ghl_contact_id" });
      if (error) {
        errors.push(error.message);
        console.error("[SYNC-META-LEADS] upsert error", error.message);
      } else {
        upserted += chunk.length;
      }
    }

    return new Response(
      JSON.stringify({
        success: errors.length === 0,
        matched: contacts.length,
        tagged: tagged.length,
        upserted,
        mode: full ? "full" : tagOnly ? "tag-only" : "incremental",
        since: body.since ?? null,
        errors: errors.length ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[SYNC-META-LEADS] Unexpected error", err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
