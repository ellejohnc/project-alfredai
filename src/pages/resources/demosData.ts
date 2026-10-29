import { lazy } from "react";
import { 
  Brain, Workflow, MessageSquare, Bot, Layers,
  Mic, LayoutGrid, Building2, HardHat, FileText, FileSearch, Wand2, ClipboardCheck, ShoppingCart, Users,
  Target, Receipt, Sparkles, Heart, Mail,
  Briefcase, Megaphone, Settings, DollarSign, HeadphonesIcon, UserCheck, Lightbulb, Cpu, Package, Handshake,
  Scale, Paintbrush, LucideIcon, FileStack, FileBarChart, Shield, TreePine, RefreshCw, FileCheck2, PackageCheck
} from "lucide-react";

// Demo thumbnail imports
import vendorComplianceThumb from "@/assets/demos/vendor-compliance-thumb.jpg";
import drawingsToEstimateThumb from "@/assets/demos/drawings-to-estimate-thumb.jpg";
import technicalReportThumb from "@/assets/demos/technical-report-thumb.jpg";
import siteInspectionThumb from "@/assets/demos/site-inspection-thumb.jpg";
import voiceOperationsThumb from "@/assets/demos/voice-operations-thumb.jpg";
import subcontractorAssignmentThumb from "@/assets/demos/subcontractor-assignment-thumb.jpg";
import tenderManagementThumb from "@/assets/demos/tender-management-thumb.jpg";
import crmInsightsThumb from "@/assets/demos/crm-insights-thumb.jpg";
import inventoryTrackingThumb from "@/assets/demos/inventory-tracking-thumb.jpg";
import leadResearchThumb from "@/assets/demos/lead-research-thumb.jpg";
import businessMatchmakerThumb from "@/assets/demos/business-matchmaker-thumb.jpg";
import insuranceBrokerThumb from "@/assets/demos/insurance-broker-thumb.jpg";
import patientBookingThumb from "@/assets/demos/patient-booking-thumb.jpg";
import autoInvoicingThumb from "@/assets/demos/auto-invoicing-thumb.jpg";
import candidateMatchThumb from "@/assets/demos/candidate-match-thumb.jpg";
import procurementManagerThumb from "@/assets/demos/procurement-manager-thumb.jpg";
import contractReviewThumb from "@/assets/demos/contract-review-thumb.jpg";
import invoiceProcessingThumb from "@/assets/demos/invoice-processing-thumb.jpg";
import feeProposalThumb from "@/assets/demos/fee-proposal-thumb.jpg";
import propertyManagementThumb from "@/assets/demos/property-management-thumb.jpg";
import marketplaceThumb from "@/assets/demos/marketplace-thumb.jpg";
import voiceAgentThumb from "@/assets/demos/voice-agent-thumb.jpg";
import knowledgeSynthesisThumb from "@/assets/demos/knowledge-synthesis-thumb.jpg";
import butlerVoiceThumb from "@/assets/demos/butler-voice-thumb.jpg";
import customerExperienceThumb from "@/assets/demos/customer-experience-thumb.jpg";
import businessOperationsThumb from "@/assets/demos/business-operations-thumb.jpg";
import knowledgeIntelligenceThumb from "@/assets/demos/knowledge-intelligence-thumb.jpg";
import workflowBuilderThumb from "@/assets/demos/workflow-builder-thumb.jpg";
// New thumbnail imports for remaining demos
import purchaseBillThumb from "@/assets/demos/purchase-bill-thumb.jpg";
import consultantDecisionThumb from "@/assets/demos/consultant-decision-thumb.jpg";
import smartWarehouseThumb from "@/assets/demos/smart-warehouse-thumb.jpg";
import smartQuoteThumb from "@/assets/demos/smart-quote-thumb.jpg";
import eventSeatingThumb from "@/assets/demos/event-seating-thumb.jpg";
import tradesPlatformThumb from "@/assets/demos/trades-platform-thumb.jpg";
import lawFirmThumb from "@/assets/demos/law-firm-thumb.jpg";
import rfiManagementThumb from "@/assets/demos/rfi-management-thumb.jpg";
import interviewScoringThumb from "@/assets/demos/interview-scoring-thumb.jpg";
import alfredBidThumb from "@/assets/demos/alfred-bid-thumb.jpg";
import timberFlooringThumb from "@/assets/demos/timber-flooring-thumb.jpg";
import emailTriageThumb from "@/assets/demos/email-triage-thumb.jpg";
import clashRevisionGuardThumb from "@/assets/demos/clash-revision-guard-thumb.jpg";
import preStageQaGateThumb from "@/assets/demos/pre-stage-qa-gate-thumb.jpg";
import fieldToOfficeLoopThumb from "@/assets/demos/field-to-office-loop-thumb.jpg";
import tenderBidCompletionThumb from "@/assets/demos/tender-bid-completion-thumb.jpg";
import rfpComplianceScoringThumb from "@/assets/demos/rfp-compliance-scoring-thumb.jpg";
import purchaseOrderSalesOrderThumb from "@/assets/demos/purchase-order-sales-order-thumb.jpg";

// Lazy load all demo components for optimal performance
export const VoiceAgentDemo = lazy(() => import("@/components/demos/VoiceAgentDemo"));
export const KnowledgeDemo = lazy(() => import("@/components/demos/KnowledgeDemo"));
export const BusinessOSDemo = lazy(() => import("@/components/demos/BusinessOSDemo"));
export const CXAgentDemo = lazy(() => import("@/components/demos/CXAgentDemo"));
export const ButlerDemo = lazy(() => import("@/components/demos/ButlerDemo"));
export const MarketplaceDemo = lazy(() => import("@/components/demos/MarketplaceDemo"));
export const KnowledgeSynthesisDemo = lazy(() => import("@/components/demos/KnowledgeSynthesisDemo"));
export const PropertyManagementDemo = lazy(() => import("@/components/demos/PropertyManagementDemo"));
export const SubcontractorAssignmentDemo = lazy(() => import("@/components/demos/SubcontractorAssignmentDemo"));
export const FeeProposalDemo = lazy(() => import("@/components/demos/FeeProposalDemo"));
export const ContractReviewDemo = lazy(() => import("@/components/demos/ContractReviewDemo"));
export const WorkflowBuilderDemo = lazy(() => import("@/components/demos/WorkflowBuilderDemo"));
export const SiteInspectionDemo = lazy(() => import("@/components/demos/SiteInspectionDemo"));
export const ProcurementDemo = lazy(() => import("@/components/demos/ProcurementDemo"));
export const CandidateMatchDemo = lazy(() => import("@/components/demos/CandidateMatchDemo"));
export const LeadResearchDemo = lazy(() => import("@/components/demos/LeadResearchDemo"));
export const AutoInvoicingDemo = lazy(() => import("@/components/demos/AutoInvoicingDemo"));
export const InterviewScoringDemo = lazy(() => import("@/components/demos/InterviewScoringDemo"));
export const PatientEngagementDemo = lazy(() => import("@/components/demos/PatientEngagementDemo"));
export const InsuranceBrokerDemo = lazy(() => import("@/components/demos/InsuranceBrokerDemo"));
export const BusinessMatchMakerDemo = lazy(() => import("@/components/demos/BusinessMatchMakerDemo"));
export const InvoiceProcessingDemo = lazy(() => import("@/components/demos/InvoiceProcessingDemo"));
export const RFIManagementDemo = lazy(() => import("@/components/demos/RFIManagementDemo"));
export const InventoryAssetTrackingDemo = lazy(() => import("@/components/demos/InventoryAssetTrackingDemo"));
export const VoiceOperationsDemo = lazy(() => import("@/components/demos/VoiceOperationsDemo"));
export const LawFirmOSDemo = lazy(() => import("@/components/demos/LawFirmOSDemo"));
export const TradesPlatformDemo = lazy(() => import("@/components/demos/TradesPlatformDemo"));
export const EventSeatingDemo = lazy(() => import("@/components/demos/seating/EventSeatingDemo").then(m => ({ default: m.EventSeatingDemo })));
export const SmartQuoteBuilderDemo = lazy(() => import("@/components/demos/SmartQuoteBuilderDemo"));
export const SmartWarehouseDemo = lazy(() => import("@/components/demos/SmartWarehouseDemo"));
export const AICRMInsightsDemo = lazy(() => import("@/components/demos/AICRMInsightsDemo"));
export const TenderManagementDemo = lazy(() => import("@/components/demos/TenderManagementDemo"));
export const ConsultantDecisionSupportDemo = lazy(() => import("@/components/demos/ConsultantDecisionSupportDemo"));
export const PurchaseBillIntakeDemo = lazy(() => import("@/components/demos/PurchaseBillIntakeDemo"));
export const TechnicalReportAgentDemo = lazy(() => import("@/components/demos/TechnicalReportAgentDemo"));
export const VendorComplianceDemo = lazy(() => import("@/components/demos/vendor-compliance"));
export const AlfredBIDDemo = lazy(() => import("@/components/demos/AlfredBIDDemo"));
export const TimberFlooringQuoteDemo = lazy(() => import("@/components/demos/TimberFlooringQuoteDemo"));
export const DrawingsToEstimateDemo = lazy(() => import("@/components/demos/DrawingsToEstimateDemo"));
export const EmailTriageDemo = lazy(() => import("@/components/demos/EmailTriageDemo"));
export const ClashRevisionGuardDemo = lazy(() => import("@/components/demos/ClashRevisionGuardDemo"));
export const PreStageQAGateDemo = lazy(() => import("@/components/demos/PreStageQAGateDemo"));
export const FieldToOfficeLoopDemo = lazy(() => import("@/components/demos/FieldToOfficeLoopDemo"));
export const TenderBidCompletionDemo = lazy(() => import("@/components/demos/TenderBidCompletionDemo"));
export const RfpComplianceScoringDemo = lazy(() => import("@/components/demos/RfpComplianceScoringDemo"));
export const PurchaseOrderToSalesOrderDemo = lazy(() => import("@/components/demos/PurchaseOrderToSalesOrderDemo"));

export const ITEMS_PER_PAGE = 12;

export interface DemoCategory {
  id: string;
  label: string;
}

export const demoCategories: DemoCategory[] = [
  { id: "all", label: "All Demos" },
  { id: "construction", label: "Construction" },
  { id: "bidding", label: "Bid Management" },
  { id: "inspection", label: "Site Inspection" },
  { id: "operations", label: "Operations" },
  { id: "procurement", label: "Procurement" },
  { id: "property", label: "Property Mgmt" },
  { id: "finance", label: "Finance" },
  { id: "sales", label: "Sales" },
  { id: "workflow", label: "Workflow Builder" },
  { id: "events", label: "Events" },
  { id: "insurance", label: "Insurance" },
  { id: "knowledge", label: "Knowledge" },
  { id: "recruitment", label: "Recruitment" },
  { id: "cx", label: "Customer Experience" },
  { id: "butler", label: "Butler" },
  { id: "healthcare", label: "Healthcare" },
  { id: "voice", label: "Voice AI" },
  { id: "marketplace", label: "Marketplace" },
  { id: "proposals", label: "Proposals" },
  { id: "contracts", label: "Contracts" },
  { id: "partnerships", label: "Partnerships" },
  { id: "legal", label: "Legal" },
];

export interface Demo {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  thumbnail: string;
  icon: LucideIcon;
  featured: boolean;
  topics: string[];
  isInteractive: boolean;
  dateAdded: string; // ISO date for sorting (not displayed)
}

const demosUnsorted: Demo[] = [
  {
    id: "automated-tender-bid-completion",
    title: "Automated Tender & Bid Form Completion",
    description: "Turn empty tender forms into submission-ready documents. Alfred extracts every required field, auto-populates company info, insurance, and credentials from your governed knowledge base, then produces a clear gap report for anything missing — and regenerates instantly when data changes.",
    category: "bidding",
    duration: "Interactive",
    thumbnail: tenderBidCompletionThumb,
    icon: FileCheck2,
    featured: true,
    topics: ["Tendering", "Document AI", "Knowledge Base", "Auto-Fill", "Construction"],
    isInteractive: true,
    dateAdded: "2026-06-02",
  },
  {
    id: "rfp-compliance-bid-recommendation",
    title: "RFP Compliance Scoring & Go/No-Go",
    description: "Score every RFP requirement against your real capabilities. Alfred parses the requirements, matches met / partial / not-met status from your knowledge base, calculates a weighted compliance score, and delivers a defensible Go / No-Go recommendation that recalculates the moment inputs change.",
    category: "bidding",
    duration: "Interactive",
    thumbnail: rfpComplianceScoringThumb,
    icon: ClipboardCheck,
    featured: true,
    topics: ["RFP", "Compliance", "Scoring", "Go/No-Go", "Decision Support"],
    isInteractive: true,
    dateAdded: "2026-06-02",
  },
  {
    id: "purchase-order-to-sales-order",
    title: "Purchase Order to ERP Sales Order",
    description: "Process inbound purchase orders in any format — PDF, Excel, scanned image, or email. Alfred extracts and maps line items to your ERP codes, auto-approves clean orders, routes exceptions for review, and posts a validated sales order with a full audit trail.",
    category: "procurement",
    duration: "Interactive",
    thumbnail: purchaseOrderSalesOrderThumb,
    icon: PackageCheck,
    featured: false,
    topics: ["Order Processing", "ERP Integration", "Document AI", "Exception Handling", "Automation"],
    isInteractive: true,
    dateAdded: "2026-06-02",
  },
  {
    id: "clash-revision-guard",
    title: "Clash & Revision Guard",
    description: "Cut construction rework at the source. Alfred cross-checks your latest drawings, specs and RFIs to flag clashes and superseded revisions — then places a hold before crews build off outdated information.",
    category: "construction",
    duration: "Interactive",
    thumbnail: clashRevisionGuardThumb,
    icon: Layers,
    featured: false,
    topics: ["Clash Detection", "Document AI", "Revision Control", "Construction", "Human-in-the-Loop"],
    isInteractive: true,
    dateAdded: "2026-05-30",
  },
  {
    id: "pre-stage-qa-gate",
    title: "Pre-Stage QA Gate",
    description: "Stop defects before they're covered up. AI-guided inspection checklists with photo verification must pass before a stage (pre-pour, pre-install, pre-cover) can proceed — catching rework early.",
    category: "inspection",
    duration: "Interactive",
    thumbnail: preStageQaGateThumb,
    icon: ClipboardCheck,
    featured: false,
    topics: ["QA Inspection", "AI Vision", "Defect Detection", "Compliance", "Construction"],
    isInteractive: true,
    dateAdded: "2026-05-30",
  },
  {
    id: "field-to-office-loop",
    title: "Field-to-Office Change Loop",
    description: "Close the loop on site issues fast. Alfred captures a field problem, links it to the affected drawing, drafts and routes the RFI, then pushes the re-issued revision back to the crew — so no one builds off outdated info.",
    category: "construction",
    duration: "Interactive",
    thumbnail: fieldToOfficeLoopThumb,
    icon: RefreshCw,
    featured: false,
    topics: ["RFI Management", "Field-to-Office", "Change Management", "Construction", "Real-time"],
    isInteractive: true,
    dateAdded: "2026-05-30",
  },
  {
    id: "email-triage",
    title: "AI Email Triage – Pre-Sales & Enquiry Routing",
    description: "Watch alfred ai automatically classify, prioritise, and route incoming pre-sales enquiries. Detects intent, sentiment, urgency, and key entities — then drafts responses and assigns to the right team member in real time.",
    category: "sales",
    duration: "Interactive",
    thumbnail: emailTriageThumb,
    icon: Mail,
    featured: true,
    topics: ["Email AI", "Lead Routing", "Pre-Sales", "Sentiment Analysis", "Auto-Response"],
    isInteractive: true,
    dateAdded: "2026-03-31",
  },
  {
    id: "alfred-bid",
    title: "AlfredBID – AI Bid Management",
    description: "AI-powered bid workspace: opportunity capture with Pwin scoring, document extraction from tender specs, and strategy ideation with accept/reject synthesis. Built for bid teams that want to win more.",
    category: "construction",
    duration: "Interactive",
    thumbnail: alfredBidThumb,
    icon: Target,
    featured: true,
    topics: ["Tendering", "Document AI", "AI-Guided", "Construction", "Scoring"],
    isInteractive: true,
    dateAdded: "2026-03-01",
  },
  {
    id: "vendor-compliance",
    title: "AI Vendor Compliance Agent",
    description: "Automate subcontractor document tracking at scale. AI-powered email intake, document verification, multi-channel reminders (SMS, Voice, Email), and real-time compliance dashboards with traffic light status.",
    category: "construction",
    duration: "Interactive",
    thumbnail: vendorComplianceThumb,
    icon: Shield,
    featured: true,
    topics: ["Compliance", "Document AI", "Multi-channel", "High-Volume", "Construction"],
    isInteractive: true,
    dateAdded: "2025-02-06",
  },
  {
    id: "drawings-to-estimate",
    title: "From Drawings to Draft Estimate",
    description: "Human + AI workflow for construction estimating. Upload drawings and schedules, confirm scope, and watch AI accelerate everything from extraction to revision-ready estimates.",
    category: "construction",
    duration: "Interactive",
    thumbnail: drawingsToEstimateThumb,
    icon: FileStack,
    featured: true,
    topics: ["Estimating", "Human-in-the-Loop", "Construction", "Drawings", "Schedules"],
    isInteractive: true,
    dateAdded: "2025-01-29",
  },
  {
    id: "technical-report-agent",
    title: "AI Technical Report Agent",
    description: "Automate technical report generation with AI-powered data ingestion, pattern analysis, compliance verification, and professional report synthesis from field data and inspections.",
    category: "operations",
    duration: "Interactive",
    thumbnail: technicalReportThumb,
    icon: FileBarChart,
    featured: false,
    topics: ["AI-Guided", "Compliance", "Insights", "Document Search", "Synthesis"],
    isInteractive: true,
    dateAdded: "2025-01-29",
  },
  {
    id: "purchase-bill-intake",
    title: "AI Purchase Bill Intake",
    description: "Process subcontractor and supplier invoices with AI extraction, matching, discrepancy detection, and Xero sync. High-volume accounts payable with intelligent triage.",
    category: "finance",
    duration: "Interactive",
    thumbnail: purchaseBillThumb,
    icon: FileStack,
    featured: false,
    topics: ["AP Automation", "Xero Integration", "Discrepancy Detection", "Batch Processing"],
    isInteractive: true,
    dateAdded: "2025-01-21",
  },
  {
    id: "consultant-decision-support",
    title: "Business Consultant Pre-Engagement & Fee Proposal Support",
    description: "Internal tool for structured pre-engagement assessment. Forces clarity, exposes hidden complexity, and protects delivery margins.",
    category: "operations",
    duration: "Interactive",
    thumbnail: consultantDecisionThumb,
    icon: Scale,
    featured: false,
    topics: ["Consulting", "Risk Analysis", "Pricing", "Operations"],
    isInteractive: true,
    dateAdded: "2025-01-20",
  },
  {
    id: "tender-management",
    title: "Tender Management",
    description: "Complete RFQ/RFP lifecycle from generation to award with supplier portal submission, bid comparison, and automated notifications.",
    category: "procurement",
    duration: "Interactive",
    thumbnail: tenderManagementThumb,
    icon: FileStack,
    featured: false,
    topics: ["Tendering", "Supplier Matching", "Contract Automation", "Scoring"],
    isInteractive: true,
    dateAdded: "2025-01-15",
  },
  {
    id: "ai-crm-insights",
    title: "AI CRM Insights Engine",
    description: "Intelligent CRM with automatic lead enrichment, predictive scoring, activity suggestions, and deal forecasting. Turn raw leads into actionable insights with AI.",
    category: "sales",
    duration: "Interactive",
    thumbnail: crmInsightsThumb,
    icon: Target,
    featured: false,
    topics: ["Lead Research", "CRM Integration", "AI Scoring", "Insights"],
    isInteractive: true,
    dateAdded: "2025-01-12",
  },
  {
    id: "smart-warehouse",
    title: "Smart Warehouse Operations",
    description: "Visual warehouse management with AI-powered wave planning, route optimization, and batch picking. See how AI reduces picking time by 40% with smart order batching.",
    category: "operations",
    duration: "Interactive",
    thumbnail: smartWarehouseThumb,
    icon: Package,
    featured: false,
    topics: ["Inventory Management", "Workflow Automation", "AI-Guided", "Route Optimization"],
    isInteractive: true,
    dateAdded: "2025-01-10",
  },
  {
    id: "smart-quote-builder",
    title: "Smart Quote Builder",
    description: "AI-powered quotation system that receives RFQs, matches products intelligently, applies dynamic pricing rules, and generates professional proposals with interactive editing.",
    category: "sales",
    duration: "Interactive",
    thumbnail: smartQuoteThumb,
    icon: FileText,
    featured: false,
    topics: ["Quotation", "AI-Guided", "Pricing", "Proposals"],
    isInteractive: true,
    dateAdded: "2025-01-08",
  },
  {
    id: "event-seating",
    title: "Event Seating with AI Assist",
    description: "AI-powered event seating planner for venues and conferences. Interactive floor plan canvas with drag-and-drop table positioning, smart guest assignment, and AI recommendations for optimal seating.",
    category: "events",
    duration: "Interactive",
    thumbnail: eventSeatingThumb,
    icon: Users,
    featured: false,
    topics: ["Event Planning", "Seating", "AI-Guided", "Drag-and-Drop"],
    isInteractive: true,
    dateAdded: "2025-01-05",
  },
  {
    id: "trades-platform",
    title: "TradeFlow OS - Smart Trades Platform",
    description: "Complete business automation for painters and trades. AI-powered quotation with image analysis for surface area estimation, instant quotes, online booking, and secure deposit payments.",
    category: "construction",
    duration: "Interactive",
    thumbnail: tradesPlatformThumb,
    icon: Paintbrush,
    featured: false,
    topics: ["Quotation", "AI Vision", "Payments", "Booking", "Customer Portal"],
    isInteractive: true,
    dateAdded: "2025-01-26",
  },
  {
    id: "timber-flooring-quote",
    title: "AI Timber Flooring Quote Builder",
    description: "Experience how AlfredFloors uses AI vision to measure floors from photos, assess timber condition, auto-price from rate cards, and generate instant quotes with online booking — no site visit required.",
    category: "construction",
    duration: "Interactive",
    thumbnail: timberFlooringThumb,
    icon: TreePine,
    featured: false,
    topics: ["Quotation", "AI Vision", "Pricing", "Booking", "Customer Portal"],
    isInteractive: true,
    dateAdded: "2026-03-16",
  },
  {
    id: "law-firm-os",
    title: "Law Firm Operating System",
    description: "AI-powered legal operations platform for accountability, case management, and embedded AI assistance. Built for managing partners and senior associates who demand visibility into firm operations.",
    category: "legal",
    duration: "Interactive",
    thumbnail: lawFirmThumb,
    icon: Scale,
    featured: false,
    topics: ["Legal Operations", "Accountability", "AI-Assisted", "Case Management", "Trust Scoring"],
    isInteractive: true,
    dateAdded: "2024-12-22",
  },
  {
    id: "voice-operations",
    title: "Voice AI Operations Agent",
    description: "See how alfred ai handles thousands of concurrent calls — routing, resolving, escalating, and executing follow-up actions automatically.",
    category: "voice",
    duration: "Interactive",
    thumbnail: voiceOperationsThumb,
    icon: Mic,
    featured: false,
    topics: ["High-Volume Calls", "Concurrent Processing", "After-Call Automation", "Human Escalation"],
    isInteractive: true,
    dateAdded: "2024-12-18",
  },
  {
    id: "inventory-asset-tracking",
    title: "Inventory & Asset Tracking Agent",
    description: "See how alfred ai tracks assets and inventory in real time — logging movements, detecting issues, and keeping teams accountable without spreadsheets.",
    category: "operations",
    duration: "Interactive",
    thumbnail: inventoryTrackingThumb,
    icon: Package,
    featured: false,
    topics: ["Asset Tracking", "Inventory Management", "Human-in-the-Loop", "Audit Trail"],
    isInteractive: true,
    dateAdded: "2024-12-15",
  },
  {
    id: "rfi-management",
    title: "RFI Management Agent",
    description: "See how alfred ai handles RFIs received from Procore or similar project platforms — classifying, drafting, tracking, and escalating with full accountability and traceability.",
    category: "construction",
    duration: "Interactive",
    thumbnail: rfiManagementThumb,
    icon: HardHat,
    featured: false,
    topics: ["RFI Management", "Procore Integration", "Accountability", "Audit Trail"],
    isInteractive: true,
    dateAdded: "2025-01-25",
  },
  {
    id: "invoice-processing",
    title: "AI Invoice Processing Agent",
    description: "See how alfred ai processes invoices end-to-end — from email to approval to accounting system — with full traceability and human control.",
    category: "finance",
    duration: "Interactive",
    thumbnail: invoiceProcessingThumb,
    icon: Receipt,
    featured: false,
    topics: ["AP Automation", "Invoice Processing", "Audit Trail", "Human-in-the-Loop"],
    isInteractive: true,
    dateAdded: "2024-12-08",
  },
  {
    id: "business-matchmaker",
    title: "Business Match Maker",
    description: "AI-powered matching system that connects businesses, founders, and professionals with the right people — focused on fit, intent, and mutual value, not volume.",
    category: "partnerships",
    duration: "Interactive",
    thumbnail: businessMatchmakerThumb,
    icon: Handshake,
    featured: false,
    topics: ["Business Matching", "Strategic Partnerships", "AI Scoring"],
    isInteractive: true,
    dateAdded: "2024-12-05",
  },
  {
    id: "insurance-broker",
    title: "Insurance Broker AI Automation",
    description: "EBITDA-moving AI for billion-dollar brokers: lead scoring, policy comparison, claims triage, compliance monitoring, and strategic portfolio intelligence.",
    category: "insurance",
    duration: "Interactive",
    thumbnail: insuranceBrokerThumb,
    icon: Building2,
    featured: false,
    topics: ["Insurance", "Revenue", "Compliance", "Claims", "Analytics"],
    isInteractive: true,
    dateAdded: "2024-12-01",
  },
  {
    id: "patient-engagement",
    title: "Patient Booking & Engagement",
    description: "AI-powered patient booking, automated multi-channel reminders, no-show recovery, and proactive wellness check-ins to boost turn-up rates and reduce churn.",
    category: "healthcare",
    duration: "Interactive",
    thumbnail: patientBookingThumb,
    icon: Heart,
    featured: false,
    topics: ["Patient Booking", "Reminders", "Retention", "Healthcare"],
    isInteractive: true,
    dateAdded: "2024-11-28",
  },
  {
    id: "interview-scoring",
    title: "Interview Scoring Agent",
    description: "AI analysis of interview recordings with automated scoring, bias checking, candidate comparison, and hiring recommendation reports.",
    category: "recruitment",
    duration: "Interactive",
    thumbnail: interviewScoringThumb,
    icon: ClipboardCheck,
    featured: false,
    topics: ["Interview Analysis", "Scoring", "Hiring Decisions"],
    isInteractive: true,
    dateAdded: "2024-11-25",
  },
  {
    id: "auto-invoicing",
    title: "Auto Invoicing & Reminders",
    description: "Automated invoice generation, smart payment reminders based on client history, overdue chase sequences, and cash flow forecasting.",
    category: "finance",
    duration: "Interactive",
    thumbnail: autoInvoicingThumb,
    icon: Receipt,
    featured: false,
    topics: ["Invoicing", "Payment Reminders", "Cash Flow"],
    isInteractive: true,
    dateAdded: "2024-11-22",
  },
  {
    id: "lead-research",
    title: "Lead Research & Acquisition",
    description: "AI-powered prospecting that researches leads across LinkedIn, news, and databases. Enriches data, scores prospects, and generates personalized outreach sequences.",
    category: "sales",
    duration: "Interactive",
    thumbnail: leadResearchThumb,
    icon: Target,
    featured: false,
    topics: ["Lead Research", "Outreach Automation", "CRM Integration"],
    isInteractive: true,
    dateAdded: "2024-11-18",
  },
  {
    id: "candidate-match",
    title: "AI Candidate Matchmaker",
    description: "Instant candidate matching combining recruitment suitability with migration eligibility. CV parsing, visa checks, ranked shortlists with explanations.",
    category: "recruitment",
    duration: "Interactive",
    thumbnail: candidateMatchThumb,
    icon: Users,
    featured: false,
    topics: ["Visa Matching", "CV Parsing", "Migration Intelligence"],
    isInteractive: true,
    dateAdded: "2024-11-15",
  },
  {
    id: "procurement",
    title: "AI Procurement Manager",
    description: "End-to-end procurement automation: AI supplier matching, tender generation, bid evaluation, contract signing, and project activation. Typical 15% savings.",
    category: "procurement",
    duration: "Interactive",
    thumbnail: procurementManagerThumb,
    icon: ShoppingCart,
    featured: false,
    topics: ["Supplier Matching", "Tendering", "Contract Automation"],
    isInteractive: true,
    dateAdded: "2024-11-10",
  },
  {
    id: "site-inspection",
    title: "AI Site Inspection Module",
    description: "Digitize site inspections with AI-powered defect detection, photo analysis, auto-generated reports, and GPS-stamped documentation.",
    category: "inspection",
    duration: "Interactive",
    thumbnail: siteInspectionThumb,
    icon: ClipboardCheck,
    featured: false,
    topics: ["AI Vision", "Defect Detection", "Reporting"],
    isInteractive: true,
    dateAdded: "2025-01-24",
  },
  {
    id: "contract-review",
    title: "AI Contract Review Copilot",
    description: "AI-enhanced contract analysis with clause comparison, risk detection, stakeholder mapping, and Figma-style collaboration.",
    category: "contracts",
    duration: "Interactive",
    thumbnail: contractReviewThumb,
    icon: FileSearch,
    featured: false,
    topics: ["Legal", "Risk Analysis", "Collaboration"],
    isInteractive: true,
    dateAdded: "2024-10-28",
  },
  {
    id: "fee-proposal",
    title: "Fee Proposal Automation",
    description: "End-to-end proposal workflow: email intake, AI drafting, CRM integration, stakeholder commenting, tracking, and auto-invoicing.",
    category: "proposals",
    duration: "Interactive",
    thumbnail: feeProposalThumb,
    icon: FileText,
    featured: false,
    topics: ["Proposals", "CRM", "Automation"],
    isInteractive: true,
    dateAdded: "2024-10-22",
  },
  {
    id: "subcontractor-assignment",
    title: "Subcontractor Assignment (BOTO)",
    description: "AI-powered subcontractor assignment with project brief activation and workflow setup via Accountable.link. Voice or text-based coordination.",
    category: "construction",
    duration: "Interactive",
    thumbnail: subcontractorAssignmentThumb,
    icon: HardHat,
    featured: false,
    topics: ["Construction", "Workflow", "Accountable.link"],
    isInteractive: true,
    dateAdded: "2025-01-23",
  },
  {
    id: "property-management",
    title: "Property Management Voice Agent",
    description: "Complete voice agent workflow for property managers. Handle leasing, maintenance, arrears, renewals, emergencies, and owner updates with AI.",
    category: "property",
    duration: "Interactive",
    thumbnail: propertyManagementThumb,
    icon: Building2,
    featured: false,
    topics: ["Voice AI", "Property Management", "Workflow Automation"],
    isInteractive: true,
    dateAdded: "2024-10-08",
  },
  {
    id: "marketplace",
    title: "Integration Marketplace Demo",
    description: "Explore our extensive marketplace of 5,000+ integrations. Connect your favourite tools and extend alfred ai's capabilities instantly.",
    category: "marketplace",
    duration: "Interactive",
    thumbnail: marketplaceThumb,
    icon: LayoutGrid,
    featured: false,
    topics: ["Integrations", "APIs", "Connectors"],
    isInteractive: true,
    dateAdded: "2024-10-01",
  },
  {
    id: "voice-agent",
    title: "Voice Agent Interactive Demo",
    description: "Experience real-time AI voice conversation. Talk naturally with our AI agent and see the power of conversational AI firsthand.",
    category: "voice",
    duration: "Live",
    thumbnail: voiceAgentThumb,
    icon: Mic,
    featured: false,
    topics: ["Voice AI", "Real-time", "Interactive"],
    isInteractive: true,
    dateAdded: "2024-09-25",
  },
  {
    id: "knowledge-synthesis",
    title: "Knowledge Synthesis & Insights",
    description: "Watch AI connect dots across thousands of documents to surface hidden insights and generate executive summaries.",
    category: "knowledge",
    duration: "Interactive",
    thumbnail: knowledgeSynthesisThumb,
    icon: Brain,
    featured: false,
    topics: ["Synthesis", "Insights", "Summaries"],
    isInteractive: true,
    dateAdded: "2024-09-18",
  },
  {
    id: "butler-voice",
    title: "Butler On The Go Demo",
    description: "Voice-enabled AI assistant for busy professionals. Schedule meetings, manage tasks, and get updates – all through natural conversation.",
    category: "butler",
    duration: "Interactive",
    thumbnail: butlerVoiceThumb,
    icon: Bot,
    featured: false,
    topics: ["Voice AI", "Scheduling", "Task Management"],
    isInteractive: true,
    dateAdded: "2024-09-10",
  },
  {
    id: "customer-experience",
    title: "Customer Experience Demo",
    description: "AI-powered customer service that understands context, sentiment, and history. Deliver consistent, personalised responses across all channels.",
    category: "cx",
    duration: "Interactive",
    thumbnail: customerExperienceThumb,
    icon: MessageSquare,
    featured: false,
    topics: ["Multi-channel", "Sentiment Analysis", "Personalisation"],
    isInteractive: true,
    dateAdded: "2024-09-01",
  },
  {
    id: "business-operations",
    title: "Business Operations Demo",
    description: "Automate complex workflows, track accountability, and scale operations. See invoice processing, approval workflows, and reporting in action.",
    category: "operations",
    duration: "Interactive",
    thumbnail: businessOperationsThumb,
    icon: Workflow,
    featured: false,
    topics: ["Workflow Automation", "Approvals", "Reporting"],
    isInteractive: true,
    dateAdded: "2024-08-25",
  },
  {
    id: "knowledge-intelligence",
    title: "Knowledge Intelligence Demo",
    description: "See how alfred ai transforms document management and retrieval. Ask questions in natural language and get instant answers with sources.",
    category: "knowledge",
    duration: "Interactive",
    thumbnail: knowledgeIntelligenceThumb,
    icon: Brain,
    featured: false,
    topics: ["Document Search", "Q&A", "Citations"],
    isInteractive: true,
    dateAdded: "2024-08-15",
  },
  {
    id: "workflow-builder",
    title: "No-Code Workflow Builder",
    description: "Any employee can create their own automation workflows with AI guidance. No coding required — AI recommends every step based on your goal.",
    category: "workflow",
    duration: "Interactive",
    thumbnail: workflowBuilderThumb,
    icon: Wand2,
    featured: false,
    topics: ["No-Code", "AI-Guided", "Automation"],
    isInteractive: true,
    dateAdded: "2024-08-01",
  },
];

// Export sorted by dateAdded (newest first)
export const demos = [...demosUnsorted].sort((a, b) => 
  new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
);

// Map demo IDs to their interactive components
export const demoComponents: Record<string, React.ComponentType> = {
  "workflow-builder": WorkflowBuilderDemo,
  "knowledge-intelligence": KnowledgeDemo,
  "business-operations": BusinessOSDemo,
  "customer-experience": CXAgentDemo,
  "butler-voice": ButlerDemo,
  "knowledge-synthesis": KnowledgeSynthesisDemo,
  "voice-agent": VoiceAgentDemo,
  "marketplace": MarketplaceDemo,
  "property-management": PropertyManagementDemo,
  "subcontractor-assignment": SubcontractorAssignmentDemo,
  "fee-proposal": FeeProposalDemo,
  "contract-review": ContractReviewDemo,
  "site-inspection": SiteInspectionDemo,
  "procurement": ProcurementDemo,
  "candidate-match": CandidateMatchDemo,
  "lead-research": LeadResearchDemo,
  "auto-invoicing": AutoInvoicingDemo,
  "interview-scoring": InterviewScoringDemo,
  "patient-engagement": PatientEngagementDemo,
  "insurance-broker": InsuranceBrokerDemo,
  "business-matchmaker": BusinessMatchMakerDemo,
  "invoice-processing": InvoiceProcessingDemo,
  "rfi-management": RFIManagementDemo,
  "inventory-asset-tracking": InventoryAssetTrackingDemo,
  "voice-operations": VoiceOperationsDemo,
  "law-firm-os": LawFirmOSDemo,
  "trades-platform": TradesPlatformDemo,
  "event-seating": EventSeatingDemo,
  "smart-quote-builder": SmartQuoteBuilderDemo,
  "smart-warehouse": SmartWarehouseDemo,
  "ai-crm-insights": AICRMInsightsDemo,
  "tender-management": TenderManagementDemo,
  "consultant-decision-support": ConsultantDecisionSupportDemo,
  "purchase-bill-intake": PurchaseBillIntakeDemo,
  "technical-report-agent": TechnicalReportAgentDemo,
  "vendor-compliance": VendorComplianceDemo,
  "alfred-bid": AlfredBIDDemo,
  "timber-flooring-quote": TimberFlooringQuoteDemo,
  "drawings-to-estimate": DrawingsToEstimateDemo,
  "email-triage": EmailTriageDemo,
  "clash-revision-guard": ClashRevisionGuardDemo,
  "pre-stage-qa-gate": PreStageQAGateDemo,
  "field-to-office-loop": FieldToOfficeLoopDemo,
  "automated-tender-bid-completion": TenderBidCompletionDemo,
  "rfp-compliance-bid-recommendation": RfpComplianceScoringDemo,
  "purchase-order-to-sales-order": PurchaseOrderToSalesOrderDemo,
};

// Business function categories for legend
export interface BusinessCategory {
  name: string;
  color: "rose" | "violet" | "emerald" | "amber" | "teal" | "indigo" | "sky" | "orange" | "slate";
  icon: LucideIcon;
  description: string;
}

export const businessCategories: BusinessCategory[] = [
  { name: "Sales", color: "rose", icon: Briefcase, description: "Lead generation, outreach, CRM" },
  { name: "Marketing", color: "violet", icon: Megaphone, description: "Personalisation, channels, sentiment" },
  { name: "Operations", color: "emerald", icon: Settings, description: "Workflows, automation, approvals" },
  { name: "Finance", color: "amber", icon: DollarSign, description: "Invoicing, analytics, reporting" },
  { name: "Service/Delivery", color: "teal", icon: HeadphonesIcon, description: "Customer service, healthcare" },
  { name: "Recruiting", color: "indigo", icon: UserCheck, description: "Hiring, interviews, visa matching" },
  { name: "Strategy/Intelligence", color: "sky", icon: Lightbulb, description: "AI insights, synthesis, compliance" },
  { name: "Technology/Platform", color: "orange", icon: Cpu, description: "Integrations, APIs, voice AI" },
  { name: "Procurement", color: "slate", icon: Package, description: "Suppliers, tendering, contracts" },
];

// Map topics to colored badge variants by business function
export type TopicVariant = "emerald" | "violet" | "amber" | "sky" | "rose" | "teal" | "indigo" | "orange" | "slate" | "secondary";

export const topicVariants: Record<string, TopicVariant> = {
  // SALES (Rose)
  "Lead Research": "rose",
  "Outreach Automation": "rose",
  "CRM": "rose",
  "CRM Integration": "rose",
  "Proposals": "rose",
  // MARKETING (Violet)
  "Personalisation": "violet",
  "Multi-channel": "violet",
  "Sentiment Analysis": "violet",
  // OPERATIONS (Emerald)
  "Workflow": "emerald",
  "Workflow Automation": "emerald",
  "Automation": "emerald",
  "No-Code": "emerald",
  "Approvals": "emerald",
  "Scheduling": "emerald",
  "Task Management": "emerald",
  "Asset Tracking": "emerald",
  "Inventory Management": "emerald",
  "Human-in-the-Loop": "emerald",
  "Accountability": "emerald",
  // FINANCE (Amber)
  "Invoicing": "amber",
  "Payment Reminders": "amber",
  "Cash Flow": "amber",
  "Revenue": "amber",
  "Analytics": "amber",
  "Reporting": "amber",
  "AP Automation": "amber",
  "Xero Integration": "amber",
  "Discrepancy Detection": "amber",
  "Batch Processing": "amber",
  "Invoice Processing": "amber",
  "Audit Trail": "amber",
  // SERVICE/DELIVERY (Teal)
  "Patient Booking": "teal",
  "Reminders": "teal",
  "Retention": "teal",
  "Collaboration": "teal",
  "Healthcare": "teal",
  "Property Management": "teal",
  // RECRUITING (Indigo)
  "Visa Matching": "indigo",
  "CV Parsing": "indigo",
  "Migration Intelligence": "indigo",
  "Interview Analysis": "indigo",
  "Scoring": "indigo",
  "Hiring Decisions": "indigo",
  // STRATEGY/INTELLIGENCE (Sky)
  "AI-Guided": "sky",
  "AI Vision": "sky",
  "Synthesis": "sky",
  "Insights": "sky",
  "Summaries": "sky",
  "Document Search": "sky",
  "Q&A": "sky",
  "Citations": "sky",
  "Risk Analysis": "sky",
  "Compliance": "sky",
  "Claims": "sky",
  "Insurance": "sky",
  // TECHNOLOGY/PLATFORM (Orange)
  "Integrations": "orange",
  "APIs": "orange",
  "Connectors": "orange",
  "Accountable.link": "orange",
  "Real-time": "orange",
  "Interactive": "orange",
  "Voice AI": "orange",
  "High-Volume Calls": "orange",
  "Concurrent Processing": "orange",
  "After-Call Automation": "emerald",
  "Human Escalation": "amber",
  "Procore Integration": "orange",
  // PROCUREMENT/SUPPLY CHAIN (Slate)
  "Supplier Matching": "slate",
  "Tendering": "slate",
  "Contract Automation": "slate",
  "Construction": "slate",
  "Defect Detection": "slate",
  "Legal": "slate",
  "RFI Management": "slate",
  // EMAIL / PRE-SALES (Rose - aligned with Sales)
  "Email AI": "rose",
  "Lead Routing": "rose",
  "Pre-Sales": "rose",
  "Auto-Response": "orange",
  // PARTNERSHIPS (Rose - aligned with Sales)
  "Business Matching": "rose",
  "Strategic Partnerships": "rose",
  "AI Scoring": "sky",
  // LEGAL OPS
  "Legal Operations": "slate",
  "Case Management": "slate",
  "Trust Scoring": "amber",
  // TRADES PLATFORM
  "Quotation": "amber",
  "Pricing": "amber",
  "Consulting": "emerald",
  // WAREHOUSE/LOGISTICS
  "Route Optimization": "emerald",
  "Booking": "emerald",
  "Customer Portal": "teal",
  "Payments": "amber",
};

// Helper to get topics for a business function
export const getTopicsForBusinessFunction = (businessFunction: string): string[] => {
  return Object.entries(topicVariants)
    .filter(([_, color]) => {
      const category = businessCategories.find(c => c.color === color);
      return category?.name === businessFunction;
    })
    .map(([topic]) => topic);
};
