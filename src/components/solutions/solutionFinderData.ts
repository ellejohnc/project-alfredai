/**
 * Which engines answer which role/industry pairing, and the fallbacks when no
 * pairing matches. Data, kept apart from the component that renders it.
 */


/**
 * Live key sets derived from the actual UI selectors. Any mapping key that
 * isn't reachable through the role/industry dropdowns is treated as stale
 * and dropped automatically — so removing an option from solutionsData.ts
 * prunes its mappings on the next render without manual cleanup.
 */
import { roles as liveRoles, industries as liveIndustries } from "@/data/solutionsData";

export const liveRoleIds = new Set(liveRoles.map((r) => r.id));

export const liveIndustryIds = new Set(liveIndustries.map((i) => i.id));

export function prune<T>(map: Record<string, T>, keep: (key: string) => boolean, label: string): Record<string, T> {
  const out: Record<string, T> = {};
  const stale: string[] = [];
  for (const [k, v] of Object.entries(map)) {
    if (keep(k)) out[k] = v;
    else stale.push(k);
  }
  if (stale.length && import.meta.env.DEV) {
    console.warn(`[SolutionFinder] Pruned stale ${label} keys not present in live selectors:`, stale);
  }
  return out;
}

export const isReachableRoleIndustryKey = (key: string): boolean => {
  // role ids can contain hyphens (e.g. "project-manager"), so match by prefix.
  for (const roleId of liveRoleIds) {
    if (key === roleId || key.startsWith(`${roleId}-`)) {
      const industryId = key.slice(roleId.length + 1);
      return liveIndustryIds.has(industryId);
    }
  }
  return false;
};

export const getActiveRoleIndustryEngines = () =>
  prune(roleIndustryEngines, isReachableRoleIndustryKey, "roleIndustryEngines");

export const getActiveRoleFallbacks = () =>
  prune(roleFallbacks, (k) => liveRoleIds.has(k), "roleFallbacks");

// Role-Industry to AI Engines mapping with benefit descriptions
export const roleIndustryEngines: Record<string, { engines: string[]; outcome: string }> = {
  // CEO combinations
  "ceo-construction": {
    engines: ["Knowledge Management", "Business Operating System", "Voice Agent"],
    outcome: "Get instant visibility across projects and never miss critical decisions"
  },
  "ceo-consulting": {
    engines: ["Knowledge Management", "Business Operating System", "Fee Proposal"],
    outcome: "Scale your expertise and win more proposals with AI support"
  },

  // CFO combinations
  "cfo-construction": {
    engines: ["Drawings to Estimate", "Procurement", "Contract Review"],
    outcome: "AI-powered estimating from drawings and smarter procurement"
  },
  "cfo-consulting": {
    engines: ["Business Operating System", "Auto Invoicing", "Fee Proposal"],
    outcome: "Faster invoicing cycles and better proposal win rates"
  },

  // CTO combinations
  "cto-construction": {
    engines: ["Knowledge Management", "Technical Report Agent", "Site Inspection"],
    outcome: "Automate technical documentation and modernize field operations"
  },
  "cto-consulting": {
    engines: ["Knowledge Management", "AI Marketplace", "Workflow Builder"],
    outcome: "Build AI solutions on top of your existing infrastructure"
  },

  // Project Manager combinations
  "project-manager-construction": {
    engines: ["Business Operating System", "Vendor Compliance", "Site Inspection"],
    outcome: "Track compliance and keep projects on track with AI documentation"
  },
  "project-manager-consulting": {
    engines: ["Business Operating System", "Fee Proposal", "Knowledge Management"],
    outcome: "Win more work and deliver projects faster"
  },

  // Customer Service combinations
  "customer-service-construction": {
    engines: ["Customer Experience", "Knowledge Management", "Voice Agent"],
    outcome: "Answer client queries instantly with AI-powered support"
  },
  "customer-service-consulting": {
    engines: ["Customer Experience", "Knowledge Management", "Voice Agent"],
    outcome: "Scale client support while maintaining personal touch"
  },

  // HR combinations - recruitment-focused
  "hr-construction": {
    engines: ["Interview Scoring", "Candidate Match", "Knowledge Management"],
    outcome: "Find and evaluate skilled tradespeople faster with AI screening"
  },
  "hr-consulting": {
    engines: ["Interview Scoring", "Candidate Match", "Knowledge Management"],
    outcome: "Identify top consulting talent with AI-powered assessments"
  },

  // New construction-focused roles
  "property-dev-manager-construction": {
    engines: ["Drawings to Estimate", "Tender Management", "Business Operating System"],
    outcome: "From feasibility to handover — estimating, procurement and reporting in one stack"
  },
  "construction-manager-construction": {
    engines: ["Vendor Compliance", "Site Inspection", "RFI Management"],
    outcome: "Site compliance, daily reports and RFIs handled without chasing paperwork"
  },
  "contract-admin-construction": {
    engines: ["Contract Review", "RFI Management", "AlfredBID"],
    outcome: "Faster contract review, tighter RFI tracking and stronger bid responses"
  },

  // Windows Fabrication
  "ceo-windows-fabrication": {
    engines: ["Knowledge Management", "Business Operating System", "Workflow Builder"],
    outcome: "Win more jobs with faster quoting and full visibility of orders"
  },
  "cfo-windows-fabrication": {
    engines: ["Drawings to Estimate", "Auto Invoicing", "Procurement"],
    outcome: "Take-offs straight to quote, with costs and cashflow under control"
  },
  "project-manager-windows-fabrication": {
    engines: ["Business Operating System", "Workflow Builder", "Knowledge Management"],
    outcome: "Track orders, installs and handovers in one place"
  },
  "construction-manager-windows-fabrication": {
    engines: ["Site Inspection", "Vendor Compliance", "RFI Management"],
    outcome: "Installation compliance and site checks without paperwork chasing"
  },
  "contract-admin-windows-fabrication": {
    engines: ["Contract Review", "Auto Invoicing", "RFI Management"],
    outcome: "Supply contracts and variations reviewed and billed faster"
  },

  // Steelwork Fabrication
  "ceo-steelwork-fabrication": {
    engines: ["Knowledge Management", "Business Operating System", "Drawings to Estimate"],
    outcome: "From structural drawings to winning bids with full shop visibility"
  },
  "cfo-steelwork-fabrication": {
    engines: ["Drawings to Estimate", "Procurement", "Auto Invoicing"],
    outcome: "Tonnage to estimate, materials procured and invoices out faster"
  },
  "project-manager-steelwork-fabrication": {
    engines: ["Business Operating System", "Site Inspection", "Workflow Builder"],
    outcome: "Keep fabrication and delivery milestones on program"
  },
  "construction-manager-steelwork-fabrication": {
    engines: ["Vendor Compliance", "Site Inspection", "RFI Management"],
    outcome: "QA, compliance and site coordination without chasing paperwork"
  },
  "contract-admin-steelwork-fabrication": {
    engines: ["Contract Review", "RFI Management", "AlfredBID"],
    outcome: "Stronger bids and tighter contract administration"
  },

  // Commercial Painting
  "ceo-commercial-painting": {
    engines: ["Knowledge Management", "Business Operating System", "Voice Agent"],
    outcome: "Bid more work with estimating that no longer bottlenecks"
  },
  "cfo-commercial-painting": {
    engines: ["Drawings to Estimate", "Auto Invoicing", "Business Operating System"],
    outcome: "Accurate areas and pricing, invoiced without the admin drag"
  },
  "project-manager-commercial-painting": {
    engines: ["Business Operating System", "Workflow Builder", "Knowledge Management"],
    outcome: "Run multiple painting crews and sites from one view"
  },
  "construction-manager-commercial-painting": {
    engines: ["Site Inspection", "Vendor Compliance", "Knowledge Management"],
    outcome: "Site checks and compliance handled on the go"
  },
  "contract-admin-commercial-painting": {
    engines: ["Contract Review", "Auto Invoicing", "RFI Management"],
    outcome: "Tender docs, variations and claims managed by AI"
  },

  // Civil Contracting
  "ceo-civil-contracting": {
    engines: ["Knowledge Management", "Business Operating System", "Tender Management"],
    outcome: "Visibility across civil projects from bid to delivery"
  },
  "cfo-civil-contracting": {
    engines: ["Drawings to Estimate", "Procurement", "Auto Invoicing"],
    outcome: "Large take-offs fast, procurement controlled, claims out on time"
  },
  "project-manager-civil-contracting": {
    engines: ["Business Operating System", "Site Inspection", "Tender Management"],
    outcome: "Program, compliance and reporting across big drawing sets"
  },
  "construction-manager-civil-contracting": {
    engines: ["Vendor Compliance", "Site Inspection", "RFI Management"],
    outcome: "Site compliance, daily reports and RFIs without the paperwork"
  },
  "contract-admin-civil-contracting": {
    engines: ["Contract Review", "RFI Management", "AlfredBID"],
    outcome: "Complex contracts reviewed and tender responses strengthened"
  },

  // Energy and Infrastructure
  "ceo-energy-infrastructure": {
    engines: ["Knowledge Management", "Business Operating System", "Voice Agent"],
    outcome: "One source of truth across distributed sites and stakeholders"
  },
  "cfo-energy-infrastructure": {
    engines: ["Business Operating System", "Procurement", "Auto Invoicing"],
    outcome: "Cost control and reporting across long project cycles"
  },
  "project-manager-energy-infrastructure": {
    engines: ["Business Operating System", "Knowledge Management", "Workflow Builder"],
    outcome: "Coordinate dispersed teams and strict tender requirements"
  },
  "construction-manager-energy-infrastructure": {
    engines: ["Vendor Compliance", "Site Inspection", "Knowledge Management"],
    outcome: "Field compliance and reporting from remote sites"
  },
  "contract-admin-energy-infrastructure": {
    engines: ["Contract Review", "Tender Management", "Knowledge Management"],
    outcome: "Strict tender requirements met without manual checking"
  },

  // Special Trades/Contracting
  "ceo-special-trades": {
    engines: ["Knowledge Management", "Business Operating System", "Voice Agent"],
    outcome: "More jobs quoted and followed up without after-hours admin"
  },
  "cfo-special-trades": {
    engines: ["Auto Invoicing", "Business Operating System", "Knowledge Management"],
    outcome: "Invoices out faster and cashflow visible at a glance"
  },
  "project-manager-special-trades": {
    engines: ["Business Operating System", "Workflow Builder", "Site Inspection"],
    outcome: "Jobs tracked across sites without whiteboards and texts"
  },
  "construction-manager-special-trades": {
    engines: ["Site Inspection", "Vendor Compliance", "Voice Agent"],
    outcome: "Compliance and site updates captured from the field"
  },
  "contract-admin-special-trades": {
    engines: ["Contract Review", "Auto Invoicing", "RFI Management"],
    outcome: "Quotes, variations and claims handled end to end"
  },
};

// Role-based fallback recommendations for unmapped combinations
export const roleFallbacks: Record<string, { engines: string[]; outcome: string }> = {
  "ceo": { engines: ["Knowledge Management", "Business Operating System", "Voice Agent"], outcome: "Get visibility and scale without growing headcount" },
  "cfo": { engines: ["Business Operating System", "Invoice Processing", "Knowledge Management"], outcome: "Automate financial operations and reporting" },
  "cto": { engines: ["Knowledge Management", "AI Marketplace", "Workflow Builder"], outcome: "Build AI-powered infrastructure for your organisation" },
  "project-manager": { engines: ["Business Operating System", "Knowledge Management", "Workflow Builder"], outcome: "Keep projects on track with AI-powered tools" },
  "customer-service": { engines: ["Customer Experience", "Knowledge Management", "Voice Agent"], outcome: "Deliver 24/7 support with consistent quality" },
  "hr": { engines: ["Interview Scoring", "Candidate Match", "Knowledge Management"], outcome: "Hire faster with AI-powered screening" },
  "property-dev-manager": { engines: ["Business Operating System", "Drawings to Estimate", "Tender Management"], outcome: "Run feasibility, procurement and project tracking in one view" },
  "construction-manager": { engines: ["Vendor Compliance", "Site Inspection", "RFI Management"], outcome: "Keep sites compliant, documented and progressing without chasing paperwork" },
  "contract-admin": { engines: ["Contract Review", "RFI Management", "AlfredBID"], outcome: "Tighter contract administration, faster RFIs and stronger bid responses" },
};
