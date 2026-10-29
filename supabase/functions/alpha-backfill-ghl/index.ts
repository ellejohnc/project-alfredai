import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, requireAdmin } from "../_shared/ghlClient.ts";

/**
 * alpha-backfill-ghl — push the Alpha Digital backlog into GoHighLevel in
 * controlled batches, by calling the existing per-row push function.
 *
 * WHY THIS EXISTS
 *
 * `push-alpha-lead-to-ghl` was only ever wired to a per-row "Push to GHL"
 * button. That is why 1 of 3,766 rows carries a contact id — someone clicked
 * it once. Nothing was broken; the work simply had no way to happen at scale.
 *
 * WHY IT IS NOT AUTOMATIC
 *
 * Pushing thousands of contacts into a CRM is outward-facing and awkward to
 * undo — GHL automations can fire on contact creation. So this stays a
 * deliberate action, run in batches by a person, rather than a trigger nobody
 * chose. It makes the deliberate action possible; it does not take it.
 *
 * ELIGIBILITY — checked against the data, not assumed
 *
 * Every one of the rows carries a name AND a LinkedIn URL, so on the per-row
 * function's own terms all of them are pushable. That is no longer the bar.
 *
 * Will's answer on syncing the backlog was "we probably need to find a way to
 * find their emails and contacts", and only 812 of 3,766 rows have one. So
 * `require_email` defaults TRUE and this runner takes only the rows with an
 * email address. The rest are not failures, they are not yet enrichable — they
 * are counted and reported separately so the backlog number stops pretending
 * they are one queue.
 *
 * Pass require_email:false to restore the old LinkedIn-only behaviour.
 *
 * SAFETY
 *  - `dry_run` defaults to TRUE. It reports and writes nothing.
 *  - `limit` caps a run (default 25, hard max 200), so a mistake stays small.
 *  - Sequential with a delay: this API has a 429 history and a burst of
 *    hundreds would earn one.
 *  - The per-row push short-circuits on an existing contact id, so a re-run
 *    cannot double-create.
 *
 * TARGETING AN EXPLICIT SET — `lead_ids`
 *
 * Added 14 Sep, because "eligible" turned out to mean something this runner
 * could not express. Alpha Digital's own triage does NOT live in
 * `leadStatusId`: statuses 5 (Not interested) and 6 (Meeting booked) have zero
 * rows and always have, which looked like nobody triaging. They are not used.
 * The judgements live in `raw_data.tags` — Interested, Hot Lead, Positive,
 * Neutral, Negative, Not Interested, Booked Meeting, Follow Up — and only
 * status-4 rows carry any.
 *
 * That matters because it is the difference between pushing 143 people and
 * pushing the right ones: 25 of those 143 are tagged Negative or Not
 * Interested. Sending someone who has said no into a CRM that fires
 * automations on contact creation is worse than not sending them at all.
 *
 * So the caller may pass `lead_ids` and this runner pushes exactly those rows
 * and nothing else. The selection is then a SQL query that can be read and
 * re-run before anyone clicks, rather than a filter buried in here — and the
 * request carries the exact set, so what was pushed is auditable afterwards.
 * The query that produced the current set:
 *
 *   select id from alpha_digital_leads
 *    where archived_at is null
 *      and ghl_contact_id is null
 *      and (raw_data->'tags' ?| array['Interested','Hot Lead','Positive'])
 *      and not (raw_data->'tags' ?| array['Negative','Not Interested']);
 *
 * Every safety rail still applies to an explicit set: dry run by default, the
 * limit cap, the sequential delay, and the per-row short-circuit on an
 * existing contact id.
 *
 * `triaged_only` is the same decision expressed as a switch, so the panel can
 * offer it without holding a list of ids. The tag test is done in TypeScript
 * rather than as a jsonb filter: only status-4 rows carry tags at all, so the
 * candidate set is ~143 rows, and a readable predicate here is worth more than
 * a clever query nobody can check.
 *
 * Body: { dry_run?: boolean, limit?: number, require_email?: boolean,
 *         batch_tag?: string, lead_ids?: string[], triaged_only?: boolean }
 *
 * batch_tag is passed through to every contact so one sync is addressable as a
 * GoHighLevel Smart List. Smart Lists are SAVED FILTERS over tags — the v3 API
 * has no endpoint that adds a contact to one, so tagging on push is the whole
 * mechanism (checked against docs/ghl/, which has no smartlist resource).
 */

const DELAY_MS = 250;
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 200;

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
    // Service-role permitted: writes contacts, so this is deliberate and authorised — dry_run still defaults to true and the batch cap still applies.
    const auth = await requireAdmin(req, supabase, { allowServiceRole: true });
    if (!auth.ok) return json({ success: false, error: auth.error });

    const body = await req.json().catch(() => ({}));
    const dryRun = body?.dry_run !== false; // default TRUE — opt IN to writing
    const limit = Math.min(Math.max(Number(body?.limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
    const requireEmail = body?.require_email !== false; // default TRUE
    const batchTag = String(body?.batch_tag ?? "").trim() || null;

    // An explicit set, when the caller has already decided who. Deduped and
    // capped by the same limit as any other run — passing ids is a way to be
    // MORE specific, never a way around the rails.
    const explicitIds: string[] = Array.isArray(body?.lead_ids)
      ? Array.from(new Set(body.lead_ids.map((v: unknown) => String(v)).filter(Boolean)))
      : [];
    const targeted = explicitIds.length > 0;
    const triagedOnly = body?.triaged_only === true;

    // Two counts, deliberately. "Remaining" used to mean every unpushed row,
    // which read as one queue we were slowly working through — but 2,948 of
    // those have no email and no phone and are not going anywhere until they
    // are enriched. Reporting them together is how "3,765 to go" stayed
    // meaningless for weeks.
    const countRemaining = async (emailOnly: boolean) => {
      let q = supabase
        .from("alpha_digital_leads")
        .select("*", { count: "exact", head: true })
        .is("ghl_contact_id", null);
      if (emailOnly) q = q.not("email", "is", null).neq("email", "");
      const { count } = await q;
      return count ?? 0;
    };

    const remaining = await countRemaining(requireEmail);
    const notEnrichable = requireEmail
      ? (await countRemaining(false)) - remaining
      : 0;

    let query = supabase
      .from("alpha_digital_leads")
      // raw_data is selected only when the tag test needs it — it is the heavy
      // column on this table (5,550 kB across the feed) and the reason the
      // list query stopped fetching it at all.
      .select(body?.triaged_only === true ? "id, name, email, phone, raw_data" : "id, name, email, phone")
      .is("ghl_contact_id", null);

    if (triagedOnly && !targeted) {
      // Alpha Digital marks a reply's quality with tags, not with leadStatusId,
      // and only status-4 rows carry any — so this is the whole candidate set.
      query = query.eq("raw_data->>leadStatusId", "4");
    }

    if (targeted) {
      // The caller named the rows. Still filtered on ghl_contact_id being
      // null, so an id that is already in GoHighLevel is skipped rather than
      // re-pushed, and require_email is NOT applied — whoever built the set
      // decided reachability, and for this source LinkedIn is the channel.
      query = query.in("id", explicitIds.slice(0, limit));
    } else if (requireEmail) {
      query = query.not("email", "is", null).neq("email", "");
    }

    // THE LIMIT MUST NOT BE APPLIED BEFORE THE TAG FILTER, and it was — the
    // first dry run reported 21 when 46 match, because it took the newest 50
    // status-4 rows and only then asked which were positively tagged. That is
    // the same fault as every silent .limit(1000) on this project: a cap in
    // front of a filter, quietly under-reporting and looking fine doing it.
    // Caught by the dry run, which is what dry runs are for.
    //
    // Status-4 rows are the whole tagged population (143 today), so fetching
    // them all is cheap. The ceiling is explicit and reported if reached,
    // rather than a silent truncation.
    const CANDIDATE_CEILING = 1000;
    const fetchLimit = triagedOnly && !targeted ? CANDIDATE_CEILING : limit;
    const { data: rows, error } = await query
      .order("created_at", { ascending: false })
      .limit(fetchLimit);
    if (error) throw error;
    let candidates = rows ?? [];

    const hitCeiling = triagedOnly && !targeted && (rows?.length ?? 0) >= CANDIDATE_CEILING;
    let triagedMatching = 0;

    if (triagedOnly && !targeted) {
      // POSITIVE, AND NOT NEGATIVE. Both halves matter: 25 of the 143 tagged
      // rows say Negative or Not Interested, and pushing someone who has
      // already said no into a CRM that fires automations on contact creation
      // is worse than not pushing them. A row tagged both ways is excluded —
      // when two people disagree about a lead, the cautious reading wins.
      const POSITIVE = ["Interested", "Hot Lead", "Positive"];
      const NEGATIVE = ["Negative", "Not Interested"];
      candidates = candidates.filter((r) => {
        const tags: string[] = Array.isArray((r as { raw_data?: { tags?: unknown } })?.raw_data?.tags)
          ? ((r as { raw_data: { tags: string[] } }).raw_data.tags)
          : [];
        return tags.some((t) => POSITIVE.includes(t)) && !tags.some((t) => NEGATIVE.includes(t));
      });
      // How many MATCH, before the batch size is applied. Reporting only the
      // batch number is how "21" read as the whole answer.
      triagedMatching = candidates.length;
      candidates = candidates.slice(0, limit);
    }

    if (dryRun) {
      return json({
        success: true,
        dry_run: true,
        require_email: requireEmail,
        batch_tag: batchTag,
        remaining,
        not_enrichable: notEnrichable,
        targeted,
        triaged_only: triagedOnly,
        ...(triagedOnly && !targeted
          ? {
              // The honest pair: how many people match the triage, and how
              // many this run would send. A gap between them is the batch
              // size, not a missing lead.
              triaged_matching: triagedMatching,
              runs_to_finish: triagedMatching ? Math.ceil(triagedMatching / limit) : 0,
              ...(hitCeiling
                ? { warning: `Candidate fetch hit its ${CANDIDATE_CEILING}-row ceiling — the match count may be short.` }
                : {}),
            }
          : {}),
        // When ids were named, say how many of them survived the filters. A
        // gap between asked-for and would-push means some are already in
        // GoHighLevel, and that is worth seeing BEFORE the real run rather
        // than inferring it from a smaller success count afterwards.
        ...(targeted
          ? { requested: explicitIds.length, skipped_already_in_ghl: explicitIds.length - candidates.length }
          : {}),
        would_push: candidates.length,
        sample: candidates.slice(0, 5).map((r) => ({
          name: r.name,
          reachable_by: r.email ? "email" : r.phone ? "phone" : "LinkedIn only",
        })),
        note:
          "Nothing was written. " +
          `${remaining} row(s) are eligible; at this batch size that is ` +
          `${Math.ceil(remaining / limit)} run(s). ` +
          (notEnrichable
            ? `A further ${notEnrichable} row(s) have no email and are held back — enrich them first. `
            : "") +
          "Send dry_run:false to push this batch for real.",
      });
    }

    const results = { pushed: 0, skipped: 0, failed: 0 };
    const failures: { name: string | null; error: string }[] = [];

    for (const row of candidates) {
      try {
        // The Authorization header must be passed explicitly.
        //
        // functions.invoke() on a service-role client does NOT forward one, so
        // every push came back "Missing authorization header" and a batch of 25
        // failed 25 times while reporting success at this level. Caught only
        // because the first real run was capped at 25 rather than let loose on
        // 3,765.
        const { data, error: fnErr } = await supabase.functions.invoke(
          "push-alpha-lead-to-ghl",
          {
            body: { alpha_lead_id: row.id, require_email: requireEmail, batch_tag: batchTag },
            headers: { Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
          },
        );
        if (fnErr) throw fnErr;
        if (data?.skipped === "no_email") {
          // Held back, not broken. Counting these as failures would make a
          // clean run look like a broken one and bury the real errors.
          results.skipped += 1;
        } else if (data?.success === false) {
          results.failed += 1;
          failures.push({ name: row.name, error: String(data?.error ?? "unknown") });
        } else if (data?.alreadyPushed) {
          results.skipped += 1;
        } else {
          results.pushed += 1;
        }
      } catch (e) {
        results.failed += 1;
        failures.push({ name: row.name, error: e instanceof Error ? e.message : String(e) });
      }
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }

    const stillRemaining = await countRemaining(requireEmail);

    return json({
      success: true,
      dry_run: false,
      require_email: requireEmail,
      batch_tag: batchTag,
      ...results,
      remaining: stillRemaining,
      not_enrichable: notEnrichable,
      failures: failures.slice(0, 10),
      note:
        `${stillRemaining} eligible row(s) still unpushed. Run again to continue — ` +
        "the per-row push short-circuits on rows already linked, so nothing is touched twice." +
        (notEnrichable ? ` ${notEnrichable} row(s) remain held back for having no email.` : ""),
    });
  } catch (err) {
    console.error("[alpha-backfill-ghl] error", err);
    return json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});
