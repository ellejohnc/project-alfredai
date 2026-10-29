import { useState } from "react";
import { FileText, CheckCircle2, AlertTriangle, DollarSign, Loader2, RotateCcw, Play, FileCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { getIndustryContent, type IndustryInvoiceContent } from "./industryContent";
import { BeforeAfterCompare } from "./BeforeAfterCompare";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";

interface InvoiceSimulatorProps {
  company: string;
  industry: string;
  onComplete?: () => void;
}

type SimulationStep = "idle" | "uploading" | "extracting" | "matching" | "validating" | "complete";

interface ExtractedData {
  vendor: string;
  invoiceNumber: string;
  date: string;
  total: number;
  lineItems: Array<{ description: string; amount: number; category: string }>;
}

interface ValidationResult {
  check: string;
  status: "pass" | "fail" | "warning";
  detail: string;
}

export function InvoiceSimulator({ company, industry, onComplete }: InvoiceSimulatorProps) {
  const [step, setStep] = useState<SimulationStep>("idle");
  const [progress, setProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  
  const content = getIndustryContent(industry).invoice;
  
  const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  const handleReset = () => {
    setStep("idle");
    setProgress(0);
    setExtractedData(null);
    setValidationResults([]);
    setShowComparison(false);
  };
  
  const handleStart = async () => {
    // Step 1: Uploading
    setStep("uploading");
    for (let i = 0; i <= 30; i += 5) {
      setProgress(i);
      await simulateDelay(80);
    }
    
    // Step 2: Extracting
    setStep("extracting");
    for (let i = 30; i <= 60; i += 3) {
      setProgress(i);
      await simulateDelay(100);
    }
    
    // Generate extracted data from industry content
    const totalAmount = content.lineItems.reduce((sum, item) => sum + item.amount, 0);
    setExtractedData({
      vendor: `${content.vendorType} - ABC Services`,
      invoiceNumber: `INV-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      date: new Date().toLocaleDateString(),
      total: totalAmount,
      lineItems: content.lineItems,
    });
    
    // Step 3: Matching
    setStep("matching");
    for (let i = 60; i <= 80; i += 4) {
      setProgress(i);
      await simulateDelay(120);
    }
    
    // Step 4: Validating
    setStep("validating");
    for (let i = 80; i <= 100; i += 5) {
      setProgress(i);
      await simulateDelay(100);
    }
    
    // Generate validation results
    setValidationResults([
      { check: content.validationChecks[0] || "PO Match", status: "pass", detail: "Matched to PO-2024-0892" },
      { check: content.validationChecks[1] || "Amount Verification", status: "pass", detail: "Within 2% tolerance" },
      { check: content.validationChecks[2] || "Duplicate Check", status: "pass", detail: "No duplicates found" },
      { check: content.validationChecks[3] || "Approval Status", status: "warning", detail: "Pending manager approval" },
    ]);
    
    // Complete
    setStep("complete");
    await simulateDelay(500);
    setShowComparison(true);
    onComplete?.();
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount);
  };
  
  const getStatusIcon = (status: ValidationResult["status"]) => {
    switch (status) {
      case "pass":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "fail":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };
  
  const getStepLabel = () => {
    switch (step) {
      case "idle":
        return "Ready to process";
      case "uploading":
        return "Uploading document...";
      case "extracting":
        return "Extracting line items with OCR...";
      case "matching":
        return "Matching to purchase orders...";
      case "validating":
        return "Running validation checks...";
      case "complete":
        return "Processing complete";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="font-medium text-foreground">{content.documentType} Processing</h4>
            <p className="text-sm text-muted-foreground">
              Automated {content.vendorType.toLowerCase()} invoice processing for {company}
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
              Processing...
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
        {/* Invoice Preview */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Invoice Preview</span>
          </div>
          
          <div className="bg-muted/30 rounded-lg p-4 space-y-4">
            {/* Simulated invoice header */}
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs text-muted-foreground">From</div>
                <div className="font-medium text-sm">
                  {step !== "idle" && extractedData ? extractedData.vendor : "ABC Services Pty Ltd"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Invoice #</div>
                <div className="font-mono text-sm">
                  {step !== "idle" && extractedData ? extractedData.invoiceNumber : "INV-XXXXXX"}
                </div>
              </div>
            </div>
            
            {/* Line items */}
            <div className="border-t border-border pt-3 space-y-2">
              {content.lineItems.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0.5 }}
                  animate={{ 
                    opacity: step === "extracting" || step === "matching" || step === "validating" || step === "complete" ? 1 : 0.5,
                    backgroundColor: step === "extracting" && progress > 40 + idx * 5 ? "rgba(var(--primary), 0.1)" : "transparent"
                  }}
                  className="flex justify-between text-sm py-1 px-2 rounded transition-colors"
                >
                  <span className="text-muted-foreground truncate flex-1">{item.description}</span>
                  <span className="font-medium ml-2">{formatCurrency(item.amount)}</span>
                </motion.div>
              ))}
            </div>
            
            {/* Total */}
            <div className="border-t border-border pt-3 flex justify-between font-medium">
              <span>Total</span>
              <span className="text-primary">
                {formatCurrency(content.lineItems.reduce((sum, item) => sum + item.amount, 0))}
              </span>
            </div>
          </div>
        </div>
        
        {/* Validation Results */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <FileCheck className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">AI Validation</span>
          </div>
          
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {step === "idle" ? (
                <div className="text-sm text-muted-foreground text-center py-8">
                  Click "Run Demo" to start processing
                </div>
              ) : step === "complete" ? (
                validationResults.map((result, idx) => (
                  <motion.div
                    key={result.check}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border",
                      result.status === "pass" && "border-green-500/20 bg-green-500/5",
                      result.status === "fail" && "border-red-500/20 bg-red-500/5",
                      result.status === "warning" && "border-yellow-500/20 bg-yellow-500/5"
                    )}
                  >
                    {getStatusIcon(result.status)}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{result.check}</div>
                      <div className="text-xs text-muted-foreground">{result.detail}</div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="space-y-3">
                  {content.validationChecks.slice(0, 4).map((check, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30"
                    >
                      {progress > 80 + idx * 5 ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                      )}
                      <span className="text-sm text-muted-foreground">{check}</span>
                    </div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>
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
            title="Time Savings with alfred ai"
            items={[
              { label: "Processing Time", before: "45 min", after: "2 min" },
              { label: "Data Entry Errors", before: "8%", after: "0.1%" },
              { label: "Approval Routing", before: "Manual email", after: "Automated" },
              { label: "PO Matching", before: "15 min lookup", after: "Instant" },
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
          <span>Invoice processed and ready for approval</span>
          <ArrowRight className="w-4 h-4" />
        </motion.div>
      )}
    </div>
  );
}
