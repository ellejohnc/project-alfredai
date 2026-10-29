# alfred ai repositioning — Phase 1 build (Direction 2: The Construction Intelligence Company)

Brand message: **From Drawings to Decisions.** Flagship product: **AI Take-Off Built for Construction.**

## How the live site stays untouched

The new site is built in a **separate draft copy** of the project. The live site (alfredai.bot, new.alfredai.bot) keeps running exactly as it is today. You review the draft's own preview link; nothing goes live until you accept the draft and publish. Admin, leads, quotes, proposals, partner portal and all backend functions are not touched.

Inside the draft, every new page also carries a "do not index" tag until approval, so search engines never pick up the preview.

## Step 1 — Audit (first, before any design)

A written audit saved as `CONTENT_APPROVAL_CHECKLIST.md` plus a short summary for you:
- Existing pages and addresses worth keeping, and where each old address should point (redirect map).
- Reusable assets: logos, Omega/Axiom/Butler/Watch marks, product screenshots and demo videos, the existing Drawings-to-Estimate demo, certification badges, press logos, testimonials, booking widget, lead form.
- Every claim on the current site that the brief forbids (e.g. "70% less admin", "ROI in 90 days", ratings of 4.8 from 47 reviews) flagged for removal or approval.
- The brief's section 13 list of 11 missing items, with an owner column.

## Step 2 — Design foundation

- New colour, type and spacing system: deep charcoal/navy, warm off-white, Signal Pink kept as the rare accent; 8px rhythm; drawing-line grids and plan-markup motifs instead of AI gradients or robots.
- Shared building blocks: new header with the brief's menu (AI Take-Off · Industries · Platform · Results · Resources · Company · Book a Demo), working phone menu, new footer, drawing-to-quantities hero visual (drawn as clean illustration, labelled "Illustrative"), pain-point grid, step-by-step workflow, trade cards with Available / Pilot / Planned badges, platform layer diagram, case-study card (empty until approved), FAQ, demo form.
- All page text kept in data files, separate from layout, so wording can be changed without touching design.
- Tested at 360, 390, 768, 1024, 1440 and wide; reduced-motion respected; tables scroll on phones; 44px+ touch targets.

## Step 3 — Phase 1 pages

| Page | Address | Notes |
|---|---|---|
| Home | `/` | Brief sections A–L: hero with drawing-to-BOQ visual, problems, how it works, outputs tabs, trades, Omega + Axiom ("pending technical sign-off"), existing systems, results (shows "See an example workflow" + "Discuss your ROI case" until real proof is approved), vision diagram with roadmap labels, final CTA |
| AI Take-Off | `/ai-construction-takeoff` | 12 sections from brief §5, FAQ with only answers we can stand behind; others marked for your review |
| How it works | `/how-it-works` | Six steps with one example project carried through; clearly says what is automatic, assisted, and human |
| Industries hub | `/industries` | Six trade cards with honest status |
| General contractors | `/industries/general-contractors` | Unique content per brief §7 |
| Windows and doors | `/industries/window-door-takeoff` | Unique content per brief §7 |
| Platform | `/platform` | Five-layer diagram; Omega/Axiom/Butler/AOS descriptions marked draft |
| Results | `/results` | Case-study layout ready, empty slots plus example-workflow fallback; no invented numbers |
| Book a demo | `/book-demo` | New form (below) plus the existing booking calendar |
| Contact | `/contact` | Restyled, only verified contact details |
| Privacy / Terms | `/privacy`, `/terms` | Restyled, wording unchanged |

The existing interactive Drawings-to-Estimate demo is reused inside the Take-Off page and homepage, labelled as a sample.

Phase 2 pages (steel, civil, mechanical, electrical, Omega, Axiom pages) are not built now — the hub shows them as "coming soon" without links to empty pages.

## Step 4 — Demo form and tracking

- Fields from brief §11.1; only name, work email, company and trade required; privacy tick box.
- Sends into your existing leads pipeline (admin Leads Inbox and GHL) using the lead capture already in place — no new destination.
- Loading, success, error states; double-submit blocked; spam check reused. On error: clear message, link to the next best page, and an "Email us" button that includes the page address and a screenshot.
- Events: demo_cta_click, demo_form_start, demo_form_submit_success / error, industry_page_view, workflow_demo_interaction, case_study_open — sent to the existing tracking.

## Step 5 — SEO

Unique title and description per page, one H1, canonical addresses, Organisation / WebSite / Breadcrumb data, FAQ data only where the FAQ is visible, take-off and takeoff spellings used naturally, sitemap entries prepared (switched on at launch), redirect map from old addresses ready for launch.

## Step 6 — Checks before handing back

Phone and desktop screenshots of every page, link check against the real page list, form test end to end into the Leads Inbox, accessibility pass, speed check, typecheck/tests/build. Then a report: built / using placeholders / blocked on you.

## What I need from you (can arrive during the build)

1. Real AI Take-Off screenshots or demo video, and a permission-cleared drawing set with its output BOQ.
2. Confirmed trade list with live / pilot / planned status.
3. Engineering-approved one-liners for Omega, Axiom, Butler, AOS.
4. Supported export formats and integrations.
5. Approved customer logos, case studies, quotes and figures.
6. Approved security / hosting wording (current certification badges stay only if still valid).
7. Brand name in copy: the brief says "Alfred AI", my saved notes say "AlfredAI", and your preference is "alfred ai" — I will use **"alfred ai"** unless you say otherwise.

Until these arrive, visuals are labelled illustrations and claims stay conservative.

## Technical details

- Work happens in a draft (isolated branch/preview); main project untouched until accept + publish.
- New code under `src/site-v2/` (components, `content/*.ts` page data, tokens) and routes swapped in App.tsx only inside the draft; old pages kept for redirects.
- Tokens added to `src/index.css` / `tailwind.config.ts` as a scoped theme class so admin styling is unaffected.
- Form reuses existing lead submission + reCAPTCHA + GHL logging path; analytics via existing tracking helper.
- Route-resolution test extended to cover new nav and footer links.
- Docs board / Master Plan / Shipped log updates are flagged in the report (artifacts not writable from here).
