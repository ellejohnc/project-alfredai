import { useState, useMemo } from "react";
import { PRODUCTION_URL } from "@/lib/siteConfig";
import { motion } from "framer-motion";
import { SafeAnimatePresence } from "@/components/ui/safe-animate-presence";
import { 
  Calculator, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Users, 
  AlertTriangle,
  Zap,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  FileText,
  Mail,
  Headphones,
  FolderKanban,
  CheckCircle2,
  Download,
  Calendar,
  Sparkles,
  RotateCcw,
  HelpCircle,
  Briefcase,
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import BookingChatModal from "@/components/BookingChatModal";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend
} from "recharts";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileTCOCalculator from "./MobileTCOCalculator";

const workflowOptions = [
  { id: "lead", label: "Lead intake & follow up", icon: Users, avgHours: 0.5, defaultVolume: 120, volumeLabel: "Leads per Month", hoursLabel: "Avg Hours per Lead (Admin)", defaultErrorRate: 12, defaultReworkHours: 0.5, defaultMissed: 5, defaultValue: 2000, missedLabel: "Missed Leads/Month (Slow Response)", valueLabel: "Value per Lead (Gross Profit)" },
  { id: "proposal", label: "Proposal/quote generation", icon: FileText, avgHours: 1, defaultVolume: 60, volumeLabel: "Proposals/Quotes per Month", hoursLabel: "Avg Hours per Proposal (Admin)", defaultErrorRate: 15, defaultReworkHours: 1, defaultMissed: 3, defaultValue: 5000, missedLabel: "Lost Proposals/Month (Errors/Delays)", valueLabel: "Value per Proposal (Gross Profit)" },
  { id: "document", label: "Document generation", icon: FolderKanban, avgHours: 0.5, defaultVolume: 80, volumeLabel: "Documents per Month", hoursLabel: "Avg Hours per Document (Admin)", defaultErrorRate: 10, defaultReworkHours: 0.5, defaultMissed: 2, defaultValue: 1500, missedLabel: "Failed Documents/Month (Rework)", valueLabel: "Cost per Document Error" },
  { id: "support", label: "Customer support & FAQ", icon: Headphones, avgHours: 0.25, defaultVolume: 200, volumeLabel: "Support Tickets per Month", hoursLabel: "Avg Hours per Ticket (Admin)", defaultErrorRate: 8, defaultReworkHours: 0.25, defaultMissed: 10, defaultValue: 500, missedLabel: "Unresolved Tickets/Month", valueLabel: "Cost per Unresolved Ticket" },
  { id: "project", label: "Project updates / coordination", icon: Mail, avgHours: 0.5, defaultVolume: 100, volumeLabel: "Project Updates per Month", hoursLabel: "Avg Hours per Update (Admin)", defaultErrorRate: 10, defaultReworkHours: 0.5, defaultMissed: 4, defaultValue: 1000, missedLabel: "Delayed Updates/Month", valueLabel: "Cost per Delayed Update" },
];

const alfredPlans = [
  { id: "startup", name: "Startup", setup: 5000, monthly: 250, description: "0 to 10 Staff", showAvg: false, minStaff: 0, maxStaff: 10 },
  { id: "sme", name: "SME", setup: 7500, monthly: 500, description: "11 to 50 Staff", showAvg: true, minStaff: 11, maxStaff: 50 },
  { id: "established", name: "Established Business", setup: 12000, monthly: 1000, description: "51 to 250 Staff", showAvg: true, minStaff: 51, maxStaff: 250 },
  { id: "enterprise", name: "Enterprise", setup: 25000, monthly: 3500, description: "251 to 500+ Staff", showAvg: true, minStaff: 251, maxStaff: Infinity },
];

const addOns = [
  { id: "private-cloud", name: "Private Cloud", monthlyCost: 0, setupCost: 20000, isSetupOnly: true },
  { id: "white-label", name: "White-label Setup", monthlyCost: 0, setupCost: 5000, isSetupOnly: true },
  { id: "custom-dev", name: "Custom Development", monthlyCost: 0, setupCost: 0, isContactUs: true },
  { id: "voice-agent", name: "High Volume Voice Agent", monthlyCost: 99, setupCost: 2500, description: "$0.18-$0.40/min, monthly $99-$3,500" },
];

interface Inputs {
  adminHourlyCost: number;
  adminStaffCount: number;
  serviceDeliveryStaffCount: number;
  financeStaffCount: number;
  hoursPerWeek: number;
  workflow: string;
  jobsPerMonth: number;
  hoursPerJob: number;
  errorRate: number;
  reworkHours: number;
  missedLeads: number;
  valuePerLead: number;
  selectedPlan: string;
  selectedAddOns: string[];
}

const defaultInputs: Inputs = {
  adminHourlyCost: 45,
  adminStaffCount: 2,
  serviceDeliveryStaffCount: 3,
  financeStaffCount: 1,
  hoursPerWeek: 12,
  workflow: "lead",
  jobsPerMonth: 120,
  hoursPerJob: 0.5,
  errorRate: 10,
  reworkHours: 0.25,
  missedLeads: 3,
  valuePerLead: 2000,
  selectedPlan: "startup",
  selectedAddOns: [],
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(value);
};

export default function CostComparisonSection() {
  const isMobile = useIsMobile();
  const [step, setStep] = useState(1);
  const [inputs, setInputs] = useState<Inputs>(defaultInputs);
  const [showResults, setShowResults] = useState(false);
  const [isCalendlyOpen, setIsCalendlyOpen] = useState(false);
  const [addOnsExpanded, setAddOnsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<"monthly" | "annual">("annual");
  
  // Custom input mode states
  const [useCustomHourlyCost, setUseCustomHourlyCost] = useState(false);
  const [useCustomAdminStaff, setUseCustomAdminStaff] = useState(false);
  const [useCustomServiceStaff, setUseCustomServiceStaff] = useState(false);
  const [useCustomFinanceStaff, setUseCustomFinanceStaff] = useState(false);
  
  // Track if user has interacted with Step 1 inputs
  const [hasInteractedStep1, setHasInteractedStep1] = useState(false);

  // Calculate estimated total team size using admin ratio (1 admin per 10 staff)
  const totalStaffCount = inputs.adminStaffCount + inputs.serviceDeliveryStaffCount + inputs.financeStaffCount;
  const estimatedTeamSize = totalStaffCount * 10;
  
  const recommendedPlanId = useMemo(() => {
    const plan = alfredPlans.find(p => estimatedTeamSize >= p.minStaff && estimatedTeamSize <= p.maxStaff);
    return plan?.id || "sme";
  }, [estimatedTeamSize]);

  // Agentic AI Impact Rates - realistic savings percentages
  const AUTOMATION_RATES = {
    labourAutomation: 0.70,      // 70% AI Agent Autonomy Rate
    errorReduction: 0.80,        // 80% reduction in errors through AI decision-making
    opportunityRecovery: 0.60,   // 60% of missed opportunities recovered via adaptive AI
  };

  const results = useMemo(() => {
    // Labour cost per month (admin tasks across all staff types)
    const adminLabourCost = inputs.adminHourlyCost * inputs.hoursPerWeek * 4.33 * inputs.adminStaffCount;
    // Service delivery staff spend ~40% of admin hours on automatable coordination
    const serviceDeliveryLabourCost = inputs.adminHourlyCost * (inputs.hoursPerWeek * 0.4) * 4.33 * inputs.serviceDeliveryStaffCount;
    // Finance staff spend ~60% of admin hours on automatable tasks
    const financeLabourCost = inputs.adminHourlyCost * (inputs.hoursPerWeek * 0.6) * 4.33 * inputs.financeStaffCount;
    
    const labourCostMonthly = adminLabourCost + serviceDeliveryLabourCost + financeLabourCost;
    
    // Rework cost per month (human errors)
    const reworkCostMonthly = inputs.jobsPerMonth * (inputs.errorRate / 100) * inputs.reworkHours * inputs.adminHourlyCost;
    
    // Lost opportunity per month (wasted opportunities from slow response)
    const opportunityCostMonthly = inputs.missedLeads * inputs.valuePerLead;
    
    // Total current monthly cost (what you're losing now)
    const currentMonthlyCost = labourCostMonthly + reworkCostMonthly + opportunityCostMonthly;
    
    // Calculate ACTUAL savings from automation (not 100% elimination)
    const timeSavingsMonthly = labourCostMonthly * AUTOMATION_RATES.labourAutomation;
    const reworkSavingsMonthly = reworkCostMonthly * AUTOMATION_RATES.errorReduction;
    const opportunitySavingsMonthly = opportunityCostMonthly * AUTOMATION_RATES.opportunityRecovery;
    
    // Total recoverable value per month
    const totalSavingsMonthly = timeSavingsMonthly + reworkSavingsMonthly + opportunitySavingsMonthly;
    
    // Alfred costs
    const selectedPlan = alfredPlans.find(p => p.id === inputs.selectedPlan) || alfredPlans[1];
    const addOnsMonthlyCost = inputs.selectedAddOns.reduce((sum, id) => {
      const addon = addOns.find(a => a.id === id);
      return sum + (addon?.monthlyCost || 0);
    }, 0);
    const addOnsSetupCost = inputs.selectedAddOns.reduce((sum, id) => {
      const addon = addOns.find(a => a.id === id);
      return sum + (addon?.setupCost || 0);
    }, 0);
    
    const alfredMonthlyCost = selectedPlan.monthly + addOnsMonthlyCost;
    const implementationCost = selectedPlan.setup + addOnsSetupCost;
    
    // Net Monthly Gain = What you save - What you pay
    const netMonthlyGain = totalSavingsMonthly - alfredMonthlyCost;
    
    // Break-even: months until cumulative savings exceed setup investment
    // Formula: totalSavingsMonthly * N > implementationCost + alfredMonthlyCost * N
    // Solving: N > implementationCost / (totalSavingsMonthly - alfredMonthlyCost)
    const breakEvenMonths = netMonthlyGain > 0 ? Math.ceil(implementationCost / netMonthlyGain) : 0;
    
    // Calculate what percentage of first year cost is setup
    const firstYearTotalCost = implementationCost + (alfredMonthlyCost * 12);
    const setupPercentage = Math.round((implementationCost / firstYearTotalCost) * 100);
    
    // Projections using actual recoverable savings
    const projections = [12, 24, 36].map(months => {
      const grossSavings = totalSavingsMonthly * months;
      const totalAlfredCost = implementationCost + (alfredMonthlyCost * months);
      const netSavings = grossSavings - totalAlfredCost;
      // Keep totalCurrentCost for display purposes
      const totalCurrentCost = currentMonthlyCost * months;
      return { months, totalCurrentCost, totalAlfredCost, netSavings, grossSavings };
    });
    
    // Chart data for cumulative comparison (using actual savings)
    const chartData = Array.from({ length: 37 }, (_, i) => {
      const month = i;
      const cumulativeSavings = totalSavingsMonthly * month;
      const alfredCumulative = implementationCost + (alfredMonthlyCost * month);
      return {
        month,
        "Recoverable Savings": Math.round(cumulativeSavings),
        "alfred ai Investment": Math.round(alfredCumulative),
        "Net Savings": Math.round(cumulativeSavings - alfredCumulative),
      };
    });
    
    // Agentic AI value breakdown for pie/bar chart (annual values)
    const savingsBreakdown = [
      { name: "AI Agent Efficiency (70%)", value: Math.round(timeSavingsMonthly * 12), fill: "hsl(var(--primary))" },
      { name: "Decision Quality (80%)", value: Math.round(reworkSavingsMonthly * 12), fill: "hsl(var(--chart-2))" },
      { name: "Recovered Opportunities (60%)", value: Math.round(opportunitySavingsMonthly * 12), fill: "hsl(var(--chart-3))" },
    ];

    return {
      labourCostMonthly,
      reworkCostMonthly,
      opportunityCostMonthly,
      currentMonthlyCost,
      timeSavingsMonthly,
      reworkSavingsMonthly,
      opportunitySavingsMonthly,
      totalSavingsMonthly,
      alfredMonthlyCost,
      implementationCost,
      netMonthlyGain,
      breakEvenMonths,
      firstYearTotalCost,
      setupPercentage,
      projections,
      chartData,
      savingsBreakdown,
    };
  }, [inputs]);

  // Render simplified mobile version - AFTER all hooks
  if (isMobile) {
    return <MobileTCOCalculator />;
  }

  const handleCalculate = () => {
    setShowResults(true);
  };

  const handleReset = () => {
    setInputs(defaultInputs);
    setStep(1);
    setShowResults(false);
    setUseCustomHourlyCost(false);
    setUseCustomAdminStaff(false);
    setUseCustomServiceStaff(false);
    setUseCustomFinanceStaff(false);
    setHasInteractedStep1(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFillColor(20, 20, 30);
    doc.rect(0, 0, pageWidth, 50, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Total Cost of Ownership Report", pageWidth / 2, 25, { align: "center" });
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("alfred ai - Your Business Automation Partner", pageWidth / 2, 35, { align: "center" });
    doc.text(`Generated: ${new Date().toLocaleDateString("en-AU")}`, pageWidth / 2, 43, { align: "center" });
    
    // Key Results
    let yPos = 65;
    doc.setTextColor(30, 30, 40);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Key Results", 20, yPos);
    
    yPos += 12;
    const keyMetrics = [
      { label: "Current Monthly Admin Cost", value: formatCurrency(results.currentMonthlyCost) },
      { label: "alfred ai Monthly Investment", value: formatCurrency(results.alfredMonthlyCost) },
      { label: "Net Monthly Gain", value: formatCurrency(results.netMonthlyGain) },
      { label: "Break-Even Month", value: `Month ${results.breakEvenMonths}` },
    ];
    
    keyMetrics.forEach((metric) => {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 90);
      doc.text(metric.label, 25, yPos);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 40);
      doc.text(metric.value, pageWidth - 25, yPos, { align: "right" });
      yPos += 8;
    });
    
    // Projections
    yPos += 10;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 40);
    doc.text("Projected Savings", 20, yPos);
    
    yPos += 12;
    results.projections.forEach((proj) => {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 90);
      doc.text(`${proj.months} Months Net Impact`, 25, yPos);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 180, 130);
      doc.text(formatCurrency(proj.netSavings), pageWidth - 25, yPos, { align: "right" });
      yPos += 8;
    });
    
    // Footer
    doc.setTextColor(120, 120, 130);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Estimates based on provided inputs. Contact alfred ai for personalized assessment.", pageWidth / 2, 280, { align: "center" });
    doc.text(PRODUCTION_URL.replace('https://', 'www.').replace('new.', ''), pageWidth / 2, 287, { align: "center" });
    
    doc.save("alfred ai-TCO-Report.pdf");
    toast.success("PDF exported successfully!");
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1, 2, 3, 4].map((s) => (
        <button
          key={s}
          onClick={() => setStep(s)}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all",
            step === s
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
              : step > s
              ? "bg-primary/20 text-primary"
              : "bg-muted text-muted-foreground"
          )}
        >
          {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
        </button>
      ))}
    </div>
  );

  return (
    <section className="py-24 md:py-32 bg-gradient-to-b from-background via-muted/20 to-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container-wide relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-pink-500/10 border border-primary/20 mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Calculator className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Agentic AI ROI Calculator</span>
          </motion.div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-5 tracking-tight">
            What's Non-agentic Workforce{" "}
            <span className="bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
              Really Costing You?
            </span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Calculate your AI agent workforce value in 60 seconds. Unlike traditional automation, alfred ai agents learn, reason, and adapt.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-6xl mx-auto"
        >
          <SafeAnimatePresence mode="wait">
            {!showResults ? (
              <motion.div
                key="calculator"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid lg:grid-cols-5 gap-8"
              >
                {/* Left: Inputs */}
                <div className="lg:col-span-3 bg-card rounded-3xl border border-border p-6 md:p-8 shadow-xl flex flex-col min-h-[600px]">
                  <StepIndicator />

                  <div className="flex-1">
                  <SafeAnimatePresence mode="wait">
                    {/* Step 1: Your Team */}
                    {step === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">Your Team</h3>
                            <p className="text-sm text-muted-foreground">Tell us about your admin workforce</p>
                          </div>
                        </div>

                        {/* Admin Staff Hourly Cost */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Admin Staff Hourly Cost</Label>
                            {useCustomHourlyCost ? (
                              <div className="flex items-center gap-1">
                                <span className="text-xl font-bold text-primary">$</span>
                                <Input
                                  type="number"
                                  value={inputs.adminHourlyCost}
                                  onChange={(e) => {
                                    setHasInteractedStep1(true);
                                    const val = Math.min(1000, Math.max(0, parseInt(e.target.value) || 0));
                                    setInputs(prev => ({ ...prev, adminHourlyCost: val }));
                                  }}
                                  className="w-20 h-8 text-right text-xl font-bold text-primary"
                                  min={0}
                                  max={1000}
                                />
                                <span className="text-xl font-bold text-primary">/hr</span>
                              </div>
                            ) : (
                              <span className="text-xl font-bold text-primary">${inputs.adminHourlyCost}/hr</span>
                            )}
                          </div>
                          {!useCustomHourlyCost ? (
                            <>
                              <Slider
                                value={[Math.min(inputs.adminHourlyCost, 100)]}
                              onValueChange={([v]) => {
                                  setHasInteractedStep1(true);
                                  setInputs(prev => ({ ...prev, adminHourlyCost: v }));
                                }}
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

                        {/* Admin/Ops Staff */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Label className="text-sm font-medium">Number of Admin/Ops Staff</Label>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p>Office managers, executive assistants, operations coordinators, and admin support who handle scheduling, data entry, and general coordination.</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            {useCustomAdminStaff ? (
                              <Input
                                type="number"
                                value={inputs.adminStaffCount}
                                onChange={(e) => {
                                  setHasInteractedStep1(true);
                                  const val = Math.min(10000, Math.max(0, parseInt(e.target.value) || 0));
                                  setInputs(prev => ({ ...prev, adminStaffCount: val }));
                                }}
                                className="w-20 h-8 text-right text-xl font-bold text-primary"
                                min={0}
                                max={10000}
                              />
                            ) : (
                              <span className="text-xl font-bold text-primary">{inputs.adminStaffCount}</span>
                            )}
                          </div>
                          {!useCustomAdminStaff ? (
                            <>
                              <Slider
                                value={[Math.min(inputs.adminStaffCount, 100)]}
                              onValueChange={([v]) => {
                                  setHasInteractedStep1(true);
                                  setInputs(prev => ({ ...prev, adminStaffCount: v }));
                                }}
                                min={0}
                                max={100}
                                step={1}
                              />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>0</span>
                                <button 
                                  type="button"
                                  onClick={() => setUseCustomAdminStaff(true)}
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
                                setUseCustomAdminStaff(false);
                                if (inputs.adminStaffCount > 100) {
                                  setInputs(prev => ({ ...prev, adminStaffCount: 100 }));
                                }
                              }}
                              className="text-xs text-primary hover:underline"
                            >
                              ← Back to slider (0-100)
                            </button>
                          )}
                        </div>

                        {/* Service Delivery Staff */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Label className="text-sm font-medium">Number of Service Delivery Staff</Label>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p>Project managers, engineers, consultants, and technicians who spend time on client work but also handle coordination, status updates, and documentation.</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            {useCustomServiceStaff ? (
                              <Input
                                type="number"
                                value={inputs.serviceDeliveryStaffCount}
                                onChange={(e) => {
                                  setHasInteractedStep1(true);
                                  const val = Math.min(10000, Math.max(0, parseInt(e.target.value) || 0));
                                  setInputs(prev => ({ ...prev, serviceDeliveryStaffCount: val }));
                                }}
                                className="w-20 h-8 text-right text-xl font-bold text-primary"
                                min={0}
                                max={10000}
                              />
                            ) : (
                              <span className="text-xl font-bold text-primary">{inputs.serviceDeliveryStaffCount}</span>
                            )}
                          </div>
                          {!useCustomServiceStaff ? (
                            <>
                              <Slider
                                value={[Math.min(inputs.serviceDeliveryStaffCount, 100)]}
                              onValueChange={([v]) => {
                                  setHasInteractedStep1(true);
                                  setInputs(prev => ({ ...prev, serviceDeliveryStaffCount: v }));
                                }}
                                min={0}
                                max={100}
                                step={1}
                              />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>0</span>
                                <button 
                                  type="button"
                                  onClick={() => setUseCustomServiceStaff(true)}
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
                                setUseCustomServiceStaff(false);
                                if (inputs.serviceDeliveryStaffCount > 100) {
                                  setInputs(prev => ({ ...prev, serviceDeliveryStaffCount: 100 }));
                                }
                              }}
                              className="text-xs text-primary hover:underline"
                            >
                              ← Back to slider (0-100)
                            </button>
                          )}
                        </div>

                        {/* Finance Staff */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Label className="text-sm font-medium">Number of Finance Staff</Label>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p>Accountants, bookkeepers, payroll staff, and accounts receivable/payable who handle invoicing, reconciliation, and financial reporting tasks.</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            {useCustomFinanceStaff ? (
                              <Input
                                type="number"
                                value={inputs.financeStaffCount}
                                onChange={(e) => {
                                  setHasInteractedStep1(true);
                                  const val = Math.min(10000, Math.max(0, parseInt(e.target.value) || 0));
                                  setInputs(prev => ({ ...prev, financeStaffCount: val }));
                                }}
                                className="w-20 h-8 text-right text-xl font-bold text-primary"
                                min={0}
                                max={10000}
                              />
                            ) : (
                              <span className="text-xl font-bold text-primary">{inputs.financeStaffCount}</span>
                            )}
                          </div>
                          {!useCustomFinanceStaff ? (
                            <>
                              <Slider
                                value={[Math.min(inputs.financeStaffCount, 100)]}
                              onValueChange={([v]) => {
                                  setHasInteractedStep1(true);
                                  setInputs(prev => ({ ...prev, financeStaffCount: v }));
                                }}
                                min={0}
                                max={100}
                                step={1}
                              />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>0</span>
                                <button 
                                  type="button"
                                  onClick={() => setUseCustomFinanceStaff(true)}
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
                                setUseCustomFinanceStaff(false);
                                if (inputs.financeStaffCount > 100) {
                                  setInputs(prev => ({ ...prev, financeStaffCount: 100 }));
                                }
                              }}
                              className="text-xs text-primary hover:underline"
                            >
                              ← Back to slider (0-100)
                            </button>
                          )}
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Hours on Automatable Tasks per staff per week</Label>
                            <span className="text-xl font-bold text-primary">{inputs.hoursPerWeek}h</span>
                          </div>
                          <Slider
                            value={[inputs.hoursPerWeek]}
                            onValueChange={([v]) => {
                              setHasInteractedStep1(true);
                              setInputs(prev => ({ ...prev, hoursPerWeek: v }));
                            }}
                            min={5}
                            max={40}
                            step={1}
                          />
                        </div>
                      </motion.div>
                    )}

                    {/* Step 2: Your Volume */}
                    {step === 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <FolderKanban className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">Your Volume</h3>
                            <p className="text-sm text-muted-foreground">What does your workflow look like?</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Primary Workflow</Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {workflowOptions.map((option) => {
                              const Icon = option.icon;
                              return (
                                <button
                                  key={option.id}
                                  onClick={() => setInputs(prev => ({ ...prev, workflow: option.id, hoursPerJob: option.avgHours, jobsPerMonth: option.defaultVolume, errorRate: option.defaultErrorRate, reworkHours: option.defaultReworkHours, missedLeads: option.defaultMissed, valuePerLead: option.defaultValue }))}
                                  className={cn(
                                    "p-4 rounded-xl border-2 text-left transition-all",
                                    inputs.workflow === option.id
                                      ? "border-primary bg-primary/5"
                                      : "border-border hover:border-primary/50"
                                  )}
                                >
                                  <Icon className={cn(
                                    "w-5 h-5 mb-2",
                                    inputs.workflow === option.id ? "text-primary" : "text-muted-foreground"
                                  )} />
                                  <span className="text-sm font-medium">{option.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">
                              {workflowOptions.find(w => w.id === inputs.workflow)?.volumeLabel || "Jobs/Leads per Month"}
                            </Label>
                            <span className="text-xl font-bold text-primary">{inputs.jobsPerMonth}</span>
                          </div>
                          <Slider
                            value={[inputs.jobsPerMonth]}
                            onValueChange={([v]) => setInputs(prev => ({ ...prev, jobsPerMonth: v }))}
                            min={10}
                            max={500}
                            step={10}
                          />
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">
                              {workflowOptions.find(w => w.id === inputs.workflow)?.hoursLabel || "Avg Hours per Job (Admin)"}
                            </Label>
                            <span className="text-xl font-bold text-primary">{inputs.hoursPerJob} hrs</span>
                          </div>
                          <Slider
                            value={[inputs.hoursPerJob]}
                            onValueChange={([v]) => setInputs(prev => ({ ...prev, hoursPerJob: v }))}
                            min={0.25}
                            max={4}
                            step={0.25}
                          />
                        </div>
                      </motion.div>
                    )}

                    {/* Step 3: Your Leakage */}
                    {step === 3 && (
                      <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">Your Leakage</h3>
                            <p className="text-sm text-muted-foreground">Where's the hidden cost?</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Error/Rework Rate</Label>
                            <span className="text-xl font-bold text-destructive">{inputs.errorRate}%</span>
                          </div>
                          <Slider
                            value={[inputs.errorRate]}
                            onValueChange={([v]) => setInputs(prev => ({ ...prev, errorRate: v }))}
                            min={0}
                            max={30}
                            step={1}
                          />
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Hours Wasted per Error</Label>
                            <span className="text-xl font-bold text-foreground">{inputs.reworkHours} hrs</span>
                          </div>
                          <Slider
                            value={[inputs.reworkHours]}
                            onValueChange={([v]) => setInputs(prev => ({ ...prev, reworkHours: v }))}
                            min={0.25}
                            max={4}
                            step={0.25}
                          />
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">
                              {workflowOptions.find(w => w.id === inputs.workflow)?.missedLabel || "Missed Leads/Month (Slow Response)"}
                            </Label>
                            <span className="text-xl font-bold text-foreground">{inputs.missedLeads}</span>
                          </div>
                          <Slider
                            value={[inputs.missedLeads]}
                            onValueChange={([v]) => setInputs(prev => ({ ...prev, missedLeads: v }))}
                            min={0}
                            max={20}
                            step={1}
                          />
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">
                              {workflowOptions.find(w => w.id === inputs.workflow)?.valueLabel || "Value per Lead (Gross Profit)"}
                            </Label>
                            <span className="text-xl font-bold text-primary">{formatCurrency(inputs.valuePerLead)}</span>
                          </div>
                          <Slider
                            value={[inputs.valuePerLead]}
                            onValueChange={([v]) => setInputs(prev => ({ ...prev, valuePerLead: v }))}
                            min={500}
                            max={10000}
                            step={500}
                          />
                        </div>
                      </motion.div>
                    )}

                    {/* Step 4: Choose Plan */}
                    {step === 4 && (
                      <motion.div
                        key="step4"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">Choose Your Plan</h3>
                            <p className="text-sm text-muted-foreground">Select alfred ai package + add-ons</p>
                          </div>
                        </div>

                        <div className="grid gap-3">
                          {alfredPlans.map((plan) => (
                            <button
                              key={plan.id}
                              onClick={() => setInputs(prev => ({ ...prev, selectedPlan: plan.id }))}
                              className={cn(
                                "p-4 rounded-xl border-2 text-left transition-all relative",
                                inputs.selectedPlan === plan.id
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50"
                              )}
                            >
                              {recommendedPlanId === plan.id && (
                                <span className="absolute -top-2 right-4 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                                  Recommended
                                </span>
                              )}
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-lg font-semibold">{plan.name}</span>
                                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] text-muted-foreground mb-0.5">Starting from</p>
                                  <div className="text-lg font-bold text-primary">{formatCurrency(plan.monthly)}/mo</div>
                                  <div className="text-xs text-muted-foreground">+ {plan.showAvg ? "avg " : ""}{formatCurrency(plan.setup)} setup/workflow</div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>

                        <div className="pt-4 border-t border-border">
                          <button
                            onClick={() => setAddOnsExpanded(!addOnsExpanded)}
                            className="w-full flex items-center justify-between py-2 text-sm font-medium hover:text-primary transition-colors"
                          >
                            <span>Optional Add-ons</span>
                            <ChevronDown className={cn(
                              "w-4 h-4 transition-transform",
                              addOnsExpanded && "rotate-180"
                            )} />
                          </button>
                          
                          <SafeAnimatePresence>
                            {addOnsExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3">
                                  {addOns.map((addon) => (
                                    <button
                                      key={addon.id}
                                      onClick={() => {
                                        if (addon.isContactUs) return;
                                        setInputs(prev => ({
                                          ...prev,
                                          selectedAddOns: prev.selectedAddOns.includes(addon.id)
                                            ? prev.selectedAddOns.filter(id => id !== addon.id)
                                            : [...prev.selectedAddOns, addon.id]
                                        }));
                                      }}
                                      className={cn(
                                        "p-3 rounded-lg border text-left text-sm transition-all",
                                        addon.isContactUs 
                                          ? "border-border bg-muted/30 cursor-default"
                                          : inputs.selectedAddOns.includes(addon.id)
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-primary/50"
                                      )}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span>{addon.name}</span>
                                        <span className="text-muted-foreground text-xs">
                                          {addon.isContactUs 
                                            ? "Contact Us" 
                                            : addon.isSetupOnly 
                                              ? `+${formatCurrency(addon.setupCost)} setup`
                                              : addon.setupCost > 0
                                                ? `+${formatCurrency(addon.monthlyCost)}/mo + ${formatCurrency(addon.setupCost)} setup`
                                                : `+${formatCurrency(addon.monthlyCost)}/mo`
                                          }
                                        </span>
                                      </div>
                                      {addon.description && (
                                        <p className="text-xs text-muted-foreground mt-1">{addon.description}</p>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </SafeAnimatePresence>
                          <p className="text-xs text-muted-foreground mt-3 text-center italic">All plans are estimates only</p>
                        </div>
                      </motion.div>
                    )}
                  </SafeAnimatePresence>
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-6 border-t border-border mt-auto">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => setStep(Math.max(1, step - 1))}
                        disabled={step === 1}
                        className="gap-2"
                      >
                        <ChevronUp className="w-4 h-4 rotate-[-90deg]" />
                        Back
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={handleReset}
                        className="gap-2 text-muted-foreground hover:text-foreground"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Reset
                      </Button>
                    </div>
                    {step < 4 ? (
                      <Button onClick={() => {
                        const nextStep = step + 1;
                        if (nextStep === 4) {
                          setInputs(prev => ({ ...prev, selectedPlan: recommendedPlanId }));
                        }
                        setStep(nextStep);
                      }} className="gap-2">
                        Next
                        <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
                      </Button>
                    ) : (
                      <Button onClick={handleCalculate} className="gap-2 bg-gradient-to-r from-primary to-pink-500">
                        Calculate TCO
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Right: Live Preview */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-card rounded-2xl border border-border p-6 sticky top-24">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium text-muted-foreground">Live Estimate</h4>
                      <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
                        <button
                          onClick={() => setViewMode("monthly")}
                          className={cn(
                            "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                            viewMode === "monthly"
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          Monthly
                        </button>
                        <button
                          onClick={() => setViewMode("annual")}
                          className={cn(
                            "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                            viewMode === "annual"
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          Annual
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Your Current Cost - shows after Step 1 interaction */}
                      <div className="p-4 rounded-xl bg-muted/50">
                        <p className="text-xs text-muted-foreground mb-1">
                          Your Current {viewMode === "annual" ? "Annual" : "Monthly"} Cost
                        </p>
                        {(hasInteractedStep1 || step >= 2) ? (
                          <>
                            <p className="text-2xl font-bold text-foreground">
                              {formatCurrency(viewMode === "annual" ? results.currentMonthlyCost * 12 : results.currentMonthlyCost)}
                            </p>
                            {viewMode === "annual" && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatCurrency(results.currentMonthlyCost)}/mo × 12
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-2xl font-bold text-muted-foreground">
                            $--,---
                          </p>
                        )}
                      </div>
                      
                      {/* alfred ai Investment - shows only at Step 4 */}
                      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                        <p className="text-xs text-muted-foreground mb-1">
                          alfred ai {viewMode === "annual" ? "Year 1" : "Monthly"} Investment
                        </p>
                        {step === 4 ? (
                          <>
                            <p className="text-2xl font-bold text-primary">
                              {formatCurrency(viewMode === "annual" ? results.firstYearTotalCost : results.alfredMonthlyCost)}
                            </p>
                            {viewMode === "annual" ? (
                              <div className="mt-2 space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">Setup (one-time)</span>
                                  <span className="text-foreground">{formatCurrency(results.implementationCost)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">{formatCurrency(results.alfredMonthlyCost)}/mo × 12</span>
                                  <span className="text-foreground">{formatCurrency(results.alfredMonthlyCost * 12)}</span>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground mt-1">
                                + {formatCurrency(results.implementationCost)} setup (one-time)
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-2xl font-bold text-primary/40">
                            $--,---
                          </p>
                        )}
                      </div>
                      
                      {/* Recoverable Savings Breakdown - shows after Step 1 interaction */}
                      {hasInteractedStep1 && (
                        <div className="p-4 rounded-xl bg-muted/30 border border-border">
                          <p className="text-xs text-muted-foreground mb-3">
                            Recoverable Savings Breakdown
                          </p>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-primary" />
                                <span className="text-xs text-muted-foreground">Time Saved</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">70%</span>
                              </div>
                              <span className="text-sm font-medium text-foreground">
                                {formatCurrency(viewMode === "annual" ? results.timeSavingsMonthly * 12 : results.timeSavingsMonthly)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "hsl(var(--chart-2))" }} />
                                <span className="text-xs text-muted-foreground">Rework Reduction</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-600 font-medium">80%</span>
                              </div>
                              <span className="text-sm font-medium text-foreground">
                                {formatCurrency(viewMode === "annual" ? results.reworkSavingsMonthly * 12 : results.reworkSavingsMonthly)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "hsl(var(--chart-3))" }} />
                                <span className="text-xs text-muted-foreground">Recovered Leads</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-medium">60%</span>
                              </div>
                              <span className="text-sm font-medium text-foreground">
                                {formatCurrency(viewMode === "annual" ? results.opportunitySavingsMonthly * 12 : results.opportunitySavingsMonthly)}
                              </span>
                            </div>
                            <div className="pt-2 mt-2 border-t border-border flex items-center justify-between">
                              <span className="text-xs font-medium text-foreground">Total Recoverable</span>
                              <span className="text-sm font-bold text-primary">
                                {formatCurrency(viewMode === "annual" ? results.totalSavingsMonthly * 12 : results.totalSavingsMonthly)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Net Savings - shows only at Step 4 */}
                      <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20">
                        <p className="text-xs text-muted-foreground mb-1">
                          {viewMode === "annual" ? "Year 1" : "Monthly"} Net Savings
                        </p>
                        {step === 4 ? (
                          <>
                            <p className="text-3xl font-bold text-emerald-600">
                              {formatCurrency(
                                viewMode === "annual" 
                                  ? (results.totalSavingsMonthly * 12) - results.firstYearTotalCost
                                  : results.netMonthlyGain
                              )}
                            </p>
                            {viewMode === "annual" ? (
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatCurrency(results.totalSavingsMonthly * 12)} recoverable − {formatCurrency(results.firstYearTotalCost)} investment
                              </p>
                            ) : (
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatCurrency(results.totalSavingsMonthly)} recoverable − {formatCurrency(results.alfredMonthlyCost)} alfred ai
                              </p>
                            )}
                          </>
                        ) : (
                          <>
                            <p className="text-3xl font-bold text-emerald-600/40">
                              $--,---
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {hasInteractedStep1 ? "Complete Step 4 to see savings" : "Adjust the sliders to see your estimate"}
                            </p>
                          </>
                        )}
                      </div>
                      
                      {step === 4 && results.breakEvenMonths > 0 && results.netMonthlyGain > 0 && (
                        <div className="py-3 px-4 bg-muted/30 rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">Setup Recovery</p>
                            <p className="text-sm font-semibold text-foreground">Month {results.breakEvenMonths}</p>
                          </div>
                          
                          {/* Progress bar showing monthly recovery */}
                          <div className="space-y-2">
                            <div className="flex gap-1">
                              {Array.from({ length: Math.min(12, Math.max(results.breakEvenMonths + 2, 6)) }, (_, i) => {
                                const month = i + 1;
                                const cumulativeSavings = results.netMonthlyGain * month;
                                const progress = Math.min(100, (cumulativeSavings / results.implementationCost) * 100);
                                const isBreakEven = month === results.breakEvenMonths;
                                const isPastBreakEven = month > results.breakEvenMonths;
                                
                                return (
                                  <div key={month} className="flex-1 flex flex-col items-center gap-1">
                                    <div 
                                      className={cn(
                                        "w-full h-6 rounded-sm relative overflow-hidden border",
                                        isBreakEven 
                                          ? "border-emerald-500" 
                                          : isPastBreakEven 
                                            ? "border-emerald-400/50" 
                                            : "border-border"
                                      )}
                                    >
                                      <div 
                                        className={cn(
                                          "absolute bottom-0 left-0 right-0 transition-all",
                                          isPastBreakEven ? "bg-emerald-500" : "bg-primary"
                                        )}
                                        style={{ height: `${Math.min(100, progress)}%` }}
                                      />
                                      {isBreakEven && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                        </div>
                                      )}
                                    </div>
                                    <span className={cn(
                                      "text-[9px]",
                                      isBreakEven ? "text-emerald-600 font-bold" : "text-muted-foreground"
                                    )}>
                                      {month}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                              <span>Month 1</span>
                              <span className="text-emerald-600 font-medium">Break-even: M{results.breakEvenMonths}</span>
                            </div>
                          </div>
                          
                          <p className="text-xs text-muted-foreground text-center">
                            {formatCurrency(results.netMonthlyGain)}/mo savings × {results.breakEvenMonths} mo = {formatCurrency(results.netMonthlyGain * results.breakEvenMonths)} recovered
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Why this is a no-brainer */}
                    <div className="mt-6 pt-5 border-t border-border">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        </div>
                        <h5 className="text-sm font-semibold text-foreground">Why This Is a No-Brainer</h5>
                      </div>
                      
                      <ul className="space-y-2.5 text-xs text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <Zap className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                          <span><strong className="text-foreground">Conservative estimates</strong> — real savings often 2-3x higher once automation compounds</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Zap className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                          <span><strong className="text-foreground">No hidden fees</strong> — flat monthly pricing with unlimited users & support included</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Zap className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                          <span><strong className="text-foreground">Zero contingency needed</strong> — we absorb integration risk; pause anytime if unhappy</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Zap className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                          <span><strong className="text-foreground">Opportunity cost ignored</strong> — this doesn&apos;t count faster quotes, happier clients, or freed-up headspace</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Zap className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                          <span><strong className="text-foreground">Implementation included</strong> — we do the heavy lifting so you see ROI from day one</span>
                        </li>
                      </ul>

                      <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-primary/5 to-pink-500/5 border border-primary/10">
                        <p className="text-xs text-center text-muted-foreground">
                          <span className="font-semibold text-foreground">Bottom line:</span> Even at 50% efficiency, you recoup your {formatCurrency(results.implementationCost)} setup by Month {Math.max(2, results.breakEvenMonths * 2)}.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* Results View */
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Key Metrics Tiles */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Current Monthly Cost", value: formatCurrency(results.currentMonthlyCost), icon: DollarSign, color: "from-slate-500/10 to-slate-500/5" },
                    { label: "alfred ai Monthly Investment", value: formatCurrency(results.alfredMonthlyCost), icon: Sparkles, color: "from-primary/10 to-primary/5" },
                    { label: "Net Monthly Gain", value: formatCurrency(results.netMonthlyGain), icon: TrendingUp, color: "from-emerald-500/10 to-emerald-500/5", valueColor: "text-emerald-600" },
                    { label: "Break-Even Month", value: `Month ${results.breakEvenMonths}`, icon: Zap, color: "from-amber-500/10 to-amber-500/5" },
                  ].map((metric, i) => (
                    <motion.div
                      key={metric.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={cn("p-6 rounded-2xl border border-border bg-gradient-to-br", metric.color)}
                    >
                      <metric.icon className="w-6 h-6 text-muted-foreground mb-3" />
                      <p className={cn("text-2xl md:text-3xl font-bold mb-1", metric.valueColor || "text-foreground")}>{metric.value}</p>
                      <p className="text-sm text-muted-foreground">{metric.label}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Charts */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Cumulative TCO Comparison */}
                  <div className="bg-card rounded-2xl border border-border p-6">
                    <h4 className="text-lg font-semibold mb-4">Cumulative TCO Comparison</h4>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={results.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(142 76% 36%)" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="hsl(142 76% 36%)" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorAlfred" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="month" tick={{ fontSize: 12 }} tickFormatter={(v) => `M${v}`} />
                          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                          <RechartsTooltip 
                            formatter={(value: number) => formatCurrency(value)}
                            labelFormatter={(label) => `Month ${label}`}
                            contentStyle={{ 
                              backgroundColor: "hsl(var(--card))", 
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px"
                            }}
                          />
                          <Legend />
                          <Area type="monotone" dataKey="Recoverable Savings" stroke="hsl(142 76% 36%)" fillOpacity={1} fill="url(#colorSavings)" name="Cumulative Benefit" />
                          <Area type="monotone" dataKey="alfred ai Investment" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorAlfred)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Savings Breakdown */}
                  <div className="bg-card rounded-2xl border border-border p-6">
                    <h4 className="text-lg font-semibold mb-4">Where Savings Come From (Year 1)</h4>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={results.savingsBreakdown} layout="vertical" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
                          <RechartsTooltip 
                            formatter={(value: number) => formatCurrency(value)}
                            contentStyle={{ 
                              backgroundColor: "hsl(var(--card))", 
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px"
                            }}
                          />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                            {results.savingsBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Projections Table */}
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h4 className="text-lg font-semibold mb-4">Net Impact Projections</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {results.projections.map((proj) => (
                      <div key={proj.months} className="text-center p-4 rounded-xl bg-muted/50">
                        <p className="text-sm text-muted-foreground mb-2">{proj.months} Months</p>
                        <p className="text-xs text-muted-foreground">Current: {formatCurrency(proj.totalCurrentCost)}</p>
                        <p className="text-xs text-muted-foreground">alfred ai: {formatCurrency(proj.totalAlfredCost)}</p>
                        <p className="text-xl font-bold text-emerald-600 mt-2">{formatCurrency(proj.netSavings)}</p>
                        <p className="text-xs text-muted-foreground">Net Savings</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Accordion: Assumptions */}
                <Accordion type="single" collapsible className="bg-card rounded-2xl border border-border">
                  <AccordionItem value="assumptions" className="border-none">
                    <AccordionTrigger className="px-6 hover:no-underline">
                      <span className="text-sm font-medium">Where do these numbers come from?</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6">
                      <div className="space-y-3 text-sm text-muted-foreground">
                        <p><strong>Labour Cost:</strong> (Hourly rate) × (Hours/week) × 4.33 × (Staff count)</p>
                        <p><strong>Rework Cost:</strong> (Jobs/month) × (Error rate) × (Rework minutes) × (Hourly rate)</p>
                        <p><strong>Opportunity Cost:</strong> (Missed leads/month) × (Value per lead)</p>
                        <p><strong>Break-even:</strong> Implementation cost ÷ Net monthly gain</p>
                        <p className="pt-2 text-xs italic">These are estimates. We'll validate with your real workflow during onboarding.</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                  <Button 
                    size="lg" 
                    onClick={() => setIsCalendlyOpen(true)}
                    className="gap-2 px-8 bg-gradient-to-r from-primary to-pink-500"
                  >
                    <Calendar className="w-5 h-5" />
                    Get a Verified ROI Plan
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    onClick={handleExportPDF}
                    className="gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download TCO PDF
                  </Button>
                  <Button 
                    size="lg" 
                    variant="ghost" 
                    onClick={() => setShowResults(false)}
                    className="gap-2"
                  >
                    <ArrowRight className="w-4 h-4 rotate-180" />
                    Edit Inputs
                  </Button>
                  <Button 
                    size="lg" 
                    variant="ghost" 
                    onClick={handleReset}
                    className="gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </Button>
                </div>
              </motion.div>
            )}
          </SafeAnimatePresence>
        </motion.div>
      </div>

      <BookingChatModal isOpen={isCalendlyOpen} onClose={() => setIsCalendlyOpen(false)} />
    </section>
  );
}
