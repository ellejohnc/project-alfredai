import {
  Target, Users, LineChart, Settings, Briefcase, Headphones,
  Home, ClipboardList, UserCheck, HardHat, LucideIcon,
  Frame, Factory, PaintRoller, Truck, Zap, Wrench
} from "lucide-react";


export interface Role {
  id: string;
  icon: LucideIcon;
  title: string;
  teamSize: string;
  painPoints: string[];
  aiEngines: string[];
  exampleWorkflow: string;
  workflowSteps: string[];
  impactMetric: string;
  relatedDemos: string[];
  caseStudyLink: string;
}

export interface Industry {
  id: string;
  icon: LucideIcon;
  title: string;
  qualifier: string;
  challenges: string[];
  useCases: string[];
  compliance: string;
  impactMetric: string;
  relatedDemos: string[];
  caseStudyLink: string;
}

export const roles: Role[] = [
  {
    id: "ceo",
    icon: Target,
    title: "Founder / CEO",
    teamSize: "Company-wide visibility",
    painPoints: [
      "No visibility into day-to-day execution",
      "Scaling requires linear headcount growth",
      "Key decisions made on incomplete data",
    ],
    aiEngines: ["Knowledge Management", "Business Operating System"],
    exampleWorkflow: "Morning briefing → AI-curated priorities → Execution tracking → End-of-day insights",
    workflowSteps: [
      "AI scans overnight activity and surfaces key items",
      "Dashboard shows real-time project and team status",
      "Voice assistant for quick decision check-ins",
      "Automated end-of-day summary delivered to inbox",
    ],
    impactMetric: "40% more time on strategic work",
    relatedDemos: ["operations", "knowledge"],
    caseStudyLink: "/impact-studies/case-studies?study=meridian-property",
  },
  {
    id: "cfo",
    icon: LineChart,
    title: "CFO/AP/AR",
    teamSize: "Finance & operations teams",
    painPoints: [
      "Manual financial consolidation and reporting",
      "Revenue per head declining as team grows",
      "Hidden operational inefficiencies",
    ],
    aiEngines: ["Business Operating System", "Knowledge Management"],
    exampleWorkflow: "Automated expense categorisation → Real-time margin tracking → Predictive cash flow",
    workflowSteps: [
      "Invoices auto-extracted and categorised",
      "Real-time P&L dashboard per project/client",
      "AI alerts on margin anomalies",
      "Monthly close reduced from 5 days to 1",
    ],
    impactMetric: "3x faster financial close",
    relatedDemos: ["operations", "knowledge"],
    caseStudyLink: "/impact-studies/case-studies?study=apex-consulting",
  },
  {
    id: "cto",
    icon: Settings,
    title: "CTO",
    teamSize: "Engineering & IT teams",
    painPoints: [
      "Engineering time lost to process overhead",
      "Integration sprawl across 20+ tools",
      "Security and compliance burden",
    ],
    aiEngines: ["Knowledge Management", "AI Marketplace"],
    exampleWorkflow: "Centralised documentation → Automated incident triage → Self-service support",
    workflowSteps: [
      "Unified knowledge base across all tools",
      "AI-powered incident categorisation and routing",
      "Developer self-service for common requests",
      "Automated security and compliance checks",
    ],
    impactMetric: "60% reduction in context switching",
    relatedDemos: ["knowledge", "operations"],
    caseStudyLink: "/impact-studies/case-studies?study=apex-consulting",
  },
  {
    id: "property-dev-manager",
    icon: Home,
    title: "Property Development Manager",
    teamSize: "Development & project teams",
    painPoints: [
      "Multiple development stages with fragmented tracking",
      "Stakeholder reporting across investors, councils, and contractors",
      "Approval timelines and compliance documentation delays",
    ],
    aiEngines: ["Business Operating System", "Knowledge Management"],
    exampleWorkflow: "Milestone tracking → Stakeholder reporting → Approval automation → Handover coordination",
    workflowSteps: [
      "AI tracks development milestones across all projects",
      "Automated investor and council status reports",
      "Approval document compilation and submission tracking",
      "Seamless handover coordination between development phases",
    ],
    impactMetric: "45% faster approval cycles",
    relatedDemos: ["operations", "knowledge"],
    caseStudyLink: "/impact-studies/case-studies?study=meridian-property",
  },
  {
    id: "construction-manager",
    icon: HardHat,
    title: "Construction/Site Manager",
    teamSize: "Site crews & subcontractors",
    painPoints: [
      "Site reporting takes hours away from actual supervision",
      "Subcontractor coordination and scheduling conflicts",
      "Safety compliance documentation and incident tracking",
    ],
    aiEngines: ["Butler On The Go", "Business Operating System"],
    exampleWorkflow: "Voice site reporting → Subcontractor scheduling → Safety compliance → Daily summaries",
    workflowSteps: [
      "Voice-enabled progress reports from the field",
      "AI coordinates subcontractor schedules and resolves conflicts",
      "Automated safety checklists and incident logging",
      "End-of-day site summary delivered to stakeholders",
    ],
    impactMetric: "2 hours saved per day on reporting",
    relatedDemos: ["butler", "operations", "knowledge"],
    caseStudyLink: "/impact-studies/case-studies?study=buildright-construction",
  },
  {
    id: "project-manager",
    icon: ClipboardList,
    title: "Project Manager",
    teamSize: "Project teams (5-50+)",
    painPoints: [
      "Status updates scattered across emails, chats, and tools",
      "Risk visibility comes too late to act",
      "Resource allocation based on gut feel",
    ],
    aiEngines: ["Business Operating System", "Knowledge Management"],
    exampleWorkflow: "Automated status collection → Risk flagging → Resource optimisation",
    workflowSteps: [
      "AI pulls status from all connected tools",
      "Daily digest auto-generated for stakeholders",
      "Risk scoring alerts before issues escalate",
      "Resource recommendations based on capacity",
    ],
    impactMetric: "50% less time on status reporting",
    relatedDemos: ["operations", "knowledge"],
    caseStudyLink: "/impact-studies/case-studies?study=buildright-construction",
  },
  {
    id: "contract-admin",
    icon: Briefcase,
    title: "Contract Administrator",
    teamSize: "Supporting project & commercial teams",
    painPoints: [
      "Managing high-volume contract documentation and variations",
      "Tracking claims, extensions, and compliance deadlines",
      "Coordinating between legal, commercial, and site teams",
    ],
    aiEngines: ["Knowledge Management", "Business Operating System"],
    exampleWorkflow: "Contract tracking → Variation management → Compliance alerts → Claim processing",
    workflowSteps: [
      "AI organises and indexes all contract documents",
      "Automated tracking of variations and EOT claims",
      "Proactive alerts for compliance and deadline milestones",
      "Instant retrieval of contract clauses and precedents",
    ],
    impactMetric: "60% faster contract processing",
    relatedDemos: ["knowledge", "operations"],
    caseStudyLink: "/impact-studies/case-studies?study=buildright-construction",
  },
  {
    id: "customer-service",
    icon: Headphones,
    title: "Customer Service",
    teamSize: "Support teams (2-50+)",
    painPoints: [
      "Repetitive queries consuming team time",
      "Inconsistent response quality",
      "Slow resolution times",
    ],
    aiEngines: ["Customer Experience", "Knowledge Management"],
    exampleWorkflow: "AI first response → Smart escalation → Knowledge-backed resolution",
    workflowSteps: [
      "AI handles common queries instantly",
      "Complex issues routed with full context",
      "Knowledge base auto-updated from resolutions",
      "Quality scoring on every interaction",
    ],
    impactMetric: "80% queries resolved by AI",
    relatedDemos: ["customer-experience", "knowledge"],
    caseStudyLink: "/impact-studies/case-studies?study=pinnacle-insurance",
  },
  {
    id: "hr",
    icon: UserCheck,
    title: "HR / People Ops",
    teamSize: "HR teams (1-20+)",
    painPoints: [
      "High-volume candidate screening taking too long",
      "Inconsistent interview evaluation criteria",
      "Best candidates lost to slower hiring processes",
    ],
    aiEngines: ["Interview Scoring", "Candidate Match"],
    exampleWorkflow: "Resume screening → AI candidate matching → Structured interview scoring → Hire recommendation",
    workflowSteps: [
      "AI screens resumes against role requirements",
      "Top candidates ranked by skill and culture fit",
      "Interviewers guided with structured scoring criteria",
      "Hire recommendations with data-backed insights",
    ],
    impactMetric: "60% faster time-to-hire",
    relatedDemos: ["operations", "knowledge"],
    caseStudyLink: "/impact-studies/case-studies?study=meridian-property",
  },
];

export const industries: Industry[] = [
  {
    id: "construction",
    icon: HardHat,
    title: "Contract Building",
    qualifier: "Builders & project delivery",
    challenges: [
      "Quotes and take-offs done manually from drawings",
      "Subcontractor and procurement coordination overhead",
      "Variations and progress claims tracked by hand",
    ],
    useCases: [
      "Drawings to estimate in hours, not days",
      "AI-assisted tender and bid preparation",
      "Automated progress claims and variation tracking",
    ],
    compliance: "WHS compliance, state licensing requirements, contract and insurance obligations",
    impactMetric: "3x project throughput",
    relatedDemos: ["operations", "butler", "knowledge"],
    caseStudyLink: "/impact-studies/case-studies?study=buildright-construction",
  },
  {
    id: "windows-fabrication",
    icon: Frame,
    title: "Windows Fabrication",
    qualifier: "Manufacture & supply",
    challenges: [
      "Quoting from architectural drawings takes days",
      "Shop drawings and measure sheets re-done by hand",
      "Order tracking across suppliers and installs",
    ],
    useCases: [
      "AI take-off from PDF plans straight to quote",
      "Automated measure sheets and cut lists",
      "Order and installation status tracking",
    ],
    compliance: "AS 2047 window compliance, WHS, warranty and glazing standards",
    impactMetric: "Days of quoting cut to hours",
    relatedDemos: ["operations", "knowledge", "workflow-builder"],
    caseStudyLink: "/impact-studies/case-studies",
  },
  {
    id: "steelwork-fabrication",
    icon: Factory,
    title: "Steelwork Fabrication",
    qualifier: "Structural steel & fabrication",
    challenges: [
      "Manual take-offs from structural drawings",
      "Bid deadlines lost to slow estimating",
      "Drawing revisions not reflected in quotes",
    ],
    useCases: [
      "Drawings to tonnage and estimate",
      "Revision-aware re-quoting",
      "Procurement and subcontractor coordination",
    ],
    compliance: "WHS, AS/NZS fabrication standards, project-specific QA requirements",
    impactMetric: "70% faster estimates",
    relatedDemos: ["operations", "knowledge", "contract-review"],
    caseStudyLink: "/impact-studies/case-studies",
  },
  {
    id: "commercial-painting",
    icon: PaintRoller,
    title: "Commercial Painting",
    qualifier: "Painting contractors",
    challenges: [
      "Measuring plans by hand for every quote",
      "Inconsistent scopes between estimators",
      "Tender submissions under time pressure",
    ],
    useCases: [
      "AI quantities from plans — area per surface",
      "Consistent, repeatable scope breakdowns",
      "Fast, professional tender responses",
    ],
    compliance: "WHS, safety data sheet handling, contract and specification requirements",
    impactMetric: "More bids submitted per week",
    relatedDemos: ["operations", "knowledge", "butler"],
    caseStudyLink: "/impact-studies/case-studies",
  },
  {
    id: "civil-contracting",
    icon: Truck,
    title: "Civil Contracting",
    qualifier: "Civil works & infrastructure",
    challenges: [
      "Complex tenders with heavy compliance loads",
      "Quantity take-offs across large drawing sets",
      "Plant, subcontractor and materials coordination",
    ],
    useCases: [
      "AI take-off across large drawing sets",
      "Tender and bid compliance automation",
      "Project reporting and progress tracking",
    ],
    compliance: "WHS, ISO certifications, environmental and authority requirements",
    impactMetric: "3x project throughput",
    relatedDemos: ["operations", "knowledge", "contract-review"],
    caseStudyLink: "/impact-studies/case-studies?study=buildright-construction",
  },
  {
    id: "energy-infrastructure",
    icon: Zap,
    title: "Energy and Infrastructure",
    qualifier: "Energy & major projects",
    challenges: [
      "Distributed sites and scattered documentation",
      "Long tender cycles with strict requirements",
      "Stakeholder reporting overhead",
    ],
    useCases: [
      "Centralised project knowledge across sites",
      "Tender compliance and go/no-go scoring",
      "Automated stakeholder reporting",
    ],
    compliance: "WHS, environmental approvals, ISO and network standards",
    impactMetric: "50% admin time saved",
    relatedDemos: ["operations", "knowledge", "customer-experience"],
    caseStudyLink: "/impact-studies/case-studies",
  },
  {
    id: "consulting",
    icon: Briefcase,
    title: "Consulting & Professional Services",
    qualifier: "Client delivery",
    challenges: [
      "Billable hours lost to admin and research",
      "Client communication fragmentation",
      "Knowledge reuse across projects",
    ],
    useCases: [
      "AI-powered research and document analysis",
      "Automated time tracking and billing",
      "Cross-project insight mining",
    ],
    compliance: "Client confidentiality, professional standards, Privacy Act",
    impactMetric: "70% faster research",
    relatedDemos: ["operations", "knowledge", "marketplace"],
    caseStudyLink: "/impact-studies/case-studies?study=apex-consulting",
  },
  {
    id: "special-trades",
    icon: Wrench,
    title: "Special Trades/Contracting",
    qualifier: "Trades & subcontractors",
    challenges: [
      "Quoting jobs after hours, by hand",
      "Job tracking across multiple sites",
      "Chasing quotes, invoices and variations",
    ],
    useCases: [
      "Fast quotes from plans and specifications",
      "Automated job and invoice admin",
      "Follow-ups handled by AI agents",
    ],
    compliance: "Licensing, WHS, insurance and contract requirements",
    impactMetric: "80% less manual work",
    relatedDemos: ["operations", "butler", "voice-agent"],
    caseStudyLink: "/impact-studies/case-studies",
  },
];


export const demoNameMap: Record<string, string> = {
  "operations": "Business Operating System",
  "knowledge": "Knowledge Management",
  "workflow-builder": "Workflow Builder",
  "site-inspection": "Site Inspection",
  "voice-agent": "Voice Agent",
  "contract-review": "Contract Review",
  "fee-proposal": "Fee Proposal",
  "customer-experience": "Customer Experience",
  "butler": "Butler On The Go",
  "auto-invoicing": "Auto Invoicing",
  "lead-research": "Lead Research",
  "marketplace": "Marketplace",
};
