import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { 
  IncomingDocument, 
  formatFileSize, 
  getDocumentTypeLabel,
  formatDate 
} from "./vendorComplianceData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, 
  Mail, 
  Upload, 
  Zap, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Eye
} from "lucide-react";

interface DocumentQueueProps {
  documents: IncomingDocument[];
  selectedId: string | null;
  onSelect: (doc: IncomingDocument) => void;
}

type FilterType = "all" | "needs_review" | "verified" | "queued";

export function DocumentQueue({ documents, selectedId, onSelect }: DocumentQueueProps) {
  const [filter, setFilter] = useState<FilterType>("all");

  const getSourceIcon = (source: IncomingDocument["source"]) => {
    switch (source) {
      case "email": return <Mail className="w-3 h-3" />;
      case "portal_upload": return <Upload className="w-3 h-3" />;
      case "api": return <Zap className="w-3 h-3" />;
    }
  };

  const getStatusIcon = (status: IncomingDocument["status"]) => {
    switch (status) {
      case "verified": return <CheckCircle className="w-3 h-3 text-emerald-500" />;
      case "needs_review": return <Eye className="w-3 h-3 text-amber-500" />;
      case "queued": return <Clock className="w-3 h-3 text-muted-foreground" />;
      case "processing": return <Clock className="w-3 h-3 text-sky-500 animate-pulse" />;
      case "rejected": return <AlertTriangle className="w-3 h-3 text-rose-500" />;
    }
  };

  const getConfidenceBadgeClasses = (confidence: number) => {
    if (confidence >= 90) {
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
    }
    if (confidence >= 70) {
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800";
    }
    return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800";
  };

  const filteredDocs = useMemo(() => {
    let filtered = documents;
    
    if (filter === "needs_review") {
      filtered = documents.filter(d => d.status === "needs_review");
    } else if (filter === "verified") {
      filtered = documents.filter(d => d.status === "verified");
    } else if (filter === "queued") {
      filtered = documents.filter(d => d.status === "queued" || d.status === "processing");
    }
    
    // Sort: needs_review first, then by received date
    return filtered.sort((a, b) => {
      if (a.status === "needs_review" && b.status !== "needs_review") return -1;
      if (b.status === "needs_review" && a.status !== "needs_review") return 1;
      return b.received_at.getTime() - a.received_at.getTime();
    });
  }, [documents, filter]);

  const counts = useMemo(() => ({
    all: documents.length,
    needs_review: documents.filter(d => d.status === "needs_review").length,
    verified: documents.filter(d => d.status === "verified").length,
    queued: documents.filter(d => d.status === "queued" || d.status === "processing").length,
  }), [documents]);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return formatDate(date);
  };

  return (
    <div id="vc-document-queue" className="flex flex-col h-full bg-card rounded-lg border border-border">
      <div className="p-3 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Incoming Documents</h3>
          </div>
          <Badge variant="secondary" className="text-xs">
            {documents.length}
          </Badge>
        </div>
        
        {/* Quick filters - touch-friendly */}
        <div className="flex gap-1.5 mt-2 flex-wrap">
          <Button 
            size="sm" 
            variant={filter === "all" ? "default" : "ghost"}
            className="h-9 text-xs px-3 min-h-[36px]"
            onClick={() => setFilter("all")}
          >
            All ({counts.all})
          </Button>
          <Button 
            size="sm" 
            variant={filter === "needs_review" ? "default" : "ghost"}
            className="h-9 text-xs px-3 min-h-[36px]"
            onClick={() => setFilter("needs_review")}
          >
            Review ({counts.needs_review})
          </Button>
          <Button 
            size="sm" 
            variant={filter === "verified" ? "default" : "ghost"}
            className="h-9 text-xs px-3 min-h-[36px]"
            onClick={() => setFilter("verified")}
          >
            Verified ({counts.verified})
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredDocs.map((doc) => {
            const isSelected = doc.id === selectedId;
            const hasIssues = doc.extraction_result?.issues && doc.extraction_result.issues.length > 0;

            return (
              <button
                key={doc.id}
                onClick={() => onSelect(doc)}
                className={cn(
                  "w-full text-left p-4 rounded-lg transition-all duration-200 touch-manipulation",
                  "hover:bg-muted/50 border border-transparent min-h-[80px]",
                  isSelected && "bg-primary/10 dark:bg-primary/20 border-primary/40 shadow-sm",
                  !isSelected && "hover:border-border active:bg-muted/70"
                )}
              >
                <div className="flex flex-col gap-1.5 overflow-hidden">
                  {/* Row 1: Status icon + Vendor name */}
                  <div className="flex items-center gap-2 min-w-0">
                    {getStatusIcon(doc.status)}
                    <span className={cn(
                      "font-medium text-sm truncate",
                      isSelected ? "text-primary dark:text-primary-foreground" : "text-foreground"
                    )} title={doc.matched_vendor?.name}>
                      {doc.matched_vendor?.name || "Unknown Vendor"}
                    </span>
                  </div>
                  
                  {/* Row 2: Filename - full width, truncated */}
                  <div className={cn(
                    "text-xs truncate",
                    isSelected ? "text-primary/70 dark:text-primary-foreground/70" : "text-muted-foreground"
                  )} title={doc.attachment_name}>
                    {doc.attachment_name}
                  </div>
                  
                  {/* Row 3: Doc type badge + Confidence badge */}
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[10px] px-1.5 py-0 h-5 shrink-0",
                        doc.status === "needs_review" && "border-amber-500/50 text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30",
                        doc.status === "verified" && "border-emerald-500/50 text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30",
                        doc.status === "queued" && "border-slate-500/50 text-slate-700 bg-slate-50 dark:text-slate-400 dark:bg-slate-950/30",
                        doc.status === "processing" && "border-sky-500/50 text-sky-700 bg-sky-50 dark:text-sky-400 dark:bg-sky-950/30"
                      )}
                    >
                      {doc.matched_document_type ? getDocumentTypeLabel(doc.matched_document_type).split(" ")[0] : "Unknown"}
                    </Badge>
                    <Badge 
                      variant="outline"
                      className={cn(
                        "text-[10px] px-1.5 py-0 h-5 font-semibold border shrink-0",
                        getConfidenceBadgeClasses(doc.ai_confidence)
                      )}
                    >
                      {doc.ai_confidence}%
                    </Badge>
                  </div>
                  
                  {/* Row 4: Source icon + file size + time */}
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    {getSourceIcon(doc.source)}
                    <span className="text-[10px]">{formatFileSize(doc.file_size)}</span>
                    <span className="text-[10px]">•</span>
                    <span className="text-[10px]">{formatTime(doc.received_at)}</span>
                  </div>

                  {hasIssues && doc.status === "needs_review" && (
                    <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      <span className="text-[10px]">
                        {doc.extraction_result!.issues.length} issue{doc.extraction_result!.issues.length > 1 ? "s" : ""} detected
                      </span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
          
          {filteredDocs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No documents match this filter
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default DocumentQueue;
