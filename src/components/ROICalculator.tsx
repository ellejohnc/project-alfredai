import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { PRODUCTION_DOMAIN } from "@/lib/siteConfig";
import { Clock, DollarSign, TrendingUp, Users, Share2, RotateCcw, Zap, Sparkles, ArrowRight, FileDown, Building2, Layers, Minus, Equal, CheckCircle2, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip as ShadcnTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from "recharts";
import BookingChatModal from "@/components/BookingChatModal";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import alfredAIcon from "@/assets/alfred-a-dark-mid.jpg";
import alfredLogo from "@/assets/alfred-ai-transparent.png";
import { cn } from "@/lib/utils";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import {
  industryMultipliers,
  complexityLevels,
  calculateInvestment,
  formatCurrency,
  getComplexityFromWorkflowCount,
  type PricingInputs,
} from "@/lib/pricingEngine";

interface CalculatorInputs extends Omit<PricingInputs, 'workflowCount'> {
  workflowCount: number;
  averageSalary: number;
  adminHoursPerWeek: number;
  toolsUsed: number;
  revenueMultiplier: number;
}

// Animated background orbs for visual interest
const FloatingOrb = ({ delay, size, x, y }: { delay: number; size: number; x: string; y: string }) => (
  <motion.div
    className="absolute rounded-full bg-gradient-to-br from-primary/20 to-primary/5 blur-xl pointer-events-none"
    style={{ width: size, height: size, left: x, top: y }}
    animate={{
      y: [0, -20, 0],
      scale: [1, 1.1, 1],
      opacity: [0.3, 0.5, 0.3],
    }}
    transition={{
      duration: 4,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

// Animated stat card with counting animation
const AnimatedStatCard = ({ 
  icon: Icon, 
  value, 
  label, 
  suffix = "", 
  prefix = "",
  delay,
  color = "primary"
}: { 
  icon: React.ElementType; 
  value: number; 
  label: string; 
  suffix?: string;
  prefix?: string;
  delay: number;
  color?: "primary" | "secondary" | "warning";
}) => {
  const colorClasses = {
    primary: "from-primary/20 to-primary/5 text-primary",
    secondary: "from-secondary/20 to-secondary/5 text-secondary",
    warning: "from-warning/20 to-warning/5 text-warning",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, type: "spring", stiffness: 100 }}
      className="relative overflow-hidden bg-card rounded-xl border border-border p-5 group hover:border-primary/40 transition-all duration-300"
    >
      {/* Animated gradient background */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color].split(" ")[0]} ${colorClasses[color].split(" ")[1]} opacity-0 group-hover:opacity-100`}
        transition={{ duration: 0.3 }}
      />
      
      {/* Icon with pulse animation */}
      <motion.div
        className="relative mb-3"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity, delay }}
      >
        <Icon className={`w-6 h-6 ${colorClasses[color].split(" ")[2]}`} />
      </motion.div>
      
      <div className="relative">
        <motion.div
          className="text-2xl md:text-3xl font-bold text-foreground mb-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.2 }}
        >
          {prefix}{value.toLocaleString()}{suffix}
        </motion.div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
      
      {/* Sparkle effect */}
      <motion.div
        className="absolute top-2 right-2"
        animate={{ rotate: 360, scale: [1, 1.2, 1] }}
        transition={{ duration: 3, repeat: Infinity, delay }}
      >
        <Sparkles className="w-4 h-4 text-primary/30" />
      </motion.div>
    </motion.div>
  );
};

const ROICalculator = () => {
  const [isCalendlyOpen, setIsCalendlyOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [useCustomTeamSize, setUseCustomTeamSize] = useState(false);
  const [inputs, setInputs] = useState<CalculatorInputs>({
    teamSize: 10,
    averageSalary: 75000,
    adminHoursPerWeek: 15,
    toolsUsed: 5,
    revenueMultiplier: 2.8,
    industry: "general",
    workflowCount: 4,
  });

  // Calculate investment using pricing engine
  const investment = useMemo(() => {
    return calculateInvestment({
      teamSize: inputs.teamSize,
      industry: inputs.industry,
      workflowCount: inputs.workflowCount,
    });
  }, [inputs.teamSize, inputs.industry, inputs.workflowCount]);

  // Derive complexity label from workflow count
  const derivedComplexity = useMemo(() => {
    return getComplexityFromWorkflowCount(inputs.workflowCount);
  }, [inputs.workflowCount]);

  // Calculate AI Agent Autonomy Rate based on number of tools
  // More tools = more fragmentation = higher potential from AI agent orchestration
  const getAgentAutonomyRate = (tools: number): number => {
    if (tools <= 3) return 0.50;      // 50% - already streamlined
    if (tools <= 5) return 0.60;      // 60% - some orchestration benefit
    if (tools <= 8) return 0.70;      // 70% - typical AI agent autonomy
    if (tools <= 12) return 0.75;     // 75% - good orchestration opportunity
    if (tools <= 15) return 0.80;     // 80% - significant AI automation
    return 0.85;                       // 85% - major agentic efficiency gains
  };

  // Estimate tool licensing cost per user per month based on tool count
  const getToolLicensingSavings = (tools: number, teamSize: number): number => {
    // Average tool cost: $25/user/month per platform, consolidation saves ~60% of fragmented tools
    const avgToolCostPerMonth = 25;
    const consolidationRate = 0.6; // Can replace 60% of tools
    const toolsReplaced = Math.floor(tools * consolidationRate);
    return toolsReplaced * avgToolCostPerMonth * teamSize * 12; // Yearly savings
  };

  const results = useMemo(() => {
    const hourlyRate = inputs.averageSalary / 2080;
    const revenuePerHour = hourlyRate * inputs.revenueMultiplier;
    const weeklyAdminHoursTotal = inputs.teamSize * inputs.adminHoursPerWeek;
    const yearlyAdminHours = weeklyAdminHoursTotal * 52;
    const yearlyAdminCost = yearlyAdminHours * hourlyRate;
    
    // Dynamic AI Agent Autonomy Rate based on tool complexity
    const agentAutonomyRate = getAgentAutonomyRate(inputs.toolsUsed);
    const timeSavedHours = yearlyAdminHours * agentAutonomyRate;
    const costSaved = yearlyAdminCost * agentAutonomyRate;
    
    // Tool consolidation savings
    const toolConsolidationSavings = getToolLicensingSavings(inputs.toolsUsed, inputs.teamSize);
    
    const productiveHoursGained = timeSavedHours;
    const revenueIncrease = productiveHoursGained * revenuePerHour;
    
    // Calculate yearly savings and net gain
    const grossSavings = costSaved + revenueIncrease + toolConsolidationSavings;
    const netAnnualGain = grossSavings - investment.annualInvestment;
    
    // Break-even calculation
    const netMonthlyGain = (grossSavings / 12) - investment.monthlyRetainer;
    const breakEvenMonths = netMonthlyGain > 0 
      ? Math.ceil(investment.setupInvestment / netMonthlyGain) 
      : 0;
    
    const roiPercent = investment.annualInvestment > 0 
      ? Math.round((netAnnualGain / investment.annualInvestment) * 100) 
      : 0;
    
    return {
      timeSavedHours: Math.round(timeSavedHours),
      timeSavedWeekly: Math.round(timeSavedHours / 52),
      costSaved: Math.round(costSaved),
      revenueIncrease: Math.round(revenueIncrease),
      toolConsolidationSavings: Math.round(toolConsolidationSavings),
      toolsReplaced: Math.floor(inputs.toolsUsed * 0.6),
      grossSavings: Math.round(grossSavings),
      netAnnualGain: Math.round(netAnnualGain),
      breakEvenMonths,
      roiPercent,
      agentAutonomyPercent: Math.round(agentAutonomyRate * 100),
      revenuePerHour: Math.round(revenuePerHour),
    };
  }, [inputs, investment]);

  const handleCalculate = () => {
    setShowResults(true);
  };

  const handleReset = () => {
    setShowResults(false);
    setUseCustomTeamSize(false);
    setInputs({
      teamSize: 10,
      averageSalary: 75000,
      adminHoursPerWeek: 15,
      toolsUsed: 5,
      revenueMultiplier: 2.8,
      industry: "general",
      workflowCount: 4,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-AU').format(value);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFillColor(20, 20, 30);
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('alfred ai ROI Report', pageWidth / 2, 25, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on ${new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth / 2, 35, { align: 'center' });
    
    // Reset text color for body
    doc.setTextColor(30, 30, 40);
    
    // Input Summary Section
    let yPos = 60;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Your Business Profile', 20, yPos);
    
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 90);
    
    const inputItems = [
      { label: 'Team Size', value: `${inputs.teamSize} people` },
      { label: 'Industry', value: industryMultipliers.find(i => i.id === inputs.industry)?.name || inputs.industry },
      { label: 'Number of Workflows', value: `${inputs.workflowCount} workflows (${derivedComplexity.name})` },
      { label: 'Average Annual Salary', value: formatCurrency(inputs.averageSalary) },
      { label: 'Non-Agentic Hours per Person/Week', value: `${inputs.adminHoursPerWeek} hours` },
      { label: 'Tools/Systems Used', value: `${inputs.toolsUsed} tools` },
      { label: 'Revenue Multiplier', value: `${inputs.revenueMultiplier.toFixed(1)}x salary` },
    ];
    
    inputItems.forEach((item) => {
      doc.text(`${item.label}:`, 25, yPos);
      doc.setFont('helvetica', 'bold');
      doc.text(item.value, 100, yPos);
      doc.setFont('helvetica', 'normal');
      yPos += 7;
    });
    
    // Key Metrics Section
    yPos += 10;
    doc.setTextColor(30, 30, 40);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Key Results', 20, yPos);
    
    yPos += 12;
    
    // Metrics boxes
    const metrics = [
      { label: 'AI Agent Autonomy', value: `${results.agentAutonomyPercent}%` },
      { label: 'Hours Saved/Week', value: `${formatNumber(results.timeSavedWeekly)} hours` },
      { label: 'Yearly Cost Saved', value: formatCurrency(results.costSaved) },
      { label: 'AI Investment Payback', value: results.breakEvenMonths > 0 ? `${results.breakEvenMonths} months` : 'Immediate' },
    ];
    
    const boxWidth = 40;
    const boxSpacing = 5;
    const startX = 20;
    
    metrics.forEach((metric, index) => {
      const x = startX + (boxWidth + boxSpacing) * index;
      
      // Box background
      doc.setFillColor(240, 240, 245);
      doc.roundedRect(x, yPos, boxWidth, 25, 3, 3, 'F');
      
      // Value
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 40);
      doc.text(metric.value, x + boxWidth / 2, yPos + 10, { align: 'center' });
      
      // Label
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 110);
      doc.text(metric.label, x + boxWidth / 2, yPos + 18, { align: 'center' });
    });
    
    // Impact Breakdown Section
    yPos += 40;
    doc.setTextColor(30, 30, 40);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Impact Breakdown', 20, yPos);
    
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const breakdownItems = [
      { label: 'Gross Savings (Non-Agentic Ops + Revenue + Tools)', value: formatCurrency(results.grossSavings) },
      { label: `alfred ai Investment (${investment.tier.name} Tier)`, value: `-${formatCurrency(investment.annualInvestment)}` },
    ];
    
    breakdownItems.forEach((item) => {
      doc.setTextColor(80, 80, 90);
      doc.text(item.label, 25, yPos);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 40);
      doc.text(item.value, pageWidth - 25, yPos, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      yPos += 8;
    });
    
    // Investment Details - Per-Workflow Breakdown
    yPos += 5;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 110);
    
    // Show per-workflow calculation
    const perWorkflowRate = investment.setupBreakdown.perWorkflowRate;
    const industryMult = industryMultipliers.find(i => i.id === inputs.industry)?.setupMultiplier || 1;
    doc.text(`Setup: ${formatCurrency(perWorkflowRate)}/workflow × ${inputs.workflowCount} workflows${industryMult !== 1 ? ` × ${industryMult}x industry` : ''} = ${formatCurrency(investment.setupInvestment)} (one-time)`, 25, yPos);
    yPos += 5;
    doc.text(`Monthly Retainer: ${formatCurrency(investment.monthlyRetainer)}/month`, 25, yPos);
    yPos += 5;
    
    // Total Impact
    yPos += 5;
    doc.setDrawColor(200, 200, 210);
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 10;
    
    doc.setFillColor(30, 180, 130);
    doc.roundedRect(20, yPos, pageWidth - 40, 25, 3, 3, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Total Annual Impact', pageWidth / 2, yPos + 8, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(results.netAnnualGain), pageWidth / 2, yPos + 19, { align: 'center' });
    
    // Footer
    yPos = 270;
    doc.setTextColor(120, 120, 130);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('This ROI estimate is based on the inputs provided and industry benchmarks.', pageWidth / 2, yPos, { align: 'center' });
    doc.text('Actual results may vary. Contact alfred ai for a personalized assessment.', pageWidth / 2, yPos + 5, { align: 'center' });
    doc.text(`www.${PRODUCTION_DOMAIN}`, pageWidth / 2, yPos + 12, { align: 'center' });
    
    // Save the PDF
    doc.save('alfred ai-ROI-Report.pdf');
    toast.success('PDF exported successfully!');
  };

  return (
    <>
      <div className="relative glassmorphism-strong rounded-2xl overflow-hidden">
        {/* Floating orbs for visual depth */}
        <FloatingOrb delay={0} size={100} x="10%" y="20%" />
        <FloatingOrb delay={1} size={60} x="80%" y="60%" />
        <FloatingOrb delay={2} size={80} x="60%" y="10%" />
        
        <div className="relative bg-gradient-to-r from-accent via-accent to-primary/10 p-6">
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div 
              className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center overflow-hidden"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <img 
                src={alfredAIcon} 
                alt="alfred ai" 
                className="w-8 h-8 object-contain rounded" 
              />
            </motion.div>
            <div>
              <h3 className="text-xl font-semibold text-accent-foreground">Agentic AI ROI Calculator</h3>
              <p className="text-sm text-accent-foreground/70">Calculate your AI agent workforce value</p>
            </div>
          </motion.div>
          
          {/* Animated line decoration */}
          <motion.div
            className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-primary via-primary/50 to-transparent"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1, delay: 0.3 }}
          />
        </div>

        <div className="p-6 md:p-8">
          <AnimatePresence mode="wait">
            {!showResults ? (
              <motion.div
                key="inputs"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {/* Team Size */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 text-base font-medium">
                      <Users className="w-5 h-5 text-primary" />
                      Team Size
                    </Label>
                    {useCustomTeamSize ? (
                      <Input
                        type="number"
                        value={inputs.teamSize}
                        onChange={(e) => {
                          const val = Math.min(10000, Math.max(0, parseInt(e.target.value) || 0));
                          setInputs(prev => ({ ...prev, teamSize: val }));
                        }}
                        className="w-24 h-10 text-right text-2xl font-semibold"
                        min={0}
                        max={10000}
                      />
                    ) : (
                      <span className="text-2xl font-semibold text-foreground">{inputs.teamSize}</span>
                    )}
                  </div>
                  {!useCustomTeamSize ? (
                    <>
                      <Slider
                        value={[Math.min(inputs.teamSize, 100)]}
                        onValueChange={([value]) => setInputs(prev => ({ ...prev, teamSize: value }))}
                        min={0}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0 people</span>
                        <button 
                          type="button"
                          onClick={() => setUseCustomTeamSize(true)}
                          className="text-primary hover:underline font-medium"
                        >
                          100+ (custom)
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setUseCustomTeamSize(false);
                        if (inputs.teamSize > 100) {
                          setInputs(prev => ({ ...prev, teamSize: 100 }));
                        }
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      ← Back to slider (0-100)
                    </button>
                  )}
                </div>

                {/* Average Salary */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-base font-medium">
                    <DollarSign className="w-5 h-5 text-primary" />
                    Average Annual Salary (AUD)
                  </Label>
                  <Input
                    type="number"
                    value={inputs.averageSalary}
                    onChange={(e) => setInputs(prev => ({ ...prev, averageSalary: Math.max(0, parseInt(e.target.value) || 0) }))}
                    className="text-lg font-medium"
                    min={0}
                    max={500000}
                  />
                </div>

                {/* Admin Hours */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label className="flex items-center gap-2 text-base font-medium">
                        <Clock className="w-5 h-5 text-primary" />
                        Non-Agentic Operation Hours per Person per Week
                      </Label>
                      <TooltipProvider>
                        <ShadcnTooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-4 h-4 text-muted-foreground/60 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="text-xs"><strong>Non-agentic:</strong> Traditional manual work—data entry, scheduling, reporting—done without AI assistance.</p>
                            <p className="text-xs mt-1"><strong>Agentic AI:</strong> Autonomous agents that learn, reason, and execute these tasks intelligently.</p>
                          </TooltipContent>
                        </ShadcnTooltip>
                      </TooltipProvider>
                    </div>
                    <span className="text-2xl font-semibold text-foreground">{inputs.adminHoursPerWeek}h</span>
                  </div>
                  <Slider
                    value={[inputs.adminHoursPerWeek]}
                    onValueChange={([value]) => setInputs(prev => ({ ...prev, adminHoursPerWeek: value }))}
                    min={1}
                    max={40}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1 hour</span>
                    <span>40 hours</span>
                  </div>
                </div>

                {/* Tools Used - Consolidation Focus */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 text-base font-medium">
                      <Zap className="w-5 h-5 text-warning" />
                      How many tools/systems does your team use?
                    </Label>
                    <span className="text-2xl font-semibold text-foreground">{inputs.toolsUsed}</span>
                  </div>
                  <Slider
                    value={[inputs.toolsUsed]}
                    onValueChange={([value]) => setInputs(prev => ({ ...prev, toolsUsed: value }))}
                    min={1}
                    max={20}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1 tool</span>
                    <span>20+ tools</span>
                  </div>
                  
                  {/* Consolidation Benefit Visual */}
                  <motion.div
                    className="mt-3 p-4 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={inputs.toolsUsed}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Tool Icons Visualization */}
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <div className="flex flex-wrap justify-center gap-1.5 max-w-[180px]">
                        {Array.from({ length: Math.min(inputs.toolsUsed, 12) }).map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 0.6, scale: 1 }}
                            transition={{ delay: i * 0.03 }}
                            className="w-6 h-6 rounded bg-destructive/30 border border-destructive/50 flex items-center justify-center"
                          >
                            <span className="text-[10px] text-destructive">📦</span>
                          </motion.div>
                        ))}
                        {inputs.toolsUsed > 12 && (
                          <span className="text-xs text-muted-foreground">+{inputs.toolsUsed - 12}</span>
                        )}
                      </div>
                      
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ArrowRight className="w-6 h-6 text-primary" />
                      </motion.div>
                      
                      {/* alfred ai Logo */}
                      <motion.div
                        className="w-14 h-14 rounded-xl bg-background border-2 border-primary flex items-center justify-center overflow-hidden p-1"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <img src={alfredLogo} alt="alfred ai" className="w-full h-full object-contain" loading="lazy" decoding="async" />
                      </motion.div>
                    </div>
                    
                    {/* Consolidation Message */}
                    <div className="text-center space-y-2">
                      <div className="text-lg font-bold text-foreground">
                        {inputs.toolsUsed} tools → <span className="text-primary">1 alfred ai</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {inputs.toolsUsed <= 3 
                          ? "You're already streamlined. alfred ai adds AI-powered automation on top."
                          : inputs.toolsUsed <= 6 
                            ? `Consolidate ${inputs.toolsUsed} tools into one unified workflow. Less switching, more doing.`
                            : inputs.toolsUsed <= 10
                              ? `Your team switches between ${inputs.toolsUsed} systems daily. That's ~${Math.round(inputs.toolsUsed * 8)} context switches per day.`
                              : `${inputs.toolsUsed} tools = significant overhead. alfred ai replaces the majority with one intelligent platform.`}
                      </p>
                      
                      {/* Cost Explanation */}
                      <div className="text-xs text-muted-foreground bg-background/50 rounded-lg px-3 py-2 inline-block">
                        <span className="text-foreground font-medium">Avg. SaaS cost:</span> $25/month per tool per team member
                      </div>
                      
                      {/* Savings Preview */}
                      {inputs.toolsUsed >= 4 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-3 pt-3 border-t border-primary/20"
                        >
                          <div className="flex items-center justify-center gap-4 text-sm flex-wrap">
                            <div>
                              <span className="text-muted-foreground">Tools replaced: </span>
                              <span className="font-semibold text-primary">~{Math.floor(inputs.toolsUsed * 0.6)}</span>
                            </div>
                            <div className="w-px h-4 bg-border hidden sm:block" />
                            <div>
                              <span className="text-muted-foreground">Est. license savings: </span>
                              <span className="font-semibold text-primary">
                                {formatCurrency(Math.floor(inputs.toolsUsed * 0.6) * 25 * inputs.teamSize * 12)}/yr
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* Industry Selection */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Building2 className="w-4 h-4 text-primary" />
                    Industry
                  </Label>
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

                {/* AI Agent Deployments */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 text-base font-medium">
                      <Layers className="w-5 h-5 text-primary" />
                      AI Agent Deployments
                    </Label>
                    <span className="text-2xl font-semibold text-foreground">{inputs.workflowCount}</span>
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
                  
                  {/* Derived Complexity & Setup Preview */}
                  <motion.div
                    className="p-4 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={inputs.workflowCount}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          derivedComplexity.id === "simple" && "bg-green-500/20 text-green-400",
                          derivedComplexity.id === "standard" && "bg-blue-500/20 text-blue-400",
                          derivedComplexity.id === "advanced" && "bg-amber-500/20 text-amber-400",
                          derivedComplexity.id === "complex" && "bg-purple-500/20 text-purple-400"
                        )}>
                          {derivedComplexity.name}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {derivedComplexity.workflowRange}
                        </span>
                      </div>
                    </div>
                    
                    {/* Setup Calculation Preview */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Setup per AI agent:</span>
                        <span className="font-medium text-foreground">
                          {formatCurrency(investment.setupBreakdown.perWorkflowRate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground bg-background/50 rounded-lg p-3">
                        <span>{formatCurrency(investment.setupBreakdown.perWorkflowRate)}</span>
                        <span className="text-muted-foreground">×</span>
                        <span>{inputs.workflowCount} agents</span>
                        {investment.industry.setupMultiplier !== 1 && (
                          <>
                            <span className="text-muted-foreground">×</span>
                            <span className="text-amber-400">{investment.industry.setupMultiplier}x</span>
                          </>
                        )}
                        <span className="text-muted-foreground">=</span>
                        <span className="text-primary font-bold">
                          {formatCurrency(investment.setupInvestment)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground text-center">
                        {investment.tier.name} tier • {investment.industry.name}
                      </div>
                    </div>
                  </motion.div>
                </div>

                <Button
                  onClick={handleCalculate}
                  className="w-full bg-primary hover:bg-primary-hover text-primary-foreground font-semibold py-6 text-lg"
                >
                  Calculate My ROI
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-background-alt rounded-xl p-5 text-center"
                  >
                    <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                      <AnimatedNumber value={results.agentAutonomyPercent} suffix="%" duration={1500} />
                    </div>
                    <div className="text-sm text-muted-foreground">AI Agent Autonomy</div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-background-alt rounded-xl p-5 text-center"
                  >
                    <div className="text-3xl md:text-4xl font-bold text-secondary mb-1">
                      <AnimatedNumber value={results.timeSavedWeekly} suffix="h" duration={1500} />
                    </div>
                    <div className="text-sm text-muted-foreground">Hours Saved/Week</div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-background-alt rounded-xl p-5 text-center"
                  >
                    <div className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                      <AnimatedNumber value={results.costSaved} prefix="$" duration={1800} />
                    </div>
                    <div className="text-sm text-muted-foreground">Yearly Cost Saved</div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-background-alt rounded-xl p-5 text-center"
                  >
                    <div className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                      {results.breakEvenMonths > 0 ? (
                        <AnimatedNumber value={results.breakEvenMonths} duration={1200} />
                      ) : '—'}
                    </div>
                    <div className="text-sm text-muted-foreground">Months to Break-even</div>
                  </motion.div>
                </div>

                {/* Transparent Investment Breakdown */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.42 }}
                  className="p-5 rounded-xl border border-primary/30 bg-primary/5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-primary" />
                      <span className="font-semibold text-foreground">Estimated alfred ai Investment</span>
                    </div>
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(investment.annualRange.min)} – {formatCurrency(investment.annualRange.max)}/yr
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="p-3 rounded-lg bg-background/50">
                      <p className="text-xs text-muted-foreground mb-1">Setup Investment</p>
                      <p className="text-base font-bold text-foreground">
                        {formatCurrency(investment.setupRange.min)} – {formatCurrency(investment.setupRange.max)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">One-time</p>
                    </div>
                    <div className="p-3 rounded-lg bg-background/50">
                      <p className="text-xs text-muted-foreground mb-1">Monthly Retainer</p>
                      <p className="text-base font-bold text-foreground">
                        {formatCurrency(investment.monthlyRange.min)} – {formatCurrency(investment.monthlyRange.max)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Per month</p>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-primary/20">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Pricing based on:</span>{' '}
                      {investment.tier.name} tier ({investment.tier.description}) • {investment.industry.name} • {investment.complexity.name} complexity
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">
                      ⚠️ This is an estimate only. For a precise quote tailored to your needs, please book a meeting with our team.
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="bg-card border border-border rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      Revenue per Employee per Hour
                    </Label>
                    <span className="text-lg font-semibold text-foreground">{inputs.revenueMultiplier.toFixed(1)}x salary</span>
                  </div>
                  <Slider
                    value={[inputs.revenueMultiplier * 10]}
                    onValueChange={([value]) => setInputs(prev => ({ ...prev, revenueMultiplier: value / 10 }))}
                    min={10}
                    max={50}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>1.0x</span>
                    <span>5.0x</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Adjust based on your industry. Default 2.8x is typical for service businesses.
                  </p>
                </motion.div>

                {/* Explanation */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.48 }}
                  className="bg-secondary/10 border border-secondary/20 rounded-xl p-4"
                >
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">How Agentic AI works:</span> With {inputs.toolsUsed} tools in your stack, alfred ai agents achieve {results.agentAutonomyPercent}% autonomy through intelligent orchestration. The {formatNumber(results.timeSavedWeekly)} hours saved weekly can be redirected to revenue-generating tasks, and your AI workforce gets smarter every quarter.
                  </p>
                  {results.toolConsolidationSavings > 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      <span className="font-medium text-foreground">Tool consolidation:</span> By replacing ~{results.toolsReplaced} fragmented tools, you save an additional {formatCurrency(results.toolConsolidationSavings)}/year in licensing costs.
                    </p>
                  )}
                </motion.div>

                {/* Impact Breakdown Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-card border border-border rounded-xl p-6"
                >
                  <h4 className="text-sm font-medium text-foreground mb-4 text-center">Impact Breakdown</h4>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Cost Savings", value: results.costSaved, color: "hsl(var(--primary))" },
                            { name: "Revenue from Reallocated Time", value: results.revenueIncrease, color: "hsl(var(--secondary))" },
                            ...(results.toolConsolidationSavings > 0 ? [{ name: "Tool Consolidation", value: results.toolConsolidationSavings, color: "hsl(var(--warning))" }] : []),
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          <Cell fill="hsl(var(--primary))" />
                          <Cell fill="hsl(var(--secondary))" />
                          {results.toolConsolidationSavings > 0 && <Cell fill="hsl(var(--warning))" />}
                        </Pie>
                        <RechartsTooltip
                          formatter={(value: number) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(value)}
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            color: "hsl(var(--foreground))",
                          }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className={`grid gap-4 mt-4 pt-4 border-t border-border ${results.toolConsolidationSavings > 0 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    <div className="text-center">
                      <div className="text-lg font-bold text-primary">{formatCurrency(results.costSaved)}</div>
                      <div className="text-xs text-muted-foreground">Cost Savings</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-secondary">{formatCurrency(results.revenueIncrease)}</div>
                      <div className="text-xs text-muted-foreground">Revenue Potential</div>
                    </div>
                    {results.toolConsolidationSavings > 0 && (
                      <div className="text-center">
                        <div className="text-lg font-bold text-warning">{formatCurrency(results.toolConsolidationSavings)}</div>
                        <div className="text-xs text-muted-foreground">Tool Savings</div>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Total Impact */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.55 }}
                  className="bg-primary/10 border border-primary/20 rounded-xl p-6 text-center"
                >
                  <div className="text-sm font-medium text-primary mb-2">Year 1 Net Gain</div>
                  <div className={cn(
                    "text-4xl md:text-5xl font-bold",
                    results.netAnnualGain > 0 ? "text-emerald-600" : "text-amber-600"
                  )}>
                    {formatCurrency(results.netAnnualGain)}
                  </div>
                  {results.roiPercent > 0 && (
                    <div className="text-sm text-emerald-600 mt-1">{results.roiPercent}% ROI</div>
                  )}
                </motion.div>

                {/* Before/After Comparison */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
                    <div className="text-xs font-medium text-destructive mb-2">Before alfred ai</div>
                    <div className="text-base sm:text-lg font-semibold text-foreground break-words">
                      {inputs.adminHoursPerWeek}h non-agentic/person/week
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      {formatCurrency(inputs.averageSalary * inputs.teamSize * (inputs.adminHoursPerWeek / 40))} lost annually
                    </div>
                  </div>
                  <div className="bg-success/10 border border-success/20 rounded-xl p-4">
                    <div className="text-xs font-medium text-secondary mb-2">After alfred ai</div>
                    <div className="text-base sm:text-lg font-semibold text-foreground break-words">
                      {Math.round(inputs.adminHoursPerWeek * 0.3)}h non-agentic/person/week
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      {formatNumber(results.timeSavedHours)} hours freed annually
                    </div>
                  </div>
                </motion.div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => setIsCalendlyOpen(true)}
                    className="flex-1 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold py-6"
                  >
                    Book an Impact Conversation
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Recalculate
                  </Button>
                </div>

                {/* Share/Export */}
                <div className="flex justify-center gap-4 pt-4 border-t border-border">
                  <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Share2 className="w-4 h-4" />
                    Share Results
                  </button>
                  <button 
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <FileDown className="w-4 h-4" />
                    Export PDF
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <BookingChatModal isOpen={isCalendlyOpen} onClose={() => setIsCalendlyOpen(false)} />
    </>
  );
};

export default ROICalculator;
