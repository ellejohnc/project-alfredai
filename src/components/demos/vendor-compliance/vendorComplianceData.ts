// Types and data generators for AI Vendor Compliance Agent Demo

export type DocumentType = 
  | "public_liability_insurance"
  | "workers_comp_insurance"
  | "professional_indemnity"
  | "electrical_license"
  | "plumbing_license"
  | "builders_license"
  | "whs_induction"
  | "swms"
  | "equipment_certification";

export type DocumentStatus = "current" | "expiring_soon" | "expired" | "missing" | "pending_review";

export type VendorStatus = "compliant" | "expiring" | "non_compliant";

export type PreferredChannel = "email" | "sms" | "voice";

export interface VerificationIssue {
  type: "vendor_mismatch" | "expired" | "coverage_insufficient" | "missing_field" | "unreadable";
  severity: "high" | "medium" | "low";
  description: string;
  suggested_action: string;
}

export interface ComplianceDocument {
  id: string;
  vendor_id: string;
  type: DocumentType;
  status: DocumentStatus;
  expiry_date: Date | null;
  policy_number?: string;
  coverage_amount?: number;
  issuer?: string;
  file_url?: string;
  uploaded_at?: Date;
  verified_at?: Date;
  verification_confidence?: number;
  verification_issues?: VerificationIssue[];
}

export interface ComplianceVendor {
  id: string;
  name: string;
  abn: string;
  trade: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  preferred_channel: PreferredChannel;
  overall_status: VendorStatus;
  documents: ComplianceDocument[];
  last_reminder_sent?: Date;
  reminder_count: number;
}

export interface FieldMatchDetail {
  field: string;
  extracted: string;
  expected: string;
  matchType: "exact" | "fuzzy" | "partial" | "mismatch";
}

export interface ExtractionResult {
  detected_type: DocumentType;
  detected_vendor_name: string;
  detected_expiry: Date | null;
  detected_policy_number?: string;
  detected_coverage?: number;
  field_confidence: {
    vendor_name: number;
    expiry_date: number;
    policy_number: number;
    coverage: number;
  };
  issues: VerificationIssue[];
  match_details?: FieldMatchDetail[];
}

export interface IncomingDocument {
  id: string;
  source: "email" | "portal_upload" | "api";
  received_at: Date;
  from_email?: string;
  from_name?: string;
  subject?: string;
  attachment_name: string;
  file_type: "pdf" | "jpg" | "png";
  file_size: number;
  status: "queued" | "processing" | "verified" | "needs_review" | "rejected";
  matched_vendor?: ComplianceVendor;
  matched_document_type?: DocumentType;
  ai_confidence: number;
  extraction_result?: ExtractionResult;
}

export interface IncomingEmail {
  id: string;
  from: string;
  from_name: string;
  subject: string;
  received_at: Date;
  attachments: EmailAttachment[];
  status: "new" | "processing" | "processed" | "failed";
  matched_vendor?: string;
}

export interface EmailAttachment {
  name: string;
  type: string;
  size: number;
  extracted: boolean;
  document_type?: DocumentType;
  confidence?: number;
}

// Demo scale numbers
export const DEMO_SCALE = {
  total_vendors: 247,
  total_documents_tracked: 2847,
  documents_current: 2103,
  documents_expiring_30d: 412,
  documents_expired: 198,
  documents_missing: 134,
  incoming_queue: 23,
  processed_today: 67,
  emails_received_today: 31,
  auto_verified: 45,
  manual_review: 22,
};

// Helper functions
export const getDocumentTypeLabel = (type: DocumentType): string => {
  const labels: Record<DocumentType, string> = {
    public_liability_insurance: "Public Liability Insurance",
    workers_comp_insurance: "Workers Compensation",
    professional_indemnity: "Professional Indemnity",
    electrical_license: "Electrical License",
    plumbing_license: "Plumbing License",
    builders_license: "Builders License",
    whs_induction: "WHS Induction",
    swms: "SWMS",
    equipment_certification: "Equipment Certification",
  };
  return labels[type];
};

export const getStatusColor = (status: VendorStatus | DocumentStatus): string => {
  switch (status) {
    case "compliant":
    case "current":
      return "emerald";
    case "expiring":
    case "expiring_soon":
    case "pending_review":
      return "amber";
    case "non_compliant":
    case "expired":
    case "missing":
      return "rose";
    default:
      return "slate";
  }
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date: Date | null): string => {
  if (!date) return "N/A";
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Trades for construction industry
const TRADES = [
  "Electrical",
  "Plumbing",
  "Structural Steel",
  "Carpentry",
  "Concrete",
  "Roofing",
  "HVAC",
  "Glazing",
  "Painting",
  "Flooring",
  "Excavation",
  "Landscaping",
  "Fire Protection",
  "Security Systems",
  "Demolition",
  "Scaffolding",
];

// Company name generators
const COMPANY_PREFIXES = [
  "Apex", "Pro", "Elite", "Master", "Premium", "First", "Prime", "Metro", 
  "Pacific", "Southern", "Northern", "Eastern", "Western", "Central", "Coast",
  "Bay", "River", "Mountain", "Valley", "Summit", "Peak", "Crown", "Royal",
  "Allied", "United", "National", "Australian", "Capital", "Southern", "Northern"
];

const COMPANY_SUFFIXES = [
  "Services", "Solutions", "Group", "Industries", "Pty Ltd", "Co", "Construction",
  "Contractors", "Specialists", "Works", "Projects", "Installations", "Systems"
];

// Name generators
const FIRST_NAMES = [
  "James", "Sarah", "Michael", "Emma", "David", "Jessica", "Daniel", "Sophie",
  "Matthew", "Olivia", "Andrew", "Emily", "Christopher", "Isabella", "Joshua",
  "Mia", "Ryan", "Charlotte", "Nathan", "Amelia", "Ben", "Grace", "Tom", "Chloe",
  "William", "Ava", "Jack", "Harper", "Liam", "Ella", "Noah", "Zoe", "Lucas"
];

const LAST_NAMES = [
  "Mitchell", "Chen", "Johnson", "Williams", "Smith", "Brown", "Taylor", "Wilson",
  "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson", "Garcia",
  "Martinez", "Robinson", "Clark", "Rodriguez", "Lewis", "Lee", "Walker", "Hall",
  "Allen", "Young", "Hernandez", "King", "Wright", "Lopez", "Hill", "Scott", "Green"
];

// Generate random ABN
const generateABN = (): string => {
  const digits = Array.from({ length: 11 }, () => Math.floor(Math.random() * 10));
  return `${digits.slice(0, 2).join("")} ${digits.slice(2, 5).join("")} ${digits.slice(5, 8).join("")} ${digits.slice(8).join("")}`;
};

// Generate random phone
const generatePhone = (): string => {
  const prefix = ["0412", "0423", "0434", "0445", "0456", "0467", "0478", "0489"][Math.floor(Math.random() * 8)];
  const rest = Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join("");
  return `${prefix} ${rest.slice(0, 3)} ${rest.slice(3)}`;
};

// Generate random date within range
const randomDate = (start: Date, end: Date): Date => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Generate a random company name based on trade
const generateCompanyName = (trade: string): string => {
  const prefix = COMPANY_PREFIXES[Math.floor(Math.random() * COMPANY_PREFIXES.length)];
  const suffix = COMPANY_SUFFIXES[Math.floor(Math.random() * COMPANY_SUFFIXES.length)];
  
  // Sometimes include trade in name
  if (Math.random() > 0.5) {
    return `${prefix} ${trade} ${suffix}`;
  }
  return `${prefix} ${suffix}`;
};

// Generate documents for a vendor
const generateDocuments = (vendorId: string, trade: string): ComplianceDocument[] => {
  const now = new Date();
  const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const docs: ComplianceDocument[] = [];
  
  // Public Liability Insurance (required for all)
  const plExpiry = randomDate(oneMonthAgo, oneYearFromNow);
  const plStatus: DocumentStatus = plExpiry < now ? "expired" : plExpiry < oneMonthFromNow ? "expiring_soon" : "current";
  docs.push({
    id: `${vendorId}-pli`,
    vendor_id: vendorId,
    type: "public_liability_insurance",
    status: plStatus,
    expiry_date: plExpiry,
    policy_number: `PLI-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    coverage_amount: [5000000, 10000000, 20000000][Math.floor(Math.random() * 3)],
    issuer: ["Prime Insurance", "National Insurance", "Secure Insurance", "Global Insurance", "Alliance Insurance"][Math.floor(Math.random() * 5)],
    uploaded_at: randomDate(new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000), now),
    verified_at: Math.random() > 0.3 ? randomDate(new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), now) : undefined,
    verification_confidence: Math.floor(Math.random() * 20) + 80,
  });

  // Workers Comp (required for all)
  const wcExpiry = randomDate(oneMonthAgo, oneYearFromNow);
  const wcStatus: DocumentStatus = wcExpiry < now ? "expired" : wcExpiry < oneMonthFromNow ? "expiring_soon" : "current";
  docs.push({
    id: `${vendorId}-wc`,
    vendor_id: vendorId,
    type: "workers_comp_insurance",
    status: wcStatus,
    expiry_date: wcExpiry,
    policy_number: `WC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    issuer: ["WorkCover Insurance", "Secure Insurance", "Prime Insurance", "General Insurance"][Math.floor(Math.random() * 4)],
    uploaded_at: randomDate(new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000), now),
    verified_at: Math.random() > 0.3 ? randomDate(new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), now) : undefined,
    verification_confidence: Math.floor(Math.random() * 20) + 80,
  });

  // Trade-specific license
  let licenseType: DocumentType | null = null;
  if (trade === "Electrical") licenseType = "electrical_license";
  else if (trade === "Plumbing") licenseType = "plumbing_license";
  else if (["Carpentry", "Concrete", "Roofing", "Demolition", "Scaffolding"].includes(trade)) licenseType = "builders_license";

  if (licenseType) {
    const licExpiry = randomDate(oneMonthAgo, oneYearFromNow);
    const licStatus: DocumentStatus = licExpiry < now ? "expired" : licExpiry < oneMonthFromNow ? "expiring_soon" : "current";
    docs.push({
      id: `${vendorId}-lic`,
      vendor_id: vendorId,
      type: licenseType,
      status: Math.random() > 0.1 ? licStatus : "missing",
      expiry_date: Math.random() > 0.1 ? licExpiry : null,
      policy_number: `LIC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      uploaded_at: Math.random() > 0.1 ? randomDate(new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000), now) : undefined,
      verified_at: Math.random() > 0.4 ? randomDate(new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), now) : undefined,
      verification_confidence: Math.floor(Math.random() * 25) + 75,
    });
  }

  // WHS Induction (random)
  if (Math.random() > 0.3) {
    const whsExpiry = randomDate(oneMonthAgo, oneYearFromNow);
    const whsStatus: DocumentStatus = whsExpiry < now ? "expired" : whsExpiry < oneMonthFromNow ? "expiring_soon" : "current";
    docs.push({
      id: `${vendorId}-whs`,
      vendor_id: vendorId,
      type: "whs_induction",
      status: whsStatus,
      expiry_date: whsExpiry,
      uploaded_at: randomDate(new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000), now),
      verified_at: Math.random() > 0.4 ? randomDate(new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), now) : undefined,
      verification_confidence: Math.floor(Math.random() * 15) + 85,
    });
  }

  // SWMS (random for trades)
  if (Math.random() > 0.4) {
    const swmsExpiry = randomDate(oneMonthAgo, oneYearFromNow);
    const swmsStatus: DocumentStatus = Math.random() > 0.15 ? (swmsExpiry < now ? "expired" : swmsExpiry < oneMonthFromNow ? "expiring_soon" : "current") : "pending_review";
    docs.push({
      id: `${vendorId}-swms`,
      vendor_id: vendorId,
      type: "swms",
      status: swmsStatus,
      expiry_date: swmsExpiry,
      uploaded_at: randomDate(new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), now),
      verified_at: Math.random() > 0.5 ? randomDate(new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), now) : undefined,
      verification_confidence: Math.floor(Math.random() * 30) + 70,
    });
  }

  return docs;
};

// Calculate overall vendor status
const calculateVendorStatus = (documents: ComplianceDocument[]): VendorStatus => {
  const hasExpired = documents.some(d => d.status === "expired" || d.status === "missing");
  const hasExpiring = documents.some(d => d.status === "expiring_soon" || d.status === "pending_review");
  
  if (hasExpired) return "non_compliant";
  if (hasExpiring) return "expiring";
  return "compliant";
};

// Generate vendors
export const generateVendors = (count: number = 50): ComplianceVendor[] => {
  const vendors: ComplianceVendor[] = [];
  
  for (let i = 0; i < count; i++) {
    const trade = TRADES[Math.floor(Math.random() * TRADES.length)];
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const companyName = generateCompanyName(trade);
    const vendorId = `v${String(i + 1).padStart(3, "0")}`;
    
    const documents = generateDocuments(vendorId, trade);
    const overall_status = calculateVendorStatus(documents);
    
    const emailDomain = companyName.toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .substring(0, 15) + ".com.au";
    
    vendors.push({
      id: vendorId,
      name: companyName,
      abn: generateABN(),
      trade,
      contact_name: `${firstName} ${lastName}`,
      contact_phone: generatePhone(),
      contact_email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${emailDomain}`,
      preferred_channel: ["email", "sms", "voice"][Math.floor(Math.random() * 3)] as PreferredChannel,
      overall_status,
      documents,
      last_reminder_sent: Math.random() > 0.5 ? randomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()) : undefined,
      reminder_count: Math.floor(Math.random() * 5),
    });
  }
  
  return vendors;
};

// Generate incoming documents (from emails)
// Improved: Ensure ~40% of documents are high-confidence (≥90%) for Auto-Verify All feature
export const generateIncomingDocuments = (vendors: ComplianceVendor[], count: number = 25): IncomingDocument[] => {
  const docs: IncomingDocument[] = [];
  const now = new Date();
  
  // Ensure at least 40% of documents are high-confidence (≥90) with no issues
  const highConfidenceCount = Math.ceil(count * 0.4);
  
  for (let i = 0; i < count; i++) {
    const vendor = vendors[Math.floor(Math.random() * vendors.length)];
    const docTypes: DocumentType[] = ["public_liability_insurance", "workers_comp_insurance", "whs_induction", "swms", "electrical_license", "plumbing_license"];
    const docType = docTypes[Math.floor(Math.random() * docTypes.length)];
    
    // Generate confidence with bias toward high values for first batch
    let confidence: number;
    if (i < highConfidenceCount) {
      // First batch: high confidence (90-99)
      confidence = Math.floor(Math.random() * 10) + 90;
    } else if (Math.random() > 0.5) {
      // Medium confidence (70-89)
      confidence = Math.floor(Math.random() * 20) + 70;
    } else {
      // Low confidence (60-69)
      confidence = Math.floor(Math.random() * 10) + 60;
    }
    
    // High-confidence docs have NO issues - this makes them eligible for Auto-Verify All
    const issues: VerificationIssue[] = [];
    if (confidence < 90) {
      // Only add issues to non-high-confidence docs
      if (Math.random() > 0.6) {
        issues.push({
          type: "coverage_insufficient",
          severity: "medium",
          description: "Coverage amount $5M, minimum required $10M",
          suggested_action: "Request updated certificate with higher coverage",
        });
      }
      if (Math.random() > 0.7) {
        issues.push({
          type: "vendor_mismatch",
          severity: "low",
          description: `Document shows "${vendor.name} Pty Ltd" vs "${vendor.name}"`,
          suggested_action: "Confirm vendor identity",
        });
      }
    }
    
    // Status: 
    // - First 20% already verified (for Sync tab demo)
    // - High-confidence docs = needs_review (ready for auto-verify)
    // - Others = needs_review or queued
    const verifiedCount = Math.floor(count * 0.2);
    let status: IncomingDocument["status"];
    if (i < verifiedCount) {
      status = "verified"; // Pre-verified for sync tab
    } else if (confidence >= 90 && issues.length === 0) {
      status = "needs_review"; // Eligible for auto-verify
    } else if (confidence >= 70) {
      status = "needs_review";
    } else {
      status = "queued";
    }
    
    const fileExtension = ["pdf", "jpg", "png"][Math.floor(Math.random() * 3)] as "pdf" | "jpg" | "png";
    const typeLabel = getDocumentTypeLabel(docType).replace(/ /g, "_");
    
    // Generate field confidences - high-confidence docs get ALL fields ≥90%
    const isHighConfidenceDoc = i < highConfidenceCount;
    const vendorNameConf = isHighConfidenceDoc 
      ? Math.floor(Math.random() * 10) + 90 
      : Math.floor(Math.random() * 20) + 80;
    const expiryConf = isHighConfidenceDoc 
      ? Math.floor(Math.random() * 10) + 90 
      : Math.floor(Math.random() * 15) + 85;
    const policyConf = isHighConfidenceDoc 
      ? Math.floor(Math.random() * 10) + 90 
      : Math.floor(Math.random() * 25) + 75;
    const coverageConf = isHighConfidenceDoc 
      ? Math.floor(Math.random() * 10) + 90 
      : Math.floor(Math.random() * 30) + 70;
    
    const detectedVendorName = vendor.name + (Math.random() > 0.8 ? " Pty Ltd" : "");
    const detectedExpiry = randomDate(new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000));
    const detectedPolicy = `${docType.substring(0, 3).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const detectedCoverage = [5000000, 10000000, 20000000][Math.floor(Math.random() * 3)];
    
    // Format dates for match details
    const formatDateShort = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    const formatDateLong = (d: Date) => `${d.getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]} ${d.getFullYear()}`;
    
    // Generate match details showing extracted vs expected
    const match_details: FieldMatchDetail[] = [
      {
        field: "vendor_name",
        extracted: detectedVendorName,
        expected: vendor.name,
        matchType: vendorNameConf >= 95 ? "exact" : vendorNameConf >= 85 ? "fuzzy" : "partial",
      },
      {
        field: "expiry_date",
        extracted: formatDateLong(detectedExpiry),
        expected: formatDateShort(detectedExpiry),
        matchType: expiryConf >= 95 ? "exact" : "fuzzy",
      },
      {
        field: "policy_number",
        extracted: detectedPolicy,
        expected: detectedPolicy.replace("-", " "),
        matchType: policyConf >= 95 ? "exact" : policyConf >= 85 ? "fuzzy" : "partial",
      },
      {
        field: "coverage",
        extracted: `$${(detectedCoverage / 1000000).toFixed(0)}M`,
        expected: `$${(detectedCoverage / 1000000).toFixed(0)} Million`,
        matchType: coverageConf >= 95 ? "exact" : coverageConf >= 85 ? "fuzzy" : "partial",
      },
    ];
    
    docs.push({
      id: `inc-${String(i + 1).padStart(3, "0")}`,
      source: ["email", "portal_upload", "api"][Math.floor(Math.random() * 3)] as "email" | "portal_upload" | "api",
      received_at: randomDate(new Date(now.getTime() - 24 * 60 * 60 * 1000), now),
      from_email: vendor.contact_email,
      from_name: vendor.contact_name,
      subject: `RE: ${getDocumentTypeLabel(docType)} Update`,
      attachment_name: `${vendor.name.replace(/ /g, "_")}_${typeLabel}_2025.${fileExtension}`,
      file_type: fileExtension,
      file_size: Math.floor(Math.random() * 2000000) + 500000,
      status,
      matched_vendor: vendor,
      matched_document_type: docType,
      ai_confidence: confidence,
      extraction_result: {
        detected_type: docType,
        detected_vendor_name: detectedVendorName,
        detected_expiry: detectedExpiry,
        detected_policy_number: detectedPolicy,
        detected_coverage: detectedCoverage,
        field_confidence: {
          vendor_name: vendorNameConf,
          expiry_date: expiryConf,
          policy_number: policyConf,
          coverage: coverageConf,
        },
        issues,
        match_details,
      },
    });
  }
  
  // Sort by received_at descending
  return docs.sort((a, b) => b.received_at.getTime() - a.received_at.getTime());
};

// Generate sample emails
export const generateEmails = (vendors: ComplianceVendor[], count: number = 15): IncomingEmail[] => {
  const emails: IncomingEmail[] = [];
  const now = new Date();
  const subjects = [
    "RE: Insurance Certificate Update",
    "Fwd: Workers Comp Certificate",
    "Updated License - Please confirm",
    "Annual Insurance Renewal",
    "SWMS for [Project Name]",
    "Requested Documents Attached",
    "Compliance Documents",
    "Certificate of Currency",
    "License Renewal",
    "RE: Document Request",
  ];
  
  for (let i = 0; i < count; i++) {
    const vendor = vendors[Math.floor(Math.random() * vendors.length)];
    const numAttachments = Math.floor(Math.random() * 3) + 1;
    const attachments: EmailAttachment[] = [];
    
    const docTypes: DocumentType[] = ["public_liability_insurance", "workers_comp_insurance", "electrical_license", "plumbing_license", "whs_induction", "swms"];
    
    for (let j = 0; j < numAttachments; j++) {
      const docType = docTypes[Math.floor(Math.random() * docTypes.length)];
      const ext = ["pdf", "jpg", "png"][Math.floor(Math.random() * 3)];
      attachments.push({
        name: `${vendor.name.replace(/ /g, "_")}_${getDocumentTypeLabel(docType).replace(/ /g, "_")}.${ext}`,
        type: ext,
        size: Math.floor(Math.random() * 2000000) + 300000,
        extracted: Math.random() > 0.3,
        document_type: docType,
        confidence: Math.floor(Math.random() * 30) + 70,
      });
    }
    
    emails.push({
      id: `email-${String(i + 1).padStart(3, "0")}`,
      from: vendor.contact_email,
      from_name: vendor.contact_name,
      subject: subjects[Math.floor(Math.random() * subjects.length)],
      received_at: randomDate(new Date(now.getTime() - 48 * 60 * 60 * 1000), now),
      attachments,
      status: ["new", "processing", "processed"][Math.floor(Math.random() * 3)] as "new" | "processing" | "processed",
      matched_vendor: vendor.name,
    });
  }
  
  return emails.sort((a, b) => b.received_at.getTime() - a.received_at.getTime());
};

// Get batch stats from vendors
export const getBatchStats = (vendors: ComplianceVendor[]) => {
  const allDocs = vendors.flatMap(v => v.documents);
  
  return {
    totalVendors: vendors.length,
    compliantVendors: vendors.filter(v => v.overall_status === "compliant").length,
    expiringVendors: vendors.filter(v => v.overall_status === "expiring").length,
    nonCompliantVendors: vendors.filter(v => v.overall_status === "non_compliant").length,
    totalDocuments: allDocs.length,
    currentDocuments: allDocs.filter(d => d.status === "current").length,
    expiringDocuments: allDocs.filter(d => d.status === "expiring_soon").length,
    expiredDocuments: allDocs.filter(d => d.status === "expired").length,
    missingDocuments: allDocs.filter(d => d.status === "missing").length,
    pendingReviewDocuments: allDocs.filter(d => d.status === "pending_review").length,
  };
};
