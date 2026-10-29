import { useState, useEffect } from "react";
import { 
  FileText, ClipboardCheck, Users, DollarSign, FileSignature, Sparkles,
  Workflow, BookOpen, MessageSquare, Phone, Search, Building2, BarChart3,
  Calendar, ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ContractSimulator } from "./simulators/ContractSimulator";
import { InspectionSimulator } from "./simulators/InspectionSimulator";
import { RecruitmentSimulator } from "./simulators/RecruitmentSimulator";
import { InvoiceSimulator } from "./simulators/InvoiceSimulator";
import { ProposalSimulator } from "./simulators/ProposalSimulator";
import { getBestSimulator, SimulatorType } from "./simulators/industryContent";
import { cn } from "@/lib/utils";
import { InlineDemoViewer } from "./InlineDemoViewer";

// Simple simulators are rendered inline, complex demos use InlineDemoViewer
type ExtendedSimulatorType = SimulatorType | "workflow-builder" | "knowledge" | "cx-agent" | "voice-agent" | "lead-research" | "procurement" | "subcontractor" | "property" | "bi-dashboard" | "purchase-bill-intake";

// Mapping from internal type to InlineDemoViewer demoKey
const DEMO_KEY_MAP: Record<string, string> = {
  "workflow-builder": "workflow-builder",
  "knowledge": "knowledge-synthesis",
  "cx-agent": "cx-agent",
  "voice-agent": "voice-agent",
  "lead-research": "lead-research",
  "procurement": "procurement",
  "subcontractor": "subcontractor-assignment",
  "property": "property-management",
  "bi-dashboard": "bi-dashboard",
  "purchase-bill-intake": "purchase-bill-intake",
};

const ALL_SIMULATORS: { type: ExtendedSimulatorType; name: string; icon: typeof FileText; isComplexDemo?: boolean }[] = [
  { type: "contract", name: "Contract Review", icon: FileText },
  { type: "inspection", name: "Site Inspection", icon: ClipboardCheck },
  { type: "recruitment", name: "Candidate Screening", icon: Users },
  { type: "invoice", name: "Invoice Processing", icon: DollarSign },
  { type: "proposal", name: "Fee Proposals", icon: FileSignature },
  { type: "workflow-builder", name: "Workflow Builder", icon: Workflow, isComplexDemo: true },
  { type: "knowledge", name: "Knowledge Synthesis", icon: BookOpen, isComplexDemo: true },
  { type: "cx-agent", name: "CX Agent", icon: MessageSquare, isComplexDemo: true },
  { type: "voice-agent", name: "Voice Agent", icon: Phone, isComplexDemo: true },
  { type: "lead-research", name: "Lead Research", icon: Search, isComplexDemo: true },
  { type: "procurement", name: "Procurement", icon: ClipboardCheck, isComplexDemo: true },
  { type: "subcontractor", name: "Subcontractor Matching", icon: Users, isComplexDemo: true },
  { type: "property", name: "Property Management", icon: Building2, isComplexDemo: true },
  { type: "bi-dashboard", name: "BI Dashboard", icon: BarChart3, isComplexDemo: true },
  { type: "purchase-bill-intake", name: "Purchase Bill Intake", icon: DollarSign, isComplexDemo: true },
];

interface WorkflowSimulatorProps {
  company: string;
  industry: string;
  workflows: string[];
  teamSize: string;
  primaryChallenge?: string;
  recommendedDemos?: string[];
  onDemoComplete?: () => void;
  onBookDemo?: () => void;
}

export function WorkflowSimulator({ 
  company, 
  industry, 
  workflows, 
  teamSize, 
  primaryChallenge,
  recommendedDemos,
  onDemoComplete,
  onBookDemo
}: WorkflowSimulatorProps) {
  const defaultSimulator = getBestSimulator(workflows, primaryChallenge, industry, recommendedDemos);
  const [activeSimulator, setActiveSimulator] = useState<ExtendedSimulatorType>(defaultSimulator);
  const [showHint, setShowHint] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [demoViewerOpen, setDemoViewerOpen] = useState(false);

  const currentInfo = ALL_SIMULATORS.find(s => s.type === activeSimulator) || ALL_SIMULATORS[0];

  // Hide hint after 8 seconds or when user interacts
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (val: string) => {
    const newSimulator = val as ExtendedSimulatorType;
    setActiveSimulator(newSimulator);
    setHasInteracted(true);
    setShowHint(false);
    
    // If it's a complex demo, open the viewer
    const simInfo = ALL_SIMULATORS.find(s => s.type === newSimulator);
    if (simInfo?.isComplexDemo) {
      setDemoViewerOpen(true);
    } else {
      setDemoViewerOpen(false);
    }
  };

  const renderSimulator = () => {
    // For complex demos, show a preview card that opens the full demo
    if (currentInfo.isComplexDemo) {
      const Icon = currentInfo.icon;
      return (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Icon className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">{currentInfo.name}</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            This is an interactive AI-powered demo. Click below to experience it.
          </p>
          <Button onClick={() => setDemoViewerOpen(true)} className="gap-2">
            <Sparkles className="w-4 h-4" />
            Launch Interactive Demo
          </Button>
        </div>
      );
    }

    // Simple simulators render inline
    switch (activeSimulator) {
      case "contract":
        return <ContractSimulator company={company} industry={industry} onComplete={onDemoComplete} />;
      case "inspection":
        return <InspectionSimulator company={company} industry={industry} onComplete={onDemoComplete} />;
      case "recruitment":
        return <RecruitmentSimulator company={company} industry={industry} onComplete={onDemoComplete} />;
      case "invoice":
        return <InvoiceSimulator company={company} industry={industry} onComplete={onDemoComplete} />;
      case "proposal":
        return <ProposalSimulator company={company} industry={industry} onComplete={onDemoComplete} />;
      default:
        return <ContractSimulator company={company} industry={industry} onComplete={onDemoComplete} />;
    }
  };

  const demoKey = DEMO_KEY_MAP[activeSimulator] || "";

  return (
    <>
      <Card className="border border-border bg-card">
        <CardHeader className="border-b border-border py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-semibold text-foreground">Live Workflow Demo</h3>
              <p className="text-sm text-muted-foreground">
                See alfred ai process real {company} workflows
              </p>
            </div>

            <div className="flex flex-col items-end gap-1">
              {/* Hint text with animation */}
              {showHint && !hasInteracted && (
                <div className="flex items-center gap-1.5 text-xs text-primary animate-fade-in">
                  <Sparkles className="w-3 h-3" />
                  <span>Try different demos!</span>
                </div>
              )}
              
              {/* Dropdown with attention-grabbing styles */}
              <div className={cn(
                "relative rounded-md transition-all duration-300",
                showHint && !hasInteracted && "ring-2 ring-primary/50 ring-offset-2 ring-offset-background animate-pulse"
              )}>
                <Select value={activeSimulator} onValueChange={handleChange}>
                  <SelectTrigger className={cn(
                    "w-[220px] bg-background transition-all duration-200",
                    showHint && !hasInteracted && "border-primary shadow-[0_0_12px_rgba(var(--primary),0.3)]"
                  )}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {ALL_SIMULATORS.map((sim) => {
                      const Icon = sim.icon;
                      return (
                        <SelectItem key={sim.type} value={sim.type}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {sim.name}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {renderSimulator()}
          
          {/* CTA Section */}
          {onBookDemo && (
            <div className="pt-6 border-t border-border">
              <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-xl p-5 text-center">
                <h3 className="text-base font-semibold text-foreground mb-1.5">
                  See this in action for {company}?
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Book a personalised demo tailored to your workflows.
                </p>
                <Button 
                  onClick={onBookDemo}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Book a Meeting
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Complex Demo Viewer Modal */}
      {currentInfo.isComplexDemo && demoKey && demoViewerOpen && (
        <InlineDemoViewer
          demoKey={demoKey}
          title={currentInfo.name}
          isOpen={demoViewerOpen}
          onClose={() => setDemoViewerOpen(false)}
        />
      )}
    </>
  );
}

export default WorkflowSimulator;
