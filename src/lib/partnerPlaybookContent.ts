// Partner Playbook content — viewable on-page (no downloads).
// Australian English. Currency AUD incl. 10% GST. Address the partner directly ("you").

export type PlaybookBlock =
  | { type: "h2"; text: string }
  | { type: "p"; text: string }
  | { type: "list"; items: string[] }
  | { type: "ordered"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "qa"; q: string; a: string }
  | { type: "note"; text: string }
  | { type: "cta"; title: string; text: string; href: string; label: string; note?: string };

export interface PlaybookSection {
  id: string;
  title: string;
  summary: string;
  /** Lucide icon name handled in the page component */
  icon: "MessageSquare" | "Target" | "ShieldQuestion" | "HelpCircle" | "Send" | "Mic" | "DollarSign";
  readMinutes: number;
  blocks: PlaybookBlock[];
}

export const PLAYBOOK_SECTIONS: PlaybookSection[] = [
  {
    id: "positioning",
    title: "Positioning and messaging sheet",
    summary: "How to talk about alfred ai so it lands.",
    icon: "MessageSquare",
    readMinutes: 4,
    blocks: [
      { type: "h2", text: "The one-line pitch" },
      {
        type: "quote",
        text: "alfred ai is not a SaaS company. We specialise in customised AI and software solutions for the construction industry, built on machine learning and knowledge management. Our AI-assisted infrastructure lets us deliver custom solutions 10x faster than conventional development, so your system looks your way and applies accordingly — no fixed SaaS packages.",
      },
      { type: "h2", text: "What you are really selling" },
      {
        type: "p",
        text: "You are not selling SaaS seats. You are selling a custom-built AI and software capability that fits how the client already works. Established construction and contracting firms come to alfred ai when off-the-shelf SaaS packages fall short, and they need a solution shaped around their workflows, data, and margins — accelerating growth, reducing rework onsite, giving clearer data for quicker decisions, winning more jobs, growing without overhead, and improving EBITA ahead of exit.",
      },
      { type: "h2", text: "Lead with the outcome, not the feature" },
      { type: "list", items: [
        "Escape the SaaS straitjacket — custom solutions that fit your workflow, not a vendor's fixed feature list.",
        "Win more bids — faster, more accurate take-offs and estimates mean you quote more jobs in less time.",
        "Reduce rework onsite — clearer data and tighter handovers mean fewer mistakes making it to the field.",
        "Make quicker decisions — knowledge management gives your team the right information when they need it.",
        "Grow without overhead — add AI capacity in weeks, not the months a new hire takes.",
      ]},
      { type: "h2", text: "Message by audience" },
      { type: "qa", q: "Business owner / director", a: "Focus on control and margin: a solution shaped around your workflow, not a fixed SaaS package. Faster delivery, less rework, and capacity to grow without more overhead." },
      { type: "qa", q: "Estimator / take-off lead", a: "Focus on speed and accuracy: a custom-built AI layer that fits your estimating process and reduces manual work and errors." },
      { type: "qa", q: "Operations / project manager", a: "Focus on clarity and control: a system that looks your way, surfaces the right data, and removes the chasing and rework." },
      { type: "h2", text: "Words that work" },
      { type: "list", items: [
        "\"Customised AI and software\" — not a generic SaaS package, shaped around how you work.",
        "\"Agentic AI\" — it does work for you, it isn't just a chatbot.",
        "\"Machine learning and knowledge management\" — the core technology that makes your data useful.",
        "\"10x faster than conventional development\" — speed to value without cutting corners.",
        "\"Looks your way and applies accordingly\" — the system adapts to your workflow, not the other way around.",
      ]},
      { type: "note", text: "Avoid hype. Speak plainly, address the person as \"you\", and always tie a feature back to a result they care about." },
    ],
  },
  {
    id: "icp",
    title: "Ideal client profile and target-list guidance",
    summary: "Who to go after and how to build your list.",
    icon: "Target",
    readMinutes: 5,
    blocks: [
      { type: "h2", text: "Your ideal client" },
      { type: "list", items: [
        "Established builders and contractors — typically 10–200 staff — who are ready to upgrade their non-AI systems and workflows to an agentic-native operating model.",
        "They are already running on manual, spreadsheet or legacy systems and feel the drag on growth and margin.",
        "Quoting and winning work regularly, with a real take-off or estimating workload.",
        "An owner or operations lead who is time-poor, growth-minded, and focused on EBITA.",
      ]},
      { type: "h2", text: "Strong buying signals" },
      { type: "list", items: [
        "They complain that off-the-shelf SaaS tools are too generic or force them to change how they work.",
        "They have tried fixed SaaS packages and hit limits around workflow, reporting, or integrations.",
        "They are hiring (or struggling to hire) estimators, project admin, or software specialists.",
        "They mention missing bids, slow turnaround on quotes, or leads slipping through the cracks.",
        "They are already experimenting with AI but need it tailored to their data and processes.",
      ]},
      { type: "h2", text: "Who to avoid (for now)" },
      { type: "list", items: [
        "Sole operators with no team and little admin load.",
        "Businesses looking for a cheap, plug-and-play SaaS subscription rather than a tailored solution.",
        "Businesses with no regular quoting, take-off, or project workflow pain.",
        "Anyone looking for a one-off freebie rather than a real capacity solution.",
      ]},
      { type: "h2", text: "How to build your target list" },
      { type: "ordered", items: [
        "Start with your own network — past clients, suppliers, builders and contractors you already know.",
        "Search by category and region, then shortlist businesses that match the profile above.",
        "Check LinkedIn for owners and ops leads posting about growth, hiring or workload.",
        "Group your list into warm (you know them), aligned (clear fit) and aspirational (stretch) tiers.",
      ]},
      { type: "note", text: "Aim for quality over volume. A focused list of 30–50 genuine fits will out-perform a cold list of hundreds." },
      { type: "cta", title: "Find targets faster with the alfred ai iOS app", text: "Use the alfred ai mobile app to scan business cards, discover nearby leads, and get a daily feed of high-fit prospects matched to your territory.", href: "https://apps.apple.com/us/app/alfred-ai/id6755116821", label: "Download on the App Store", note: "Android is coming soon — join the waitlist or check back here for updates." },
    ],
  },
  {
    id: "objections",
    title: "Objection-handling sheet",
    summary: "Clear answers to the questions you'll hear most.",
    icon: "ShieldQuestion",
    readMinutes: 5,
    blocks: [
      { type: "h2", text: "How to handle any objection" },
      { type: "p", text: "Acknowledge, ask, then answer. Don't argue — understand what's behind the concern, then respond with a clear, honest answer tied to their situation." },
      { type: "h2", text: "Common objections" },
      { type: "qa", q: "\"We don't want another SaaS subscription.\"", a: "alfred ai isn't SaaS. It's a customised AI and software solution built around your workflow, shaped to your data and processes. You own the outcome, and it works the way your team works." },
      { type: "qa", q: "\"We need something that fits our exact process.\"", a: "That's exactly what we do. We start with how you work, then build machine learning and knowledge management around it. No forced process changes or limited feature sets." },
      { type: "qa", q: "\"It's too expensive.\"", a: "Compare it to the cost of a hire, the bids you're missing, or the rework you're carrying. A custom alfred ai solution adds capacity and removes drag for a fraction of the cost and time of building conventionally." },
      { type: "qa", q: "\"We're too busy to set this up.\"", a: "That's exactly the problem it solves. Delivery is managed by alfred ai, with a structured onboarding and a human in the loop. Your client starts seeing value quickly without rebuilding their team." },
      { type: "qa", q: "\"AI will get it wrong / I don't trust it.\"", a: "alfred ai works alongside your team with a human in the loop, not unsupervised. It does the heavy lifting; your people review and approve. It's built for construction, not a generic tool." },
      { type: "qa", q: "\"Will this replace my staff?\"", a: "No — it expands their capacity. It removes repetitive work and gives your team clearer data, so they can focus on winning and delivering jobs. It's about doing more with the team you have." },
      { type: "qa", q: "\"We already tried an AI tool and it didn't help.\"", a: "Most AI tools are generic SaaS add-ons, not built for construction workflows. alfred ai is customised to your data and processes, with hands-on delivery and support." },
      { type: "qa", q: "\"Let me think about it.\"", a: "Agree, then narrow it down: \"Of course — is it the fit, the timing, or the investment you want to weigh up?\" That tells you the real objection so you can address it." },
      { type: "note", text: "If you don't know the answer, say so and bring in your alfred ai contact. Honesty builds trust and protects the deal." },
    ],
  },
  {
    id: "faq",
    title: "Partner FAQ and client FAQ",
    summary: "Quick answers for you and for prospects.",
    icon: "HelpCircle",
    readMinutes: 4,
    blocks: [
      { type: "h2", text: "For you (the partner)" },
      { type: "qa", q: "How do I get paid?", a: "You earn commission on the project fee and any ongoing managed service component. Commission is paid once client payments clear. Your rate steps up as your cumulative sales grow." },
      { type: "qa", q: "Who delivers the work?", a: "alfred ai handles full discovery, build, delivery and support. You focus on finding and winning clients; we handle the custom solution and ongoing service." },
      { type: "qa", q: "How do I protect a deal?", a: "Register the opportunity through the portal. Once registered, that opportunity is logged and protected to you." },
      { type: "qa", q: "Where do I get help?", a: "Use your dedicated partner contact and the Support area of the portal. Bring us into client conversations whenever it helps close the deal." },
      { type: "h2", text: "For your prospects (clients)" },
      { type: "qa", q: "What is alfred ai?", a: "alfred ai is not a SaaS company. We specialise in customised AI and software solutions for the construction industry, built on machine learning and knowledge management. Our AI-assisted infrastructure lets us deliver custom solutions 10x faster than conventional development, shaped to your workflow and data." },
      { type: "qa", q: "How is this different from SaaS?", a: "SaaS gives you a fixed package with fixed features. alfred ai builds around your process, your data and your jobs. It looks your way and applies accordingly, rather than forcing you to look like every other user." },
      { type: "qa", q: "How long until we see value?", a: "Because our AI-assisted infrastructure delivers custom solutions 10x faster than conventional development, clients typically start seeing value within weeks, not months." },
      { type: "qa", q: "Is our data safe?", a: "Yes. alfred ai is built with security and a two-way protection layer, and your data is handled to enterprise standards. Your alfred ai contact can walk through specifics." },
      { type: "qa", q: "Do we need technical staff?", a: "No. Discovery, delivery, support and training are handled for you. We build around your team, with a human in the loop and clear handover." },
    ],
  },
  {
    id: "outreach",
    title: "Outreach templates",
    summary: "Cold email, LinkedIn message and a follow-up sequence.",
    icon: "Send",
    readMinutes: 6,
    blocks: [
      { type: "h2", text: "How to use these" },
      { type: "p", text: "Personalise the first line every time — reference their business, a recent project or something specific. Templates get you started; relevance gets you replies. Copy the text below straight into your email or LinkedIn." },
      { type: "h2", text: "Cold email — first touch" },
      { type: "quote", text: "Subject: Custom AI for [Company]'s workflow\n\nHi [Name],\n\nI work with established builders and contractors to design customised AI and software solutions that fit their exact workflow — not a fixed SaaS package.\n\nOur AI-assisted infrastructure typically delivers custom solutions 10x faster than conventional development, so [Company] could get a system that looks your way and applies accordingly, without the usual SaaS limits.\n\nWorth a quick 15-minute chat next week?\n\nCheers,\n[Your name]" },
      { type: "h2", text: "LinkedIn — connection message" },
      { type: "quote", text: "Hi [Name], I help established builders and contractors move past fixed SaaS packages by designing custom AI and software solutions shaped around their workflow. Would love to connect and share a couple of ideas for [Company]." },
      { type: "h2", text: "Follow-up sequence" },
      { type: "ordered", items: [
        "Day 3 — short nudge: \"Hi [Name], just floating this back to the top of your inbox — worth a quick chat?\"",
        "Day 7 — add value: share a relevant result or use case for their business.",
        "Day 14 — the break-up: \"Happy to close this off for now — should I check back in a few months instead?\" (This often gets the reply.)",
      ]},
      { type: "note", text: "Keep messages short, plain and about them. No jargon, no hard sell. The goal of outreach is a conversation, not a close." },
    ],
  },
  {
    id: "discovery",
    title: "Discovery questions and talk track",
    summary: "Run a strong first conversation.",
    icon: "Mic",
    readMinutes: 5,
    blocks: [
      { type: "h2", text: "The shape of a great first call" },
      { type: "ordered", items: [
        "Open — build rapport and set the agenda (2 min).",
        "Discover — ask questions and listen (10–15 min).",
        "Connect — link what you heard to alfred ai (5 min).",
        "Next step — agree a clear action, usually a demo with your alfred ai contact.",
      ]},
      { type: "h2", text: "Discovery questions to ask" },
      { type: "list", items: [
        "Walk me through the systems and workflows you rely on today — what works and what doesn't?",
        "Where do off-the-shelf SaaS tools or fixed packages fall short for you?",
        "What would you change about your current software if you could shape it around your process?",
        "How many bids are you quoting a week — and how many would you like to?",
        "Where do enquiries or leads tend to slip through the cracks?",
        "How much time does your team lose to admin, rework, or chasing information?",
        "If you could automate or improve one workflow, what would it be and why?",
        "What's stopping you from taking on more work or improving margin right now?",
      ]},
      { type: "h2", text: "Talk track — connecting the dots" },
      { type: "quote", text: "\"From what you've told me, the bottleneck is [their words — e.g. estimating capacity or a SaaS limit]. That's exactly what alfred ai is built for — we design a custom AI and software solution around your workflow, so your team gets capacity back without changing how they work. The best next step is a quick demo so you can see how it would look for your jobs. Can I set that up?\"" },
      { type: "note", text: "Aim to listen more than you talk. The more they describe their pain in their own words, the easier the rest of the sale becomes." },
    ],
  },
  {
    id: "pricing",
    title: "Pricing sheet",
    summary: "How pricing works. All discounts need CEO approval.",
    icon: "DollarSign",
    readMinutes: 3,
    blocks: [
      { type: "h2", text: "How pricing is structured" },
      { type: "p", text: "alfred ai is not a SaaS subscription. Each solution is scoped and priced as a tailored project, with an optional ongoing managed service component. Exact pricing depends on scope, complexity and integrations — your alfred ai contact confirms the final numbers for each client." },
      { type: "h2", text: "Pricing is in the client's local currency" },
      { type: "p", text: "Pricing is quoted in the client's local currency at a 1:1 figure — for example, a solution priced at $10,000 is A$10,000 in Australia, US$10,000 in the United States, and C$10,000 in Canada. In Australia, prices include 10% GST; taxes in other regions are applied per local requirements. Always confirm the figure and currency for the client's region with your alfred ai contact." },
      { type: "h2", text: "What you can do" },
      { type: "list", items: [
        "Explain the value: a custom solution that fits the client's workflow, delivered 10x faster than conventional development.",
        "Position the project fee as an investment with fast payback through more won work, reduced rework, and clearer data.",
        "Frame any ongoing managed service against the cost of maintaining in-house systems or headcount.",
      ]},
      { type: "h2", text: "The golden rule on discounts" },
      { type: "quote", text: "All discounts need CEO approval. No exceptions." },
      { type: "p", text: "If a prospect pushes on price, don't discount on the spot. Reinforce the value, understand the real concern, and bring it to your alfred ai contact. Protecting price protects your commission and the partnership." },
      { type: "note", text: "Never quote a number you're unsure of. When in doubt, confirm with your alfred ai contact before putting it in writing." },
    ],
  },
];
