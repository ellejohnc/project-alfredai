// Pre-populated demo data for Consultant Decision Support Demo

import type { 
  EngagementContext, 
  OperationalScore, 
  ConfigComplexity, 
  DeliveryRisk, 
  EngagementShape,
  FeeRange,
  ProposalGuardrails
} from "./types";

// Randomization options for Engagement Context
const CLIENT_NAMES = [
  "Meridian Manufacturing",
  "Apex Logistics Group",
  "Summit Healthcare Partners",
  "Catalyst Retail Solutions",
  "Horizon Tech Services",
  "Pinnacle Construction Co",
  "Vanguard Financial Advisors",
  "Atlas Distribution Networks",
  "Stellar Hospitality Group",
  "Forge Industrial Systems",
];

const INDUSTRIES = [
  "Manufacturing",
  "Professional Services",
  "Healthcare",
  "Retail & E-commerce",
  "Technology",
  "Construction",
  "Financial Services",
  "Logistics & Distribution",
  "Hospitality",
  "Industrial Equipment",
];

const REVENUE_BANDS = [
  "$5M - $10M",
  "$10M - $25M",
  "$25M - $50M",
  "$50M - $100M",
  "$100M - $300M",
];

const ENGAGEMENT_TRIGGERS = [
  "Operational bottlenecks during expansion into new markets. Current processes breaking under volume.",
  "Post-acquisition integration challenges. Two operational models need harmonization.",
  "New competitor disruption forcing rapid digital transformation and process overhaul.",
  "Founder transition to professional management. Need scalable systems and governance.",
  "Margin compression requiring cost structure redesign without headcount reduction.",
  "Customer complaints escalating due to delivery inconsistency across locations.",
  "Failed ERP implementation left gaps. Manual workarounds now embedded in culture.",
  "Private equity pressure for operational improvements before next funding round.",
  "Rapid growth outpaced internal capabilities. Team overwhelmed and firefighting.",
  "Regulatory changes requiring process documentation and compliance overhaul.",
];

const INSIGHT_SOURCES = [
  "Discovery Call",
  "Referral",
  "Crisis Response",
  "Growth Initiative",
  "Board Request",
];

// Helper function to get random item from array
const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Helper function to get random number in range
const getRandomInt = (min: number, max: number): number => 
  Math.floor(Math.random() * (max - min + 1)) + min;

// Generate randomized engagement context
export const generateRandomEngagementContext = (): EngagementContext => ({
  clientName: getRandomItem(CLIENT_NAMES),
  industry: getRandomItem(INDUSTRIES),
  revenueBand: getRandomItem(REVENUE_BANDS),
  engagementTrigger: getRandomItem(ENGAGEMENT_TRIGGERS),
  insightSource: getRandomItem(INSIGHT_SOURCES),
});

// Justification options for operational scores
const JUSTIFICATION_OPTIONS: Record<string, string[]> = {
  processMaturity: [
    "Some SOPs exist but inconsistently followed across shifts",
    "Well-documented processes but outdated and rarely referenced",
    "Strong process culture with regular reviews and updates",
    "Ad hoc approaches dominate, tribal knowledge rules",
    "Processes exist on paper but reality differs significantly",
  ],
  decisionOwnership: [
    "Multiple approvers for basic decisions, slow escalation paths",
    "Clear ownership but frequent escalation to leadership",
    "Decision rights well-defined and generally respected",
    "Unclear who owns what, decisions made by loudest voice",
    "Matrix structure creates confusion on accountability",
  ],
  dependencyDensity: [
    "Operations, sales, and finance highly coupled - changes ripple",
    "Relatively siloed teams with minimal cross-dependencies",
    "Complex value chain with 5+ handoff points per workflow",
    "Moderate coupling with clear interfaces between teams",
    "Everything requires everyone; no change happens in isolation",
  ],
  systemFragmentation: [
    "Legacy ERP + 5 point solutions, manual data reconciliation",
    "Single core system with some satellite applications",
    "Heavily fragmented - 10+ disconnected tools in daily use",
    "Modern stack but poor integration between platforms",
    "Spreadsheet culture fills gaps between systems",
  ],
  dataReliability: [
    "Weekly manual reconciliation required, conflicting reports",
    "Single source of truth for most metrics, minor gaps",
    "Critical business data requires validation before use",
    "Automated data pipelines but quality controls lacking",
    "Different teams cite different numbers for same metrics",
  ],
  behavioralConsistency: [
    "High variance between shifts and team leads",
    "Generally consistent with some regional variations",
    "Strong culture of standardization, minimal variance",
    "New hires learn 'the real way' from tenured staff",
    "Consistency depends heavily on individual manager",
  ],
};

// Generate randomized operational scores
export const generateRandomOperationalScores = (): OperationalScore[] => [
  { 
    dimension: "processMaturity", 
    score: getRandomInt(1, 5), 
    justification: getRandomItem(JUSTIFICATION_OPTIONS.processMaturity), 
    label: "Process Definition Maturity" 
  },
  { 
    dimension: "decisionOwnership", 
    score: getRandomInt(1, 5), 
    justification: getRandomItem(JUSTIFICATION_OPTIONS.decisionOwnership), 
    label: "Decision Ownership Clarity" 
  },
  { 
    dimension: "dependencyDensity", 
    score: getRandomInt(1, 5), 
    justification: getRandomItem(JUSTIFICATION_OPTIONS.dependencyDensity), 
    label: "Cross-Team Dependency Density" 
  },
  { 
    dimension: "systemFragmentation", 
    score: getRandomInt(1, 5), 
    justification: getRandomItem(JUSTIFICATION_OPTIONS.systemFragmentation), 
    label: "System Fragmentation" 
  },
  { 
    dimension: "dataReliability", 
    score: getRandomInt(1, 5), 
    justification: getRandomItem(JUSTIFICATION_OPTIONS.dataReliability), 
    label: "Data Reliability" 
  },
  { 
    dimension: "behavioralConsistency", 
    score: getRandomInt(1, 5), 
    justification: getRandomItem(JUSTIFICATION_OPTIONS.behavioralConsistency), 
    label: "Behavioral Consistency" 
  },
];

// Delivery risk options
const LEADERSHIP_ALIGNMENT_OPTIONS = ["Unified", "Mostly aligned", "Mixed signals", "Conflicting"];
const POLITICAL_SENSITIVITY_OPTIONS = ["Low", "Moderate", "High", "Minefield"];
const CHANGE_FATIGUE_OPTIONS = ["Fresh", "Some fatigue", "Fatigued", "Exhausted"];
const TIME_PRESSURE_OPTIONS = ["Realistic", "Optimistic", "Unrealistic", "Crisis-mode"];
const AMBIGUITY_TOLERANCE_OPTIONS = ["Comfortable", "Tolerant", "Resistant", "Intolerant"];

// Generate randomized delivery risk
export const generateRandomDeliveryRisk = (): DeliveryRisk => ({
  leadershipAlignment: getRandomItem(LEADERSHIP_ALIGNMENT_OPTIONS),
  politicalSensitivity: getRandomItem(POLITICAL_SENSITIVITY_OPTIONS),
  changeFatigue: getRandomItem(CHANGE_FATIGUE_OPTIONS),
  timePressure: getRandomItem(TIME_PRESSURE_OPTIONS),
  ambiguityTolerance: getRandomItem(AMBIGUITY_TOLERANCE_OPTIONS),
});

// Config complexity options
const CUSTOMIZATION_DEGREES = ["Low", "Medium", "High", "Extreme"];
const EXCEPTION_FREQUENCIES = ["Rare", "Occasional", "Frequent", "Constant"];
const PRICING_CLARITIES = ["Clear rules", "Some exceptions", "Case-by-case", "Chaotic"];
const CONFIG_OWNERSHIPS = ["Single owner", "Committee", "Ad hoc"];
const HANDOFF_QUALITIES = ["Seamless", "Minor gaps", "Significant gaps", "Broken"];

// Generate randomized config complexity
export const generateRandomConfigComplexity = (): ConfigComplexity => ({
  liveOfferings: getRandomInt(5, 50),
  customizationDegree: getRandomItem(CUSTOMIZATION_DEGREES),
  exceptionFrequency: getRandomItem(EXCEPTION_FREQUENCIES),
  pricingClarity: getRandomItem(PRICING_CLARITIES),
  configOwnership: getRandomItem(CONFIG_OWNERSHIPS),
  handoffQuality: getRandomItem(HANDOFF_QUALITIES),
});

// Generate randomized fee range based on complexity
export const generateRandomFeeRange = (): FeeRange => {
  const baseMin = getRandomInt(25, 60) * 1000;
  const baseMax = baseMin + getRandomInt(15, 35) * 1000;
  
  return {
    min: baseMin,
    max: baseMax,
    confidence: getRandomInt(55, 85),
    drivers: [
      { label: "System fragmentation complexity", amount: getRandomInt(8, 18) * 1000 },
      { label: "Change fatigue buffer", amount: getRandomInt(4, 12) * 1000 },
      { label: "Cross-team coordination overhead", amount: getRandomInt(3, 10) * 1000 },
      { label: "Discovery loop allowance", amount: getRandomInt(2, 8) * 1000 },
      { label: "Data reliability remediation", amount: getRandomInt(3, 9) * 1000 },
    ],
    creepZones: [
      "Integration between legacy ERP and point solutions",
      "Stakeholder alignment meetings (political sensitivity)",
      "Process documentation for behavioral consistency",
      "Exception handling standardization",
    ],
    assumptions: [
      "Leadership maintains alignment throughout engagement",
      "Access to key systems for analysis phase",
      "Dedicated client sponsor with authority",
      "Data extraction support from IT within 2 weeks",
      "No major organizational restructure during engagement",
    ],
  };
};

// Calculate risk classification from delivery risk data
export const calculateRiskClassification = (risk: DeliveryRisk): "GREEN" | "AMBER" | "RED" => {
  let riskScore = 0;
  
  if (["Mixed signals", "Conflicting"].includes(risk.leadershipAlignment)) riskScore += 2;
  else if (risk.leadershipAlignment === "Mostly aligned") riskScore += 1;
  
  if (["High", "Minefield"].includes(risk.politicalSensitivity)) riskScore += 2;
  else if (risk.politicalSensitivity === "Moderate") riskScore += 1;
  
  if (["Fatigued", "Exhausted"].includes(risk.changeFatigue)) riskScore += 2;
  else if (risk.changeFatigue === "Some fatigue") riskScore += 1;
  
  if (["Unrealistic", "Crisis-mode"].includes(risk.timePressure)) riskScore += 2;
  else if (risk.timePressure === "Optimistic") riskScore += 1;
  
  if (["Resistant", "Intolerant"].includes(risk.ambiguityTolerance)) riskScore += 2;
  else if (risk.ambiguityTolerance === "Tolerant") riskScore += 1;
  
  if (riskScore >= 7) return "RED";
  if (riskScore >= 4) return "AMBER";
  return "GREEN";
};

// Default demo data (used as fallback)
export const DEMO_ENGAGEMENT_CONTEXT: EngagementContext = generateRandomEngagementContext();
export const DEMO_OPERATIONAL_SCORES: OperationalScore[] = generateRandomOperationalScores();
export const DEMO_CONFIG_COMPLEXITY: ConfigComplexity = generateRandomConfigComplexity();
export const DEMO_DELIVERY_RISK: DeliveryRisk = generateRandomDeliveryRisk();
export const DEMO_FEE_RANGE: FeeRange = generateRandomFeeRange();

export const DEMO_ENGAGEMENT_SHAPES: EngagementShape[] = [
  {
    type: "Diagnostic Only",
    rationale: "Protect discovery investment before committing to full scope",
    risksLimited: "Full commitment before operational clarity achieved",
    delayed: "Implementation decisions until diagnostic complete",
    selected: false,
  },
  {
    type: "Phased Engagement",
    rationale: "De-risk with stage gates. High dependency density + system fragmentation = implementation risk",
    risksLimited: "Scope lock-in on uncertain terrain. Each phase informs the next.",
    delayed: "Later phase details until Phase 1 learnings captured",
    selected: true,
  },
  {
    type: "Pilot First",
    rationale: "Prove value on a single line or process before organization-wide",
    risksLimited: "Organization-wide rollout risk. Change fatigue makes big-bang risky.",
    delayed: "Full transformation scope. Prove before scale.",
    selected: false,
  },
  {
    type: "Full Redesign with Guardrails",
    rationale: "Comprehensive change with built-in review gates",
    risksLimited: "Scope creep via mandatory checkpoints",
    delayed: "Nothing - but requires strong sponsor coverage",
    selected: false,
  },
  {
    type: "Retainer with Scope Gates",
    rationale: "Flexible capacity model for evolving needs",
    risksLimited: "Over-commitment to undefined work",
    delayed: "Specific deliverables until each gate",
    selected: false,
  },
];

export const DEMO_GUARDRAILS: ProposalGuardrails = {
  inScope: [
    "Operations process mapping and gap analysis",
    "System integration requirements assessment", 
    "Decision ownership matrix development",
    "Phased implementation roadmap",
  ],
  outOfScope: [
    "IT system implementation or coding",
    "HR restructuring or role elimination",
    "Financial system changes",
    "Vendor selection or procurement",
  ],
  changeControlTriggers: [
    "Scope addition requiring > 20% additional effort",
    "New stakeholder groups requiring engagement",
    "System access issues blocking analysis",
    "Discovery of undocumented critical dependencies",
  ],
  reviewCheckpoints: [
    "Week 2: Discovery findings review",
    "Week 4: Draft recommendations presentation",
    "Week 6: Implementation roadmap sign-off",
    "Week 8: Final deliverables handover",
  ],
  killSwitchConditions: [
    "Sponsor loss without replacement within 5 days",
    "Leadership alignment drops to 'Conflicting'",
    "Critical data access denied for > 2 weeks",
    "Scope additions exceed 40% of original",
  ],
  confirmed: false,
};

export const AI_COMMENTARY = {
  context: "Mid-market manufacturing in expansion mode. Historical pattern: these engagements surface 2-3x the complexity initially visible. Risk posture: moderate-to-high. Recommend building discovery buffer.",
  
  operational: {
    overall: "High operational entropy (62%). This profile typically leads to scope creep during implementation. The combination of low decision ownership and high dependency density creates approval bottlenecks that extend timelines.",
    contradiction: null,
    warning: "System fragmentation + low data reliability = significant discovery overhead. Build buffer for data reconciliation work.",
  },
  
  config: {
    hotspots: ["Pricing logic is case-by-case with 23 offerings - configuration debt is high", "Sales-to-delivery handoff gaps will surface during implementation"],
    marginRisk: "High customization + frequent exceptions = margin leakage through unpriced work",
    resistance: "Exception culture will resist standardization. Change management required.",
  },
  
  risk: {
    classification: "AMBER" as const,
    message: "High ambition + resistant ambiguity tolerance + optimistic timeline = delivery risk. The organization wants change but may not tolerate the discomfort required to get there.",
    constraints: ["Build explicit change tolerance into SOW", "Require sponsor coverage for difficult conversations", "Front-load stakeholder alignment work"],
  },
  
  shape: "Phased Engagement recommended based on: high dependency density, system fragmentation, and resistant ambiguity tolerance. This shape protects both parties by creating natural validation points before committing to later phases.",
  
  fee: "Fee range reflects operational complexity, not hours. Key drivers: system fragmentation (+$12k), change fatigue buffer (+$8k), cross-team coordination (+$6k). Scope creep most likely in integration and exception handling areas.",
  
  summary: "This engagement has solid fundamentals but carries execution risk. The client wants transformation but the organization may resist the disruption required. Phased approach protects delivery quality and margin. Key success factor: sponsor strength and sustained leadership alignment.",
};
