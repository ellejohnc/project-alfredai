/**
 * Contextualized AI Agent Workflow Definitions
 * Derived from demo content with business-oriented naming and keyword matching for transcript analysis
 */

export interface WorkflowDefinition {
  id: string;           // Demo ID for linking to demo pages
  name: string;         // Contextualized business workflow name
  description: string;  // What this workflow automates
  category: string;     // Business category for grouping
  keywords: string[];   // Keywords for AI transcript matching
  applications: string[]; // Specific use cases / applications
}

export const workflowDefinitions: WorkflowDefinition[] = [
  // Workflow Builder
  {
    id: 'workflow-builder',
    name: 'Custom Process Automation Builder',
    description: 'Build automated workflows without code using AI-guided step recommendations. Any employee can create their own automation.',
    category: 'workflow',
    keywords: ['automation', 'no-code', 'process', 'workflow', 'custom', 'build', 'create', 'design', 'DIY', 'self-service'],
    applications: ['No-Code Workflow Creation', 'AI-Guided Setup', 'Employee Self-Service Automation'],
  },

  // Knowledge & Insights
  {
    id: 'knowledge-intelligence',
    name: 'Document Search & Knowledge Q&A',
    description: 'AI-powered document search with natural language questions and instant answers with cited sources.',
    category: 'knowledge',
    keywords: ['documents', 'search', 'knowledge', 'Q&A', 'files', 'information', 'find', 'lookup', 'retrieve', 'answers', 'questions'],
    applications: ['Natural Language Document Search', 'Instant Q&A with Citations', 'Knowledge Base Intelligence'],
  },
  {
    id: 'knowledge-synthesis',
    name: 'Cross-Document Insights & Synthesis',
    description: 'AI connects dots across thousands of documents to surface hidden insights and generate executive summaries.',
    category: 'knowledge',
    keywords: ['synthesis', 'insights', 'summaries', 'analysis', 'reports', 'executive', 'cross-reference', 'patterns', 'trends'],
    applications: ['Multi-Document Analysis', 'Executive Summary Generation', 'Hidden Pattern Discovery'],
  },

  // Operations
  {
    id: 'business-operations',
    name: 'Operations Workflow Automation',
    description: 'Automate complex workflows with accountability tracking, approval routing, and automated reporting.',
    category: 'operations',
    keywords: ['operations', 'workflow', 'approvals', 'accountability', 'tracking', 'reporting', 'process', 'efficiency', 'streamline'],
    applications: ['Workflow Automation', 'Approval Routing', 'Accountability Tracking', 'Automated Reporting'],
  },
  {
    id: 'consultant-decision-support',
    name: 'Business Consultant Decision Support',
    description: 'Internal tool for structured pre-engagement assessment with risk analysis, complexity scoring, and fee proposal support.',
    category: 'operations',
    keywords: ['consulting', 'risk analysis', 'pricing', 'fee proposal', 'pre-engagement', 'assessment', 'margins', 'advisory', 'professional services', 'scoping'],
    applications: ['Pre-Engagement Assessment', 'Risk Exposure Analysis', 'Fee Proposal Support', 'Delivery Margin Protection'],
  },
  {
    id: 'inventory-asset-tracking',
    name: 'Inventory & Asset Tracking Agent',
    description: 'Track assets and inventory in real time, logging movements, detecting issues, and maintaining accountability.',
    category: 'operations',
    keywords: ['inventory', 'assets', 'tracking', 'stock', 'warehouse', 'equipment', 'movement', 'audit', 'location'],
    applications: ['Real-Time Asset Tracking', 'Inventory Movement Logging', 'Issue Detection', 'Audit Trail'],
  },
  {
    id: 'smart-warehouse',
    name: 'Warehouse Operations Optimizer',
    description: 'AI-powered wave planning, route optimization, and batch picking to reduce picking time by 40%.',
    category: 'operations',
    keywords: ['warehouse', 'picking', 'routing', 'logistics', 'fulfillment', 'orders', 'batch', 'WMS', 'distribution'],
    applications: ['Wave Planning', 'Route Optimization', 'Batch Picking', 'Order Fulfillment'],
  },

  // Customer Experience
  {
    id: 'customer-experience',
    name: 'AI Customer Service Agent',
    description: 'AI-powered customer service with context, sentiment, and history understanding for personalized responses.',
    category: 'cx',
    keywords: ['customer', 'service', 'support', 'tickets', 'help', 'queries', 'responses', 'chatbot', 'multichannel', 'experience'],
    applications: ['Multi-Channel Support', 'Sentiment Analysis', 'Personalized Responses', 'Ticket Resolution'],
  },

  // Butler / Personal AI
  {
    id: 'butler-voice',
    name: 'Executive Voice Assistant',
    description: 'Voice-enabled AI assistant for scheduling meetings, managing tasks, and getting updates through natural conversation.',
    category: 'butler',
    keywords: ['assistant', 'voice', 'schedule', 'meetings', 'tasks', 'calendar', 'executive', 'personal', 'hands-free'],
    applications: ['Voice-Enabled Scheduling', 'Task Management', 'Meeting Coordination', 'Hands-Free Updates'],
  },

  // Voice AI
  {
    id: 'voice-agent',
    name: 'Conversational Voice AI Agent',
    description: 'Real-time AI voice conversation agent for natural dialogue and interactive customer engagement.',
    category: 'voice',
    keywords: ['voice', 'phone', 'call', 'conversation', 'speaking', 'audio', 'real-time', 'talk', 'dialogue'],
    applications: ['Real-Time Voice Conversations', 'Interactive Dialogue', 'Voice-First Engagement'],
  },
  {
    id: 'voice-operations',
    name: 'High-Volume Call Automation',
    description: 'Handle thousands of concurrent calls with intelligent routing, resolution, escalation, and follow-up automation.',
    category: 'voice',
    keywords: ['calls', 'call center', 'high volume', 'concurrent', 'inbound', 'outbound', 'routing', 'escalation', 'SDR', 'cold calling'],
    applications: ['High-Volume Call Handling', 'Intelligent Routing', 'Auto-Escalation', 'After-Call Automation'],
  },

  // Marketplace / Integrations
  {
    id: 'marketplace',
    name: 'Integration & API Connectivity',
    description: 'Connect 5,000+ integrations and extend AI capabilities with your existing tools and systems.',
    category: 'marketplace',
    keywords: ['integrations', 'APIs', 'connectors', 'tools', 'systems', 'connect', 'sync', 'third-party', 'platforms'],
    applications: ['5,000+ Integrations', 'API Connectivity', 'Tool Synchronization'],
  },

  // Property Management
  {
    id: 'property-management',
    name: 'Property Management Voice Agent',
    description: 'Voice agent for property managers handling leasing, maintenance, arrears, renewals, and emergency calls.',
    category: 'property',
    keywords: ['property', 'real estate', 'leasing', 'maintenance', 'tenant', 'landlord', 'rent', 'arrears', 'renewals'],
    applications: ['Leasing Inquiries', 'Maintenance Coordination', 'Arrears Follow-Up', 'Owner Updates'],
  },

  // Construction
  {
    id: 'subcontractor-assignment',
    name: 'Subcontractor Coordination & Assignment',
    description: 'AI-powered subcontractor assignment with project brief activation and voice/text-based coordination.',
    category: 'construction',
    keywords: ['subcontractor', 'contractor', 'construction', 'trades', 'project', 'assignment', 'coordination', 'job', 'site'],
    applications: ['Subcontractor Assignment', 'Project Brief Activation', 'Voice/Text Coordination'],
  },
  {
    id: 'rfi-management',
    name: 'RFI Processing & Response Agent',
    description: 'Handle RFIs from Procore or similar platforms - classifying, drafting responses, tracking, and escalating.',
    category: 'construction',
    keywords: ['RFI', 'request for information', 'Procore', 'construction', 'questions', 'responses', 'tracking', 'clarification'],
    applications: ['RFI Classification', 'Response Drafting', 'Tracking & Escalation', 'Procore Integration'],
  },
  {
    id: 'drawings-to-estimate',
    name: 'Drawings to Draft Estimate',
    description: 'Human + AI workflow for construction estimating. Upload drawings and schedules, confirm scope, and AI accelerates extraction to revision-ready estimates.',
    category: 'construction',
    keywords: ['drawings', 'estimate', 'estimating', 'quantity', 'takeoff', 'take-off', 'take off', 'material takeoff', 'QS', 'BOQ', 'bill of quantities', 'bill of quantity', 'cost', 'construction', 'schedules', 'draft', 'revision', 'PDF drawings', 'scan drawings', 'PDF plans', 'quantity surveyor', 'measurement', 'extraction', 'quantities', 'materials', 'scope of works'],
    applications: ['Drawing Recognition', 'Schedule Extraction', 'Draft Estimate Generation', 'Rapid Revisions', 'Material Take-off', 'Bill of Quantities'],
  },
  {
    id: 'vendor-compliance',
    name: 'Vendor Compliance Document Tracking',
    description: 'Automate subcontractor document tracking at scale with AI-powered email intake, document verification, multi-channel reminders, and real-time compliance dashboards.',
    category: 'construction',
    keywords: ['compliance', 'subcontractor', 'vendor', 'documents', 'insurance', 'SWMS', 'induction', 'tracking', 'reminders', 'verification', 'expiry'],
    applications: ['Document Intake & Verification', 'Multi-Channel Reminders', 'Compliance Dashboard', 'Expiry Tracking'],
  },
  {
    id: 'alfred-bid',
    name: 'alfredBID — Full Bid Operating System',
    description: 'AI-powered bidding management platform for construction and professional services. Manages the full lifecycle: tender discovery, swipe qualification, structured AI writing, CV matching & rewriting, material take-off automation, RFP extraction, compliance matrices, centralised content library, and team collaboration.',
    category: 'construction',
    keywords: ['bid', 'tender', 'bidding', 'RFT', 'submission', 'proposal', 'Pwin', 'opportunity', 'construction', 'procurement', 'EOI', 'ITO', 'CV', 'compliance', 'take-off', 'RFP'],
    applications: ['Tender Discovery & Qualification', 'AI Tender Writing', 'CV Matching & Rewriting', 'Take-Off Automation', 'RFP Extraction', 'Compliance Matrix'],
  },
  {
    id: 'technical-report-agent',
    name: 'Technical Report Generation Agent',
    description: 'Automate technical report generation with AI-powered data ingestion, pattern analysis, compliance verification, and professional report synthesis.',
    category: 'operations',
    keywords: ['technical', 'report', 'analysis', 'compliance', 'field', 'inspection', 'synthesis', 'documentation', 'engineering', 'assessment'],
    applications: ['Data Ingestion', 'Pattern Analysis', 'Compliance Verification', 'Report Synthesis'],
  },

  // Proposals & Contracts
  {
    id: 'fee-proposal',
    name: 'Proposal Generation & Tracking',
    description: 'End-to-end proposal workflow: email intake, AI drafting, CRM integration, commenting, tracking, and auto-invoicing.',
    category: 'proposals',
    keywords: ['proposal', 'fee', 'quote', 'estimate', 'bid', 'pricing', 'drafting', 'client', 'scope'],
    applications: ['AI Proposal Drafting', 'CRM Integration', 'Stakeholder Commenting', 'Tracking & Auto-Invoicing'],
  },
  {
    id: 'contract-review',
    name: 'AI Contract Analysis & Risk Detection',
    description: 'AI-enhanced contract analysis with clause comparison, risk detection, and Figma-style collaboration.',
    category: 'contracts',
    keywords: ['contract', 'legal', 'review', 'clauses', 'risk', 'terms', 'agreement', 'compliance', 'redline', 'negotiation'],
    applications: ['Clause Comparison', 'Risk Detection', 'Stakeholder Mapping', 'Collaborative Review'],
  },
  {
    id: 'smart-quote-builder',
    name: 'AI Quote Generation & Pricing',
    description: 'AI-powered quotation receiving RFQs, matching products, applying dynamic pricing, and generating proposals.',
    category: 'sales',
    keywords: ['quote', 'quotation', 'RFQ', 'pricing', 'products', 'proposal', 'estimate', 'costing'],
    applications: ['RFQ Processing', 'Product Matching', 'Dynamic Pricing', 'Proposal Generation'],
  },

  // Site Inspection
  {
    id: 'site-inspection',
    name: 'Site Inspection & Defect Detection',
    description: 'Digitize site inspections with AI-powered defect detection, photo analysis, and auto-generated reports.',
    category: 'inspection',
    keywords: ['inspection', 'site', 'defect', 'photos', 'reports', 'quality', 'audit', 'checklist', 'construction', 'safety'],
    applications: ['AI Defect Detection', 'Photo Analysis', 'Auto-Generated Reports', 'GPS Documentation'],
  },

  // Procurement
  {
    id: 'procurement',
    name: 'AI Procurement & Supplier Matching',
    description: 'End-to-end procurement: AI supplier matching, tender generation, bid evaluation, and contract signing.',
    category: 'procurement',
    keywords: ['procurement', 'purchasing', 'supplier', 'vendor', 'sourcing', 'PO', 'purchase order', 'buying', 'spend'],
    applications: ['Supplier Matching', 'Tender Generation', 'Bid Evaluation', 'Contract Automation'],
  },
  {
    id: 'tender-management',
    name: 'Tender Lifecycle Management',
    description: 'Complete RFQ/RFP lifecycle from generation to award with supplier portal, bid comparison, and notifications.',
    category: 'procurement',
    keywords: ['tender', 'RFQ', 'RFP', 'bid', 'vendor', 'selection', 'evaluation', 'award', 'supplier portal'],
    applications: ['RFQ/RFP Generation', 'Supplier Portal Submission', 'Bid Comparison', 'Award Automation'],
  },

  // Recruitment
  {
    id: 'candidate-match',
    name: 'Candidate Matching & Visa Eligibility',
    description: 'Instant candidate matching combining recruitment suitability with migration eligibility and visa checks.',
    category: 'recruitment',
    keywords: ['candidate', 'recruitment', 'hiring', 'resume', 'CV', 'visa', 'immigration', 'matching', 'talent', 'applicant'],
    applications: ['CV Parsing', 'Visa Eligibility Checks', 'Candidate Ranking', 'Migration Intelligence'],
  },
  {
    id: 'interview-scoring',
    name: 'Interview Analysis & Scoring Agent',
    description: 'AI analysis of interview recordings with automated scoring, bias checking, and hiring recommendations.',
    category: 'recruitment',
    keywords: ['interview', 'scoring', 'assessment', 'evaluation', 'hiring', 'candidate', 'recording', 'analysis', 'bias'],
    applications: ['Interview Recording Analysis', 'Automated Scoring', 'Bias Checking', 'Hiring Recommendations'],
  },

  // Sales & CRM
  {
    id: 'lead-research',
    name: 'Lead Research & Prospecting Agent',
    description: 'AI-powered prospecting across LinkedIn, news, and databases with enrichment, scoring, and personalized outreach.',
    category: 'sales',
    keywords: ['leads', 'prospecting', 'research', 'outreach', 'cold', 'sales', 'LinkedIn', 'enrichment', 'SDR', 'pipeline'],
    applications: ['Lead Research', 'Data Enrichment', 'Prospect Scoring', 'Personalized Outreach Sequences'],
  },
  {
    id: 'ai-crm-insights',
    name: 'CRM Intelligence & Deal Forecasting',
    description: 'Intelligent CRM with automatic lead enrichment, predictive scoring, activity suggestions, and deal forecasting.',
    category: 'sales',
    keywords: ['CRM', 'deals', 'pipeline', 'forecast', 'leads', 'opportunities', 'sales', 'Salesforce', 'HubSpot', 'predictions'],
    applications: ['Lead Enrichment', 'Predictive Scoring', 'Activity Suggestions', 'Deal Forecasting'],
  },

  // Finance
  {
    id: 'auto-invoicing',
    name: 'Automated Invoicing & Payment Reminders',
    description: 'Automated invoice generation, smart payment reminders based on client history, and cash flow forecasting.',
    category: 'finance',
    keywords: ['invoice', 'invoicing', 'billing', 'payment', 'reminders', 'collections', 'AR', 'receivables', 'cash flow'],
    applications: ['Invoice Generation', 'Smart Payment Reminders', 'Overdue Chase Sequences', 'Cash Flow Forecasting'],
  },
  {
    id: 'invoice-processing',
    name: 'Invoice Processing & AP Automation',
    description: 'End-to-end invoice processing from email to approval to accounting system with full traceability.',
    category: 'finance',
    keywords: ['invoice', 'AP', 'payables', 'processing', 'approval', 'accounting', 'Xero', 'MYOB', 'QuickBooks', 'bills'],
    applications: ['Invoice OCR', 'Approval Workflows', 'Accounting Integration', 'Audit Trail'],
  },
  {
    id: 'purchase-bill-intake',
    name: 'Purchase Bill Intake & Payment Scheduling',
    description: 'AI-powered subcontractor and supplier invoice processing with extraction, matching, discrepancy detection, and intelligent payment scheduling.',
    category: 'finance',
    keywords: ['purchase', 'bill', 'subcontractor', 'supplier', 'invoice', 'AP', 'payables', 'Xero', 'batch', 'payment', 'schedule', 'discrepancy'],
    applications: ['AI Bill Extraction', 'Discrepancy Detection', 'Xero Sync', 'Payment Scheduling', 'Batch Processing'],
  },

  // Healthcare
  {
    id: 'patient-engagement',
    name: 'Patient Booking & Engagement Agent',
    description: 'AI-powered patient booking, multi-channel reminders, no-show recovery, and proactive wellness check-ins.',
    category: 'healthcare',
    keywords: ['patient', 'booking', 'appointment', 'healthcare', 'medical', 'clinic', 'doctor', 'dental', 'reminder', 'wellness'],
    applications: ['Appointment Booking', 'Multi-Channel Reminders', 'No-Show Recovery', 'Wellness Check-Ins'],
  },

  // Insurance
  {
    id: 'insurance-broker',
    name: 'Insurance Broker Automation',
    description: 'AI for insurance brokers: lead scoring, policy comparison, claims triage, compliance monitoring, and portfolio analytics.',
    category: 'insurance',
    keywords: ['insurance', 'broker', 'policy', 'claims', 'underwriting', 'compliance', 'premiums', 'renewals', 'risk'],
    applications: ['Lead Scoring', 'Policy Comparison', 'Claims Triage', 'Compliance Monitoring'],
  },

  // Partnerships
  {
    id: 'business-matchmaker',
    name: 'Business Partnership Matching',
    description: 'AI-powered matching connecting businesses, founders, and professionals based on fit, intent, and mutual value.',
    category: 'partnerships',
    keywords: ['matching', 'partnerships', 'networking', 'connections', 'business development', 'introductions', 'referrals'],
    applications: ['Business Matching', 'Strategic Partnership Scoring', 'Intent-Based Connections'],
  },

  // Legal
  {
    id: 'law-firm-os',
    name: 'Legal Operations & Case Management',
    description: 'AI-powered legal operations for case management, accountability tracking, and embedded AI assistance.',
    category: 'legal',
    keywords: ['legal', 'law firm', 'case', 'matter', 'lawyer', 'attorney', 'litigation', 'compliance', 'billing'],
    applications: ['Case Management', 'Accountability Tracking', 'AI Legal Assistant', 'Trust Scoring'],
  },

  // Trades
  {
    id: 'trades-platform',
    name: 'Trades Business Automation (TradeFlow)',
    description: 'Complete business automation for painters and trades with AI quotation, image analysis, booking, and payments.',
    category: 'operations',
    keywords: ['trades', 'painter', 'plumber', 'electrician', 'quote', 'booking', 'payments', 'jobs', 'tradesman'],
    applications: ['AI Image-Based Quotation', 'Online Booking', 'Secure Deposit Payments', 'Customer Portal'],
  },

  // Events
  {
    id: 'event-seating',
    name: 'Event Seating & Planning Agent',
    description: 'AI-powered event seating with interactive floor plans, drag-and-drop positioning, and smart guest assignment.',
    category: 'events',
    keywords: ['event', 'seating', 'wedding', 'conference', 'gala', 'table', 'guests', 'planning', 'floor plan'],
    applications: ['Interactive Floor Plans', 'Drag-and-Drop Tables', 'AI Seating Recommendations', 'Guest Assignment'],
  },

  // Trades Quoting
  {
    id: 'timber-flooring-quote',
    name: 'AI Timber Flooring Quote Builder',
    description: 'AI vision measures floors from photos using reference objects, assesses timber condition, auto-prices from rate cards, and generates instant quotes with online booking.',
    category: 'operations',
    keywords: ['flooring', 'timber', 'quote', 'measurement', 'vision', 'sanding', 'polishing', 'floor', 'maintenance', 'photo', 'booking'],
    applications: ['AI Photo Measurement', 'Timber Condition Assessment', 'Rate Card Pricing', 'Instant Quote Generation'],
  },

  // HR & People
  {
    id: 'hr-onboarding',
    name: 'Employee Onboarding Agent',
    description: 'Automates new hire onboarding with document collection, task assignment, IT provisioning checklists, and progress tracking.',
    category: 'operations',
    keywords: ['onboarding', 'HR', 'new hire', 'employee', 'induction', 'checklist', 'provisioning', 'people', 'welcome'],
    applications: ['Document Collection', 'Task Assignment', 'IT Provisioning', 'Progress Tracking'],
  },

  // Compliance
  {
    id: 'compliance-monitoring',
    name: 'Compliance Monitoring Agent',
    description: 'Continuously monitors regulatory changes, internal policy adherence, and flags compliance risks with automated alerts.',
    category: 'operations',
    keywords: ['compliance', 'regulatory', 'monitoring', 'audit', 'risk', 'policy', 'governance', 'alerts', 'regulations'],
    applications: ['Regulatory Change Monitoring', 'Policy Adherence Checks', 'Risk Flagging', 'Automated Alerts'],
  },

  // Meetings & Communication
  {
    id: 'meeting-intelligence',
    name: 'Meeting Intelligence Agent',
    description: 'Records, transcribes, and summarises meetings with action item extraction, decision tracking, and follow-up reminders.',
    category: 'knowledge',
    keywords: ['meetings', 'transcription', 'minutes', 'action items', 'summary', 'notes', 'decisions', 'follow-up', 'recording'],
    applications: ['Meeting Transcription', 'Action Item Extraction', 'Decision Tracking', 'Follow-up Reminders'],
  },
  {
    id: 'email-triage',
    name: 'AI Email Triage & Inbox Management',
    description: 'AI triages, categorises, drafts replies, and prioritises emails so teams focus on what matters most.',
    category: 'operations',
    keywords: ['email', 'inbox', 'triage', 'prioritise', 'reply', 'drafts', 'categorise', 'communication', 'management'],
    applications: ['Email Triage', 'Auto-Categorisation', 'Reply Drafting', 'Priority Sorting'],
  },

  // Sales & Proposals
  {
    id: 'proposal-generator',
    name: 'Proposal & Quote Generator',
    description: 'Generates professional proposals and quotes from templates with dynamic pricing, scope sections, and client personalisation.',
    category: 'operations',
    keywords: ['proposal', 'quote', 'generator', 'pricing', 'template', 'scope', 'sales', 'bid', 'document'],
    applications: ['Template-Based Proposals', 'Dynamic Pricing', 'Client Personalisation', 'Scope Generation'],
  },

  // Finance
  {
    id: 'financial-reconciliation',
    name: 'Financial Reconciliation Agent',
    description: 'Automates bank-to-ledger reconciliation, flags discrepancies, and generates exception reports for finance teams.',
    category: 'operations',
    keywords: ['reconciliation', 'finance', 'bank', 'ledger', 'accounting', 'discrepancy', 'exceptions', 'matching', 'audit'],
    applications: ['Bank-to-Ledger Matching', 'Discrepancy Flagging', 'Exception Reporting', 'Automated Reconciliation'],
  },
];

// Get workflow definition by ID
export const getWorkflowById = (id: string): WorkflowDefinition | undefined => {
  return workflowDefinitions.find(w => w.id === id);
};

// Get all workflow IDs for a category
export const getWorkflowsByCategory = (category: string): WorkflowDefinition[] => {
  return workflowDefinitions.filter(w => w.category === category);
};

// Get workflow catalog for AI prompts (compact format)
export const getWorkflowCatalogForAI = (): string => {
  return workflowDefinitions.map(w => 
    `- ${w.id}: "${w.name}" | Keywords: ${w.keywords.slice(0, 5).join(', ')}`
  ).join('\n');
};

// Map of all workflow IDs for validation
export const validWorkflowIds = new Set(workflowDefinitions.map(w => w.id));

// Array of valid workflow IDs for server-side validation
export const VALID_WORKFLOW_ID_LIST: readonly string[] = workflowDefinitions.map(w => w.id);
