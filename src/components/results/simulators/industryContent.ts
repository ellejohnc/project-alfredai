// Industry-specific content configuration for personalized demo simulators

export type SimulatorType = "contract" | "inspection" | "recruitment" | "invoice" | "proposal";

export interface IndustryContractContent {
  title: string;
  documentType: string;
  clauses: string[];
  risks: Array<{ clause: string; risk: string; severity: "high" | "medium" | "low" }>;
  suggestedAmendments: string[];
}

export interface IndustryInspectionContent {
  inspectionType: string;
  locations: string[];
  checklistItems: string[];
  commonIssues: Array<{ issue: string; location: string; severity: "critical" | "major" | "minor" }>;
}

export interface IndustryInvoiceContent {
  documentType: string;
  vendorType: string;
  lineItems: Array<{ description: string; amount: number; category: string }>;
  validationChecks: string[];
}

export interface IndustryRecruitmentContent {
  roleType: string;
  requiredSkills: string[];
  certifications: string[];
  candidates: Array<{ name: string; matchScore: number; highlight: string }>;
}

export interface IndustryProposalContent {
  proposalType: string;
  clientType: string;
  sections: string[];
  pricingItems: Array<{ item: string; rate: string; estimate: string }>;
}

export interface IndustryContent {
  contract: IndustryContractContent;
  inspection: IndustryInspectionContent;
  invoice: IndustryInvoiceContent;
  recruitment: IndustryRecruitmentContent;
  proposal: IndustryProposalContent;
}

// Comprehensive industry content mapping
export const INDUSTRY_CONTENT: Record<string, IndustryContent> = {
  construction: {
    contract: {
      title: "Construction Services Agreement",
      documentType: "Head Contract",
      clauses: ["Payment Terms", "Variations & Extensions", "Defects Liability Period", "Retention", "Liquidated Damages", "Insurance Requirements"],
      risks: [
        { clause: "Payment Terms", risk: "60-day payment terms with no interest clause", severity: "high" },
        { clause: "Variations", risk: "No mechanism for cost recovery on variations", severity: "high" },
        { clause: "Liability", risk: "Unlimited liability for consequential damages", severity: "medium" },
        { clause: "Retention", risk: "10% retention held for 24 months", severity: "medium" },
      ],
      suggestedAmendments: [
        "Reduce payment terms to 30 days with 2% monthly interest",
        "Add variation clause with documented approval process",
        "Cap liability at contract value or $5M whichever is lower",
      ],
    },
    inspection: {
      inspectionType: "Site Progress Inspection",
      locations: ["Level 2 - Bathroom Fit-out", "Ground Floor - Slab Works", "Basement - Waterproofing", "External - Scaffolding"],
      checklistItems: ["Structural integrity", "Waterproofing membrane", "Electrical rough-in", "Fire stopping", "Safety barriers"],
      commonIssues: [
        { issue: "Hairline crack in concrete slab", location: "Ground Floor - Bay 3", severity: "major" },
        { issue: "Incomplete waterproofing at junction", location: "Basement - North Wall", severity: "critical" },
        { issue: "Missing fire collar on penetration", location: "Level 2 - Riser", severity: "major" },
      ],
    },
    invoice: {
      documentType: "Progress Claim",
      vendorType: "Subcontractor",
      lineItems: [
        { description: "Earthworks & Excavation - Claim 3", amount: 145000, category: "Civil" },
        { description: "Concrete Supply - 850m³", amount: 127500, category: "Structure" },
        { description: "Formwork Labour - Week 12-14", amount: 68000, category: "Labour" },
        { description: "Steel Reinforcement", amount: 92000, category: "Materials" },
      ],
      validationChecks: ["PO match", "Retention calculation", "Previous claims reconciliation", "Variation approval status"],
    },
    recruitment: {
      roleType: "Site Supervisor",
      requiredSkills: ["Site management", "Safety compliance", "Subcontractor coordination", "Quality control"],
      certifications: ["White Card", "First Aid", "Working at Heights", "EWP License"],
      candidates: [
        { name: "Marcus Chen", matchScore: 94, highlight: "12 years high-rise experience, safety record exemplary" },
        { name: "David Williams", matchScore: 87, highlight: "Former project manager, strong subbie relationships" },
        { name: "Sarah Mitchell", matchScore: 82, highlight: "Civil background, transitioning to commercial" },
      ],
    },
    proposal: {
      proposalType: "Fee Proposal",
      clientType: "Property Developer",
      sections: ["Executive Summary", "Scope of Works", "Program & Methodology", "Team Structure", "Fee Schedule", "Terms & Conditions"],
      pricingItems: [
        { item: "Project Management", rate: "$180/hr", estimate: "$156,000" },
        { item: "Site Supervision", rate: "$95/hr", estimate: "$124,000" },
        { item: "Safety Coordination", rate: "$85/hr", estimate: "$44,000" },
      ],
    },
  },
  "real-estate": {
    contract: {
      title: "Property Management Agreement",
      documentType: "Management Contract",
      clauses: ["Management Fee Structure", "Termination Rights", "Liability & Indemnity", "Reporting Requirements", "Maintenance Authority"],
      risks: [
        { clause: "Fee Structure", risk: "No cap on additional service fees", severity: "medium" },
        { clause: "Termination", risk: "180-day notice period with penalty", severity: "high" },
        { clause: "Authority", risk: "Broad discretionary spending powers", severity: "medium" },
      ],
      suggestedAmendments: [
        "Cap additional fees at 15% of base management fee",
        "Reduce notice period to 90 days with no exit penalty",
        "Require approval for expenditure over $5,000",
      ],
    },
    inspection: {
      inspectionType: "Property Condition Report",
      locations: ["Unit 12A - Living Areas", "Common Areas - Lobby", "Car Park - Level B1", "Rooftop - Plant Room"],
      checklistItems: ["Wall condition", "Flooring wear", "Appliance function", "HVAC operation", "Common area cleanliness"],
      commonIssues: [
        { issue: "Water stain on ceiling - possible leak", location: "Unit 12A - Bedroom", severity: "major" },
        { issue: "Cracked tile in lobby entrance", location: "Common Areas - Lobby", severity: "minor" },
        { issue: "AC unit not cooling effectively", location: "Unit 12A - Living Room", severity: "major" },
      ],
    },
    invoice: {
      documentType: "Vendor Invoice",
      vendorType: "Maintenance Contractor",
      lineItems: [
        { description: "HVAC Quarterly Service - All Units", amount: 4500, category: "Maintenance" },
        { description: "Emergency Plumbing Repair - Unit 8B", amount: 680, category: "Repairs" },
        { description: "Common Area Cleaning - Monthly", amount: 2200, category: "Cleaning" },
        { description: "Garden Maintenance - Monthly", amount: 1800, category: "Grounds" },
      ],
      validationChecks: ["Service completion verification", "Tenant approval where required", "Budget allocation", "Warranty claims"],
    },
    recruitment: {
      roleType: "Property Manager",
      requiredSkills: ["Tenant relations", "Lease negotiation", "Property maintenance", "Financial reporting"],
      certifications: ["Real Estate License", "Strata Management Certificate", "First Aid"],
      candidates: [
        { name: "Jessica Thompson", matchScore: 91, highlight: "Portfolio of 200+ units, tenant retention 94%" },
        { name: "Michael Russo", matchScore: 85, highlight: "Commercial property background, negotiation expert" },
        { name: "Emily Watson", matchScore: 79, highlight: "Boutique residential focus, client reviews excellent" },
      ],
    },
    proposal: {
      proposalType: "Management Proposal",
      clientType: "Building Owner",
      sections: ["Property Overview", "Management Approach", "Tenant Services", "Financial Management", "Fee Structure", "References"],
      pricingItems: [
        { item: "Base Management Fee", rate: "5% of rent", estimate: "$36,000/year" },
        { item: "Leasing Fee", rate: "2 weeks rent", estimate: "Per vacancy" },
        { item: "Project Management", rate: "10% of project", estimate: "As required" },
      ],
    },
  },
  "professional-services": {
    contract: {
      title: "Professional Services Agreement",
      documentType: "Engagement Letter",
      clauses: ["Scope of Services", "Fee Arrangements", "Confidentiality", "Intellectual Property", "Limitation of Liability", "Termination"],
      risks: [
        { clause: "Scope", risk: "Scope definition allows for creep without additional fees", severity: "high" },
        { clause: "IP Rights", risk: "Work product IP transfers to client unconditionally", severity: "medium" },
        { clause: "Liability", risk: "No cap on professional liability exposure", severity: "high" },
      ],
      suggestedAmendments: [
        "Add change order process for out-of-scope work",
        "Retain IP license for methodology and templates",
        "Cap liability at 2x fees paid or $1M whichever is greater",
      ],
    },
    inspection: {
      inspectionType: "Office Compliance Audit",
      locations: ["Main Office - Workstations", "Server Room", "Reception Area", "Meeting Rooms"],
      checklistItems: ["Ergonomic setup", "Fire safety compliance", "IT security", "Accessibility", "Document storage"],
      commonIssues: [
        { issue: "Confidential documents left unsecured", location: "Open Plan Office", severity: "critical" },
        { issue: "Fire exit blocked by storage", location: "Corridor B", severity: "major" },
        { issue: "Workstation ergonomics non-compliant", location: "Hot Desk Area", severity: "minor" },
      ],
    },
    invoice: {
      documentType: "Client Invoice",
      vendorType: "Time & Materials",
      lineItems: [
        { description: "Senior Consultant - Strategy Review (40 hrs)", amount: 14000, category: "Professional Fees" },
        { description: "Analyst - Data Analysis (60 hrs)", amount: 10800, category: "Professional Fees" },
        { description: "Travel - Client Site Visits", amount: 2400, category: "Expenses" },
        { description: "Software Licenses - Project Tools", amount: 1200, category: "Technology" },
      ],
      validationChecks: ["Timesheet verification", "Expense receipt matching", "Client approval on hours", "Rate card compliance"],
    },
    recruitment: {
      roleType: "Senior Consultant",
      requiredSkills: ["Client management", "Strategic analysis", "Project delivery", "Business development"],
      certifications: ["CPA/CA", "PMP", "MBA preferred", "Industry certifications"],
      candidates: [
        { name: "Alexandra Kim", matchScore: 93, highlight: "Big 4 experience, delivered $50M transformation" },
        { name: "Jonathan Clarke", matchScore: 88, highlight: "Industry specialist, strong client relationships" },
        { name: "Priya Sharma", matchScore: 84, highlight: "Digital transformation focus, tech-savvy" },
      ],
    },
    proposal: {
      proposalType: "Engagement Proposal",
      clientType: "Corporate Client",
      sections: ["Understanding of Needs", "Our Approach", "Project Team", "Timeline & Milestones", "Investment", "Why Choose Us"],
      pricingItems: [
        { item: "Phase 1: Discovery", rate: "Fixed fee", estimate: "$45,000" },
        { item: "Phase 2: Analysis", rate: "$350/hr", estimate: "$85,000" },
        { item: "Phase 3: Implementation", rate: "T&M capped", estimate: "$120,000" },
      ],
    },
  },
  consulting: {
    contract: {
      title: "Consulting Services Agreement",
      documentType: "Master Services Agreement",
      clauses: ["Engagement Terms", "Deliverables", "Fees & Payment", "Confidentiality", "Non-Compete", "Intellectual Property"],
      risks: [
        { clause: "Non-Compete", risk: "Broad non-compete restricts future client work", severity: "high" },
        { clause: "Deliverables", risk: "Acceptance criteria undefined", severity: "medium" },
        { clause: "Payment", risk: "Net 60 payment terms", severity: "medium" },
      ],
      suggestedAmendments: [
        "Narrow non-compete to specific named competitors only",
        "Define clear acceptance criteria with 5-day review period",
        "Reduce payment terms to Net 30 with milestone payments",
      ],
    },
    inspection: {
      inspectionType: "Process Efficiency Audit",
      locations: ["Operations Center", "Customer Service Hub", "Finance Department", "IT Infrastructure"],
      checklistItems: ["Process documentation", "System integration", "Data quality", "Compliance adherence", "Performance metrics"],
      commonIssues: [
        { issue: "Manual data entry between systems", location: "Operations Center", severity: "critical" },
        { issue: "Outdated process documentation", location: "All Departments", severity: "major" },
        { issue: "Inconsistent naming conventions", location: "Data Systems", severity: "minor" },
      ],
    },
    invoice: {
      documentType: "Consulting Invoice",
      vendorType: "Project-Based",
      lineItems: [
        { description: "Strategy Workshop Facilitation (2 days)", amount: 16000, category: "Advisory" },
        { description: "Market Analysis Report", amount: 25000, category: "Deliverable" },
        { description: "Executive Coaching (8 sessions)", amount: 12000, category: "Development" },
        { description: "Implementation Support (40 hrs)", amount: 18000, category: "Support" },
      ],
      validationChecks: ["Deliverable sign-off", "Session attendance", "Milestone completion", "Change order tracking"],
    },
    recruitment: {
      roleType: "Management Consultant",
      requiredSkills: ["Problem solving", "Stakeholder management", "Data analysis", "Presentation skills"],
      certifications: ["MBA", "Six Sigma", "Agile Certified", "Industry credentials"],
      candidates: [
        { name: "Daniel Foster", matchScore: 96, highlight: "McKinsey alumni, C-suite advisory experience" },
        { name: "Rachel Martinez", matchScore: 89, highlight: "Operations excellence, manufacturing sector" },
        { name: "Chris O'Brien", matchScore: 83, highlight: "Technology consulting, startup ecosystem" },
      ],
    },
    proposal: {
      proposalType: "Advisory Proposal",
      clientType: "Executive Team",
      sections: ["Situation Analysis", "Recommended Approach", "Expected Outcomes", "Team & Expertise", "Investment", "Next Steps"],
      pricingItems: [
        { item: "Diagnostic Phase", rate: "Fixed", estimate: "$35,000" },
        { item: "Strategy Development", rate: "$400/hr", estimate: "$80,000" },
        { item: "Implementation Advisory", rate: "Retainer", estimate: "$25,000/month" },
      ],
    },
  },
  recruitment: {
    contract: {
      title: "Recruitment Services Agreement",
      documentType: "Agency Agreement",
      clauses: ["Fee Structure", "Candidate Ownership", "Guarantee Period", "Exclusivity", "Replacement Terms", "Data Protection"],
      risks: [
        { clause: "Exclusivity", risk: "12-month exclusivity on all senior roles", severity: "high" },
        { clause: "Fee Structure", risk: "No sliding scale for high-volume placements", severity: "medium" },
        { clause: "Guarantee", risk: "Only 30-day guarantee with no refund option", severity: "medium" },
      ],
      suggestedAmendments: [
        "Limit exclusivity to specific roles with performance clauses",
        "Add volume discount: 15% off from 10th placement",
        "Extend guarantee to 90 days with pro-rata refund",
      ],
    },
    inspection: {
      inspectionType: "Candidate Assessment",
      locations: ["Technical Skills", "Cultural Fit", "Reference Verification", "Background Check"],
      checklistItems: ["Resume verification", "Skills assessment", "Behavioral interview", "Reference calls", "Right to work"],
      commonIssues: [
        { issue: "Gap in employment history unexplained", location: "Resume Analysis", severity: "major" },
        { issue: "Reference unable to be contacted", location: "Reference Check", severity: "major" },
        { issue: "Skills assessment below threshold", location: "Technical Review", severity: "critical" },
      ],
    },
    invoice: {
      documentType: "Placement Invoice",
      vendorType: "Contingent/Retained",
      lineItems: [
        { description: "Placement Fee - Senior Developer", amount: 28500, category: "Contingent" },
        { description: "Retained Search - CFO (Milestone 2)", amount: 35000, category: "Retained" },
        { description: "RPO Services - Monthly (15 hires)", amount: 45000, category: "RPO" },
        { description: "Assessment Platform - Quarterly", amount: 2400, category: "Technology" },
      ],
      validationChecks: ["Start date confirmation", "Salary verification", "Guarantee period tracking", "Volume discount calculation"],
    },
    recruitment: {
      roleType: "Technical Recruiter",
      requiredSkills: ["Sourcing", "Technical screening", "Candidate experience", "ATS proficiency"],
      certifications: ["AIRS Certified", "LinkedIn Recruiter", "Boolean Search Expert"],
      candidates: [
        { name: "Samantha Lee", matchScore: 95, highlight: "Tech sector specialist, 50+ placements/year" },
        { name: "Ryan Cooper", matchScore: 88, highlight: "Engineering background, strong technical assessment" },
        { name: "Nicole Adams", matchScore: 81, highlight: "Agency experience, fast learner" },
      ],
    },
    proposal: {
      proposalType: "Recruitment Partnership Proposal",
      clientType: "HR Director",
      sections: ["Talent Market Analysis", "Sourcing Strategy", "Process & Timeline", "Fee Structure", "Guarantee Terms", "Case Studies"],
      pricingItems: [
        { item: "Contingent Search", rate: "20% of salary", estimate: "Per placement" },
        { item: "Retained Executive Search", rate: "30% of salary", estimate: "In 3 instalments" },
        { item: "RPO Services", rate: "$3,000/hire", estimate: "Minimum 10/month" },
      ],
    },
  },
  technology: {
    contract: {
      title: "Software Development Agreement",
      documentType: "SaaS/Development Contract",
      clauses: ["License Grant", "Service Levels", "Data Ownership", "Security Requirements", "Support Terms", "Exit Provisions"],
      risks: [
        { clause: "Data Ownership", risk: "Vendor retains rights to anonymized data", severity: "medium" },
        { clause: "SLA", risk: "No penalties for SLA breaches", severity: "high" },
        { clause: "Exit", risk: "No data export provisions on termination", severity: "high" },
      ],
      suggestedAmendments: [
        "Require explicit data deletion and export on termination",
        "Add service credits for SLA breaches (10% per incident)",
        "Include source code escrow for business continuity",
      ],
    },
    inspection: {
      inspectionType: "Code Review / Security Audit",
      locations: ["Frontend Codebase", "API Layer", "Database Schema", "Infrastructure Config"],
      checklistItems: ["OWASP Top 10", "Code quality metrics", "Test coverage", "Dependency vulnerabilities", "Access controls"],
      commonIssues: [
        { issue: "SQL injection vulnerability in search API", location: "API Layer", severity: "critical" },
        { issue: "Outdated dependencies with known CVEs", location: "Frontend", severity: "major" },
        { issue: "Insufficient test coverage (45%)", location: "Backend Services", severity: "minor" },
      ],
    },
    invoice: {
      documentType: "Development Invoice",
      vendorType: "Agile Team",
      lineItems: [
        { description: "Sprint 14 - Feature Development (5 devs)", amount: 62500, category: "Development" },
        { description: "Cloud Infrastructure - Monthly", amount: 8500, category: "Infrastructure" },
        { description: "QA & Testing Services", amount: 15000, category: "Quality" },
        { description: "DevOps Support", amount: 12000, category: "Operations" },
      ],
      validationChecks: ["Sprint completion verification", "Story points delivered", "Velocity comparison", "Change request tracking"],
    },
    recruitment: {
      roleType: "Full Stack Developer",
      requiredSkills: ["React/TypeScript", "Node.js", "Cloud (AWS/GCP)", "System design"],
      certifications: ["AWS Certified", "Kubernetes", "Relevant CS degree or equivalent"],
      candidates: [
        { name: "Kevin Zhang", matchScore: 92, highlight: "5 years React, contributed to major OSS projects" },
        { name: "Lisa Patel", matchScore: 87, highlight: "Startup experience, full lifecycle delivery" },
        { name: "Tom Anderson", matchScore: 80, highlight: "Enterprise background, strong on security" },
      ],
    },
    proposal: {
      proposalType: "Development Proposal",
      clientType: "Product Owner",
      sections: ["Technical Assessment", "Proposed Architecture", "Team Composition", "Sprint Plan", "Budget & Timeline", "Risk Mitigation"],
      pricingItems: [
        { item: "Discovery & Design", rate: "Fixed", estimate: "$25,000" },
        { item: "Development Team", rate: "$12,500/week", estimate: "$150,000 (12 weeks)" },
        { item: "Ongoing Support", rate: "$5,000/month", estimate: "Post-launch" },
      ],
    },
  },
  manufacturing: {
    contract: {
      title: "Supply Agreement",
      documentType: "Manufacturing Contract",
      clauses: ["Specifications", "Quality Standards", "Pricing & Adjustments", "Delivery Terms", "Warranties", "Force Majeure"],
      risks: [
        { clause: "Pricing", risk: "No provisions for material cost fluctuations", severity: "high" },
        { clause: "Quality", risk: "Inspection rights limited to final product", severity: "medium" },
        { clause: "Delivery", risk: "No penalties for late delivery", severity: "high" },
      ],
      suggestedAmendments: [
        "Add quarterly price review based on commodity indices",
        "Include in-process inspection rights with 48hr notice",
        "Add 2% penalty per week for late delivery, capped at 10%",
      ],
    },
    inspection: {
      inspectionType: "Factory Quality Audit",
      locations: ["Production Line A", "Raw Materials Storage", "QC Lab", "Finished Goods Warehouse"],
      checklistItems: ["ISO compliance", "Equipment calibration", "Worker safety", "Inventory control", "Defect rates"],
      commonIssues: [
        { issue: "Calibration overdue on measuring equipment", location: "QC Lab", severity: "critical" },
        { issue: "FIFO not followed in raw materials", location: "Storage Area", severity: "major" },
        { issue: "Minor safety signage missing", location: "Production Line A", severity: "minor" },
      ],
    },
    invoice: {
      documentType: "Supplier Invoice",
      vendorType: "Parts/Materials",
      lineItems: [
        { description: "Component A - 10,000 units @ $4.50", amount: 45000, category: "Parts" },
        { description: "Raw Material X - 500kg @ $180/kg", amount: 90000, category: "Materials" },
        { description: "Tooling Amortization - Monthly", amount: 8500, category: "Tooling" },
        { description: "Expedited Shipping - Air Freight", amount: 12000, category: "Logistics" },
      ],
      validationChecks: ["3-way match (PO, GRN, Invoice)", "Quality certification attached", "Unit price verification", "Volume discount applied"],
    },
    recruitment: {
      roleType: "Production Manager",
      requiredSkills: ["Lean manufacturing", "Quality management", "Team leadership", "ERP systems"],
      certifications: ["Six Sigma Black Belt", "OSHA", "ISO Lead Auditor"],
      candidates: [
        { name: "Robert Chen", matchScore: 90, highlight: "Reduced defect rate 40% at previous role" },
        { name: "Maria Santos", matchScore: 85, highlight: "Automotive sector experience, Kaizen expert" },
        { name: "James Miller", matchScore: 78, highlight: "Food manufacturing background, HACCP certified" },
      ],
    },
    proposal: {
      proposalType: "Manufacturing Quote",
      clientType: "OEM Customer",
      sections: ["Technical Specifications", "Production Capability", "Quality Assurance", "Pricing Schedule", "Lead Times", "Terms"],
      pricingItems: [
        { item: "Tooling Setup", rate: "One-time", estimate: "$85,000" },
        { item: "Unit Price (10K+ volume)", rate: "$12.50/unit", estimate: "Per order" },
        { item: "Expedite Premium", rate: "+25%", estimate: "For rush orders" },
      ],
    },
  },
  "finance/accounting": {
    contract: {
      title: "Financial Services Agreement",
      documentType: "Engagement Agreement",
      clauses: ["Scope of Services", "Fee Arrangements", "Confidentiality", "Regulatory Compliance", "Liability Limitations", "Conflicts of Interest"],
      risks: [
        { clause: "Scope", risk: "Audit scope excludes key subsidiary", severity: "high" },
        { clause: "Liability", risk: "No cap on liability for professional negligence", severity: "high" },
        { clause: "Conflicts", risk: "Weak conflict of interest disclosure requirements", severity: "medium" },
      ],
      suggestedAmendments: [
        "Expand scope to include all material subsidiaries",
        "Cap liability at 3x annual fees or insurance limit",
        "Require quarterly conflict checks and written disclosures",
      ],
    },
    inspection: {
      inspectionType: "Financial Controls Audit",
      locations: ["Accounts Payable", "Accounts Receivable", "Treasury", "General Ledger"],
      checklistItems: ["Segregation of duties", "Approval authorities", "Reconciliation procedures", "System access controls", "Audit trail integrity"],
      commonIssues: [
        { issue: "Single approver for payments over $50K", location: "Accounts Payable", severity: "critical" },
        { issue: "Monthly reconciliation 3 weeks behind", location: "Treasury", severity: "major" },
        { issue: "Shared system login credentials", location: "General Ledger", severity: "critical" },
      ],
    },
    invoice: {
      documentType: "Fee Note",
      vendorType: "Professional Firm",
      lineItems: [
        { description: "Audit Services - FY2024", amount: 145000, category: "Audit" },
        { description: "Tax Compliance - Corporate", amount: 35000, category: "Tax" },
        { description: "Advisory - Transaction Due Diligence", amount: 75000, category: "Advisory" },
        { description: "Outsourced Bookkeeping - Quarterly", amount: 18000, category: "Outsourcing" },
      ],
      validationChecks: ["Engagement letter reference", "Hours vs estimate", "Partner approval", "Budget vs actual"],
    },
    recruitment: {
      roleType: "Financial Controller",
      requiredSkills: ["Financial reporting", "Internal controls", "Team management", "ERP systems"],
      certifications: ["CPA/CA", "CFA", "CIMA", "Big 4 experience preferred"],
      candidates: [
        { name: "Elizabeth Wong", matchScore: 94, highlight: "15 years experience, IPO preparation specialist" },
        { name: "Andrew Hughes", matchScore: 86, highlight: "FMCG sector, SAP implementation lead" },
        { name: "Natalie Brown", matchScore: 81, highlight: "Startup CFO experience, fundraising support" },
      ],
    },
    proposal: {
      proposalType: "Engagement Proposal",
      clientType: "CFO / Audit Committee",
      sections: ["Understanding of Business", "Audit Approach", "Team & Expertise", "Timetable", "Fees", "Independence Confirmation"],
      pricingItems: [
        { item: "Statutory Audit", rate: "Fixed", estimate: "$125,000" },
        { item: "Tax Compliance", rate: "Fixed", estimate: "$28,000" },
        { item: "Ad-hoc Advisory", rate: "$350/hr", estimate: "As required" },
      ],
    },
  },
  legal: {
    contract: {
      title: "Legal Services Retainer",
      documentType: "Retainer Agreement",
      clauses: ["Scope of Representation", "Fee Arrangements", "Billing Practices", "Confidentiality", "Conflicts of Interest", "File Retention"],
      risks: [
        { clause: "Fees", risk: "Hourly rates subject to annual increase without cap", severity: "medium" },
        { clause: "Billing", risk: "Minimum billing increments of 0.5 hours", severity: "medium" },
        { clause: "Staffing", risk: "No approval required for matter staffing changes", severity: "medium" },
      ],
      suggestedAmendments: [
        "Cap annual rate increases at CPI + 2%",
        "Reduce billing increments to 0.1 hours (6 minutes)",
        "Require client approval for partner/associate changes",
      ],
    },
    inspection: {
      inspectionType: "Legal Compliance Review",
      locations: ["Corporate Governance", "Contract Management", "Regulatory Filings", "IP Portfolio"],
      checklistItems: ["Board resolutions current", "Contract register complete", "Filing deadlines met", "IP registrations valid", "Powers of attorney current"],
      commonIssues: [
        { issue: "Expired board resolution for banking authority", location: "Corporate Governance", severity: "critical" },
        { issue: "5 contracts past renewal without review", location: "Contract Management", severity: "major" },
        { issue: "Trademark renewal due in 30 days", location: "IP Portfolio", severity: "major" },
      ],
    },
    invoice: {
      documentType: "Legal Fee Note",
      vendorType: "Law Firm",
      lineItems: [
        { description: "M&A Transaction - Partner (40 hrs)", amount: 32000, category: "Partner Time" },
        { description: "M&A Transaction - Associates (120 hrs)", amount: 54000, category: "Associate Time" },
        { description: "Due Diligence - Document Review", amount: 28000, category: "Paralegal/eDiscovery" },
        { description: "Disbursements - Filing Fees, Searches", amount: 4500, category: "Disbursements" },
      ],
      validationChecks: ["Matter budget vs actual", "Timekeeper rates verified", "Duplicate entries check", "Disbursement receipts attached"],
    },
    recruitment: {
      roleType: "Corporate Counsel",
      requiredSkills: ["Contract drafting", "Corporate governance", "M&A support", "Regulatory compliance"],
      certifications: ["Law degree (JD/LLB)", "Bar admission", "5+ years PQE", "In-house experience preferred"],
      candidates: [
        { name: "Victoria Hughes", matchScore: 93, highlight: "10 years corporate, led 15+ acquisitions in-house" },
        { name: "Christopher Lee", matchScore: 87, highlight: "Magic Circle background, APAC regional experience" },
        { name: "Jennifer Park", matchScore: 82, highlight: "Tech sector specialist, privacy law expert" },
      ],
    },
    proposal: {
      proposalType: "Legal Services Proposal",
      clientType: "General Counsel",
      sections: ["Understanding of Requirements", "Proposed Team", "Approach & Methodology", "Fee Proposal", "Alternative Fee Arrangements", "Firm Credentials"],
      pricingItems: [
        { item: "Partner Rate", rate: "$800/hr", estimate: "Senior oversight" },
        { item: "Senior Associate", rate: "$500/hr", estimate: "Lead execution" },
        { item: "Capped Fee Option", rate: "Fixed", estimate: "$150,000 for defined scope" },
      ],
    },
  },
  other: {
    contract: {
      title: "Service Agreement",
      documentType: "General Contract",
      clauses: ["Services Description", "Payment Terms", "Term & Termination", "Confidentiality", "Liability", "Dispute Resolution"],
      risks: [
        { clause: "Payment", risk: "No late payment interest provisions", severity: "medium" },
        { clause: "Termination", risk: "Limited termination rights for poor performance", severity: "high" },
        { clause: "Liability", risk: "Uncapped liability exposure", severity: "high" },
      ],
      suggestedAmendments: [
        "Add 1.5% monthly interest on late payments",
        "Include performance KPIs with termination trigger",
        "Cap liability at contract value or 12 months fees",
      ],
    },
    inspection: {
      inspectionType: "Operational Review",
      locations: ["Front Office", "Back Office", "IT Systems", "Facilities"],
      checklistItems: ["Process documentation", "System uptime", "Staff training records", "Compliance status", "Customer feedback"],
      commonIssues: [
        { issue: "Outdated process documentation", location: "Back Office", severity: "major" },
        { issue: "Training records incomplete", location: "Front Office", severity: "minor" },
        { issue: "System backup verification overdue", location: "IT Systems", severity: "major" },
      ],
    },
    invoice: {
      documentType: "Service Invoice",
      vendorType: "General Supplier",
      lineItems: [
        { description: "Monthly Service Fee", amount: 15000, category: "Services" },
        { description: "Additional Support Hours (20 hrs)", amount: 3000, category: "Support" },
        { description: "Materials & Consumables", amount: 2500, category: "Materials" },
        { description: "Travel & Expenses", amount: 1800, category: "Expenses" },
      ],
      validationChecks: ["Service delivery confirmation", "Rate card verification", "PO matching", "Expense receipt validation"],
    },
    recruitment: {
      roleType: "Operations Manager",
      requiredSkills: ["Process improvement", "Team leadership", "Budget management", "Stakeholder communication"],
      certifications: ["Relevant degree", "PMP or similar", "Industry experience"],
      candidates: [
        { name: "Alex Thompson", matchScore: 88, highlight: "10 years ops experience, process improvement specialist" },
        { name: "Jordan Williams", matchScore: 83, highlight: "Cross-functional leadership, change management" },
        { name: "Casey Morgan", matchScore: 77, highlight: "Strong analytical skills, data-driven approach" },
      ],
    },
    proposal: {
      proposalType: "Service Proposal",
      clientType: "Business Stakeholder",
      sections: ["Current State Analysis", "Proposed Solution", "Implementation Plan", "Pricing", "Timeline", "References"],
      pricingItems: [
        { item: "Setup & Onboarding", rate: "One-time", estimate: "$10,000" },
        { item: "Monthly Service Fee", rate: "Recurring", estimate: "$5,000/month" },
        { item: "Additional Services", rate: "As quoted", estimate: "Per request" },
      ],
    },
  },
};

// Helper to get industry content with fallback
export const getIndustryContent = (industry: string | null | undefined): IndustryContent => {
  if (!industry) return INDUSTRY_CONTENT.other;
  
  const normalizedIndustry = industry.toLowerCase().replace(/\s+/g, "-").replace(/\//g, "/");
  
  // Direct match
  if (INDUSTRY_CONTENT[normalizedIndustry]) {
    return INDUSTRY_CONTENT[normalizedIndustry];
  }
  
  // Fuzzy matching
  if (normalizedIndustry.includes("construct")) return INDUSTRY_CONTENT.construction;
  if (normalizedIndustry.includes("real") && normalizedIndustry.includes("estate")) return INDUSTRY_CONTENT["real-estate"];
  if (normalizedIndustry.includes("property")) return INDUSTRY_CONTENT["real-estate"];
  if (normalizedIndustry.includes("consult")) return INDUSTRY_CONTENT.consulting;
  if (normalizedIndustry.includes("professional")) return INDUSTRY_CONTENT["professional-services"];
  if (normalizedIndustry.includes("recruit") || normalizedIndustry.includes("staffing") || normalizedIndustry.includes("hr")) return INDUSTRY_CONTENT.recruitment;
  if (normalizedIndustry.includes("tech") || normalizedIndustry.includes("software") || normalizedIndustry.includes("saas")) return INDUSTRY_CONTENT.technology;
  if (normalizedIndustry.includes("manufactur") || normalizedIndustry.includes("industrial")) return INDUSTRY_CONTENT.manufacturing;
  if (normalizedIndustry.includes("financ") || normalizedIndustry.includes("account") || normalizedIndustry.includes("bank")) return INDUSTRY_CONTENT["finance/accounting"];
  if (normalizedIndustry.includes("legal") || normalizedIndustry.includes("law")) return INDUSTRY_CONTENT.legal;
  
  return INDUSTRY_CONTENT.other;
};

// Simulator type inference from keywords
export const inferSimulatorFromKeywords = (workflow: string): SimulatorType | null => {
  const lower = workflow.toLowerCase();
  
  // Recruitment keywords
  if (/recruit|candidate|hiring|interview|resume|talent|onboard|staffing|headhunt/i.test(lower)) return "recruitment";
  
  // Invoice keywords
  if (/invoice|billing|payment|expense|procurement|accounts|payable|receivable|claim/i.test(lower)) return "invoice";
  
  // Proposal keywords
  if (/proposal|quote|estimate|pricing|tender|bid|rfp|rfq|fee/i.test(lower)) return "proposal";
  
  // Inspection keywords
  if (/inspect|site|property|quality|audit|field|walkthrough|survey|check/i.test(lower)) return "inspection";
  
  // Contract keywords
  if (/contract|document|legal|compliance|agreement|clause|review|nda|msa/i.test(lower)) return "contract";
  
  return null;
};

// Challenge to simulator mapping
export const CHALLENGE_TO_SIMULATOR: Record<string, SimulatorType> = {
  "Too much time on documents & contracts": "contract",
  "Hiring/recruitment is too slow": "recruitment",
  "Cash flow and invoicing is unpredictable": "invoice",
  "Client communications are overwhelming": "proposal",
  "Project coordination is chaotic": "inspection",
  "Compliance and reporting is manual": "contract",
};

// Industry default simulator mapping
export const INDUSTRY_DEFAULT_SIMULATOR: Record<string, SimulatorType> = {
  construction: "inspection",
  "real-estate": "inspection",
  "professional-services": "contract",
  consulting: "proposal",
  recruitment: "recruitment",
  technology: "contract",
  manufacturing: "invoice",
  "finance/accounting": "invoice",
  legal: "contract",
  other: "contract",
};

// Get the best simulator based on all available context
export const getBestSimulator = (
  workflows: string[],
  primaryChallenge: string | null | undefined,
  industry: string | null | undefined,
  recommendedDemos: string[] | null | undefined
): SimulatorType => {
  // 1. Try to match from workflows (highest priority)
  for (const workflow of workflows) {
    const fromKeywords = inferSimulatorFromKeywords(workflow);
    if (fromKeywords) return fromKeywords;
  }
  
  // 2. Try to match from primary challenge
  if (primaryChallenge && CHALLENGE_TO_SIMULATOR[primaryChallenge]) {
    return CHALLENGE_TO_SIMULATOR[primaryChallenge];
  }
  
  // 3. Try to infer from recommended demos
  if (recommendedDemos && recommendedDemos.length > 0) {
    const demoToSimulator: Record<string, SimulatorType> = {
      "contract-review": "contract",
      "site-inspection": "inspection",
      "candidate-match": "recruitment",
      "auto-invoicing": "invoice",
      "fee-proposal": "proposal",
      "procurement": "invoice",
      "property-management": "inspection",
    };
    
    for (const demo of recommendedDemos) {
      if (demoToSimulator[demo]) {
        return demoToSimulator[demo];
      }
    }
  }
  
  // 4. Fall back to industry default
  if (industry) {
    const normalizedIndustry = industry.toLowerCase().replace(/\s+/g, "-");
    if (INDUSTRY_DEFAULT_SIMULATOR[normalizedIndustry]) {
      return INDUSTRY_DEFAULT_SIMULATOR[normalizedIndustry];
    }
    
    // Fuzzy industry matching
    if (normalizedIndustry.includes("construct")) return "inspection";
    if (normalizedIndustry.includes("real") || normalizedIndustry.includes("property")) return "inspection";
    if (normalizedIndustry.includes("recruit") || normalizedIndustry.includes("hr")) return "recruitment";
    if (normalizedIndustry.includes("financ") || normalizedIndustry.includes("account")) return "invoice";
    if (normalizedIndustry.includes("consult")) return "proposal";
  }
  
  // 5. Ultimate fallback
  return "contract";
};
