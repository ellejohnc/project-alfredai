import { useState } from "react";
import { 
  IncomingDocument, 
  formatFileSize, 
  getDocumentTypeLabel,
  formatDate,
  formatCurrency
} from "./vendorComplianceData";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, 
  Building2, 
  Calendar, 
  Hash, 
  CheckCircle,
  CheckCircle2,
  User,
  FileText,
  HardHat,
  Zap,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentPreviewModalProps {
  document: IncomingDocument;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentPreviewModal({ document, open, onOpenChange }: DocumentPreviewModalProps) {
  const [downloadFeedback, setDownloadFeedback] = useState(false);
  const extraction = document.extraction_result;
  const docType = document.matched_document_type;

  const handleDownload = () => {
    setDownloadFeedback(true);
    setTimeout(() => setDownloadFeedback(false), 2000);
  };

  // Generate realistic certificate number
  const getCertificateNumber = () => {
    const prefix = docType?.includes("liability") ? "COC" : 
                   docType?.includes("workers") ? "WC" : 
                   docType?.includes("professional") ? "PI" : "CERT";
    return `${prefix}-2025-${Math.floor(100000 + Math.random() * 900000)}`;
  };

  // Get insurer name based on document type
  const getInsurerName = () => {
    const insurers = ["Allianz Australia", "QBE Insurance", "CGU Insurance", "Vero Insurance", "Zurich Australia"];
    return insurers[Math.floor(Math.random() * insurers.length)];
  };

  // Render Insurance Certificate
  const renderInsuranceCertificate = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Issued by</p>
            <p className="font-semibold">{getInsurerName()}</p>
          </div>
        </div>
        <div className="text-right">
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle className="w-3 h-3 mr-1" />
            Current
          </Badge>
        </div>
      </div>

      {/* Title */}
      <div className="text-center py-4 bg-muted/30 rounded-lg">
        <h3 className="text-lg font-bold uppercase tracking-wider">Certificate of Currency</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {docType ? getDocumentTypeLabel(docType) : "Public Liability Insurance"}
        </p>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase">Certificate No</p>
          <p className="font-mono text-sm font-medium">{getCertificateNumber()}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase">Policy Number</p>
          <p className="font-mono text-sm font-medium bg-amber-100/50 dark:bg-amber-900/20 px-2 py-0.5 rounded inline-block">
            {extraction?.detected_policy_number || "PLI-" + Math.random().toString(36).substring(2, 10).toUpperCase()}
          </p>
        </div>
      </div>

      <Separator />

      {/* Insured Party */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase">
          <Building2 className="w-3 h-3" />
          Insured Party
        </div>
        <div className="bg-muted/30 rounded-lg p-3">
          <p className="font-semibold bg-amber-100/50 dark:bg-amber-900/20 px-2 py-0.5 rounded inline-block">
            {extraction?.detected_vendor_name || document.matched_vendor?.name || "Unknown"}
          </p>
          {document.matched_vendor?.abn && (
            <p className="text-sm text-muted-foreground mt-1">
              ABN: {document.matched_vendor.abn}
            </p>
          )}
        </div>
      </div>

      {/* Coverage */}
      {extraction?.detected_coverage && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase">Coverage Limit</p>
          <p className="text-2xl font-bold text-primary bg-amber-100/50 dark:bg-amber-900/20 px-3 py-1 rounded inline-block">
            {formatCurrency(extraction.detected_coverage)}
          </p>
          <p className="text-xs text-muted-foreground">any one occurrence</p>
        </div>
      )}

      <Separator />

      {/* Period of Insurance */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase">
          <Calendar className="w-3 h-3" />
          Period of Insurance
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">From</p>
            <p className="font-medium">
              {extraction?.detected_expiry 
                ? formatDate(new Date(extraction.detected_expiry.getTime() - 365 * 24 * 60 * 60 * 1000))
                : formatDate(new Date())}
            </p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">To</p>
            <p className={cn(
              "font-medium bg-amber-100/50 dark:bg-amber-900/20 px-2 py-0.5 rounded inline-block",
              extraction?.detected_expiry && extraction.detected_expiry < new Date() && "text-rose-600"
            )}>
              {extraction?.detected_expiry ? formatDate(extraction.detected_expiry) : "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-lg">
        <CheckCircle className="w-4 h-4" />
        <span>This certificate confirms coverage is current as at the date of issue</span>
      </div>
    </div>
  );

  // Render License
  const renderLicense = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">NSW Fair Trading</p>
            <p className="font-semibold">Government of NSW</p>
          </div>
        </div>
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          <CheckCircle className="w-3 h-3 mr-1" />
          Current
        </Badge>
      </div>

      {/* Title */}
      <div className="text-center py-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
        <h3 className="text-lg font-bold uppercase tracking-wider">
          {docType?.includes("electrical") ? "Electrical Contractor" : "Plumbing Contractor"}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">License</p>
      </div>

      {/* License Number */}
      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground uppercase mb-1">License Number</p>
        <p className="text-2xl font-mono font-bold bg-amber-100/50 dark:bg-amber-900/20 px-4 py-2 rounded inline-block">
          {extraction?.detected_policy_number || `LIC-${docType?.includes("electrical") ? "EC" : "PL"}${Math.floor(10000 + Math.random() * 90000)}`}
        </p>
      </div>

      <Separator />

      {/* Holder Details */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase">
          <User className="w-3 h-3" />
          License Holder
        </div>
        <div className="bg-muted/30 rounded-lg p-4">
          <p className="font-semibold text-lg bg-amber-100/50 dark:bg-amber-900/20 px-2 py-0.5 rounded inline-block">
            {extraction?.detected_vendor_name || document.matched_vendor?.name || "Unknown"}
          </p>
          {document.matched_vendor?.trade && (
            <p className="text-sm text-muted-foreground mt-2">
              Trade: {document.matched_vendor.trade}
            </p>
          )}
          {document.matched_vendor?.abn && (
            <p className="text-sm text-muted-foreground">
              ABN: {document.matched_vendor.abn}
            </p>
          )}
        </div>
      </div>

      {/* Class */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground uppercase">License Class</p>
        <Badge variant="outline" className="text-sm py-1">
          {docType?.includes("electrical") ? "Electrical Contractor (Unrestricted)" : "Plumber, Drainer & Gasfitter"}
        </Badge>
      </div>

      {/* Expiry */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase">
          <Calendar className="w-3 h-3" />
          Expiry Date
        </div>
        <p className={cn(
          "text-lg font-semibold bg-amber-100/50 dark:bg-amber-900/20 px-3 py-1 rounded inline-block",
          extraction?.detected_expiry && extraction.detected_expiry < new Date() && "text-rose-600"
        )}>
          {extraction?.detected_expiry ? formatDate(extraction.detected_expiry) : "N/A"}
        </p>
      </div>
    </div>
  );

  // Render WHS Induction
  const renderWHSInduction = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-amber-500 text-white rounded-t-lg p-4 -mx-4 -mt-4">
        <div className="flex items-center gap-3">
          <HardHat className="w-8 h-8" />
          <div>
            <h3 className="font-bold uppercase tracking-wider">General Construction</h3>
            <p className="text-amber-100">Induction Card</p>
          </div>
        </div>
      </div>

      {/* Card Number */}
      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground uppercase mb-1">Card Number</p>
        <p className="text-xl font-mono font-bold bg-amber-100/50 dark:bg-amber-900/20 px-4 py-2 rounded inline-block">
          GIC-{new Date().getFullYear()}-{Math.floor(100000 + Math.random() * 900000)}
        </p>
      </div>

      <Separator />

      {/* Worker Details */}
      <div className="flex gap-4">
        <div className="w-24 h-28 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/20">
          <User className="w-10 h-10 text-muted-foreground/40" />
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase">Holder Name</p>
            <p className="font-semibold bg-amber-100/50 dark:bg-amber-900/20 px-2 py-0.5 rounded inline-block">
              {extraction?.detected_vendor_name || document.matched_vendor?.name || "Unknown"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase">Company</p>
            <p className="text-sm">{document.matched_vendor?.name || "Unknown Company"}</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-muted/30 rounded-lg p-3">
          <p className="text-xs text-muted-foreground uppercase">Completion Date</p>
          <p className="font-medium">
            {extraction?.detected_expiry 
              ? formatDate(new Date(extraction.detected_expiry.getTime() - 730 * 24 * 60 * 60 * 1000))
              : formatDate(new Date())}
          </p>
        </div>
        <div className="bg-muted/30 rounded-lg p-3">
          <p className="text-xs text-muted-foreground uppercase">Valid Until</p>
          <p className={cn(
            "font-medium bg-amber-100/50 dark:bg-amber-900/20 px-2 py-0.5 rounded inline-block",
            extraction?.detected_expiry && extraction.detected_expiry < new Date() && "text-rose-600"
          )}>
            {extraction?.detected_expiry ? formatDate(extraction.detected_expiry) : "N/A"}
          </p>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-lg">
        <CheckCircle className="w-4 h-4" />
        <span>Holder has completed the General Construction Induction training</span>
      </div>
    </div>
  );

  // Render SWMS
  const renderSWMS = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-rose-600 text-white rounded-t-lg p-4 -mx-4 -mt-4">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8" />
          <div>
            <h3 className="font-bold uppercase tracking-wider">Safe Work Method Statement</h3>
            <p className="text-rose-100">High Risk Construction Work</p>
          </div>
        </div>
      </div>

      {/* Document Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase">Document No</p>
          <p className="font-mono text-sm font-medium bg-amber-100/50 dark:bg-amber-900/20 px-2 py-0.5 rounded inline-block">
            SWMS-{new Date().getFullYear()}-{Math.floor(1000 + Math.random() * 9000)}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase">Revision</p>
          <p className="font-mono text-sm font-medium">Rev {Math.floor(1 + Math.random() * 5)}</p>
        </div>
      </div>

      <Separator />

      {/* Contractor */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground uppercase">Contractor</p>
        <div className="bg-muted/30 rounded-lg p-3">
          <p className="font-semibold bg-amber-100/50 dark:bg-amber-900/20 px-2 py-0.5 rounded inline-block">
            {extraction?.detected_vendor_name || document.matched_vendor?.name || "Unknown"}
          </p>
          {document.matched_vendor?.trade && (
            <p className="text-sm text-muted-foreground mt-1">
              Trade: {document.matched_vendor.trade}
            </p>
          )}
        </div>
      </div>

      {/* Work Activity */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground uppercase">Work Activity</p>
        <p className="text-sm">
          {document.matched_vendor?.trade 
            ? `${document.matched_vendor.trade} works including installation, maintenance, and repairs`
            : "General construction works"}
        </p>
      </div>

      {/* Hazards Identified */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground uppercase">Key Hazards Identified</p>
        <div className="flex flex-wrap gap-2">
          {["Working at Heights", "Electrical", "Manual Handling", "Confined Spaces"].map((hazard) => (
            <Badge key={hazard} variant="outline" className="bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800">
              {hazard}
            </Badge>
          ))}
        </div>
      </div>

      {/* Effective Date */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase">
          <Calendar className="w-3 h-3" />
          Effective Until
        </div>
        <p className={cn(
          "font-semibold bg-amber-100/50 dark:bg-amber-900/20 px-3 py-1 rounded inline-block",
          extraction?.detected_expiry && extraction.detected_expiry < new Date() && "text-rose-600"
        )}>
          {extraction?.detected_expiry ? formatDate(extraction.detected_expiry) : "N/A"}
        </p>
      </div>
    </div>
  );

  // Render generic document
  const renderGenericDocument = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
          <FileText className="w-6 h-6 text-muted-foreground" />
        </div>
        <div>
          <p className="font-semibold">{docType ? getDocumentTypeLabel(docType) : "Document"}</p>
          <p className="text-sm text-muted-foreground">Compliance Document</p>
        </div>
      </div>

      <div className="space-y-3">
        {extraction?.detected_vendor_name && (
          <div>
            <p className="text-xs text-muted-foreground uppercase">Vendor</p>
            <p className="font-medium bg-amber-100/50 dark:bg-amber-900/20 px-2 py-0.5 rounded inline-block">
              {extraction.detected_vendor_name}
            </p>
          </div>
        )}
        {extraction?.detected_policy_number && (
          <div>
            <p className="text-xs text-muted-foreground uppercase">Reference Number</p>
            <p className="font-mono bg-amber-100/50 dark:bg-amber-900/20 px-2 py-0.5 rounded inline-block">
              {extraction.detected_policy_number}
            </p>
          </div>
        )}
        {extraction?.detected_expiry && (
          <div>
            <p className="text-xs text-muted-foreground uppercase">Expiry Date</p>
            <p className={cn(
              "font-medium bg-amber-100/50 dark:bg-amber-900/20 px-2 py-0.5 rounded inline-block",
              extraction.detected_expiry < new Date() && "text-rose-600"
            )}>
              {formatDate(extraction.detected_expiry)}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // Determine which layout to render
  const renderDocumentContent = () => {
    if (!docType) return renderGenericDocument();
    
    if (docType.includes("liability") || docType.includes("workers") || docType.includes("professional") || docType.includes("insurance")) {
      return renderInsuranceCertificate();
    }
    if (docType.includes("electrical") || docType.includes("plumbing") || docType.includes("license")) {
      return renderLicense();
    }
    if (docType.includes("whs") || docType.includes("induction")) {
      return renderWHSInduction();
    }
    if (docType.includes("swms")) {
      return renderSWMS();
    }
    return renderGenericDocument();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="truncate pr-8" title={document.attachment_name}>
            {document.attachment_name}
          </DialogTitle>
          <DialogDescription>
            AI-extracted preview • {formatFileSize(document.file_size)} • {document.ai_confidence}% confidence
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 min-h-0 pr-4">
          <div className="bg-card rounded-lg border p-4 md:p-6">
            {renderDocumentContent()}
          </div>
        </ScrollArea>
        
        <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
          <p className="text-xs text-muted-foreground flex-1 text-center sm:text-left">
            <span className="inline-block w-3 h-3 bg-amber-100 dark:bg-amber-900/30 rounded mr-1 align-middle" />
            Highlighted fields extracted by AI
          </p>
          <div className="flex gap-2 relative">
            {downloadFeedback && (
              <div className="absolute -top-8 right-0 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-xs px-2 py-1 rounded flex items-center gap-1 animate-in fade-in slide-in-from-bottom-2">
                <CheckCircle2 className="w-3 h-3" />
                Demo only
              </div>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              className="min-h-[44px]"
              onClick={handleDownload}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button size="sm" className="min-h-[44px]" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DocumentPreviewModal;
