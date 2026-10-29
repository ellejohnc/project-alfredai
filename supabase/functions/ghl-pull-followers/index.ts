import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  corsHeaders,
  ghlFetch,
  requireAdmin,
  GHL_LOCATION_ID,
  GHL_V3,
} from "../_shared/ghlClient.ts";

/**
 * Read followers back OUT of GoHighLevel and into lead_followers.
 *
 * ghl-set-followers only ever pushed: POST and DELETE on
 * /contacts/{id}/followers, with no read anywhere. So following someone in the
 * GoHighLevel UI wrote to their side of a one-way pipe and never showed up
 * here. This is the return leg.
 *
 * THE READ IS NOT WHERE YOU WOULD EXPECT IT
 * There is no getFollowersContact endpoint — the v3 contacts surface exposes
 * only addFollowersContact and removeFollowersContact (docs/ghl/api-v3-index.md).
 * And GetContectByIdSchema carries no followers field, so GET /contacts/{id}
 * cannot answer this either. The ONLY documented shape that carries them is
 * ContactsSearchSchema.followers on POST /contacts/search
 * (docs/ghl/models-contacts.d.ts:406). That is why this searches rather than
 * fetching the contact directly.
 *
 * The field is optional in the spec, so `followers_field_present` is reported
 * on every response: if GoHighLevel omits it for our plan or location we learn
 * that from the first run instead of silently reconciling everyone to zero.
 *
 * IDENTITY BRIDGE
 * GHL returns its own user ids. lead_followers.follower_id is a Supabase auth
 * id. The two are joined through email: GHL user id -> GHL user email ->
 * admin_users.email -> admin_users.id.
 *
 * Body (single):  { contact_id, email, lead_source, lead_id }
 * Body (batch):   { limit?: number }   — most recently created linked leads
 * Both accept dry_run (default TRUE for batch, FALSE for a single explicit lead).
 */

const DEFAULT_BATCH = 25;
const MAX_BATCH = 200;
/** There is a 429 history. Anything looping over rows goes sequential. */
const DELAY_MS = 250;
/** Rows pulled per source before grouping. Deliberately far above the contact
 *  cap: duplicates are heavy here (one person is 20+ rows), so scanning row
 *  count alone would return only a handful of distinct people. */
const ROW_SCAN = 1000;

const lc = (v: unknown) => String(v ?? "").trim().toLowerCase();

interface Target {
  lead_source: string;
  lead_id: string;
  ghl_contact_id: string;
  email: string;
}

serve(async (req) => {
  const cors = {
    ...corsHeaders,
    "Access-Control-Allow-Headers":
      corsHeaders["Access-Control-Allow-Headers"] + ", x-cron-secret",
  };
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const json = (obj: unknown) =>
    new Response(JSON.stringify(obj), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    // Cron shared-secret OR an admin session. Without the secret path this
    // could only ever run from a button, because every cron in this project
    // authenticates with the ANON key and the admin guard correctly refuses it.
    // A button means followers are only ever as fresh as the last time someone
    // remembered to press it, which is not a sync.
    //
    // The env var is the one sync-meta-leads already uses. Reusing it rather
    // than inventing a second secret keeps this to zero new configuration —
    // CRON_SECRET is read first so a dedicated one can be added later without
    // touching this code.
    const cronSecret = Deno.env.get("CRON_SECRET") || Deno.env.get("META_SYNC_CRON_SECRET");
    const isCron = !!cronSecret && req.headers.get("x-cron-secret") === cronSecret;

    if (!isCron) {
      const auth = await requireAdmin(req, supabase, { allowServiceRole: true });
      if (!auth.ok) return json({ success: false, error: auth.error });
    }

    const apiKey = Deno.env.get("GHL_API_KEY");
    if (!apiKey) return json({ success: false, error: "GHL_API_KEY missing" });

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const single = !!body?.contact_id;
    const dryRun = single ? body?.dry_run === true : body?.dry_run !== false;
    const limit = Math.min(Number(body?.limit) || DEFAULT_BATCH, MAX_BATCH);
    // Where to start in the grouped contact list.
    //
    // A run reads the NEWEST `limit` contacts, so repeating it on a schedule
    // would re-read the same ones forever and never reach the rest — there are
    // 999 distinct contacts and one run covers 200. The caller rotates this so
    // successive runs walk the whole set; the hourly cron derives it from the
    // clock. Past the end it wraps to 0 rather than returning nothing, so a
    // shrinking contact list can never leave the schedule reading empty pages.
    const rawOffset = Math.max(0, Number(body?.offset) || 0);

    // ---- 1. Who are we reconciling? ---------------------------------------
    let targets: Target[] = [];
    if (single) {
      const email = lc(body.email);
      if (!email) return json({ success: false, error: "Single mode needs the lead's email" });
      if (!body.lead_source || !body.lead_id) {
        return json({ success: false, error: "Single mode needs lead_source and lead_id" });
      }
      targets = [{
        lead_source: String(body.lead_source),
        lead_id: String(body.lead_id),
        ghl_contact_id: String(body.contact_id),
        email,
      }];
    } else {
      const [subs, meta, alpha] = await Promise.all([
        supabase
          .from("ghl_submissions")
          .select("id, lead_email, ghl_response")
          .not("ghl_response->>ghl_contact_id", "is", null)
          .is("archived_at", null)
          .order("created_at", { ascending: false })
          .limit(ROW_SCAN),
        supabase
          .from("meta_leads")
          .select("id, email, ghl_contact_id")
          .not("ghl_contact_id", "is", null)
          .order("created_at", { ascending: false })
          .limit(ROW_SCAN),
        supabase
          .from("alpha_digital_leads")
          .select("id, email, ghl_contact_id")
          .not("ghl_contact_id", "is", null)
          .order("created_at", { ascending: false })
          .limit(ROW_SCAN),
      ]);
      for (const r of subs.data ?? []) {
        const cid = (r as any).ghl_response?.ghl_contact_id;
        if (cid && r.lead_email) {
          targets.push({ lead_source: "ghl_submissions", lead_id: r.id, ghl_contact_id: String(cid), email: lc(r.lead_email) });
        }
      }
      for (const r of meta.data ?? []) {
        if (r.email) targets.push({ lead_source: "meta_leads", lead_id: r.id, ghl_contact_id: String(r.ghl_contact_id), email: lc(r.email) });
      }
      for (const r of alpha.data ?? []) {
        if (r.email) targets.push({ lead_source: "alpha_digital_leads", lead_id: r.id, ghl_contact_id: String(r.ghl_contact_id), email: lc(r.email) });
      }
      // `limit` counts CONTACTS, not rows, so gather generously and cap after
      // grouping — otherwise one duplicate-heavy person eats the whole batch.

    }

    if (!targets.length) return json({ success: true, checked: 0, note: "No linked leads to reconcile." });

    // ---- 2. GHL user id -> our auth id, via email -------------------------
    const uRes = await ghlFetch(`/users/?locationId=${GHL_LOCATION_ID}`, { apiKey, version: GHL_V3 });
    if (!uRes.ok) {
      const t = await uRes.text();
      return json({ success: false, error: `GHL GET /users ${uRes.status}: ${t.slice(0, 300)}` });
    }
    const uParsed: any = await uRes.json().catch(() => null);
    const ghlUsers: any[] = Array.isArray(uParsed?.users) ? uParsed.users : [];
    const emailByGhlUserId = new Map<string, string>();
    for (const u of ghlUsers) {
      const id = u?.id || u?._id;
      const email = lc(u?.email);
      if (id && email) emailByGhlUserId.set(String(id), email);
    }

    const { data: admins } = await supabase.from("admin_users").select("id, email");
    const authIdByEmail = new Map<string, string>();
    for (const a of admins ?? []) if (a.email) authIdByEmail.set(lc(a.email), a.id);

    // ---- 3. One GHL call per CONTACT, not per row -------------------------
    // A person is usually many rows. "William Zhang" alone is 20+ rows across
    // three GHL contact ids, and searching once per row would be 20 calls for
    // three contacts — straight into the 429s this integration already has a
    // history of. Group first, then apply each contact's followers to every
    // row that shares its id, which is also what the UI means: the inbox merges
    // those rows into one person, and useLeadFollow already writes a follow to
    // the primary AND every merged sub-record.
    const byContact = new Map<string, Target[]>();
    for (const t of targets) {
      const list = byContact.get(t.ghl_contact_id);
      if (list) list.push(t);
      else byContact.set(t.ghl_contact_id, [t]);
    }

    let checked = 0;
    let followersFieldSeen = 0;
    let contactNotFound = 0;
    const added: { email: string; follower: string; rows: number }[] = [];
    /** Dry-run intentions, kept apart from rows that actually landed. */
    const wouldAdd: { email: string; follower: string; rows: number }[] = [];
    /** Follows GoHighLevel reports that we already hold. The steady state. */
    let alreadyPresent = 0;
    const unmappable = new Set<string>();
    /** Follower ids missing from GET /users, resolved one by one this run. */
    const lookedUp = new Set<string>();
    const resolvedById: { id: string; email: string; name: string }[] = [];
    const lookupErrors: { id: string; status: number }[] = [];
    /** Follower ids GoHighLevel answers 404 for: deleted users. */
    const deletedUsers = new Set<string>();
    let followsOfDeletedUsers = 0;
    const errors: { email: string; error: string }[] = [];

    // A WALL-CLOCK BUDGET, because the alternative is losing the run.
    //
    // This loop is strictly sequential with a 250ms delay per contact — at the
    // 200-contact ceiling that is 50 seconds of waiting before GoHighLevel's
    // own latency is counted, and the gateway does not wait forever. A timeout
    // returns 504 with NOTHING written and nothing reported, so a slow hour
    // silently accomplished nothing. Stopping early and saying so is strictly
    // better: the offset rotates, so whatever is missed is picked up next run.
    const BUDGET_MS = 50_000;
    const startedAt = Date.now();
    let stoppedEarly = false;

    const allContacts = Array.from(byContact.entries());
    const offset = allContacts.length ? rawOffset % allContacts.length : 0;
    const contactBatch = allContacts.slice(offset, offset + limit);

    for (const [contactId, rows] of contactBatch) {
      if (Date.now() - startedAt > BUDGET_MS) {
        stoppedEarly = true;
        break;
      }
      if (checked) await new Promise((r) => setTimeout(r, DELAY_MS));
      checked++;
      const email = rows[0].email;

      const res = await ghlFetch("/contacts/search", {
        apiKey,
        method: "POST",
        body: { locationId: GHL_LOCATION_ID, query: email, page: 1, pageLimit: 20 },
        version: GHL_V3,
      });
      if (!res.ok) {
        errors.push({ email, error: `search ${res.status}` });
        continue;
      }
      const parsed: any = await res.json().catch(() => null);
      const contacts: any[] = Array.isArray(parsed?.contacts) ? parsed.contacts : [];
      const match = contacts.find((c) => String(c?.id) === contactId)
        ?? contacts.find((c) => lc(c?.email) === email);
      if (!match) {
        contactNotFound++;
        continue;
      }

      // Optional in the spec. Absent is NOT the same as "nobody follows this
      // contact" — treating it as empty would be how we'd quietly delete every
      // local follow, so an absent field is skipped, never reconciled.
      if (!Array.isArray(match.followers)) continue;
      followersFieldSeen++;

      for (const ghlUserId of match.followers as unknown[]) {
        // NOT EVERY FOLLOWER IS IN THE LOCATION'S USER LIST.
        //
        // Checked 15 Oct: GET /users for the location returns 10 users, and
        // every follower on 93 contacts was one of 3 ids that are not among
        // them — so nothing GoHighLevel-side had landed since 26 Aug. Ask
        // for an unknown id directly (GET /users/{id}), once per run.
        if (!emailByGhlUserId.has(String(ghlUserId)) && !lookedUp.has(String(ghlUserId))) {
          lookedUp.add(String(ghlUserId));
          const one = await ghlFetch(`/users/${encodeURIComponent(String(ghlUserId))}`, { apiKey, version: GHL_V3 });
          if (one.ok) {
            const u: any = await one.json().catch(() => null);
            const em = lc(u?.email);
            if (em) {
              emailByGhlUserId.set(String(ghlUserId), em);
              resolvedById.push({ id: String(ghlUserId), email: em, name: String(u?.name ?? [u?.firstName, u?.lastName].filter(Boolean).join(" ") ?? "") });
            }
          } else if (one.status === 404) {
            // The user no longer exists in GoHighLevel. Checked 15 Oct: all
            // three ids behind the followers on ~90 contacts answer 404 — they
            // are deleted accounts still listed on the contacts. Not a mapping
            // failure and not ours to fix by guessing; reported on their own.
            deletedUsers.add(String(ghlUserId));
          } else {
            lookupErrors.push({ id: String(ghlUserId), status: one.status });
          }
          await new Promise((r) => setTimeout(r, DELAY_MS));
        }
        if (deletedUsers.has(String(ghlUserId))) {
          followsOfDeletedUsers++;
          continue;
        }
        const followerEmail = emailByGhlUserId.get(String(ghlUserId));
        const authId = followerEmail ? authIdByEmail.get(followerEmail) : undefined;
        if (!authId) {
          unmappable.add(followerEmail ?? String(ghlUserId));
          continue;
        }
        // COUNT WHAT LANDED, NOT WHAT WE MEANT TO DO.
        //
        // This used to push onto `added` before writing, unconditionally — so
        // the hourly run reported "added: 3" every hour while lead_followers
        // sat at 23 rows whose newest was three weeks old. The upsert merges on
        // conflict, so re-seeing an existing follow is a no-op that was still
        // being counted as new. A job reporting work it did not do is the same
        // lie as a job reporting failure it did not have, pointing the other
        // way — and this project has now found both.
        if (dryRun) {
          wouldAdd.push({ email, follower: followerEmail!, rows: rows.length });
          continue;
        }
        const { data: written, error } = await supabase
          .from("lead_followers")
          .upsert(
            rows.map((r) => ({
              lead_source: r.lead_source,
              lead_id: r.lead_id,
              follower_id: authId,
            })),
            { onConflict: "lead_source,lead_id,follower_id", ignoreDuplicates: true },
          )
          .select("lead_source");
        if (error) {
          errors.push({ email, error: error.message });
          continue;
        }
        const inserted = written?.length ?? 0;
        if (inserted > 0) added.push({ email, follower: followerEmail!, rows: inserted });
        else alreadyPresent++;
      }
    }

    // Deliberately additive. A GoHighLevel follow becomes a follow here, but a
    // local follow is never deleted because GHL does not list it — someone with
    // no GHL seat can follow a lead here, and every lead with no GHL contact at
    // all is followable. Removal stays a local action.
    return json({
      success: true,
      dry_run: dryRun,
      contacts_checked: checked,
      contacts_found: byContact.size,
      offset,
      rows_covered: contactBatch.reduce((n, [, r]) => n + r.length, 0),
      contacts_with_followers: followersFieldSeen,
      followers_field_present: followersFieldSeen > 0,
      contact_not_found: contactNotFound,
      would_add: wouldAdd.length,
      added: added.length,
      // The number that explains a quiet run. Almost every hour SHOULD be all
      // already-present and nothing added — that is the pull being up to date,
      // not the pull doing nothing, and there was no way to tell them apart.
      already_present: alreadyPresent,
      stopped_early: stoppedEarly,
      sample: (dryRun ? wouldAdd : added).slice(0, 10),
      unmappable: Array.from(unmappable).slice(0, 10),
      // How many users GET /users returned. Every follower id on 91 contacts
      // came back unmappable on 15 Oct and nothing has been added since 26 Aug;
      // this says whether the list was empty or simply did not contain them.
      ghl_users_listed: ghlUsers.length,
      admin_emails_matched: Array.from(emailByGhlUserId.values()).filter((e) => authIdByEmail.has(e)).length,
      // Who the ids outside the location list turned out to be. An email here
      // that is still unmappable is a person with no admin account to map to.
      resolved_by_id: resolvedById,
      lookup_errors: lookupErrors,
      deleted_ghl_users: Array.from(deletedUsers),
      follows_of_deleted_users: followsOfDeletedUsers,
      errors: errors.slice(0, 10),
      note: followersFieldSeen === 0
        ? "No contact came back with a followers array. Either nobody is followed in GoHighLevel, or /contacts/search omits the field on this plan — the spec marks it optional."
        : dryRun
          ? "Nothing written. Re-run with dry_run false to apply."
          : (stoppedEarly
              ? `Stopped at the ${BUDGET_MS / 1000}s budget after ${checked} contact(s) rather than being cut off by the gateway. The offset rotates, so the rest is covered by the next run.`
              : "Followers reconciled into lead_followers. They render with no further sync."),
    });
  } catch (err) {
    console.error("[ghl-pull-followers] error", err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }
});
