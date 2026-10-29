import { memo, useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { PricingResult, formatCurrency, calculateInvestment } from '@/lib/pricingEngine';
import { ClientInputs, calculateROIScenarios } from '@/lib/roiScenarios';

interface SensitivityAnalysisProps {
  pricing: PricingResult;
  clientInputs: ClientInputs;
  teamSize: number;
  workflowCount: number;
  industry: string;
  baseRoi: number;
}

interface SensitivityFactor {
  name: string;
  description: string;
  baseValue: number;
  unit: string;
  lowValue: number;
  highValue: number;
  lowRoi: number;
  highRoi: number;
  impact: number;
}

// Helper function to calculate ROI - defined outside component to avoid closure issues
function calculateRoiWithInputs(
  inputs: ClientInputs, 
  ts: number, 
  wc: number, 
  industry: string
): number {
  try {
    const newPricing = calculateInvestment({
      teamSize: ts,
      industry,
      workflowCount: wc,
      workflowsToReplace: inputs.workflowCount,
    });
    const roiCalcs = calculateROIScenarios(newPricing, { ...inputs, teamSize: ts });
    const likely = roiCalcs.find(r => r.scenario.type === 'likely');
    return likely?.roiPercentage || 0;
  } catch (e) {
    console.error('ROI calculation error:', e);
    return 0;
  }
}

export const SensitivityAnalysis = memo(function SensitivityAnalysis({
  pricing,
  clientInputs,
  teamSize,
  workflowCount,
  industry,
  baseRoi,
}: SensitivityAnalysisProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [factors, setFactors] = useState<SensitivityFactor[]>([]);

  // Calculate factors when dependencies change - using useEffect instead of useMemo
  useEffect(() => {
    try {
      const results: SensitivityFactor[] = [];

      // Team Size sensitivity
      const teamLow = Math.max(1, Math.round(teamSize * 0.8));
      const teamHigh = Math.round(teamSize * 1.2);
      results.push({
        name: 'Team Size',
        description: 'Number of team members who will use the AI workflows',
        baseValue: teamSize,
        unit: 'staff',
        lowValue: teamLow,
        highValue: teamHigh,
        lowRoi: calculateRoiWithInputs(clientInputs, teamLow, workflowCount, industry),
        highRoi: calculateRoiWithInputs(clientInputs, teamHigh, workflowCount, industry),
        impact: 0,
      });

      // Hours per week sensitivity
      const hoursLow = Math.max(1, Math.round(clientInputs.hoursPerWeekOnAdmin * 0.8));
      const hoursHigh = Math.round(clientInputs.hoursPerWeekOnAdmin * 1.2);
      const lowHoursInputs = { ...clientInputs, hoursPerWeekOnAdmin: hoursLow };
      const highHoursInputs = { ...clientInputs, hoursPerWeekOnAdmin: hoursHigh };
      results.push({
        name: 'Hours/Week',
        description: 'Hours per person spent on manual repetitive work',
        baseValue: clientInputs.hoursPerWeekOnAdmin,
        unit: 'hrs/person',
        lowValue: hoursLow,
        highValue: hoursHigh,
        lowRoi: calculateRoiWithInputs(lowHoursInputs, teamSize, workflowCount, industry),
        highRoi: calculateRoiWithInputs(highHoursInputs, teamSize, workflowCount, industry),
        impact: 0,
      });

      // Salary sensitivity
      const salaryLow = Math.round(clientInputs.averageHourlyCost * 0.8);
      const salaryHigh = Math.round(clientInputs.averageHourlyCost * 1.2);
      const lowSalaryInputs = { ...clientInputs, averageHourlyCost: salaryLow };
      const highSalaryInputs = { ...clientInputs, averageHourlyCost: salaryHigh };
      results.push({
        name: 'Avg. Salary',
        description: 'Average annual salary of team members',
        baseValue: clientInputs.averageHourlyCost,
        unit: '',
        lowValue: salaryLow,
        highValue: salaryHigh,
        lowRoi: calculateRoiWithInputs(lowSalaryInputs, teamSize, workflowCount, industry),
        highRoi: calculateRoiWithInputs(highSalaryInputs, teamSize, workflowCount, industry),
        impact: 0,
      });

      // Workflow count sensitivity
      const wfLow = Math.max(1, Math.round(workflowCount * 0.8));
      const wfHigh = Math.round(workflowCount * 1.2);
      results.push({
        name: 'AI Agents',
        description: 'Number of AI workflow agents to implement',
        baseValue: workflowCount,
        unit: 'agents',
        lowValue: wfLow,
        highValue: wfHigh,
        lowRoi: calculateRoiWithInputs(clientInputs, teamSize, wfLow, industry),
        highRoi: calculateRoiWithInputs(clientInputs, teamSize, wfHigh, industry),
        impact: 0,
      });

      // Calculate impact scores and sort by impact
      const sortedResults = results.map(f => ({
        ...f,
        impact: Math.abs(f.highRoi - f.lowRoi),
      })).sort((a, b) => b.impact - a.impact);

      setFactors(sortedResults);
    } catch (error) {
      console.error('Sensitivity analysis error:', error);
      setFactors([]);
    }
  }, [clientInputs, teamSize, workflowCount, industry]);

  // Guard against empty factors
  if (factors.length === 0) {
    return (
      <div className="border border-border rounded-xl overflow-hidden bg-card">
        <div className="px-4 py-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Activity className="w-4 h-4" />
          <span>ROI Sensitivity Analysis (Loading...)</span>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="border border-border rounded-xl overflow-hidden bg-card">
        {/* Header - clickable to toggle */}
        <Button
          variant="ghost"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 h-auto justify-between hover:bg-muted/50 rounded-none"
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <Activity className="w-4 h-4 text-primary" />
            <span>ROI Sensitivity Analysis (±20%)</span>
          </div>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </Button>

        {/* Content - conditionally rendered */}
        {isOpen && (
          <div className="px-4 pb-4 pt-2 space-y-4 border-t border-border">
            {/* Explanation */}
            <p className="text-xs text-muted-foreground">
              See how your ROI changes when each input varies by ±20%. Factors with higher impact have the most influence on your returns.
            </p>

            {/* Sensitivity Bars */}
            <div className="space-y-4">
              {factors.map((factor) => (
                <div key={factor.name} className="space-y-2">
                  {/* Factor Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{factor.name}</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs max-w-xs">{factor.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Impact: {factor.impact}% swing
                    </Badge>
                  </div>

                  {/* Tornado Chart Style */}
                  <div className="relative h-8 bg-muted/30 rounded-lg overflow-hidden">
                    {/* Center line (base ROI) */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border z-10" />
                    
                    {/* Low ROI bar (left side) */}
                    <div 
                      className="absolute right-1/2 top-1 bottom-1 bg-red-500/20 rounded-l flex items-center justify-start pl-2"
                      style={{ 
                        width: `${Math.min(50, Math.max(5, (baseRoi - factor.lowRoi) / 2))}%`,
                      }}
                    >
                      <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                        <TrendingDown className="w-3 h-3" />
                        <span className="font-medium">{factor.lowRoi}%</span>
                      </div>
                    </div>

                    {/* High ROI bar (right side) */}
                    <div 
                      className="absolute left-1/2 top-1 bottom-1 bg-green-500/20 rounded-r flex items-center justify-end pr-2"
                      style={{ 
                        width: `${Math.min(50, Math.max(5, (factor.highRoi - baseRoi) / 2))}%`,
                      }}
                    >
                      <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                        <span className="font-medium">{factor.highRoi}%</span>
                        <TrendingUp className="w-3 h-3" />
                      </div>
                    </div>
                  </div>

                  {/* Value Labels */}
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      -20%: {factor.name === 'Avg. Salary' 
                        ? formatCurrency(factor.lowValue) 
                        : `${factor.lowValue} ${factor.unit}`}
                    </span>
                    <span className="font-medium text-foreground">
                      Base: {factor.name === 'Avg. Salary' 
                        ? formatCurrency(factor.baseValue) 
                        : `${factor.baseValue} ${factor.unit}`}
                    </span>
                    <span>
                      +20%: {factor.name === 'Avg. Salary' 
                        ? formatCurrency(factor.highValue) 
                        : `${factor.highValue} ${factor.unit}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Impact Summary */}
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-3">
                <strong>Key Insight:</strong> {factors[0]?.name} has the biggest impact on your ROI. 
                A 20% change can swing your returns by up to {factors[0]?.impact}%.
              </p>
              <div className="flex flex-wrap gap-2">
                {factors.slice(0, 2).map(f => (
                  <Badge key={f.name} variant="secondary" className="text-xs">
                    🎯 {f.name}: High Impact
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
});
