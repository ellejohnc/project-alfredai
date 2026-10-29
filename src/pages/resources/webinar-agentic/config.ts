// Single source of truth for the AI for SMEs webinar landing page.
// Edit copy, placeholders and CTAs here.

import sidneyPhotoAsset from "@/assets/sidney-cachuela.png.asset.json";
import williamPhotoAsset from "@/assets/william-zhang.png.asset.json";
import proofBallroomAsset from "@/assets/webinar-proof/ballroom-stage.webp.asset.json";
import proofNetworkingAsset from "@/assets/webinar-proof/networking-suits.webp.asset.json";
import proofGroupAsset from "@/assets/webinar-proof/group-photo-2026.webp.asset.json";

const sidneyPhoto = sidneyPhotoAsset.url;
const williamPhoto = williamPhotoAsset.url;


export const webinarConfig = {
  slug: "agenticbusiness",
  brand: {
    alfred: "alfred ai",
    pop: "PopBusiness",
    contactEmail: "sales@alfredai.bot",
    privacyUrl: "/legal/privacy-policy",
    termsUrl: "#",
    bookingUrl: "https://new.alfredai.bot/book",
  },
  // Placeholders — update with real values
  details: {
    dateLabel: "Coming Soon — Late July 2026",
    timeLabel: "Time to be announced",
    format: "Live Online Webinar",
    duration: "60 Minutes",
    cost: "Free",
    // Used for the .ics calendar file (ISO). Update when scheduled.
    startISO: "2026-07-01T10:00:00+10:00",
    endISO: "2026-07-01T11:00:00+10:00",
    joinUrl: "https://new.alfredai.bot/resources/webinars/agenticbusiness",
  },
  title: "3x the Revenue per Person You Hire",
  subtitle:
    "A practical webinar for SME owners who want every person they hire to generate up to three times the revenue, by equipping their team with the right AI infrastructure.",
  eyebrow: "Free 60-Minute Webinar for SME Owners",
  hero: {
    subheadline:
      "Learn how the right AI infrastructure lets each person you hire produce up to 3x the revenue — capturing leads, following up faster, cutting admin, and scaling operations without adding headcount.",
    trustLine:
      "Hosted by alfred ai and PopBusiness for SME owners, operators, and finance leaders.",
    primaryCta: "Reserve Your Spot",
    secondaryCta: "See the Agenda",
    microcopy:
      "Limited live spots available. Recording access may be provided to registered attendees.",
    workflow: ["Lead Enquiry", "AI Follow-Up", "CRM", "Quote", "Operations", "Reporting"],
  },
  nav: [
    { label: "Why Attend", href: "#why-attend" },
    { label: "Agenda", href: "#agenda" },
    { label: "AI Levels", href: "#ai-levels" },
    { label: "Hosts", href: "#hosts" },
    { label: "FAQ", href: "#faq" },
  ],
  problem: {
    heading:
      "Most SMEs Are Not Losing Money Because They Lack AI. They Are Losing Money Through Leaks.",
    body:
      "Many SME businesses already have demand, customers, staff, tools, and systems. The real problem is that opportunities and time leak through manual workflows.",
    pains: [
      "Leads sitting in the inbox",
      "Slow follow-up after enquiries",
      "Quotes taking too long",
      "CRM not updated",
      "Admin staff overloaded",
      "Business knowledge stuck in the owner's head",
      "Invoices and payments followed up late",
      "Systems that do not talk to each other",
      "No clear weekly view of sales, operations, and cash flow",
    ],
    highlight:
      "This webinar will show you where AI can help first, what to avoid, and how to start with the right level of implementation.",
  },
  audience: {
    heading: "This Webinar Is Built for Practical SME Owners",
    cards: [
      "Business owners with 5 to 100 staff",
      "Operators managing sales, admin, finance, and delivery",
      "Accountants and advisers helping SME clients",
      "Service businesses that rely on enquiries, quotes, bookings, or projects",
      "Businesses using tools like Xero, MYOB, Google Workspace, Microsoft 365, CRM, Dropbox, SharePoint, or job management software",
      "Teams that want AI but need it to be safe, useful, and commercially measurable",
    ],
    notFor:
      "This is not a technical coding webinar. It is a practical business session about how AI can improve real workflows.",
  },
  agenda: {
    heading: "What We'll Cover in 60 Minutes",
    cards: [
      {
        time: "20 Minutes",
        title: "AI for 3x your sales and quality leads",
        description:
          "How SMEs can use AI to capture more opportunities, follow up faster, improve CRM discipline, draft better proposals, and reduce missed sales.",
        bullets: [
          "AI lead capture and qualification",
          "Instant personalised follow-up",
          "CRM updates from calls and emails",
          "Quote and proposal drafting",
          "Lead scoring and stale lead alerts",
          "Turning customer conversations into marketing content",
        ],
      },
      {
        time: "20 Minutes",
        title: "AI for reducing 80% operations/admin effort",
        description:
          "How AI can reduce admin, connect business knowledge, support finance workflows, and give owners better visibility.",
        bullets: [
          "Email triage and admin support",
          "Meeting notes to task creation",
          "SOP and internal knowledge assistant",
          "Finance and invoice workflow support",
          "Reporting and business visibility",
          "Workflow automation across tools",
        ],
      },
      {
        time: "20 Minutes",
        title: "What We Can Do for you immediately and Q&A",
        description:
          "A practical breakdown of how alfred ai and PopBusiness can help SMEs choose the right first AI project and avoid wasting time on random tools.",
        bullets: [
          "AI opportunity review",
          "Sales and lead system",
          "Operations and admin system",
          "AI implementation roadmap",
          "ROI, privacy, governance, and Q&A",
        ],
      },
    ],
    cta: "Reserve Your Free Spot",
  },
  aiLevels: {
    heading: "You Do Not Need to Jump Straight Into Advanced AI Agents",
    subheading:
      "Most SMEs should start simple, prove value, then move up the maturity ladder.",
    levels: [
      {
        level: "Level 1",
        title: "AI Co-Worker",
        tier: "Entry-level implementation",
        examples: "Manus, Claude Cowork, ChatGPT-style assistants",
        useCases: "Writing, research, meeting notes, proposal drafts, document summaries.",
        explanation: "AI helps staff finish daily work faster.",
      },
      {
        level: "Level 2",
        title: "AI Team Workspace",
        tier: "Mid-level implementation",
        examples:
          "Claude Enterprise, shared knowledge base, connectors, locally hosted Hermes/OpenClaw-style assistant, Telegram-based internal assistant.",
        useCases: "Company knowledge search, SOP assistant, team AI workspace, sales/admin support.",
        explanation:
          "AI moves from individual use to team productivity and controlled company knowledge.",
      },
      {
        level: "Level 3",
        title: "AI Agent System",
        tier: "Advanced implementation",
        examples:
          "Virtual-machine-hosted Hermes/OpenClaw-style agents, mixed LLM APIs, custom UI, RBAC, security setup, standard APIs, MCP integrations.",
        useCases: "Lead to CRM, meeting to tasks, invoice reminders, document workflow, customer service assistant.",
        explanation:
          "AI becomes connected to business systems and starts supporting real workflows with human approval.",
      },
      {
        level: "Level 4",
        title: "AI Operating Layer",
        tier: "Mature business implementation",
        examples:
          "AWS or Oracle Cloud, mixed LLMs, custom UI/UX, virtual machines, memory, agentic RAG, RBAC, custom MCP servers, custom APIs, security monitoring.",
        useCases:
          "Business-wide AI command centre, sales and operations visibility, finance intelligence, document control, compliance workflows.",
        explanation:
          "AI becomes secure business infrastructure across sales, finance, operations, and reporting.",
      },
    ],
    note:
      "The right starting point depends on your business size, systems, risk profile, and workflow maturity.",
  },
  beforeAfter: {
    heading: "What Changes When AI Is Implemented Properly?",
    rows: [
      ["Leads are manually checked", "Leads are captured and routed"],
      ["Follow-up depends on memory", "Follow-ups are drafted and triggered"],
      ["Quotes are delayed", "Quote admin is reduced"],
      ["CRM is incomplete", "CRM is updated from calls and emails"],
      ["Staff ask the same questions repeatedly", "Staff can ask an internal AI assistant"],
      ["Admin is spread across email, spreadsheets, and chat", "Tasks are created from documents and meetings"],
      ["Owners have limited visibility", "Owners see key sales and operation signals"],
      ["Reporting is slow", "Reports are faster and more useful"],
    ],
  },
  hosts: {
    heading: "Hosted by AI Implementation and SME Accounting Experts",
    cards: [
      {
        name: "William Zhang",
        title: "Founder & CEO, alfred ai",
        photo: williamPhoto,
        description:
          "Forbes-featured entrepreneur and founder of alfred ai. With a community of over 500,000 followers, William is passionate about SMEs, practicality, business growth, and automation. He leads a world-class tech team building AI systems that improve sales, admin, operations, and reporting for mid-market businesses with measurable ROI.",
      },
      {
        name: "Sidney Cachuela",
        title: "Director, Chartered Accountant, B. Comm, Dip. FP, Registered Tax Agent — PopBusiness",
        photo: sidneyPhoto,
        description:
          "Sidney works closely with SME owners on accounting, finance, business structure, tax, reporting, and advisory. He brings the financial and commercial perspective on where AI can create value and where businesses need better systems.",
      },
    ],
    partnership:
      "Together, alfred ai and PopBusiness connect the technology, workflow, and business finance perspectives SMEs need before adopting AI seriously.",
  },
  proof: {
    heading: "Trusted on Stage by Australia's Business Community",
    subheading:
      "alfred ai is a recognised voice at premier business events, presenting practical AI to hundreds of SME owners, operators, and finance leaders.",
    photos: [
      { src: proofBallroomAsset.url, alt: "Keynote presentation in a full ballroom at a premier business event" },
      { src: proofNetworkingAsset.url, alt: "Business leaders networking at the event" },
      { src: proofGroupAsset.url, alt: "Group photo of attendees at the premier business event" },
    ],
    stats: [
      { value: "500+", label: "Business leaders" },
      { value: "4", label: "Years on the main stage" },
      { value: "100%", label: "Practical, ROI-focused" },
    ],
  },
  leadMagnet: {
    heading: "Register and Receive Your Tailored AI Strategic Plan",
    description:
      "Attendees will receive a tailored Strategic Plan with step-by-step actions, ROI projections, timing, and a practical checklist to start creating value with AI in their business.",
    items: [
      "Step-by-step implementation roadmap",
      "ROI projections for each opportunity",
      "Recommended timing and sequencing",
      "Practical checklist to get started",
      "Data and system readiness questions",
      "First-project selection guide",
    ],
    cta: "Register to Get Your Strategic Plan",
  },
  form: {
    heading: "Reserve Your Free Spot",
    businessSizes: [
      "Solo / 1 person",
      "2–5 staff",
      "6–20 staff",
      "21–50 staff",
      "51–100 staff",
      "100+ staff",
      "Other",
    ],
    turnoverRanges: [
      "Under $250k",
      "$250k – $500k",
      "$500k – $1M",
      "$1M – $2M",
      "$2M – $5M",
      "$5M – $10M",
      "$10M+",
      "Other",
    ],
    countries: [
      "Australia",
      "New Zealand",
      "United States",
      "United Kingdom",
      "Canada",
      "Ireland",
      "Singapore",
      "India",
      "Philippines",
      "South Africa",
      "United Arab Emirates",
      "Other",
    ],
    aiInterests: [
      "Sales and lead follow-up",
      "Admin automation",
      "Finance and accounting workflow",
      "Internal knowledge base",
      "Reporting and visibility",
      "Customer service",
      "Not sure yet",
      "Other",
    ],
    workflows: [
      "Lead Gen",
      "Pre-sales",
      "Sales",
      "After-sales CX",
      "Operations and Admin",
      "Project Management",
      "HR",
      "Billing and Invoicing",
      "Data Management",
      "Agentic RAG",
      "Agentic Mission Control",
      "Voice Agent",
      "Security and RBAC",
      "Other",
    ],
    consentLabel:
      "I agree to receive webinar details, reminders, and follow-up resources from alfred ai and PopBusiness.",
    submit: "Reserve Your Spot",
    success: {
      heading: "You're registered.",
      body: "Check your email for the webinar details and calendar link.",
    },
  },
  credibility: {
    heading: "Built for Real SME Workflows, Not AI Hype",
    cards: [
      "Sales and lead follow-up",
      "Admin and document workflows",
      "Finance and accounting process support",
      "CRM and system integration",
      "Internal knowledge assistants",
      "AI workflow roadmap and implementation",
    ],
    line:
      "alfred ai focuses on practical AI implementation with measurable business outcomes. PopBusiness brings the SME accounting and advisory lens.",
  },
  faq: {
    heading: "Frequently Asked Questions",
    items: [
      {
        q: "Is this webinar technical?",
        a: "No. It is designed for SME owners and operators. We will explain the concepts in plain business language.",
      },
      {
        q: "Do I need to already use AI?",
        a: "No. We will cover simple starting points as well as more advanced implementation levels.",
      },
      {
        q: "Will this be relevant if I already use ChatGPT?",
        a: "Yes. We will explain the difference between using AI casually and building AI into business workflows.",
      },
      {
        q: "Is AI safe for business data?",
        a: "It depends on the tools, settings, permissions, and workflow design. We will cover basic risk, privacy, and governance principles.",
      },
      {
        q: "Can AI connect to tools like Xero, MYOB, Gmail, Outlook, CRM, Dropbox, or SharePoint?",
        a: "In many cases, yes. The right setup depends on your systems, access permissions, and security requirements.",
      },
      {
        q: "Will there be a recording?",
        a: "Registered attendees may receive recording access after the session.",
      },
      {
        q: "Is there a pitch?",
        a: "There will be a short section explaining how alfred ai and PopBusiness can help businesses assess and implement AI, followed by Q&A.",
      },
    ],
  },
  finalCta: {
    heading:
      "Stop Guessing Where AI Fits. Learn Where It Can Actually Help Your Business.",
    body:
      "Join this practical session and walk away with a clearer view of how AI can improve sales, admin, finance, operations, and reporting in your business.",
    cta: "Reserve Your Spot",
    microcopy: "Free to attend. Built for SME owners and operators.",
  },
  crossSellEvents: {
    heading: "Upcoming Events You May Like",
    events: [
      {
        title: "Radius Breakfast Networking Mixer",
        url: "https://events.humanitix.com/radius-breakfast-networking-mixer",
        tag: "Networking",
      },
      {
        title: "June Networking Drinks — Property, Dev & Construction Tech",
        url: "https://events.humanitix.com/june-networking-drinks-property-dev-construction-tech",
        tag: "Industry",
      },
    ],
  },
};

export type WebinarConfig = typeof webinarConfig;
