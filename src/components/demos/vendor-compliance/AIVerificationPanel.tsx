import { useState } from "react";
import { IncomingDocument, getDocumentTypeLabel, FieldMatchDetail } from "./vendorComplianceData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Brain, 
  CheckCircle, 
  XCircle, 
  Eye, 
  MessageSquare,
  Mail,
  Phone,
  Cloud,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Send,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface AIVerificationPanelProps {
  document: IncomingDocument | null;
  onApprove: (doc: IncomingDocument) => void;
  onReject: (doc: IncomingDocument) => void;
  onRequestUpdate: (doc: IncomingDocument, channel: "email" | "sms" | "voice") => void;
  onSyncToSharePoint: (doc: IncomingDocument) => void;
  isProcessing: boolean;
}

export function AIVerificationPanel({ 
  document, 
  onApprove, 
  onReject, 
  onRequestUpdate,
  onSyncToSharePoint,
  isProcessing 
}: AIVerificationPanelProps) {
  const [selectedChannel, setSelectedChannel] = useState<"email" | "sms" | "voice">("email");

  if (!document) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground p-8">
          <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Select a document to see AI analysis</p>
        </div>
      </Card>
    );
  }

  const confidence = document.ai_confidence;
  const isHighConfidence = confidence >= 90;
  const isMediumConfidence = confidence >= 70 && confidence < 90;
  const extraction = document.extraction_result;
  const hasIssues = extraction?.issues && extraction.issues.length > 0;

  // Check if ALL field confidences are ≥90%
  const allFieldsHighConfidence = extraction && 
    extraction.field_confidence.vendor_name >= 90 &&
    extraction.field_confidence.expiry_date >= 90 &&
    extraction.field_confidence.policy_number >= 90 &&
    extraction.field_confidence.coverage >= 90;

  // Count fields below 90%
  const lowConfidenceFields = extraction ? [
    extraction.field_confidence.vendor_name < 90 ? "Vendor Match" : null,
    extraction.field_confidence.expiry_date < 90 ? "Expiry Date" : null,
    extraction.field_confidence.policy_number < 90 ? "Policy Number" : null,
    extraction.field_confidence.coverage < 90 ? "Coverage Amount" : null,
  ].filter(Boolean) : [];

  const getRecommendation = () => {
    if (allFieldsHighConfidence && !hasIssues) {
      return {
        action: "Auto-Approve",
        description: "All verification checks pass with ≥90% confidence. Eligible for auto-verification.",
        color: "emerald",
        icon: ThumbsUp,
      };
    }
    if (isMediumConfidence || hasIssues || lowConfidenceFields.length > 0) {
      const fieldNote = lowConfidenceFields.length > 0 
        ? `${lowConfidenceFields.length} field(s) below 90% threshold.`
        : "";
      return {
        action: "Manual Review",
        description: hasIssues 
          ? `${extraction?.issues.length} issue(s) require attention. ${fieldNote}`
          : `${fieldNote} Please verify extracted fields.`,
        color: "amber",
        icon: Eye,
      };
    }
    return {
      action: "Request Update",
      description: "Low confidence extraction. Request clearer document from vendor.",
      color: "rose",
      icon: ThumbsDown,
    };
  };

  const recommendation = getRecommendation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={document.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        className="h-full"
      >
        <Card id="vc-ai-panel" className="h-full flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              AI Verification
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-auto space-y-4">
            {/* Confidence Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Confidence Score</span>
                <span className={cn(
                  "text-lg font-bold",
                  isHighConfidence && "text-emerald-600 dark:text-emerald-400",
                  isMediumConfidence && "text-amber-600 dark:text-amber-400",
                  !isHighConfidence && !isMediumConfidence && "text-rose-600 dark:text-rose-400"
                )}>
                  {confidence}%
                </span>
              </div>
              <Progress 
                value={confidence} 
                className={cn(
                  "h-2",
                  isHighConfidence && "[&>div]:bg-emerald-500",
                  isMediumConfidence && "[&>div]:bg-amber-500",
                  !isHighConfidence && !isMediumConfidence && "[&>div]:bg-rose-500"
                )}
              />
            </div>

            <Separator />

            {/* Verification Checks */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                Verification Checks
              </h4>
              <TooltipProvider delayDuration={200}>
                <div className="space-y-2">
                  <VerificationCheck 
                    label="Vendor Match"
                    passed={document.matched_vendor !== undefined}
                    confidence={extraction?.field_confidence.vendor_name}
                    matchDetail={extraction?.match_details?.find(m => m.field === "vendor_name")}
                  />
                  <VerificationCheck 
                    label="Expiry Valid"
                    passed={extraction?.detected_expiry ? extraction.detected_expiry > new Date() : false}
                    confidence={extraction?.field_confidence.expiry_date}
                    matchDetail={extraction?.match_details?.find(m => m.field === "expiry_date")}
                  />
                  <VerificationCheck 
                    label="Policy Number"
                    passed={!!extraction?.detected_policy_number}
                    confidence={extraction?.field_confidence.policy_number}
                    matchDetail={extraction?.match_details?.find(m => m.field === "policy_number")}
                  />
                  <VerificationCheck 
                    label="Coverage Amount"
                    passed={!hasIssues || !extraction?.issues.some(i => i.type === "coverage_insufficient")}
                    confidence={extraction?.field_confidence.coverage}
                    matchDetail={extraction?.match_details?.find(m => m.field === "coverage")}
                  />
                  <VerificationCheck 
                    label="No Readability Issues"
                    passed={!hasIssues || !extraction?.issues.some(i => i.type === "unreadable")}
                  />
                </div>
              </TooltipProvider>
            </div>

            <Separator />

            {/* AI Recommendation */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                AI Recommendation
              </h4>
              <div className={cn(
                "rounded-lg p-4 border",
                recommendation.color === "emerald" && "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800",
                recommendation.color === "amber" && "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
                recommendation.color === "rose" && "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800"
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <recommendation.icon className={cn(
                    "w-5 h-5",
                    recommendation.color === "emerald" && "text-emerald-600 dark:text-emerald-400",
                    recommendation.color === "amber" && "text-amber-600 dark:text-amber-400",
                    recommendation.color === "rose" && "text-rose-600 dark:text-rose-400"
                  )} />
                  <span className="font-semibold">{recommendation.action}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {recommendation.description}
                </p>
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                Actions
              </h4>
              
              {/* Primary Actions */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="default"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => onApprove(document)}
                  disabled={isProcessing || document.status === "verified"}
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Approve
                </Button>
                <Button
                  variant="outline"
                  className="border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/30"
                  onClick={() => onReject(document)}
                  disabled={isProcessing || document.status === "rejected"}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>

              {/* Request Update */}
              {hasIssues && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Request updated document from vendor via:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={selectedChannel === "email" ? "default" : "outline"}
                      className="flex-1 min-w-[80px]"
                      onClick={() => setSelectedChannel("email")}
                    >
                      <Mail className="w-3 h-3 mr-1" />
                      Email
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedChannel === "sms" ? "default" : "outline"}
                      className="flex-1 min-w-[80px]"
                      onClick={() => setSelectedChannel("sms")}
                    >
                      <MessageSquare className="w-3 h-3 mr-1" />
                      SMS
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedChannel === "voice" ? "default" : "outline"}
                      className="flex-1 min-w-[80px]"
                      onClick={() => setSelectedChannel("voice")}
                    >
                      <Phone className="w-3 h-3 mr-1" />
                      Voice
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full"
                    onClick={() => onRequestUpdate(document, selectedChannel)}
                    disabled={isProcessing}
                  >
                    <Send className="w-3 h-3 mr-2" />
                    Send Request via {selectedChannel.toUpperCase()}
                  </Button>
                </div>
              )}

              {/* SharePoint Sync */}
              {document.status === "verified" && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => onSyncToSharePoint(document)}
                  disabled={isProcessing}
                >
                  <Cloud className="w-4 h-4 mr-2" />
                  Sync to SharePoint
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

interface VerificationCheckProps {
  label: string;
  passed: boolean;
  confidence?: number;
  matchDetail?: FieldMatchDetail;
}

function VerificationCheck({ label, passed, confidence, matchDetail }: VerificationCheckProps) {
  const isHighConfidence = confidence !== undefined && confidence >= 90;
  const isMediumConfidence = confidence !== undefined && confidence >= 70 && confidence < 90;
  
  const content = (
    <div className="flex items-center justify-between py-1.5 cursor-help min-h-[44px]">
      <div className="flex items-center gap-2">
        {passed ? (
          isHighConfidence ? (
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          ) : isMediumConfidence ? (
            <AlertCircle className="w-4 h-4 text-amber-500" />
          ) : (
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          )
        ) : (
          <XCircle className="w-4 h-4 text-rose-500" />
        )}
        <span className="text-sm">{label}</span>
      </div>
      {confidence !== undefined && (
        <Badge 
          variant="outline" 
          className={cn(
            "text-[10px]",
            isHighConfidence && "border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400",
            isMediumConfidence && "border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400",
            !isHighConfidence && !isMediumConfidence && confidence !== undefined && "border-rose-300 text-rose-700 dark:border-rose-700 dark:text-rose-400"
          )}
        >
          {confidence}%
        </Badge>
      )}
    </div>
  );

  // Show tooltip with match details
  if (matchDetail) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="touch-manipulation">{content}</div>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs p-3">
          <div className="space-y-2 text-xs">
            <p className={cn(
              "font-medium",
              matchDetail.matchType === "exact" && "text-emerald-600 dark:text-emerald-400",
              matchDetail.matchType === "fuzzy" && "text-amber-600 dark:text-amber-400",
              matchDetail.matchType === "partial" && "text-amber-600 dark:text-amber-400",
              matchDetail.matchType === "mismatch" && "text-rose-600 dark:text-rose-400"
            )}>
              {matchDetail.matchType === "exact" ? "✓ Exact Match" : 
               matchDetail.matchType === "fuzzy" ? "~ Fuzzy Match" : 
               matchDetail.matchType === "partial" ? "○ Partial Match" : "✗ Mismatch"}
            </p>
            <div className="space-y-1">
              <p><span className="text-muted-foreground">Extracted:</span> <span className="font-mono">{matchDetail.extracted}</span></p>
              <p><span className="text-muted-foreground">Expected:</span> <span className="font-mono">{matchDetail.expected}</span></p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

export default AIVerificationPanel;
