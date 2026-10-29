import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import {
  X,
  FileText,
  ExternalLink,
  Download,
  Users,
  PenTool,
  Send,
  Receipt,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useIsMobile } from "@/hooks/use-mobile";
import { WorkflowStatusStepper } from "./WorkflowStatusStepper";
import { InvoicePreview } from "./InvoicePreview";
import { MOCK_INVOICE_ITEMS } from "./mockInvoiceItems";
import { EmailDraftPreview } from "./EmailDraftPreview";
import { PROFESSIONAL_ROLES, getDataForRole } from "./demoData";
import type { WorkflowStep } from "./types";

interface ReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRole: string;
}

const INITIAL_WORKFLOW_STEPS: WorkflowStep[] = [
  { id: "draft", label: "Draft Created", status: "complete", timestamp: "Just now" },
  { id: "review", label: "Internal Review", status: "pending" },
  { id: "sign", label: "Signed & Approved", status: "pending" },
  { id: "send", label: "Sent to Client", status: "pending" },
  { id: "invoice", label: "Invoiced", status: "pending" },
  { id: "complete", label: "Completed", status: "pending" },
];

export function ReportPreviewModal({
  isOpen,
  onClose,
  selectedRole,
}: ReportPreviewModalProps) {
  const isMobile = useIsMobile();
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>(INITIAL_WORKFLOW_STEPS);
  const [currentWorkflowIndex, setCurrentWorkflowIndex] = useState(0);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [inlineMessage, setInlineMessage] = useState<string | null>(null);

  useBodyScrollLock(isOpen);

  // Reset workflow when modal opens
  useEffect(() => {
    if (isOpen) {
      setWorkflowSteps(INITIAL_WORKFLOW_STEPS);
      setCurrentWorkflowIndex(0);
      setShowInvoice(false);
      setShowEmail(false);
      setInlineMessage(null);
    }
  }, [isOpen]);

  // Clear inline message after delay
  useEffect(() => {
    if (inlineMessage) {
      const timer = setTimeout(() => setInlineMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [inlineMessage]);

  const role = PROFESSIONAL_ROLES.find(r => r.id === selectedRole) || PROFESSIONAL_ROLES[0];

  const advanceWorkflow = () => {
    if (currentWorkflowIndex >= workflowSteps.length - 1) return;

    const nextIndex = currentWorkflowIndex + 1;
    const updatedSteps = workflowSteps.map((step, i) => {
      if (i < nextIndex) return { ...step, status: "complete" as const, timestamp: "Just now" };
      if (i === nextIndex) return { ...step, status: "active" as const };
      return step;
    });

    setWorkflowSteps(updatedSteps);
    setCurrentWorkflowIndex(nextIndex);

    // Show appropriate content based on step
    const stepId = updatedSteps[nextIndex].id;
    if (stepId === "invoice") {
      setShowInvoice(true);
      setShowEmail(false);
    } else if (stepId === "complete") {
      setShowEmail(true);
    }

    // Show inline message next to button
    const messages: Record<string, string> = {
      review: "✓ Report sent for internal review",
      sign: "✓ Digital signature captured",
      send: "✓ Report sent to client portal",
      invoice: "✓ Invoice generated automatically",
      complete: "✓ Workflow complete! Email draft ready",
    };

    setInlineMessage(messages[stepId] || "✓ Step complete");
  };

  const getNextButtonText = () => {
    const nextStep = workflowSteps[currentWorkflowIndex + 1];
    if (!nextStep) return "Complete";

    const labels: Record<string, string> = {
      review: "Send for Internal Review",
      sign: "Approve & Sign",
      send: "Send to Client",
      invoice: "Trigger Invoice",
      complete: "Generate Email Draft",
    };
    return labels[nextStep.id] || "Next";
  };

  const getNextButtonIcon = () => {
    const nextStep = workflowSteps[currentWorkflowIndex + 1];
    if (!nextStep) return CheckCircle2;

    const icons: Record<string, typeof Users> = {
      review: Users,
      sign: PenTool,
      send: Send,
      invoice: Receipt,
      complete: Mail,
    };
    return icons[nextStep.id] || CheckCircle2;
  };

  if (!isOpen) return null;

  const NextIcon = getNextButtonIcon();
  const isComplete = currentWorkflowIndex >= workflowSteps.length - 1;

  // Get role-specific data
  const roleData = getDataForRole(selectedRole);

  // Calculate compliance summary using role-specific compliance data
  const complianceSummary = {
    passed: roleData.compliance.filter(c => c.status === "pass").length,
    failed: roleData.compliance.filter(c => c.status === "fail").length,
    review: roleData.compliance.filter(c => c.status === "review").length,
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Technical Inspection Report</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-[10px]">
                    v2.0 Final
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {role.label} • {role.standards[0]}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-1 h-8 hidden sm:flex"
                onClick={() => {
                  toast({
                    title: "Demo Feature",
                    description: "In the full product, this would download the report as PDF.",
                  });
                }}
              >
                <Download className="w-3.5 h-3.5" />
                <span className="text-xs">Download</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-1 h-8 hidden sm:flex"
                onClick={() => {
                  toast({
                    title: "Demo Feature",
                    description: "In the full product, this would open the report in a new tab.",
                  });
                }}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="text-xs">Open</span>
              </Button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Workflow Stepper */}
          <div className="p-4 border-b border-border bg-muted/20 shrink-0">
            <WorkflowStatusStepper
              steps={workflowSteps}
              currentStepIndex={currentWorkflowIndex}
            />
          </div>

          {/* Content */}
          <ScrollArea className="flex-1">
            <div className={`p-4 ${isMobile ? 'space-y-4' : 'grid grid-cols-2 gap-4'}`}>
              {/* Report Preview */}
              <div className="space-y-4">
                {/* Compliance Summary */}
                <div className="bg-muted/30 border border-border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-foreground">Compliance Status</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      <span className="text-muted-foreground">{complianceSummary.passed} Passed</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-500" />
                      <span className="text-muted-foreground">{complianceSummary.failed} Failed</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      <span className="text-muted-foreground">{complianceSummary.review} Review</span>
                    </div>
                  </div>
                </div>

                {/* Report Sections - role-specific */}
                {roleData.reportSections.slice(0, 3).map((section) => (
                  <div
                    key={section.id}
                    className="border border-border rounded-lg overflow-hidden"
                  >
                    <div className="px-3 py-2 bg-muted/30 border-b border-border">
                      <h4 className="text-xs font-semibold text-foreground">{section.title}</h4>
                    </div>
                    <div className="p-3">
                      <div className="text-xs text-muted-foreground line-clamp-4">
                        {section.content.split('\n').slice(0, 2).map((line, i) => (
                          <p key={i} className="mb-1">
                            {line.replace(/^#+\s*/, '').replace(/\*\*/g, '')}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Workflow Actions / Invoice / Email */}
              <div className="space-y-4">
                {showInvoice && (
                  <InvoicePreview
                    invoiceNumber="INV-2025-0042"
                    clientName="Industrial Facility Pty Ltd"
                    items={MOCK_INVOICE_ITEMS}
                    onExportToXero={() => {
                      toast({
                        title: "Demo Feature",
                        description: "In the full product, this would sync the invoice to your Xero account.",
                      });
                    }}
                  />
                )}

                {showEmail && (
                  <EmailDraftPreview
                    recipientName="John Mitchell"
                    recipientEmail="j.mitchell@facility.com"
                    reportTitle="Quarterly Technical Inspection Report"
                    findings={[
                      "Electrical Panel B3 requires immediate attention",
                      "HVAC vibration indicates potential bearing failure",
                      "3 compliance items passed, 1 failed, 2 under review",
                    ]}
                    onOpenInClient={() => {
                      toast({
                        title: "Demo Feature",
                        description: "In the full product, this would open your default email client with the draft ready to send.",
                      });
                    }}
                  />
                )}

                {!showInvoice && !showEmail && (
                  <div className="bg-muted/30 border border-border rounded-lg p-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <NextIcon className="w-6 h-6 text-primary" />
                    </div>
                    <h4 className="text-sm font-semibold text-foreground mb-1">
                      {isComplete ? "Workflow Complete!" : "Continue Workflow"}
                    </h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      {isComplete
                        ? "All steps completed successfully. The report is now ready."
                        : "Click the button below to proceed to the next step."}
                    </p>
                    {!isComplete && (
                      <div className="space-y-2">
                        <Button onClick={advanceWorkflow} className="gap-2 min-h-[44px]">
                          <NextIcon className="w-4 h-4" />
                          {getNextButtonText()}
                        </Button>
                        {/* Inline success message */}
                        <AnimatePresence mode="wait">
                          {inlineMessage && (
                            <motion.p
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 5 }}
                              className="text-xs text-emerald-600 font-medium"
                            >
                              {inlineMessage}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                )}

                {/* Progress summary */}
                <div className="bg-muted/30 border border-border rounded-lg p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Workflow Progress</span>
                    <span className="font-semibold text-foreground">
                      {workflowSteps.filter(s => s.status === "complete").length}/{workflowSteps.length}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(workflowSteps.filter(s => s.status === "complete").length / workflowSteps.length) * 100}%`,
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-border bg-muted/20 shrink-0">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={onClose} className="min-h-[44px]">
                Close Preview
              </Button>
              <div className="flex items-center gap-3">
                {/* Inline success message */}
                <AnimatePresence mode="wait">
                  {inlineMessage && (
                    <motion.span
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="text-xs text-emerald-600 font-medium whitespace-nowrap"
                    >
                      {inlineMessage}
                    </motion.span>
                  )}
                </AnimatePresence>
                {!isComplete && (
                  <Button onClick={advanceWorkflow} className="gap-2 min-h-[44px]">
                    <NextIcon className="w-4 h-4" />
                    {getNextButtonText()}
                  </Button>
                )}
                {isComplete && (
                  <div className="flex items-center gap-2 text-xs text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>All steps completed</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
