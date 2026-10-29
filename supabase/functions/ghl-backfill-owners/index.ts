import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, ghlFetch, requireAdmin, GHL_LOCATION_ID, GHL_V3 } from "../_shared/ghlClient.ts";

/**
 * One-off backfill: pull contact ownership from GoHighLevel and write it into
 * lead_annotations so the Owner column resolves everywhere at zero read cost.
 *
 * Resumable and streaming: the GHL location holds ~30k contacts, far more than
 * one invocation can page inside the wall-clock limit. So we hold only the SMALL
 * side of the join in memory (our ~6.7k leads, keyed by contact id) and resolve
 * + write each contacts page as it arrives, discarding it before fetching the
 * next. Nothing accumulates, so the run can stop at any page and be continued
 * with the returned cursor.
 *
 * Body: { dryRun?: boolean, startAfter?, startAfterId?, maxPages? }
 *  - dryRun defaults to TRUE: reports numbers, writes nothing.
 *  - maxPages defaults to 60 (~60 sequential GHL calls, comfortably in budget).
 *
 * Only MANUAL owners (owner_source = 'manual') are protected — a decision made
 * in our UI always beats GHL. GHL-sourced owners are refreshed, so a change made
 * on the GHL side is picked up on a re-run instead of being frozen forever.
 */

const PAGE_SIZE = 100;
const CHUNK = 1000;
const DEFAULT_MAX_PAGES = 60;

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
    const dryRun = body?.dryRun === false ? false : true;
    const maxPages = Math.max(1, Math.min(Number(body?.maxPages) || DEFAULT_MAX_PAGES, 400));
    let startAfter: string | number | null = body?.startAfter ?? null;
    let startAfterId: string | null = body?.startAfterId ?? null;
    const isFirstPass = startAfter === null && startAfterId === null;

    // ----------------------------------------------- 1. small maps (per run)
    const { data: adminRows, error: adminErr } = await supabase
      .from("admin_users")
      .select("id, email");
    if (adminErr) return json({ success: false, error: `admin_users: ${adminErr.message}` });
    const emailToUserId = new Map<string, string>();
    for (const a of adminRows ?? []) {
      const e = String(a.email ?? "").trim().toLowerCase();
      if (e) emailToUserId.set(e, a.id as string);
    }

    const uRes = await ghlFetch(`/users/?locationId=${GHL_LOCATION_ID}`, { apiKey, version: GHL_V3 });
    if (!uRes.ok) {
      const t = await uRes.text();
      return json({ success: false, error: `GHL GET /users ${uRes.status}: ${t.slice(0, 300)}` });
    }
    const uJson: any = await uRes.json().catch(() => null);
    const ghlUsers: any[] = Array.isArray(uJson?.users) ? uJson.users : Array.isArray(uJson) ? uJson : [];
    const ghlUserEmail = new Map<string, string>();
    for (const u of ghlUsers) {
      const id = String(u?.id || u?._id || "").trim();
      if (!id) continue;
      const email = u?.email ? String(u.email).trim().toLowerCase() : "";
      if (email || !ghlUserEmail.has(id)) ghlUserEmail.set(id, email);
    }

    // ------------------------------- 2. our leads, keyed by GHL contact id
    type LeadRef = { source: string; id: string };
    const byContact = new Map<string, LeadRef[]>();
    let totalLeads = 0;
    let noContactId = 0; // counted ONCE per invocation, not per page

    const pageTable = async (
      table: string,
      columns: string,
      source: string,
      pick: (row: any) => string | null,
      archivedFilter: boolean,
    ) => {
      for (let from = 0; from < 100_000; from += CHUNK) {
        let q = supabase.from(table).select(columns).range(from, from + CHUNK - 1);
        if (archivedFilter) q = q.is("archived_at", null);
        const { data, error } = await q;
        if (error) throw new Error(`${table}: ${error.message}`);
        const rows = (data ?? []) as any[];
        for (const r of rows) {
          totalLeads++;
          const raw = pick(r);
          const cid = raw && String(raw).trim() ? String(raw).trim() : null;
          if (!cid) { noContactId++; continue; }
          const arr = byContact.get(cid);
          if (arr) arr.push({ source, id: String(r.id) });
          else byContact.set(cid, [{ source, id: String(r.id) }]);
        }
        if (rows.length < CHUNK) break;
      }
    };

    const fromGhlResponse = (r: any) =>
      r?.ghl_response && typeof r.ghl_response === "object" ? r.ghl_response.ghl_contact_id ?? null : null;

    await pageTable("ghl_submissions", "id, ghl_response", "ghl_submissions", fromGhlResponse, true);
    await pageTable("leads", "id, ghl_response", "leads", fromGhlResponse, false);
    await pageTable("meta_leads", "id, ghl_contact_id", "meta_leads", (r) => r.ghl_contact_id ?? null, false);
    await pageTable("alpha_digital_leads", "id, ghl_contact_id", "alpha_digital_leads", (r) => r.ghl_contact_id ?? null, true);

    // ---------- manual owners only: never overwrite a human decision (per run)
    const manualOwned = new Set<string>();
    for (let from = 0; from < 200_000; from += CHUNK) {
      const { data, error } = await supabase
        .from("lead_annotations")
        .select("lead_source, lead_id, owner_id, owner_source")
        .not("owner_id", "is", null)
        .eq("owner_source", "manual")
        .range(from, from + CHUNK - 1);
      if (error) return json({ success: false, error: `lead_annotations read: ${error.message}` });
      const rows = data ?? [];
      for (const r of rows) manualOwned.add(`${r.lead_source}::${r.lead_id}`);
      if (rows.length < CHUNK) break;
    }

    // --------------------------- 3. page contacts, resolving + writing per page
    const skips = {
      no_contact_id: noContactId,
      contact_unassigned_in_ghl: 0,
      ghl_user_has_no_email: 0,
      email_not_an_admin_user: 0,
    };
    let pages = 0;
    let contactsScanned = 0;
    let ourContactsMatched = 0;
    let resolved = 0;
    let skippedManual = 0;
    let written = 0;
    let wouldWrite = 0;
    let done = false;
    let totalHint: number | null = null;
    let firstPageShape: unknown = null;
    // Only used to answer "which of our contact ids were never seen" — bounded
    // by the number of contact ids WE hold (~2.8k), not by GHL's 30k.
    const seenOurContactIds = new Set<string>();

    while (pages < maxPages) {
      let path = `/contacts/?locationId=${GHL_LOCATION_ID}&limit=${PAGE_SIZE}`;
      if (startAfter !== null) path += `&startAfter=${startAfter}`;
      if (startAfterId) path += `&startAfterId=${encodeURIComponent(startAfterId)}`;

      const res = await ghlFetch(path, { apiKey, version: GHL_V3 });
      if (!res.ok) {
        const t = await res.text();
        return json({
          success: false,
          stage: "contacts_list",
          error: `GHL GET /contacts ${res.status}: ${t.slice(0, 500)}`,
          next: { startAfter, startAfterId },
        });
      }
      const parsed: any = await res.json().catch(() => null);
      const contacts: any[] = Array.isArray(parsed?.contacts)
        ? parsed.contacts
        : Array.isArray(parsed)
          ? parsed
          : [];
      if (typeof parsed?.meta?.total === "number") totalHint = parsed.meta.total;

      if (pages === 0) {
        const sample = contacts[0] ?? null;
        firstPageShape = {
          top_level_keys: parsed && typeof parsed === "object" ? Object.keys(parsed) : null,
          contact_keys: sample ? Object.keys(sample) : null,
          meta: parsed?.meta ?? null,
          contacts_on_page: contacts.length,
        };
        if (contacts.length === 0 || !sample || !("assignedTo" in sample)) {
          return json({
            success: false,
            stage: "contacts_list",
            error:
              "GHL contacts list did not return an `assignedTo` field (or returned no contacts). Stopping instead of falling back to per-contact calls.",
            observed: firstPageShape,
          });
        }
      }

      // Resolve just this page against the leads we hold.
      const batch: Record<string, unknown>[] = [];
      const now = new Date().toISOString();
      for (const c of contacts) {
        contactsScanned++;
        const cid = String(c?.id || c?._id || "").trim();
        if (!cid) continue;
        const refs = byContact.get(cid);
        if (!refs) continue; // not one of ours — nothing to do, nothing counted
        seenOurContactIds.add(cid);
        ourContactsMatched += refs.length;

        const assigned = String(c?.assignedTo || "").trim();
        if (!assigned) { skips.contact_unassigned_in_ghl += refs.length; continue; }
        const email = ghlUserEmail.get(assigned) ?? "";
        if (!email) { skips.ghl_user_has_no_email += refs.length; continue; }
        const ownerId = emailToUserId.get(email);
        if (!ownerId) { skips.email_not_an_admin_user += refs.length; continue; }

        for (const ref of refs) {
          resolved++;
          if (manualOwned.has(`${ref.source}::${ref.id}`)) { skippedManual++; continue; }
          if (dryRun) { wouldWrite++; continue; }
          batch.push({
            lead_source: ref.source,
            lead_id: ref.id,
            owner_id: ownerId,
            owner_source: "ghl",
            updated_by: auth.userId,
            updated_at: now,
          });
        }
      }

      if (!dryRun && batch.length) {
        for (let i = 0; i < batch.length; i += 500) {
          const slice = batch.slice(i, i + 500);
          const { error } = await supabase
            .from("lead_annotations")
            .upsert(slice, { onConflict: "lead_source,lead_id" });
          if (error) {
            return json({
              success: false,
              error: `lead_annotations upsert: ${error.message}`,
              written_before_failure: written,
              next: { startAfter, startAfterId },
            });
          }
          written += slice.length;
        }
      }

      pages++;

      if (contacts.length < PAGE_SIZE) { done = true; break; }

      const last = contacts[contacts.length - 1];
      const nextStartAfter = parsed?.meta?.startAfter ?? last?.dateUpdated ?? last?.dateAdded ?? null;
      const nextStartAfterId = parsed?.meta?.startAfterId ?? (String(last?.id || last?._id || "") || null);
      if (!nextStartAfterId || (nextStartAfterId === startAfterId && nextStartAfter === startAfter)) {
        done = true;
        break;
      }
      startAfter = nextStartAfter;
      startAfterId = nextStartAfterId;
    }

    // Our contact ids never seen: only meaningful when this invocation covered
    // the whole location (started at the beginning AND reached the last page).
    const unseenOurContactIds =
      done && isFirstPass ? byContact.size - seenOurContactIds.size : null;

    return json({
      success: true,
      dry_run: dryRun,
      done,
      next: done ? null : { startAfter, startAfterId },
      pages_fetched: pages,
      max_pages: maxPages,
      contacts_scanned_this_run: contactsScanned,
      contacts_scanned_total_hint: totalHint,
      ghl: {
        users_in_location: ghlUsers.length,
        users_with_email: [...ghlUserEmail.values()].filter(Boolean).length,
        first_page_shape: firstPageShape,
      },
      admin_users: emailToUserId.size,
      total_leads_examined: totalLeads,
      our_contact_ids: byContact.size,
      our_contact_ids_seen_this_run: seenOurContactIds.size,
      our_contact_ids_never_seen: unseenOurContactIds,
      leads_matched_this_run: ourContactsMatched,
      resolved,
      skipped_manual: skippedManual,
      [dryRun ? "would_write" : "written"]: dryRun ? wouldWrite : written,
      skips,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
