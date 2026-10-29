import { useState } from "react";
import { FileText, CheckCircle2, Loader2, RotateCcw, Play, Sparkles, Send, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { getIndustryContent, type IndustryProposalContent } from "./industryContent";
import { BeforeAfterCompare } from "./BeforeAfterCompare";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";

interface ProposalSimulatorProps {
  company: string;
  industry: string;
  onComplete?: () => void;
}

type SimulationStep = "idle" | "analyzing" | "drafting" | "pricing" | "formatting" | "complete";

interface GeneratedSection {
  title: string;
  status: "pending" | "generating" | "complete";
  preview?: string;
}

export function ProposalSimulator({ company, industry, onComplete }: ProposalSimulatorProps) {
  const [step, setStep] = useState<SimulationStep>("idle");
  const [progress, setProgress] = useState(0);
  const [sections, setSections] = useState<GeneratedSection[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  
  const content = getIndustryContent(industry).proposal;
  
  const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  const handleReset = () => {
    setStep("idle");
    setProgress(0);
    setSections([]);
    setShowComparison(false);
    setActiveSection(0);
  };
  
  const handleStart = async () => {
    // Initialize sections
    const initialSections: GeneratedSection[] = content.sections.map(title => ({
      title,
      status: "pending" as const,
    }));
    setSections(initialSections);
    
    // Step 1: Analyzing client brief
    setStep("analyzing");
    for (let i = 0; i <= 20; i += 4) {
      setProgress(i);
      await simulateDelay(100);
    }
    
    // Step 2: Drafting sections
    setStep("drafting");
    for (let sectionIdx = 0; sectionIdx < initialSections.length; sectionIdx++) {
      setActiveSection(sectionIdx);
      
      // Update section to generating
      setSections(prev => prev.map((s, idx) => 
        idx === sectionIdx ? { ...s, status: "generating" as const } : s
      ));
      
      // Progress through section
      const baseProgress = 20 + (sectionIdx * 50 / initialSections.length);
      for (let i = 0; i <= 10; i += 2) {
        setProgress(Math.round(baseProgress + (i * 50 / initialSections.length / 10)));
        await simulateDelay(80);
      }
      
      // Complete section with preview
      const sectionPreviews: Record<string, string> = {
        "Executive Summary": `${company} requires a comprehensive solution to streamline operations and improve efficiency...`,
        "Understanding of Needs": `Based on our analysis, the key priorities for ${company} include operational excellence...`,
        "Scope of Works": "Phase 1: Discovery and Assessment | Phase 2: Implementation | Phase 3: Optimization",
        "Our Approach": "Leveraging industry best practices combined with AI-powered automation...",
        "Proposed Solution": "A tailored implementation designed for maximum ROI and minimal disruption...",
        "Project Team": "Senior Partner (oversight) | Project Lead | Delivery Team (3-5 specialists)",
        "Team Structure": "Senior Partner (oversight) | Project Lead | Delivery Team (3-5 specialists)",
        "Timeline & Milestones": "Kickoff → Discovery (2 weeks) → Implementation (8 weeks) → Go-live",
        "Program & Methodology": "Agile delivery with bi-weekly sprints and stakeholder checkpoints...",
        "Fee Schedule": content.pricingItems.map(p => `${p.item}: ${p.estimate}`).join(" | "),
        "Investment": content.pricingItems.map(p => `${p.item}: ${p.estimate}`).join(" | "),
        "Terms & Conditions": "Payment terms: 50% on commencement, 50% on completion...",
        "Why Choose Us": "15+ years experience | 200+ successful projects | Industry-leading expertise",
        "References": "Available upon request from similar ${industry} sector clients",
      };
      
      setSections(prev => prev.map((s, idx) => 
        idx === sectionIdx ? { 
          ...s, 
          status: "complete" as const,
          preview: sectionPreviews[s.title] || `Professionally drafted ${s.title.toLowerCase()} content...`
        } : s
      ));
    }
    
    // Step 3: Pricing
    setStep("pricing");
    for (let i = 70; i <= 85; i += 3) {
      setProgress(i);
      await simulateDelay(80);
    }
    
    // Step 4: Formatting
    setStep("formatting");
    for (let i = 85; i <= 100; i += 3) {
      setProgress(i);
      await simulateDelay(80);
    }
    
    // Complete
    setStep("complete");
    await simulateDelay(500);
    setShowComparison(true);
    onComplete?.();
  };
  
  const getStepLabel = () => {
    switch (step) {
      case "idle":
        return "Ready to generate proposal";
      case "analyzing":
        return "Analyzing client requirements...";
      case "drafting":
        return `Drafting section ${activeSection + 1} of ${content.sections.length}...`;
      case "pricing":
        return "Calculating pricing and estimates...";
      case "formatting":
        return "Formatting and finalizing document...";
      case "complete":
        return "Proposal ready";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="font-medium text-foreground">{content.proposalType} Generation</h4>
            <p className="text-sm text-muted-foreground">
              AI-drafted {content.proposalType.toLowerCase()} for {content.clientType}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {step === "idle" ? (
            <Button onClick={handleStart} size="sm" className="gap-2">
              <Play className="w-4 h-4" />
              Run Demo
            </Button>
          ) : step === "complete" ? (
            <Button onClick={handleReset} variant="outline" size="sm" className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
          ) : (
            <Button disabled size="sm" className="gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </Button>
          )}
        </div>
      </div>
      
      {/* Progress indicator */}
      {step !== "idle" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{getStepLabel()}</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}
      
      {/* Main content grid */}
      <div className="grid md:grid-cols-2 gap-6 min-h-[350px]">
        {/* Section List */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Document Sections</span>
          </div>
          
          <div className="space-y-2">
            {step === "idle" ? (
              content.sections.map((section, idx) => (
                <div
                  key={section}
                  className="flex items-center gap-3 p-2 rounded-lg text-sm text-muted-foreground"
                >
                  <div className="w-5 h-5 rounded-full border border-border flex items-center justify-center text-xs">
                    {idx + 1}
                  </div>
                  <span>{section}</span>
                </div>
              ))
            ) : (
              <AnimatePresence mode="popLayout">
                {sections.map((section, idx) => (
                  <motion.div
                    key={section.title}
                    initial={{ opacity: 0.5 }}
                    animate={{ 
                      opacity: section.status !== "pending" ? 1 : 0.5,
                    }}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg text-sm transition-colors",
                      section.status === "generating" && "bg-primary/5 border border-primary/20",
                      section.status === "complete" && "bg-green-500/5",
                      section.status === "pending" && "text-muted-foreground"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-xs",
                      section.status === "complete" && "bg-green-500 text-white",
                      section.status === "generating" && "bg-primary text-primary-foreground",
                      section.status === "pending" && "border border-border"
                    )}>
                      {section.status === "complete" ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : section.status === "generating" ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <span className={cn(
                      section.status === "complete" && "text-foreground",
                      section.status === "generating" && "text-primary font-medium"
                    )}>
                      {section.title}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
        
        {/* Preview / Pricing */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {step === "complete" ? "Fee Summary" : "Live Preview"}
            </span>
          </div>
          
          {step === "idle" ? (
            <div className="text-sm text-muted-foreground text-center py-12">
              Click "Run Demo" to generate proposal
            </div>
          ) : step === "complete" ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {/* Pricing summary */}
              <div className="space-y-3">
                {content.pricingItems.map((item, idx) => (
                  <motion.div
                    key={item.item}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
                  >
                    <div>
                      <div className="text-sm font-medium">{item.item}</div>
                      <div className="text-xs text-muted-foreground">{item.rate}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-primary">{item.estimate}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {/* Total */}
              <div className="pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total Investment</span>
                  <span className="text-lg font-bold text-primary">
                    {content.pricingItems[0]?.estimate || "As quoted"}
                  </span>
                </div>
              </div>
              
              {/* Ready indicator */}
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-500/10 rounded-lg p-3">
                <Send className="w-4 h-4" />
                <span>Proposal ready to send to client</span>
              </div>
            </motion.div>
          ) : (
            // Live generation preview
            <div className="space-y-3 max-h-[300px] overflow-auto">
              {sections.filter(s => s.status === "complete").map((section, idx) => (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-muted/30 border border-border"
                >
                  <div className="text-xs font-medium text-primary mb-1">{section.title}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2">{section.preview}</div>
                </motion.div>
              ))}
              
              {sections.find(s => s.status === "generating") && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2 text-xs text-primary">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Writing {sections.find(s => s.status === "generating")?.title}...</span>
                  </div>
                  <div className="mt-2 flex gap-1">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        className="w-2 h-2 rounded-full bg-primary"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Before/After Comparison */}
      {showComparison && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-4"
        >
          <BeforeAfterCompare
            title="Proposal Generation with alfred ai"
            items={[
              { label: "Draft Time", before: "4-6 hours", after: "10 minutes" },
              { label: "Pricing Accuracy", before: "Manual lookup", after: "Auto-calculated" },
              { label: "Formatting", before: "Template hunt", after: "Brand-ready" },
              { label: "Revisions", before: "Multiple rounds", after: "One-click updates" },
            ]}
          />
        </motion.div>
      )}
      
      {/* Completion CTA */}
      {step === "complete" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-2 text-sm text-primary"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{content.proposalType} generated with {sections.length} sections</span>
          <ArrowRight className="w-4 h-4" />
        </motion.div>
      )}
    </div>
  );
}
