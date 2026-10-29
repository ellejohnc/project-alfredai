# Working agreement — AlfredAI Impact

## The website brief (merged 21 Oct)

Repo: github.com/alfred-agent/alfredainew. Live site: new.alfredai.bot. Built and synced
with Lovable.

### Hard rules
- Lovable syncs two-way with the default branch. Never force-push, rewrite history, or
  rename the default branch.
- Keep the Lovable stack: TypeScript, React, Tailwind CSS, shadcn/ui. Do not swap
  frameworks or the build tool.
- Do not commit secrets. Keys live in Lovable/Supabase project settings or edge function
  secrets.
- Use plan mode before any new page, route, or backend/edge function. Get the plan
  approved before writing code.
- Small, scoped commits. Pull before working so Lovable edits are not overwritten.

### Planned work
- Client publishing portal (TikTok Direct Post reapply): client brands connect their own
  TikTok accounts and approve posts on the site. An alternative being considered: one page
  that provides a script or generates content and auto-publishes to the user's TikTok after
  approval. Confirm which before building.
- Website, CRM and leads tasks are tracked on the Leads Build board:
  https://claude.ai/artifact/5nU1eYJPMJYSePX3WvUiX6 (the same board as the
  claude.ai/code/artifact/26bdaba6-… link used below; both addresses open it).

### Output style
Plain text, no emojis. Return only changed code unless asked for full files. Report what
changed and what was tested. This applies to replies, docs and anything pushed here; the
emoji labels this file used to carry on its doc links were removed when this brief was
merged.


## THE LEADS BUILD BOARD IS THE TRACKER. UPDATE IT WITH THE WORK, EVERY TIME.

**[Leads Build board](https://claude.ai/code/artifact/26bdaba6-6e2a-4ff7-a4d9-5f06158196bd)**
is where I follow this project. Its own promise, written on the page:

**Since 13 Oct it runs on the same engine as my Content engine task board.** The page
holds its state as one JSON block and republishes itself when a task changes: every task
has its own status (Due today · In progress · Blocked · Open · On hold · Done …), severity,
mode (Claude Code · Lovable · by hand · message · guide), a "why it matters", steps and a
next task. Since 15 Oct it follows the Content engine board's newer interface too: every
Blocked or On hold task carries its reason and the tasks it waits on (`blocked`), on-hold
tasks sit in their own fold instead of reading as active, and **The path** (`state.path`)
is the numbered order of work with a "Do this now" marker. The weekly goal moves on by itself when a
week ends (next week's plan if there is one, otherwise the goal and unfinished priorities
carry over); it shows on open and is saved with the next real change. The check refuses a held task
with no reason and a path step or "waiting on" naming a task that does not exist. The page builds Start here, the daily plan and report, the weekly goal, the
waiting list and Known problems **from the tasks**, so there is no banner or phase label
to drift. Before 13 Oct it was phases → stages → tasks typed into a script, and on 20 Aug
Claude updated the banner three times in one day without touching the tasks underneath.
**I should never have to ask for this.**

Concretely, when any piece of work lands:

1. Update **the task**: its status, and a note of what was actually done. A task in Done
   with no note is refused by the check, because "done" with nothing behind it is how the
   Content engine board recorded an Alpha push that never ran.
2. If the task is not there, add it, in the area it belongs to, with its next task.
3. Anything waiting on me goes to **Blocked** or **On hold** with what it waits for, so
   it shows under "Waiting" instead of reading as work in progress.
4. Make the **Master Plan** agree. Two docs disagreeing about the same phase is the
   exact confusion this board exists to prevent, and it has happened twice.
5. Findings go to the **live Findings log** in the admin panel (**System Health** page,
   `/admin/system-health`), which reads from `build_findings` — not retyped into HTML
   where it rots.

**Numbers belong in the app, not in a doc.** Prefer linking to the live surface over
restating a figure. Every count typed into an artifact is correct until the next run.

## READ FIRST, WRITE AFTER. This is the loop — it comes before everything else.

I proposed this on 20 Aug, after Claude built the follower surface without opening the
Standard and only read it once I pointed at the result. The rule already existed, in
capitals, further down this file. Knowing it was never the problem.

**We built these docs. Use them.** They are the reference for the work, not a record of
it — read whichever ones cover what is being touched, BEFORE touching it, and update them
when the work lands. Not only for new features: adjusting something that already exists
is exactly when memory is trusted and is wrong.

### The pages that are watched and updated. This is the list — there is no other.

**Three are ALWAYS touched when the app or the backend changes** — `src/**`,
`supabase/functions/**`, `supabase/migrations/**`. That is what `doc-map.json` enforces,
and it is deliberate: a CI budget number or a script tweak is not something I read the
board for. This line used to say "whatever the change was", which the gate has never
done — the gate was right and the sentence was wrong. The rest fire when the thing they
describe is touched. Read them before the work, update them when it lands.

| Page | When it is touched | What changes in it |
|---|---|---|
| **[Leads Build board](https://claude.ai/code/artifact/26bdaba6-6e2a-4ff7-a4d9-5f06158196bd)** | **ALWAYS** | The **stage and the task** — never just the banner. This is where I read what is next and what is done. |
| **[Master Plan](https://claude.ai/code/artifact/91718abb-c46b-49c8-9bc8-2a6a09aa6340)** | **ALWAYS** | The phase state, kept agreeing with the board. Two docs disagreeing about a phase is the exact confusion the board exists to prevent. |
| **[Shipped log](https://claude.ai/code/artifact/1c73c39a-8383-4784-ba26-1483de720f04)** | **ALWAYS — on deploy** | A new entry the moment it is live. Committed is not shipped. |
| **[The Leads Design Standard](https://claude.ai/code/artifact/82165f38-f123-46cc-ab2b-4e703359139e)** | Any lead surface — row, tiles, toolbar, peek, record | The rule itself, when a design decision changes. **The authority; short form below.** |
| **[Every Leads Page](https://claude.ai/code/artifact/60e478dd-2f24-4541-8a2a-12a6962c8878)** | A specific lead page | That page's tiles, fields and record |
| **[Live Samples](https://claude.ai/code/artifact/b38eebde-7088-4ff5-8b93-f241b8b2fcf3)** | A shared component, Spotlight | How the component actually looks |
| **[UI-Kit](https://claude.ai/code/artifact/07f701e2-9530-426d-9b13-221a3da3135f)** | Shared components, tokens, `tailwind.config.ts` | What is built, and what is actually in use |
| **[GHL Integration](https://claude.ai/code/artifact/b4fa2ea5-a085-4bd9-9422-52713dc208da)** | Any GoHighLevel call, edge function, response shape · also `docs/ghl/` | Endpoints, which direction each syncs, what is two-way |
| **[Design vs Build](https://claude.ai/code/artifact/791fd2fd-b1c6-492c-9d1c-1005fa801a56)** | Lead surfaces, Spotlight | A gap closed, or a new one found |

**Two keep themselves current — do not hand-write them:**

- **Findings log** — on the **System Health** page, reads `build_findings` from the database.
- **[Docs Plan](https://claude.ai/code/artifact/00b8292c-1187-4612-8eb7-942d117eae48)** — generated from
  `docs/doc-map.json` by `scripts/build-docs-plan.mjs`. Edit the map, re-run, republish.

**Eleven pages are RETIRED and must never be updated.** They are frozen signposts, listed on the
Docs Plan. Updating one recreates the drift the retirement removed. The nine above are the
necessary ones and the only ones kept current.

**The gate names them for me**, in CI and at the end of every turn — `docs/doc-map.json` is
the same list in machine form. If the gate and this table ever disagree, that is a finding.

**Before republishing the BOARD, check it:** `node scripts/check-board.mjs <file>`. It
proves the state and the script both parse — a missing comma left the old board blank for
three days and the link was handed over four more times without anyone opening it — that
every area, status, mode, next task and weekly priority it names exists, and that every
Done task says what was done. To republish, read the live board first (it may have been
changed from the page since), edit its state JSON, check, publish to the same URL with
`capabilities: {artifact: {}}` kept, then stamp it. Never publish on load from inside the
page: it saves only when someone changes something.

**After republishing a doc, stamp it:** `node scripts/stamp-doc.mjs <id>` (ids: `board`
`master-plan` `design-standard` `every-leads-page` `live-samples` `ui-kit` `ghl`
`design-vs-build` `shipped`). The gate reads `docs/doc-versions.json` to tell a doc that was
actually republished from a URL that was merely pasted into a commit message. A link with no
stamp change fails the build and names the doc.

Often more than one applies. Read all of those, not the cheapest one.

**When a doc and the code disagree, that is a finding, not a detail.** Either the code is
wrong or the doc is stale, and it gets resolved in the same session. A guide that is wrong
is worse than no guide — "all 53 call sites are migrated" was exactly that, and it stopped
anyone looking for a year's worth of stragglers.

**If something is missing from the docs, add it.** A gap found and not written down is the
same as not having found it.

**Then say it out loud, both ends, so I can check without reading any code:**

- **Going in** — the message where work BEGINS quotes the rule being built to.
  No quote means it was not read, and I can stop it there.
- **Coming out** — the message where work LANDS carries the doc link.
  No link means the docs were not updated.

That visible pair is the whole mechanism. It is the same shape as the
`[Lovable]` / `[me — direct]` tag, which is the one convention that has never slipped,
precisely because absence of the tag is visible. A promise to remember is not a
mechanism; this is.

**And the coming-out half is now enforced, not remembered.** `docs/doc-map.json` maps
each of the nine live docs to the files it describes; `scripts/doc-check.mjs` reads the
diff and names them. It runs two ways: **CI fails** when a commit touches mapped code and
carries no doc link, and a **Stop hook** prints the list at the end of every turn. The
board, the Master Plan and the Shipped log are `always` — the board is where the state is
read, so everything that lands touches it.

Escapable on purpose: `Docs: n/a — <reason>` in the commit message passes, and the reason
goes on the record. A gate that cannot be bypassed gets switched off; one that makes the
bypass visible stays on. Same reasoning as the lint budget.

**Retired artifacts are deliberately not in the map.** They are frozen signposts — the
nine in `doc-map.json` are the necessary ones, and they are the only ones kept current.

### The kit rules, so reading them is free

The Standard is the authority and this is its short form — kept here because a rule
behind a 129 kB fetch gets skipped under the save-usage rule above, which is exactly
how the follower gap survived. **Change one, change both, in the same commit.**

- **Five bands, never reordered:** title · tiles · toolbar · table · empty state.
- **A tile is a filter, not a statistic.** If clicking it does nothing, it does not belong.
- **Toolbar order is fixed:** Search · Sort · Status · Owner · Outcome · ⋯ — extras go in
  the overflow so the first five never move between pages.
- **Row:** name · source badge · email · status · date · ⋯. Click and Enter open the peek;
  Space deliberately does nothing.
- **The peek never grows.** Every "just one more thing" goes to the record instead. Its
  rows are LABELLED — a muted label with its value beside it, on one grid. An unlabelled
  avatar is not a peek row; that is how followers ended up rendering as a bare bubble.
- **Record:** three tabs — Details · Conversation · Opportunity — with Ownership and
  Attribution in a sticky side panel. Notes live in Details only.
- **Signal Pink is the only accent.** Green synced, amber waiting, red failed are states,
  never decoration, and never stand in for the accent.
- **The drawing beats the prose** when the Standard's rendered layout and its written rule
  disagree.

## The rule above all others: save usage.

Every choice below serves that. When two approaches both work, take the cheaper one.
**It never justifies skipping the lookup above** — that is what the short form is for.

## Do exactly what was asked

Do the thing asked, then stop. If something else worth doing turns up, **name it in one
line and wait** — do not go and do it. Two examples of getting this wrong, both real:
a question about four failing CI checks turned into an unasked-for 570-finding lint
cleanup; "remove the notes from the Details tab" was read as "move them into it" and
the card was put exactly where it was meant to be removed from.

Re-read the instruction before acting on it. Short instructions are the easiest to
invert.

## Split by task type

**Lovable's agent** (`send_message` — costs workspace credits, not context)
- New pages, visual and layout work, self-contained UI from a description
- **Investigation and code search.** It already has the codebase in its own context, so
  asking it "where does X live, what calls Y" is far cheaper than grepping and reading
  files into this one. Prefer it for any broad "how does this work" question.

**Directly in this repo** (costs context, no credits)
- Investigations that need the live database or proof
- Schema, edge functions, cross-file changes
- Anything that must be verified before it lands

Lovable's agent has no privileged knowledge — it reads the same files. The point is
*whose context pays for the reading*.

### Say which one, every time

**Before starting any piece of work, state whether it is going through Lovable's agent
or being edited directly.** I have asked for this twice. Tag it plainly — `[Lovable]`
or `[me — direct]` — in the message where the work is proposed or begun, not afterwards
in a summary. I am tracking credits against context and cannot see which is which from
the result alone.

> **Lovable's agent: this rule is not for you.** It applies only to the Claude Code
> session talking to me, which is the only place the distinction carries any
> information. Lovable's agent reads this file too, saw the convention, and started
> prefixing its OWN replies with `[me — direct]` — which is both meaningless coming
> from Lovable and actively misleading, since everything Lovable does is by definition
> the Lovable side. **Never put `[Lovable]` or `[me — direct]` in a message sent TO
> Lovable, or in a reply FROM it.**

## How this project is wired

- **Lovable and GitHub are one repository.** A push to `main` puts the code in Lovable
  at that instant. Then `deploy_project` publishes it. There is no handoff.
- CI is advisory. `main` has no branch protection, so a red check never blocks a push
  and never means the code failed to arrive.
- **Verify before pushing — all three, every time:**
  1. `npx tsc --noEmit -p tsconfig.app.json`
  2. `npx vitest run` — the whole suite, and CI runs it too
  3. `npx vite build`
- `npx vite build` rewrites `supabase/functions/mcp/index.ts` (a version bump). Revert
  it before committing.
- **`src/test/edge-functions/**` are excluded from the default test run.** They POST
  to the DEPLOYED Supabase functions, and one of them sends email — a plain
  `npx vitest run` should never send live requests to production. Opt in on purpose:
  `RUN_EDGE_TESTS=1 npx vitest run src/test/edge-functions`.

## Things learned the expensive way — do not rediscover these

- **Edge functions in the repo are NOT deployed automatically.** Pushing to `main`
  updates the repo and the FRONTEND, and nothing else. A function can sit in
  `supabase/functions/` for days, fully committed, and never run. I reported three
  times that "some fixes are not deployed" and was told each time it was Lovable's sync
  queue being slow. It was not.

  **Never report an edge function as shipped without calling it.** Proof, not
  inference:

  ```sql
  select net.http_post(
    url := 'https://<project>.supabase.co/functions/v1/<name>',
    headers := jsonb_build_object('Content-Type','application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name='<a service key>')),
    body := '{}'::jsonb) as id;
  -- then: select status_code, content from net._http_response where id = <id>;
  ```

  `{"code":"NOT_FOUND"}` means it was never deployed. A 200 proves it exists but NOT
  that it is current — a stale copy answers happily. To deploy, ask Lovable's agent:
  it has `supabase--deploy_edge_functions` and named functions cost about 0.8 credits.

- **Migration files in the repo are NOT applied automatically.** Two were committed and
  never ran, while code wrote to the columns they were meant to create. Apply schema
  changes through Lovable's `query_database`, then commit the migration file as the
  record.
- **PostgREST caps a response at 1000 rows.** `.limit(1000)` means "the first thousand,
  silently". Use `fetchAllRows` / `fetchExactCount` from `src/lib/supabasePaging.ts`.
- **`ghl_submissions` has no `ghl_contact_id` column.** The id is inside the
  `ghl_response` jsonb. `normalizeGhlSubmission` is the reference.
- **Hooks after an early return crash at runtime** and nothing but
  `react-hooks/rules-of-hooks` catches it — it typechecks, it builds, and it renders
  fine until the guard flips. CI gates on that one rule for this reason, and gates
  separately on it never appearing in `eslint-suppressions.json`: one `--suppress-all`
  in a hurry would pin a live crash and turn the build green over the top of it.

- **Lint debt is held by `eslint-suppressions.json`, not by counting.** ESLint's own
  bulk suppressions, on since 26 Aug — they pin the exact file and rule, so a new
  violation fails no matter what was fixed elsewhere. The old `.github/ci-lint-budget.json`
  counted per rule, which meant a new `any` could hide behind a deleted one while the
  total stayed put. When you deliberately pay debt down, run
  `npx eslint src --prune-suppressions` and commit the result; CI reports leftover
  slack as a warning rather than failing, because turning a FIX into a red build is
  how a gate gets switched off.

- **A route is only a string, so nothing checks where a link goes.** Spotlight's
  `Users & Roles` row pointed at `/admin/users`, which has never been a route — it
  typechecked, it built, and it opened the 404 page. Two more destinations were wrong
  the same way. **Any list of destinations gets a test that resolves them against the
  real `<Route>` table** — `src/lib/__tests__/adminSpotlightRoutes.test.ts` reads
  `App.tsx` and fails on anything it cannot match. Build the guard, not just the fix:
  I found this one by clicking it, which is the wrong way to find it.

- **cmdk filters on each row's `value`, not on whatever the component decided.** A
  Spotlight row matched by its keywords was then removed again, silently, because the
  keywords were not in `value`. Anything searchable has to be in `value` too.

### GoHighLevel — always v3, never guess a shape

- **New code sends `Version: v3`**, passed per-call via `GHL_V3` from
  `supabase/functions/_shared/ghlClient.ts`. The version is a per-call OPTION, not a
  flipped default, so anything using a raw `fetch` starts on the legacy header until
  someone opts in — migrating stays deliberate. Never send `2021-07-28` in new code.

  **The migration IS finished now — but this line was wrong once, so check before
  trusting it.** It previously claimed "all 53 call sites across 18 edge functions are
  migrated" while 32 sat on the legacy header, because the count only ever included
  calls going through `ghlFetch` and every straggler was a hand-rolled `fetch` that
  bypassed the shared client. Numerator right, denominator wrong, written as "all".

  Those 32 were migrated on 20 Aug across 10 files, each now reading
  `Version: GHL_V3` from the shared client rather than a literal, so a rollback is
  one constant. Every endpoint involved was checked against `docs/ghl/` first and all
  exist on v3; six were already proven live.

  One deliberate exception remains: `ghl-send-internal-comment` tries v3 and falls
  back to the legacy version on a 400/422. That is a safety net, not a straggler.

  Re-count before quoting this, the same way every other number here is treated:
  `grep -rn "2021-07-28" supabase/functions --include=*.ts | grep -v _shared/ghlClient`

- **Never invent a response shape.** The full v3 surface is vendored in `docs/ghl/`
  (40 resources, generated from HighLevel's own OpenAPI spec). Check
  `models-*.d.ts` before writing a parser. This is not optional: I was once told
  GoHighLevel has no followers concept, and a local-only table was built on that
  assumption — the vendored SDK disproved it in minutes, and three docs had to be
  corrected.
- **marketplace.gohighlevel.com is blocked by the network proxy.** To refresh the
  vendored docs, `npm pack @gohighlevel/api-client` — registry.npmjs.org IS
  reachable. That is the only known way to read the API surface from here.
- **`ghl-health`** probes one read per resource so a version rejection surfaces on the
  **System Health** page (`/admin/system-health`) rather than in a client's record. It cannot prove WRITE
  response-shape handling — that needs one deliberate write on a lead we own.
- **Rate limits are real.** There is a 429 history. Anything looping over rows goes
  sequential with a delay, never parallel.

## Every finding gets logged. This is the one I have asked for most.

**I do not want fewer fixes. I want to be able to follow them.** On 20 Aug the proposal
was to only fix faults that lose data, cost money, or block the reskin, and log the
rest. I rejected that outright:

> "i dont have problem you encountering problems and fixing it right away. i rather want
> that than forgetting it and later we dont know what to do or where was it."

So: **fix what you find, and write down everything you find.** The fixing was never the
problem. The problem is that I only see this project through the docs, and a fix that
is not written down did not happen as far as I am concerned.

**Every fault, the moment it is found, goes in three places in the SAME session:**

1. The **Findings log** on the [Leads Build board](https://claude.ai/code/artifact/26bdaba6-6e2a-4ff7-a4d9-5f06158196bd)
   — found / what was wrong / what it broke / state. Including ones already fixed.
2. The **Master Plan**, if it changes the shape or size of the work.
3. Whichever **page describes that behaviour**, so the description stops being wrong.

Then give me the links. Every time, unprompted.

**Log it even when it is embarrassing, and especially then.** Two entries in that table
are about this file lying — the v3 count, and edge functions reported as shipped without
being called. Those are the most valuable rows in it.

## Docs — READ THIS BEFORE TOUCHING ANY LEAD SURFACE

### There is ONE design authority. It is not negotiable.

| Doc | Role |
|---|---|
| **[The Leads Design Standard](https://claude.ai/code/artifact/82165f38-f123-46cc-ab2b-4e703359139e)** | **THE ONE WE FOLLOW. Every disagreement resolves here.** |
| [Live Samples](https://claude.ai/code/artifact/b38eebde-7088-4ff5-8b93-f241b8b2fcf3) | Reference only — high-fidelity component close-ups |
| [Every Leads Page](https://claude.ai/code/artifact/60e478dd-2f24-4541-8a2a-12a6962c8878) | Reference only — per-page detail |

**The rule, stated so it cannot be misread:**

1. **Build from the Standard.** Not from Live Samples. Not from Every Leads Page.
   Not from memory of what a page looked like.
2. **When any two docs disagree, the Standard wins.** Immediately. Do not weigh them
   up, do not average them, do not pick the one that suits the change.
3. **A disagreement is a BUG, and fixing it is part of the task.** Correct the
   reference doc to match the Standard in the same piece of work that found it.
   Leaving it for later is how the drift started.
4. **The Standard's drawing beats the Standard's prose.** If the rendered layout and
   the written rule disagree, the drawing is what to build.
5. **Never add a design decision to a reference doc.** New decisions go in the
   Standard, then flow outward.

This exists because Live Samples and Every Leads Page each described the peek and the
record, drifted apart, and I could not tell which to follow. That is the failure
this hierarchy prevents. **Re-reading the Standard costs one page view. Building the
wrong thing costs a rebuild and my trust.**

### Running status
The Standard defines the design; the **board** reports the state — it is the first row of
the table at the top of this file, and it is touched on every change. Keep it honest: an
entry describing a fix that was later corrected is worse than no entry, because it records
a mistake as the solution.

### Numbers in docs go stale — get them, never recall them

A docs script using the public key was tried and abandoned: RLS correctly
refuses anonymous reads on every admin table, and putting a service-role key in
a repo script to work around that would be a security regression for a
convenience. So the rule is procedural, and it is cheap:

**Before quoting any figure in a doc, run this through Lovable's
`query_database` and paste the result. Never type a count from memory.**

**A DATE typed into a doc is a number too.** The Master Plan carried
"updated 20 Aug 2026" in its eyebrow through two republishes on 24 Aug, because
the content was updated and the stamp beside it was not — I spotted it, which is
exactly the check I should not have to do. When a doc is republished, its own
"updated" line is part of the republish, not decoration beside it. Prefer wording
that cannot rot at all: the board says "updated every deploy" and the Shipped log
says "updated every deploy", and neither has ever been wrong.

```sql
select 'ghl_submissions' src, count(*) total,
       count(*) filter (where ghl_response->>'ghl_contact_id' is not null) in_ghl
  from ghl_submissions where archived_at is null
union all select 'meta_leads', count(*), count(ghl_contact_id) from meta_leads
union all select 'alpha_digital', count(*), count(ghl_contact_id) from alpha_digital_leads
union all select 'leads', count(*), 0 from leads
union all select 'investor_leads', count(*), 0 from investor_leads
union all select 'webinar_regs', count(*), 0 from webinar_registrations
order by 2 desc;
```

Better still: **prefer linking to the live surface over restating its number.**
The Sync Health panel on the GHL Sync page already counts every source
server-side and cannot drift. A doc that says "see Sync Health" is correct
forever; a doc that says "3,765" is correct until Tuesday.

### Every doc must be updated in the same session the work lands
Not "later", not "at the end of the phase". I have asked for this more times than any
other instruction. When work changes behaviour, the doc describing that behaviour is
part of the work — and **always give me the links to whatever was updated.**

## Reporting

Keep it short. No narration of what is about to happen. Daily reports go in chat, never
as an artifact.

**Every message where work lands ends with the full task list**, in the board's order:
this week (The path), after that, waiting on me, later phases, and done recently. I have
asked for it after every piece of work and had to ask again twice on 21 Oct. The list
is read from the live board, not from memory. Messages written for Lovable are written in first person as me.
Always include links to any doc that was updated.

### Anything that lands in the repo is written in MY voice

Commits are authored `ElleAAI <elle.c@alfredai.bot>` — they are mine, so they read as
mine. **Never refer to me in the third person in a commit message, a code comment, this
file, or anything else pushed to GitHub.** No "Elle asked for", no "she reported", no
"her trust". It is "I asked for", "I reported", "my trust".

**AND NOTHING IN THE COMMIT SAYS CLAUDE. Not the author, not the committer, not a
trailer.** No `Co-Authored-By: Claude`, no `Claude-Session:` link, no "Generated with
Claude Code", no model name anywhere in a message, a PR body, a code comment or a doc
that lands in the repo. Claude Code's own default is to append those trailers; that
default is **overridden here** and has been since 14 Sep, when I found ten commits
carrying them. The repo is mine and the history reads as mine.

Two things make it stick rather than depend on remembering:

- `git config --local user.name ElleAAI` and `user.email elle.c@alfredai.bot` are set in
  the clone. Passing `-c user.name=…` on the `commit` only fixes the AUTHOR — a
  **`git rebase` re-commits with the ambient identity**, which is how three commits
  ended up with `Claude` as committer while the author read correctly. The author was
  the thing being checked, so the committer went unnoticed.
- Before pushing, check it:
  `git log origin/main..HEAD --pretty='%an|%cn' | grep -iv '^ElleAAI|ElleAAI$'` returns
  nothing, and `git log origin/main..HEAD --format=%B | grep -i claude` returns nothing.

Mentioning Claude in CHAT is fine and always has been. This rule is about the repo.

This applies to the repo, not to chat. In chat, talk to me directly as you always have.

Where a sentence genuinely needs to name who did what, use **"Claude"** for the
assistant, so `I` never has two meanings in the same paragraph. Passive voice is usually
better: "was told", "a table was built on that assumption". The accountability survives
the rewrite — do not let the voice change quietly turn a mistake into nobody's fault.
