import { memo, useState } from 'react';
import { Calculator, Equal, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PricingResult, formatCurrency } from '@/lib/pricingEngine';
import { ClientInputs, ROICalculation } from '@/lib/roiScenarios';
import { cn } from '@/lib/utils';

interface FormulaBreakdownProps {
  pricing: PricingResult;
  clientInputs: ClientInputs;
  teamSize: number;
  workflowCount: number;
  roiCalculations: ROICalculation[];
}

export const FormulaBreakdown = memo(function FormulaBreakdown({
  pricing,
  clientInputs,
  teamSize,
  workflowCount,
  roiCalculations,
}: FormulaBreakdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Calculate values - no useMemo to avoid potential hook issues
  const hourlyRate = clientInputs.averageHourlyCost / 2080;
  const baseLaborSavings = clientInputs.hoursPerWeekOnAdmin * teamSize * 52 * hourlyRate;
  const annualSaasSavings = pricing.potentialSaasSavings?.annualSavings || 0;
  const likely = roiCalculations.find(r => r.scenario.type === 'likely');

  // Show volume discount if applicable
  const hasVolumeDiscount = pricing.volumeDiscount.discount < 1;
  const hasComplexityAdjustment = pricing.setupBreakdown.complexityAdjustment !== 0;

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      {/* Header - clickable to toggle */}
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 h-auto justify-between hover:bg-muted/50 rounded-none"
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          <Calculator className="w-4 h-4 text-primary" />
          <span>View Complete Calculation Formula</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </Button>

      {/* Content - conditionally rendered */}
      {isOpen && (
        <div className="px-4 pb-4 pt-2 space-y-6 border-t border-border">
          {/* Step 1: Investment Calculation */}
          <FormulaSection
            step={1}
            title="Calculate Investment"
            formulas={[
              {
                label: 'Per-Workflow Rate',
                formula: `$${pricing.tier.setupBase.toLocaleString()} base + complexity adjustment`,
                result: `$${pricing.setupBreakdown.perWorkflowRate.toLocaleString()}/wf`,
              },
              {
                label: 'Base Setup',
                formula: `$${pricing.setupBreakdown.perWorkflowRate.toLocaleString()} × ${workflowCount} agents`,
                result: formatCurrency(pricing.setupBreakdown.baseSetup),
              },
              ...(hasComplexityAdjustment ? [{
                label: 'Complexity Adj.',
                formula: `${pricing.opsComplexity.name} (${pricing.opsComplexity.multiplier}x)`,
                result: pricing.setupBreakdown.complexityAdjustment >= 0 
                  ? `+${formatCurrency(pricing.setupBreakdown.complexityAdjustment)}`
                  : formatCurrency(pricing.setupBreakdown.complexityAdjustment),
              }] : []),
              ...(pricing.setupBreakdown.industryAdjustment > 0 ? [{
                label: 'Industry Adj.',
                formula: `${pricing.industry.name} (${pricing.industry.setupMultiplier}x)`,
                result: `+${formatCurrency(pricing.setupBreakdown.industryAdjustment)}`,
              }] : []),
              ...(hasVolumeDiscount ? [{
                label: 'Volume Discount',
                formula: pricing.volumeDiscount.label,
                result: `-${formatCurrency(pricing.setupBreakdown.volumeDiscountAmount)}`,
                isDiscount: true,
              }] : []),
              {
                label: 'Setup Investment',
                formula: 'Total after adjustments',
                result: formatCurrency(pricing.setupInvestment),
                highlight: true,
              },
              {
                label: 'Monthly Retainer',
                formula: `$250 × ${workflowCount} agents × ${pricing.industry.monthlyMultiplier.toFixed(2)}`,
                result: `${formatCurrency(pricing.monthlyRetainer)}/mo`,
              },
              {
                label: 'First Year Total',
                formula: `${formatCurrency(pricing.setupInvestment)} + (${formatCurrency(pricing.monthlyRetainer)} × 11)`,
                result: formatCurrency(pricing.annualInvestment),
                highlight: true,
              },
            ]}
          />

          {/* Step 2: Base Savings Calculation */}
          <FormulaSection
            step={2}
            title="Calculate Base Savings"
            formulas={[
              {
                label: 'Hourly Rate',
                formula: `${formatCurrency(clientInputs.averageHourlyCost)} ÷ 2,080 hours`,
                result: `$${hourlyRate.toFixed(2)}/hr`,
              },
              {
                label: 'Labor Savings',
                formula: `${clientInputs.hoursPerWeekOnAdmin} hrs × ${teamSize} staff × 52 wks × $${hourlyRate.toFixed(2)}`,
                result: `${formatCurrency(Math.round(baseLaborSavings))}/yr`,
              },
              {
                label: 'SaaS Savings',
                formula: `${clientInputs.workflowCount || 0} products × ${teamSize} users × $20 × 12 mo`,
                result: `${formatCurrency(annualSaasSavings)}/yr`,
              },
              {
                label: 'Total Base Savings',
                formula: `${formatCurrency(Math.round(baseLaborSavings))} + ${formatCurrency(annualSaasSavings)}`,
                result: formatCurrency(Math.round(baseLaborSavings) + annualSaasSavings),
                highlight: true,
              },
            ]}
          />

          {/* Step 3: Scenario Multipliers */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Step 3</Badge>
              <span className="text-sm font-medium">Apply Scenario Multipliers</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="font-medium text-blue-700 dark:text-blue-300 mb-2">Guaranteed</p>
                <div className="space-y-1 text-blue-600 dark:text-blue-400">
                  <p>Efficiency: 50%</p>
                  <p>Multiplier: 0.70×</p>
                  <p>Payback: 1.30×</p>
                </div>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                <p className="font-medium text-green-700 dark:text-green-300 mb-2">Most Likely</p>
                <div className="space-y-1 text-green-600 dark:text-green-400">
                  <p>Efficiency: 70%</p>
                  <p>Multiplier: 1.00×</p>
                  <p>Payback: 1.00×</p>
                </div>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="font-medium text-amber-700 dark:text-amber-300 mb-2">Best Case</p>
                <div className="space-y-1 text-amber-600 dark:text-amber-400">
                  <p>Efficiency: 85%</p>
                  <p>Multiplier: 1.35×</p>
                  <p>Payback: 0.75×</p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4: Final ROI (Most Likely) */}
          {likely && (
            <FormulaSection
              step={4}
              title="Calculate ROI (Most Likely)"
              formulas={[
                {
                  label: 'Annual Savings',
                  formula: `(${formatCurrency(Math.round(baseLaborSavings))} × 70% × 1.00) + SaaS adj.`,
                  result: formatCurrency(likely.annualSavings),
                },
                {
                  label: 'Net Gain',
                  formula: `${formatCurrency(likely.annualSavings)} − ${formatCurrency(pricing.annualInvestment)}`,
                  result: formatCurrency(likely.annualSavings - pricing.annualInvestment),
                },
                {
                  label: 'ROI Percentage',
                  formula: `(${formatCurrency(likely.annualSavings - pricing.annualInvestment)} ÷ ${formatCurrency(pricing.annualInvestment)}) × 100`,
                  result: `${likely.roiPercentage}%`,
                  highlight: true,
                },
                {
                  label: 'Payback Period',
                  formula: `${formatCurrency(pricing.annualInvestment)} ÷ ${formatCurrency(Math.round(likely.annualSavings / 12))}/mo`,
                  result: `${likely.paybackMonths} months`,
                },
              ]}
            />
          )}
        </div>
      )}
    </div>
  );
});

interface FormulaSectionProps {
  step: number;
  title: string;
  formulas: Array<{
    label: string;
    formula: string;
    result: string;
    highlight?: boolean;
    isDiscount?: boolean;
  }>;
}

function FormulaSection({ step, title, formulas }: FormulaSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">Step {step}</Badge>
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="space-y-2">
        {formulas.map((f, i) => (
          <div
            key={i}
            className={cn(
              "flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 p-2 rounded-lg text-xs",
              f.highlight 
                ? 'bg-primary/10 border border-primary/20' 
                : f.isDiscount
                  ? 'bg-green-500/10 border border-green-500/20'
                  : 'bg-muted/50'
            )}
          >
            <span className="text-muted-foreground w-28 shrink-0">{f.label}:</span>
            <div className="flex items-center gap-2 flex-1">
              <code className="text-foreground/80 bg-background px-2 py-0.5 rounded flex-1">
                {f.formula}
              </code>
              <Equal className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className={cn(
                "font-semibold shrink-0",
                f.highlight && 'text-primary',
                f.isDiscount && 'text-green-600 dark:text-green-400'
              )}>
                {f.result}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
