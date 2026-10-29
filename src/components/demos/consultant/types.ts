// Types for Consultant Decision Support Demo
import { Building2, Activity, Layers, AlertTriangle, Layout, DollarSign, Shield, FileText, LucideIcon } from "lucide-react";

export interface DemoStep {
  id: string;
  title: string;
  icon: LucideIcon;
  description: string;
  duration: number;
}

export interface EngagementContext {
  clientName: string;
  industry: string;
  revenueBand: string;
  engagementTrigger: string;
  insightSource: string;
}

export interface OperationalScore {
  dimension: string;
  score: number;
  justification: string;
  label: string;
}

export interface ConfigComplexity {
  liveOfferings: number;
  customizationDegree: string;
  exceptionFrequency: string;
  pricingClarity: string;
  configOwnership: string;
  handoffQuality: string;
}

export interface DeliveryRisk {
  leadershipAlignment: string;
  politicalSensitivity: string;
  changeFatigue: string;
  timePressure: string;
  ambiguityTolerance: string;
}

export interface EngagementShape {
  type: string;
  rationale: string;
  risksLimited: string;
  delayed: string;
  selected: boolean;
  overrideReason?: string;
}

export interface FeeRange {
  min: number;
  max: number;
  confidence: number;
  drivers: { label: string; amount: number }[];
  creepZones: string[];
  assumptions: string[];
}

export interface ProposalGuardrails {
  inScope: string[];
  outOfScope: string[];
  changeControlTriggers: string[];
  reviewCheckpoints: string[];
  killSwitchConditions: string[];
  confirmed: boolean;
}

export interface ConsultantDemoState {
  engagementContext: EngagementContext;
  operationalScores: OperationalScore[];
  configComplexity: ConfigComplexity;
  deliveryRisk: DeliveryRisk;
  selectedShape: EngagementShape | null;
  feeRange: FeeRange;
  guardrails: ProposalGuardrails;
}

export const DEMO_STEPS: DemoStep[] = [
  { id: "context", title: "Engagement Context", icon: Building2, description: "Client profile & trigger", duration: 3000 },
  { id: "operational", title: "Operational Scan", icon: Activity, description: "Operational reality assessment", duration: 4000 },
  { id: "config", title: "Configuration Complexity", icon: Layers, description: "Product/service complexity", duration: 3500 },
  { id: "risk", title: "Delivery Risk", icon: AlertTriangle, description: "Change & delivery assessment", duration: 3500 },
  { id: "shape", title: "Engagement Shape", icon: Layout, description: "Recommended approach", duration: 3000 },
  { id: "fee", title: "Fee Range", icon: DollarSign, description: "Internal pricing logic", duration: 3000 },
  { id: "guardrails", title: "Proposal Guardrails", icon: Shield, description: "Mandatory safeguards", duration: 3500 },
  { id: "summary", title: "Internal Summary", icon: FileText, description: "Final output", duration: 2500 },
];

export const INDUSTRIES = [
  "Manufacturing",
  "Professional Services",
  "Healthcare",
  "Retail & E-Commerce",
  "Technology",
  "Financial Services",
  "Construction",
  "Logistics & Supply Chain",
];

export const REVENUE_BANDS = [
  "$5M - $10M",
  "$10M - $25M",
  "$25M - $50M",
  "$50M - $100M",
  "$100M+",
];

export const INSIGHT_SOURCES = [
  "Discovery Call",
  "Referral",
  "Crisis Response",
  "Growth Initiative",
  "Board Mandate",
];

export const OPERATIONAL_DIMENSIONS = [
  { key: "processMaturity", label: "Process Definition Maturity", description: "How well-documented and followed are core processes?" },
  { key: "decisionOwnership", label: "Decision Ownership Clarity", description: "Is it clear who owns what decisions?" },
  { key: "dependencyDensity", label: "Cross-Team Dependency Density", description: "How coupled are operations across teams?" },
  { key: "systemFragmentation", label: "System Fragmentation", description: "How many disconnected systems exist?" },
  { key: "dataReliability", label: "Data Reliability", description: "Can you trust the data without manual verification?" },
  { key: "behavioralConsistency", label: "Behavioral Consistency", description: "Do teams follow the same practices?" },
];
