import { useState, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { X, Loader2, Maximize2, Minimize2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
const AutoInvoicingDemo = lazy(() => import("@/components/demos/AutoInvoicingDemo"));
const WorkflowBuilderDemo = lazy(() => import("@/components/demos/WorkflowBuilderDemo"));
const ProcurementDemo = lazy(() => import("@/components/demos/ProcurementDemo"));
const TenderManagementDemo = lazy(() => import("@/components/demos/TenderManagementDemo"));
const SiteInspectionDemo = lazy(() => import("@/components/demos/SiteInspectionDemo"));
const SubcontractorAssignmentDemo = lazy(() => import("@/components/demos/SubcontractorAssignmentDemo"));
const PropertyManagementDemo = lazy(() => import("@/components/demos/PropertyManagementDemo"));
const CandidateMatchDemo = lazy(() => import("@/components/demos/CandidateMatchDemo"));
const InterviewScoringDemo = lazy(() => import("@/components/demos/InterviewScoringDemo"));
const KnowledgeSynthesisDemo = lazy(() => import("@/components/demos/KnowledgeSynthesisDemo"));
const BIDashboardDemo = lazy(() => import("@/components/demos/BIDashboardChart"));
const CXAgentDemo = lazy(() => import("@/components/demos/CXAgentDemo"));
const LeadResearchDemo = lazy(() => import("@/components/demos/LeadResearchDemo"));
const PlatformOverviewDemo = lazy(() => import("@/components/demos/PlatformOverviewDemo"));
const KnowledgeDemo = lazy(() => import("@/components/demos/KnowledgeDemo"));
const VoiceAgentDemo = lazy(() => import("@/components/demos/VoiceAgentDemo"));
const BusinessOSDemo = lazy(() => import("@/components/demos/BusinessOSDemo"));
const AlfredBIDDemo = lazy(() => import("@/components/demos/AlfredBIDDemo"));
const DrawingsToEstimateDemo = lazy(() => import("@/components/demos/DrawingsToEstimateDemo"));
const EmailTriageDemo = lazy(() => import("@/components/demos/EmailTriageDemo"));
const DEMO_COMPONENTS: Record<string, React.LazyExoticComponent<any>> = {
  "contract-review": ContractReviewDemo,
  "fee-proposal": FeeProposalDemo,
  "auto-invoicing": AutoInvoicingDemo,
  "workflow-builder": WorkflowBuilderDemo,
  "procurement": ProcurementDemo,
  "tender-management": TenderManagementDemo,
  "site-inspection": SiteInspectionDemo,
  "subcontractor-assignment": SubcontractorAssignmentDemo,
  "property-management": PropertyManagementDemo,
  "candidate-match": CandidateMatchDemo,
  "interview-scoring": InterviewScoringDemo,
  "knowledge-synthesis": KnowledgeSynthesisDemo,
  "bi-dashboard": BusinessOSDemo,
  "cx-agent": CXAgentDemo,
  "lead-research": LeadResearchDemo,
  "platform-overview": PlatformOverviewDemo,
  "knowledge-base": KnowledgeDemo,
  "voice-agent": VoiceAgentDemo,
  "alfred-bid": AlfredBIDDemo,
  "drawings-to-estimate": DrawingsToEstimateDemo,
  "email-triage": EmailTriageDemo,
  // purchase-bill-intake removed - uses dedicated full-screen page at /demos/purchase-bill-intake
};

interface InlineDemoViewerProps {
  demoKey: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

export function InlineDemoViewer({ demoKey, title, isOpen, onClose }: InlineDemoViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const DemoComponent = DEMO_COMPONENTS[demoKey];

  const handleCloseClick = () => {
    setShowCloseConfirm(true);
  };

  const handleConfirmClose = () => {
    setShowCloseConfirm(false);
    setIsFullscreen(false);
    onClose();
  };

  const handleCancelClose = () => {
    setShowCloseConfirm(false);
  };

  if (!DemoComponent) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "overflow-hidden",
              isFullscreen && "fixed inset-0 z-50 bg-background p-4"
            )}
          >
            <div className={cn(
              "bg-card rounded-xl border border-border shadow-lg",
              isFullscreen ? "h-full flex flex-col" : "mt-4"
            )}>
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-semibold text-lg">{title} Demo</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                  >
                    {isFullscreen ? (
                      <Minimize2 className="w-4 h-4" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleCloseClick}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Demo Content - Fixed height to prevent size changes */}
              <div className={cn(
                "p-4 overflow-auto",
                isFullscreen ? "flex-1" : "min-h-[500px] max-h-[80vh]"
              )}>
                <Suspense fallback={
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Loading demo...</span>
                  </div>
                }>
                  <DemoComponent />
                </Suspense>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Close Demo?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to close this demo? Any progress or interaction will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelClose}>Continue Exploring</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClose}>Close Demo</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default InlineDemoViewer;
