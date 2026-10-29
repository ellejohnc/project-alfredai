import { useState } from "react";
import { 
  IncomingDocument, 
  formatFileSize, 
  getDocumentTypeLabel,
  formatDate,
  formatCurrency
} from "./vendorComplianceData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Mail, 
  Calendar, 
  Building2, 
  Hash, 
  DollarSign,
  Shield,
  User,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { DocumentPreviewModal } from "./DocumentPreviewModal";

interface DocumentDetailPanelProps {
  document: IncomingDocument | null;
}

export function DocumentDetailPanel({ document }: DocumentDetailPanelProps) {
  const [previewOpen, setPreviewOpen] = useState(false);

  if (!document) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground p-8">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Select a document to view details</p>
        </div>
      </Card>
    );
  }

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 90) {
      return (
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          <CheckCircle className="w-3 h-3 mr-1" />
          High Confidence ({confidence}%)
        </Badge>
      );
    }
    if (confidence >= 70) {
      return (
        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          <Eye className="w-3 h-3 mr-1" />
          Review Needed ({confidence}%)
        </Badge>
      );
    }
    return (
      <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Low Confidence ({confidence}%)
      </Badge>
    );
  };

  const extraction = document.extraction_result;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={document.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="h-full"
      >
        <Card id="vc-document-detail" className="h-full flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base truncate" title={document.attachment_name}>
                  {document.attachment_name}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatFileSize(document.file_size)} • {document.file_type.toUpperCase()}
                </p>
              </div>
              {getConfidenceBadge(document.ai_confidence)}
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-auto space-y-4">
            {/* Document Preview - Clickable */}
            <button
              onClick={() => setPreviewOpen(true)}
              className="w-full bg-muted/50 rounded-lg p-6 flex items-center justify-center border-2 border-dashed border-muted-foreground/20 cursor-pointer hover:bg-muted/70 hover:border-primary/30 transition-colors group min-h-[44px]"
            >
              <div className="text-center">
                <FileText className="w-16 h-16 mx-auto text-muted-foreground/40 mb-2 group-hover:text-primary/60 transition-colors" />
                <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors flex items-center justify-center gap-1">
                  Click to Preview Document
                  <ExternalLink className="w-3 h-3" />
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {document.matched_document_type ? getDocumentTypeLabel(document.matched_document_type) : "Unknown Type"}
                </p>
              </div>
            </button>

            <Separator />

            {/* Email Source */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                Source
              </h4>
              <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{document.from_name || "Unknown"}</span>
                </div>
                <div className="text-xs text-muted-foreground pl-6">
                  {document.from_email}
                </div>
                {document.subject && (
                  <div className="text-xs text-muted-foreground pl-6 italic">
                    "{document.subject}"
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground pl-6">
                  <Clock className="w-3 h-3" />
                  {formatDate(document.received_at)} at {document.received_at.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>

            <Separator />

            {/* Extracted Fields */}
            {extraction && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  AI Extracted Fields
                </h4>
                
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                  {/* Vendor Name */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Building2 className="w-3 h-3" />
                      <span>Vendor Name</span>
                      <Badge variant="outline" className="ml-auto text-[10px] h-4 whitespace-nowrap">
                        {extraction.field_confidence.vendor_name || 0}%
                      </Badge>
                    </div>
                    <p className="text-sm font-medium truncate" title={extraction.detected_vendor_name}>
                      {extraction.detected_vendor_name}
                    </p>
                  </div>

                  {/* Document Type */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Shield className="w-3 h-3" />
                      <span>Document Type</span>
                    </div>
                    <p className="text-sm font-medium">
                      {getDocumentTypeLabel(extraction.detected_type)}
                    </p>
                  </div>

                  {/* Expiry Date */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>Expiry Date</span>
                      <Badge variant="outline" className="ml-auto text-[10px] h-4 whitespace-nowrap">
                        {extraction.field_confidence.expiry_date || 0}%
                      </Badge>
                    </div>
                    <p className={cn(
                      "text-sm font-medium",
                      extraction.detected_expiry && extraction.detected_expiry > new Date() 
                        ? "text-emerald-600 dark:text-emerald-400" 
                        : "text-rose-600 dark:text-rose-400"
                    )}>
                      {extraction.detected_expiry ? formatDate(extraction.detected_expiry) : "Not detected"}
                    </p>
                  </div>

                  {/* Policy Number */}
                  {extraction.detected_policy_number && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Hash className="w-3 h-3" />
                        <span>Policy/License #</span>
                        <Badge variant="outline" className="ml-auto text-[10px] h-4 whitespace-nowrap">
                          {extraction.field_confidence.policy_number || 0}%
                        </Badge>
                      </div>
                      <p className="text-sm font-medium font-mono">
                        {extraction.detected_policy_number}
                      </p>
                    </div>
                  )}

                  {/* Coverage Amount */}
                  {extraction.detected_coverage && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <DollarSign className="w-3 h-3" />
                        <span>Coverage</span>
                        <Badge variant="outline" className="ml-auto text-[10px] h-4 whitespace-nowrap">
                          {extraction.field_confidence.coverage || 0}%
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">
                        {formatCurrency(extraction.detected_coverage)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Matched Vendor Comparison */}
                {document.matched_vendor && (
                  <div className="bg-muted/30 rounded-lg p-3 mt-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <User className="w-3 h-3" />
                      <span>Matched to Vendor Record</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">{document.matched_vendor.name}</span>
                      <span className="text-muted-foreground"> • {document.matched_vendor.trade}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      ABN: {document.matched_vendor.abn}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Issues Section */}
            {extraction?.issues && extraction.issues.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3 text-amber-500" />
                    Issues Detected
                  </h4>
                  <div className="space-y-2">
                    {extraction.issues.map((issue, idx) => (
                      <div 
                        key={idx}
                        className={cn(
                          "rounded-lg p-3 text-sm",
                          issue.severity === "high" && "bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800",
                          issue.severity === "medium" && "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800",
                          issue.severity === "low" && "bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800"
                        )}
                      >
                        <p className="font-medium">{issue.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <span className="font-medium">Suggested:</span> {issue.suggested_action}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Document Preview Modal */}
        <DocumentPreviewModal
          document={document}
          open={previewOpen}
          onOpenChange={setPreviewOpen}
        />
      </motion.div>
    </AnimatePresence>
  );
}

export default DocumentDetailPanel;
