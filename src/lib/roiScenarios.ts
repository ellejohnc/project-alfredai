// ROI Scenario calculations for DIY Quote Builder
import { PricingResult, formatCurrency } from './pricingEngine';

export interface ROIScenario {
  type: 'conservative' | 'likely' | 'best';
  label: string;
  description: string;
  savingsMultiplier: number;
  efficiencyRate: number;
  paybackMultiplier: number;
}

export interface ROICalculation {
  scenario: ROIScenario;
  annualSavings: number;
  netGain: number;
  roiPercentage: number;
  paybackMonths: number;
}

export interface ClientInputs {
  adminStaffCount: number; // Now represents workflows/SaaS products to replace
  averageHourlyCost: number;
  hoursPerWeekOnAdmin: number;
  workflowCount: number;
  teamSize?: number; // For SaaS savings calculation
}

// Three ROI scenarios
export const roiScenarios: ROIScenario[] = [
  {
    type: 'conservative',
    label: 'Guaranteed',
    description: 'Conservative estimate with minimum efficiency gains',
    savingsMultiplier: 0.70,
    efficiencyRate: 0.50,
    paybackMultiplier: 1.3,
  },
  {
    type: 'likely',
    label: 'Most Likely',
    description: 'Expected outcome based on typical implementations',
    savingsMultiplier: 1.0,
    efficiencyRate: 0.70,
    paybackMultiplier: 1.0,
  },
  {
    type: 'best',
    label: 'Best Case',
    description: 'Optimal implementation with AI learning compound effect',
    savingsMultiplier: 1.35,
    efficiencyRate: 0.85,
    paybackMultiplier: 0.75,
  },
];

export function calculateBaseSavings(inputs: ClientInputs): number {
  // Convert annual salary to hourly rate (assuming 2080 work hours/year: 40hrs × 52 weeks)
  const hourlyRate = inputs.averageHourlyCost / 2080;
  // Hours per person per week × 52 weeks × team size = total annual hours saved
  const teamSize = inputs.teamSize || 1;
  const annualAdminHours = inputs.hoursPerWeekOnAdmin * 52 * teamSize;
  return annualAdminHours * hourlyRate;
}

export function calculateROIScenarios(
  pricing: PricingResult,
  clientInputs: ClientInputs
): ROICalculation[] {
  const baseLaborSavings = calculateBaseSavings(clientInputs);
  const totalFirstYearInvestment = pricing.annualInvestment;
  
  // Add potential SaaS savings to the annual savings calculation
  const annualSaasSavings = pricing.potentialSaasSavings?.annualSavings || 0;
  
  return roiScenarios.map(scenario => {
    // Apply efficiency rate and savings multiplier to labor savings
    const laborSavings = Math.round(baseLaborSavings * scenario.efficiencyRate * scenario.savingsMultiplier);
    // SaaS savings are more predictable, so apply a smaller variance
    const saasSavings = Math.round(annualSaasSavings * (scenario.savingsMultiplier * 0.9 + 0.1));
    const annualSavings = laborSavings + saasSavings;
    
    const netGain = annualSavings - totalFirstYearInvestment;
    const roiPercentage = totalFirstYearInvestment > 0 
      ? Math.round((netGain / totalFirstYearInvestment) * 100)
      : 0;
    
    // Calculate payback in months
    const monthlySavings = annualSavings / 12;
    const paybackMonths = monthlySavings > 0
      ? Math.ceil((totalFirstYearInvestment / monthlySavings) * scenario.paybackMultiplier)
      : 0;
    
    return {
      scenario,
      annualSavings,
      netGain,
      roiPercentage,
      paybackMonths: Math.min(paybackMonths, 36), // Cap at 36 months
    };
  });
}

export function formatROISummary(calculations: ROICalculation[]): string {
  return calculations.map(calc => 
    `${calc.scenario.label}: ${formatCurrency(calc.annualSavings)} savings, ${calc.roiPercentage}% ROI, ${calc.paybackMonths} month payback`
  ).join('\n');
}

// Default client inputs for initial state
export const defaultClientInputs: ClientInputs = {
  adminStaffCount: 3,
  averageHourlyCost: 85000, // Annual salary in AUD
  hoursPerWeekOnAdmin: 15,
  workflowCount: 3,
};
