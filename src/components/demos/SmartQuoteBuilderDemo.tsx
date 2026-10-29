import { useState, useEffect } from "react";
import { useDemoSpeed } from "@/contexts/DemoSpeedContext";
import { InlineDemoSpeedControl } from "@/components/demos/shared/InlineDemoSpeedControl";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import {
  FileText,
  Search,
  DollarSign,
  Layout,
  Layers,
  Clock,
  FileOutput,
  Send,
  Check,
  Sparkles,
  Package,
  Percent,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  TrendingUp,
  HardHat,
  Mail,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface QuoteStep {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
  duration: number;
}

interface ProductMatch {
  id: string;
  name: string;
  sku: string;
  matchScore: number;
  basePrice: number;
  quantity: number;
  selected: boolean;
}

interface QuoteSection {
  id: string;
  title: string;
  included: boolean;
}

const QUOTE_STEPS: QuoteStep[] = [
  { id: "rfq", title: "RFQ Received", icon: Mail, description: "Incoming tender request received", duration: 2000 },
  { id: "matching", title: "AI Trade Matching", icon: Search, description: "Matching scope items to trade packages", duration: 2500 },
  { id: "pricing", title: "Dynamic Pricing", icon: DollarSign, description: "Applying pricing rules & discounts", duration: 2000 },
  { id: "template", title: "Template Selection", icon: Layout, description: "AI suggests optimal template", duration: 1500 },
  { id: "sections", title: "Section Builder", icon: Layers, description: "Configuring quote sections", duration: 2000 },
  { id: "validity", title: "Validity Settings", icon: Clock, description: "Setting expiration & terms", duration: 1500 },
  { id: "output", title: "Multi-format Output", icon: FileOutput, description: "Generating PDF & web quote", duration: 2000 },
  { id: "send", title: "Send & Track", icon: Send, description: "Delivering with tracking enabled", duration: 1500 },
];

const MOCK_RFQ = {
  customer: "Horizon Developments",
  contact: "James Harrington, Project Director",
  email: "j.harrington@horizondev.com.au",
  subject: "Quote Request - Commercial Fitout Level 3-5, 180 Collins St",
  items: [
    "Demolition & strip-out (3 levels)",
    "Partition walls & framing",
    "Ceiling grid & tile installation",
    "Electrical rough-in & fit-off",
    "Hydraulics & plumbing",
    "Floor coverings & finishes",
  ],
  deadline: "Feb 28, 2026",
  budget: "$420,000 - $580,000",
};

const INITIAL_PRODUCTS: ProductMatch[] = [
  { id: "1", name: "Demolition & Strip-out", sku: "DEM-001", matchScore: 98, basePrice: 38500, quantity: 1, selected: true },
  { id: "2", name: "Partition & Framing Package", sku: "PAR-002", matchScore: 96, basePrice: 87200, quantity: 1, selected: true },
  { id: "3", name: "Ceiling Systems", sku: "CEI-003", matchScore: 94, basePrice: 52400, quantity: 1, selected: true },
  { id: "4", name: "Electrical Package", sku: "ELC-004", matchScore: 97, basePrice: 124800, quantity: 1, selected: true },
  { id: "5", name: "Hydraulics & Plumbing", sku: "HYD-005", matchScore: 93, basePrice: 96300, quantity: 1, selected: true },
  { id: "6", name: "Floor Coverings & Finishes", sku: "FLR-006", matchScore: 91, basePrice: 68000, quantity: 1, selected: true },
];

const QUOTE_SECTIONS: QuoteSection[] = [
  { id: "scope", title: "Scope of Works", included: true },
  { id: "trades", title: "Trade Breakdown", included: true },
  { id: "pricing", title: "Pricing Schedule", included: true },
  { id: "prelims", title: "Preliminaries & Site Costs", included: true },
  { id: "program", title: "Program & Milestones", included: true },
  { id: "exclusions", title: "Exclusions & Qualifications", included: true },
  { id: "warranty", title: "Warranty & Defects", included: false },
  { id: "payment", title: "Payment Schedule", included: false },
];

const TEMPLATES = [
  { id: "professional", name: "Professional", color: "from-blue-600 to-blue-800", recommended: true },
  { id: "modern", name: "Modern", color: "from-violet-600 to-purple-800", recommended: false },
  { id: "minimal", name: "Minimal", color: "from-slate-600 to-slate-800", recommended: false },
];

export default function SmartQuoteBuilderDemo() {
  const { applySpeed } = useDemoSpeed();
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [stepProgress, setStepProgress] = useState(0);
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [sections, setSections] = useState(QUOTE_SECTIONS);
  const [selectedTemplate, setSelectedTemplate] = useState("professional");
  const [discountApplied, setDiscountApplied] = useState(0);
  const [quoteGenerated, setQuoteGenerated] = useState(false);

  // Calculate totals
  const subtotal = products
    .filter(p => p.selected)
    .reduce((sum, p) => sum + p.basePrice * p.quantity, 0);
  const bundleDiscount = subtotal > 400000 ? 6 : subtotal > 250000 ? 4 : 0;
  const repeatClientDiscount = 2.5; // Repeat client
  const totalDiscount = bundleDiscount + repeatClientDiscount;
  const discountAmount = (subtotal * totalDiscount) / 100;
  const finalTotal = subtotal - discountAmount;
  const margin = 28; // Margin percentage

  useEffect(() => {
    if (!isPlaying) return;

    const step = QUOTE_STEPS[currentStep];
    if (!step) {
      setIsPlaying(false);
      return;
    }

    const progressInterval = setInterval(() => {
      setStepProgress(prev => {
        if (prev >= 100) return 100;
        return prev + 2;
      });
    }, applySpeed(step.duration) / 50);

    const stepTimeout = setTimeout(() => {
      if (currentStep < QUOTE_STEPS.length - 1) {
        setCurrentStep(prev => prev + 1);
        setStepProgress(0);
        
        // Apply discount animation at pricing step
        if (currentStep === 2) {
          setDiscountApplied(totalDiscount);
        }
        // Generate quote at output step
        if (currentStep === 6) {
          setQuoteGenerated(true);
        }
      } else {
        setIsPlaying(false);
      }
    }, applySpeed(step.duration));

    return () => {
      clearInterval(progressInterval);
      clearTimeout(stepTimeout);
    };
  }, [isPlaying, currentStep, totalDiscount]);

  const handleReset = () => {
    setCurrentStep(0);
    setStepProgress(0);
    setIsPlaying(false);
    setDiscountApplied(0);
    setQuoteGenerated(false);
    setProducts(INITIAL_PRODUCTS);
    setSections(QUOTE_SECTIONS);
    setSelectedTemplate("professional");
  };

  const toggleProduct = (id: string) => {
    setProducts(prev =>
      prev.map(p => (p.id === id ? { ...p, selected: !p.selected } : p))
    );
  };

  const toggleSection = (id: string) => {
    setSections(prev =>
      prev.map(s => (s.id === id ? { ...s, included: !s.included } : s))
    );
  };

  const renderStepContent = () => {
    const step = QUOTE_STEPS[currentStep];
    if (!step) return null;

    switch (step.id) {
      case "rfq":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="bg-primary/20 text-primary">
                    <Mail className="w-3 h-3 mr-1" />
                    New RFQ
                  </Badge>
                  <span className="text-xs text-muted-foreground">2 min ago</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                    <HardHat className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{MOCK_RFQ.customer}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {MOCK_RFQ.contact}
                    </p>
                  </div>
                </div>
                <div className="border-t border-border pt-3">
                  <p className="font-medium text-sm mb-2">{MOCK_RFQ.subject}</p>
                  <ul className="space-y-1">
                    {MOCK_RFQ.items.map((item, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                        <ChevronRight className="w-3 h-3 text-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
                  <span>Deadline: <strong className="text-foreground">{MOCK_RFQ.deadline}</strong></span>
                  <span>Budget: <strong className="text-foreground">{MOCK_RFQ.budget}</strong></span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      case "matching":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              AI matching scope items to trade packages...
            </div>
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.15 }}
              >
                <Card
                  className={`cursor-pointer transition-all ${
                    product.selected
                      ? "border-primary/50 bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                  onClick={() => toggleProduct(product.id)}
                >
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded flex items-center justify-center ${
                        product.selected ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}>
                        {product.selected ? <Check className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.sku} · Lump Sum</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">
                        {product.matchScore}% match
                      </Badge>
                      <p className="text-sm font-medium mt-1">${product.basePrice.toLocaleString()}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        );

      case "pricing":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Dynamic Pricing Applied
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">${subtotal.toLocaleString()}</span>
                </div>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ delay: 0.3 }}
                  className="space-y-2"
                >
                  <div className="flex justify-between text-sm text-green-500">
                    <span className="flex items-center gap-1">
                      <Percent className="w-3 h-3" />
                      Multi-trade bundle discount ({bundleDiscount}%)
                    </span>
                    <span>-${((subtotal * bundleDiscount) / 100).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-500">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Repeat client discount ({repeatClientDiscount}%)
                    </span>
                    <span>-${((subtotal * repeatClientDiscount) / 100).toLocaleString()}</span>
                  </div>
                </motion.div>
                <div className="border-t border-border pt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-primary tabular-nums">${finalTotal.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Margin indicator */}
            <Card className="bg-muted/30">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Profit Margin</span>
                  <span className="text-sm font-medium text-green-500">{margin}%</span>
                </div>
                <Progress value={margin} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Healthy margin maintained with applied discounts
                </p>
              </CardContent>
            </Card>
          </motion.div>
        );

      case "template":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              AI recommends "Professional" for commercial fitout tenders
            </p>
            <div className="grid grid-cols-3 gap-3">
              {TEMPLATES.map((template) => (
                <motion.div
                  key={template.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    selectedTemplate === template.id
                      ? "border-primary shadow-lg"
                      : "border-transparent"
                  }`}
                >
                  <div className={`h-24 bg-gradient-to-br ${template.color} p-3 flex flex-col justify-between`}>
                    <div className="w-8 h-1 bg-white/40 rounded" />
                    <div className="space-y-1">
                      <div className="w-12 h-1 bg-white/60 rounded" />
                      <div className="w-8 h-1 bg-white/40 rounded" />
                    </div>
                  </div>
                  <div className="p-2 bg-card text-center">
                    <p className="text-xs font-medium">{template.name}</p>
                    {template.recommended && (
                      <Badge variant="secondary" className="text-[10px] mt-1">
                        Recommended
                      </Badge>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );

      case "sections":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <p className="text-sm text-muted-foreground mb-3">
              Configure quote sections to include:
            </p>
            {sections.map((section) => (
              <motion.div
                key={section.id}
                whileHover={{ x: 2 }}
                onClick={() => toggleSection(section.id)}
                className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-all ${
                  section.included
                    ? "bg-primary/10 border border-primary/30"
                    : "bg-muted/30 border border-transparent hover:bg-muted/50"
                }`}
              >
                <div className={`w-5 h-5 rounded flex items-center justify-center ${
                  section.included ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}>
                  {section.included && <Check className="w-3 h-3" />}
                </div>
                <span className="text-sm">{section.title}</span>
              </motion.div>
            ))}
          </motion.div>
        );

      case "validity":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Quote Valid Until</span>
                  <Badge variant="secondary">Mar 31, 2026</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Payment Terms</span>
                  <Badge variant="secondary">Progress Claims (Monthly)</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Program Duration</span>
                  <Badge variant="secondary">12-16 weeks</Badge>
                </div>
                <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
                  <Sparkles className="w-3 h-3 inline mr-1 text-primary" />
                  AI set 45-day validity based on current material price volatility
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      case "output":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <Tabs defaultValue="pdf" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="pdf" className="flex-1">PDF Preview</TabsTrigger>
                <TabsTrigger value="web" className="flex-1">Web Quote</TabsTrigger>
              </TabsList>
              <TabsContent value="pdf" className="mt-3">
                <Card className="overflow-hidden">
                  <div className={`h-8 bg-gradient-to-r ${TEMPLATES.find(t => t.id === selectedTemplate)?.color}`} />
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-lg">Quote #QT-HOR-2026-0047</p>
                        <p className="text-xs text-muted-foreground">{MOCK_RFQ.customer}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary tabular-nums">${finalTotal.toLocaleString()}</p>
                        <Badge className="bg-green-500/20 text-green-500 text-xs">
                          {totalDiscount}% savings
                        </Badge>
                      </div>
                    </div>
                    <div className="border-t border-border pt-2 space-y-1">
                      {products.filter(p => p.selected).map(p => (
                        <div key={p.id} className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{p.name} (Lump Sum)</span>
                          <span className="tabular-nums">${(p.basePrice * p.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="web" className="mt-3">
                <Card className="bg-muted/30">
                  <CardContent className="p-4 text-center">
                    <FileOutput className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <p className="text-sm font-medium">Interactive Web Quote</p>
                    <p className="text-xs text-muted-foreground">Customer can accept & sign online</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        );

      case "send":
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4"
            >
              <Check className="w-8 h-8 text-green-500" />
            </motion.div>
            <h3 className="font-semibold text-lg mb-1">Quote Sent Successfully!</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Sent to James Harrington at {MOCK_RFQ.email}
            </p>
            <div className="flex justify-center gap-4 text-xs">
              <Badge variant="secondary">
                <Clock className="w-3 h-3 mr-1" />
                Open tracking enabled
              </Badge>
              <Badge variant="secondary">
                <Mail className="w-3 h-3 mr-1" />
                CRM synced
              </Badge>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold">Smart Quote Builder</h2>
            <p className="text-sm text-muted-foreground">AI-powered quotation workflow</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <InlineDemoSpeedControl compact />
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="gap-1"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={() => setIsPlaying(!isPlaying)}
            className="gap-1"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? "Pause" : "Play"}
          </Button>
        </div>
      </div>

      {/* Step Progress */}
      <div className="mb-6 overflow-x-auto pb-2">
        <div className="flex gap-1 min-w-max">
          {QUOTE_STEPS.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const StepIcon = step.icon;

            return (
              <motion.div
                key={step.id}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                  isCompleted
                    ? "bg-primary/20 text-primary"
                    : isCurrent
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
                animate={isCurrent ? { scale: [1, 1.02, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <StepIcon className="w-3 h-3" />
                <span className="hidden sm:inline">{step.title}</span>
                {isCompleted && <Check className="w-3 h-3" />}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Current step progress bar */}
      {isPlaying && currentStep < QUOTE_STEPS.length && (
        <div className="mb-4">
          <Progress value={stepProgress} className="h-1" />
        </div>
      )}

      {/* Main Content */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: Step Content */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            <div key={currentStep}>{renderStepContent()}</div>
          </AnimatePresence>
        </div>

        {/* Right: Live Quote Preview */}
        <Card className="h-fit sticky top-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Live Quote Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-xs text-muted-foreground">
              {MOCK_RFQ.customer} • {MOCK_RFQ.contact}
            </div>
            
            <div className="space-y-2">
              {products.filter(p => p.selected).map(product => (
                <div key={product.id} className="flex justify-between text-sm">
                   <span className="truncate flex-1">{product.name}</span>
                   <span className="text-muted-foreground ml-2">LS</span>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${subtotal.toLocaleString()}</span>
              </div>
              {discountApplied > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="flex justify-between text-sm text-green-500"
                >
                  <span>Discount ({totalDiscount}%)</span>
                  <span className="tabular-nums">-${discountAmount.toLocaleString()}</span>
                </motion.div>
              )}
              <div className="flex justify-between font-semibold pt-1 border-t border-border">
                <span>Total</span>
                <span className="text-primary">${finalTotal.toLocaleString()}</span>
              </div>
            </div>

            {quoteGenerated && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-2"
              >
                <Badge className="w-full justify-center bg-green-500/20 text-green-500">
                  <Check className="w-3 h-3 mr-1" />
                  Quote Generated & Sent
                </Badge>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Efficiency comparison */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 p-4 rounded-lg bg-muted/30 border border-border"
      >
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-muted-foreground line-through tabular-nums">3-4 hrs</p>
            <p className="text-xs text-muted-foreground">Manual Process</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary tabular-nums">18 min</p>
            <p className="text-xs text-muted-foreground">With AI Assistance</p>
          </div>
        </div>
        <p className="text-xs text-center text-muted-foreground mt-2">
          89% faster quote generation with AI-powered automation
        </p>
      </motion.div>
    </div>
  );
}
