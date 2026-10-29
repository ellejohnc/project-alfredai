// Sales Kit content — viewable on-page (no downloads).
// Built directly from the live alfred ai website: homepage, product suite and demo pages.
// Australian English. Currency AUD incl. 10% GST. Address the prospect/partner directly ("you").

export type SalesBlock =
  | { type: "h2"; text: string }
  | { type: "p"; text: string }
  | { type: "list"; items: string[] }
  | { type: "ordered"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "qa"; q: string; a: string }
  | { type: "stat"; value: string; label: string }
  | { type: "note"; text: string };

export interface SalesAsset {
  id: string;
  title: string;
  summary: string;
  /** Lucide icon name handled in the page component */
  icon:
    | "FileText"
    | "Presentation"
    | "PlayCircle"
    | "FileBadge"
    | "GitCompareArrows"
    | "Layers"
    | "ShieldCheck"
    | "Calculator";
  readMinutes: number;
  blocks: SalesBlock[];
}

export const SALES_ASSETS: SalesAsset[] = [
  {
    id: "client-flyer",
    title: "Client flyer — one-page overview",
    summary: "The single-page story you can read out or send: the promise, the proof, the products.",
    icon: "FileText",
    readMinutes: 3,
    blocks: [
      { type: "h2", text: "The promise" },
      {
        type: "quote",
        text: "From Requests to Outcome — 10x Faster.\n\nAlfredAI is the agentic AI execution layer for construction. AI agents orchestrate take-off, estimating and project workflows end-to-end, so you deliver more work without adding headcount.",
      },
      { type: "h2", text: "Who it's for" },
      {
        type: "p",
        text: "Mid-market construction and contracting businesses with $10M–$300M turnover that quote regularly and feel the admin drag of growth.",
      },
      { type: "h2", text: "The proof" },
      { type: "stat", value: "40+ hrs", label: "of admin automated every week" },
      { type: "stat", value: "70%", label: "reduction in administrative tasks" },
      { type: "stat", value: "90 days", label: "typical time to return on investment" },
      { type: "stat", value: "2–4 wks", label: "to implement — no rip-and-replace" },
      { type: "h2", text: "What you get" },
      { type: "list", items: [
        "AI workflow automation built for construction, not generic templates.",
        "Document understanding for drawings, dockets, contracts and tenders.",
        "AI voice and follow-up agents that keep every enquiry warm.",
        "Owner-level visibility across every job and site.",
        "Integrates with the tools you already run — MYOB, Xero and your cloud drive.",
      ]},
      { type: "note", text: "Co-brand it: add your logo, your name and partners@alfredai.bot, then send it after a first call." },
    ],
  },
  {
    id: "pitch-deck",
    title: "Pitch deck — the first-meeting story",
    summary: "Eight slides that take a prospect from problem to next step. Talk to each as you go.",
    icon: "Presentation",
    readMinutes: 6,
    blocks: [
      { type: "h2", text: "Slide 1 — Title" },
      { type: "quote", text: "alfred ai — Agentic AI for Construction. From Requests to Outcome 10x Faster." },
      { type: "h2", text: "Slide 2 — The problem" },
      { type: "p", text: "Construction teams are stretched thin. Estimators are buried in take-offs, leads go cold, and project admin eats the week. Hiring is slow, costly and risky." },
      { type: "h2", text: "Slide 3 — The shift" },
      { type: "p", text: "Agentic AI doesn't just answer questions — it does the work. It expands your team's capacity so people focus on winning and delivering jobs." },
      { type: "h2", text: "Slide 4 — The platform" },
      { type: "list", items: [
        "Axiom — custom AI learning trained on your data.",
        "Butler — AI agents that serve your teams.",
        "Watch — Mission Control for owners and operators.",
        "Omega — your organisation's brain that generates the right SOP and directs the Butler agents.",
        "AOS — the agentic operating system tying it all together.",
      ]},
      { type: "h2", text: "Slide 5 — How it works" },
      { type: "ordered", items: [
        "Agents read your documents — drawings, dockets, contracts, spreadsheets.",
        "They run the workflow — take-off, estimate, follow-up, invoicing, sign-offs.",
        "Everything syncs to MYOB or Xero and your cloud drive, so the team checks instead of re-types.",
      ]},
      { type: "h2", text: "Slide 6 — The proof" },
      { type: "stat", value: "40+ hrs", label: "admin automated weekly" },
      { type: "stat", value: "70%", label: "less admin" },
      { type: "stat", value: "90 days", label: "to ROI" },
      { type: "h2", text: "Slide 7 — Why alfred ai vs generic AI" },
      { type: "p", text: "Unlike Zapier or Make, alfred ai ships pre-built, industry-specific workflows with AI document understanding for contracts and tenders — built for mid-market construction." },
      { type: "h2", text: "Slide 8 — Next step" },
      { type: "p", text: "Book a live demo on a real workflow from their business. Close on a clear, time-boxed pilot." },
      { type: "note", text: "Keep slides light — you are the presentation. Let each stat and product line earn one sentence." },
    ],
  },
  {
    id: "demo-walkthrough",
    title: "Demo walkthrough — what to show",
    summary: "The live demos and pages you can open in a browser and forward. Pick the ones that match their pain.",
    icon: "PlayCircle",
    readMinutes: 5,
    blocks: [
      { type: "h2", text: "How to use this walkthrough" },
      { type: "p", text: "Run through the sections in order. Pause on the one that matches their pain, then forward the link or let the prospect drop in their own document." },
      { type: "h2", text: "1. Products page — set the context" },
      { type: "p", text: "Start on the product suite page so they see the full alfred ai stack and understand which layer fits their problem first." },
      { type: "qa", q: "Link", a: "https://new.alfredai.bot/products" },
      { type: "h2", text: "2. Take-off videos — the hook" },
      { type: "p", text: "If they estimate or measure drawings, show one of the machine-learning take-off videos to prove the speed before opening the live demo." },
      { type: "qa", q: "Video 1", a: "https://youtu.be/8Mj_BtWWBT8" },
      { type: "qa", q: "Video 2", a: "https://youtu.be/VMBNhVE4Av4" },
      { type: "h2", text: "3. Take-off demo platform — try their own drawing" },
      { type: "p", text: "Upload a set of drawings and watch alfred ai produce a structured take-off and estimate. Best for estimators and take-off leads drowning in manual measuring." },
      { type: "qa", q: "Link", a: "/demos/drawings-to-estimate" },
      { type: "h2", text: "4. alfredBID — when they tender or bid" },
      { type: "p", text: "If they chase tenders, run the alfredBID demo. It shows AI-powered opportunity capture, tender document extraction, and bid-strategy synthesis." },
      { type: "qa", q: "Link", a: "/demos/alfred-bid" },
      { type: "h2", text: "5. Mission Control — owner and operator view" },
      { type: "p", text: "For owners and senior leaders, show Mission Control to surface forward-looking signals, risks and opportunities across jobs and teams." },
      { type: "qa", q: "Link", a: "https://missioncontrol.accountable.link" },
      { type: "h2", text: "6. Accountable.link demo org — the operating system" },
      { type: "p", text: "Show the full Accountable.link demo organisation to demonstrate how team, tools and daily work connect into one place. Request an invite from Will Z via partners@alfredai.bot." },
      { type: "qa", q: "Link", a: "https://accountable.link" },
      { type: "qa", q: "Invite", a: "Email partners@alfredai.bot (Will Z) for demo org access" },
      { type: "h2", text: "Other quick demos" },
      { type: "p", text: "If the pain is elsewhere, open one of these instead and screen-share." },
      { type: "list", items: [
        "Purchase bill intake — /demos/purchase-bill-intake",
        "Technical report agent — /demos/technical-report-agent",
        "Vendor compliance — /demos/vendor-compliance",
      ]},
      { type: "note", text: "Always demo on a document from their world. One real example beats ten polished slides." },
    ],
  },
  {
    id: "capability-statement",
    title: "Capability statement",
    summary: "What alfred ai does and who it's for, on one page — for procurement and decision-makers.",
    icon: "FileBadge",
    readMinutes: 4,
    blocks: [
      { type: "h2", text: "Overview" },
      { type: "p", text: "alfred ai is the agentic AI execution layer for construction and professional services. AI agents orchestrate take-off, estimating and project workflows end-to-end for 10x faster delivery." },
      { type: "h2", text: "Core capabilities" },
      { type: "list", items: [
        "AI workflow automation across estimating, project admin and finance.",
        "Document processing and contract review for drawings, dockets and tenders.",
        "AI voice agents and automated follow-up.",
        "Bid intelligence and tender analysis.",
        "ROI calculator, analytics and owner dashboards.",
        "Client portal and role-based views.",
      ]},
      { type: "h2", text: "Who we serve" },
      { type: "p", text: "Mid-market firms ($10M–$300M revenue) in construction, property and professional services." },
      { type: "h2", text: "Integration & implementation" },
      { type: "list", items: [
        "Works with your existing tech stack — no rip-and-replace.",
        "Syncs with MYOB, Xero and your cloud drive.",
        "Implementation typically takes 2–4 weeks.",
      ]},
      { type: "h2", text: "Outcomes" },
      { type: "stat", value: "15+ hrs", label: "saved per week on repetitive workflows" },
      { type: "stat", value: "70%", label: "fewer administrative tasks" },
      { type: "stat", value: "90 days", label: "typical payback period" },
    ],
  },
  {
    id: "comparison-sheet",
    title: "Comparison — vs the status quo & legacy tools",
    summary: "How alfred ai stacks up against doing nothing, generic automation and Procore.",
    icon: "GitCompareArrows",
    readMinutes: 4,
    blocks: [
      { type: "h2", text: "vs doing nothing (the status quo)" },
      { type: "list", items: [
        "Status quo: manual take-offs, cold leads, admin drag, and hiring to grow.",
        "alfred ai: agents handle the repetitive work, so you grow capacity without headcount.",
      ]},
      { type: "h2", text: "vs generic automation (Zapier / Make)" },
      { type: "list", items: [
        "Generic tools connect apps but don't understand construction documents.",
        "alfred ai ships pre-built, industry-specific workflows with AI document understanding for contracts, tenders, drawings and dockets.",
      ]},
      { type: "h2", text: "vs Procore / legacy platforms" },
      { type: "list", items: [
        "Legacy platforms are systems of record — you still do the work inside them.",
        "alfred ai is an execution layer — agents do the work and sync to the tools you already run, no rip-and-replace.",
      ]},
      { type: "h2", text: "The one-liner" },
      { type: "quote", text: "Other tools store your work or move data between apps. alfred ai actually does the work — end-to-end, in your business's language." },
      { type: "note", text: "Position against inaction first. Most prospects aren't choosing between vendors — they're choosing whether to act at all." },
    ],
  },
  {
    id: "product-one-pagers",
    title: "Product one-pagers — Axiom, Butler, Watch, Omega, AOS",
    summary: "A focused page for each layer of the suite, straight from the product site.",
    icon: "Layers",
    readMinutes: 5,
    blocks: [
      { type: "h2", text: "Axiom — custom AI learning for your business" },
      { type: "p", text: "Machine learning trained on your data, processes and decisions. Axiom turns institutional knowledge into models that get sharper the more your business runs." },
      { type: "list", items: ["Bespoke model training", "Learns from your data", "Continuously improving"] },
      { type: "h2", text: "Butler — AI agents that serve your teams" },
      { type: "p", text: "Agentic AI that works alongside your people — handling the repetitive, coordinating the complex, and freeing teams to focus on work that moves the business forward." },
      { type: "list", items: ["Always-on agents", "Embedded in workflows", "Scales without headcount"] },
      { type: "h2", text: "Watch — Mission Control for owners and operators" },
      { type: "p", text: "See what's coming before it lands. Watch surfaces forward-looking signals, risks and opportunities so leadership acts early instead of reacting late." },
      { type: "list", items: ["Predictive signals", "Owner-level visibility", "Early-warning insights"] },
      { type: "h2", text: "Omega — your organisation's brain" },
      { type: "p", text: "Omega is the living memory layer. Every decision, document, agent action and outcome is captured, connected and made replayable — so nothing gets lost and every answer is traceable back to source." },
      { type: "list", items: ["Living memory of the business", "Every action traceable to source", "Replayable decisions and audit trail"] },
      { type: "h2", text: "AOS — the agentic operating system" },
      { type: "p", text: "AOS connects your team, tools and daily work into one place. It links the software you already use, automates routine tasks, tracks who owns what, and gives clearer visibility and control." },
      { type: "list", items: ["Connects your tools & teams", "Automates routine work", "Tracks ownership & accountability"] },
      { type: "note", text: "Each layer stands on its own — and together they become the operating system for how a business learns, acts and stays accountable." },
    ],
  },
  {
    id: "eva-security",
    title: "EVA security one-pager",
    summary: "For CTO and IT buyers who need the security detail before they say yes.",
    icon: "ShieldCheck",
    readMinutes: 3,
    blocks: [
      { type: "h2", text: "What EVA is" },
      { type: "p", text: "EVA is secure personal AI inside enterprise work — an AI security guard that lets employees and contractors use personal AI without leaking enterprise data or injecting private personal memory into company workflows." },
      { type: "h2", text: "How it protects you" },
      { type: "list", items: [
        "Two-way guard — controls what leaves and what enters company workflows.",
        "DLP & redaction — sensitive data is detected and stripped before it goes out.",
        "Human approval — high-risk actions require a person to sign off.",
      ]},
      { type: "h2", text: "Why it matters to IT buyers" },
      { type: "p", text: "Staff already use personal AI tools. EVA makes that safe — you get the productivity without the data-leak risk, so you can say yes to AI instead of banning it." },
      { type: "note", text: "Lead with the risk they already have (shadow AI), then position EVA as the control that makes it safe." },
    ],
  },
  {
    id: "roi-outcomes",
    title: "ROI & outcomes — the financial case",
    summary: "The numbers that justify the spend, ready to drop into a business case.",
    icon: "Calculator",
    readMinutes: 3,
    blocks: [
      { type: "h2", text: "Headline outcomes" },
      { type: "stat", value: "40+ hrs", label: "of admin automated every week" },
      { type: "stat", value: "15+ hrs", label: "saved per week on repetitive workflows" },
      { type: "stat", value: "70%", label: "reduction in administrative tasks" },
      { type: "stat", value: "90 days", label: "typical return on investment" },
      { type: "h2", text: "How to build the case" },
      { type: "ordered", items: [
        "Count the hours their team spends on take-offs, follow-up and admin each week.",
        "Multiply by a loaded hourly cost (wage incl. on-costs).",
        "Apply a conservative time saving and compare against the alfred ai investment.",
        "Add the upside: more bids out the door means more work won.",
      ]},
      { type: "h2", text: "Frame it as capacity, not cost" },
      { type: "quote", text: "alfred ai adds the capacity of extra staff in weeks — without the cost, risk and lead time of hiring." },
      { type: "note", text: "All figures are AUD and include 10% GST. Use the live ROI calculator on the website to personalise the numbers for each prospect." },
    ],
  },
];
