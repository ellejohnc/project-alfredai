/**
 * Demo-Engine Sync Utility
 * 
 * This file creates a single source of truth for engine metadata by deriving it
 * from demosData.ts. When new demos are added, they automatically become available
 * in the SolutionFinder component.
 * 
 * HOW TO ADD A NEW DEMO:
 * 1. Add the demo to demosData.ts as usual
 * 2. Add an entry to DEMO_TO_ENGINE_MAP below with:
 *    - key: the demo ID from demosData.ts
 *    - value: the display name you want in SolutionFinder
 * 3. The engine will automatically appear in SolutionFinder with correct icon/description
 * 
 * The system will also track unmapped demos and log warnings in development.
 */

import { demos, type Demo } from "@/pages/resources/demosData";
import { 
  Brain, MessageSquare, Mic, FileSearch, Building2, ClipboardCheck, 
  Receipt, Home, Search, Workflow, Bot, ShoppingCart, UserCheck, Users, 
  Heart, Package, Handshake, Scale, Paintbrush, FileText, Target, 
  Sparkles, Wand2, LayoutGrid, Shield, FileStack,
  type LucideIcon 
} from "lucide-react";

/**
 * Maps demo IDs to their display names in SolutionFinder.
 * This is the ONLY place you need to update when adding new demos.
 */
export const DEMO_TO_ENGINE_MAP: Record<string, string> = {
  // Core engines
  "knowledge-intelligence": "Knowledge Management",
  "business-operations": "Business Operating System",
  "customer-experience": "Customer Experience",
  "butler-voice": "Butler On The Go",
  "voice-agent": "Voice Agent",
  "workflow-builder": "Workflow Builder",
  "marketplace": "AI Marketplace",
  
  // Document & Contract
  "site-inspection": "Site Inspection",
  "contract-review": "Contract Review",
  "fee-proposal": "Fee Proposal",
  
  // Finance
  "auto-invoicing": "Auto Invoicing",
  "invoice-processing": "Invoice Processing",
  "purchase-bill-intake": "Purchase Bill Intake",
  
  // Property & Construction
  "property-management": "Property Management",
  "subcontractor-assignment": "Subcontractor Assignment",
  "rfi-management": "RFI Management",
  
  // Sales & CRM
  "lead-research": "Lead Research",
  "ai-crm-insights": "CRM Insights",
  "smart-quote-builder": "Smart Quote Builder",
  
  // Procurement & Operations
  "procurement": "Procurement",
  "inventory-asset-tracking": "Inventory Tracking",
  "smart-warehouse": "Smart Warehouse",
  
  // HR & Recruitment
  "interview-scoring": "Interview Scoring",
  "candidate-match": "Candidate Match",
  
  // Healthcare
  "patient-engagement": "Patient Engagement",
  
  // Insurance
  "insurance-broker": "Insurance Broker",
  
  // Partnerships
  "business-matchmaker": "Business Match Maker",
  
  // Legal
  "law-firm-os": "Law Firm OS",
  
  // Trades
  "trades-platform": "Trades Platform",
  
  // Events
  "event-seating": "Event Seating",
  
  // Voice
  "voice-operations": "Voice Operations",
  
  // Knowledge
  "knowledge-synthesis": "Knowledge Synthesis",
  
  // New demos
  "vendor-compliance": "Vendor Compliance",
  "technical-report-agent": "Technical Report Agent",
  "drawings-to-estimate": "Drawings to Estimate",
  "timber-flooring-quote": "Timber Flooring Quote",
  "consultant-decision-support": "Consultant Decision Support",
  "tender-management": "Tender Management",
  "alfred-bid": "AlfredBID",
  "email-triage": "Email Triage",
};

/**
 * Icon overrides for engines that need a different icon than their demo.
 * If not specified, uses the demo's icon from demosData.ts.
 */
const ICON_OVERRIDES: Record<string, LucideIcon> = {
  "Knowledge Management": Brain,
  "Business Operating System": Building2,
  "Customer Experience": MessageSquare,
  "Butler On The Go": Bot,
  "Voice Agent": Mic,
  "Workflow Builder": Workflow,
  "AI Marketplace": Sparkles,
  "Site Inspection": ClipboardCheck,
  "Contract Review": FileSearch,
  "Fee Proposal": FileSearch,
  "Auto Invoicing": Receipt,
  "Invoice Processing": Receipt,
  "Purchase Bill Intake": Receipt,
  "Property Management": Home,
  "Subcontractor Assignment": Building2,
  "RFI Management": ClipboardCheck,
  "Lead Research": Search,
  "CRM Insights": Target,
  "Smart Quote Builder": FileText,
  "Procurement": ShoppingCart,
  "Inventory Tracking": Package,
  "Smart Warehouse": Package,
  "Interview Scoring": UserCheck,
  "Candidate Match": Users,
  "Patient Engagement": Heart,
  "Insurance Broker": Building2,
  "Business Match Maker": Handshake,
  "Law Firm OS": Scale,
  "Trades Platform": Paintbrush,
  "Event Seating": Users,
  "Voice Operations": Mic,
  "Knowledge Synthesis": Brain,
  "Vendor Compliance": Shield,
  "Technical Report Agent": FileText,
  "Drawings to Estimate": FileStack,
  "Timber Flooring Quote": Paintbrush,
  "Consultant Decision Support": Brain,
  "Tender Management": ClipboardCheck,
  "AlfredBID": Target,
  "Email Triage": MessageSquare,
};

/**
 * Description overrides for engines that need a different description.
 * If not specified, uses a shortened version of the demo's description.
 */
const DESCRIPTION_OVERRIDES: Record<string, string> = {
  "Knowledge Management": "Instant answers from your company docs, policies & past projects",
  "Business Operating System": "Real-time dashboards connecting all your business data",
  "Customer Experience": "24/7 AI Assistant handling enquiries and lead qualification",
  "Butler On The Go": "Personal AI assistant for emails, scheduling & admin tasks",
  "Voice Agent": "AI phone agent for calls, bookings & customer support",
  "Workflow Builder": "Custom automations connecting your existing tools",
  "AI Marketplace": "Browse and deploy pre-built AI solutions for your industry",
  "Site Inspection": "Photo to professional report in minutes, not hours",
  "Contract Review": "AI-powered contract analysis catching risks & variations",
  "Fee Proposal": "Generate winning proposals in a fraction of the time",
  "Auto Invoicing": "Automated invoice processing and payment tracking",
  "Invoice Processing": "End-to-end invoice processing with audit trail",
  "Purchase Bill Intake": "High-volume AP with AI extraction, matching & payment scheduling",
  "Property Management": "Tenant communications, maintenance & lease management",
  "Subcontractor Assignment": "Smart matching of subs to projects based on skills & availability",
  "RFI Management": "AI-powered RFI tracking, drafting and escalation",
  "Lead Research": "AI-powered prospect research and qualification",
  "CRM Insights": "AI-powered lead enrichment and predictive scoring",
  "Smart Quote Builder": "AI-powered quotation with dynamic pricing",
  "Procurement": "AI supplier matching, tender generation & bid evaluation",
  "Inventory Tracking": "Real-time asset and inventory management",
  "Smart Warehouse": "Warehouse management with AI route optimization",
  "Interview Scoring": "AI-powered candidate evaluation with consistent scoring criteria",
  "Candidate Match": "Smart matching of candidates to roles based on skills & culture fit",
  "Patient Engagement": "AI booking, reminders, and patient follow-ups",
  "Insurance Broker": "Lead scoring, claims triage, and compliance monitoring",
  "Business Match Maker": "AI-powered business and partner matching",
  "Law Firm OS": "Legal operations, case management, and accountability",
  "Trades Platform": "Smart quotation with AI vision and online booking",
  "Event Seating": "AI-powered event seating and table planning",
  "Voice Operations": "High-volume concurrent call handling at scale",
  "Knowledge Synthesis": "Connect dots across documents to surface hidden insights",
  "Vendor Compliance": "Automate subcontractor document tracking at scale",
  "Technical Report Agent": "AI-powered technical report generation and synthesis",
  "Drawings to Estimate": "Human + AI workflow for construction estimating",
  "Timber Flooring Quote": "AI vision measures floors from photos and generates instant quotes",
  "Consultant Decision Support": "Pre-engagement assessment with risk analysis and fee proposal support",
  "Tender Management": "Complete RFQ/RFP lifecycle from generation to award",
  "AlfredBID": "AI bid workspace with Pwin scoring, tender document extraction & strategy synthesis",
  "Email Triage": "Auto-classify, prioritise and route pre-sales enquiries with drafted responses",
};

export interface EngineMetadata {
  icon: LucideIcon;
  description: string;
  demo: string;
}

/**
 * Generates engine metadata from demosData.ts
 * This is the function that creates the synced data.
 */
export function generateEngineMetadata(): Record<string, EngineMetadata> {
  const engineMetadata: Record<string, EngineMetadata> = {};
  const mappedDemoIds = new Set<string>();
  
  // Process each demo and create engine metadata
  demos.forEach((demo: Demo) => {
    const engineName = DEMO_TO_ENGINE_MAP[demo.id];
    
    if (engineName) {
      mappedDemoIds.add(demo.id);
      
      engineMetadata[engineName] = {
        icon: ICON_OVERRIDES[engineName] || demo.icon,
        description: DESCRIPTION_OVERRIDES[engineName] || truncateDescription(demo.description),
        demo: `/resources/demos?demo=${demo.id}`,
      };
    }
  });
  
  // Log unmapped demos in development
  if (import.meta.env.DEV) {
    const unmappedDemos = demos.filter(d => !mappedDemoIds.has(d.id));
    if (unmappedDemos.length > 0) {
      console.warn(
        `[DemoEngineSync] ${unmappedDemos.length} demos not mapped to engines:`,
        unmappedDemos.map(d => `"${d.id}": "${d.title}"`).join(", "),
        "\nAdd them to DEMO_TO_ENGINE_MAP in src/lib/demoEngineSync.ts"
      );
    }
  }
  
  return engineMetadata;
}

/**
 * Truncates a demo description to a concise engine description.
 */
function truncateDescription(description: string): string {
  // Take the first sentence or first 80 characters
  const firstSentence = description.split('.')[0];
  if (firstSentence.length <= 80) {
    return firstSentence;
  }
  return firstSentence.substring(0, 77) + "...";
}

/**
 * Pre-generated engine metadata for use in SolutionFinder.
 * This is generated at module load time for optimal performance.
 */
export const engineMetadata = generateEngineMetadata();

/**
 * Utility to check sync status between demos and engines.
 * Returns info about mapped and unmapped demos.
 */
export function getSyncStatus() {
  const mappedDemoIds = new Set(Object.keys(DEMO_TO_ENGINE_MAP));
  const allDemoIds = new Set(demos.map(d => d.id));
  
  const unmappedDemos = demos.filter(d => !mappedDemoIds.has(d.id));
  const orphanedMappings = Object.keys(DEMO_TO_ENGINE_MAP).filter(
    id => !allDemoIds.has(id)
  );
  
  return {
    totalDemos: demos.length,
    mappedDemos: demos.length - unmappedDemos.length,
    unmappedDemos: unmappedDemos.map(d => ({ id: d.id, title: d.title })),
    orphanedMappings,
    isSynced: unmappedDemos.length === 0 && orphanedMappings.length === 0,
  };
}
