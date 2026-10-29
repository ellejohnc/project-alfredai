import { Bot, Eye, LayoutGrid, Handshake } from "lucide-react";
import { OmegaIcon } from "@/components/icons/OmegaIcon";
import { Engine6 } from "@/components/icons/Engine6";
import accountableLinkLogo from "@/assets/logos/accountable-link-icon.png";
import evaIcon from "@/assets/eva-icon.png.asset.json";

export type ProductFeature = {
  title: string;
  description: string;
};

export type ProductDetail = {
  slug: string;
  number: string;
  name: string;
  tagline: string;
  intro: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  accent?: boolean;
  logo?: string;
  outcomes: string[];
  features: ProductFeature[];
  howItWorks: { step: string; title: string; description: string }[];
  externalCta?: { label: string; url: string };
};

export const productDetails: ProductDetail[] = [
  {
    slug: "axiom",
    number: "01",
    name: "Axiom",
    tagline: "Custom AI learning for your business",
    icon: Engine6,
    intro:
      "Machine learning trained on your data, your processes, and your decisions — turning institutional knowledge into models that sharpen the more your business runs.",
    description:
      "Most AI tools are generic. Axiom is yours. We train models on the way your business actually estimates, schedules, and decides — so the intelligence reflects your standards, not a generic average. Every project, every quote, and every outcome becomes training signal that compounds over time.",
    outcomes: [
      "Models that reflect your standards, not industry averages",
      "Institutional knowledge captured before it walks out the door",
      "Accuracy that improves with every project you run",
    ],
    features: [
      { title: "Bespoke model training", description: "Models built on your historical data, documents, and decision patterns." },
      { title: "Learns from your data", description: "Estimates, schedules, and outcomes all become training signal." },
      { title: "Continuously improving", description: "Performance compounds as your business keeps running." },
      { title: "Your data, secured", description: "Trained and deployed within governed, private boundaries." },
    ],
    howItWorks: [
      { step: "01", title: "Capture", description: "We connect to your existing data sources and document history." },
      { step: "02", title: "Train", description: "Models learn your processes, standards, and decision logic." },
      { step: "03", title: "Compound", description: "Every new project makes the model sharper and more accurate." },
    ],
  },
  {
    slug: "omega",
    number: "02",
    name: "Omega",
    tagline: "Your organisation's living intelligence",
    icon: OmegaIcon,
    accent: true,
    intro:
      "Omega — your organisation's living intelligence. Everything your company has learned, available to everyone who needs it.",
    description:
      "The living intelligence layer. Omega holds every workflow, lesson, project insight and decision your company has ever produced — and keeps it alive. It generates the right SOP or playbook for the job at hand, so your team and Butler agents have exactly what they need to act, with your approval on every step that matters. Every staff member feeds it; every staff member draws from it.",
    outcomes: [
      "The right SOP or playbook generated for the job at hand",
      "Knowledge made available to your people and Butler agents, with human approval gates",
      "Traceable decisions — every output tied back to the knowledge that produced it",
    ],
    features: [
      { title: "Generates SOPs & playbooks", description: "Produces the right procedure, checklist or playbook for the situation the business faces." },
      { title: "Makes knowledge usable", description: "Turns what the organisation knows into the right context for people and Butler agents to act." },
      { title: "Human approval gates", description: "Every consequential action passes through a review checkpoint before it runs." },
      { title: "Learns from every project", description: "Closed RFIs, resolved variations and lessons learned all sharpen what Omega knows." },
    ],
    howItWorks: [
      { step: "01", title: "Hold", description: "Omega holds every workflow, lesson and project insight the company has produced." },
      { step: "02", title: "Think", description: "It generates the right SOP, checklist or playbook for the job at hand." },
      { step: "03", title: "Make it available", description: "It makes the work and context available to Butler agents — always with your approval." },
    ],
  },
  {
    slug: "butler",
    number: "03",
    name: "Butler",
    tagline: "AI agents that serve your teams",
    icon: Bot,
    intro:
      "Agentic AI that works alongside your people — handling the repetitive, coordinating the complex, and freeing teams to focus on the work that moves the business forward.",
    description:
      "Butler is your always-on workforce. Agents sit inside your workflows, picking up the repetitive coordination, follow-ups, and data wrangling that quietly drains your team's hours. They scale your output without scaling your headcount — and they never drop a task.",
    outcomes: [
      "Hours of repetitive admin handled automatically every week",
      "More output without adding to payroll",
      "Teams freed to focus on high-value work",
    ],
    features: [
      { title: "Always-on agents", description: "Work continues around the clock, with no dropped tasks." },
      { title: "Embedded in workflows", description: "Agents live inside the tools and processes you already use." },
      { title: "Scales without headcount", description: "Increase capacity without increasing payroll." },
      { title: "Human-in-the-loop", description: "Your team stays in control with approvals where they matter." },
    ],
    howItWorks: [
      { step: "01", title: "Map", description: "We identify the repetitive, coordination-heavy work to offload." },
      { step: "02", title: "Deploy", description: "Agents are embedded into your existing workflows." },
      { step: "03", title: "Scale", description: "Capacity grows as you hand more work to your agents." },
    ],
  },
  {
    slug: "watch",
    number: "04",
    name: "Watch",
    tagline: "Forward intelligence for owners and operators",
    icon: Eye,
    intro:
      "See what's coming before it lands. Watch surfaces forward-looking signals, risks, and opportunities so leadership can act early instead of reacting late.",
    description:
      "Most reporting tells you what already happened. Watch tells you what's about to. It continuously scans your projects, pipeline, and operations for the early signals of risk and opportunity — giving owners and operators the lead time to act decisively.",
    outcomes: [
      "Risks surfaced with lead time to act, not after the fact",
      "Owner-level visibility across the whole business",
      "Decisions made early, when they still change the outcome",
    ],
    features: [
      { title: "Predictive signals", description: "Forward-looking indicators across projects and pipeline." },
      { title: "Owner-level visibility", description: "A single view of what matters across the business." },
      { title: "Early-warning insights", description: "Spot risk and opportunity before competitors do." },
      { title: "Actionable, not noisy", description: "Signals prioritised so leadership acts on what counts." },
    ],
    howItWorks: [
      { step: "01", title: "Connect", description: "Watch ties into your project, financial, and operational data." },
      { step: "02", title: "Detect", description: "Forward signals of risk and opportunity are surfaced early." },
      { step: "03", title: "Act", description: "Leadership intervenes while there's still time to change outcomes." },
    ],
  },

  {
    slug: "aos",
    number: "05",
    name: "AOS",
    tagline: "The Agentic Operating System for your business",
    icon: LayoutGrid,
    accent: true,
    logo: accountableLinkLogo,
    intro:
      "AOS is the Agentic Operating System that connects your people, workflows, and tools into one place. It links the software you already use, automates routine tasks, tracks ownership, and gives your business clearer visibility and control.",
    description:
      "AOS brings your team, tools, and daily work together. It connects the software you already rely on, automates routine tasks, tracks who owns what, and gives your business clearer visibility and control — with the governance and accountability leadership needs.",
    outcomes: [
      "One operating system connecting your team, tools, and daily work",
      "Enterprise-grade governance and accountability built in",
      "Industry verticals built for how your business actually runs",
    ],
    features: [
      { title: "Connects your tools", description: "Links CRM, email, accounting, projects, documents, and calendars." },
      { title: "Automates routine work", description: "Tasks, follow-ups, approvals, and handoffs run on autopilot." },
      { title: "Tracks ownership", description: "Know who owns what, what's overdue, and what needs approval." },
      { title: "Governance & audit", description: "Full audit trails for compliance and accountability." },
      { title: "Industry verticals", description: "Built for construction and contracting workflows." },
      { title: "Access controls", description: "Role-based permissions across every layer of the suite." },
    ],
    howItWorks: [
      { step: "01", title: "Unify", description: "Axiom, Omega, Butler, and Watch operate as one system." },
      { step: "02", title: "Govern", description: "Secure deployment, monitoring, and audit wrap every layer." },
      { step: "03", title: "Operate", description: "Your teams run accountable work, day in and day out." },
    ],
    externalCta: { label: "Explore Accountable.link", url: "https://www.accountable.link" },
  },
  {
    slug: "eva",
    number: "",
    name: "EVA",
    tagline: "Secure personal AI inside enterprise work",
    icon: Handshake,
    logo: evaIcon.url,
    intro:
      "An AI security guard that lets employees and contractors use the power of their personal AI without exposing enterprise data or injecting private personal memory into company workflows.",
    description:
      "EVA stands guard between enterprise AI and personal AI, checking both directions before any information crosses. It prevents confidential enterprise data from leaking out, and prevents private personal AI memory, opinions, and history from entering company workflows. Enterprise data stays enterprise. Personal data stays personal. Only approved, work-relevant intelligence is allowed through.",
    outcomes: [
      "Personal AI productivity with enterprise-grade control",
      "Confidential enterprise data never reaches personal AI accounts",
      "Private personal memory never enters company workflows",
    ],
    features: [
      { title: "Two-way security guard", description: "Controls both directions of AI collaboration — outbound and inbound." },
      { title: "DLP and redaction", description: "Detects and masks client names, project details, amounts, and personal identifiers." },
      { title: "Personal data firewall", description: "Blocks private chat history, opinions, and confidential third-party data." },
      { title: "Human approval both ways", description: "Approval required before anything passes the guard in either direction." },
      { title: "Critical secret blocking", description: "Automatically blocks passwords, API keys, tokens, and credentials." },
      { title: "Enterprise-only mode & audit", description: "Keep sensitive work fully internal, with every exchange logged." },
    ],
    howItWorks: [
      { step: "01", title: "Detect", description: "EVA scans each request and classifies sensitive enterprise data before sharing." },
      { step: "02", title: "Approve", description: "EVA shows what will pass through; humans approve, edit, or reject both ways." },
      { step: "03", title: "Log", description: "Every detection, redaction, approval, and block is recorded for full auditability." },
    ],
  },
];



export const getProductBySlug = (slug?: string) =>
  productDetails.find((p) => p.slug === slug);

// Compact showcase used by the Investors page product grid.
export const productShowcase = productDetails.map((p) => ({
  icon: p.icon,
  title: p.name,
  description: p.tagline,
  tag: p.accent ? "Platform" : "Core",
}));
