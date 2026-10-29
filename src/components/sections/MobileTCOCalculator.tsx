import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Calculator, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Zap,
  ArrowRight,
  CheckCircle2,
  Calendar,
  RotateCcw,
  Building2,
  Layers,
  Minus,
  Equal,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import BookingChatModal from "@/components/BookingChatModal";
import {
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

const defaultInputs: Inputs = {
  adminStaffCount: 1,
  adminHourlyCost: 45,
  hoursPerWeek: 12,
  teamSize: 10,
  industry: "general",
  workflowCount: 4,
};

export default function MobileTCOCalculator() {
  const [inputs, setInputs] = useState<Inputs>(defaultInputs);
  const [showResults, setShowResults] = useState(false);
  const [isCalendlyOpen, setIsCalendlyOpen] = useState(false);
  const [useCustomAdminStaff, setUseCustomAdminStaff] = useState(false);
  const [useCustomHourlyCost, setUseCustomHourlyCost] = useState(false);

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

  const AUTOMATION_RATE = 0.70;

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
      estimatedTeamSize,
    };
  }, [inputs, investment, estimatedTeamSize]);

  const handleReset = () => {
    setInputs(defaultInputs);
    setShowResults(false);
    setUseCustomAdminStaff(false);
    setUseCustomHourlyCost(false);
  };

  if (showResults) {
    return (
      <section className="py-12 bg-gradient-to-b from-background to-muted/20">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Results Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-3 glow-mint">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-600">Your ROI Results</span>
              </div>
              <h3 className="text-xl font-bold text-foreground">Investment vs. Return</h3>
            </div>

            {/* ROI Comparison Flow */}
            <div className="space-y-3">
              {/* Current Cost */}
              <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-destructive" />
                    <span className="text-sm text-muted-foreground">Your Annual Cost</span>
                  </div>
                  <span className="text-lg font-bold text-destructive">{formatCurrency(results.currentAnnualCost)}</span>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <Minus className="w-4 h-4 text-muted-foreground" />
              </div>

              {/* Alfred Investment */}
              <div className="p-4 rounded-xl border border-primary/30 bg-primary/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">alfred ai Investment</span>
                  </div>
                  <span className="text-lg font-bold text-primary">{formatCurrency(investment.annualInvestment)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Setup: {formatCurrency(investment.setupInvestment)}</span>
                  <span>Monthly: {formatCurrency(investment.monthlyRetainer)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-primary/20">
                  {investment.tier.name} • {investment.industry.name} • {investment.complexity.name}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <ArrowRight className="w-4 h-4" />
                <span className="text-xs">70% Agentic Efficiency</span>
                <Equal className="w-4 h-4" />
              </div>

              {/* Net Result */}
              <div className={cn(
                "p-5 rounded-xl text-center",
                results.netAnnualGain > 0 
                  ? "bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20"
                  : "bg-amber-500/5 border border-amber-500/20"
              )}>
                <div className="flex items-center justify-center gap-2 mb-1">
                  {results.netAnnualGain > 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <TrendingUp className="w-5 h-5 text-amber-600" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    {results.netAnnualGain > 0 ? "Year 1 Net Savings" : "Investment Period"}
                  </span>
                </div>
                <p className={cn(
                  "text-2xl font-bold",
                  results.netAnnualGain > 0 ? "text-emerald-600" : "text-amber-600"
                )}>
                  {formatCurrency(Math.abs(results.netAnnualGain))}
                </p>
                {results.netAnnualGain > 0 && results.roiPercent > 0 && (
                  <p className="text-sm text-emerald-600 mt-1">{results.roiPercent}% ROI</p>
                )}
              </div>

              {results.breakEvenMonths > 0 && results.breakEvenMonths <= 24 && (
                <div className="p-3 rounded-lg border border-border bg-muted/50 text-center">
                  <span className="text-sm text-muted-foreground">Break-even in </span>
                  <span className="font-bold text-foreground">{results.breakEvenMonths} {results.breakEvenMonths === 1 ? 'month' : 'months'}</span>
                </div>
              )}
            </div>

            {/* CTAs */}
            <div className="space-y-3 pt-4">
              <Button 
                size="lg" 
                onClick={() => setIsCalendlyOpen(true)}
                className="w-full gap-2 bg-gradient-to-r from-primary to-pink-500"
              >
                <Calendar className="w-4 h-4" />
                Get Your Personalized Quote
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={handleReset}
                className="w-full gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Recalculate
              </Button>
            </div>
          </motion.div>
        </div>
        <BookingChatModal isOpen={isCalendlyOpen} onClose={() => setIsCalendlyOpen(false)} />
      </section>
    );
  }

  return (
    <section className="py-12 bg-gradient-to-b from-background to-muted/20">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Calculator className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Investment Estimator</span>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              What's Your ROI Potential?
            </h2>
            <p className="text-sm text-muted-foreground">
              Get your personalized estimate in 60 seconds
            </p>
          </div>

          {/* Compact Input Form */}
          <div className="bg-card rounded-2xl border border-border p-5 space-y-5">
            {/* Admin Staff Count */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <Label className="text-sm font-medium">Non-Agentic Staff</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/60 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-xs"><strong>Non-agentic:</strong> Manual tasks done by humans without AI.</p>
                        <p className="text-xs mt-1"><strong>Agentic AI:</strong> AI agents that autonomously execute work.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {useCustomAdminStaff ? (
                  <Input
                    type="number"
                    value={inputs.adminStaffCount}
                    onChange={(e) => {
                      const val = Math.min(100, Math.max(1, parseInt(e.target.value) || 1));
                      setInputs(prev => ({ ...prev, adminStaffCount: val, teamSize: val * 10 }));
                    }}
                    className="w-20 h-8 text-right text-lg font-bold text-primary"
                    min={1}
                    max={100}
                  />
                ) : (
                  <span className="text-lg font-bold text-primary">{inputs.adminStaffCount}</span>
                )}
              </div>
              {!useCustomAdminStaff ? (
                <>
                  <Slider
                    value={[Math.min(inputs.adminStaffCount, 10)]}
                    onValueChange={([v]) => setInputs(prev => ({ ...prev, adminStaffCount: v, teamSize: v * 10 }))}
                    min={1}
                    max={10}
                    step={1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1</span>
                    <button 
                      type="button"
                      onClick={() => setUseCustomAdminStaff(true)}
                      className="text-primary hover:underline font-medium"
                    >
                      10+ (custom)
                    </button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setUseCustomAdminStaff(false);
                    if (inputs.adminStaffCount > 10) {
                      setInputs(prev => ({ ...prev, adminStaffCount: 10, teamSize: 100 }));
                    }
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  ← Back to slider (1-10)
                </button>
              )}
              <p className="text-xs text-muted-foreground">
                ≈ {estimatedTeamSize} total team (1 non-agentic role per 10 staff)
              </p>
            </div>

            {/* Hourly Cost */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <Label className="text-sm font-medium">Avg Hourly Cost</Label>
                </div>
                {useCustomHourlyCost ? (
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-bold text-primary">$</span>
                    <Input
                      type="number"
                      value={inputs.adminHourlyCost}
                      onChange={(e) => {
                        const val = Math.min(1000, Math.max(0, parseInt(e.target.value) || 0));
                        setInputs(prev => ({ ...prev, adminHourlyCost: val }));
                      }}
                      className="w-20 h-8 text-right text-lg font-bold text-primary"
                      min={0}
                      max={1000}
                    />
                    <span className="text-lg font-bold text-primary">/hr</span>
                  </div>
                ) : (
                  <span className="text-lg font-bold text-primary">${inputs.adminHourlyCost}/hr</span>
                )}
              </div>
              {!useCustomHourlyCost ? (
                <>
                  <Slider
                    value={[Math.min(inputs.adminHourlyCost, 100)]}
                    onValueChange={([v]) => setInputs(prev => ({ ...prev, adminHourlyCost: v }))}
                    min={0}
                    max={100}
                    step={5}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>$0</span>
                    <button 
                      type="button"
                      onClick={() => setUseCustomHourlyCost(true)}
                      className="text-primary hover:underline font-medium"
                    >
                      $100+ (custom)
                    </button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setUseCustomHourlyCost(false);
                    if (inputs.adminHourlyCost > 100) {
                      setInputs(prev => ({ ...prev, adminHourlyCost: 100 }));
                    }
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  ← Back to slider ($0-$100)
                </button>
              )}
            </div>

            {/* Hours per Week */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Non-Agentic Hours/Week</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/60 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-xs">Hours spent on manual repetitive tasks that AI agents can automate.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <span className="text-lg font-bold text-primary">{inputs.hoursPerWeek}h</span>
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
                <Building2 className="w-4 h-4 text-primary" />
                <Label className="text-sm font-medium">Industry</Label>
              </div>
              <Select
                value={inputs.industry}
                onValueChange={(v) => setInputs(prev => ({ ...prev, industry: v }))}
              >
                <SelectTrigger className="h-10">
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

            {/* Number of Workflows */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  <Label className="text-sm font-medium">Number of Workflows</Label>
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
                <span>1 workflow</span>
                <span>15+ workflows</span>
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

            {/* Live Preview */}
            <div className="pt-4 border-t border-border space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Your annual cost:</span>
                <span className="font-bold text-destructive">{formatCurrency(results.currentAnnualCost)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Alfred investment:</span>
                <span className="font-bold text-primary">{formatCurrency(investment.annualInvestment)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Estimated savings:</span>
                <span className={cn(
                  "font-bold",
                  results.netAnnualGain > 0 ? "text-emerald-600" : "text-amber-600"
                )}>
                  {formatCurrency(Math.abs(results.netAnnualGain))}
                </span>
              </div>
            </div>

            {/* CTA */}
            <Button 
              size="lg" 
              className="w-full gap-2"
              onClick={() => setShowResults(true)}
            >
              See Full ROI Breakdown
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </div>
      <BookingChatModal isOpen={isCalendlyOpen} onClose={() => setIsCalendlyOpen(false)} />
    </section>
  );
}
