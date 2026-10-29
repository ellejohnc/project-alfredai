// Centralized pricing engine for alfred ai investment estimation

export interface PricingTier {
  id: string;
  name: string;
  setupBase: number;      // Minimum per workflow ($5,000-$12,000 range)
  setupCeiling: number;   // Maximum per workflow based on company scale
  baseMonthly: number;
  description: string;
  minStaff: number;
  maxStaff: number;
}

export interface IndustryMultiplier {
  id: string;
  name: string;
  setupMultiplier: number;
  monthlyMultiplier: number;
  description: string;
}

export interface ComplexityLevel {
  id: string;
  name: string;
  workflowRange: string;
  minWorkflows: number;
  maxWorkflows: number;
}

export interface OpsComplexity {
  id: string;
  name: string;
  multiplier: number;
  description: string;
}

export interface VolumeDiscount {
  minWorkflows: number;
  maxWorkflows: number;
  discount: number;  // 1.0 = no discount, 0.85 = 15% off
  label: string;
}

// Special Sales Discounts - predefined strategic discount options
export interface SpecialSalesDiscount {
  id: string;
  name: string;
  discount: number; // 0.7 = 30% off, 0.5 = 50% off
  description: string;
  requiresPassword?: boolean;
  password?: string;
  isCustom?: boolean; // For CEO approval with custom %
}

export const specialSalesDiscounts: SpecialSalesDiscount[] = [
  { id: "none", name: "No Special Discount", discount: 1.0, description: "Standard pricing" },
  { id: "new-market", name: "New Market Initiating", discount: 0.70, description: "30% off setup fee — First entry into new market segment" },
  { id: "gtm-strategic", name: "GTM Strategic Match", discount: 0.50, description: "50% off setup fee — Strategic go-to-market partnership" },
  { id: "ceo-approval", name: "Special CEO Approval", discount: 1.0, description: "Custom % off setup fee — Requires CEO password", requiresPassword: true, password: "alfred2025", isCustom: true },
];

// Get special discount by ID
export function getSpecialDiscount(discountId: string): SpecialSalesDiscount {
  return specialSalesDiscounts.find(d => d.id === discountId) || specialSalesDiscounts[0];
}

// Operational complexity levels - user-selectable to adjust per-workflow rate
export const opsComplexityLevels: OpsComplexity[] = [
  { id: "simple", name: "Simple", multiplier: 0.85, description: "Standard processes, minimal integrations" },
  { id: "standard", name: "Standard", multiplier: 1.0, description: "Typical business operations" },
  { id: "moderate", name: "Moderate", multiplier: 1.10, description: "Multiple systems, some legacy tools" },
  { id: "complex", name: "Complex", multiplier: 1.20, description: "Heavy integrations, compliance requirements" },
  { id: "enterprise", name: "Enterprise-Grade", multiplier: 1.25, description: "Multi-department, custom workflows" },
];

// Volume discounts - more workflows = bigger discount (ecosystem scale)
export const volumeDiscounts: VolumeDiscount[] = [
  { minWorkflows: 1, maxWorkflows: 2, discount: 1.0, label: "No discount" },
  { minWorkflows: 3, maxWorkflows: 4, discount: 0.95, label: "5% bundle discount" },
  { minWorkflows: 5, maxWorkflows: 7, discount: 0.90, label: "10% ecosystem discount" },
  { minWorkflows: 8, maxWorkflows: 10, discount: 0.85, label: "15% scale discount" },
  { minWorkflows: 11, maxWorkflows: Infinity, discount: 0.80, label: "20% enterprise discount" },
];

// Get volume discount based on workflow count
export function getVolumeDiscount(workflowCount: number): VolumeDiscount {
  if (workflowCount === 0) return volumeDiscounts[0];
  return volumeDiscounts.find(v => 
    workflowCount >= v.minWorkflows && workflowCount <= v.maxWorkflows
  ) || volumeDiscounts[volumeDiscounts.length - 1];
}

// Base pricing tiers by team size - now with base and ceiling per-workflow setup costs
// Range: $5,000 - $12,000 per workflow base, scaling with company size
export const pricingTiers: PricingTier[] = [
  { 
    id: "startup", 
    name: "Startup", 
    setupBase: 5000,
    setupCeiling: 7500,
    baseMonthly: 250, 
    description: "0-10 Staff", 
    minStaff: 0, 
    maxStaff: 10 
  },
  { 
    id: "sme", 
    name: "SME", 
    setupBase: 6000,
    setupCeiling: 9000,
    baseMonthly: 500, 
    description: "11-50 Staff", 
    minStaff: 11, 
    maxStaff: 50 
  },
  { 
    id: "established", 
    name: "Established", 
    setupBase: 8000,
    setupCeiling: 12000,
    baseMonthly: 1000, 
    description: "51-250 Staff", 
    minStaff: 51, 
    maxStaff: 250 
  },
  { 
    id: "enterprise", 
    name: "Enterprise", 
    setupBase: 12000,
    setupCeiling: 18000,  // Higher ceiling for enterprise
    baseMonthly: 3500, 
    description: "251+ Staff", 
    minStaff: 251, 
    maxStaff: Infinity 
  },
];

// Industry multipliers - some industries have more complex compliance/integration needs
export const industryMultipliers: IndustryMultiplier[] = [
  { id: "general", name: "General Business", setupMultiplier: 1.0, monthlyMultiplier: 1.0, description: "Standard implementation" },
  { id: "construction", name: "Construction & Property", setupMultiplier: 1.15, monthlyMultiplier: 1.1, description: "Project management focus" },
  { id: "professional_services", name: "Professional Services", setupMultiplier: 1.1, monthlyMultiplier: 1.0, description: "Client workflow focus" },
  { id: "manufacturing", name: "Manufacturing", setupMultiplier: 1.2, monthlyMultiplier: 1.15, description: "Supply chain integration" },
  { id: "finance", name: "Finance & Insurance", setupMultiplier: 1.25, monthlyMultiplier: 1.2, description: "Compliance-heavy" },
  { id: "healthcare", name: "Healthcare", setupMultiplier: 1.3, monthlyMultiplier: 1.25, description: "HIPAA (Certifiable)/privacy compliance" },
  { id: "retail", name: "Retail & E-commerce", setupMultiplier: 1.1, monthlyMultiplier: 1.05, description: "Multi-channel focus" },
  { id: "technology", name: "Technology", setupMultiplier: 1.0, monthlyMultiplier: 1.0, description: "Standard implementation" },
];

// Complexity levels derived from workflow count (Agentic AI terminology)
export const complexityLevels: ComplexityLevel[] = [
  { id: "none", name: "No Agent", workflowRange: "0 agents", minWorkflows: 0, maxWorkflows: 0 },
  { id: "simple", name: "Starter", workflowRange: "1-3 agents", minWorkflows: 1, maxWorkflows: 3 },
  { id: "standard", name: "Growth", workflowRange: "4-6 agents", minWorkflows: 4, maxWorkflows: 6 },
  { id: "advanced", name: "Scale", workflowRange: "7-10 agents", minWorkflows: 7, maxWorkflows: 10 },
  { id: "complex", name: "Enterprise", workflowRange: "11+ agents", minWorkflows: 11, maxWorkflows: Infinity },
];

// Derive complexity from workflow count
export function getComplexityFromWorkflowCount(workflowCount: number): ComplexityLevel {
  if (workflowCount === 0) {
    return complexityLevels[0]; // "No Agent"
  }
  return complexityLevels.find(c => workflowCount >= c.minWorkflows && workflowCount <= c.maxWorkflows) 
    || complexityLevels[complexityLevels.length - 1];
}

export interface PricingInputs {
  teamSize: number;
  affectedTeamSize?: number; // Subset of staff whose workflows are being optimised; defaults to teamSize
  industry: string;
  workflowCount: number;
  workflowsToReplace?: number; // Non-agentic workflows or SaaS products to be replaced
  opsComplexity?: string; // 'simple' | 'standard' | 'moderate' | 'complex' | 'enterprise'
  specialDiscount?: string; // Special sales discount ID
  specialDiscountCustomPercent?: number; // Custom percentage for CEO approval (0-100)
}

export interface PotentialSaasSavings {
  workflowsToReplace: number;
  teamSize: number;
  ratePerUserPerWorkflow: number;
  monthlySavings: number;
  annualSavings: number;
}

export interface PricingResult {
  tier: PricingTier;
  industry: IndustryMultiplier;
  complexity: ComplexityLevel;
  opsComplexity: OpsComplexity;
  volumeDiscount: VolumeDiscount;
  specialDiscount: SpecialSalesDiscount;
  workflowCount: number;
  setupInvestment: number;
  monthlyRetainer: number;
  annualInvestment: number;
  // Range values (±15% variance to show estimate)
  setupRange: { min: number; max: number };
  monthlyRange: { min: number; max: number };
  annualRange: { min: number; max: number };
  setupBreakdown: {
    perWorkflowRate: number;
    workflowCount: number;
    baseSetup: number;
    complexityAdjustment: number;
    industryAdjustment: number;
    volumeDiscountAmount: number;
    specialDiscountAmount: number;
    total: number;
  };
  monthlyBreakdown: {
    base: number;
    industryAdjustment: number;
    specialDiscountAmount: number;
    floorApplied: boolean;
    floorAmount: number;
  };
  potentialSaasSavings?: PotentialSaasSavings;

}

export function calculateInvestment(inputs: PricingInputs): PricingResult {
  // Find the appropriate tier based on team size
  const tier = pricingTiers.find(t => inputs.teamSize >= t.minStaff && inputs.teamSize <= t.maxStaff) 
    || pricingTiers[pricingTiers.length - 1];
  
  // Get industry multiplier
  const industry = industryMultipliers.find(i => i.id === inputs.industry) || industryMultipliers[0];
  
  // Get complexity level from workflow count
  const complexity = getComplexityFromWorkflowCount(inputs.workflowCount);
  
  // Get ops complexity (user-selectable) - defaults to 'standard'
  const opsComplexity = opsComplexityLevels.find(c => c.id === inputs.opsComplexity) || opsComplexityLevels[1];
  
  // Get volume discount based on workflow count
  const volumeDiscount = getVolumeDiscount(inputs.workflowCount);
  
  // Get special sales discount
  const specialDiscount = getSpecialDiscount(inputs.specialDiscount || 'none');
  // For CEO approval, use custom percentage if provided
  const specialDiscountMultiplier = specialDiscount.isCustom && inputs.specialDiscountCustomPercent !== undefined
    ? (100 - inputs.specialDiscountCustomPercent) / 100
    : specialDiscount.discount;
  
  // Calculate per-workflow rate using ops complexity to interpolate between base and ceiling
  // Simple (0.85) → use base, Enterprise-grade (1.25) → use ceiling
  const complexityRange = Math.min(1, Math.max(0, (opsComplexity.multiplier - 0.85) / (1.25 - 0.85))); // 0 to 1
  const perWorkflowRate = Math.round(
    tier.setupBase + (tier.setupCeiling - tier.setupBase) * complexityRange
  );
  
  // Calculate setup investment:
  // per-workflow rate × workflow count × industry multiplier × volume discount × special discount
  const baseSetup = perWorkflowRate * inputs.workflowCount;
  const afterIndustry = baseSetup * industry.setupMultiplier;
  const afterVolumeDiscount = Math.round(afterIndustry * volumeDiscount.discount);
  const setupFinal = Math.round(afterVolumeDiscount * specialDiscountMultiplier);
  
  // Calculate adjustment amounts for breakdown
  const complexityAdjustment = Math.round(
    (perWorkflowRate - tier.setupBase) * inputs.workflowCount
  );
  const industryAdjustment = Math.round(baseSetup * (industry.setupMultiplier - 1));
  const volumeDiscountAmount = Math.round(afterIndustry - afterVolumeDiscount);
  const specialDiscountSetupAmount = Math.round(afterVolumeDiscount - setupFinal);
  
  // Calculate monthly retainer: $250 per workflow × workflow count × industry multiplier
  // NOTE: Special discounts only apply to setup fee, NOT monthly retainer
  // NOTE: SaaS replacement is NOT added to retainer - it represents potential SAVINGS
  const monthlyPerWorkflow = 250;
  const monthlyBase = monthlyPerWorkflow * inputs.workflowCount;
  const monthlyAfterIndustry = Math.round(monthlyBase * industry.monthlyMultiplier);

  // Monthly retainer floor for larger deals: when setup > $15k, ensure monthly
  // retainer is at least (setup × 80%) / 12, rounded up to the nearest $250.
  // Maintains a healthy setup-to-annual-retainer ratio on bigger engagements.
  const SETUP_FLOOR_THRESHOLD = 15000;
  const FLOOR_RATIO = 0.8;
  const FLOOR_ROUND_TO = 250;
  let monthlyFloorAmount = 0;
  let monthlyFloorApplied = false;
  let monthlyFinal = monthlyAfterIndustry;
  if (setupFinal > SETUP_FLOOR_THRESHOLD) {
    const rawFloor = (setupFinal * FLOOR_RATIO) / 12;
    monthlyFloorAmount = Math.ceil(rawFloor / FLOOR_ROUND_TO) * FLOOR_ROUND_TO;
    if (monthlyFloorAmount > monthlyFinal) {
      monthlyFinal = monthlyFloorAmount;
      monthlyFloorApplied = true;
    }
  }

  // Calculate annual investment (setup + 11 months retainer)
  // First month is implementation period - retainer starts month 2
  const annualInvestment = setupFinal + (monthlyFinal * 11);

  
  // Calculate ranges (±15% variance for estimation purposes)
  const varianceLow = 0.85;
  const varianceHigh = 1.15;
  
  // Potential SaaS savings (NOT added to retainer - this is what client could save)
  // $20/user/workflow/month is the estimated cost of legacy SaaS products
  // Uses the AFFECTED team size (subset being optimised), not total headcount.
  const RATE_PER_USER_PER_WORKFLOW = 20;
  const workflowsToReplace = inputs.workflowsToReplace || 0;
  const affectedTeamSize = inputs.affectedTeamSize ?? inputs.teamSize;
  const monthlySaasSavings = workflowsToReplace * affectedTeamSize * RATE_PER_USER_PER_WORKFLOW;
  
  const potentialSaasSavings: PotentialSaasSavings | undefined = workflowsToReplace > 0 ? {
    workflowsToReplace,
    teamSize: affectedTeamSize,
    ratePerUserPerWorkflow: RATE_PER_USER_PER_WORKFLOW,
    monthlySavings: monthlySaasSavings,
    annualSavings: monthlySaasSavings * 12,
  } : undefined;
  
  return {
    tier,
    industry,
    complexity,
    opsComplexity,
    volumeDiscount,
    specialDiscount: {
      ...specialDiscount,
      // Override discount value with actual applied multiplier for CEO custom
      discount: specialDiscountMultiplier,
    },
    workflowCount: inputs.workflowCount,
    setupInvestment: setupFinal,
    monthlyRetainer: monthlyFinal,
    annualInvestment,
    setupRange: {
      min: Math.round(setupFinal * varianceLow),
      max: Math.round(setupFinal * varianceHigh),
    },
    monthlyRange: {
      min: Math.round(monthlyFinal * varianceLow),
      max: Math.round(monthlyFinal * varianceHigh),
    },
    annualRange: {
      min: Math.round(annualInvestment * varianceLow),
      max: Math.round(annualInvestment * varianceHigh),
    },
    setupBreakdown: {
      perWorkflowRate,
      workflowCount: inputs.workflowCount,
      baseSetup,
      complexityAdjustment,
      industryAdjustment,
      volumeDiscountAmount,
      specialDiscountAmount: specialDiscountSetupAmount,
      total: setupFinal,
    },
    monthlyBreakdown: {
      base: monthlyBase,
      industryAdjustment: Math.round(monthlyBase * (industry.monthlyMultiplier - 1)),
      specialDiscountAmount: 0, // Special discounts only apply to setup fee
      floorApplied: monthlyFloorApplied,
      floorAmount: monthlyFloorAmount,
    },

    potentialSaasSavings,
  };
}

// Helper to get tier from team size
export function getTierFromTeamSize(teamSize: number): PricingTier {
  return pricingTiers.find(t => teamSize >= t.minStaff && teamSize <= t.maxStaff) 
    || pricingTiers[pricingTiers.length - 1];
}

// Format currency helper
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(value);
}
