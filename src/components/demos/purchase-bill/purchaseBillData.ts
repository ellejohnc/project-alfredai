// AI Purchase Bill Intake - Industry-specific mock data generators

export type BillStatus = "received" | "extracted" | "matched" | "needs_review" | "approved" | "synced" | "paid";
export type BillType = "hourly_service" | "contract_progress" | "itemised_materials" | "lump_sum" | "deposit" | "commission";
export type AIRecommendation = "auto_approve" | "route_finance" | "route_pm" | "request_revision" | "hold_clarification";
export type RiskSeverity = "low" | "medium" | "high";
export type SourceChannel = "email" | "upload" | "api";
export type Industry = "construction" | "real-estate" | "professional-services" | "healthcare" | "manufacturing" | "insurance";

export interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  cost_code: string;
  category: string;
}

export interface BankDetails {
  bsb: string;
  account_number: string;
  account_name: string;
}

export interface RiskFlag {
  type: string;
  severity: RiskSeverity;
  evidence: string;
  suggested_action: string;
}

export interface MatchResult {
  source: string;
  matched: boolean;
  confidence: number;
  explanation: string;
}

export interface PurchaseBill {
  id: string;
  supplier_id: string;
  supplier_name: string;
  supplier_abn: string;
  invoice_number: string;
  invoice_date: Date;
  due_date: Date;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  currency: "AUD";
  project_id: string;
  project_name: string;
  cost_code: string;
  source_channel: SourceChannel;
  attachment_url: string;
  po_reference?: string;
  po_amount?: number;
  wo_reference?: string;
  contract_reference?: string;
  claim_period_start?: Date;
  claim_period_end?: Date;
  line_items: LineItem[];
  bank_details: BankDetails;
  previous_bank_details?: BankDetails;
  confidence_score: number;
  field_confidence: Record<string, number>;
  risk_flags: RiskFlag[];
  match_results: MatchResult[];
  ai_recommendation: AIRecommendation;
  ai_recommendation_reason: string;
  bill_type: BillType;
  status: BillStatus;
  is_frozen?: boolean;
  frozen_at?: Date;
  frozen_reason?: string;
  created_at: Date;
  extracted_at?: Date;
  approved_at?: Date;
  synced_at?: Date;
}

// Industry-specific supplier data
const CONSTRUCTION_SUPPLIERS = [
  { name: "ABC Excavations Pty Ltd", abn: "12 345 678 901", category: "earthworks" },
  { name: "Premier Steel Fabricators", abn: "23 456 789 012", category: "steel" },
  { name: "Concrete Solutions Australia", abn: "34 567 890 123", category: "concrete" },
  { name: "SafeScaff Hire Co", abn: "45 678 901 234", category: "scaffolding" },
  { name: "Premier Plumbing Services", abn: "56 789 012 345", category: "plumbing" },
  { name: "ElectroPro Contractors", abn: "67 890 123 456", category: "electrical" },
  { name: "FormWork Masters", abn: "78 901 234 567", category: "formwork" },
  { name: "GreenScape Landscaping", abn: "89 012 345 678", category: "landscaping" },
  { name: "Precision Glazing Systems", abn: "90 123 456 789", category: "glazing" },
  { name: "RoofTech Australia", abn: "01 234 567 890", category: "roofing" },
];

const REAL_ESTATE_SUPPLIERS = [
  { name: "PropCare Maintenance", abn: "11 222 333 444", category: "maintenance" },
  { name: "Crystal Clean Services", abn: "22 333 444 555", category: "cleaning" },
  { name: "SecureGuard Properties", abn: "33 444 555 666", category: "security" },
  { name: "GreenThumb Gardens", abn: "44 555 666 777", category: "landscaping" },
  { name: "HVAC Solutions Group", abn: "55 666 777 888", category: "hvac" },
  { name: "PlumbFix Express", abn: "66 777 888 999", category: "plumbing" },
  { name: "Strata Management Co", abn: "77 888 999 000", category: "strata" },
  { name: "Pest Control Plus", abn: "88 999 000 111", category: "pest" },
  { name: "Fire Safety Systems", abn: "99 000 111 222", category: "fire-safety" },
  { name: "Elevator Services Co", abn: "00 111 222 333", category: "elevator" },
];

const PROFESSIONAL_SERVICES_SUPPLIERS = [
  { name: "TechFlow IT Solutions", abn: "12 121 212 121", category: "it" },
  { name: "CloudBase Software", abn: "23 232 323 232", category: "software" },
  { name: "Office Essentials Plus", abn: "34 343 434 343", category: "supplies" },
  { name: "Executive Training Academy", abn: "45 454 545 454", category: "training" },
  { name: "Corporate Travel Solutions", abn: "56 565 656 565", category: "travel" },
  { name: "Strategic Consulting Group", abn: "67 676 767 676", category: "consulting" },
  { name: "Legal Eagles Associates", abn: "78 787 878 787", category: "legal" },
  { name: "Marketing Dynamics", abn: "89 898 989 898", category: "marketing" },
  { name: "HR Pro Services", abn: "90 909 090 909", category: "hr" },
  { name: "Financial Advisory Partners", abn: "01 010 101 010", category: "finance" },
];

const HEALTHCARE_SUPPLIERS = [
  { name: "MedEquip Australia", abn: "11 111 222 333", category: "equipment" },
  { name: "PharmaCare Wholesale", abn: "22 222 333 444", category: "pharmacy" },
  { name: "CleanRoom Services", abn: "33 333 444 555", category: "sterilization" },
  { name: "PathLab Diagnostics", abn: "44 444 555 666", category: "diagnostics" },
  { name: "MedWaste Solutions", abn: "55 555 666 777", category: "waste" },
  { name: "Surgical Supplies Direct", abn: "66 666 777 888", category: "surgical" },
  { name: "Linen & Laundry Healthcare", abn: "77 777 888 999", category: "linen" },
  { name: "RadTech Imaging", abn: "88 888 999 000", category: "imaging" },
  { name: "OxygenPlus Medical", abn: "99 999 000 111", category: "gases" },
  { name: "Patient Transport Services", abn: "00 000 111 222", category: "transport" },
];

const MANUFACTURING_SUPPLIERS = [
  { name: "SteelCore Industries", abn: "12 312 312 312", category: "raw-materials" },
  { name: "Precision Parts Co", abn: "23 423 423 423", category: "components" },
  { name: "Industrial Lubricants Ltd", abn: "34 534 534 534", category: "consumables" },
  { name: "AutoMach Robotics", abn: "45 645 645 645", category: "automation" },
  { name: "QualityTest Labs", abn: "56 756 756 756", category: "testing" },
  { name: "PackagePro Solutions", abn: "67 867 867 867", category: "packaging" },
  { name: "Forklift Hire Australia", abn: "78 978 978 978", category: "equipment" },
  { name: "Tooling Masters", abn: "89 089 089 089", category: "tooling" },
  { name: "SafetyFirst PPE", abn: "90 190 190 190", category: "safety" },
  { name: "Logistics Express", abn: "01 201 201 201", category: "freight" },
];

const INSURANCE_SUPPLIERS = [
  { name: "ClaimsPro Assessors", abn: "11 311 311 311", category: "claims" },
  { name: "Actuarial Partners", abn: "22 422 422 422", category: "actuarial" },
  { name: "RiskGuard Consulting", abn: "33 533 533 533", category: "risk" },
  { name: "Legal Defence Associates", abn: "44 644 644 644", category: "legal" },
  { name: "Fraud Detection Services", abn: "55 755 755 755", category: "fraud" },
  { name: "Policy Admin Systems", abn: "66 866 866 866", category: "software" },
  { name: "Underwriting Support Co", abn: "77 977 977 977", category: "underwriting" },
  { name: "ReinsureTech Global", abn: "88 088 088 088", category: "reinsurance" },
  { name: "Compliance Auditors", abn: "99 199 199 199", category: "compliance" },
  { name: "Customer Contact Centre", abn: "00 200 200 200", category: "customer-service" },
];

// Industry-specific projects
const CONSTRUCTION_PROJECTS = [
  { id: "PRJ-CON-001", name: "Riverside Tower Development", code: "RIV-2024" },
  { id: "PRJ-CON-002", name: "Metro Rail Extension Stage 3", code: "MRE-2024" },
  { id: "PRJ-CON-003", name: "Harbourside Commercial Complex", code: "HCC-2024" },
  { id: "PRJ-CON-004", name: "Northern Schools Upgrade", code: "NSU-2024" },
  { id: "PRJ-CON-005", name: "Industrial Park Phase 2", code: "IND-2024" },
];

const REAL_ESTATE_PROJECTS = [
  { id: "PRJ-RE-001", name: "Parkview Residential Complex", code: "PVR-2024" },
  { id: "PRJ-RE-002", name: "Central Business Tower", code: "CBT-2024" },
  { id: "PRJ-RE-003", name: "Suburban Shopping Centre", code: "SSC-2024" },
  { id: "PRJ-RE-004", name: "Waterfront Apartments", code: "WFA-2024" },
  { id: "PRJ-RE-005", name: "Heritage Office Building", code: "HOB-2024" },
];

const PROFESSIONAL_SERVICES_PROJECTS = [
  { id: "PRJ-PS-001", name: "Digital Transformation Initiative", code: "DTI-2024" },
  { id: "PRJ-PS-002", name: "Client Portal Development", code: "CPD-2024" },
  { id: "PRJ-PS-003", name: "Office Relocation Project", code: "ORP-2024" },
  { id: "PRJ-PS-004", name: "Annual Compliance Review", code: "ACR-2024" },
  { id: "PRJ-PS-005", name: "Employee Training Program", code: "ETP-2024" },
];

const HEALTHCARE_PROJECTS = [
  { id: "PRJ-HC-001", name: "Emergency Department Upgrade", code: "EDU-2024" },
  { id: "PRJ-HC-002", name: "Pathology Lab Expansion", code: "PLE-2024" },
  { id: "PRJ-HC-003", name: "Patient Management System", code: "PMS-2024" },
  { id: "PRJ-HC-004", name: "Medical Equipment Refresh", code: "MER-2024" },
  { id: "PRJ-HC-005", name: "Infection Control Program", code: "ICP-2024" },
];

const MANUFACTURING_PROJECTS = [
  { id: "PRJ-MF-001", name: "Production Line Automation", code: "PLA-2024" },
  { id: "PRJ-MF-002", name: "Quality Control Enhancement", code: "QCE-2024" },
  { id: "PRJ-MF-003", name: "Warehouse Expansion Phase 2", code: "WEP-2024" },
  { id: "PRJ-MF-004", name: "Sustainable Packaging Initiative", code: "SPI-2024" },
  { id: "PRJ-MF-005", name: "Equipment Maintenance Program", code: "EMP-2024" },
];

const INSURANCE_PROJECTS = [
  { id: "PRJ-IN-001", name: "Claims Processing Automation", code: "CPA-2024" },
  { id: "PRJ-IN-002", name: "Policy Administration Upgrade", code: "PAU-2024" },
  { id: "PRJ-IN-003", name: "Fraud Detection Enhancement", code: "FDE-2024" },
  { id: "PRJ-IN-004", name: "Customer Portal Redesign", code: "CPR-2024" },
  { id: "PRJ-IN-005", name: "Regulatory Compliance Update", code: "RCU-2024" },
];

// Industry-specific line item templates
const CONSTRUCTION_LINE_ITEMS = [
  { desc: "Earthworks & Site Preparation", code: "EARTH", cat: "Civil" },
  { desc: "Concrete Supply & Pour", code: "CONC", cat: "Structure" },
  { desc: "Steel Reinforcement", code: "REBAR", cat: "Structure" },
  { desc: "Formwork Installation", code: "FORM", cat: "Structure" },
  { desc: "Scaffolding Hire - Weekly", code: "SCAFF", cat: "Plant" },
  { desc: "Electrical Rough-In", code: "ELEC", cat: "Services" },
  { desc: "Plumbing Rough-In", code: "PLUMB", cat: "Services" },
  { desc: "HVAC Ductwork", code: "HVAC", cat: "Services" },
  { desc: "Safety Equipment & PPE", code: "SAFETY", cat: "Prelims" },
  { desc: "Site Mobilisation", code: "MOBIL", cat: "Prelims" },
  { desc: "Progress Claim - Milestone 3", code: "PROG", cat: "Claims" },
  { desc: "Variation Works - Client Request", code: "VAR", cat: "Variations" },
];

const REAL_ESTATE_LINE_ITEMS = [
  { desc: "Monthly Cleaning Service", code: "CLEAN", cat: "Maintenance" },
  { desc: "HVAC Quarterly Service", code: "HVAC-SVC", cat: "Maintenance" },
  { desc: "Plumbing Repairs", code: "PLUMB-REP", cat: "Repairs" },
  { desc: "Garden Maintenance - Monthly", code: "GARDEN", cat: "Grounds" },
  { desc: "Security Patrol Service", code: "SECURITY", cat: "Services" },
  { desc: "Fire Safety Inspection", code: "FIRE", cat: "Compliance" },
  { desc: "Elevator Maintenance", code: "ELEV", cat: "Services" },
  { desc: "Strata Levy - Q1 2025", code: "STRATA", cat: "Levies" },
  { desc: "Emergency Repair Call-Out", code: "EMERG", cat: "Repairs" },
  { desc: "Pest Control Treatment", code: "PEST", cat: "Services" },
];

const PROFESSIONAL_SERVICES_LINE_ITEMS = [
  { desc: "Software License - Annual", code: "SW-LIC", cat: "IT" },
  { desc: "Cloud Hosting - Monthly", code: "CLOUD", cat: "IT" },
  { desc: "Consulting Services - Project", code: "CONSULT", cat: "Professional" },
  { desc: "Staff Training Workshop", code: "TRAIN", cat: "Development" },
  { desc: "Office Supplies - Monthly", code: "SUPPLIES", cat: "Operations" },
  { desc: "Travel Expenses Reimbursement", code: "TRAVEL", cat: "Expenses" },
  { desc: "Marketing Campaign Services", code: "MKTG", cat: "Marketing" },
  { desc: "Legal Advisory Retainer", code: "LEGAL", cat: "Professional" },
  { desc: "IT Support & Maintenance", code: "IT-SUPP", cat: "IT" },
  { desc: "Recruitment Fees", code: "RECRUIT", cat: "HR" },
];

const HEALTHCARE_LINE_ITEMS = [
  { desc: "Medical Equipment Lease - Monthly", code: "MED-EQUIP", cat: "Equipment" },
  { desc: "Pharmaceutical Supplies", code: "PHARMA", cat: "Pharmacy" },
  { desc: "Pathology Testing Services", code: "PATH", cat: "Diagnostics" },
  { desc: "Sterilisation Services", code: "STERIL", cat: "Infection Control" },
  { desc: "Medical Waste Disposal", code: "WASTE", cat: "Compliance" },
  { desc: "Linen & Laundry Services", code: "LINEN", cat: "Operations" },
  { desc: "Surgical Consumables", code: "SURG", cat: "Clinical" },
  { desc: "Radiology Services", code: "RAD", cat: "Imaging" },
  { desc: "Patient Transport", code: "TRANSPORT", cat: "Services" },
  { desc: "Medical Gas Supply", code: "GAS", cat: "Clinical" },
];

const MANUFACTURING_LINE_ITEMS = [
  { desc: "Raw Materials - Steel", code: "RAW-STEEL", cat: "Materials" },
  { desc: "Component Parts - Batch", code: "COMP", cat: "Components" },
  { desc: "Industrial Lubricants", code: "LUBE", cat: "Consumables" },
  { desc: "Robotic Arm Maintenance", code: "ROBOT", cat: "Automation" },
  { desc: "Quality Testing Services", code: "QA-TEST", cat: "Quality" },
  { desc: "Packaging Materials", code: "PACK", cat: "Packaging" },
  { desc: "Forklift Hire - Monthly", code: "FORK", cat: "Equipment" },
  { desc: "Tooling & Dies", code: "TOOL", cat: "Tooling" },
  { desc: "PPE & Safety Equipment", code: "PPE", cat: "Safety" },
  { desc: "Freight & Logistics", code: "FREIGHT", cat: "Logistics" },
];

const INSURANCE_LINE_ITEMS = [
  { desc: "Claims Assessment Services", code: "CLAIMS", cat: "Claims" },
  { desc: "Actuarial Analysis - Quarterly", code: "ACTUARY", cat: "Actuarial" },
  { desc: "Risk Consulting Engagement", code: "RISK", cat: "Risk" },
  { desc: "Legal Defence Costs", code: "LEGAL-DEF", cat: "Legal" },
  { desc: "Fraud Investigation Services", code: "FRAUD", cat: "Fraud" },
  { desc: "Policy Admin System License", code: "POLICY-SYS", cat: "IT" },
  { desc: "Underwriting Support", code: "UW-SUPP", cat: "Underwriting" },
  { desc: "Reinsurance Treaty Premium", code: "REINS", cat: "Reinsurance" },
  { desc: "Compliance Audit Services", code: "AUDIT", cat: "Compliance" },
  { desc: "Call Centre Services", code: "CALL", cat: "Customer Service" },
];

// Discrepancy templates by industry
const CONSTRUCTION_DISCREPANCIES: RiskFlag[] = [
  { type: "amount_exceeds_po", severity: "high", evidence: "Invoice total exceeds PO by 21%", suggested_action: "Verify variation approval before processing" },
  { type: "claim_period_overlap", severity: "medium", evidence: "Claim period overlaps with previous invoice INV-2024-0845", suggested_action: "Review claim breakdown for duplicate items" },
  { type: "retention_calculation", severity: "medium", evidence: "Retention not calculated at agreed 5%", suggested_action: "Apply retention before approval" },
  { type: "missing_wo_reference", severity: "low", evidence: "No Work Order reference provided", suggested_action: "Request WO number from supplier" },
  { type: "rate_mismatch", severity: "high", evidence: "Hourly rate $185/hr vs contract rate $165/hr", suggested_action: "Query rate increase with subcontractor" },
  { type: "unapproved_variation", severity: "high", evidence: "Variation works claimed without signed VO", suggested_action: "Hold until variation order approved" },
];

const REAL_ESTATE_DISCREPANCIES: RiskFlag[] = [
  { type: "duplicate_service_charge", severity: "high", evidence: "Same service invoiced on 15-Jan and 18-Jan", suggested_action: "Reject duplicate invoice" },
  { type: "budget_overrun", severity: "medium", evidence: "YTD spend $45,000 vs budget $40,000", suggested_action: "Flag for property manager review" },
  { type: "unauthorized_repair", severity: "high", evidence: "Repair not pre-approved per management agreement", suggested_action: "Verify emergency authorization" },
  { type: "missing_quote_approval", severity: "medium", evidence: "Works over $500 require pre-approval", suggested_action: "Request approval documentation" },
  { type: "tenant_recharge_required", severity: "low", evidence: "Repair is tenant responsibility per lease", suggested_action: "Process as tenant recharge" },
];

const PROFESSIONAL_SERVICES_DISCREPANCIES: RiskFlag[] = [
  { type: "rate_card_mismatch", severity: "high", evidence: "Consultant rate $350/hr vs agreed $295/hr", suggested_action: "Query rate with vendor" },
  { type: "unapproved_vendor", severity: "high", evidence: "Vendor not on approved supplier list", suggested_action: "Complete vendor onboarding first" },
  { type: "missing_timesheet", severity: "medium", evidence: "No timesheet backup for 40 hours claimed", suggested_action: "Request timesheet evidence" },
  { type: "expense_policy_breach", severity: "medium", evidence: "Travel class exceeds policy limit", suggested_action: "Reduce to policy limit" },
  { type: "duplicate_subscription", severity: "low", evidence: "Similar software already licensed", suggested_action: "Verify no overlap with existing tools" },
];

const HEALTHCARE_DISCREPANCIES: RiskFlag[] = [
  { type: "expired_contract_pricing", severity: "high", evidence: "Contract expired 30-Nov, new rates not agreed", suggested_action: "Negotiate new contract before payment" },
  { type: "quantity_variance", severity: "medium", evidence: "Ordered 500 units, invoiced 650 units", suggested_action: "Verify delivery records" },
  { type: "non_compliant_supplier", severity: "high", evidence: "Supplier TGA certification expired", suggested_action: "Suspend orders until recertified" },
  { type: "duplicate_pathology_charge", severity: "medium", evidence: "Same test billed twice for patient batch", suggested_action: "Request itemized breakdown" },
  { type: "missing_po", severity: "low", evidence: "Emergency order without purchase order", suggested_action: "Create retrospective PO" },
];

const MANUFACTURING_DISCREPANCIES: RiskFlag[] = [
  { type: "specification_mismatch", severity: "high", evidence: "Steel grade 304 invoiced vs 316 ordered", suggested_action: "Verify materials received match order" },
  { type: "delivery_shortage", severity: "medium", evidence: "Received 950 units, invoiced 1,000 units", suggested_action: "Request credit for shortage" },
  { type: "quality_rejection", severity: "high", evidence: "15% of batch rejected by QA", suggested_action: "Deduct rejected units from payment" },
  { type: "freight_overcharge", severity: "medium", evidence: "Freight $2,400 vs quoted $1,800", suggested_action: "Query additional charges" },
  { type: "early_invoice", severity: "low", evidence: "Invoiced before goods dispatched", suggested_action: "Hold until delivery confirmed" },
];

const INSURANCE_DISCREPANCIES: RiskFlag[] = [
  { type: "duplicate_claim_assessment", severity: "high", evidence: "Same claim assessed twice by different firms", suggested_action: "Reject duplicate assessment" },
  { type: "fee_exceeds_schedule", severity: "high", evidence: "Actuarial fee $45,000 vs schedule $35,000", suggested_action: "Query scope increase" },
  { type: "unapproved_legal_spend", severity: "medium", evidence: "Legal fees exceed authorized limit", suggested_action: "Obtain retrospective approval" },
  { type: "missing_claim_reference", severity: "low", evidence: "No claim number on invoice", suggested_action: "Request claim allocation" },
  { type: "treaty_calculation_error", severity: "high", evidence: "Reinsurance premium calculation differs by 8%", suggested_action: "Verify treaty terms" },
];

// Utility functions
function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateInvoiceNumber(): string {
  const year = 2025;
  const num = randomBetween(1000, 9999);
  return `INV-${year}-${num}`;
}

function generatePONumber(): string {
  const year = 2024;
  const num = randomBetween(100, 999);
  return `PO-${year}-${num}`;
}

function generateBankDetails(): BankDetails {
  return {
    bsb: `0${randomBetween(60, 65)}-${randomBetween(100, 999)}`,
    account_number: `${randomBetween(10000000, 99999999)}`,
    account_name: "Trust Account",
  };
}

function generateDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

function generateDueDate(invoiceDate: Date, terms: number = 30): Date {
  const dueDate = new Date(invoiceDate);
  dueDate.setDate(dueDate.getDate() + terms);
  return dueDate;
}

// Main generator function
export function generatePurchaseBill(industry: Industry, index: number): PurchaseBill {
  const suppliers = industry === "construction" ? CONSTRUCTION_SUPPLIERS :
                    industry === "real-estate" ? REAL_ESTATE_SUPPLIERS :
                    industry === "healthcare" ? HEALTHCARE_SUPPLIERS :
                    industry === "manufacturing" ? MANUFACTURING_SUPPLIERS :
                    industry === "insurance" ? INSURANCE_SUPPLIERS :
                    PROFESSIONAL_SERVICES_SUPPLIERS;
  
  const projects = industry === "construction" ? CONSTRUCTION_PROJECTS :
                   industry === "real-estate" ? REAL_ESTATE_PROJECTS :
                   industry === "healthcare" ? HEALTHCARE_PROJECTS :
                   industry === "manufacturing" ? MANUFACTURING_PROJECTS :
                   industry === "insurance" ? INSURANCE_PROJECTS :
                   PROFESSIONAL_SERVICES_PROJECTS;
  
  const lineItemTemplates = industry === "construction" ? CONSTRUCTION_LINE_ITEMS :
                            industry === "real-estate" ? REAL_ESTATE_LINE_ITEMS :
                            industry === "healthcare" ? HEALTHCARE_LINE_ITEMS :
                            industry === "manufacturing" ? MANUFACTURING_LINE_ITEMS :
                            industry === "insurance" ? INSURANCE_LINE_ITEMS :
                            PROFESSIONAL_SERVICES_LINE_ITEMS;
  
  const discrepancyPool = industry === "construction" ? CONSTRUCTION_DISCREPANCIES :
                          industry === "real-estate" ? REAL_ESTATE_DISCREPANCIES :
                          industry === "healthcare" ? HEALTHCARE_DISCREPANCIES :
                          industry === "manufacturing" ? MANUFACTURING_DISCREPANCIES :
                          industry === "insurance" ? INSURANCE_DISCREPANCIES :
                          PROFESSIONAL_SERVICES_DISCREPANCIES;

  const supplier = randomFromArray(suppliers);
  const project = randomFromArray(projects);
  const invoiceDate = generateDate(randomBetween(1, 14));
  const dueDate = generateDueDate(invoiceDate);

  // Generate line items
  const numLineItems = randomBetween(2, 5);
  const lineItems: LineItem[] = [];
  let subtotal = 0;

  for (let i = 0; i < numLineItems; i++) {
    const template = randomFromArray(lineItemTemplates);
    const quantity = randomBetween(1, 20);
    const unitPrice = randomBetween(500, 25000);
    const total = quantity * unitPrice;
    subtotal += total;

    lineItems.push({
      description: template.desc,
      quantity,
      unit_price: unitPrice,
      total,
      cost_code: template.code,
      category: template.cat,
    });
  }

  const taxAmount = Math.round(subtotal * 0.1);
  const totalAmount = subtotal + taxAmount;

  // Bill type (defined early for received bills)
  const billTypes: BillType[] = industry === "construction"
    ? ["contract_progress", "itemised_materials", "hourly_service", "lump_sum"]
    : industry === "real-estate"
    ? ["hourly_service", "itemised_materials", "lump_sum"]
    : industry === "healthcare"
    ? ["hourly_service", "itemised_materials", "lump_sum"]
    : industry === "manufacturing"
    ? ["itemised_materials", "lump_sum", "contract_progress"]
    : industry === "insurance"
    ? ["hourly_service", "lump_sum", "commission"]
    : ["hourly_service", "lump_sum", "commission"];

  // Determine if this should be a "received" bill (10-15% of bills)
  const isReceivedOnly = Math.random() < 0.12;
  
  if (isReceivedOnly) {
    // Bills in "received" status have minimal data - not yet processed
    return {
      id: `BILL-${String(index + 1).padStart(4, "0")}`,
      supplier_id: `SUP-${supplier.abn.replace(/\s/g, "").slice(0, 6)}`,
      supplier_name: supplier.name,
      supplier_abn: supplier.abn,
      invoice_number: generateInvoiceNumber(),
      invoice_date: invoiceDate,
      due_date: dueDate,
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      currency: "AUD" as const,
      project_id: project.id,
      project_name: project.name,
      cost_code: project.code,
      source_channel: randomFromArray(["email", "upload", "api"] as SourceChannel[]),
      attachment_url: `/invoices/${generateInvoiceNumber()}.pdf`,
      line_items: [], // Not yet extracted
      bank_details: { bsb: "", account_number: "", account_name: "" },
      confidence_score: 0, // Not yet extracted
      field_confidence: {},
      risk_flags: [], // Not yet analyzed
      match_results: [], // Not yet matched
      ai_recommendation: "hold_clarification" as AIRecommendation,
      ai_recommendation_reason: "Invoice received but not yet processed. AI extraction pending.",
      bill_type: billTypes[0],
      status: "received" as BillStatus,
      created_at: invoiceDate,
      extracted_at: undefined,
      approved_at: undefined,
      synced_at: undefined,
    };
  }

  // Determine status and recommendation based on randomization
  const hasDiscrepancy = Math.random() > 0.6;
  const highConfidence = Math.random() > 0.3;
  const confidenceScore = highConfidence ? randomBetween(85, 99) : randomBetween(65, 84);

  // Generate field confidence scores
  const fieldConfidence: Record<string, number> = {
    supplier_name: randomBetween(92, 99),
    invoice_number: randomBetween(95, 99),
    invoice_date: randomBetween(90, 99),
    subtotal: randomBetween(88, 98),
    tax_amount: randomBetween(85, 97),
    total_amount: randomBetween(92, 99),
  };

  // Generate risk flags
  const riskFlags: RiskFlag[] = [];
  if (hasDiscrepancy) {
    const numDiscrepancies = randomBetween(1, 2);
    const usedTypes = new Set<string>();
    for (let i = 0; i < numDiscrepancies; i++) {
      const flag = randomFromArray(discrepancyPool);
      if (!usedTypes.has(flag.type)) {
        riskFlags.push(flag);
        usedTypes.add(flag.type);
      }
    }
  }

  // Determine recommendation
  let recommendation: AIRecommendation;
  let recommendationReason: string;

  if (riskFlags.some(f => f.severity === "high")) {
    recommendation = Math.random() > 0.5 ? "route_pm" : "route_finance";
    recommendationReason = `High-severity issue detected: ${riskFlags.find(f => f.severity === "high")?.type}. Manual review required.`;
  } else if (riskFlags.length > 0) {
    recommendation = "route_finance";
    recommendationReason = `Medium-severity issue requires finance team verification before approval.`;
  } else if (confidenceScore >= 90) {
    recommendation = "auto_approve";
    recommendationReason = "All validations passed. Invoice matches PO within tolerance. No discrepancies detected.";
  } else {
    recommendation = "hold_clarification";
    recommendationReason = `Extraction confidence below threshold (${confidenceScore}%). Manual verification recommended.`;
  }

  // Determine status based on scenario
  const statusOptions: BillStatus[] = hasDiscrepancy ? ["needs_review"] : 
                        recommendation === "auto_approve" ? ["matched", "approved", "synced"] :
                        ["extracted", "matched", "needs_review"];
  const status = randomFromArray(statusOptions);

  // Generate match results
  const matchResults: MatchResult[] = [
    {
      source: "Approved Supplier List",
      matched: true,
      confidence: 100,
      explanation: `${supplier.name} is an approved supplier since 2022`,
    },
    {
      source: "Purchase Order",
      matched: !hasDiscrepancy || riskFlags.every(f => f.type !== "amount_exceeds_po"),
      confidence: hasDiscrepancy ? randomBetween(60, 80) : randomBetween(90, 99),
      explanation: hasDiscrepancy ? "Amount exceeds PO by 21%" : "Invoice within PO tolerance (±5%)",
    },
    {
      source: "Contract Schedule",
      matched: true,
      confidence: randomBetween(85, 98),
      explanation: "Matches contract line item for this cost code",
    },
    {
      source: "Duplicate Check",
      matched: true,
      confidence: 100,
      explanation: "No duplicate invoices found in last 12 months",
    },
  ];

  // PO reference and amount
  const poReference = generatePONumber();
  const poAmount = hasDiscrepancy && riskFlags.some(f => f.type === "amount_exceeds_po")
    ? Math.round(totalAmount * 0.82)
    : Math.round(totalAmount * 1.05);

  // Bank details (with possible change flag)
  const currentBankDetails = generateBankDetails();
  const hasBankChange = Math.random() > 0.85;
  const previousBankDetails = hasBankChange ? {
    bsb: "062-000",
    account_number: "12345678",
    account_name: "Previous Account",
  } : undefined;

  if (hasBankChange && !riskFlags.some(f => f.type.includes("bank"))) {
    riskFlags.push({
      type: "bank_details_changed",
      severity: "high",
      evidence: `BSB changed from ${previousBankDetails?.bsb} to ${currentBankDetails.bsb}`,
      suggested_action: "Verify new bank details directly with supplier",
    });
  }

  const billType = randomFromArray(billTypes);

  return {
    id: `BILL-${String(index + 1).padStart(4, "0")}`,
    supplier_id: `SUP-${supplier.abn.replace(/\s/g, "").slice(0, 6)}`,
    supplier_name: supplier.name,
    supplier_abn: supplier.abn,
    invoice_number: generateInvoiceNumber(),
    invoice_date: invoiceDate,
    due_date: dueDate,
    subtotal,
    tax_amount: taxAmount,
    total_amount: totalAmount,
    currency: "AUD",
    project_id: project.id,
    project_name: project.name,
    cost_code: project.code,
    source_channel: randomFromArray(["email", "upload", "api"] as SourceChannel[]),
    attachment_url: `/invoices/${generateInvoiceNumber()}.pdf`,
    po_reference: poReference,
    po_amount: poAmount,
    line_items: lineItems,
    bank_details: currentBankDetails,
    previous_bank_details: previousBankDetails,
    confidence_score: confidenceScore,
    field_confidence: fieldConfidence,
    risk_flags: riskFlags,
    match_results: matchResults,
    ai_recommendation: recommendation,
    ai_recommendation_reason: recommendationReason,
    bill_type: billType,
    status,
    created_at: invoiceDate,
    extracted_at: status !== "received" ? new Date(invoiceDate.getTime() + 60000) : undefined,
    approved_at: status === "approved" || status === "synced" || status === "paid" ? new Date() : undefined,
    synced_at: status === "synced" || status === "paid" ? new Date() : undefined,
  };
}

// Generate a batch of bills for an industry
export function generateBillBatch(industry: Industry, count: number = 20): PurchaseBill[] {
  const bills: PurchaseBill[] = [];
  for (let i = 0; i < count; i++) {
    bills.push(generatePurchaseBill(industry, i));
  }
  // Sort by status priority
  const statusOrder: Record<BillStatus, number> = {
    needs_review: 1,
    extracted: 2,
    matched: 3,
    received: 4,
    approved: 5,
    synced: 6,
    paid: 7,
  };
  return bills.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
}

// Get summary statistics
export function getBatchStats(bills: PurchaseBill[]) {
  const stats = {
    total: bills.length,
    received: 0,
    extracted: 0,
    matched: 0,
    needs_review: 0,
    approved: 0,
    synced: 0,
    paid: 0,
    totalValue: 0,
    avgConfidence: 0,
    highRiskCount: 0,
    autoApproveEligible: 0,
    availableFunds: 0,
  };

  let confidenceSum = 0;

  bills.forEach((bill) => {
    stats[bill.status]++;
    stats.totalValue += bill.total_amount;
    confidenceSum += bill.confidence_score;
    
    if (bill.risk_flags.some(f => f.severity === "high")) {
      stats.highRiskCount++;
    }
    
    if (bill.ai_recommendation === "auto_approve") {
      stats.autoApproveEligible++;
    }
  });

  stats.avgConfidence = bills.length > 0 ? Math.round(confidenceSum / bills.length) : 0;

  // Calculate realistic available funds based on payables
  // Business logic: Companies typically maintain 1.3x to 2.2x their AP in working capital
  // Tighter cash = 1.15-1.4x (some pressure), healthy = 1.5-1.8x, comfortable = 1.9-2.5x
  const cashMultiplier = 1.25 + (Math.random() * 0.9); // 1.25x to 2.15x
  const rawFunds = stats.totalValue * cashMultiplier;
  
  // Round to nearest $5,000 for realism
  stats.availableFunds = Math.round(rawFunds / 5000) * 5000;
  
  // Ensure minimum of $25,000 for very small batches
  stats.availableFunds = Math.max(stats.availableFunds, 25000);

  return stats;
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format date
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

// Get status display info
export function getStatusDisplay(status: BillStatus): { label: string; color: string; icon: string } {
  const displays: Record<BillStatus, { label: string; color: string; icon: string }> = {
    received: { label: "Received", color: "bg-slate-500", icon: "📥" },
    extracted: { label: "Extracted", color: "bg-blue-500", icon: "🔍" },
    matched: { label: "Matched", color: "bg-cyan-500", icon: "🔗" },
    needs_review: { label: "Needs Review", color: "bg-rose-500", icon: "⚠️" },
    approved: { label: "Approved", color: "bg-emerald-500", icon: "✓" },
    synced: { label: "Synced to Xero", color: "bg-teal-500", icon: "☁️" },
    paid: { label: "Paid", color: "bg-violet-500", icon: "💰" },
  };
  return displays[status];
}

// Get recommendation display
export function getRecommendationDisplay(rec: AIRecommendation): { label: string; color: string; description: string } {
  const displays: Record<AIRecommendation, { label: string; color: string; description: string }> = {
    auto_approve: { label: "Auto-Approve", color: "text-green-500", description: "All checks passed, safe for automatic processing" },
    route_finance: { label: "Route to Finance", color: "text-amber-500", description: "Requires finance team verification" },
    route_pm: { label: "Route to PM", color: "text-orange-500", description: "Requires project manager approval" },
    request_revision: { label: "Request Revision", color: "text-red-500", description: "Invoice contains errors, needs supplier correction" },
    hold_clarification: { label: "Hold for Clarification", color: "text-slate-500", description: "Pending additional information" },
  };
  return displays[rec];
}

// Get bill type display
export function getBillTypeDisplay(type: BillType): string {
  const displays: Record<BillType, string> = {
    hourly_service: "Hourly Service",
    contract_progress: "Contract Progress Claim",
    itemised_materials: "Itemised Materials",
    lump_sum: "Lump Sum",
    deposit: "Deposit",
    commission: "Commission",
  };
  return displays[type];
}

// Get industry display name
export function getIndustryDisplay(industry: Industry): string {
  const displays: Record<Industry, string> = {
    construction: "Construction",
    "real-estate": "Real Estate",
    "professional-services": "Professional Services",
    healthcare: "Healthcare",
    manufacturing: "Manufacturing",
    insurance: "Insurance",
  };
  return displays[industry];
}
