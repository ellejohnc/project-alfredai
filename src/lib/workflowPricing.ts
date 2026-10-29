// Workflow-specific pricing: fixed price OR multiplier per workflow type
// Admin can toggle between modes; default is fixed price

export interface WorkflowPricingEntry {
  workflowId: string;
  name: string;
  fixedSetupPrice: number;      // Fixed setup fee for this workflow
  fixedMonthlyPrice: number;    // Fixed monthly retainer for this workflow
  setupMultiplier: number;      // Multiplier applied to base tier rate
  monthlyMultiplier: number;    // Multiplier applied to base monthly rate
}

// Default workflow pricing — keyed by workflow definition ID
export const defaultWorkflowPricing: WorkflowPricingEntry[] = [
  // Workflow Builder
  { workflowId: 'workflow-builder', name: 'Custom Process Automation Builder', fixedSetupPrice: 5000, fixedMonthlyPrice: 250, setupMultiplier: 1.0, monthlyMultiplier: 1.0 },

  // Knowledge & Insights
  { workflowId: 'knowledge-intelligence', name: 'Document Search & Knowledge Q&A', fixedSetupPrice: 6000, fixedMonthlyPrice: 250, setupMultiplier: 1.0, monthlyMultiplier: 1.0 },
  { workflowId: 'knowledge-synthesis', name: 'Cross-Document Insights & Synthesis', fixedSetupPrice: 7000, fixedMonthlyPrice: 300, setupMultiplier: 1.15, monthlyMultiplier: 1.1 },

  // Operations
  { workflowId: 'business-operations', name: 'Operations Workflow Automation', fixedSetupPrice: 6000, fixedMonthlyPrice: 250, setupMultiplier: 1.0, monthlyMultiplier: 1.0 },
  { workflowId: 'consultant-decision-support', name: 'Business Consultant Decision Support', fixedSetupPrice: 8000, fixedMonthlyPrice: 350, setupMultiplier: 1.2, monthlyMultiplier: 1.15 },

  // Inventory & Warehouse
  { workflowId: 'inventory-asset-tracking', name: 'Inventory & Asset Tracking Agent', fixedSetupPrice: 6500, fixedMonthlyPrice: 250, setupMultiplier: 1.05, monthlyMultiplier: 1.0 },
  { workflowId: 'smart-warehouse', name: 'Warehouse Operations Optimizer', fixedSetupPrice: 8000, fixedMonthlyPrice: 350, setupMultiplier: 1.25, monthlyMultiplier: 1.15 },

  // Customer & Voice
  { workflowId: 'customer-experience', name: 'AI Customer Service Agent', fixedSetupPrice: 6000, fixedMonthlyPrice: 250, setupMultiplier: 1.0, monthlyMultiplier: 1.0 },
  { workflowId: 'butler-voice', name: 'Executive Voice Assistant', fixedSetupPrice: 7000, fixedMonthlyPrice: 300, setupMultiplier: 1.1, monthlyMultiplier: 1.1 },
  { workflowId: 'voice-agent', name: 'Voice AI Agent', fixedSetupPrice: 7500, fixedMonthlyPrice: 300, setupMultiplier: 1.15, monthlyMultiplier: 1.1 },
  { workflowId: 'voice-operations', name: 'Voice Operations Manager', fixedSetupPrice: 7500, fixedMonthlyPrice: 300, setupMultiplier: 1.15, monthlyMultiplier: 1.1 },

  // Marketplace & Property
  { workflowId: 'marketplace', name: 'AI Marketplace Platform', fixedSetupPrice: 8000, fixedMonthlyPrice: 350, setupMultiplier: 1.2, monthlyMultiplier: 1.15 },
  { workflowId: 'property-management', name: 'Property Management Agent', fixedSetupPrice: 7000, fixedMonthlyPrice: 300, setupMultiplier: 1.1, monthlyMultiplier: 1.1 },

  // Construction & Engineering
  { workflowId: 'subcontractor-assignment', name: 'Subcontractor Assignment Agent', fixedSetupPrice: 7000, fixedMonthlyPrice: 300, setupMultiplier: 1.1, monthlyMultiplier: 1.1 },
  { workflowId: 'rfi-management', name: 'RFI Management Agent', fixedSetupPrice: 7500, fixedMonthlyPrice: 300, setupMultiplier: 1.15, monthlyMultiplier: 1.1 },
  { workflowId: 'drawings-to-estimate', name: 'From Drawings to Draft Estimate', fixedSetupPrice: 12000, fixedMonthlyPrice: 1500, setupMultiplier: 1.5, monthlyMultiplier: 1.3 },
  { workflowId: 'vendor-compliance', name: 'AI Vendor Compliance Agent', fixedSetupPrice: 9000, fixedMonthlyPrice: 400, setupMultiplier: 1.3, monthlyMultiplier: 1.2 },
  { workflowId: 'alfred-bid', name: 'alfredBID', fixedSetupPrice: 12000, fixedMonthlyPrice: 500, setupMultiplier: 1.5, monthlyMultiplier: 1.3 },
  { workflowId: 'technical-report-agent', name: 'Technical Report Agent', fixedSetupPrice: 7500, fixedMonthlyPrice: 300, setupMultiplier: 1.15, monthlyMultiplier: 1.1 },
  { workflowId: 'fee-proposal', name: 'Fee Proposal Generator', fixedSetupPrice: 7000, fixedMonthlyPrice: 300, setupMultiplier: 1.1, monthlyMultiplier: 1.1 },
  { workflowId: 'contract-review', name: 'Contract Review Agent', fixedSetupPrice: 8500, fixedMonthlyPrice: 350, setupMultiplier: 1.25, monthlyMultiplier: 1.15 },
  { workflowId: 'smart-quote-builder', name: 'Smart Quote Builder', fixedSetupPrice: 8000, fixedMonthlyPrice: 350, setupMultiplier: 1.2, monthlyMultiplier: 1.15 },
  { workflowId: 'site-inspection', name: 'Site Inspection Agent', fixedSetupPrice: 7000, fixedMonthlyPrice: 300, setupMultiplier: 1.1, monthlyMultiplier: 1.1 },
  { workflowId: 'procurement', name: 'Procurement Agent', fixedSetupPrice: 7500, fixedMonthlyPrice: 300, setupMultiplier: 1.15, monthlyMultiplier: 1.1 },
  { workflowId: 'tender-management', name: 'Tender Management', fixedSetupPrice: 10000, fixedMonthlyPrice: 400, setupMultiplier: 1.35, monthlyMultiplier: 1.2 },

  // HR & Recruitment
  { workflowId: 'candidate-match', name: 'Candidate Matching Agent', fixedSetupPrice: 6500, fixedMonthlyPrice: 250, setupMultiplier: 1.05, monthlyMultiplier: 1.0 },
  { workflowId: 'interview-scoring', name: 'Interview Scoring Agent', fixedSetupPrice: 6000, fixedMonthlyPrice: 250, setupMultiplier: 1.0, monthlyMultiplier: 1.0 },
  { workflowId: 'hr-onboarding', name: 'Employee Onboarding Agent', fixedSetupPrice: 6000, fixedMonthlyPrice: 250, setupMultiplier: 1.0, monthlyMultiplier: 1.0 },

  // Sales & CRM
  { workflowId: 'lead-research', name: 'Lead Research Agent', fixedSetupPrice: 6000, fixedMonthlyPrice: 250, setupMultiplier: 1.0, monthlyMultiplier: 1.0 },
  { workflowId: 'ai-crm-insights', name: 'AI CRM Insights Agent', fixedSetupPrice: 7000, fixedMonthlyPrice: 300, setupMultiplier: 1.1, monthlyMultiplier: 1.1 },
  { workflowId: 'proposal-generator', name: 'Proposal & Quote Generator', fixedSetupPrice: 7000, fixedMonthlyPrice: 300, setupMultiplier: 1.1, monthlyMultiplier: 1.1 },

  // Finance & Accounting
  { workflowId: 'auto-invoicing', name: 'Auto Invoicing Agent', fixedSetupPrice: 6500, fixedMonthlyPrice: 250, setupMultiplier: 1.05, monthlyMultiplier: 1.0 },
  { workflowId: 'invoice-processing', name: 'Invoice Processing Agent', fixedSetupPrice: 6500, fixedMonthlyPrice: 250, setupMultiplier: 1.05, monthlyMultiplier: 1.0 },
  { workflowId: 'purchase-bill-intake', name: 'Purchase & Bill Intake Agent', fixedSetupPrice: 6500, fixedMonthlyPrice: 250, setupMultiplier: 1.05, monthlyMultiplier: 1.0 },
  { workflowId: 'financial-reconciliation', name: 'Financial Reconciliation Agent', fixedSetupPrice: 9000, fixedMonthlyPrice: 400, setupMultiplier: 1.3, monthlyMultiplier: 1.2 },

  // Industry-Specific
  { workflowId: 'patient-engagement', name: 'Patient Engagement Agent', fixedSetupPrice: 7500, fixedMonthlyPrice: 300, setupMultiplier: 1.15, monthlyMultiplier: 1.1 },
  { workflowId: 'insurance-broker', name: 'Insurance Broker Agent', fixedSetupPrice: 8000, fixedMonthlyPrice: 350, setupMultiplier: 1.2, monthlyMultiplier: 1.15 },
  { workflowId: 'business-matchmaker', name: 'Business Matchmaker Agent', fixedSetupPrice: 7000, fixedMonthlyPrice: 300, setupMultiplier: 1.1, monthlyMultiplier: 1.1 },
  { workflowId: 'law-firm-os', name: 'Law Firm OS Agent', fixedSetupPrice: 9000, fixedMonthlyPrice: 400, setupMultiplier: 1.3, monthlyMultiplier: 1.2 },
  { workflowId: 'trades-platform', name: 'Trades Platform Agent', fixedSetupPrice: 8000, fixedMonthlyPrice: 350, setupMultiplier: 1.2, monthlyMultiplier: 1.15 },
  { workflowId: 'event-seating', name: 'Event Seating Planner', fixedSetupPrice: 6000, fixedMonthlyPrice: 250, setupMultiplier: 1.0, monthlyMultiplier: 1.0 },
  { workflowId: 'timber-flooring-quote', name: 'AlfredFloors AI Quote Builder', fixedSetupPrice: 10000, fixedMonthlyPrice: 400, setupMultiplier: 1.35, monthlyMultiplier: 1.2 },

  // Compliance & Governance
  { workflowId: 'compliance-monitoring', name: 'Compliance Monitoring Agent', fixedSetupPrice: 8500, fixedMonthlyPrice: 350, setupMultiplier: 1.25, monthlyMultiplier: 1.15 },

  // Meetings & Communication
  { workflowId: 'meeting-intelligence', name: 'Meeting Intelligence Agent', fixedSetupPrice: 5500, fixedMonthlyPrice: 250, setupMultiplier: 1.0, monthlyMultiplier: 1.0 },
  { workflowId: 'email-triage', name: 'AI Email Triage & Inbox Management', fixedSetupPrice: 5500, fixedMonthlyPrice: 250, setupMultiplier: 1.0, monthlyMultiplier: 1.0 },
];

// Get workflow pricing by ID, returns default if not found
export function getWorkflowPricing(workflowId: string): WorkflowPricingEntry {
  return defaultWorkflowPricing.find(w => w.workflowId === workflowId) || {
    workflowId,
    name: workflowId,
    fixedSetupPrice: 6000,
    fixedMonthlyPrice: 250,
    setupMultiplier: 1.0,
    monthlyMultiplier: 1.0,
  };
}
