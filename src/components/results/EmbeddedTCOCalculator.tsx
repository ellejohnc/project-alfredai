import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Zap,
  CheckCircle2,
  Building2,
  Layers,
  ArrowRight,
  Minus,
  Equal,
  HelpCircle,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import alfredAIcon from "@/assets/alfred-a-dark-mid.jpg";
import {
  pricingTiers,
  industryMultipliers,
  complexityLevels,
  calculateInvestment,
  formatCurrency,
  getComplexityFromWorkflowCount,
  type PricingInputs,
} from "@/lib/pricingEngine";

interface Inputs extends Omit<PricingInputs, 'workflowCount'> {
  workflowCount: number;
  adminStaffCount: number;
  adminHourlyCost: number;
  hoursPerWeek: number;
}

interface EmbeddedTCOCalculatorProps {
  teamSize?: string;
  industry?: string;
  onBookCall?: () => void;
}

export function EmbeddedTCOCalculator({ teamSize, industry, onBookCall }: EmbeddedTCOCalculatorProps) {
  const parseTeamSize = (size?: string): { staff: number } => {
    if (!size) return { staff: 5 };
    const lowerSize = size.toLowerCase();
    
    if (lowerSize.includes("1-10") || lowerSize.includes("startup")) return { staff: 3 };
    if (lowerSize.includes("11-50") || lowerSize.includes("small")) return { staff: 5 };
    if (lowerSize.includes("51-200") || lowerSize.includes("medium")) return { staff: 8 };
    if (lowerSize.includes("200") || lowerSize.includes("large") || lowerSize.includes("enterprise")) return { staff: 10 };
    
    const match = size.match(/\d+/);
    if (match) {
      const num = parseInt(match[0]);
      if (num <= 10) return { staff: 3 };
      if (num <= 50) return { staff: 5 };
      if (num <= 200) return { staff: 8 };
      return { staff: 10 };
    }
    
    return { staff: 5 };
  };

  const parseIndustry = (ind?: string): string => {
    if (!ind) return "general";
    const lower = ind.toLowerCase();
    if (lower.includes("construct") || lower.includes("property") || lower.includes("real estate")) return "construction";
    if (lower.includes("professional") || lower.includes("consulting") || lower.includes("legal") || lower.includes("accounting")) return "professional_services";
    if (lower.includes("manufactur")) return "manufacturing";
    if (lower.includes("financ") || lower.includes("insurance") || lower.includes("bank")) return "finance";
    if (lower.includes("health") || lower.includes("medical")) return "healthcare";
    if (lower.includes("retail") || lower.includes("ecommerce") || lower.includes("e-commerce")) return "retail";
    if (lower.includes("tech") || lower.includes("software") || lower.includes("saas")) return "technology";
    return "general";
  };

  const parsed = parseTeamSize(teamSize);
  const parsedIndustry = parseIndustry(industry);

  const [inputs, setInputs] = useState<Inputs>({
    adminStaffCount: parsed.staff,
    adminHourlyCost: 55,
    hoursPerWeek: 25,
    teamSize: parsed.staff * 10,
    industry: parsedIndustry,
    workflowCount: 4,
  });

  const estimatedTeamSize = inputs.adminStaffCount * 10;

  // Derive complexity from workflow count
  const derivedComplexity = useMemo(() => {
    return getComplexityFromWorkflowCount(inputs.workflowCount);
  }, [inputs.workflowCount]);

  // Calculate investment using pricing engine
  const investment = useMemo(() => {
    return calculateInvestment({
      teamSize: estimatedTeamSize,
      industry: inputs.industry,
      workflowCount: inputs.workflowCount,
    });
  }, [estimatedTeamSize, inputs.industry, inputs.workflowCount]);

  const AUTOMATION_RATE = 0.70; // 70% AI Agent Autonomy Rate

  const results = useMemo(() => {
    const labourCostMonthly = inputs.adminHourlyCost * inputs.hoursPerWeek * 4.33 * inputs.adminStaffCount;
    const currentMonthlyCost = labourCostMonthly;
    const currentAnnualCost = currentMonthlyCost * 12;
    
    const totalSavingsMonthly = labourCostMonthly * AUTOMATION_RATE;
    const totalSavingsAnnual = totalSavingsMonthly * 12;
    
    const netMonthlyGain = totalSavingsMonthly - investment.monthlyRetainer;
    const netAnnualGain = totalSavingsAnnual - investment.annualInvestment;
    
    const breakEvenMonths = netMonthlyGain > 0 
      ? Math.ceil(investment.setupInvestment / netMonthlyGain) 
      : 0;
    
    const roiPercent = investment.annualInvestment > 0 
      ? Math.round((netAnnualGain / investment.annualInvestment) * 100) 
      : 0;

    return {
      currentMonthlyCost,
      currentAnnualCost,
      totalSavingsMonthly,
      totalSavingsAnnual,
      netMonthlyGain,
      netAnnualGain,
      breakEvenMonths,
      roiPercent,
    };
  }, [inputs, investment]);

  return (
    <Card className="border border-border bg-card">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <img src={alfredAIcon} alt="alfred ai" className="w-5 h-5 object-contain rounded" />
          <h3 className="font-semibold text-foreground">Your Agentic AI Investment</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-6">Unlike traditional automation, alfred ai agents learn, reason, and adapt to your business</p>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Inputs Panel */}
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground mb-4">Adjust your details to see a personalized estimate</p>
            
            {/* Admin Staff Count */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Non-Agentic Staff</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/60 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-xs"><strong>Non-agentic:</strong> Traditional manual tasks—data entry, scheduling, reporting—done by humans without AI assistance.</p>
                        <p className="text-xs mt-1"><strong>Agentic AI:</strong> Autonomous AI agents that learn, reason, and execute these tasks intelligently.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <span className="text-lg font-bold text-foreground">{inputs.adminStaffCount}</span>
              </div>
              <Slider
                value={[inputs.adminStaffCount]}
                onValueChange={([v]) => setInputs(prev => ({ ...prev, adminStaffCount: v, teamSize: v * 10 }))}
                min={1}
                max={25}
                step={1}
              />
              <p className="text-xs text-muted-foreground">≈ {estimatedTeamSize} total team size</p>
            </div>

            {/* Hourly Cost */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Hourly Cost</Label>
                </div>
                <span className="text-lg font-bold text-foreground">${inputs.adminHourlyCost}/hr</span>
              </div>
              <Slider
                value={[inputs.adminHourlyCost]}
                onValueChange={([v]) => setInputs(prev => ({ ...prev, adminHourlyCost: v }))}
                min={20}
                max={150}
                step={5}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Non-Agentic Hours/Week (per person)</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/60 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-xs">Hours spent on repetitive manual work that AI agents can automate—freeing your team for strategic initiatives.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <span className="text-lg font-bold text-foreground">{inputs.hoursPerWeek}h</span>
              </div>
              <Slider
                value={[inputs.hoursPerWeek]}
                onValueChange={([v]) => setInputs(prev => ({ ...prev, hoursPerWeek: v }))}
                min={5}
                max={40}
                step={1}
              />
            </div>

            {/* Industry */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Industry</Label>
              </div>
              <Select
                value={inputs.industry}
                onValueChange={(v) => setInputs(prev => ({ ...prev, industry: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {industryMultipliers.map((ind) => (
                    <SelectItem key={ind.id} value={ind.id}>
                      {ind.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Number of AI Agents */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">AI Agent Deployments</Label>
                </div>
                <span className="text-lg font-semibold text-foreground">{inputs.workflowCount}</span>
              </div>
              <Slider
                value={[inputs.workflowCount]}
                onValueChange={([value]) => setInputs(prev => ({ ...prev, workflowCount: value }))}
                min={1}
                max={15}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 agent</span>
                <span>15+ agents</span>
              </div>
              <div className={cn(
                "inline-flex px-2 py-1 rounded-full text-xs font-medium",
                derivedComplexity.id === "simple" && "bg-green-500/20 text-green-400",
                derivedComplexity.id === "standard" && "bg-blue-500/20 text-blue-400",
                derivedComplexity.id === "advanced" && "bg-amber-500/20 text-amber-400",
                derivedComplexity.id === "complex" && "bg-purple-500/20 text-purple-400"
              )}>
                {derivedComplexity.name} ({derivedComplexity.workflowRange})
              </div>
            </div>
          </div>

          {/* ROI Comparison Panel */}
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">Annual ROI Comparison</p>
            
            {/* Visual ROI Comparison */}
            <div className="space-y-3">
              {/* Your Current Cost */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 rounded-xl border border-destructive/30 bg-destructive/5"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Your Current Annual Cost</span>
                  <span className="text-xl font-bold text-destructive">{formatCurrency(results.currentAnnualCost)}</span>
                </div>
                <p className="text-xs text-muted-foreground">Based on {inputs.adminStaffCount} non-agentic staff × {inputs.hoursPerWeek}h/week × ${inputs.adminHourlyCost}/hr</p>
              </motion.div>

              <div className="flex items-center justify-center">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Minus className="w-4 h-4" />
                  <span className="text-xs font-medium">alfred ai Investment</span>
                </div>
              </div>

              {/* Alfred Investment */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="p-4 rounded-xl border border-primary/30 bg-primary/5"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Year 1 Investment</span>
                  </div>
                  <span className="text-xl font-bold text-primary">{formatCurrency(investment.annualInvestment)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Setup:</span>
                    <span className="font-medium text-foreground">{formatCurrency(investment.setupInvestment)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monthly:</span>
                    <span className="font-medium text-foreground">{formatCurrency(investment.monthlyRetainer)}</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-primary/20 text-xs text-muted-foreground">
                  <span>{investment.tier.name} tier • {investment.industry.name} • {investment.complexity.name}</span>
                </div>
              </motion.div>

              <div className="flex items-center justify-center">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ArrowRight className="w-4 h-4" />
                  <span className="text-xs font-medium">70% AI Agent Autonomy</span>
                  <Equal className="w-4 h-4" />
                </div>
              </div>

              {/* Net Savings */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className={cn(
                  "p-5 rounded-xl border text-center",
                  results.netAnnualGain > 0 
                    ? "border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5" 
                    : "border-amber-500/30 bg-amber-500/5"
                )}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  {results.netAnnualGain > 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <TrendingUp className="w-5 h-5 text-amber-600" />
                  )}
                  <span className="text-sm font-medium text-muted-foreground">
                    {results.netAnnualGain > 0 ? "Agentic AI Net Value" : "Investment Period"}
                  </span>
                </div>
                <p className={cn(
                  "text-3xl font-bold",
                  results.netAnnualGain > 0 ? "text-emerald-600" : "text-amber-600"
                )}>
                  {results.netAnnualGain > 0 ? formatCurrency(results.netAnnualGain) : formatCurrency(Math.abs(results.netAnnualGain))}
                </p>
                {results.netAnnualGain > 0 && results.roiPercent > 0 && (
                  <p className="text-sm text-emerald-600 mt-1">{results.roiPercent}% ROI</p>
                )}
              </motion.div>

              {/* Break-even */}
              {results.breakEvenMonths > 0 && results.breakEvenMonths <= 24 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="p-3 rounded-lg border border-border bg-muted/50 text-center"
                >
                  <span className="text-sm text-muted-foreground">AI Investment Payback: </span>
                  <span className="font-bold text-foreground">{results.breakEvenMonths} {results.breakEvenMonths === 1 ? 'month' : 'months'}</span>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
