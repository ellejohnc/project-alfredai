import {
  Wifi,
  Camera,
  FileText,
  ClipboardList,
  Thermometer,
  Gauge,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  BarChart3,
  Shield,
  FileCheck,
  Lightbulb,
  Send,
  Database,
  Radio,
  FileBarChart,
  BookOpen,
  FileStack,
  Files,
} from "lucide-react";
import type {
  DataSource,
  ExtractedData,
  PatternAnomaly,
  ComplianceItem,
  ReportSection,
  Recommendation,
  Stakeholder,
  ReportStep,
  ReportVersion,
  ProfessionalRole,
} from "./types";

// Professional roles for the demo
export const PROFESSIONAL_ROLES: ProfessionalRole[] = [
  { id: "engineers", label: "Engineers", standards: ["AS/NZS 3000", "ISO 55001"] },
  { id: "certifiers", label: "Building Certifiers", standards: ["NCC", "BCA", "State Building Act"] },
  { id: "consultants", label: "Consultants", standards: ["ISO 9001", "Industry Best Practice"] },
  { id: "surveyors", label: "Building Surveyors", standards: ["Surveying Regulations", "Land Titles Act"] },
  { id: "contractors", label: "Contractors", standards: ["WHS Act", "Contract Specifications"] },
];

// Role-specific data sources
export const ROLE_DATA_SOURCES: Record<string, DataSource[]> = {
  engineers: [
    { id: "iot-sensors", name: "IoT Sensors", icon: Wifi, description: "Temperature, humidity, structural sensors", selected: true, recordCount: 2847 },
    { id: "thermal-imaging", name: "Thermal Imaging", icon: Thermometer, description: "Infrared heat maps and analysis", selected: true, recordCount: 48 },
    { id: "photos", name: "Site Photos", icon: Camera, description: "Equipment and installation photos", selected: false, recordCount: 156 },
    { id: "prior-reports", name: "Prior Reports", icon: FileText, description: "Historical inspection reports", selected: false, recordCount: 12 },
    { id: "live-feed", name: "Live Monitoring", icon: Radio, description: "Real-time sensor data streams", selected: false, recordCount: 1240 },
    { id: "cad-drawings", name: "CAD Drawings", icon: FileStack, description: "Engineering drawings and specs", selected: false, recordCount: 34 },
  ],
  certifiers: [
    { id: "building-plans", name: "Building Plans", icon: FileStack, description: "Approved architectural plans", selected: true, recordCount: 28 },
    { id: "inspection-forms", name: "Inspection Forms", icon: ClipboardList, description: "Mandatory inspection checklists", selected: true, recordCount: 45 },
    { id: "photos", name: "Site Photos", icon: Camera, description: "Construction stage documentation", selected: false, recordCount: 234 },
    { id: "ncc-codes", name: "NCC Codes", icon: BookOpen, description: "National Construction Code references", selected: false, recordCount: 156 },
    { id: "certificates", name: "Trade Certificates", icon: FileCheck, description: "Plumbing, electrical, fire certificates", selected: false, recordCount: 18 },
    { id: "prior-reports", name: "Prior Inspections", icon: FileText, description: "Previous inspection reports", selected: false, recordCount: 8 },
  ],
  consultants: [
    { id: "client-brief", name: "Client Brief", icon: FileText, description: "Project requirements and scope", selected: true, recordCount: 5 },
    { id: "market-data", name: "Market Data", icon: BarChart3, description: "Industry benchmarks and trends", selected: true, recordCount: 890 },
    { id: "field-notes", name: "Site Assessment", icon: ClipboardList, description: "On-site observations", selected: false, recordCount: 67 },
    { id: "regulations", name: "Regulations", icon: BookOpen, description: "Applicable codes and standards", selected: false, recordCount: 42 },
    { id: "competitor-analysis", name: "Competitor Analysis", icon: TrendingUp, description: "Market positioning data", selected: false, recordCount: 15 },
    { id: "stakeholder-interviews", name: "Stakeholder Inputs", icon: Files, description: "Interview notes and feedback", selected: false, recordCount: 23 },
  ],
  surveyors: [
    { id: "survey-data", name: "Survey Measurements", icon: Gauge, description: "GPS and total station data", selected: true, recordCount: 1247 },
    { id: "title-docs", name: "Title Documents", icon: FileText, description: "Land titles and easements", selected: true, recordCount: 8 },
    { id: "aerial-imagery", name: "Aerial Imagery", icon: Camera, description: "Drone and satellite photos", selected: false, recordCount: 56 },
    { id: "boundary-plans", name: "Boundary Plans", icon: FileStack, description: "Registered survey plans", selected: false, recordCount: 12 },
    { id: "contour-data", name: "Contour Data", icon: TrendingUp, description: "Elevation and terrain analysis", selected: false, recordCount: 3400 },
    { id: "utility-records", name: "Utility Records", icon: Database, description: "Underground service locations", selected: false, recordCount: 34 },
  ],
  contractors: [
    { id: "work-orders", name: "Work Orders", icon: ClipboardList, description: "Job tickets and instructions", selected: true, recordCount: 89 },
    { id: "site-photos", name: "Progress Photos", icon: Camera, description: "Before/after documentation", selected: true, recordCount: 312 },
    { id: "safety-docs", name: "Safety Documents", icon: Shield, description: "SWMS, JSA, toolbox talks", selected: false, recordCount: 45 },
    { id: "material-specs", name: "Material Specs", icon: FileStack, description: "Product data sheets", selected: false, recordCount: 78 },
    { id: "defect-logs", name: "Defect Logs", icon: AlertTriangle, description: "Issue tracking records", selected: false, recordCount: 23 },
    { id: "timesheets", name: "Labor Records", icon: Files, description: "Hours and resource allocation", selected: false, recordCount: 156 },
  ],
};

// Role-specific extracted data
export const ROLE_EXTRACTED_DATA: Record<string, ExtractedData[]> = {
  engineers: [
    { id: "eq-1", category: "equipment", title: "HVAC Unit A1 Status", value: "Operational - Minor vibration detected", confidence: 94, source: "IoT Sensors", severity: "warning" },
    { id: "eq-2", category: "equipment", title: "Electrical Panel B3", value: "Thermal imaging shows hotspot at breaker 12", confidence: 98, source: "Thermal Imaging", severity: "critical" },
    { id: "env-1", category: "environmental", title: "Ambient Temperature", value: "24.3°C (within spec)", confidence: 99, source: "IoT Sensors", severity: "normal" },
    { id: "meas-1", category: "measurement", title: "Power Consumption", value: "Peak load 847kW (92% capacity)", confidence: 96, source: "IoT Sensors", severity: "warning" },
  ],
  certifiers: [
    { id: "cert-1", category: "observation", title: "Fire Rating Compliance", value: "All fire doors meet BCA requirements", confidence: 100, source: "Inspection Forms", severity: "normal" },
    { id: "cert-2", category: "observation", title: "Structural Elements", value: "Load-bearing walls per approved plans", confidence: 97, source: "Building Plans", severity: "normal" },
    { id: "cert-3", category: "observation", title: "Waterproofing", value: "Wet area membrane requires re-inspection", confidence: 85, source: "Site Photos", severity: "warning" },
    { id: "cert-4", category: "observation", title: "Egress Pathways", value: "Exit widths non-compliant in Zone B", confidence: 92, source: "Inspection Forms", severity: "critical" },
  ],
  consultants: [
    { id: "con-1", category: "observation", title: "Process Efficiency", value: "Current workflow has 23% redundancy", confidence: 88, source: "Site Assessment", severity: "warning" },
    { id: "con-2", category: "measurement", title: "Cost Analysis", value: "Operating costs 15% above benchmark", confidence: 94, source: "Market Data", severity: "warning" },
    { id: "con-3", category: "observation", title: "Technology Gap", value: "Legacy systems limiting scalability", confidence: 91, source: "Client Brief", severity: "warning" },
    { id: "con-4", category: "measurement", title: "ROI Potential", value: "Automation could yield 340% ROI", confidence: 86, source: "Market Data", severity: "normal" },
  ],
  surveyors: [
    { id: "sur-1", category: "measurement", title: "Boundary Position", value: "Eastern boundary 0.3m inside title", confidence: 99, source: "Survey Measurements", severity: "warning" },
    { id: "sur-2", category: "observation", title: "Encroachment Detected", value: "Neighbor fence 0.8m over boundary", confidence: 97, source: "Aerial Imagery", severity: "critical" },
    { id: "sur-3", category: "measurement", title: "Site Levels", value: "Natural ground level established", confidence: 100, source: "Survey Measurements", severity: "normal" },
    { id: "sur-4", category: "observation", title: "Easement Location", value: "Drainage easement correctly positioned", confidence: 98, source: "Title Documents", severity: "normal" },
  ],
  contractors: [
    { id: "ctr-1", category: "observation", title: "Defect: Cracked Render", value: "Hairline cracks in northwest wall render", confidence: 95, source: "Progress Photos", severity: "warning" },
    { id: "ctr-2", category: "observation", title: "Safety Compliance", value: "All PPE requirements met on site", confidence: 100, source: "Safety Documents", severity: "normal" },
    { id: "ctr-3", category: "measurement", title: "Progress Status", value: "78% complete, 2 days ahead of schedule", confidence: 92, source: "Work Orders", severity: "normal" },
    { id: "ctr-4", category: "observation", title: "Material Issue", value: "Tile batch color variance detected", confidence: 88, source: "Material Specs", severity: "warning" },
  ],
};

// Role-specific patterns
export const ROLE_PATTERNS: Record<string, PatternAnomaly[]> = {
  engineers: [
    { id: "pattern-1", type: "trend", title: "Rising Power Consumption", description: "15% increase in peak load over 6 months", severity: "warning", dataPoints: [720, 745, 780, 810, 830, 847], recommendation: "Schedule electrical capacity review" },
    { id: "pattern-2", type: "anomaly", title: "Thermal Hotspot Detected", description: "Electrical panel B3 showing 45°C above ambient", severity: "critical", recommendation: "Immediate inspection required" },
    { id: "pattern-3", type: "correlation", title: "Humidity-Equipment Link", description: "High humidity correlates with equipment degradation", severity: "info", recommendation: "Consider dehumidification upgrade" },
  ],
  certifiers: [
    { id: "pattern-1", type: "anomaly", title: "Egress Non-Compliance", description: "Exit pathway width below NCC minimum", severity: "critical", recommendation: "Remediation required before occupancy" },
    { id: "pattern-2", type: "trend", title: "Inspection Pass Rate", description: "87% of items passed on first inspection", severity: "info", dataPoints: [78, 82, 85, 87, 87], recommendation: "Above industry average" },
    { id: "pattern-3", type: "correlation", title: "Trade Certification Gaps", description: "3 trades pending final certification", severity: "warning", recommendation: "Follow up with contractors" },
  ],
  consultants: [
    { id: "pattern-1", type: "trend", title: "Efficiency Decline", description: "Productivity dropping 3% quarter-over-quarter", severity: "warning", dataPoints: [100, 97, 94, 91], recommendation: "Process optimization recommended" },
    { id: "pattern-2", type: "correlation", title: "Technology-Cost Link", description: "Manual processes driving 40% of overhead", severity: "warning", recommendation: "Automation investment advised" },
    { id: "pattern-3", type: "anomaly", title: "Market Position Shift", description: "Competitor gaining 12% market share", severity: "warning", recommendation: "Strategic review needed" },
  ],
  surveyors: [
    { id: "pattern-1", type: "anomaly", title: "Boundary Discrepancy", description: "Physical fence doesn't match title boundary", severity: "critical", recommendation: "Formal survey report for legal action" },
    { id: "pattern-2", type: "trend", title: "Land Movement", description: "0.02m annual subsidence detected", severity: "warning", dataPoints: [0, -0.02, -0.04, -0.06], recommendation: "Geotechnical assessment advised" },
    { id: "pattern-3", type: "correlation", title: "Drainage Impact", description: "Site levels affecting neighbor drainage", severity: "warning", recommendation: "Engineering solution required" },
  ],
  contractors: [
    { id: "pattern-1", type: "trend", title: "Defect Rate Trending Down", description: "Quality improving over 4 weeks", severity: "info", dataPoints: [12, 8, 5, 3], recommendation: "Maintain current QA processes" },
    { id: "pattern-2", type: "anomaly", title: "Material Variance Issue", description: "Tile batch inconsistency detected", severity: "warning", recommendation: "Source replacement tiles" },
    { id: "pattern-3", type: "correlation", title: "Weather-Progress Link", description: "Rain delays affecting exterior works", severity: "info", recommendation: "Adjust schedule for forecast" },
  ],
};

// Role-specific compliance items
export const ROLE_COMPLIANCE: Record<string, ComplianceItem[]> = {
  engineers: [
    { id: "comp-1", standard: "AS/NZS 3000", requirement: "Electrical installation safety", status: "fail", details: "Panel B3 thermal anomaly exceeds safe parameters", remediation: "Immediate load reduction required" },
    { id: "comp-2", standard: "AS/NZS 3000", requirement: "Circuit protection adequacy", status: "pass", details: "All circuit breakers rated appropriately" },
    { id: "comp-3", standard: "ISO 55001", requirement: "Asset condition monitoring", status: "pass", details: "Continuous monitoring system operational" },
    { id: "comp-4", standard: "ISO 55001", requirement: "Preventive maintenance", status: "review", details: "HVAC maintenance interval needs review", remediation: "Reduce maintenance interval" },
  ],
  certifiers: [
    { id: "comp-1", standard: "NCC Vol 1", requirement: "Fire separation", status: "pass", details: "All fire compartments correctly constructed" },
    { id: "comp-2", standard: "NCC Vol 1", requirement: "Egress requirements", status: "fail", details: "Exit width in Zone B below minimum", remediation: "Widen exit pathway to 1000mm" },
    { id: "comp-3", standard: "BCA", requirement: "Structural adequacy", status: "pass", details: "Load paths verified per engineering cert" },
    { id: "comp-4", standard: "State Building Act", requirement: "Wet area waterproofing", status: "review", details: "Membrane inspection pending", remediation: "Schedule water test" },
  ],
  consultants: [
    { id: "comp-1", standard: "ISO 9001", requirement: "Quality management", status: "review", details: "Documentation gaps identified", remediation: "Update QMS procedures" },
    { id: "comp-2", standard: "ISO 9001", requirement: "Process documentation", status: "pass", details: "Core processes documented" },
    { id: "comp-3", standard: "Industry Best Practice", requirement: "Risk management", status: "pass", details: "Risk register maintained" },
    { id: "comp-4", standard: "Industry Best Practice", requirement: "Performance metrics", status: "review", details: "KPIs not benchmarked", remediation: "Implement industry benchmarks" },
  ],
  surveyors: [
    { id: "comp-1", standard: "Surveying Regulations", requirement: "Boundary accuracy", status: "pass", details: "Measurements within prescribed tolerance" },
    { id: "comp-2", standard: "Land Titles Act", requirement: "Title reconciliation", status: "fail", details: "Physical occupation differs from title", remediation: "Formal boundary determination required" },
    { id: "comp-3", standard: "Surveying Regulations", requirement: "Monument placement", status: "pass", details: "Survey marks correctly placed" },
    { id: "comp-4", standard: "Land Titles Act", requirement: "Easement identification", status: "pass", details: "All easements correctly identified" },
  ],
  contractors: [
    { id: "comp-1", standard: "WHS Act", requirement: "Site safety", status: "pass", details: "All safety requirements met" },
    { id: "comp-2", standard: "WHS Act", requirement: "Risk assessments", status: "pass", details: "SWMS current for all activities" },
    { id: "comp-3", standard: "Contract Specifications", requirement: "Material compliance", status: "review", details: "Tile batch variance needs approval", remediation: "Submit variation for approval" },
    { id: "comp-4", standard: "Contract Specifications", requirement: "Workmanship", status: "pass", details: "Quality meets specification" },
  ],
};

// Role-specific report sections
export const ROLE_REPORT_SECTIONS: Record<string, ReportSection[]> = {
  engineers: [
    { id: "exec-summary", title: "Executive Summary", content: "This technical inspection report covers the quarterly assessment of the Industrial Facility. The inspection identified **3 critical findings** requiring immediate attention, and confirmed compliance with **8 of 10** regulatory requirements.\n\nKey actions required:\n- Immediate: Electrical panel B3 thermal remediation\n- 7 days: HVAC vibration investigation\n- 30 days: Capacity upgrade planning", editable: true },
    { id: "findings", title: "Engineering Findings", content: "### Critical Issues\n1. **Electrical Panel B3 Hotspot** - Thermal imaging reveals dangerous temperature at breaker 12\n2. **HVAC Vibration Anomaly** - Progressive vibration indicating bearing failure\n\n### Warnings\n1. Power consumption at 92% capacity\n2. Humidity levels above threshold", editable: true },
    { id: "analysis", title: "Technical Analysis", content: "### Sensor Data Analysis\n- 2,847 IoT readings analyzed over 90 days\n- Pattern correlation coefficient: r=0.84\n- Capacity projection: 8 months to constraints", editable: true },
  ],
  certifiers: [
    { id: "exec-summary", title: "Executive Summary", content: "This building inspection report covers the final inspection stage for the development at 45 Smith Street. The inspection identified **1 critical non-compliance** requiring remediation, and **1 item** requiring further documentation.\n\nKey actions required:\n- Critical: Widen Zone B exit pathway\n- Review: Complete wet area testing", editable: true },
    { id: "findings", title: "Inspection Findings", content: "### Non-Compliances\n1. **Egress Width Deficiency** - Zone B exit 850mm, requires 1000mm minimum per NCC\n\n### Passed Items\n- Fire separation: Compliant\n- Structural: Verified per engineering\n- Fire safety systems: Operational", editable: true },
    { id: "analysis", title: "Compliance Summary", content: "### NCC Compliance Matrix\n- Volume 1 requirements: 14/15 passed\n- BCA structural: Compliant\n- State Building Act: 3/4 verified\n\n### Outstanding Certifications\n- Wet area waterproofing test pending", editable: true },
  ],
  consultants: [
    { id: "exec-summary", title: "Executive Summary", content: "This assessment report identifies key opportunities for operational improvement. Analysis indicates **$2.4M annual savings potential** through process optimization and technology investment.\n\nKey recommendations:\n- Process automation: 340% ROI potential\n- Technology upgrade: Eliminate legacy constraints\n- Training program: Upskill workforce", editable: true },
    { id: "findings", title: "Assessment Findings", content: "### Key Insights\n1. **Process Redundancy** - 23% of current workflows are duplicative\n2. **Technology Gap** - Legacy systems limiting scalability\n3. **Market Position** - Competitor gaining ground\n\n### Opportunities\n- Automation could reduce labor costs 35%\n- Digital transformation: 18-month payback", editable: true },
    { id: "analysis", title: "Market Analysis", content: "### Benchmarking Results\n- Operating costs: 15% above industry median\n- Productivity: 12% below top quartile\n- Technology adoption: Trailing competitors\n\n### ROI Analysis\n- Conservative: 180% over 3 years\n- Expected: 340% over 3 years", editable: true },
  ],
  surveyors: [
    { id: "exec-summary", title: "Executive Summary", content: "This survey report documents the boundary determination for Lot 42 DP123456. A significant **boundary discrepancy** was identified requiring formal resolution.\n\nKey findings:\n- Eastern boundary: 0.3m inside title line\n- Encroachment: Neighbor fence 0.8m over boundary\n- Recommendation: Formal boundary determination", editable: true },
    { id: "findings", title: "Survey Findings", content: "### Critical Issues\n1. **Boundary Encroachment** - Neighboring fence built 0.8m onto subject property\n\n### Observations\n- Eastern boundary occupation differs from title\n- All survey marks placed per regulations\n- Easements correctly identified", editable: true },
    { id: "analysis", title: "Technical Analysis", content: "### Measurement Summary\n- Total points surveyed: 1,247\n- Accuracy achieved: ±0.015m\n- Equipment: Trimble R12 GNSS, Leica TS16\n\n### Boundary Calculation\n- Title area: 623.4m²\n- Actual occupation: 618.7m²\n- Discrepancy: 4.7m² (0.75%)", editable: true },
  ],
  contractors: [
    { id: "exec-summary", title: "Executive Summary", content: "This progress report covers construction works for Project #2024-089. Works are **78% complete** and tracking **2 days ahead of schedule**.\n\nKey updates:\n- Defect rate trending down: 3 items this week\n- Material issue: Tile batch variance detected\n- Next milestone: Practical completion in 12 days", editable: true },
    { id: "findings", title: "Site Report", content: "### Defects Identified\n1. **Render Cracking** - Hairline cracks northwest wall (cosmetic)\n2. **Tile Variance** - Batch color inconsistency detected\n\n### Completed Works\n- Structural: 100%\n- Waterproofing: 100%\n- Internal linings: 95%\n- External finishes: 72%", editable: true },
    { id: "analysis", title: "Progress Analysis", content: "### Schedule Status\n- Planned completion: Day 45\n- Projected completion: Day 43\n- Variance: +2 days ahead\n\n### Quality Metrics\n- First-time pass rate: 94%\n- Defect close-out: 100% within 48hrs\n- Safety incidents: Zero", editable: true },
  ],
};

// Helper to get role-specific data
export const getDataForRole = (roleId: string) => ({
  dataSources: ROLE_DATA_SOURCES[roleId] || ROLE_DATA_SOURCES.engineers,
  extractedData: ROLE_EXTRACTED_DATA[roleId] || ROLE_EXTRACTED_DATA.engineers,
  patterns: ROLE_PATTERNS[roleId] || ROLE_PATTERNS.engineers,
  compliance: ROLE_COMPLIANCE[roleId] || ROLE_COMPLIANCE.engineers,
  reportSections: ROLE_REPORT_SECTIONS[roleId] || ROLE_REPORT_SECTIONS.engineers,
});

// Report version history mock data
export const MOCK_REPORT_VERSIONS: ReportVersion[] = [
  { version: "1.0", status: "draft", timestamp: "2 hours ago", author: "AI Agent", summary: "Initial draft generated" },
  { version: "1.1", status: "review", timestamp: "1 hour ago", author: "J. Mitchell", summary: "Internal comments added" },
  { version: "1.2", status: "approved", timestamp: "30 min ago", author: "S. Chen", summary: "Technical review approved" },
  { version: "2.0", status: "final", timestamp: "Just now", author: "System", summary: "Client-ready version" },
];

// Simplified steps (5 instead of 7)
export const REPORT_STEPS: ReportStep[] = [
  {
    id: "sources",
    title: "Data Sources",
    shortTitle: "Sources",
    icon: Database,
    description: "Select input data sources",
    duration: 5000,
    clickPrompt: "Select sources to continue",
  },
  {
    id: "ingestion",
    title: "AI Extraction",
    shortTitle: "Extract",
    icon: Radio,
    description: "AI parsing and data extraction",
    duration: 5000,
    clickPrompt: "Click to extract data",
  },
  {
    id: "patterns",
    title: "Pattern Analysis",
    shortTitle: "Analyze",
    icon: BarChart3,
    description: "Identifying trends and anomalies",
    duration: 5000,
    clickPrompt: "Click to analyze patterns",
  },
  {
    id: "compliance",
    title: "Compliance Check",
    shortTitle: "Comply",
    icon: Shield,
    description: "Verifying against standards",
    duration: 5000,
    clickPrompt: "Click to verify compliance",
  },
  {
    id: "report",
    title: "Generate Report",
    shortTitle: "Generate",
    icon: FileCheck,
    description: "Generating technical report",
    duration: 5000,
    clickPrompt: "Click to generate report",
  },
];

// Enhanced data sources (8 total for professional services)
export const INITIAL_DATA_SOURCES: DataSource[] = [
  {
    id: "regulation-docs",
    name: "Regulation Documents",
    icon: BookOpen,
    description: "Building codes, standards, compliance requirements",
    selected: false,
    recordCount: 24,
  },
  {
    id: "field-notes",
    name: "Field Notes",
    icon: ClipboardList,
    description: "On-site observations and measurements",
    selected: false,
    recordCount: 67,
  },
  {
    id: "scanned-forms",
    name: "Scanned Forms",
    icon: FileStack,
    description: "Digitized inspection checklists and forms",
    selected: false,
    recordCount: 18,
  },
  {
    id: "photos",
    name: "Site Photos",
    icon: Camera,
    description: "Inspection and documentation photos",
    selected: false,
    recordCount: 156,
  },
  {
    id: "document-files",
    name: "Document Files",
    icon: Files,
    description: "PDFs, drawings, specifications",
    selected: false,
    recordCount: 42,
  },
  {
    id: "iot-sensors",
    name: "IoT Sensors",
    icon: Wifi,
    description: "Temperature, humidity, structural sensors",
    selected: false,
    recordCount: 2847,
  },
  {
    id: "live-feed",
    name: "Live Feed",
    icon: Radio,
    description: "Real-time monitoring data streams",
    selected: false,
    recordCount: 1240,
  },
  {
    id: "prior-reports",
    name: "Prior Reports",
    icon: FileText,
    description: "Historical inspection reports",
    selected: false,
    recordCount: 12,
  },
];

export const MOCK_EXTRACTED_DATA: ExtractedData[] = [
  {
    id: "eq-1",
    category: "equipment",
    title: "HVAC Unit A1 Status",
    value: "Operational - Minor vibration detected",
    confidence: 94,
    source: "IoT Sensors",
    severity: "warning",
  },
  {
    id: "eq-2",
    category: "equipment",
    title: "Electrical Panel B3",
    value: "Thermal imaging shows hotspot at breaker 12",
    confidence: 98,
    source: "Inspection Photos",
    severity: "critical",
  },
  {
    id: "env-1",
    category: "environmental",
    title: "Ambient Temperature",
    value: "24.3°C (within spec)",
    confidence: 99,
    source: "IoT Sensors",
    severity: "normal",
  },
  {
    id: "env-2",
    category: "environmental",
    title: "Humidity Level",
    value: "67% - Above recommended threshold",
    confidence: 99,
    source: "IoT Sensors",
    severity: "warning",
  },
  {
    id: "obs-1",
    category: "observation",
    title: "Structural Assessment",
    value: "Minor concrete spalling observed in loading bay",
    confidence: 87,
    source: "Field Notes",
    severity: "warning",
  },
  {
    id: "obs-2",
    category: "observation",
    title: "Safety Equipment",
    value: "All fire extinguishers inspected and current",
    confidence: 100,
    source: "Field Notes",
    severity: "normal",
  },
  {
    id: "meas-1",
    category: "measurement",
    title: "Power Consumption",
    value: "Peak load 847kW (92% of rated capacity)",
    confidence: 96,
    source: "IoT Sensors",
    severity: "warning",
  },
  {
    id: "meas-2",
    category: "measurement",
    title: "Vibration Analysis",
    value: "HVAC A1: 4.2mm/s RMS (threshold: 4.5mm/s)",
    confidence: 95,
    source: "IoT Sensors",
    severity: "warning",
  },
];

export const MOCK_PATTERNS: PatternAnomaly[] = [
  {
    id: "pattern-1",
    type: "trend",
    title: "Rising Power Consumption",
    description: "15% increase in peak load over 6 months",
    severity: "warning",
    dataPoints: [720, 745, 780, 810, 830, 847],
    recommendation: "Schedule electrical capacity review",
  },
  {
    id: "pattern-2",
    type: "anomaly",
    title: "HVAC Vibration Spike",
    description: "Unusual vibration pattern detected 3 days ago",
    severity: "warning",
    dataPoints: [2.1, 2.3, 2.2, 4.8, 4.2, 4.0],
    recommendation: "Inspect HVAC bearings and motor mounts",
  },
  {
    id: "pattern-3",
    type: "anomaly",
    title: "Thermal Hotspot Detected",
    description: "Electrical panel B3 showing 45°C above ambient",
    severity: "critical",
    recommendation: "Immediate inspection required - potential fire hazard",
  },
  {
    id: "pattern-4",
    type: "correlation",
    title: "Humidity-Corrosion Link",
    description: "High humidity periods correlate with equipment degradation",
    severity: "info",
    recommendation: "Consider dehumidification system upgrade",
  },
];

export const MOCK_COMPLIANCE: ComplianceItem[] = [
  {
    id: "comp-1",
    standard: "AS/NZS 3000",
    requirement: "Electrical installation safety",
    status: "fail",
    details: "Panel B3 thermal anomaly exceeds safe operating parameters",
    remediation: "Immediate load reduction and breaker inspection required",
  },
  {
    id: "comp-2",
    standard: "AS/NZS 3000",
    requirement: "Circuit protection adequacy",
    status: "pass",
    details: "All circuit breakers rated appropriately for connected loads",
  },
  {
    id: "comp-3",
    standard: "ISO 55001",
    requirement: "Asset condition monitoring",
    status: "pass",
    details: "Continuous monitoring system in place with alerting",
  },
  {
    id: "comp-4",
    standard: "ISO 55001",
    requirement: "Preventive maintenance schedule",
    status: "review",
    details: "HVAC maintenance interval may need reduction based on vibration data",
    remediation: "Review maintenance frequency for HVAC systems",
  },
  {
    id: "comp-5",
    standard: "WHS Regulations",
    requirement: "Fire safety equipment",
    status: "pass",
    details: "All fire extinguishers current and accessible",
  },
  {
    id: "comp-6",
    standard: "Building Code",
    requirement: "Structural integrity",
    status: "review",
    details: "Minor concrete spalling requires assessment for progression",
    remediation: "Schedule structural engineer inspection within 30 days",
  },
];

export const MOCK_REPORT_SECTIONS: ReportSection[] = [
  {
    id: "exec-summary",
    title: "Executive Summary",
    content: `This technical inspection report covers the quarterly assessment of the Industrial Facility at 123 Factory Road. The inspection identified **3 critical findings** requiring immediate attention, **4 warnings** for scheduled review, and confirmed compliance with **8 of 10** regulatory requirements.

Key actions required:
- Immediate: Electrical panel B3 thermal remediation
- 7 days: HVAC vibration source investigation
- 30 days: Structural assessment of loading bay`,
    editable: true,
  },
  {
    id: "findings",
    title: "Key Findings",
    content: `### Critical Issues
1. **Electrical Panel B3 Hotspot** - Thermal imaging reveals dangerous temperature elevation at breaker 12. Risk of electrical fire.

2. **HVAC Vibration Anomaly** - Unit A1 showing progressive vibration increase indicating potential bearing failure.

### Warnings
1. Humidity levels exceeding recommended thresholds
2. Power consumption approaching rated capacity
3. Minor structural deterioration in loading bay
4. Maintenance interval review needed for HVAC`,
    editable: true,
  },
  {
    id: "analysis",
    title: "Technical Analysis",
    content: `### Data Sources Analyzed
- 2,847 IoT sensor readings over 90-day period
- 156 inspection photographs with AI analysis
- 48 technician field observations
- 12 historical reports for trend comparison

### Pattern Analysis
AI analysis identified a strong correlation (r=0.84) between high humidity periods and accelerated equipment degradation. Power consumption trend analysis projects capacity constraints within 8 months at current growth rate.`,
    editable: true,
  },
  {
    id: "recommendations",
    title: "Recommendations",
    content: `### Immediate Actions (0-7 days)
1. De-energize and inspect electrical panel B3
2. Install temporary load redistribution

### Short-term Actions (7-30 days)
1. HVAC bearing inspection and replacement if needed
2. Structural engineer assessment of loading bay

### Medium-term Actions (30-90 days)
1. Electrical capacity upgrade planning
2. Dehumidification system evaluation`,
    editable: true,
  },
];

export const MOCK_RECOMMENDATIONS: Recommendation[] = [
  {
    id: "rec-1",
    priority: "critical",
    title: "Electrical Panel B3 Remediation",
    description: "Immediate de-energization, inspection, and repair of overheating breaker circuit",
    riskLevel: 95,
    timeline: "0-48 hours",
    estimatedCost: "$2,500 - $5,000",
  },
  {
    id: "rec-2",
    priority: "high",
    title: "HVAC Bearing Replacement",
    description: "Preventive replacement of HVAC Unit A1 bearings before failure",
    riskLevel: 72,
    timeline: "7 days",
    estimatedCost: "$3,200 - $4,800",
  },
  {
    id: "rec-3",
    priority: "medium",
    title: "Structural Assessment",
    description: "Professional structural engineer evaluation of loading bay concrete spalling",
    riskLevel: 45,
    timeline: "30 days",
    estimatedCost: "$1,500 - $2,500",
  },
  {
    id: "rec-4",
    priority: "medium",
    title: "Dehumidification Upgrade",
    description: "Install industrial dehumidification to protect equipment longevity",
    riskLevel: 38,
    timeline: "60 days",
    estimatedCost: "$8,000 - $15,000",
  },
  {
    id: "rec-5",
    priority: "low",
    title: "Electrical Capacity Planning",
    description: "Begin capacity upgrade planning to accommodate growth projections",
    riskLevel: 25,
    timeline: "90 days",
    estimatedCost: "$50,000 - $120,000",
  },
];

export const MOCK_STAKEHOLDERS: Stakeholder[] = [
  {
    id: "stake-1",
    name: "John Mitchell",
    role: "Facility Manager",
    email: "j.mitchell@facility.com",
    selected: true,
  },
  {
    id: "stake-2",
    name: "Jane Smith",
    role: "Operations Director",
    email: "s.chen@operations.com",
    selected: true,
  },
  {
    id: "stake-3",
    name: "Mike Thompson",
    role: "Safety Officer",
    email: "m.thompson@safety.com",
    selected: false,
  },
  {
    id: "stake-4",
    name: "Lisa Park",
    role: "Maintenance Lead",
    email: "l.park@maintenance.com",
    selected: false,
  },
];

export const getCategoryIcon = (category: ExtractedData["category"]) => {
  switch (category) {
    case "equipment":
      return Gauge;
    case "environmental":
      return Thermometer;
    case "observation":
      return ClipboardList;
    case "measurement":
      return TrendingUp;
    default:
      return FileText;
  }
};

export const getCategoryColor = (category: ExtractedData["category"]) => {
  switch (category) {
    case "equipment":
      return "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30";
    case "environmental":
      return "bg-teal-500/20 text-teal-600 dark:text-teal-400 border-teal-500/30";
    case "observation":
      return "bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30";
    case "measurement":
      return "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

export const getSeverityColor = (severity: "normal" | "warning" | "critical" | undefined) => {
  switch (severity) {
    case "critical":
      return "text-rose-600 dark:text-rose-400";
    case "warning":
      return "text-amber-600 dark:text-amber-400";
    case "normal":
      return "text-emerald-600 dark:text-emerald-400";
    default:
      return "text-muted-foreground";
  }
};

export const getStatusColor = (status: ComplianceItem["status"]) => {
  switch (status) {
    case "pass":
      return "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    case "fail":
      return "bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30";
    case "review":
      return "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

export const getPriorityColor = (priority: Recommendation["priority"]) => {
  switch (priority) {
    case "critical":
      return "bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30";
    case "high":
      return "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30";
    case "medium":
      return "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30";
    case "low":
      return "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};
