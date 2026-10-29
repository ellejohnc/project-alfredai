import { useState, lazy, Suspense, useCallback } from "react";
import { motion } from "framer-motion";
import { SafeAnimatePresence } from "@/components/ui/safe-animate-presence";
import { 
  Play, Maximize2, Minimize2, X, Loader2,
  FileText, Users, DollarSign, ClipboardCheck, Search, 
  MessageSquare, Phone, Building2, Workflow, BookOpen, BarChart3,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Lazy load demo components
const ContractReviewDemo = lazy(() => import("@/components/demos/ContractReviewDemo"));
const FeeProposalDemo = lazy(() => import("@/components/demos/FeeProposalDemo"));
const CandidateMatchDemo = lazy(() => import("@/components/demos/CandidateMatchDemo"));
const SiteInspectionDemo = lazy(() => import("@/components/demos/SiteInspectionDemo"));
const AutoInvoicingDemo = lazy(() => import("@/components/demos/AutoInvoicingDemo"));
const WorkflowBuilderDemo = lazy(() => import("@/components/demos/WorkflowBuilderDemo"));
const KnowledgeSynthesisDemo = lazy(() => import("@/components/demos/KnowledgeSynthesisDemo"));
const CXAgentDemo = lazy(() => import("@/components/demos/CXAgentDemo"));
const VoiceAgentDemo = lazy(() => import("@/components/demos/VoiceAgentDemo"));
const LeadResearchDemo = lazy(() => import("@/components/demos/LeadResearchDemo"));
const ProcurementDemo = lazy(() => import("@/components/demos/ProcurementDemo"));
const TenderManagementDemo = lazy(() => import("@/components/demos/TenderManagementDemo"));
const SubcontractorAssignmentDemo = lazy(() => import("@/components/demos/SubcontractorAssignmentDemo"));
const PropertyManagementDemo = lazy(() => import("@/components/demos/PropertyManagementDemo"));
const BIDashboardDemo = lazy(() => import("@/components/demos/BusinessOSDemo"));

interface DemoShowcaseProps {
  workflows: string[];
  recommendedDemos: string[];
  company: string;
  industry: string;
}

type DemoConfig = {
  key: string;
  title: string;
  description: string;
  icon: typeof FileText;
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  matchWorkflows: string[];
};

const DEMO_CONFIGS: DemoConfig[] = [
  {
    key: "contract-review",
    title: "Contract Review AI",
    description: "AI-powered clause analysis and risk detection",
    icon: FileText,
    component: ContractReviewDemo,
    matchWorkflows: ["Contract Review", "Document Analysis", "Due Diligence"]
  },
  {
    key: "fee-proposal",
    title: "Fee Proposal Generator",
    description: "Automated proposal creation from RFPs",
    icon: DollarSign,
    component: FeeProposalDemo,
    matchWorkflows: ["Fee Proposals", "Client Reports"]
  },
  {
    key: "candidate-match",
    title: "Candidate Matching",
    description: "AI talent matching and screening",
    icon: Users,
    component: CandidateMatchDemo,
    matchWorkflows: ["Candidate Screening", "Candidate Matching", "Interview Scheduling"]
  },
  {
    key: "site-inspection",
    title: "Site Inspection AI",
    description: "Automated defect detection and reporting",
    icon: ClipboardCheck,
    component: SiteInspectionDemo,
    matchWorkflows: ["Site Inspections", "Quality Control"]
  },
  {
    key: "auto-invoicing",
    title: "Auto Invoicing",
    description: "Smart invoice generation and processing",
    icon: DollarSign,
    component: AutoInvoicingDemo,
    matchWorkflows: ["Invoice Processing", "Expense Management"]
  },
  {
    key: "workflow-builder",
    title: "Workflow Builder",
    description: "Visual automation designer",
    icon: Workflow,
    component: WorkflowBuilderDemo,
    matchWorkflows: ["Workflow Automation", "Process Automation"]
  },
  {
    key: "knowledge-synthesis",
    title: "Knowledge Synthesis",
    description: "Document analysis and insights",
    icon: BookOpen,
    component: KnowledgeSynthesisDemo,
    matchWorkflows: ["Knowledge Synthesis", "Knowledge Management", "Research"]
  },
  {
    key: "cx-agent",
    title: "CX Agent",
    description: "AI customer support assistant",
    icon: MessageSquare,
    component: CXAgentDemo,
    matchWorkflows: ["Customer Support", "Client Communications", "Tenant Communications"]
  },
  {
    key: "voice-agent",
    title: "Voice Agent",
    description: "AI phone assistant",
    icon: Phone,
    component: VoiceAgentDemo,
    matchWorkflows: ["Customer Support", "Interview Scheduling"]
  },
  {
    key: "lead-research",
    title: "Lead Research",
    description: "Automated prospect intelligence",
    icon: Search,
    component: LeadResearchDemo,
    matchWorkflows: ["Lead Research", "Background Checks"]
  },
  {
    key: "procurement",
    title: "Procurement Assistant",
    description: "Automated POs and approvals",
    icon: ClipboardCheck,
    component: ProcurementDemo,
    matchWorkflows: ["Procurement", "Supplier Management", "Inventory"]
  },
  {
    key: "tender-management",
    title: "Tender Management",
    description: "RFQ/RFP generation, bid comparison & awards",
    icon: FileText,
    component: TenderManagementDemo,
    matchWorkflows: ["Tender Management", "RFQ/RFP", "Bid Evaluation", "Supplier Selection"]
  },
  {
    key: "subcontractor-assignment",
    title: "Subcontractor Assignment",
    description: "Smart matching and availability",
    icon: Users,
    component: SubcontractorAssignmentDemo,
    matchWorkflows: ["Subcontractor Management", "Project Scheduling"]
  },
  {
    key: "property-management",
    title: "Property Management",
    description: "Tenant comms and maintenance",
    icon: Building2,
    component: PropertyManagementDemo,
    matchWorkflows: ["Property Management", "Lease Administration"]
  },
  {
    key: "bi-dashboard",
    title: "BI Dashboard",
    description: "Real-time business analytics",
    icon: BarChart3,
    component: BIDashboardDemo,
    matchWorkflows: ["Report Generation", "Compliance Reporting"]
  }
];

export function DemoShowcase({ workflows, recommendedDemos, company, industry }: DemoShowcaseProps) {
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const handleBackdropClick = useCallback(() => {
    setShowCloseConfirm(true);
  }, []);

  const handleConfirmClose = useCallback(() => {
    setShowCloseConfirm(false);
    setActiveDemo(null);
  }, []);

  const handleCancelClose = useCallback(() => {
    setShowCloseConfirm(false);
  }, []);

  // Get relevant demos based on selected workflows
  const getRelevantDemos = (): DemoConfig[] => {
    const relevantDemos: DemoConfig[] = [];
    const addedKeys = new Set<string>();

    // First, add demos that match selected workflows
    workflows.forEach(workflow => {
      DEMO_CONFIGS.forEach(demo => {
        if (demo.matchWorkflows.includes(workflow) && !addedKeys.has(demo.key)) {
          relevantDemos.push(demo);
          addedKeys.add(demo.key);
        }
      });
    });

    // Then, add recommended demos if we don't have enough
    recommendedDemos.forEach(demoKey => {
      const demo = DEMO_CONFIGS.find(d => d.key === demoKey);
      if (demo && !addedKeys.has(demo.key)) {
        relevantDemos.push(demo);
        addedKeys.add(demo.key);
      }
    });

    return relevantDemos.slice(0, 6);
  };

  const relevantDemos = getRelevantDemos();
  const activeDemoConfig = DEMO_CONFIGS.find(d => d.key === activeDemo);

  return (
    <>
      <Card className="border border-border bg-muted/5">
        <CardHeader className="border-b border-border bg-muted/20 py-4">
          <div>
            <CardTitle className="text-lg text-foreground">Explore More Demos</CardTitle>
            <p className="text-sm text-muted-foreground">
              Solutions matched to your workflows
            </p>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {relevantDemos.map((demo, index) => (
              <motion.div
                key={demo.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className={cn(
                    "cursor-pointer transition-all border-border bg-muted/10 hover:bg-muted/30",
                    activeDemo === demo.key && "border-muted-foreground"
                  )}
                  onClick={() => setActiveDemo(demo.key)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-md flex items-center justify-center border border-border bg-muted/30 text-muted-foreground">
                        <demo.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-foreground">{demo.title}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {demo.description}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-3 gap-2 text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDemo(demo.key);
                      }}
                    >
                      <Play className="w-3 h-3" />
                      Try Demo
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Demo Modal */}
      <SafeAnimatePresence>
        {activeDemo && activeDemoConfig && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4",
              isFullscreen && "p-0"
            )}
            onClick={handleBackdropClick}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={cn(
                "bg-card rounded-2xl overflow-hidden shadow-2xl",
                isFullscreen 
                  ? "w-full h-full rounded-none" 
                  : "max-w-5xl w-full max-h-[90vh]"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md flex items-center justify-center border border-border bg-muted/30 text-muted-foreground">
                    <activeDemoConfig.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{activeDemoConfig.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      Demo for {company}
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-2 text-muted-foreground">
                    Interactive
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="text-muted-foreground"
                  >
                    {isFullscreen ? (
                      <Minimize2 className="w-4 h-4" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBackdropClick}
                    className="text-muted-foreground"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Demo content - Fixed min-height to prevent size changes */}
              <div className={cn(
                "overflow-auto",
                isFullscreen ? "h-[calc(100%-60px)]" : "min-h-[500px] max-h-[calc(90vh-60px)]"
              )}>
                <Suspense fallback={
                  <div className="flex items-center justify-center h-96">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                }>
                  <activeDemoConfig.component />
                </Suspense>
              </div>
            </motion.div>
          </motion.div>
        )}
      </SafeAnimatePresence>

      {/* Close Confirmation Dialog */}
      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-muted-foreground" />
              Close Demo?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to close this demo? Any progress in the demo will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelClose}>
              Continue Demo
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClose}>
              Close Demo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default DemoShowcase;
