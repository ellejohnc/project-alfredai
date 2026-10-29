import { Ruler, LayoutGrid, Sparkles, Smartphone, FileCheck2, Users, Building2, Plug, Wand2, Phone } from "lucide-react";
import type { ProductDetail } from "@/data/products";

/**
 * The Products line-up — what clients buy and use. Built on the core
 * technology (Axiom, Omega, Butler, Watch, AOS — "Our Infrastructure").
 * Each entry renders at /products/<slug> through ProductDetailPage, except
 * where `href` points at a page that already exists.
 */
export type PlatformProduct = ProductDetail & {
  badge?: string;
  /** Use an existing dedicated page instead of the generic product page. */
  href?: string;
};

export const platformProducts: PlatformProduct[] = [
  {
    slug: "ai-takeoff",
    href: "/solutions/ai-takeoff",
    number: "",
    name: "AI Take-Off",
    badge: "Flagship",
    tagline: "Drawings to quantities in hours, not days",
    icon: Ruler,
    accent: true,
    intro: "Our flagship AI agent reads your drawing set and returns measured quantities your estimators check and approve.",
    description: "AI Take-Off measures across a full drawing set, flags anything ambiguous, missing or contradicting, and hands your estimators a take-off ready to review.",
    outcomes: ["Faster take-offs", "More tenders with the same team", "Every item reviewable"],
    features: [],
    howItWorks: [],
  },
  {
    slug: "accountable",
    number: "",
    name: "Accountable",
    tagline: "CRM, CMS and AOS in one accountable platform",
    icon: LayoutGrid,
    intro: "Accountable brings your CRM, your content and your operating system into one place, so every client, page and task has an owner.",
    description: "Accountable is the platform your team works in every day. The CRM tracks every client and deal, the CMS runs your website and content, and AOS connects the tools you already use and keeps track of who owns what. Every entry is AI-assisted and the next admin step is ready before you ask for it.",
    outcomes: ["One place for clients, content and operations", "Clear ownership on every task and deal", "Less admin, with AI-assisted entry everywhere"],
    features: [
      { title: "CRM", description: "Contacts, deals, pipelines and follow-ups with AI-assisted entry." },
      { title: "CMS", description: "Run your website, pages and content without a developer." },
      { title: "AOS", description: "The agentic operating system that connects your tools and teams." },
      { title: "Accounts triage", description: "Bills and invoices sorted and coded, ready for Xero or MYOB." },
    ],
    howItWorks: [
      { step: "01", title: "Connect", description: "We link your email, accounting, storage and existing tools." },
      { step: "02", title: "Configure", description: "We set up your pipelines, content and workflows for you." },
      { step: "03", title: "Run", description: "Your team works in one place, with ownership tracked." },
    ],
    externalCta: { label: "Explore Accountable.link", url: "https://www.accountable.link" },
  },
  {
    slug: "alfred-assist",
    number: "",
    name: "alfred Assist",
    badge: "Self-improving",
    tagline: "An assistant that gets better every time you use it",
    icon: Sparkles,
    intro: "alfred Assist answers questions and does the work — scheduled jobs, workflows, apps, invoices, reports and compliance documents — and learns from every correction so it keeps getting sharper.",
    description: "alfred Assist sits alongside your team in the tools they already use. It runs scheduled work, builds workflows and mini-apps, keeps your ledger and invoices moving, and turns voice notes, photos and files into clean data entries, reports, ITPs, SWMS, SOPs, ISO policies and contracts. When someone corrects it or approves an answer, it remembers — so the same mistake isn't made twice and answers reflect how your business really works.",
    outcomes: ["Answers grounded in your own knowledge", "Recurring work runs itself on schedule", "Learns from every correction", "Fewer repeated questions to senior staff"],
    features: [
      { title: "Scheduled work", description: "Set a job once and it runs on time, every time — no one remembering to kick it off." },
      { title: "Creates workflows", description: "Build multi-step processes that move work between people and systems automatically." },
      { title: "Creates apps", description: "Need a small tool, form or tracker? Ask and it is built into your system." },
      { title: "Updates the ledger", description: "Keeps your books current — entries coded and ready for Xero or MYOB." },
      { title: "Creates invoices", description: "Drafts and issues invoices from your project data, ready for approval." },
      { title: "Data entry, any input", description: "Voice notes, photos and files become clean, structured records in your system." },
      { title: "Generates reports", description: "Progress, financial and operational reports assembled from your live data." },
      { title: "ITPs and SWMS", description: "Inspection and test plans and safe work method statements drafted to your standards." },
      { title: "SOPs and ISO policies", description: "Standard operating procedures and ISO-aligned policy documents, kept consistent." },
      { title: "Contracts", description: "First drafts of contracts and agreements, checked against your terms." },
      { title: "Self-improving", description: "Corrections and approvals become lessons it keeps." },
      { title: "Knows your business", description: "Draws on your documents, projects and past decisions." },
      { title: "You stay in control", description: "Anything important waits for a person to approve." },
    ],
    howItWorks: [
      { step: "01", title: "Ask", description: "Your team asks in plain English, by text or voice." },
      { step: "02", title: "Act", description: "alfred Assist does the work — or schedules it to run on its own." },
      { step: "03", title: "Improve", description: "Feedback is captured so the next answer is better." },
    ],
  },
  {
    slug: "boto",
    number: "",
    name: "BOTO",
    badge: "iOS app",
    tagline: "B2B matchmaking in your pocket",
    icon: Smartphone,
    intro: "BOTO is our iOS app for B2B matchmaking — connecting you with the right partners, subcontractors and opportunities.",
    description: "Scan a business card, research a company, find the right match and send a warm introduction — all from your phone. BOTO does the research and drafts the outreach so you spend your time on the conversations that matter.",
    outcomes: ["Better-matched partners and subcontractors", "Research done before the meeting", "Introductions drafted for you"],
    features: [
      { title: "Card scan", description: "Turn a business card into a researched contact in seconds." },
      { title: "Company research", description: "Know who they are and what they need before you call." },
      { title: "AI matchmaking", description: "Find the businesses most likely to be a good fit." },
      { title: "Outreach campaigns", description: "Draft and send introductions and follow-ups." },
    ],
    howItWorks: [
      { step: "01", title: "Capture", description: "Scan a card or add a company." },
      { step: "02", title: "Match", description: "BOTO researches and suggests the best fits." },
      { step: "03", title: "Introduce", description: "Send a drafted intro and track the reply." },
    ],
  },
  {
    slug: "alfred-bid",
    number: "",
    name: "alfredBID",
    tagline: "The full bid operating system",
    icon: FileCheck2,
    intro: "alfredBID runs the whole bid — from finding the tender to submitting it — so your team spends less time on paperwork and more on winning.",
    description: "Most bid tools only help you write. alfredBID manages the full bidding lifecycle: tender discovery, AI drafting, CV matching and rewriting, and take-off, all in one place for construction and professional services firms.",
    outcomes: ["Bids from weeks to hours", "Every tender response consistent", "CVs matched to each tender"],
    features: [
      { title: "Tender discovery", description: "Find the tenders worth bidding on." },
      { title: "AI drafting", description: "Responses drafted from your past bids and knowledge." },
      { title: "CV matching", description: "The right people, with CVs rewritten for each tender." },
      { title: "Take-off built in", description: "Quantities from drawings, ready for pricing." },
    ],
    howItWorks: [
      { step: "01", title: "Discover", description: "Relevant tenders are found and qualified." },
      { step: "02", title: "Draft", description: "alfredBID prepares the response and team CVs." },
      { step: "03", title: "Submit", description: "Your team reviews, approves and submits." },
    ],
  },
  {
    slug: "alfred-hub",
    number: "",
    name: "alfredHUB",
    badge: "Beta",
    tagline: "The operating system for associations and member bodies",
    icon: Users,
    intro: "alfredHUB runs your association — members, events, committees and sponsors — in one place instead of a dozen tools.",
    description: "Built for business associations, professional bodies, chambers of commerce and charities. alfredHUB replaces scattered event, email and CRM tools with one system, and uses AI to match members, run AGMs and committees, and lift engagement and renewals.",
    outcomes: ["One system instead of many tools", "Higher member engagement and renewals", "Events and committees with less admin"],
    features: [
      { title: "Member matchmaking", description: "AI introductions between members who should meet." },
      { title: "AGM and committees", description: "Agendas, minutes and actions handled for you." },
      { title: "Events and seating", description: "Registrations, seating and sponsors in one place." },
      { title: "Connected", description: "Works with your email, Xero or MYOB and cloud storage." },
    ],
    howItWorks: [
      { step: "01", title: "Move in", description: "We bring your members, events and data across." },
      { step: "02", title: "Automate", description: "Routine admin runs itself, with approvals." },
      { step: "03", title: "Grow", description: "See engagement and act before renewals slip." },
    ],
  },
  {
    slug: "portal-strata",
    number: "",
    name: "Portal Strata",
    badge: "Beta",
    tagline: "The operating system for strata and building management",
    icon: Building2,
    intro: "Portal Strata brings every building, compliance task and owner request into one place, with AI assistants doing the routine work.",
    description: "Portal Strata is built in four connected layers: a portfolio command centre across your buildings, specialist AI assistants for governance, maintenance, finance and community, automation for recurring work like AGM packs and work orders, and insights across your whole portfolio.",
    outcomes: ["Less admin per building", "Compliance tracked across the portfolio", "Owners and committees kept informed"],
    features: [
      { title: "Portfolio command centre", description: "Every building and compliance date at a glance." },
      { title: "Specialist AI assistants", description: "Governance, maintenance, finance and community." },
      { title: "Automated workflows", description: "AGM packs, work orders and notices handled for you." },
      { title: "Portfolio insights", description: "Compare buildings and spot issues early." },
    ],
    howItWorks: [
      { step: "01", title: "Onboard", description: "We load your buildings, owners and records." },
      { step: "02", title: "Assign", description: "AI assistants take on the routine work." },
      { step: "03", title: "Oversee", description: "You approve, track and report from one place." },
    ],
  },
  {
    slug: "alfred-mcp",
    number: "",
    name: "alfred MCP",
    tagline: "Work in alfred ai from the AI tools you already use",
    icon: Plug,
    intro: "alfred MCP connects Claude, ChatGPT, Manus and Accountable to your live alfred ai data — so one prompt can do a job that used to span several tools.",
    description: "Once connected, your AI assistant can find, create and update work in alfred ai on your behalf. It runs as you: it only ever sees and does what you can, and every action lands in your audit trail. Pair it with the other tools your assistant already connects to — email, calendar, accounts, spreadsheets — and jobs that took five tabs become a single request.",
    outcomes: ["Works with Claude, ChatGPT, Manus and Accountable", "Runs as you — your permissions carry across", "Every action logged in your audit trail", "One prompt instead of five tools"],
    features: [
      { title: "Claude", description: "Add alfred MCP as a connector and ask Claude to work with your projects." },
      { title: "ChatGPT", description: "Connect alfred ai and let ChatGPT pull, draft and update from live data." },
      { title: "Manus", description: "Give Manus agents governed access to run multi-step jobs across alfred ai." },
      { title: "Accountable", description: "Your CRM, CMS and AOS talk to alfred ai natively through the same connection." },
      { title: "Find what you need", description: "Pull up a take-off, tender, register or drawing without opening alfred ai." },
      { title: "Keep records up to date", description: "Log a variation, update a register or close out an item from a prompt." },
      { title: "Get the reporting done", description: "Draft a client update or site report from your live project data." },
      { title: "Stay compliant", description: "Generate an ITP or SWMS and send it to the crew that needs it." },
      { title: "Send client updates", description: "e.g. \"Pull this week's progress from alfred ai and draft the client email.\"" },
      { title: "Check subbies before you pay", description: "e.g. \"Flag every subbie on the aged payables list with expired insurance.\"" },
      { title: "Your permissions, always", description: "It signs in as you, so it can't see or do anything you can't." },
      { title: "Audit trail", description: "Every request and action is recorded against your name." },
    ],
    howItWorks: [
      { step: "01", title: "Open AI connections", description: "In alfred ai settings, choose Claude, ChatGPT, Manus or Accountable and follow the steps." },
      { step: "02", title: "Authorise in your browser", description: "Sign in to alfred ai to connect. It runs as you, with your permissions and audit trail." },
      { step: "03", title: "Ask for the work", description: "Prompt your assistant and it works with your live alfred ai data." },
    ],
  },
  {
    slug: "vibe-coding-studio",
    number: "",
    name: "Vibe-coding Studio",
    tagline: "Talk to it. Your software changes.",
    icon: Wand2,
    accent: true,
    intro: "Shape your own software by describing what you need in plain English, and change it again as your operations grow.",
    description: "Vibe-coding Studio is how AOS changes with you. Say what you need — a new field, an approval step, a report, a form — and the Studio builds it into your system. No tickets, no waiting for a developer, and every change is reviewed before it goes live.",
    outcomes: ["Software that fits how you work", "Changes in minutes, not months", "Every change reviewed before it goes live"],
    features: [
      { title: "Plain-English changes", description: "Describe it the way you'd tell a colleague." },
      { title: "Forms, fields and approvals", description: "Add what your process needs, when it needs it." },
      { title: "Reports and dashboards", description: "Ask for the view you want and get it." },
      { title: "Safe by design", description: "Preview, approve and roll back any change." },
    ],
    howItWorks: [
      { step: "01", title: "Say it", description: "Describe the change you need." },
      { step: "02", title: "Preview", description: "See it working before anyone else does." },
      { step: "03", title: "Go live", description: "Approve it and your team has it straight away." },
    ],
    externalCta: { label: "See it in AOS", url: "/products/aos" },
  },
  {
    slug: "voice-agent",
    number: "",
    name: "Voice Agent",
    tagline: "AI that answers, books and follows up by phone",
    icon: Phone,
    intro: "Voice Agent picks up calls, answers questions, books appointments and logs every conversation, day or night.",
    description: "Voice Agent handles inbound and outbound calls in a natural voice. It answers common questions, qualifies enquiries, books meetings and sends a summary to your team, so no call goes unanswered.",
    outcomes: ["No missed calls", "Enquiries qualified and booked", "Every call summarised"],
    features: [
      { title: "Inbound calls", description: "Answers, qualifies and routes calls 24/7." },
      { title: "Outbound follow-up", description: "Reminders and follow-up calls made for you." },
      { title: "Bookings", description: "Books straight into your calendar." },
      { title: "Summaries", description: "Every call logged to your CRM with notes." },
    ],
    howItWorks: [
      { step: "01", title: "Train", description: "We teach it your business, FAQs and rules." },
      { step: "02", title: "Answer", description: "It takes calls and books meetings." },
      { step: "03", title: "Hand over", description: "Your team gets a summary and the next step." },
    ],
  },
];

export const platformProductHref = (p: PlatformProduct) => p.href ?? `/products/${p.slug}`;

export const getPlatformProduct = (slug?: string) =>
  platformProducts.find((p) => p.slug === slug && !p.href);

