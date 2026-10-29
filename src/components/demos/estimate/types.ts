// Types for Drawings to Estimate Demo

export interface UploadedDocument {
  id: string;
  name: string;
  type: 'drawing' | 'scope' | 'schedule';
  detectedType?: 'plan' | 'section' | 'elevation' | 'detail';
  sheetLabel?: string;
  uploadProgress: number;
  size?: string;
}

export interface ScopeConfirmation {
  includedTrades: string[];
  exclusions: string[];
  assumptions: string[];
  measurementBasis: 'gfa' | 'nla' | 'custom';
}

export interface ExtractedItem {
  id: string;
  category: 'room' | 'finish' | 'quantity' | 'spec';
  label: string;
  value: string;
  source: string;
  confidence: number;
}

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'missing';

export interface EstimateLineItem {
  id: string;
  trade: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  total: number;
  confidence: ConfidenceLevel;
  isEditable: boolean;
}

export interface TradeBreakdown {
  id: string;
  name: string;
  total: number;
  itemCount: number;
  items: EstimateLineItem[];
}

export interface EstimateSummary {
  projectName: string;
  totalAmount: number;
  squareMetreRate: number;
  overallConfidence: number;
  generatedAt: string;
  revisionCount: number;
  floorArea: number;
  specGrade: 'basic' | 'standard' | 'premium';
}

export interface RevisionChange {
  field: string;
  oldValue: string | number;
  newValue: string | number;
  impact: number;
}

export interface DemoState {
  currentStep: number;
  uploadedDocuments: UploadedDocument[];
  scopeConfirmation: ScopeConfirmation;
  extractedItems: ExtractedItem[];
  estimate: EstimateSummary | null;
  trades: TradeBreakdown[];
  revisionHistory: RevisionChange[];
  isGenerating: boolean;
  isExtracting: boolean;
}

export const DEMO_STEPS = [
  { id: 1, title: 'Upload Project Inputs', shortTitle: 'Upload', icon: 'Upload' },
  { id: 2, title: 'Human Scope Confirmation', shortTitle: 'Confirm', icon: 'CheckSquare' },
  { id: 3, title: 'Schedule & Text Extraction', shortTitle: 'Extract', icon: 'FileSearch' },
  { id: 4, title: 'Draft Estimate Generator', shortTitle: 'Estimate', icon: 'Calculator' },
  { id: 5, title: 'Rapid Revision Demo', shortTitle: 'Revise', icon: 'RefreshCw' },
] as const;

export type StepId = typeof DEMO_STEPS[number]['id'];
