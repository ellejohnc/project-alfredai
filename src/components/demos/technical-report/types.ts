import { LucideIcon } from "lucide-react";

export interface DataSource {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
  selected: boolean;
  recordCount: number;
}

export interface ExtractedData {
  id: string;
  category: "equipment" | "environmental" | "observation" | "measurement";
  title: string;
  value: string;
  confidence: number;
  source: string;
  severity?: "normal" | "warning" | "critical";
}

export interface PatternAnomaly {
  id: string;
  type: "trend" | "anomaly" | "correlation";
  title: string;
  description: string;
  severity: "info" | "warning" | "critical";
  dataPoints?: number[];
  recommendation?: string;
}

export interface ComplianceItem {
  id: string;
  standard: string;
  requirement: string;
  status: "pass" | "fail" | "review";
  details: string;
  remediation?: string;
}

export interface ReportSection {
  id: string;
  title: string;
  content: string;
  editable: boolean;
}

export interface Recommendation {
  id: string;
  priority: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  riskLevel: number;
  timeline: string;
  estimatedCost?: string;
}

export interface Stakeholder {
  id: string;
  name: string;
  role: string;
  email: string;
  selected: boolean;
}

export interface ReportStep {
  id: string;
  title: string;
  shortTitle: string;
  icon: LucideIcon;
  description: string;
  duration: number;
  clickPrompt?: string;
}

// New interfaces for enhanced demo
export interface ReportVersion {
  version: string;
  status: "draft" | "review" | "approved" | "final";
  timestamp: string;
  author: string;
  summary: string;
}

export interface ProfessionalRole {
  id: string;
  label: string;
  standards: string[];
}

export interface WorkflowStep {
  id: string;
  label: string;
  status: "pending" | "active" | "complete";
  timestamp?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface DemoState {
  currentStep: number;
  isPlaying: boolean;
  stepProgress: number;
  selectedSources: string[];
  extractedData: ExtractedData[];
  patterns: PatternAnomaly[];
  complianceItems: ComplianceItem[];
  reportSections: ReportSection[];
  recommendations: Recommendation[];
  selectedStakeholders: string[];
  exportFormat: "pdf" | "docx" | "html";
}
