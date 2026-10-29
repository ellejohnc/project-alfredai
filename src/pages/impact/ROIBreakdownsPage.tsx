import { useState } from "react";
import { motion } from "framer-motion";
import { SafeAnimatePresence } from "@/components/ui/safe-animate-presence";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, BarChart3, TrendingUp, DollarSign, Clock, 
  Users, Calculator, ArrowUpRight, ArrowDownRight, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BookingChatModal from "@/components/BookingChatModal";
import PremiumCTASection from "@/components/sections/PremiumCTASection";
import ROICalculator from "@/components/ROICalculator";
import SEO from "@/components/SEO";

const roiModels = [
  {
    id: "agentic-workforce",
    title: "Agentic Workforce ROI Model",
    description: "How AI agents owning end-to-end processes deliver measurable cost savings with compounding value over time.",
    icon: Clock,
    metrics: {
      before: { label: "Annual Admin Cost", value: "$180,000" },
      after: { label: "Post-AI Agent Cost", value: "$54,000" },
      savings: { label: "Annual Savings", value: "$126,000" },
      roi: { label: "First Year ROI", value: "520%" },
    },
    breakdown: [
      { category: "Document Processing", before: "$45,000", after: "$9,000", savings: "$36,000" },
      { category: "Data Entry & Updates", before: "$38,000", after: "$8,000", savings: "$30,000" },
      { category: "Reporting & Status Updates", before: "$32,000", after: "$12,000", savings: "$20,000" },
      { category: "Email Management", before: "$28,000", after: "$10,000", savings: "$18,000" },
      { category: "Scheduling & Coordination", before: "$22,000", after: "$8,000", savings: "$14,000" },
      { category: "Information Retrieval", before: "$15,000", after: "$7,000", savings: "$8,000" },
    ],
    assumptions: [
      "Based on team of 15 employees",
      "Average fully-loaded cost of $75,000/employee",
      "35% of time spent on administrative tasks",
      "70% AI agent autonomy rate achieved within 6 months",
      "Value compounds as AI agents learn business patterns",
    ],
  },
  {
    id: "ai-augmented-revenue",
    title: "AI-Augmented Revenue Model",
    description: "How intelligent capacity expansion and AI decision quality increases revenue per employee.",
    icon: TrendingUp,
    metrics: {
      before: { label: "Revenue Per Head", value: "$95,000" },
      after: { label: "AI-Augmented Revenue", value: "$142,000" },
      savings: { label: "Revenue Increase", value: "+49%" },
      roi: { label: "First Year ROI", value: "380%" },
    },
    breakdown: [
      { category: "Billable Hours Recovered", before: "65%", after: "82%", savings: "+17pts" },
      { category: "Client Capacity", before: "12 clients", after: "18 clients", savings: "+50%" },
      { category: "Project Turnaround", before: "14 days", after: "8 days", savings: "-43%" },
      { category: "Proposal Response Time", before: "48 hours", after: "12 hours", savings: "-75%" },
    ],
    assumptions: [
      "Professional services firm with 25 employees",
      "Average billing rate of $150/hour",
      "Current billable ratio of 65%",
      "Target billable ratio of 82% (industry benchmark)",
      "AI agents handle exception cases autonomously",
    ],
  },
  {
    id: "scale-with-ai-agents",
    title: "Scale with AI Agents Model",
    description: "Cost comparison: hiring additional staff vs. deploying AI agents for growth. Agent onboarding in days vs months.",
    icon: Users,
    metrics: {
      before: { label: "Cost Per New Hire", value: "$85,000" },
      after: { label: "AI Agent Cost", value: "$12,000" },
      savings: { label: "Savings Per Role", value: "$73,000" },
      roi: { label: "First Year ROI", value: "608%" },
    },
    breakdown: [
      { category: "Salary & Benefits", before: "$65,000", after: "$0", savings: "$65,000" },
      { category: "Recruiting & Onboarding", before: "$8,000", after: "$0", savings: "$8,000" },
      { category: "Training & Ramp-up", before: "3-6 months", after: "2-5 days", savings: "95% faster" },
      { category: "Management Overhead", before: "$4,000", after: "$0", savings: "$4,000" },
      { category: "AI Agent Infrastructure", before: "$0", after: "$10,000", savings: "-$10,000" },
    ],
    assumptions: [
      "Comparison based on admin/coordinator role",
      "Includes recruitment, training, and management costs",
      "AI agent platform cost includes full implementation",
      "Assumes 3 roles replaced/avoided per year",
      "AI agents adapt to business changes without retraining",
    ],
  },
];

const ROIBreakdownsPage = () => {
  const [isCalendlyOpen, setIsCalendlyOpen] = useState(false);
  const [showCalculator, setShowCalculator] = useState(true);
  const [expandedModels, setExpandedModels] = useState<string[]>([]);

  const toggleModel = (modelId: string) => {
    setExpandedModels(prev => 
      prev.includes(modelId) 
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="ROI Breakdowns" 
        description="Detailed financial models showing exactly how alfred ai delivers measurable returns. Transparent assumptions, verifiable numbers, and interactive ROI calculator."
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Impact Studies", url: "/impact-studies" },
          { name: "ROI Breakdowns", url: "/impact/roi-breakdowns" }
        ]}
      />
      <Header />
      
      <main>
        {/* Hero */}
        <section className="pt-32 pb-12 md:pt-40 md:pb-16 bg-background relative overflow-hidden">
          {/* Premium gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent pointer-events-none" />
          <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="container-wide relative">
            <Link
              to="/impact-studies"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Impact Studies
            </Link>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <BarChart3 className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-semibold text-foreground mb-4 leading-tight">
                ROI Breakdowns
              </h1>
              <p className="text-xl text-muted-foreground">
                Detailed financial models showing exactly how alfred ai delivers measurable returns. Transparent assumptions, verifiable numbers.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ROI Models */}
        <section className="py-16 bg-background-alt">
          <div className="container-wide space-y-12">
            {roiModels.map((model, index) => {
              const Icon = model.icon;
              return (
                <motion.div
                  key={model.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card rounded-2xl border border-border overflow-hidden"
                >
                  {/* Clickable Header */}
                  <button
                    onClick={() => toggleModel(model.id)}
                    className="w-full p-8 text-left hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-semibold text-foreground mb-2">{model.title}</h2>
                        <p className="text-muted-foreground">{model.description}</p>
                      </div>
                      <motion.div
                        animate={{ 
                          rotate: expandedModels.includes(model.id) ? 180 : 0,
                          scale: expandedModels.includes(model.id) ? 1.1 : 1,
                          y: expandedModels.includes(model.id) ? 0 : [0, -3, 0]
                        }}
                        transition={{ 
                          rotate: {
                            type: "spring",
                            stiffness: 300,
                            damping: 20
                          },
                          scale: {
                            type: "spring",
                            stiffness: 300,
                            damping: 20
                          },
                          y: {
                            duration: 1.5,
                            repeat: Infinity,
                            repeatDelay: 2,
                            ease: "easeInOut"
                          }
                        }}
                        whileHover={{ 
                          scale: 1.2,
                          backgroundColor: "hsl(var(--primary) / 0.15)",
                          boxShadow: "0 0 20px hsl(var(--primary) / 0.3)"
                        }}
                        className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center cursor-pointer transition-colors"
                      >
                        <ChevronDown className="w-5 h-5 text-primary" />
                      </motion.div>
                    </div>
                  </button>

                  <SafeAnimatePresence>
                    {expandedModels.includes(model.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-8 pb-8">
                          {/* Key Metrics */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            {Object.entries(model.metrics).map(([key, data]) => (
                              <div 
                                key={key} 
                                className={`p-4 rounded-xl text-center ${
                                  key === 'roi' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                }`}
                              >
                                <div className={`text-2xl font-bold ${key === 'roi' ? '' : 'text-foreground'}`}>
                                  {data.value}
                                </div>
                                <div className={`text-sm ${key === 'roi' ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                                  {data.label}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Detailed Breakdown */}
                          <div className="mb-8">
                            <h3 className="font-semibold text-foreground mb-4">Detailed Breakdown</h3>
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b border-border">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Category</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Before AI</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">After AI</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Impact</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {model.breakdown.map((row, i) => (
                                    <tr key={i} className="border-b border-border last:border-0">
                                      <td className="py-3 px-4 text-sm text-foreground">{row.category}</td>
                                      <td className="py-3 px-4 text-sm text-muted-foreground text-right">{row.before}</td>
                                      <td className="py-3 px-4 text-sm text-muted-foreground text-right">{row.after}</td>
                                      <td className="py-3 px-4 text-sm font-medium text-right">
                                        <span className={row.savings.startsWith('-') && !row.savings.includes('$') ? 'text-green-600' : 'text-primary'}>
                                          {row.savings}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Assumptions */}
                          <div className="bg-muted/50 rounded-xl p-4">
                            <h4 className="text-sm font-medium text-foreground mb-2">Model Assumptions</h4>
                            <ul className="grid md:grid-cols-2 gap-2">
                              {model.assumptions.map((assumption, i) => (
                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <span className="text-primary mt-1">•</span>
                                  {assumption}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </SafeAnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Interactive Calculator */}
        <section className="py-16 bg-background">
          <div className="container-wide">
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Calculator className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">Calculate Your Agentic AI ROI</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Enter your organisation's details to see a personalised AI agent workforce value projection.
              </p>
            </div>
            
            {!showCalculator ? (
              <div className="text-center">
                <Button 
                  size="lg"
                  onClick={() => setShowCalculator(true)}
                  className="bg-primary hover:bg-primary-hover text-primary-foreground"
                >
                  <Calculator className="w-5 h-5 mr-2" />
                  Open ROI Calculator
                </Button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl mx-auto"
              >
                <ROICalculator />
              </motion.div>
            )}
          </div>
        </section>

        {/* CTA */}
        <PremiumCTASection
          title="Want a custom ROI analysis?"
          description="Our team can build a detailed financial model specific to your organisation, industry, and use cases."
          buttonText="Request Custom Analysis"
          onButtonClick={() => setIsCalendlyOpen(true)}
          variant="light"
        />
      </main>

      <Footer />
      <BookingChatModal isOpen={isCalendlyOpen} onClose={() => setIsCalendlyOpen(false)} />
    </div>
  );
};

export default ROIBreakdownsPage;
