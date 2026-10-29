/**
 * Source of truth for the Investors page figures.
 * Aligned to the alfred ai Pitch Deck — Late Seed Round, Late 2026.
 * All figures AUD unless noted; equity round quoted in USD as per the deck.
 */

export const signedRevenue = [
  { label: "Setup fees signed", value: 336309, prefix: "$", format: "currency" as const },
  { label: "Monthly retainer (recurring)", value: 27825, prefix: "$", format: "currency" as const },
  { label: "Total signed LTV", value: 1004109, prefix: "$", format: "currency" as const, note: "Setup + 24mo retainer" },
  { label: "Deals closed", value: 18, format: "plain" as const },
];

export const marketSizing = [
  {
    tier: "TAM",
    value: "$26B",
    title: "Global construction & professional services software",
    description: "Total addressable software spending across our global target sectors.",
  },
  {
    tier: "SAM",
    value: "$3.5B",
    title: "APAC & GCC construction software",
    description: "Serviceable software market across high-growth regional corridors.",
  },
  {
    tier: "SOM",
    value: "$300M",
    title: "ANZ mid-market construction software",
    description: "Immediate obtainable software spend in our beachhead market.",
  },
];

export const macroTailwind = {
  headline: "The AI infrastructure boom creates a $287B construction tailwind",
  stats: [
    {
      value: "$287.5B",
      label: "Global data centre construction",
      detail: "Market size in 2026, projected to reach $662.7B by 2033 (12.7% CAGR).",
    },
    {
      value: "$10.7M",
      label: "Average cost per MW",
      detail: "Construction cost per megawatt, up from $7.7M in 2020 (7% CAGR).",
    },
    {
      value: "$154B+",
      label: "GCC construction boom",
      detail: "Regional investment driving data centre and infrastructure growth.",
    },
  ],
  advantage:
    "Every hyperscaler data centre requires hundreds of contractors, consultants, and builders to design, manage, and execute. These mid-market firms are exactly alfred ai's ICP — positioning alfred ai as the operating system for the firms building the physical infrastructure of the AI economy.",
};

export const erpComparison = [
  { dimension: "Core function", traditional: "Record & report", alfred: "Decide & act" },
  { dimension: "User interaction", traditional: "Manual data entry", alfred: "Conversational AI + autonomous agents" },
  { dimension: "Data flow", traditional: "Siloed modules", alfred: "Unified, real-time intelligence" },
  { dimension: "Automation", traditional: "Rigid, rule-based workflows", alfred: "Context-aware agentic execution" },
  { dimension: "Adoption", traditional: "Months of training", alfred: "Natural language, immediate value" },
  { dimension: "Intelligence", traditional: "Dashboards & static reports", alfred: "Predictive, proactive recommendations" },
  { dimension: "Customisation", traditional: "Expensive consultants", alfred: "Vibe Coding — self-service OS customisation" },
];

export const vibeCodingSteps = [
  {
    title: "Natural language input",
    description: '"Create a workflow to chase subcontractors for compliance docs every Friday."',
  },
  {
    title: "Vibe Coding engine",
    description: "Translates intent into executable agentic logic instantly.",
  },
  {
    title: "Custom agent generated",
    description: "Autonomous agent configured with rules, triggers, and permissions.",
  },
  {
    title: "Deployed in AOS",
    description: "Live and operating within the unified enterprise environment.",
  },
];

export const competitorLandscape = [
  { company: "Procore", origin: "USA", funding: "Public", revenue: "$950M+", offer: "Legacy project management for enterprise general contractors." },
  { company: "Trunk Tools", origin: "USA", funding: "$30M Series A", revenue: "N/A", offer: "AI agents for schedule/budget tracking. ICP: large contractors." },
  { company: "Higharc", origin: "USA", funding: "$53M Series B", revenue: "$10M+", offer: "Automated homebuilding design. ICP: production builders." },
  { company: "Togal.ai", origin: "USA", funding: "$5M Pre-Series A", revenue: "$2M+", offer: "AI estimating and takeoff. ICP: estimators & contractors." },
  { company: "Buildpass.ai", origin: "AUS", funding: "$7.5M Seed", revenue: "$1M+", offer: "AI site management & compliance. ICP: mid-market builders." },
  { company: "Civils.ai", origin: "SGP", funding: "Seed", revenue: "N/A", offer: "AI search for construction documents. ICP: civil engineers." },
  { company: "Decidr.ai", origin: "AUS", funding: "Seed", revenue: "N/A", offer: "AI agent framework for SMBs. ICP: professional services." },
  { company: "Bobyard", origin: "USA", funding: "Seed", revenue: "N/A", offer: "AI procurement & supply chain. ICP: specialty contractors." },
  { company: "Plangrep", origin: "USA", funding: "Seed", revenue: "N/A", offer: "AI blueprint analysis. ICP: architects & contractors." },
  { company: "PremierCS", origin: "CAN", funding: "Private", revenue: "$15M+", offer: "Legacy construction accounting. ICP: mid-market contractors." },
];

export const revenueModel = [
  {
    title: "Setup fee",
    rate: "0.15% – 0.2% of client revenue",
    description: "Upfront, customer-funded implementation. Covers data ingestion, custom agent training, and system integration.",
  },
  {
    title: "Annual retainer",
    rate: "0.1% – 0.15% of client revenue",
    description: "Recurring SaaS revenue. Access to the core AOS, continuous learning updates, and baseline agentic workflows.",
  },
  {
    title: "Usage meter",
    rate: "Consumption-based",
    description: "Scales with adoption. Additional AI compute credits for heavy workflow automation and complex data processing.",
  },
];

export const pricingExamples = [
  { clientRevenue: "$10M", setup: "$15K – $20K", retainer: "$10K – $15K/yr", ltv: "$45K – $65K" },
  { clientRevenue: "$50M", setup: "$75K – $100K", retainer: "$50K – $75K/yr", ltv: "$225K – $325K" },
  { clientRevenue: "$100M", setup: "$150K – $200K", retainer: "$100K – $150K/yr", ltv: "$450K – $650K" },
  { clientRevenue: "$250M", setup: "$375K – $500K", retainer: "$250K – $375K/yr", ltv: "$1.1M – $1.6M" },
];

export const financialModel = [
  { year: "2026 (Now)", clients: 18, retainer: "$0.33M", setup: "$0.34M", usage: "$0.05M", total: "$0.72M" },
  { year: "2027", clients: 58, retainer: "$1.45M", setup: "$1.20M", usage: "$0.20M", total: "$2.85M" },
  { year: "2028", clients: 178, retainer: "$6.23M", setup: "$3.00M", usage: "$0.80M", total: "$10.03M" },
  { year: "2029", clients: 378, retainer: "$15.12M", setup: "$5.60M", usage: "$1.50M", total: "$22.20M" },
  { year: "2030", clients: 658, retainer: "$27.60M", setup: "$8.40M", usage: "$4.00M", total: "$40.00M" },
  { year: "2031", clients: 1008, retainer: "$45.40M", setup: "$11.20M", usage: "$5.00M", total: "$61.60M" },
];

export const strategicImperative = {
  urgency: [
    {
      title: "Market timing",
      description: "AI adoption in construction is at the inflection point. Early movers establish the data moats and own the category.",
    },
    {
      title: "Proven PMF",
      description: "18 deals closed, $3.4M pipeline, and 95% retention prove the model works. It is time to pour fuel on the fire.",
    },
    {
      title: "Competitive urgency",
      description: "$1B+ has been invested in construction AI globally. The race for the ANZ and APAC mid-market is happening now.",
    },
  ],
  execution: [
    {
      title: "Sales expansion",
      description: "Dominate ANZ, then strategic expansion into Singapore, HK, KSA & GCC, followed by US & Canada.",
    },
    {
      title: "Product depth",
      description: "Accelerate the Vibe Coding engine and build deeper integrations for an undeniably stickier platform.",
    },
    {
      title: "Partnerships",
      description: "Establish channel partners, system integrators, and industry association alliances for scalable distribution.",
    },
    {
      title: "Marketing",
      description: "Drive content-led inbound generation, publish high-impact case studies, and dominate key industry events.",
    },
  ],
};
